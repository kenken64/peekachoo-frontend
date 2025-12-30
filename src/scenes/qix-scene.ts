import * as Phaser from 'phaser';
declare type integer = number;

import {Player} from "../objects/player";
import {Grid} from "../objects/grid";
import {Info} from "../objects/info";
import {Debug} from "../objects/debug";
import {config, customConfig, resetGameConfig} from "../main";
import {Levels} from "../objects/levels";
import TimerEvent = Phaser.Time.TimerEvent;
import Scene = Phaser.Scene;
import {Sparkies} from "../objects/sparkies";
import Text = Phaser.GameObjects.Text;
import {Qixes} from "../objects/qixes";
import {ImageOverlay} from "../objects/image-overlay";
import * as AuthService from "../services/auth-service";
import { GameService, Game, GameLevel } from "../services/game-service";

interface GameSceneData {
    gameId?: string;
    levelIndex?: number;
    customGame?: Game;
}

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
    private headerContainer: HTMLDivElement | null = null;
    private gameId: string | null = null;
    private customGame: Game | null = null;
    private currentLevelIndex: number = 0;

    constructor() {
        super({
            key: 'Qix'
        });
    }

    init(data: GameSceneData) {
        this.gameId = data?.gameId || null;
        this.customGame = data?.customGame || null;
        this.currentLevelIndex = data?.levelIndex || 0;

        // Reset level state when starting a new game (no levelIndex means new game)
        if (data?.levelIndex === undefined) {
            resetGameConfig();
            this.levels = new Levels(this);
        }
    }

    preload() {
    }

    create() {
        this.createHeader();
        
        // Initialize pauseControl first to avoid undefined errors in update()
        this.pauseControl = new PauseControl();
        
        // Load custom game if gameId provided and not already loaded from restart
        if (this.gameId && !this.customGame) {
            this.loadCustomGame();
        }
        
        this.cursors = this.input.keyboard.createCursorKeys();
        this.grid = new Grid(this);
        this.player = new Player(this, customConfig.margin, customConfig.margin);
        this.info = new Info(this);
        this.debug = new Debug(this);

        this.sparkies = new Sparkies(this);
        this.qixes = new Qixes(this);

        // Set the first level image if custom game
        this.updateLevelImage();
    }

    private async loadCustomGame() {
        try {
            const game = await GameService.getGameById(this.gameId!);
            if (game) {
                this.customGame = game;
                // Update the image now that game is loaded
                this.updateLevelImage();
                // Increment play count (fire-and-forget, ignore errors)
                GameService.incrementPlayCount(this.gameId!).catch(() => {});
            }
        } catch (error) {
            console.error('Failed to load custom game:', error);
        }
    }

    /**
     * Update the overlay image based on current level
     */
    updateLevelImage() {
        if (this.customGame && this.customGame.levels.length > 0) {
            const levelIndex = Math.min(this.currentLevelIndex, this.customGame.levels.length - 1);
            const level = this.customGame.levels[levelIndex];
            if (level && level.pokemonSprite) {
                ImageOverlay.getInstance().setImage(level.pokemonSprite);
            }
        } else {
            // Classic mode - use default image
            ImageOverlay.getInstance().setImage('assets/1.jpeg');
        }
    }

    /**
     * Called when advancing to next level
     */
    advanceLevel() {
        this.currentLevelIndex++;
        this.updateLevelImage();
    }

    /**
     * Get the current custom game level (if any)
     */
    getCurrentCustomLevel(): GameLevel | null {
        if (this.customGame && this.customGame.levels.length > 0) {
            const levelIndex = Math.min(this.currentLevelIndex, this.customGame.levels.length - 1);
            return this.customGame.levels[levelIndex];
        }
        return null;
    }

    /**
     * Check if playing a custom game
     */
    isCustomGame(): boolean {
        return this.customGame !== null;
    }

    private createHeader(): void {
        // Remove existing header if present
        if (this.headerContainer) {
            this.headerContainer.remove();
        }

        const user = AuthService.getUser();
        const username = user?.username || 'Guest';

        this.headerContainer = document.createElement('div');
        this.headerContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 40px;
            background: linear-gradient(to bottom, #2a2a4a, #1a1a2e);
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 15px;
            box-sizing: border-box;
            z-index: 1000;
            border-bottom: 2px solid #CCAAFF;
        `;

        // Left side: Back button and username
        const leftDiv = document.createElement('div');
        leftDiv.style.cssText = `
            display: flex;
            align-items: center;
            gap: 15px;
        `;

        // Back to menu button
        const backBtn = document.createElement('button');
        backBtn.textContent = '← Menu';
        backBtn.style.cssText = `
            padding: 6px 12px;
            font-size: 12px;
            font-weight: bold;
            border: none;
            border-radius: 4px;
            background: #555;
            color: #FFFFFF;
            cursor: pointer;
            transition: background 0.2s;
        `;
        backBtn.addEventListener('mouseenter', () => {
            backBtn.style.background = '#777';
        });
        backBtn.addEventListener('mouseleave', () => {
            backBtn.style.background = '#555';
        });
        backBtn.addEventListener('click', () => {
            this.goToMenu();
        });

        // Username display
        const usernameDiv = document.createElement('div');
        usernameDiv.style.cssText = `
            color: #CCAAFF;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
        `;
        usernameDiv.innerHTML = `👤 <span style="color: #FFFFFF">${username}</span>`;

        leftDiv.appendChild(backBtn);
        leftDiv.appendChild(usernameDiv);

        // Right side container for help and logout
        const rightDiv = document.createElement('div');
        rightDiv.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        // How to Play button
        const helpBtn = document.createElement('button');
        helpBtn.textContent = '❓ How to Play';
        helpBtn.style.cssText = `
            padding: 6px 12px;
            font-size: 12px;
            font-weight: bold;
            border: none;
            border-radius: 4px;
            background: #3498db;
            color: #FFFFFF;
            cursor: pointer;
            transition: background 0.2s;
        `;
        helpBtn.addEventListener('mouseenter', () => {
            helpBtn.style.background = '#5dade2';
        });
        helpBtn.addEventListener('mouseleave', () => {
            helpBtn.style.background = '#3498db';
        });
        helpBtn.addEventListener('click', () => {
            this.showHowToPlay();
        });

        // Logout button
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.style.cssText = `
            padding: 6px 16px;
            font-size: 12px;
            font-weight: bold;
            border: none;
            border-radius: 4px;
            background: #e74c3c;
            color: #FFFFFF;
            cursor: pointer;
            transition: opacity 0.2s;
        `;
        logoutBtn.addEventListener('mouseenter', () => {
            logoutBtn.style.opacity = '0.8';
        });
        logoutBtn.addEventListener('mouseleave', () => {
            logoutBtn.style.opacity = '1';
        });
        logoutBtn.addEventListener('click', () => {
            this.handleLogout();
        });

        rightDiv.appendChild(helpBtn);
        rightDiv.appendChild(logoutBtn);

        this.headerContainer.appendChild(leftDiv);
        this.headerContainer.appendChild(rightDiv);

        const gameContainer = document.getElementById('content');
        if (gameContainer) {
            gameContainer.style.position = 'relative';
            gameContainer.style.paddingTop = '42px'; // Add space for header
            gameContainer.insertBefore(this.headerContainer, gameContainer.firstChild);
        }
    }

    private showHowToPlay(): void {
        // Pause the game
        this.pauseControl.pause();
        
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'how-to-play-modal';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        `;

        // Modal content
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: linear-gradient(to bottom, #2a2a4a, #1a1a2e);
            border: 3px solid #CCAAFF;
            border-radius: 15px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            color: #FFFFFF;
            font-family: Arial, sans-serif;
        `;

        modal.innerHTML = `
            <h2 style="color: #FFD700; text-align: center; margin-top: 0; font-size: 28px;">
                🎮 How to Play
            </h2>
            
            <h3 style="color: #CCAAFF; margin-bottom: 10px;">🕹️ Controls</h3>
            <ul style="line-height: 1.8; margin-bottom: 20px;">
                <li><strong>Arrow Keys</strong> - Move your player around the border</li>
                <li><strong>↑ Up</strong> - Move up</li>
                <li><strong>↓ Down</strong> - Move down</li>
                <li><strong>← Left</strong> - Move left</li>
                <li><strong>→ Right</strong> - Move right</li>
            </ul>
            
            <h3 style="color: #CCAAFF; margin-bottom: 10px;">🎯 Objective</h3>
            <p style="line-height: 1.6; margin-bottom: 20px;">
                Claim territory by drawing lines across the playing field. 
                Fill up <strong style="color: #FFD700;">75%</strong> or more of the area to reveal the hidden image and advance to the next level!
            </p>
            
            <h3 style="color: #CCAAFF; margin-bottom: 10px;">📜 Rules</h3>
            <ul style="line-height: 1.8; margin-bottom: 20px;">
                <li>You can only move along the <strong>border</strong> or <strong>claimed areas</strong></li>
                <li>When you venture into unclaimed territory, you draw a line</li>
                <li>Complete a shape by returning to claimed territory to fill it in</li>
                <li>The area without enemies gets filled!</li>
            </ul>
            
            <h3 style="color: #CCAAFF; margin-bottom: 10px;">⚠️ Dangers</h3>
            <ul style="line-height: 1.8; margin-bottom: 20px;">
                <li><strong style="color: #FF6B6B;">Qix</strong> - The bouncing enemy in the center. Don't let it touch your line while drawing!</li>
                <li><strong style="color: #FF6B6B;">Sparky</strong> - Enemies that patrol the borders. Avoid them!</li>
                <li>If hit, you lose a life and restart the level</li>
            </ul>
            
            <h3 style="color: #CCAAFF; margin-bottom: 10px;">💡 Tips</h3>
            <ul style="line-height: 1.8; margin-bottom: 25px;">
                <li>Draw quickly to minimize risk</li>
                <li>Claim smaller areas at first for safety</li>
                <li>Watch enemy patterns before making your move</li>
                <li>Larger claims give more area percentage!</li>
            </ul>
        `;

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✓ Got it!';
        closeBtn.style.cssText = `
            display: block;
            width: 100%;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: bold;
            border: none;
            border-radius: 8px;
            background: #4CAF50;
            color: #FFFFFF;
            cursor: pointer;
            transition: background 0.2s;
        `;
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = '#66BB6A';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = '#4CAF50';
        });
        closeBtn.addEventListener('click', () => {
            modalOverlay.remove();
            this.pauseControl.unpause();
        });

        modal.appendChild(closeBtn);
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);

        // Also close on clicking outside
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
                this.pauseControl.unpause();
            }
        });
    }

    private goToMenu(): void {
        this.cleanupHeader();
        this.scene.start('MenuScene');
    }

    private handleLogout(): void {
        AuthService.logout();
        this.cleanupHeader();
        // Reset the image overlay
        ImageOverlay.getInstance().reset();
        ImageOverlay.getInstance().hide();
        // Reset padding when logging out
        const gameContainer = document.getElementById('content');
        if (gameContainer) {
            gameContainer.style.paddingTop = '0';
        }
        this.scene.start('LoginScene');
    }

    private cleanupHeader(): void {
        if (this.headerContainer && this.headerContainer.parentNode) {
            this.headerContainer.parentNode.removeChild(this.headerContainer);
            this.headerContainer = null;
        }
    }

    shutdown(): void {
        this.cleanupHeader();
    }

    update(time: number, delta: number) {
        // Guard against uninitialized state
        if (!this.pauseControl || !this.grid || !this.player) {
            return;
        }
        
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
            // Restart same level with game data preserved
            _this.scene.restart({
                gameId: _this.gameId,
                customGame: _this.customGame,
                levelIndex: _this.currentLevelIndex
            });
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
        
        // Check if this is the last level in a custom game
        const isLastCustomLevel = this.customGame && 
            (this.currentLevelIndex >= this.customGame.levels.length - 1);
        
        // Show full image for a moment
        setTimeout(function () {
            winText.destroy();
            
            // Hide overlay so text is visible
            ImageOverlay.getInstance().hide();
            
            if (isLastCustomLevel) {
                // Game complete! Show congratulations
                _this.showGameComplete();
            } else {
                winText = _this.createWinText(`Sweet!!\nOn to level ${_this.levels.currentLevel + 1}`, "#000000");

                setTimeout(function () {
                    winText.destroy();
                    _this.levels.nextLevel();
                    // Pass game data to next level
                    // Note: currentLevelIndex already incremented by nextLevel() -> advanceLevel()
                    _this.scene.restart({
                        gameId: _this.gameId,
                        customGame: _this.customGame,
                        levelIndex: _this.currentLevelIndex
                    });
                }, customConfig.levelWinPauseMs / 2);
            }
        }, customConfig.levelWinPauseMs);
    }

    private showGameComplete(): void {
        // Hide the game overlay
        ImageOverlay.getInstance().hide();
        
        // Create dark overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.8);
        overlay.fillRect(0, 0, config.width as number, customConfig.frameHeight as number);
        overlay.setDepth(999);
        
        // Congratulations text
        const centerX = (config.width as number) / 2;
        const centerY = (customConfig.frameHeight as number) / 2;
        
        const congratsText = this.add.text(centerX, centerY - 80, '🎉 Congratulations! 🎉', {
            fontFamily: 'Arial',
            fontSize: '36px',
            color: '#FFD700',
            align: 'center'
        });
        congratsText.setOrigin(0.5);
        congratsText.setDepth(1000);
        
        const gameName = this.customGame?.name || 'the game';
        const messageText = this.add.text(centerX, centerY - 20, `You completed ${gameName}!`, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#FFFFFF',
            align: 'center'
        });
        messageText.setOrigin(0.5);
        messageText.setDepth(1000);
        
        const levelsText = this.add.text(centerX, centerY + 20, `${this.customGame?.levels.length || 0} Pokémon revealed!`, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#CCAAFF',
            align: 'center'
        });
        levelsText.setOrigin(0.5);
        levelsText.setDepth(1000);
        
        // Create return to menu button using Graphics (Phaser 3.10 compatible)
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = centerX - buttonWidth / 2;
        const buttonY = centerY + 60;
        
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x4CAF50, 1);
        buttonBg.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        buttonBg.setDepth(1000);
        buttonBg.setInteractive(new Phaser.Geom.Rectangle(buttonX, buttonY, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains);
        
        const buttonText = this.add.text(centerX, buttonY + buttonHeight / 2, 'Return to Menu', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#FFFFFF',
            align: 'center'
        });
        buttonText.setOrigin(0.5);
        buttonText.setDepth(1001);
        
        // Hover effects
        buttonBg.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x66BB6A, 1);
            buttonBg.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        });
        
        buttonBg.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x4CAF50, 1);
            buttonBg.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        });
        
        buttonBg.on('pointerdown', () => {
            this.cleanupHeader();
            this.scene.start('MenuScene');
        });
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