/**
 * Tests for GeomUtils
 */
import * as Phaser from "phaser";
import { GeomUtils } from "../../src/utils/geom-utils";

// Mock ExtPoint
class MockExtPoint {
	private _x: number;
	private _y: number;

	constructor(point: { x: number; y: number }) {
		this._x = point.x;
		this._y = point.y;
	}

	x(): number {
		return this._x;
	}

	y(): number {
		return this._y;
	}

	equals(other: MockExtPoint): boolean {
		return this._x === other.x() && this._y === other.y();
	}
}

// Mock the ExtPoint module
jest.mock("../../src/objects/ext-point", () => ({
	ExtPoint: MockExtPoint,
}));

describe("GeomUtils", () => {
	describe("calculateSlope", () => {
		it("should calculate positive slope", () => {
			const line = new Phaser.Geom.Line(0, 0, 2, 4);
			expect(GeomUtils.calculateSlope(line)).toBe(2);
		});

		it("should calculate negative slope", () => {
			const line = new Phaser.Geom.Line(0, 4, 2, 0);
			expect(GeomUtils.calculateSlope(line)).toBe(-2);
		});

		it("should return 0 for horizontal line", () => {
			const line = new Phaser.Geom.Line(0, 5, 10, 5);
			expect(GeomUtils.calculateSlope(line)).toBe(0);
		});

		it("should return Infinity for vertical line", () => {
			const line = new Phaser.Geom.Line(5, 0, 5, 10);
			expect(GeomUtils.calculateSlope(line)).toBe(Infinity);
		});
	});

	describe("calculateYIntercept", () => {
		it("should calculate y-intercept for positive slope", () => {
			// Line y = 2x + 3: starts at (0, 3) and goes through (1, 5)
			const line = new Phaser.Geom.Line(0, 3, 1, 5);
			expect(GeomUtils.calculateYIntercept(line)).toBe(3);
		});

		it("should calculate y-intercept for negative slope", () => {
			// Line y = -x + 5: starts at (0, 5) and goes through (5, 0)
			const line = new Phaser.Geom.Line(0, 5, 5, 0);
			expect(GeomUtils.calculateYIntercept(line)).toBe(5);
		});

		it("should return y value for horizontal line", () => {
			const line = new Phaser.Geom.Line(0, 7, 10, 7);
			expect(GeomUtils.calculateYIntercept(line)).toBe(7);
		});
	});

	describe("linesAreEqual", () => {
		it("should return true for identical lines", () => {
			const line1 = new Phaser.Geom.Line(0, 0, 10, 10);
			const line2 = new Phaser.Geom.Line(0, 0, 10, 10);
			expect(GeomUtils.linesAreEqual(line1, line2)).toBe(true);
		});

		it("should return false for different lines", () => {
			const line1 = new Phaser.Geom.Line(0, 0, 10, 10);
			const line2 = new Phaser.Geom.Line(0, 0, 10, 5);
			expect(GeomUtils.linesAreEqual(line1, line2)).toBe(false);
		});

		it("should return false for reversed lines", () => {
			const line1 = new Phaser.Geom.Line(0, 0, 10, 10);
			const line2 = new Phaser.Geom.Line(10, 10, 0, 0);
			expect(GeomUtils.linesAreEqual(line1, line2)).toBe(false);
		});
	});

	describe("lineContainsLine", () => {
		describe("vertical lines", () => {
			it("should return true when line1 contains line2", () => {
				const line1 = new Phaser.Geom.Line(5, 0, 5, 20);
				const line2 = new Phaser.Geom.Line(5, 5, 5, 15);
				expect(GeomUtils.lineContainsLine(line1, line2)).toBe(true);
			});

			it("should return false when lines are on different x", () => {
				const line1 = new Phaser.Geom.Line(5, 0, 5, 20);
				const line2 = new Phaser.Geom.Line(10, 5, 10, 15);
				expect(GeomUtils.lineContainsLine(line1, line2)).toBe(false);
			});
		});

		describe("horizontal lines", () => {
			it("should return true when line1 contains line2", () => {
				const line1 = new Phaser.Geom.Line(0, 5, 20, 5);
				const line2 = new Phaser.Geom.Line(5, 5, 15, 5);
				expect(GeomUtils.lineContainsLine(line1, line2)).toBe(true);
			});

			it("should return false when lines are on different y", () => {
				const line1 = new Phaser.Geom.Line(0, 5, 20, 5);
				const line2 = new Phaser.Geom.Line(5, 10, 15, 10);
				expect(GeomUtils.lineContainsLine(line1, line2)).toBe(false);
			});
		});

		it("should return false for lines with different slopes", () => {
			const line1 = new Phaser.Geom.Line(0, 0, 10, 10);
			const line2 = new Phaser.Geom.Line(0, 0, 10, 5);
			expect(GeomUtils.lineContainsLine(line1, line2)).toBe(false);
		});
	});

	describe("lContainsLine", () => {
		it("should return true for vertical line containing another", () => {
			const line1 = new Phaser.Geom.Line(5, 0, 5, 20);
			const line2 = new Phaser.Geom.Line(5, 5, 5, 15);
			expect(GeomUtils.lContainsLine(line1, line2)).toBe(true);
		});

		it("should return true for horizontal line containing another", () => {
			const line1 = new Phaser.Geom.Line(0, 5, 20, 5);
			const line2 = new Phaser.Geom.Line(5, 5, 15, 5);
			expect(GeomUtils.lContainsLine(line1, line2)).toBe(true);
		});

		it("should return false for non-axis-aligned lines", () => {
			const line1 = new Phaser.Geom.Line(0, 0, 10, 10);
			const line2 = new Phaser.Geom.Line(2, 2, 8, 8);
			expect(GeomUtils.lContainsLine(line1, line2)).toBe(false);
		});
	});

	describe("lineContainsLineAndNotEqual", () => {
		it("should return true when line1 contains but not equals line2", () => {
			const line1 = new Phaser.Geom.Line(5, 0, 5, 20);
			const line2 = new Phaser.Geom.Line(5, 5, 5, 15);
			expect(GeomUtils.lineContainsLineAndNotEqual(line1, line2)).toBe(true);
		});

		it("should return false when lines are equal", () => {
			const line1 = new Phaser.Geom.Line(5, 0, 5, 20);
			const line2 = new Phaser.Geom.Line(5, 0, 5, 20);
			expect(GeomUtils.lineContainsLineAndNotEqual(line1, line2)).toBe(false);
		});
	});

	describe("lineContainsAnyLine", () => {
		it("should return true if line contains any line in array", () => {
			const mainLine = new Phaser.Geom.Line(5, 0, 5, 20);
			const lines = [
				new Phaser.Geom.Line(10, 0, 10, 10),
				new Phaser.Geom.Line(5, 5, 5, 15),
			];
			expect(GeomUtils.lineContainsAnyLine(mainLine, lines)).toBe(true);
		});

		it("should return false if line contains no line in array", () => {
			const mainLine = new Phaser.Geom.Line(5, 0, 5, 20);
			const lines = [
				new Phaser.Geom.Line(10, 0, 10, 10),
				new Phaser.Geom.Line(15, 5, 15, 15),
			];
			expect(GeomUtils.lineContainsAnyLine(mainLine, lines)).toBe(false);
		});
	});

	describe("collisionLineSegments", () => {
		it("should return true for equal lines", () => {
			const line1 = new Phaser.Geom.Line(0, 0, 10, 10);
			const line2 = new Phaser.Geom.Line(0, 0, 10, 10);
			expect(GeomUtils.collisionLineSegments(line1, line2)).toBe(true);
		});

		it("should return true for intersecting lines", () => {
			const line1 = new Phaser.Geom.Line(0, 0, 10, 10);
			const line2 = new Phaser.Geom.Line(0, 10, 10, 0);
			expect(GeomUtils.collisionLineSegments(line1, line2)).toBe(true);
		});

		it("should return false for parallel non-overlapping lines", () => {
			const line1 = new Phaser.Geom.Line(0, 0, 10, 0);
			const line2 = new Phaser.Geom.Line(0, 5, 10, 5);
			expect(GeomUtils.collisionLineSegments(line1, line2)).toBe(false);
		});

		it("should return true for overlapping collinear lines", () => {
			const line1 = new Phaser.Geom.Line(0, 0, 10, 0);
			const line2 = new Phaser.Geom.Line(5, 0, 15, 0);
			expect(GeomUtils.collisionLineSegments(line1, line2)).toBe(true);
		});

		it("should handle vertical lines collision", () => {
			const line1 = new Phaser.Geom.Line(5, 0, 5, 10);
			const line2 = new Phaser.Geom.Line(5, 5, 5, 15);
			expect(GeomUtils.collisionLineSegments(line1, line2)).toBe(true);
		});

		it("should return false for non-overlapping vertical lines", () => {
			const line1 = new Phaser.Geom.Line(5, 0, 5, 10);
			const line2 = new Phaser.Geom.Line(10, 0, 10, 10);
			expect(GeomUtils.collisionLineSegments(line1, line2)).toBe(false);
		});
	});

	describe("collisionLineSegmentArrays", () => {
		it("should return true if any lines collide", () => {
			const lines1 = [
				new Phaser.Geom.Line(0, 0, 10, 0),
				new Phaser.Geom.Line(0, 0, 0, 10),
			];
			const lines2 = [
				new Phaser.Geom.Line(5, -5, 5, 5),
			];
			expect(GeomUtils.collisionLineSegmentArrays(lines1, lines2)).toBe(true);
		});

		it("should return false if no lines collide", () => {
			const lines1 = [
				new Phaser.Geom.Line(0, 0, 10, 0),
			];
			const lines2 = [
				new Phaser.Geom.Line(0, 10, 10, 10),
			];
			expect(GeomUtils.collisionLineSegmentArrays(lines1, lines2)).toBe(false);
		});
	});

	describe("degressToRadians", () => {
		it("should convert 0 degrees to 0 radians", () => {
			expect(GeomUtils.degressToRadians(0)).toBe(0);
		});

		it("should convert 180 degrees to PI radians", () => {
			expect(GeomUtils.degressToRadians(180)).toBeCloseTo(Math.PI);
		});

		it("should convert 90 degrees to PI/2 radians", () => {
			expect(GeomUtils.degressToRadians(90)).toBeCloseTo(Math.PI / 2);
		});

		it("should convert 360 degrees to 2*PI radians", () => {
			expect(GeomUtils.degressToRadians(360)).toBeCloseTo(2 * Math.PI);
		});
	});

	describe("lineToString", () => {
		it("should format line as comma-separated string", () => {
			const line = new Phaser.Geom.Line(1, 2, 3, 4);
			expect(GeomUtils.lineToString(line)).toBe("1,2,3,4");
		});

		it("should handle negative coordinates", () => {
			const line = new Phaser.Geom.Line(-1, -2, 3, 4);
			expect(GeomUtils.lineToString(line)).toBe("-1,-2,3,4");
		});
	});

	describe("reverseLines", () => {
		it("should reverse the direction and order of lines", () => {
			const lines = [
				new Phaser.Geom.Line(0, 0, 10, 0),
				new Phaser.Geom.Line(10, 0, 10, 10),
			];
			const reversed = GeomUtils.reverseLines(lines);

			expect(reversed).toHaveLength(2);
			// First line should be last line reversed
			expect(reversed[0].x1).toBe(10);
			expect(reversed[0].y1).toBe(10);
			expect(reversed[0].x2).toBe(10);
			expect(reversed[0].y2).toBe(0);
			// Second line should be first line reversed
			expect(reversed[1].x1).toBe(10);
			expect(reversed[1].y1).toBe(0);
			expect(reversed[1].x2).toBe(0);
			expect(reversed[1].y2).toBe(0);
		});
	});

	describe("subtractLinesWhereLine1ContainsLine2", () => {
		describe("vertical lines", () => {
			it("should subtract from start", () => {
				const line1 = new Phaser.Geom.Line(5, 0, 5, 20);
				const line2 = new Phaser.Geom.Line(5, 0, 5, 10);
				const result = GeomUtils.subtractLinesWhereLine1ContainsLine2(line1, line2);

				expect(result).toHaveLength(1);
				expect(result[0].x1).toBe(5);
				expect(result[0].y1).toBe(10);
				expect(result[0].x2).toBe(5);
				expect(result[0].y2).toBe(20);
			});

			it("should subtract from end", () => {
				const line1 = new Phaser.Geom.Line(5, 0, 5, 20);
				const line2 = new Phaser.Geom.Line(5, 10, 5, 20);
				const result = GeomUtils.subtractLinesWhereLine1ContainsLine2(line1, line2);

				expect(result).toHaveLength(1);
				expect(result[0].x1).toBe(5);
				expect(result[0].y1).toBe(0);
				expect(result[0].x2).toBe(5);
				expect(result[0].y2).toBe(10);
			});

			it("should subtract from middle", () => {
				const line1 = new Phaser.Geom.Line(5, 0, 5, 20);
				const line2 = new Phaser.Geom.Line(5, 5, 5, 15);
				const result = GeomUtils.subtractLinesWhereLine1ContainsLine2(line1, line2);

				expect(result).toHaveLength(2);
			});

			it("should return empty for equal lines", () => {
				const line1 = new Phaser.Geom.Line(5, 0, 5, 20);
				const line2 = new Phaser.Geom.Line(5, 0, 5, 20);
				const result = GeomUtils.subtractLinesWhereLine1ContainsLine2(line1, line2);

				expect(result).toHaveLength(0);
			});
		});

		describe("horizontal lines", () => {
			it("should subtract from start", () => {
				const line1 = new Phaser.Geom.Line(0, 5, 20, 5);
				const line2 = new Phaser.Geom.Line(0, 5, 10, 5);
				const result = GeomUtils.subtractLinesWhereLine1ContainsLine2(line1, line2);

				expect(result).toHaveLength(1);
				expect(result[0].x1).toBe(10);
				expect(result[0].y1).toBe(5);
				expect(result[0].x2).toBe(20);
				expect(result[0].y2).toBe(5);
			});
		});

		it("should throw for diagonal lines", () => {
			const line1 = new Phaser.Geom.Line(0, 0, 10, 10);
			const line2 = new Phaser.Geom.Line(2, 2, 8, 8);

			expect(() => {
				GeomUtils.subtractLinesWhereLine1ContainsLine2(line1, line2);
			}).toThrow("Only supports vertical or horizontal lines.");
		});
	});

	describe("calculatePointFromOrigin", () => {
		it("should calculate point at 0 degrees", () => {
			const origin = new Phaser.Geom.Point(0, 0);
			const result = GeomUtils.calculatePointFromOrigin(origin, 0, 10);

			expect(result.x).toBeCloseTo(10);
			expect(result.y).toBeCloseTo(0);
		});

		it("should calculate point at 90 degrees", () => {
			const origin = new Phaser.Geom.Point(0, 0);
			const result = GeomUtils.calculatePointFromOrigin(origin, 90, 10);

			expect(result.x).toBeCloseTo(0);
			expect(result.y).toBeCloseTo(10);
		});

		it("should calculate point at 180 degrees", () => {
			const origin = new Phaser.Geom.Point(0, 0);
			const result = GeomUtils.calculatePointFromOrigin(origin, 180, 10);

			expect(result.x).toBeCloseTo(-10);
			expect(result.y).toBeCloseTo(0);
		});

		it("should handle non-zero origin", () => {
			const origin = new Phaser.Geom.Point(5, 5);
			const result = GeomUtils.calculatePointFromOrigin(origin, 0, 10);

			expect(result.x).toBeCloseTo(15);
			expect(result.y).toBeCloseTo(5);
		});
	});

	describe("isClockwiseLines", () => {
		it("should return true for clockwise lines", () => {
			const lines = [
				new Phaser.Geom.Line(0, 0, 10, 0),
				new Phaser.Geom.Line(10, 0, 10, 10),
				new Phaser.Geom.Line(10, 10, 0, 10),
				new Phaser.Geom.Line(0, 10, 0, 0),
			];
			expect(GeomUtils.isClockwiseLines(lines)).toBe(true);
		});

		it("should return false for counter-clockwise lines", () => {
			const lines = [
				new Phaser.Geom.Line(0, 0, 0, 10),
				new Phaser.Geom.Line(0, 10, 10, 10),
				new Phaser.Geom.Line(10, 10, 10, 0),
				new Phaser.Geom.Line(10, 0, 0, 0),
			];
			expect(GeomUtils.isClockwiseLines(lines)).toBe(false);
		});
	});
});
