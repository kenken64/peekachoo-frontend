declare type integer = number;

import { customConfig } from "../main";
import type QixScene from "../scenes/qix-scene";
import { audioService } from "../services/audio-service";
import { Sparky } from "./sparky";

export class Sparkies {
	sparkies: Sparky[] = [];
	scene: QixScene;
	startingNumSparkies: number = customConfig.startNumSparkies;
	sparkyStartupTimesSeconds: number[] = customConfig.sparkyStartupTimesSeconds;
	START_TIME_UNDEFINED: number = 0;
	startTime: number = this.START_TIME_UNDEFINED;

	constructor(scene: QixScene) {
		this.scene = scene;
	}

	update() {
		if (!this.scene.player.hasMoved) {
			return;
		}

		const nextStartupTimeMilliseconds =
			this.sparkyStartupTimesSeconds[this.sparkies.length] * 1000;
		this.startTime =
			this.startTime === this.START_TIME_UNDEFINED
				? this.scene.time.now
				: this.startTime;
		const timeSinceStart = this.scene.time.now - this.startTime;

		if (timeSinceStart > nextStartupTimeMilliseconds) {
			this.sparkies.push(new Sparky(this.scene, 10, 10));
			// Play enemy spawn sound
			audioService.playSFX("enemySpawn");
		}

		this.sparkies.forEach((sparky) => {
			sparky.update();
		});
	}

	checkForCollisionWithPlayer(): boolean {
		let collision = false;

		this.sparkies.forEach((sparky) => {
			if (sparky.getExtPoint().equals(this.scene.player.point())) {
				collision = true;
			}
		});

		return collision;
	}

	reset() {
		this.sparkies.forEach((sparky) => {
			sparky.destroy();
		});
		this.sparkies = [];
		this.startTime = this.START_TIME_UNDEFINED;
	}
}
