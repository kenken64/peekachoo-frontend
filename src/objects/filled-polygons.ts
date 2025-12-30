import * as Phaser from 'phaser';
declare type integer = number;

import Graphics = Phaser.GameObjects.Graphics;
import Point = Phaser.Geom.Point;
import {ExtPoint} from "./ext-point";
import {ExtPolygon} from "./ext-polygon";
import QixScene from "../scenes/qix-scene";
import {Grid} from "./grid";
import {ExtRectangle} from "./ext-rectangle";
import {ImageOverlay} from "./image-overlay";

export class FilledPolygons {
    static LINE_COLOR: integer = 0x0000;
    static FILL_COLOR: integer = 0xCCAAFF;

    scene: QixScene;
    polygons: ExtPolygon[] = [];
    graphics: Graphics;
    imageOverlay: ImageOverlay;

    constructor(scene: QixScene) {
        this.scene = scene;

        this.graphics = scene.add.graphics();
        this.graphics.lineStyle(1, FilledPolygons.LINE_COLOR);
        // No fill needed - the image overlay handles the fill

        // Get the singleton image overlay and reset it for this new game/level
        this.imageOverlay = ImageOverlay.getInstance();
        this.imageOverlay.reset();
    }

    grid(): Grid { return this.scene.grid; }
    frame(): ExtRectangle { return this.scene.grid.frame; }
    frameArea(): number { return this.scene.grid.frameArea; }

    percentArea(): number {
        return this.polygons.reduce((total, currentPolygon) => {
            return total + currentPolygon.percentArea;
        }, 0);
    }

    percentAreaString(): string {
        return this.percentArea().toFixed(1);
    }

    /**
     * Based on frame and existing polygon lines, need to fill out rest of the polygon points
     *
     * @param {ExtPoint[]} points
     */
    drawFilledPolygon(points: ExtPoint[]) {
        let polygonPoints: Point[] = points.map((p) => p.point);

        const polygon: ExtPolygon = new ExtPolygon(polygonPoints, this.frameArea());
        this.polygons.push(polygon);
        
        // Add to image overlay (handles the Pikachu image reveal)
        this.imageOverlay.addPolygon(polygon);
        
        // Draw outline only in Phaser
        polygon.draw(this);
    }

    logPolygons(): void {
        console.table(
            this.polygons.map((polygon) => {
                let obj: any = {};
                obj.percentAreaString = `${polygon.percentAreaString}%`;
                polygon.polygon.points.forEach((point, index) => {
                    obj[`pt${index}`] = `${point.x},${point.y}`;
                });
                return obj;
            })
        );
    }

    pointOnLine(point: ExtPoint): boolean {
        for (let i = 0; i < this.polygons.length; i++) {
            if (this.polygons[i].outlineIntersects(point)) {
                return true;
            }
        }

        return false;
    }

    pointWithinPolygon(point: ExtPoint): boolean {
        for (let i = 0; i < this.polygons.length; i++) {
            if (this.polygons[i].innerIntersects(point)) {
                return true;
            }
        }

        return false;
    }

}
