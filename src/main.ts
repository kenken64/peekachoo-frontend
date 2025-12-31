import 'phaser';

import LoginScene from "./scenes/login-scene";
import { MenuScene } from "./scenes/menu-scene";
import { GameCreateScene } from "./scenes/game-create-scene";
import QixScene from "./scenes/qix-scene";

// Clear old localStorage data (we now use sessionStorage for per-tab sessions)
localStorage.removeItem('peekachoo_token');
localStorage.removeItem('peekachoo_user');

const gameWidth = 800;
const gameHeight = 650;
const infoHeight = 30;
const debugTextAreaHeight = 0;
const margin = 10;

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d', { willReadFrequently: true });

export const config:GameConfig = {
    type: Phaser.CANVAS,
    canvas: canvas,
    context: context as CanvasRenderingContext2D,
    parent: 'content',
    width: gameWidth,
    height: gameHeight,
    resolution: 1,
    backgroundColor: "#555",
    scene: [
        LoginScene,
        MenuScene,
        GameCreateScene,
        QixScene
    ],
    banner: false
};

export const customConfig:GameCustomConfig = {
    debug: false,
    margin: margin,
    frameHeight: gameHeight - infoHeight - (3 * margin),
    infoHeight: infoHeight,
    debugTextAreaHeight: debugTextAreaHeight,
    lineColor: 0x000,
    fillColor: 0xCCAAFF,
    playerRadius: 5,
    playerColor: 0xAA88EE,
    playerSpeed: 5,
    sparkyColor: 0x8B0000,
    sparkySpeed: 5,
    sparkyTick: 2,
    startCoverageTarget: 60,
    startLevel: 1,
    startNumSparkies: 1,
    sparkyStartupTimesSeconds: [ 3, 10, 30, 60, 200 ],
    startNumQixes: 1,
    qixStartupTimesSeconds: [1, 200, 500],
    qixTick: 8,
    qixSpeed: 15,
    levelWinPauseMs: 4000
};

export const game = new Phaser.Game(config);

// Store initial values for reset
const initialQixSpeed = customConfig.qixSpeed;
const initialQixTick = customConfig.qixTick;

// Reset customConfig to initial values (called when starting a new game)
export function resetGameConfig() {
    customConfig.qixSpeed = initialQixSpeed;
    customConfig.qixTick = initialQixTick;
}

// Responsive canvas scaling for mobile (Phaser 3.10 compatible)
function resizeCanvas() {
    const content = document.getElementById('content');
    if (!content || !canvas) return;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const gameRatio = gameWidth / gameHeight;
    const windowRatio = windowWidth / windowHeight;

    let scale = 1;

    // Only scale on mobile/tablet (< 768px width)
    if (windowWidth < 768) {
        if (windowRatio < gameRatio) {
            // Window is narrower than game
            scale = windowWidth / gameWidth;
        } else {
            // Window is taller than game
            scale = windowHeight / gameHeight;
        }

        // Apply CSS transform to scale the canvas
        canvas.style.transformOrigin = 'top left';
        canvas.style.transform = `scale(${scale})`;
        content.style.width = `${gameWidth * scale}px`;
        content.style.height = `${gameHeight * scale}px`;
    } else {
        // Desktop - no scaling
        canvas.style.transform = 'none';
        content.style.width = 'auto';
        content.style.height = 'auto';
    }
}

// Initial resize and add resize listener
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

export interface GameCustomConfig {
    debug: boolean;
    margin: integer;
    frameHeight: integer;
    infoHeight: integer;
    debugTextAreaHeight: integer;
    lineColor: integer;
    fillColor: integer;
    playerRadius: integer;
    playerColor: integer;
    playerSpeed: integer;
    sparkyColor: integer;
    sparkySpeed: integer;
    sparkyTick: integer;
    startCoverageTarget: number;
    startLevel: number;
    startNumSparkies: number;
    sparkyStartupTimesSeconds: number[];
    startNumQixes: number;
    qixStartupTimesSeconds: number[];
    qixTick: number;
    qixSpeed: number;
    levelWinPauseMs: number;
}

