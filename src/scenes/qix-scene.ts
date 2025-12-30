import * as Phaser from 'phaser';
declare type integer = number;

import {Player} from "../objects/player";
import {Grid} from "../objects/grid";
import {Info} from "../objects/info";
import {Debug} from "../objects/debug";
import {config, customConfig} from "../main";
import {Levels} from "../objects/levels";
import TimerEvent = Phaser.Time.TimerEvent;
import Scene = Phaser.Scene;
import {Sparkies} from "../objects/sparkies";
import Text = Phaser.GameObjects.Text;
import {Qixes} from "../objects/qixes";
import {ImageOverlay} from "../objects/image-overlay";

class QixScene extends Phaser.Scene {
    player: Player;
    sparkies: Sparkies;
    qixes: Qixes;
    grid: Grid;
    info: Info;
    cursors: CursorKeys;
    debug: Debug;
    pauseControl: PauseControl;
    levels = new Levels(this);

    constructor() {
        super({
            key: 'Qix'
        });
    }

    preload() {
    }

    create() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.grid = new Grid(this);
        this.player = new Player(this, customConfig.margin, customConfig.margin);
        this.info = new Info(this);
        this.debug = new Debug(this);

        this.pauseControl = new PauseControl();
        this.sparkies = new Sparkies(this);
        this.qixes = new Qixes(this);

        // this.player = this.add.sprite(100, 100, 'player');
        // this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        // this.cameras.main.startFollow(this.player, false);
    }

    update(time: number, delta: number) {
        if (this.pauseControl.isPaused(time)) {
            return;
        }

        if (this.grid.isIllegalMove(this.player, this.cursors)) {
            return;
        }

        this.player.move(this.cursors);
        this.sparkies.update();
        this.qixes.update();
        this.grid.update(this.player);
        this.info.updateGameText();

        if (this.checkForWin()) {
            this.passLevel(time);
        }

        if (this.checkForLoss()) {
            this.loseLife(time);
        }
    }

    checkForLoss(): boolean {
        return this.sparkies.checkForCollisionWithPlayer() || this.qixes.checkForCollisionWithCurrentLines();
    }

    loseLife(time: number) {
        this.pauseControl.pauseForWin(time);
        this.cameras.main.shake(300, .005);
        this.pauseControl.pauseForWin(time);
        this.cameras.main.shake(300, .005);
        
        // Hide overlay so text is visible
        ImageOverlay.getInstance().hide();
        let winText = this.createWinText(`Ouch!!!.`, "#000000");

        const _this = this;
        setTimeout(function () {
            winText.destroy();
            _this.scene.restart({});
        }, customConfig.levelWinPauseMs / 2);
    }

    checkForWin(): boolean {
        return (this.grid.filledPolygons.percentArea() >= this.levels.coverageTarget);
    }

    options = { fontFamily: 'Courier', fontSize: '30px', color: '#FFFF00', align: 'center',
        radiusX: '10px', radiusY: '10px',
        padding: { x: 10, y: 10 }
    };

    passLevel(time: number) {
        this.pauseControl.pauseForWin(time);
        this.cameras.main.shake(300, .005);
        
        // First, reveal the full image so player can see it
        ImageOverlay.getInstance().revealFullImage();
        let winText = this.createWinText(`Level ${this.levels.currentLevel} Complete!`, "#000000");

        const _this = this;
        
        // Show full image for a moment
        setTimeout(function () {
            winText.destroy();
            
            // Hide overlay so text is visible
            ImageOverlay.getInstance().hide();
            winText = _this.createWinText(`Sweet!!\nOn to level ${_this.levels.currentLevel + 1}`, "#000000");

            setTimeout(function () {
                winText.destroy();
                _this.levels.nextLevel();
                _this.scene.restart({});
            }, customConfig.levelWinPauseMs / 2);
        }, customConfig.levelWinPauseMs);
    }

    createWinText(message: string, color: string): Text {
        const x = ((config.width as number) / 3);
        const y = ((customConfig.frameHeight as number) / 2) - 35;
        let winText = this.add.text(x, y, message, this.options);
        winText.setShadow(3, 3, color, 2, true, true);
        winText.setDepth(1000);
        return winText;
    }
}

class PauseControl {
    private paused: boolean = false;
    private winTime: number;

    constructor() {
    }

    isPaused(time: number): boolean {
        return this.paused;
    }

    pauseForWin(time: number): void {
        this.paused = true;
        this.winTime = time;
    }

    pause(): void {
        this.paused = true;
    }

    unpause(): void {
        this.paused = false;
    }

    togglePause(): void {
        this.paused = ! this.paused;
    }

}

export default QixScene;