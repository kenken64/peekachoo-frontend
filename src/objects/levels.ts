declare type integer = number;

import { customConfig } from "../main";
import type QixScene from "../scenes/qix-scene";

export class Levels {
	coverageTarget: number = customConfig.startCoverageTarget;
	currentLevel: number = customConfig.startLevel;
	scene: QixScene;

	constructor(qix: QixScene) {
		this.scene = qix;
	}

	nextLevel(): void {
		this.currentLevel++;
		customConfig.qixSpeed++;
		customConfig.qixTick--;

		this.scene.player.hasMoved = false;
		this.scene.sparkies.reset();
		this.scene.qixes.reset();

		// Update the image for the next level if playing a custom game
		this.scene.advanceLevel();
	}
}
