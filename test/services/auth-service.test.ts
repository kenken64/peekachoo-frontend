/**
 * Tests for Auth Service
 */
import * as AuthService from "../../src/services/auth-service";

// Mock config
jest.mock("../../src/config", () => ({
	config: {
		apiUrl: "http://localhost:3000",
	},
	logger: {
		log: jest.fn(),
		error: jest.fn(),
		warn: jest.fn(),
	},
}));

describe("AuthService", () => {
	let mockSessionStorage: { [key: string]: string };

	beforeEach(() => {
		// Reset sessionStorage mock
		mockSessionStorage = {};

		Object.defineProperty(global, "sessionStorage", {
			value: {
				getItem: jest.fn((key: string) => mockSessionStorage[key] || null),
				setItem: jest.fn((key: string, value: string) => {
					mockSessionStorage[key] = value;
				}),
				removeItem: jest.fn((key: string) => {
					delete mockSessionStorage[key];
				}),
				clear: jest.fn(() => {
					mockSessionStorage = {};
				}),
			},
			writable: true,
		});

		// Reset fetch mock
		global.fetch = jest.fn();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("Token Management", () => {
		describe("setToken", () => {
			it("should store token in sessionStorage", () => {
				AuthService.setToken("test-token-123");

				expect(sessionStorage.setItem).toHaveBeenCalledWith(
					"peekachoo_token",
					"test-token-123",
				);
			});
		});

		describe("getToken", () => {
			it("should retrieve token from sessionStorage", () => {
				mockSessionStorage.peekachoo_token = "stored-token";

				const token = AuthService.getToken();

				expect(token).toBe("stored-token");
			});

			it("should return null if no token", () => {
				const token = AuthService.getToken();

				expect(token).toBeNull();
			});
		});

		describe("removeToken", () => {
			it("should remove token from sessionStorage", () => {
				mockSessionStorage.peekachoo_token = "token-to-remove";

				AuthService.removeToken();

				expect(sessionStorage.removeItem).toHaveBeenCalledWith("peekachoo_token");
			});
		});
	});

	describe("User Management", () => {
		describe("setUser", () => {
			it("should store user as JSON in sessionStorage", () => {
				const user = { id: "1", username: "testuser", displayName: "Test User" };

				AuthService.setUser(user);

				expect(sessionStorage.setItem).toHaveBeenCalledWith(
					"peekachoo_user",
					JSON.stringify(user),
				);
			});
		});

		describe("getUser", () => {
			it("should retrieve and parse user from sessionStorage", () => {
				const user = { id: "1", username: "testuser", displayName: "Test User" };
				mockSessionStorage.peekachoo_user = JSON.stringify(user);

				const result = AuthService.getUser();

				expect(result).toEqual(user);
			});

			it("should return null if no user stored", () => {
				const result = AuthService.getUser();

				expect(result).toBeNull();
			});
		});

		describe("removeUser", () => {
			it("should remove user from sessionStorage", () => {
				AuthService.removeUser();

				expect(sessionStorage.removeItem).toHaveBeenCalledWith("peekachoo_user");
			});
		});
	});

	describe("isLoggedIn", () => {
		it("should return true if token exists", () => {
			mockSessionStorage.peekachoo_token = "valid-token";

			expect(AuthService.isLoggedIn()).toBe(true);
		});

		it("should return false if no token", () => {
			expect(AuthService.isLoggedIn()).toBe(false);
		});

		it("should return false if token is empty string", () => {
			mockSessionStorage.peekachoo_token = "";

			expect(AuthService.isLoggedIn()).toBe(false);
		});
	});

	describe("logout", () => {
		it("should remove both token and user", () => {
			mockSessionStorage.peekachoo_token = "token";
			mockSessionStorage.peekachoo_user = JSON.stringify({ id: "1" });

			AuthService.logout();

			expect(sessionStorage.removeItem).toHaveBeenCalledWith("peekachoo_token");
			expect(sessionStorage.removeItem).toHaveBeenCalledWith("peekachoo_user");
		});
	});

	describe("checkUsername", () => {
		it("should return true if username exists", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				json: () => Promise.resolve({ exists: true }),
			});

			const result = await AuthService.checkUsername("existinguser");

			expect(result).toBe(true);
			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:3000/auth/check-username/existinguser",
			);
		});

		it("should return false if username does not exist", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				json: () => Promise.resolve({ exists: false }),
			});

			const result = await AuthService.checkUsername("newuser");

			expect(result).toBe(false);
		});

		it("should encode special characters in username", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				json: () => Promise.resolve({ exists: false }),
			});

			await AuthService.checkUsername("user@test");

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:3000/auth/check-username/user%40test",
			);
		});
	});

	describe("isWebAuthnSupported", () => {
		it("should return true if PublicKeyCredential exists", () => {
			Object.defineProperty(global, "window", {
				value: {
					PublicKeyCredential: function () {},
				},
				writable: true,
			});

			expect(AuthService.isWebAuthnSupported()).toBe(true);
		});

		it("should return false if PublicKeyCredential is undefined", () => {
			Object.defineProperty(global, "window", {
				value: {
					PublicKeyCredential: undefined,
				},
				writable: true,
			});

			expect(AuthService.isWebAuthnSupported()).toBe(false);
		});
	});

	describe("getCurrentUser", () => {
		it("should return null if no token", async () => {
			const result = await AuthService.getCurrentUser();

			expect(result).toBeNull();
			expect(fetch).not.toHaveBeenCalled();
		});

		it("should fetch and return user if token exists", async () => {
			mockSessionStorage.peekachoo_token = "valid-token";
			const user = { id: "1", username: "testuser", displayName: "Test" };

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(user),
			});

			const result = await AuthService.getCurrentUser();

			expect(result).toEqual(user);
			expect(fetch).toHaveBeenCalledWith("http://localhost:3000/auth/me", {
				headers: { Authorization: "Bearer valid-token" },
			});
		});

		it("should logout and return null if token is invalid", async () => {
			mockSessionStorage.peekachoo_token = "invalid-token";

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
			});

			const result = await AuthService.getCurrentUser();

			expect(result).toBeNull();
			expect(sessionStorage.removeItem).toHaveBeenCalledWith("peekachoo_token");
		});

		it("should return null on network error", async () => {
			mockSessionStorage.peekachoo_token = "token";

			(global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

			const result = await AuthService.getCurrentUser();

			expect(result).toBeNull();
		});
	});

	describe("purchaseShield", () => {
		it("should throw if not authenticated", async () => {
			await expect(AuthService.purchaseShield(1)).rejects.toThrow(
				"Not authenticated",
			);
		});

		it("should purchase shields and update user", async () => {
			mockSessionStorage.peekachoo_token = "token";
			mockSessionStorage.peekachoo_user = JSON.stringify({
				id: "1",
				username: "test",
				displayName: "Test",
				shields: 0,
			});

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ success: true, shields: 5 }),
			});

			const result = await AuthService.purchaseShield(5);

			expect(result).toEqual({ success: true, shields: 5 });
			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:3000/auth/purchase-shield",
				expect.objectContaining({
					method: "POST",
					headers: expect.objectContaining({
						Authorization: "Bearer token",
					}),
				}),
			);
		});

		it("should throw if purchase fails", async () => {
			mockSessionStorage.peekachoo_token = "token";

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
			});

			await expect(AuthService.purchaseShield(1)).rejects.toThrow(
				"Purchase failed",
			);
		});
	});

	describe("consumeShield", () => {
		it("should throw if not authenticated", async () => {
			await expect(AuthService.consumeShield()).rejects.toThrow(
				"Not authenticated",
			);
		});

		it("should consume shield and update user", async () => {
			mockSessionStorage.peekachoo_token = "token";
			mockSessionStorage.peekachoo_user = JSON.stringify({
				id: "1",
				username: "test",
				displayName: "Test",
				shields: 5,
			});

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ success: true, shields: 4 }),
			});

			const result = await AuthService.consumeShield();

			expect(result).toEqual({ success: true, shields: 4 });
		});

		it("should throw if consume fails", async () => {
			mockSessionStorage.peekachoo_token = "token";

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
			});

			await expect(AuthService.consumeShield()).rejects.toThrow(
				"Failed to consume shield",
			);
		});
	});

	describe("createRazorpayOrder", () => {
		it("should throw if not authenticated", async () => {
			await expect(AuthService.createRazorpayOrder(1)).rejects.toThrow(
				"Not authenticated",
			);
		});

		it("should create order successfully", async () => {
			mockSessionStorage.peekachoo_token = "token";
			const orderData = { orderId: "order_123", amount: 100 };

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(orderData),
			});

			const result = await AuthService.createRazorpayOrder(1);

			expect(result).toEqual(orderData);
			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:3000/payment/create-order",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({ quantity: 1 }),
				}),
			);
		});

		it("should throw if order creation fails", async () => {
			mockSessionStorage.peekachoo_token = "token";

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
			});

			await expect(AuthService.createRazorpayOrder(1)).rejects.toThrow(
				"Failed to create order",
			);
		});
	});

	describe("verifyRazorpayPayment", () => {
		it("should throw if not authenticated", async () => {
			await expect(
				AuthService.verifyRazorpayPayment({ paymentId: "123" }),
			).rejects.toThrow("Not authenticated");
		});

		it("should verify payment and update shields", async () => {
			mockSessionStorage.peekachoo_token = "token";
			mockSessionStorage.peekachoo_user = JSON.stringify({
				id: "1",
				username: "test",
				displayName: "Test",
				shields: 0,
			});

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ success: true, shields: 10 }),
			});

			const result = await AuthService.verifyRazorpayPayment({
				paymentId: "pay_123",
			});

			expect(result).toEqual({ success: true, shields: 10 });
		});

		it("should throw if verification fails", async () => {
			mockSessionStorage.peekachoo_token = "token";

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
			});

			await expect(
				AuthService.verifyRazorpayPayment({ paymentId: "123" }),
			).rejects.toThrow("Payment verification failed");
		});
	});

	describe("checkPurchaseStatus", () => {
		it("should throw if not authenticated", async () => {
			await expect(AuthService.checkPurchaseStatus()).rejects.toThrow(
				"Not authenticated",
			);
		});

		it("should return purchase status", async () => {
			mockSessionStorage.peekachoo_token = "token";
			const status = {
				canPurchase: true,
				monthlySpent: 100,
				remainingAllowance: 400,
				purchaseResetDate: "2025-02-01",
			};

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(status),
			});

			const result = await AuthService.checkPurchaseStatus();

			expect(result).toEqual(status);
		});

		it("should throw if status check fails", async () => {
			mockSessionStorage.peekachoo_token = "token";

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
			});

			await expect(AuthService.checkPurchaseStatus()).rejects.toThrow(
				"Failed to check purchase status",
			);
		});
	});
});
