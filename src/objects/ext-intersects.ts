import * as Phaser from "phaser";

declare type integer = number;

import type { ExtPolygon } from "./ext-polygon";

export class ExtIntersects {
	static PointToPolygon(p: Phaser.Geom.Point, poly: ExtPolygon): boolean {
		// @ts-expect-error
		return Phaser.Geom.Polygon.Contains(poly, p.x, p.y);
	}
}
