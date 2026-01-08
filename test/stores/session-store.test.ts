/**
 * Tests for Session Store
 */

// Mock config BEFORE importing session store
jest.mock("../../src/config", () => ({
	logger: {
		log: jest.fn(),
		error: jest.fn(),
		warn: jest.fn(),
	},
}));

// Mock LeaderboardService
jest.mock("../../src/services/leaderboard-service", () => ({
	LeaderboardService: {
		startSession: jest.fn(),
		submitScore: jest.fn(),
		endSession: jest.fn(),
	},
}));

import { sessionStore } from "../../src/stores/session-store";
import { LeaderboardService } from "../../src/services/leaderboard-service";

describe("SessionStore", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Reset session store state by ending any active session
		if (sessionStore.hasActiveSession()) {
			// Force reset by accessing private field (for testing only)
			(sessionStore as any).session = null;
		}
	});

	describe("getInstance", () => {
		it("should return singleton instance", () => {
			const instance1 = sessionStore;
			const instance2 = sessionStore;
			expect(instance1).toBe(instance2);
		});
	});

	describe("startSession", () => {
		it("should start a new session with server session ID", async () => {
			(LeaderboardService.startSession as jest.Mock).mockResolvedValue(
				"server-session-123",
			);

			const sessionId = await sessionStore.startSession();

			expect(sessionId).toBe("server-session-123");
			expect(sessionStore.hasActiveSession()).toBe(true);
			expect(sessionStore.getSessionId()).toBe("server-session-123");
		});

		it("should start session with gameId", async () => {
			(LeaderboardService.startSession as jest.Mock).mockResolvedValue(
				"game-session",
			);

			await sessionStore.startSession("game123");

			expect(LeaderboardService.startSession).toHaveBeenCalledWith("game123");
		});

		it("should create fallback session on server error", async () => {
			(LeaderboardService.startSession as jest.Mock).mockRejectedValue(
				new Error("Server unavailable"),
			);

			const sessionId = await sessionStore.startSession();

			expect(sessionId).toMatch(/^local-/);
			expect(sessionStore.hasActiveSession()).toBe(true);
		});

		it("should initialize session data correctly", async () => {
			(LeaderboardService.startSession as jest.Mock).mockResolvedValue(
				"session-123",
			);

			await sessionStore.startSession();

			expect(sessionStore.getCurrentStreak()).toBe(0);
			expect(sessionStore.getTotalScore()).toBe(0);
			expect(sessionStore.getLevelsCompleted()).toBe(0);
			expect(sessionStore.getCurrentLevelNumber()).toBe(1);
		});
	});

	describe("startLevel", () => {
		beforeEach(async () => {
			(LeaderboardService.startSession as jest.Mock).mockResolvedValue(
				"session-123",
			);
			await sessionStore.startSession();
		});

		it("should start tracking a new level", () => {
			sessionStore.startLevel(1);

			expect(sessionStore.getCurrentLevel()).not.toBeNull();
			expect(sessionStore.getCurrentLevel()?.level).toBe(1);
		});

		it("should initialize level data correctly", () => {
			sessionStore.startLevel(5, 25, "Pikachu");

			const levelData = sessionStore.getCurrentLevel();
			expect(levelData?.level).toBe(5);
			expect(levelData?.territoryPercentage).toBe(0);
			expect(levelData?.livesRemaining).toBe(3);
			expect(levelData?.deathCount).toBe(0);
			expect(levelData?.quizAttempts).toBe(0);
			expect(levelData?.pokemonId).toBe(25);
			expect(levelData?.pokemonName).toBe("Pikachu");
		});

		it("should not start level without active session", () => {
			(sessionStore as any).session = null;

			sessionStore.startLevel(1);

			expect(sessionStore.getCurrentLevel()).toBeNull();
		});
	});

	describe("updateTerritory", () => {
		beforeEach(async () => {
			(LeaderboardService.startSession as jest.Mock).mockResolvedValue(
				"session-123",
			);
			await sessionStore.startSession();
			sessionStore.startLevel(1);
		});

		it("should update territory percentage", () => {
			sessionStore.updateTerritory(0.75);

			expect(sessionStore.getCurrentLevel()?.territoryPercentage).toBe(0.75);
		});

		it("should handle multiple updates", () => {
			sessionStore.updateTerritory(0.25);
			sessionStore.updateTerritory(0.50);
			sessionStore.updateTerritory(0.75);

			expect(sessionStore.getCurrentLevel()?.territoryPercentage).toBe(0.75);
		});
	});

	describe("recordDeath", () => {
		beforeEach(async () => {
			(LeaderboardService.startSession as jest.Mock).mockResolvedValue(
				"session-123",
			);
			await sessionStore.startSession();
			sessionStore.startLevel(1);
		});

		it("should increment death count and decrement lives", () => {
			sessionStore.recordDeath();

			expect(sessionStore.getCurrentLevel()?.deathCount).toBe(1);
			expect(sessionStore.getCurrentLevel()?.livesRemaining).toBe(2);
		});

		it("should reset streak on death", () => {
			// Set up a streak
			(sessionStore as any).session.currentStreak = 5;

			sessionStore.recordDeath();

			expect(sessionStore.getCurrentStreak()).toBe(0);
		});

		it("should track multiple deaths", () => {
			sessionStore.recordDeath();
			sessionStore.recordDeath();

			expect(sessionStore.getCurrentLevel()?.deathCount).toBe(2);
			expect(sessionStore.getCurrentLevel()?.livesRemaining).toBe(1);
		});
	});

	describe("updateLives", () => {
		beforeEach(async () => {
			(LeaderboardService.startSession as jest.Mock).mockResolvedValue(
				"session-123",
			);
			await sessionStore.startSession();
			sessionStore.startLevel(1);
		});

		it("should update lives remaining", () => {
			sessionStore.updateLives(2);

			expect(sessionStore.getCurrentLevel()?.livesRemaining).toBe(2);
		});

		it("should track death when lives decrease", () => {
			sessionStore.updateLives(2);

			expect(sessionStore.getCurrentLevel()?.deathCount).toBe(1);
		});

		it("should reset streak when lives decrease", () => {
			(sessionStore as any).session.currentStreak = 3;

			sessionStore.updateLives(2);

			expect(sessionStore.getCurrentStreak()).toBe(0);
		});

		it("should not track death when lives stay same or increase", () => {
			sessionStore.updateLives(3);
			sessionStore.updateLives(4); // Extra life power-up

			expect(sessionStore.getCurrentLevel()?.deathCount).toBe(0);
		});
	});

	describe("recordQuizAttempt", () => {
		beforeEach(async () => {
			(LeaderboardService.startSession as jest.Mock).mockResolvedValue(
				"session-123",
			);
			await sessionStore.startSession();
			sessionStore.startLevel(1);
		});

		it("should increment quiz attempts", () => {
			sessionStore.recordQuizAttempt();

			expect(sessionStore.getCurrentLevel()?.quizAttempts).toBe(1);
		});

		it("should track multiple attempts", () => {
			sessionStore.recordQuizAttempt();
			sessionStore.recordQuizAttempt();
			sessionStore.recordQuizAttempt();

			expect(sessionStore.getCurrentLevel()?.quizAttempts).toBe(3);
		});
	});

	describe("completeLevel", () => {
		beforeEach(async () => {
			(LeaderboardService.startSession as jest.Mock).mockResolvedValue(
				"session-123",
			);
			await sessionStore.startSession();
		});

		it("should return null if no active level", async () => {
			const result = await sessionStore.completeLevel();

			expect(result).toBeNull();
		});

		it("should submit score and return result", async () => {
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
					previousRank: 0,
					rankChange: 100,
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

			(LeaderboardService.submitScore as jest.Mock).mockResolvedValue(
				mockResult,
			);

			sessionStore.startLevel(1, 25, "Pikachu");
			sessionStore.updateTerritory(75); // 75%
			sessionStore.recordQuizAttempt();

			const result = await sessionStore.completeLevel();

			expect(result).toEqual(mockResult);
			expect(sessionStore.getTotalScore()).toBe(2100);
			expect(sessionStore.getCurrentStreak()).toBe(1);
			expect(sessionStore.getLevelsCompleted()).toBe(1);
		});

		it("should increment streak if no deaths", async () => {
			const mockResult = {
				breakdown: { totalScore: 1000 },
				session: { sessionScore: 1000, currentStreak: 1 },
			};

			(LeaderboardService.submitScore as jest.Mock).mockResolvedValue(
				mockResult,
			);

			sessionStore.startLevel(1);
			sessionStore.updateTerritory(0.5);
			sessionStore.recordQuizAttempt();

			// Complete without deaths
			await sessionStore.completeLevel();

			// Streak should be from server response
			expect(sessionStore.getCurrentStreak()).toBe(1);
		});

		it("should handle submission failure gracefully", async () => {
			(LeaderboardService.submitScore as jest.Mock).mockRejectedValue(
				new Error("Network error"),
			);

			sessionStore.startLevel(1);
			sessionStore.updateTerritory(0.5);

			const result = await sessionStore.completeLevel();

			expect(result).toBeNull();
			// Level should still be tracked locally
			expect(sessionStore.getLevelsCompleted()).toBe(1);
		});

		it("should convert territory percentage from 0-100 to 0-1", async () => {
			(LeaderboardService.submitScore as jest.Mock).mockResolvedValue({
				breakdown: { totalScore: 1000 },
				session: { sessionScore: 1000, currentStreak: 1 },
			});

			sessionStore.startLevel(1);
			sessionStore.updateTerritory(75); // 75%

			await sessionStore.completeLevel();

			expect(LeaderboardService.submitScore).toHaveBeenCalledWith(
				expect.objectContaining({
					territoryPercentage: 0.75,
				}),
			);
		});
	});

	describe("endSession", () => {
		beforeEach(async () => {
			(LeaderboardService.startSession as jest.Mock).mockResolvedValue(
				"session-123",
			);
			await sessionStore.startSession();
		});

		it("should return null if no active session", async () => {
			(sessionStore as any).session = null;

			const result = await sessionStore.endSession();

			expect(result).toBeNull();
		});

		it("should end session and return session data", async () => {
			(LeaderboardService.endSession as jest.Mock).mockResolvedValue({});

			const result = await sessionStore.endSession();

			expect(result).not.toBeNull();
			expect(result?.sessionId).toBe("session-123");
			expect(sessionStore.hasActiveSession()).toBe(false);
		});

		it("should handle server error gracefully", async () => {
			(LeaderboardService.endSession as jest.Mock).mockRejectedValue(
				new Error("Server error"),
			);

			const result = await sessionStore.endSession();

			// Should still end locally
			expect(result).not.toBeNull();
			expect(sessionStore.hasActiveSession()).toBe(false);
		});
	});

	describe("getters", () => {
		beforeEach(async () => {
			(LeaderboardService.startSession as jest.Mock).mockResolvedValue(
				"session-123",
			);
			await sessionStore.startSession();
		});

		it("getSession should return session data", () => {
			const session = sessionStore.getSession();

			expect(session).not.toBeNull();
			expect(session?.sessionId).toBe("session-123");
		});

		it("getCurrentLevel should return null when no level started", () => {
			expect(sessionStore.getCurrentLevel()).toBeNull();
		});

		it("getCurrentLevel should return level data when started", () => {
			sessionStore.startLevel(3);

			expect(sessionStore.getCurrentLevel()?.level).toBe(3);
		});

		it("hasActiveSession should return correct state", () => {
			expect(sessionStore.hasActiveSession()).toBe(true);

			(sessionStore as any).session = null;

			expect(sessionStore.hasActiveSession()).toBe(false);
		});

		it("getSessionId should return null when no session", () => {
			(sessionStore as any).session = null;

			expect(sessionStore.getSessionId()).toBeNull();
		});

		it("getCurrentStreak should return 0 when no session", () => {
			(sessionStore as any).session = null;

			expect(sessionStore.getCurrentStreak()).toBe(0);
		});

		it("getTotalScore should return 0 when no session", () => {
			(sessionStore as any).session = null;

			expect(sessionStore.getTotalScore()).toBe(0);
		});

		it("getLevelsCompleted should return 0 when no session", () => {
			(sessionStore as any).session = null;

			expect(sessionStore.getLevelsCompleted()).toBe(0);
		});

		it("getCurrentLevelNumber should return 1 when no session", () => {
			(sessionStore as any).session = null;

			expect(sessionStore.getCurrentLevelNumber()).toBe(1);
		});
	});
});
