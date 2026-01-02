import 'phaser';

import LoginScene from "./scenes/login-scene";
import { MenuScene } from "./scenes/menu-scene";
import { GameCreateScene } from "./scenes/game-create-scene";
import QixScene from "./scenes/qix-scene";
import { LeaderboardScene } from "./scenes/leaderboard-scene";
import { StatsScene } from "./scenes/stats-scene";
import { logger } from "./config";

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
        QixScene,
        LeaderboardScene,
        StatsScene
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
    if (!content || !canvas) {
        logger.log('resizeCanvas: content or canvas not found');
        return;
    }

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    logger.log(`resizeCanvas: windowWidth=${windowWidth}, windowHeight=${windowHeight}`);

    // Only scale on mobile/tablet (< 768px width)
    if (windowWidth < 768) {
        // Header height on mobile (matches qix-scene responsive styles)
        const mobileHeaderHeight = 36;

        // Calculate scale to fit width
        const scaleX = windowWidth / gameWidth;
        // Also consider height to avoid vertical overflow (account for header)
        const availableHeight = windowHeight - mobileHeaderHeight;
        const scaleY = availableHeight / gameHeight;
        // Use the smaller scale to ensure it fits both dimensions
        const scale = Math.min(scaleX, scaleY * 0.95); // 0.95 for some padding
        logger.log(`Mobile detected, scaleX=${scaleX}, scaleY=${scaleY}, scale=${scale}`);

        const scaledWidth = gameWidth * scale;
        const scaledHeight = gameHeight * scale;

        // Calculate centering offset if scaled canvas is smaller than viewport
        const offsetX = Math.max(0, (windowWidth - scaledWidth) / 2);
        const offsetY = Math.max(0, (windowHeight - scaledHeight - mobileHeaderHeight) / 2);

        // Remove ALL borders and outlines
        canvas.style.border = 'none';
        canvas.style.outline = 'none';
        canvas.style.boxShadow = 'none';
        content.style.border = 'none';
        content.style.outline = 'none';
        content.style.boxShadow = 'none';

        // Apply CSS transform to scale the canvas - position below header
        canvas.style.width = `${gameWidth}px`;
        canvas.style.height = `${gameHeight}px`;
        canvas.style.transformOrigin = 'top left';
        canvas.style.transform = `scale(${scale})`;
        canvas.style.display = 'block';
        canvas.style.position = 'absolute';
        canvas.style.margin = '0';
        canvas.style.padding = '0';
        canvas.style.left = '0';
        canvas.style.top = `${mobileHeaderHeight}px`; // Position below header
        canvas.style.zIndex = '1'; // Phaser canvas base layer

        // Also scale the image overlay canvas if it exists
        const overlayCanvas = document.getElementById('image-overlay-canvas') as HTMLCanvasElement;
        if (overlayCanvas) {
            overlayCanvas.style.width = `${gameWidth}px`;
            overlayCanvas.style.height = `${customConfig.frameHeight + customConfig.margin * 2}px`;
            overlayCanvas.style.transformOrigin = 'top left';
            overlayCanvas.style.transform = `scale(${scale})`;
            overlayCanvas.style.position = 'absolute';
            overlayCanvas.style.left = '0';
            overlayCanvas.style.top = `${mobileHeaderHeight}px`; // Position below header
            overlayCanvas.style.zIndex = '2'; // Overlay shows image through polygon windows (transparent elsewhere)
        }

        // Set content container to match scaled size and center it (include header height)
        content.style.width = `${scaledWidth}px`;
        content.style.maxWidth = '100vw';
        content.style.height = `${scaledHeight + mobileHeaderHeight}px`;
        content.style.margin = `${offsetY}px auto 0 auto`;
        content.style.padding = '0';
        content.style.position = 'relative';
        content.style.overflow = 'hidden';

        logger.log(`Canvas scaled to ${scaledWidth}x${scaledHeight}, offset: ${offsetX}, ${offsetY}, headerHeight: ${mobileHeaderHeight}`);
    } else {
        logger.log('Desktop mode, no scaling');
        // Desktop - reset mobile-specific scaling styles
        canvas.style.border = '';
        canvas.style.outline = '';
        canvas.style.boxShadow = '';
        canvas.style.width = '';
        canvas.style.height = '';
        canvas.style.transform = '';
        canvas.style.transformOrigin = '';
        canvas.style.display = '';
        canvas.style.position = '';
        canvas.style.margin = '';
        canvas.style.padding = '';
        canvas.style.left = '';
        canvas.style.top = '';
        canvas.style.zIndex = '';
        
        // Desktop: set content container for proper overlay positioning
        content.style.position = 'relative';
        content.style.display = 'inline-block';
        content.style.width = '';
        content.style.maxWidth = '';
        content.style.height = '';
        content.style.margin = '';
        content.style.overflow = '';
        
        // Reset overlay canvas transform styles on desktop
        const overlayCanvas = document.getElementById('image-overlay-canvas') as HTMLCanvasElement;
        if (overlayCanvas) {
            overlayCanvas.style.width = '';
            overlayCanvas.style.height = '';
            overlayCanvas.style.transform = '';
            overlayCanvas.style.transformOrigin = '';
            overlayCanvas.style.zIndex = '';
        }
    }
}

// Run resize multiple times to ensure it takes effect
logger.log('Setting up resize handlers...');
setTimeout(() => {
    logger.log('Running initial resize (100ms)');
    resizeCanvas();
}, 100);
setTimeout(() => {
    logger.log('Running second resize (500ms)');
    resizeCanvas();
}, 500);
setTimeout(() => {
    logger.log('Running third resize (1000ms)');
    resizeCanvas();
}, 1000);

// Add resize listeners
window.addEventListener('resize', () => {
    logger.log('Window resize event');
    resizeCanvas();
});
window.addEventListener('orientationchange', () => {
    logger.log('Orientation change event');
    setTimeout(resizeCanvas, 200);
});

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

