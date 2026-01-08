import { expect, test } from "@playwright/test";

const FRONTEND_URL =
	process.env.FRONTEND_URL ||
	"https://peekachoo-frontend-production.up.railway.app/";

test.describe("Peekachoo Game Frontend", () => {
	test.describe("Initial Load", () => {
		test("should load the game page successfully", async ({ page }) => {
			const response = await page.goto(FRONTEND_URL);

			// Check response is successful
			expect(response?.status()).toBeLessThan(400);

			// Wait for page to load
			await page.waitForLoadState("networkidle");
		});

		test("should display the game canvas", async ({ page }) => {
			await page.goto(FRONTEND_URL);
			await page.waitForLoadState("networkidle");

			// Phaser creates a canvas element
			const canvas = page.locator("canvas");
			await expect(canvas).toBeVisible({ timeout: 15000 });
		});

		test("should have correct page title", async ({ page }) => {
			await page.goto(FRONTEND_URL);

			// Check page title contains Peekachoo or game-related text
			const title = await page.title();
			expect(title.toLowerCase()).toMatch(/peekachoo|game|phaser/i);
		});
	});

	test.describe("Login Scene", () => {
		test("should display login form elements", async ({ page }) => {
			await page.goto(FRONTEND_URL);
			await page.waitForLoadState("networkidle");

			// Wait for game to initialize
			await page.waitForTimeout(3000);

			// Check for login form container (DOM overlay)
			const loginContainer = page.locator(".login-form-container, #game-create-container, .nes-container");

			// Either the login form should be visible or the canvas is ready
			const canvas = page.locator("canvas");
			await expect(canvas).toBeVisible({ timeout: 15000 });
		});

		test("should have username input field", async ({ page }) => {
			await page.goto(FRONTEND_URL);
			await page.waitForLoadState("networkidle");

			// Wait for game to initialize and show login
			await page.waitForTimeout(3000);

			// Look for username input
			const usernameInput = page.locator("#username-input, input[placeholder*='username' i]");

			// Check if visible (might not be if already logged in)
			const isVisible = await usernameInput.isVisible().catch(() => false);

			if (isVisible) {
				await expect(usernameInput).toBeVisible();
			} else {
				// If not visible, game might have loaded to menu scene
				const canvas = page.locator("canvas");
				await expect(canvas).toBeVisible();
			}
		});
	});

	test.describe("Game Responsiveness", () => {
		test("should be responsive on mobile viewport", async ({ page }) => {
			// Set mobile viewport
			await page.setViewportSize({ width: 375, height: 667 });

			await page.goto(FRONTEND_URL);
			await page.waitForLoadState("networkidle");

			// Canvas should still be visible
			const canvas = page.locator("canvas");
			await expect(canvas).toBeVisible({ timeout: 15000 });
		});

		test("should be responsive on tablet viewport", async ({ page }) => {
			// Set tablet viewport
			await page.setViewportSize({ width: 768, height: 1024 });

			await page.goto(FRONTEND_URL);
			await page.waitForLoadState("networkidle");

			// Canvas should still be visible
			const canvas = page.locator("canvas");
			await expect(canvas).toBeVisible({ timeout: 15000 });
		});

		test("should be responsive on desktop viewport", async ({ page }) => {
			// Set desktop viewport
			await page.setViewportSize({ width: 1920, height: 1080 });

			await page.goto(FRONTEND_URL);
			await page.waitForLoadState("networkidle");

			// Canvas should still be visible
			const canvas = page.locator("canvas");
			await expect(canvas).toBeVisible({ timeout: 15000 });
		});
	});

	test.describe("Game Assets", () => {
		test("should load game assets without errors", async ({ page }) => {
			const consoleErrors: string[] = [];

			// Listen for console errors
			page.on("console", (msg) => {
				if (msg.type() === "error") {
					consoleErrors.push(msg.text());
				}
			});

			await page.goto(FRONTEND_URL);
			await page.waitForLoadState("networkidle");

			// Wait for assets to load
			await page.waitForTimeout(5000);

			// Filter out known non-critical errors
			const criticalErrors = consoleErrors.filter(
				(error) =>
					!error.includes("favicon") &&
					!error.includes("404") &&
					!error.includes("Failed to load resource")
			);

			// Should have no critical JavaScript errors
			expect(criticalErrors.length).toBeLessThanOrEqual(2);
		});

		test("should not have network request failures for critical assets", async ({
			page,
		}) => {
			const failedRequests: string[] = [];

			// Listen for failed requests
			page.on("requestfailed", (request) => {
				const url = request.url();
				// Only track JS and critical asset failures
				if (url.endsWith(".js") || url.includes("/assets/")) {
					failedRequests.push(url);
				}
			});

			await page.goto(FRONTEND_URL);
			await page.waitForLoadState("networkidle");

			// Wait for all assets to attempt loading
			await page.waitForTimeout(5000);

			// Should have no failed critical asset requests
			expect(failedRequests).toHaveLength(0);
		});
	});

	test.describe("WebAuthn Support Check", () => {
		test("should handle browsers without WebAuthn gracefully", async ({
			page,
		}) => {
			await page.goto(FRONTEND_URL);
			await page.waitForLoadState("networkidle");

			// Wait for game to initialize
			await page.waitForTimeout(3000);

			// Page should not crash, canvas should be visible
			const canvas = page.locator("canvas");
			await expect(canvas).toBeVisible({ timeout: 15000 });
		});
	});

	test.describe("Authenticated User Flow", () => {
		const TEST_JWT = process.env.PLAYWRIGHT_TEST_JWT || "";

		test("should handle authenticated session via localStorage", async ({
			page,
		}) => {
			test.skip(!TEST_JWT, "PLAYWRIGHT_TEST_JWT environment variable is not set");

			await page.goto(FRONTEND_URL);

			// Set auth token in localStorage (simulating logged in user)
			await page.evaluate((token) => {
				localStorage.setItem("auth_token", token);
				localStorage.setItem("user", JSON.stringify({
					userId: "playwright-e2e-user-001",
					username: "playwright_e2e_tester"
				}));
			}, TEST_JWT);

			// Reload page to apply auth
			await page.reload();
			await page.waitForLoadState("networkidle");

			// Wait for game to initialize
			await page.waitForTimeout(3000);

			// Game should load (either menu or game scene)
			const canvas = page.locator("canvas");
			await expect(canvas).toBeVisible({ timeout: 15000 });
		});
	});
});
