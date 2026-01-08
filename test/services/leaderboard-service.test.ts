/**
 * Tests for Leaderboard Service
 */
import { LeaderboardService } from "../../src/services/leaderboard-service";
import * as AuthService from "../../src/services/auth-service";

// Mock config
jest.mock("../../src/config", () => ({
	config: {
		apiUrl: "http://localhost:3000",
	},
}));

// Mock auth service
jest.mock("../../src/services/auth-service", () => ({
	getToken: jest.fn(),
}));

describe("LeaderboardService", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(AuthService.getToken as jest.Mock).mockReturnValue("test-token");
		global.fetch = jest.fn();
	});

	describe("getGlobalLeaderboard", () => {
		it("should fetch global leaderboard with default params", async () => {
			const mockData = {
				leaderboard: [{ rank: 1, displayName: "Player1", totalScore: 1000 }],
				pagination: { total: 100, limit: 10, offset: 0, hasMore: true },
				period: "all_time",
				periodStart: "2024-01-01",
				periodEnd: "2025-01-01",
				lastUpdated: "2025-01-08",
			};

			(global.fetch as jest.Mock).mockResolvedValue({
				json: () => Promise.resolve({ success: true, data: mockData }),
			});

			const result = await LeaderboardService.getGlobalLeaderboard();

			expect(result).toEqual(mockData);
			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:3000/leaderboard/global?",
				expect.objectContaining({
					headers: { Authorization: "Bearer test-token" },
				}),
			);
		});

		it("should include query parameters", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				json: () =>
					Promise.resolve({
						success: true,
						data: { leaderboard: [] },
					}),
			});

			await LeaderboardService.getGlobalLeaderboard({
				period: "weekly",
				limit: 20,
				offset: 10,
				sortBy: "level",
			});

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("period=weekly"),
				expect.any(Object),
			);
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("limit=20"),
				expect.any(Object),
			);
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("offset=10"),
				expect.any(Object),
			);
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("sortBy=level"),
				expect.any(Object),
			);
		});

		it("should throw on failure", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				json: () =>
					Promise.resolve({
						success: false,
						error: { message: "Server error" },
					}),
			});

			await expect(LeaderboardService.getGlobalLeaderboard()).rejects.toThrow(
				"Server error",
			);
		});

		it("should use default error message if none provided", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				json: () => Promise.resolve({ success: false }),
			});

			await expect(LeaderboardService.getGlobalLeaderboard()).rejects.toThrow(
				"Failed to fetch leaderboard",
			);
		});
	});

	describe("getAroundMe", () => {
		it("should fetch leaderboard around player", async () => {
			const mockData = {
				player: { rank: 50, totalScore: 5000, percentile: 50 },
				above: [{ rank: 49, displayName: "Above" }],
				below: [{ rank: 51, displayName: "Below" }],
				period: "all_time",
			};

			(global.fetch as jest.Mock).mockResolvedValue({
				json: () => Promise.resolve({ success: true, data: mockData }),
			});

			const result = await LeaderboardService.getAroundMe();

			expect(result).toEqual(mockData);
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/around-me"),
				expect.any(Object),
			);
		});

		it("should include period and range params", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				json: () =>
					Promise.resolve({
						success: true,
						data: { player: {}, above: [], below: [], period: "daily" },
					}),
			});

			await LeaderboardService.getAroundMe({ period: "daily", range: 5 });

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("period=daily"),
				expect.any(Object),
			);
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("range=5"),
				expect.any(Object),
			);
		});

		it("should throw on failure", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				json: () => Promise.resolve({ success: false }),
			});

			await expect(LeaderboardService.getAroundMe()).rejects.toThrow(
				"Failed to fetch around me",
			);
		});
	});

	describe("getLevelLeaderboard", () => {
		it("should fetch level-specific leaderboard", async () => {
			const mockData = {
				level: 5,
				leaderboard: [{ rank: 1, displayName: "TopPlayer" }],
				pagination: { total: 50, limit: 10, offset: 0, hasMore: true },
			};

			(global.fetch as jest.Mock).mockResolvedValue({
				json: () => Promise.resolve({ success: true, data: mockData }),
			});

			const result = await LeaderboardService.getLevelLeaderboard(5);

			expect(result).toEqual(mockData);
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/level/5"),
				expect.any(Object),
			);
		});

		it("should include pagination params", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				json: () =>
					Promise.resolve({
						success: true,
						data: { level: 1, leaderboard: [], pagination: {} },
					}),
			});

			await LeaderboardService.getLevelLeaderboard(1, { limit: 5, offset: 10 });

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("limit=5"),
				expect.any(Object),
			);
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("offset=10"),
				expect.any(Object),
			);
		});

		it("should throw on failure", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				json: () => Promise.resolve({ success: false }),
			});

			await expect(LeaderboardService.getLevelLeaderboard(1)).rejects.toThrow(
				"Failed to fetch level leaderboard",
			);
		});
	});

	describe("getGameLeaderboard", () => {
		it("should fetch game-specific leaderboard", async () => {
			const mockData = {
				game: {
					id: "game123",
					name: "Test Game",
					creatorName: "Creator",
					levelCount: 10,
					playCount: 100,
				},
				leaderboard: [],
				pagination: { total: 0, limit: 10, offset: 0, hasMore: false },
			};

			(global.fetch as jest.Mock).mockResolvedValue({
				json: () => Promise.resolve({ success: true, data: mockData }),
			});

			const result = await LeaderboardService.getGameLeaderboard("game123");

			expect(result).toEqual(mockData);
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/game/game123"),
				expect.any(Object),
			);
		});

		it("should throw on failure", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				json: () => Promise.resolve({ success: false }),
			});

			await expect(
				LeaderboardService.getGameLeaderboard("game123"),
			).rejects.toThrow("Failed to fetch game leaderboard");
		});
	});

	describe("submitScore", () => {
		it("should submit score successfully", async () => {
			const mockResult = {
				scoreId: "score123",
				breakdown: {
					territoryScore: 750,
					timeBonus: 100,
					lifeBonus: 400,
					quizBonus: 500,
					subtotal: 1750,
					levelMultiplier: 1.2,
					levelScore: 2100,
					streakBonus: 0,
					totalScore: 2100,
				},
				session: {
					sessionScore: 2100,
					levelsCompleted: 1,
					currentStreak: 1,
				},
				rankings: {
					globalRank: 100,
					previousRank: 150,
					rankChange: 50,
					isNewPersonalBest: true,
					isNewLevelBest: true,
				},
				achievements: { unlocked: [] },
				pokemon: {
					pokemonId: 25,
					pokemonName: "Pikachu",
					isNewReveal: true,
					collectionCount: 1,
					collectionTotal: 151,
				},
			};

			(global.fetch as jest.Mock).mockResolvedValue({
				json: () => Promise.resolve({ success: true, data: mockResult }),
			});

			const result = await LeaderboardService.submitScore({
				sessionId: "session123",
				level: 1,
				territoryPercentage: 0.75,
				timeTakenSeconds: 100,
				livesRemaining: 2,
				quizAttempts: 1,
			});

			expect(result).toEqual(mockResult);
			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:3000/leaderboard/scores",
				expect.objectContaining({
					method: "POST",
					headers: expect.objectContaining({
						"Content-Type": "application/json",
						Authorization: "Bearer test-token",
					}),
				}),
			);
		});

		it("should include optional gameId and pokemon data", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				json: () =>
					Promise.resolve({
						success: true,
						data: { scoreId: "123", breakdown: {} },
					}),
			});

			await LeaderboardService.submitScore({
				gameId: "game123",
				sessionId: "session123",
				level: 1,
				territoryPercentage: 0.5,
				timeTakenSeconds: 60,
				livesRemaining: 3,
				quizAttempts: 1,
				pokemonId: 1,
				pokemonName: "Bulbasaur",
			});

			const callArgs = (fetch as jest.Mock).mock.calls[0];
			const body = JSON.parse(callArgs[1].body);

			expect(body.gameId).toBe("game123");
			expect(body.pokemonId).toBe(1);
			expect(body.pokemonName).toBe("Bulbasaur");
		});

		it("should throw on failure", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				json: () => Promise.resolve({ success: false }),
			});

			await expect(
				LeaderboardService.submitScore({
					sessionId: "session123",
					level: 1,
					territoryPercentage: 0.5,
					timeTakenSeconds: 60,
					livesRemaining: 3,
					quizAttempts: 1,
				}),
			).rejects.toThrow("Failed to submit score");
		});
	});

	describe("startSession", () => {
		it("should start a new session", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				json: () =>
					Promise.resolve({
						success: true,
						data: { sessionId: "new-session-123" },
					}),
			});

			const result = await LeaderboardService.startSession();

			expect(result).toBe("new-session-123");
			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:3000/leaderboard/sessions",
				expect.objectContaining({
					method: "POST",
				}),
			);
		});

		it("should include gameId if provided", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				json: () =>
					Promise.resolve({
						success: true,
						data: { sessionId: "session-123" },
					}),
			});

			await LeaderboardService.startSession("game456");

			const callArgs = (fetch as jest.Mock).mock.calls[0];
			const body = JSON.parse(callArgs[1].body);

			expect(body.gameId).toBe("game456");
		});

		it("should throw on failure", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				json: () => Promise.resolve({ success: false }),
			});

			await expect(LeaderboardService.startSession()).rejects.toThrow(
				"Failed to start session",
			);
		});
	});

	describe("endSession", () => {
		it("should end session and return summary", async () => {
			const mockData = {
				sessionId: "session123",
				totalScore: 10000,
				levelsCompleted: 5,
				highestLevel: 5,
				maxStreak: 3,
			};

			(global.fetch as jest.Mock).mockResolvedValue({
				json: () => Promise.resolve({ success: true, data: mockData }),
			});

			const result = await LeaderboardService.endSession("session123");

			expect(result).toEqual(mockData);
			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:3000/leaderboard/sessions/session123/end",
				expect.objectContaining({
					method: "POST",
				}),
			);
		});

		it("should throw on failure", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				json: () => Promise.resolve({ success: false }),
			});

			await expect(LeaderboardService.endSession("session123")).rejects.toThrow(
				"Failed to end session",
			);
		});
	});
});
