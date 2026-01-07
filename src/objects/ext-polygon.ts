import * as Phaser from "phaser";

declare type integer = number;

import Polygon = Phaser.Geom.Polygon;
import Line = Phaser.Geom.Line;
import Point = Phaser.Geom.Point;

import type { ExtPoint } from "./ext-point";

import Rectangle = Phaser.Geom.Rectangle;

import type { FilledPolygons } from "./filled-polygons";

/**
 * Point with additional helper methods. Decorates existing Phaser Point class.
 */
export class ExtPolygon {
	percentArea: number;
	percentAreaString: string;
	polygon: Polygon;
	lines: Line[] = [];

	constructor(points: Point[], frameArea: number) {
		this.polygon = this.createPolygon(points);
		this.lines = this.createLines(points);
		this.calculateAndSetPercentArea(this.polygon, frameArea);
	}

	createPolygon(points: Point[]): Polygon {
		return new Polygon(points);
	}

	createLines(points: Point[]): Line[] {
		const lines: Line[] = [];

		for (let i = 0; i < points.length - 1; i++) {
			lines.push(
				new Line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y),
			);
		}

		lines.push(
			new Line(
				points[points.length - 1].x,
				points[points.length - 1].y,
				points[0].x,
				points[0].y,
			),
		);

		return lines;
	}

	calculateAndSetPercentArea(_polygon: Polygon, frameArea: number): void {
		this.percentArea = (Math.abs(this.polygon.area) / frameArea) * 100;
		this.percentAreaString = this.percentArea.toFixed(1);
	}

	draw(_filledPolygons: FilledPolygons) {
		// The image overlay handles the fill, Phaser only draws the outline
		// Outline is now handled by ImageOverlay too, so this is just for line collision detection
	}

	outlineIntersects(point: ExtPoint): boolean {
		for (let i = 0; i < this.lines.length; i++) {
			if (
				Phaser.Geom.Intersects.PointToLineSegment(point.point, this.lines[i])
			) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Reference for algorithm: https://www.geeksforgeeks.org/how-to-check-if-a-given-point-lies-inside-a-polygon/
	 *
	 * @param {ExtPoint} point
	 * @returns {boolean}
	 */
	innerIntersects(point: ExtPoint): boolean {
		if (this.outlineIntersects(point)) {
			return false;
		}

		if (this.horizontalLineSameXValue(point)) {
			return false;
		}

		const mostRightPointXValue = this.getMostRightPointXValue();

		if (point.x() >= mostRightPointXValue) {
			return false;
		}

		const numIntersections = this.getNumberOfIntersections(
			new Line(point.x(), point.y(), mostRightPointXValue, point.y()),
		);

		return numIntersections % 2 === 1;
	}

	getNumberOfIntersections(line: Line): integer {
		return this.lines.reduce((previousValue, currentLine) => {
			return (
				previousValue +
				(Phaser.Geom.Intersects.LineToLine(currentLine, line) ? 1 : 0)
			);
		}, 0);
	}

	// createLineToRightEdge(startingPoint: ExtPoint) {
	// }

	getMostRightPointXValue(): integer {
		return this.lines.reduce((previousValue, currentLine) => {
			return Math.max(previousValue, currentLine.x1, currentLine.x2);
		}, 0);
	}

	horizontalLineSameXValue(point: ExtPoint): boolean {
		const y = point.y();

		const horizontalLines: Line[] = this.lines.filter((line) => {
			return line.y1 === line.y2;
		});

		return horizontalLines.some((line) => {
			return line.y1 === y;
		});
	}

	toRectangles(): Rectangle[] {
		const rects: Rectangle[] = [];

		return rects;
	}
}
