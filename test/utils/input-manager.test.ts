/**
 * Tests for InputManager
 */
import { InputManager } from "../../src/utils/input-manager";

describe("InputManager", () => {
	describe("isMobile", () => {
		let originalInnerWidth: number;
		let originalOntouchstart: any;
		let originalMaxTouchPoints: number;

		beforeEach(() => {
			// Save original values
			originalInnerWidth = window.innerWidth;
			originalOntouchstart = (window as any).ontouchstart;
			originalMaxTouchPoints = navigator.maxTouchPoints;

			// Reset to desktop defaults
			Object.defineProperty(window, "innerWidth", {
				value: 1024,
				writable: true,
				configurable: true,
			});
			delete (window as any).ontouchstart;
			Object.defineProperty(navigator, "maxTouchPoints", {
				value: 0,
				writable: true,
				configurable: true,
			});
		});

		afterEach(() => {
			// Restore original values
			Object.defineProperty(window, "innerWidth", {
				value: originalInnerWidth,
				writable: true,
				configurable: true,
			});
			if (originalOntouchstart !== undefined) {
				(window as any).ontouchstart = originalOntouchstart;
			}
			Object.defineProperty(navigator, "maxTouchPoints", {
				value: originalMaxTouchPoints,
				writable: true,
				configurable: true,
			});
		});

		it("should return true for narrow screen (< 768px)", () => {
			Object.defineProperty(window, "innerWidth", {
				value: 400,
				writable: true,
				configurable: true,
			});

			expect(InputManager.isMobile()).toBe(true);
		});

		it("should return false for wide screen (>= 768px) with no touch", () => {
			Object.defineProperty(window, "innerWidth", {
				value: 1024,
				writable: true,
				configurable: true,
			});
			delete (window as any).ontouchstart;
			Object.defineProperty(navigator, "maxTouchPoints", {
				value: 0,
				writable: true,
				configurable: true,
			});

			expect(InputManager.isMobile()).toBe(false);
		});

		it("should return true if ontouchstart is defined", () => {
			(window as any).ontouchstart = () => {};

			expect(InputManager.isMobile()).toBe(true);
		});

		it("should return true if maxTouchPoints > 0", () => {
			Object.defineProperty(navigator, "maxTouchPoints", {
				value: 5,
				writable: true,
				configurable: true,
			});

			expect(InputManager.isMobile()).toBe(true);
		});

		it("should return true at exactly 767px width", () => {
			Object.defineProperty(window, "innerWidth", {
				value: 767,
				writable: true,
				configurable: true,
			});

			expect(InputManager.isMobile()).toBe(true);
		});

		it("should return false at exactly 768px width with no touch support", () => {
			Object.defineProperty(window, "innerWidth", {
				value: 768,
				writable: true,
				configurable: true,
			});
			delete (window as any).ontouchstart;
			Object.defineProperty(navigator, "maxTouchPoints", {
				value: 0,
				writable: true,
				configurable: true,
			});

			expect(InputManager.isMobile()).toBe(false);
		});
	});

	describe("combine", () => {
		const createMockKeyboard = (states: {
			left?: boolean;
			right?: boolean;
			up?: boolean;
			down?: boolean;
		}): CursorKeys => ({
			left: { isDown: states.left || false } as any,
			right: { isDown: states.right || false } as any,
			up: { isDown: states.up || false } as any,
			down: { isDown: states.down || false } as any,
			space: { isDown: false } as any,
			shift: { isDown: false } as any,
		});

		const createMockVirtual = (states: {
			left?: boolean;
			right?: boolean;
			up?: boolean;
			down?: boolean;
		}) => ({
			left: { isDown: states.left || false },
			right: { isDown: states.right || false },
			up: { isDown: states.up || false },
			down: { isDown: states.down || false },
		});

		it("should return keyboard input if no virtual input provided", () => {
			const keyboard = createMockKeyboard({ left: true });

			const result = InputManager.combine(keyboard);

			expect(result).toBe(keyboard);
		});

		it("should return keyboard input if virtual is undefined", () => {
			const keyboard = createMockKeyboard({ right: true });

			const result = InputManager.combine(keyboard, undefined);

			expect(result).toBe(keyboard);
		});

		it("should combine keyboard and virtual - both false", () => {
			const keyboard = createMockKeyboard({});
			const virtual = createMockVirtual({});

			const result = InputManager.combine(keyboard, virtual);

			expect(result.left.isDown).toBe(false);
			expect(result.right.isDown).toBe(false);
			expect(result.up.isDown).toBe(false);
			expect(result.down.isDown).toBe(false);
		});

		it("should combine keyboard and virtual - keyboard only", () => {
			const keyboard = createMockKeyboard({
				left: true,
				up: true,
			});
			const virtual = createMockVirtual({});

			const result = InputManager.combine(keyboard, virtual);

			expect(result.left.isDown).toBe(true);
			expect(result.right.isDown).toBe(false);
			expect(result.up.isDown).toBe(true);
			expect(result.down.isDown).toBe(false);
		});

		it("should combine keyboard and virtual - virtual only", () => {
			const keyboard = createMockKeyboard({});
			const virtual = createMockVirtual({
				right: true,
				down: true,
			});

			const result = InputManager.combine(keyboard, virtual);

			expect(result.left.isDown).toBe(false);
			expect(result.right.isDown).toBe(true);
			expect(result.up.isDown).toBe(false);
			expect(result.down.isDown).toBe(true);
		});

		it("should combine keyboard and virtual - OR logic", () => {
			const keyboard = createMockKeyboard({
				left: true,
				up: false,
			});
			const virtual = createMockVirtual({
				left: false,
				up: true,
			});

			const result = InputManager.combine(keyboard, virtual);

			expect(result.left.isDown).toBe(true);
			expect(result.up.isDown).toBe(true);
		});

		it("should combine keyboard and virtual - both pressed", () => {
			const keyboard = createMockKeyboard({
				left: true,
				right: true,
				up: true,
				down: true,
			});
			const virtual = createMockVirtual({
				left: true,
				right: true,
				up: true,
				down: true,
			});

			const result = InputManager.combine(keyboard, virtual);

			expect(result.left.isDown).toBe(true);
			expect(result.right.isDown).toBe(true);
			expect(result.up.isDown).toBe(true);
			expect(result.down.isDown).toBe(true);
		});

		it("should preserve other keyboard properties", () => {
			const keyboard = createMockKeyboard({ left: true });
			const virtual = createMockVirtual({});

			const result = InputManager.combine(keyboard, virtual);

			expect(result.space).toBeDefined();
			expect(result.shift).toBeDefined();
		});
	});
});
