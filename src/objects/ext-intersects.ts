import * as Phaser from 'phaser';
declare type integer = number;

import {ExtPoint} from "./ext-point";
import {ExtPolygon} from "./ext-polygon";

export class ExtIntersects {

    static PointToPolygon(p: Phaser.Geom.Point, poly: ExtPolygon): boolean {
        // @ts-ignore
        return Phaser.Geom.Polygon.Contains(poly, p.x, p.y);
    }

}