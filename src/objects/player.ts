import * as Phaser from 'phaser';
declare type integer = number;

import Graphics = Phaser.GameObjects.Graphics;
import Scene = Phaser.Scene;
import Circle = Phaser.Geom.Circle;
import Point = Phaser.Geom.Point;
import {ExtPoint} from "./ext-point";
import {customConfig} from "../main";

export class Player {

    graphics: Graphics;

    previousPoint: ExtPoint;

    previousOnExisting: boolean;

    speed: integer;

    hasMoved: boolean = false;

    // Effective radius (may be larger on mobile for visibility)
    private effectiveRadius: integer;

    private baseSpeed: integer;
    private speedMultiplier: number = 1;
    private speedBoostTimer: Phaser.Time.TimerEvent;

    constructor(scene: Scene, x: integer, y: integer) {
        this.baseSpeed = customConfig.playerSpeed;
        this.speed = this.baseSpeed;

        // Increase player size on mobile for better visibility
        const isMobile = window.innerWidth < 768;
        this.effectiveRadius = isMobile ? Math.max(customConfig.playerRadius * 2, 10) : customConfig.playerRadius;

        this.graphics = scene.add.graphics();
        this.graphics.lineStyle(2, customConfig.playerColor);
        this.graphics.fillStyle(customConfig.playerColor);
        this.graphics.x = x - customConfig.playerRadius;
        this.graphics.y = y - customConfig.playerRadius;

        // Draw a larger, more visible player dot
        this.graphics.fillCircleShape(new Circle(customConfig.playerRadius, customConfig.playerRadius, this.effectiveRadius));

        // Add a contrasting border for better visibility
        if (isMobile) {
            this.graphics.lineStyle(2, 0xFFFFFF);
            this.graphics.strokeCircleShape(new Circle(customConfig.playerRadius, customConfig.playerRadius, this.effectiveRadius));
        }

        // Set high depth to ensure player is always visible on top
        this.graphics.setDepth(1000);

        this.previousPoint = this.point();
        this.previousOnExisting = true;
    }

    x(): integer {
        return this.graphics.x + customConfig.playerRadius;
    }

    y(): integer {
        return this.graphics.y + customConfig.playerRadius;
    }

    point(): ExtPoint {
        return ExtPoint.createWithCoordinates(this.graphics.x + customConfig.playerRadius, this.graphics.y + customConfig.playerRadius);
    }

    move(cursors: CursorKeys) {
        if (! this.previousPoint.equals(this.point())) {
            this.hasMoved = true;
        }

        this.previousPoint = this.point();

        const newPosition = this.getMove(cursors);
        this.graphics.x = newPosition.x;
        this.graphics.y = newPosition.y;
    }

    moving(): boolean {
        return this.movingLeft() || this.movingRight() || this.movingUp() || this.movingDown();
    }

    movingLeft(): boolean { return this.x() < this.previousPoint.x(); }
    movingRight(): boolean { return this.x() > this.previousPoint.x(); }
    movingUp(): boolean { return this.y() < this.previousPoint.y(); }
    movingDown(): boolean { return this.y() > this.previousPoint.y(); }
    movingHoriziontally(): boolean { return this.movingLeft() || this.movingRight(); }
    movingVertically(): boolean { return this.movingUp() || this.movingDown(); }

    getMove(cursors: CursorKeys): Point {
        let x = this.graphics.x;
        let y = this.graphics.y;

        if (cursors.left.isDown) {
            x -= this.speed;
        } else if (cursors.right.isDown) {
            x += this.speed;
        } else if (cursors.up.isDown) {
            y -= this.speed;
        } else if (cursors.down.isDown) {
            y += this.speed;
        }

        return new Point(x, y);
    }

    activateSpeedBoost(scene: Scene, durationMs: number = 20000) {
        this.speedMultiplier = 2;
        this.updateSpeed();

        // Cancel existing timer if any
        if (this.speedBoostTimer) {
            this.speedBoostTimer.remove(() => {});
        }

        this.speedBoostTimer = scene.time.delayedCall(durationMs, () => {
            this.speedMultiplier = 1;
            this.updateSpeed();
        }, [], this);
    }

    private updateSpeed() {
        this.speed = this.baseSpeed * this.speedMultiplier;
    }
}
