import * as Phaser from 'phaser';
declare type integer = number;

import {Player} from "../objects/player";
import {Grid} from "../objects/grid";
import {Info} from "../objects/info";
import {Debug} from "../objects/debug";
import {config, customConfig, resetGameConfig} from "../main";
import {Levels} from "../objects/levels";
import {QuizService, QuizQuestion} from "../services/quiz-service";
import TimerEvent = Phaser.Time.TimerEvent;
import Scene = Phaser.Scene;
import {Sparkies} from "../objects/sparkies";
import Text = Phaser.GameObjects.Text;
import {Qixes} from "../objects/qixes";
import {ImageOverlay} from "../objects/image-overlay";
import * as AuthService from "../services/auth-service";
import { GameService, Game, GameLevel } from "../services/game-service";
import { PokemonService } from "../services/pokemon-service";
import { VirtualDpad } from "../objects/virtual-dpad";
import { InputManager } from "../utils/input-manager";
import { sessionStore } from "../stores/session-store";
import { ScoreSubmissionResult } from "../services/leaderboard-service";
import { websocketService } from "../services/websocket-service";
import { logger } from "../config";
import { audioService } from "../services/audio-service";
import { I18nService } from "../services/i18n-service";

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
    private loadingContainer: HTMLDivElement | null = null;
    private gameId: string | null = null;
    private customGame: Game | null = null;
    private currentLevelIndex: number = 0;
    private virtualDpad: VirtualDpad | null = null;
    private endlessModePokemon: { id: number; name: string; name_jp?: string; spriteUrl: string; types: string[]; isNew: boolean } | null = null;

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
            // Start a new session for score tracking
            this.initSession();
        }
    }

    private sessionReady: Promise<void> | null = null;
    private gameDataReady: Promise<void> | null = null;
    private pokemonReady: Promise<void> | null = null;

    private initSession() {
        this.sessionReady = this.doInitSession();
    }

    private async doInitSession() {
        try {
            await sessionStore.startSession(this.gameId);
            logger.log('[QixScene] Session started:', sessionStore.getSessionId());
        } catch (error) {
            logger.error('[QixScene] Failed to start session:', error);
        }
    }

    preload() {
    }

    create() {
        this.createHeader();

        // Initialize pauseControl first to avoid undefined errors in update()
        this.pauseControl = new PauseControl();

        // Register shutdown event handler for cleanup
        this.events.on('shutdown', this.shutdown, this);

        // Load custom game if gameId provided and not already loaded from restart
        if (this.gameId && !this.customGame) {
            this.showLoadingOverlay();
            this.gameDataReady = this.loadCustomGame();
        }

        this.cursors = this.input.keyboard.createCursorKeys();

        // Add virtual D-pad for mobile devices
        if (InputManager.isMobile()) {
            this.virtualDpad = new VirtualDpad(this);
        }

        this.grid = new Grid(this);
        this.player = new Player(this, customConfig.margin, customConfig.margin);
        this.info = new Info(this);
        this.debug = new Debug(this);

        this.sparkies = new Sparkies(this);
        this.qixes = new Qixes(this);

        // Play game music
        audioService.playMusic('gameMusic');

        // Set the first level image if custom game
        this.updateLevelImage();

        // Start tracking current level for scoring
        this.startLevelTracking();
    }

    private async startLevelTracking() {
        // Wait for session, game data, and Pokemon to be ready before tracking level
        if (this.sessionReady) {
            await this.sessionReady;
        }
        if (this.gameDataReady) {
            await this.gameDataReady;
        }
        if (this.pokemonReady) {
            await this.pokemonReady;
        }

        // Determine Pokemon info based on game mode
        let pokemonId: number | undefined;
        let pokemonName: string | undefined;

        if (this.customGame?.levels[this.currentLevelIndex]) {
            // Custom game mode
            const currentLevel = this.customGame.levels[this.currentLevelIndex];
            pokemonId = currentLevel.pokemonId;
            pokemonName = currentLevel.pokemonName;
        } else if (this.endlessModePokemon) {
            // Endless mode
            pokemonId = this.endlessModePokemon.id;
            pokemonName = this.endlessModePokemon.name;
        }

        logger.log('[QixScene] Starting level tracking with Pokemon:', {
            level: this.levels.currentLevel,
            pokemonId,
            pokemonName
        });

        sessionStore.startLevel(
            this.levels.currentLevel,
            pokemonId,
            pokemonName
        );
        logger.log('[QixScene] Level tracking started for level:', this.levels.currentLevel);
    }

    private async loadCustomGame() {
        try {
            const game = await GameService.getGameById(this.gameId!);
            if (game) {
                this.customGame = game;
                // Update the image now that game is loaded
                this.updateLevelImage();
                // Update header with game name
                this.updateHeaderGameName();
                // Increment play count (fire-and-forget, ignore errors)
                GameService.incrementPlayCount(this.gameId!).catch(() => {});
            } else {
                this.showToast('Failed to load game data', 'error');
                setTimeout(() => this.goToMenu(), 2000);
            }
        } catch (error) {
            logger.error('Failed to load custom game:', error);
            this.showToast('Error loading game', 'error');
            setTimeout(() => this.goToMenu(), 2000);
        } finally {
            this.hideLoadingOverlay();
        }
    }

    private showLoadingOverlay() {
        if (this.loadingContainer) return;

        this.loadingContainer = document.createElement('div');
        this.loadingContainer.id = 'game-loading-overlay';
        this.loadingContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            color: white;
            font-family: "Press Start 2P", cursive;
        `;

        this.loadingContainer.innerHTML = `
            <div style="font-size: 20px; margin-bottom: 20px;">LOADING GAME...</div>
            <div class="nes-progress is-primary" style="width: 300px; height: 20px;"></div>
        `;

        document.body.appendChild(this.loadingContainer);
        
        // Pause the game while loading
        if (this.pauseControl) {
            this.pauseControl.pause();
        }
    }

    private hideLoadingOverlay() {
        if (this.loadingContainer) {
            this.loadingContainer.remove();
            this.loadingContainer = null;
        }
        
        // Unpause the game
        if (this.pauseControl) {
            this.pauseControl.unpause();
        }
    }

    private updateHeaderGameName() {
        const gameNameEl = document.querySelector('.qix-gamename span');
        if (gameNameEl && this.customGame) {
            gameNameEl.textContent = this.customGame.name;
        }
    }

    /**
     * Update the overlay image based on current level
     */
    updateLevelImage() {
        // Reset endless mode pokemon state
        this.endlessModePokemon = null;
        
        // If we have a gameId but no customGame data yet, it means we are still loading.
        // We should NOT start endless mode.
        if (this.gameId && !this.customGame) {
            logger.log('[QixScene] Waiting for custom game data to load...');
            return;
        }

        if (this.customGame && this.customGame.levels.length > 0) {
            const levelIndex = Math.min(this.currentLevelIndex, this.customGame.levels.length - 1);
            const level = this.customGame.levels[levelIndex];
            logger.log('[QixScene] Setting Custom Game Level Image:', {
                gameName: this.customGame.name,
                levelIndex,
                pokemonName: level.pokemonName,
                spriteUrl: level.pokemonSprite
            });
            if (level && level.pokemonSprite) {
                ImageOverlay.getInstance().setImage(level.pokemonSprite);
            }
        } else {
            logger.log('[QixScene] Setting Endless Mode Image (fetching random)...');
            // Endless mode - fetch random unrevealed Pokemon from backend
            this.pokemonReady = this.fetchRandomPokemon();
        }
    }

    /**
     * Fetch a random unrevealed Pokemon from the backend for endless mode
     */
    private async fetchRandomPokemon(retryCount = 0): Promise<void> {
        if (retryCount > 3) {
            logger.warn('[QixScene] Max retries reached for fetching Pokemon');
            ImageOverlay.getInstance().setImage('assets/1.jpeg');
            return;
        }

        try {
            const pokemon = await PokemonService.getRandomUnrevealed();
            if (pokemon && pokemon.spriteUrl) {
                // Try to load the image
                const success = await ImageOverlay.getInstance().setImage(pokemon.spriteUrl);
                
                if (success) {
                    this.endlessModePokemon = pokemon;
                    // Use Japanese name if available and language is JP, otherwise fallback to English name
                    const displayName = (I18nService.getLang() === 'jp' && pokemon.name_jp) ? pokemon.name_jp : pokemon.name;
                    logger.log('[QixScene] Loaded random Pokemon for Reveal:', {
                        name: pokemon.name,
                        nameJP: pokemon.name_jp,
                        displayName,
                        spriteUrl: pokemon.spriteUrl,
                        isNew: pokemon.isNew
                    });
                } else {
                    logger.warn('[QixScene] Failed to load image for Pokemon:', pokemon.name, 'Retrying...');
                    // If image failed to load, try another Pokemon
                    await this.fetchRandomPokemon(retryCount + 1);
                }
            } else {
                // Fallback to default image if no Pokemon available
                logger.warn('[QixScene] No random Pokemon available, using default');
                ImageOverlay.getInstance().setImage('assets/1.jpeg');
            }
        } catch (error) {
            logger.error('[QixScene] Failed to fetch random Pokemon:', error);
            // Fallback to default image on error
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

    private injectResponsiveStyles(): void {
        // Only inject once
        if (document.getElementById('qix-scene-responsive-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'qix-scene-responsive-styles';
        style.textContent = `
            /* Default state - hide icons, show text */
            .qix-header-btn .btn-icon {
                display: none;
            }
            .qix-header-btn .btn-text {
                display: inline;
            }

            /* Mobile Responsive Styles for QixScene */
            @media (max-width: 768px) {
                #qix-header {
                    height: 36px !important;
                    padding: 0 10px !important;
                }

                .qix-header-left,
                .qix-header-right {
                    gap: 8px !important;
                }

                .qix-header-btn {
                    padding: 4px 10px !important;
                    font-size: 11px !important;
                }

                .qix-username {
                    font-size: 12px !important;
                }

                .qix-gamename {
                    display: none !important;
                }

                /* How to Play Modal */
                #how-to-play-modal .modal-content,
                #how-to-play-modal > div > div {
                    padding: 20px !important;
                    max-width: 450px !important;
                }

                #how-to-play-modal h2 {
                    font-size: 22px !important;
                }

                #how-to-play-modal h3 {
                    font-size: 14px !important;
                    margin-bottom: 8px !important;
                }

                #how-to-play-modal ul,
                #how-to-play-modal p {
                    font-size: 12px !important;
                    line-height: 1.5 !important;
                }

                #how-to-play-modal button {
                    padding: 10px 20px !important;
                    font-size: 14px !important;
                }

                /* Quiz Dialog */
                #quiz-container .nes-container {
                    padding: 20px !important;
                    max-width: 500px !important;
                }

                #quiz-container .title {
                    font-size: 14px !important;
                }

                #quiz-container img {
                    width: 120px !important;
                    height: 120px !important;
                    margin: 15px auto !important;
                }

                #quiz-container p {
                    font-size: 11px !important;
                    margin: 15px 0 !important;
                }

                #quiz-container .nes-btn {
                    font-size: 9px !important;
                    padding: 10px !important;
                }

                /* Quiz feedback balloon */
                .nes-balloon {
                    font-size: 12px !important;
                    padding: 10px 15px !important;
                }
            }

            @media (max-width: 480px) {
                #qix-header {
                    height: 32px !important;
                    padding: 0 8px !important;
                }

                .qix-header-left,
                .qix-header-right {
                    gap: 5px !important;
                }

                /* Show icons, hide text on small screens */
                .qix-header-btn .btn-icon {
                    display: inline !important;
                }
                .qix-header-btn .btn-text {
                    display: none !important;
                }

                .qix-header-btn {
                    padding: 4px 8px !important;
                    font-size: 14px !important;
                    min-width: 32px !important;
                }

                .qix-username {
                    font-size: 10px !important;
                    max-width: 80px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                /* How to Play Modal */
                #how-to-play-modal .modal-content,
                #how-to-play-modal > div > div {
                    padding: 15px !important;
                    max-width: 90% !important;
                    max-height: 85vh !important;
                }

                #how-to-play-modal h2 {
                    font-size: 18px !important;
                }

                #how-to-play-modal h3 {
                    font-size: 12px !important;
                }

                #how-to-play-modal ul,
                #how-to-play-modal p {
                    font-size: 10px !important;
                    line-height: 1.4 !important;
                    margin-bottom: 12px !important;
                }

                #how-to-play-modal li {
                    margin-bottom: 4px !important;
                }

                #how-to-play-modal button {
                    padding: 8px 16px !important;
                    font-size: 12px !important;
                }

                /* Quiz Dialog */
                #quiz-container .nes-container {
                    padding: 15px !important;
                    max-width: 95% !important;
                }

                #quiz-container .title {
                    font-size: 12px !important;
                }

                #quiz-container img {
                    width: 100px !important;
                    height: 100px !important;
                    margin: 10px auto !important;
                }

                #quiz-container p {
                    font-size: 10px !important;
                    margin: 10px 0 !important;
                }

                #quiz-container > div > div > div {
                    gap: 10px !important;
                }

                #quiz-container .nes-btn {
                    font-size: 8px !important;
                    padding: 8px !important;
                }

                /* Quiz feedback balloon */
                .nes-balloon {
                    font-size: 10px !important;
                    padding: 8px 12px !important;
                    max-width: 80% !important;
                }
            }

            @media (max-width: 360px) {
                #qix-header {
                    height: 30px !important;
                    padding: 0 5px !important;
                }

                .qix-header-btn {
                    padding: 3px 6px !important;
                    font-size: 12px !important;
                    min-width: 28px !important;
                }

                .qix-username {
                    font-size: 9px !important;
                    max-width: 60px;
                }

                /* How to Play Modal */
                #how-to-play-modal h2 {
                    font-size: 16px !important;
                }

                #how-to-play-modal h3 {
                    font-size: 11px !important;
                }

                #how-to-play-modal ul,
                #how-to-play-modal p {
                    font-size: 9px !important;
                }

                /* Quiz Dialog */
                #quiz-container img {
                    width: 80px !important;
                    height: 80px !important;
                }

                #quiz-container .title {
                    font-size: 10px !important;
                }

                #quiz-container p {
                    font-size: 9px !important;
                }

                #quiz-container .nes-btn {
                    font-size: 7px !important;
                    padding: 6px !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    private createHeader(): void {
        // Remove existing header if present
        if (this.headerContainer) {
            this.headerContainer.remove();
        }

        // Inject responsive styles for QixScene
        this.injectResponsiveStyles();

        const user = AuthService.getUser();
        const username = user?.username || 'Guest';

        this.headerContainer = document.createElement('div');
        this.headerContainer.id = 'qix-header';
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
        leftDiv.className = 'qix-header-left';
        leftDiv.style.cssText = `
            display: flex;
            align-items: center;
            gap: 15px;
        `;

        // Back to menu button
        const backBtn = document.createElement('button');
        backBtn.className = 'qix-header-btn qix-back-btn';
        backBtn.innerHTML = `<span class="btn-text">← ${I18nService.t('game.menu')}</span><span class="btn-icon">←</span>`;
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
        usernameDiv.className = 'qix-username';
        usernameDiv.style.cssText = `
            color: #CCAAFF;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
        `;
        usernameDiv.innerHTML = `👤 <span style="color: #FFFFFF">${username}</span>`;

        // Game Name display
        const gameNameDiv = document.createElement('div');
        gameNameDiv.className = 'qix-gamename';
        gameNameDiv.style.cssText = `
            color: #92cc41;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
            margin-left: 10px;
            border-left: 1px solid #555;
            padding-left: 15px;
        `;
        const gameName = this.customGame ? this.customGame.name : I18nService.t('menu.play');
        gameNameDiv.innerHTML = `🎮 <span style="color: #FFFFFF">${gameName}</span>`;

        leftDiv.appendChild(backBtn);
        leftDiv.appendChild(usernameDiv);
        leftDiv.appendChild(gameNameDiv);

        // Right side container for help and logout
        const rightDiv = document.createElement('div');
        rightDiv.className = 'qix-header-right';
        rightDiv.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        // How to Play button
        const helpBtn = document.createElement('button');
        helpBtn.className = 'qix-header-btn qix-help-btn';
        helpBtn.innerHTML = `<span class="btn-text">❓ ${I18nService.t('game.howToPlay')}</span><span class="btn-icon">❓</span>`;
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
        logoutBtn.className = 'qix-header-btn qix-logout-btn';
        logoutBtn.innerHTML = `<span class="btn-text">${I18nService.t('menu.logout')}</span><span class="btn-icon">⬅</span>`;
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
                ${I18nService.t('game.howToPlayTitle')}
            </h2>
            
            <h3 style="color: #CCAAFF; margin-bottom: 10px;">🕹️ ${I18nService.t('game.controls')}</h3>
            <ul style="line-height: 1.8; margin-bottom: 20px;">
                ${I18nService.t('game.controlsList')}
            </ul>
            
            <h3 style="color: #CCAAFF; margin-bottom: 10px;">🎯 ${I18nService.t('game.objective')}</h3>
            <p style="line-height: 1.6; margin-bottom: 20px;">
                ${I18nService.t('game.objectiveText')}
            </p>
            
            <h3 style="color: #CCAAFF; margin-bottom: 10px;">📜 ${I18nService.t('game.rules')}</h3>
            <ul style="line-height: 1.8; margin-bottom: 20px;">
                ${I18nService.t('game.rulesList')}
            </ul>
            
            <h3 style="color: #CCAAFF; margin-bottom: 10px;">⚠️ ${I18nService.t('game.dangers')}</h3>
            <ul style="line-height: 1.8; margin-bottom: 20px;">
                ${I18nService.t('game.dangersList')}
            </ul>
            
            <h3 style="color: #CCAAFF; margin-bottom: 10px;">💡 ${I18nService.t('game.tips')}</h3>
            <ul style="line-height: 1.8; margin-bottom: 25px;">
                ${I18nService.t('game.tipsList')}
            </ul>
        `;

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = I18nService.t('game.gotIt');
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

    private async goToMenu(): Promise<void> {
        // End the current session
        if (sessionStore.hasActiveSession()) {
            try {
                await sessionStore.endSession();
            } catch (error) {
                logger.error('[QixScene] Failed to end session:', error);
            }
        }
        this.cleanupHeader();

        // Clean up virtual D-pad if it exists
        if (this.virtualDpad) {
            this.virtualDpad.destroy();
            this.virtualDpad = null;
        }

        this.scene.start('MenuScene');
    }

    private async handleLogout(): Promise<void> {
        // End session before logging out
        if (sessionStore.hasActiveSession()) {
            try {
                await sessionStore.endSession();
            } catch (error) {
                logger.error('[QixScene] Failed to end session:', error);
            }
        }

        // Disconnect WebSocket
        websocketService.disconnect();

        AuthService.logout();
        this.cleanupHeader();

        // Clean up virtual D-pad if it exists
        if (this.virtualDpad) {
            this.virtualDpad.destroy();
            this.virtualDpad = null;
        }
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

        // Clean up virtual D-pad if it exists
        if (this.virtualDpad) {
            this.virtualDpad.destroy();
            this.virtualDpad = null;
        }

        // Reset the image overlay when leaving the scene
        ImageOverlay.getInstance().reset();
        ImageOverlay.getInstance().hide();

        // Reset padding when leaving game scene
        const gameContainer = document.getElementById('content');
        if (gameContainer) {
            gameContainer.style.paddingTop = '0';
        }
    }

    update(time: number, delta: number) {
        // Guard against uninitialized state
        if (!this.pauseControl || !this.grid || !this.player) {
            return;
        }

        if (this.pauseControl.isPaused(time)) {
            return;
        }

        // Combine keyboard and virtual D-pad inputs
        const activeCursors = this.virtualDpad
            ? InputManager.combine(this.cursors, this.virtualDpad.getCursors())
            : this.cursors;

        if (this.grid.isIllegalMove(this.player, activeCursors)) {
            return;
        }

        this.player.move(activeCursors);
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

        // Play death sound
        audioService.playSFX('death');

        // Record death for score tracking
        sessionStore.recordDeath();

        // Hide overlay so text is visible
        ImageOverlay.getInstance().hide();
        let winText = this.createWinText(I18nService.t('game.ouch'), "#000000");

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

    private getTextOptions() {
        const screenWidth = window.innerWidth;
        const isMobile = screenWidth <= 480;
        const isTablet = screenWidth <= 768 && screenWidth > 480;
        const fontSize = isMobile ? '18px' : isTablet ? '24px' : '30px';
        const padding = isMobile ? { x: 6, y: 6 } : { x: 10, y: 10 };

        return {
            fontFamily: 'Courier',
            fontSize,
            color: '#FFFF00',
            align: 'center',
            radiusX: '10px',
            radiusY: '10px',
            padding
        };
    }

    passLevel(time: number) {
        this.pauseControl.pauseForWin(time);
        this.cameras.main.shake(300, .005);

        // Play level complete sound
        audioService.playSFX('levelComplete');

        // Update territory percentage for score calculation
        const territoryPercentage = this.grid.filledPolygons.percentArea();
        sessionStore.updateTerritory(territoryPercentage);

        // First, reveal the full image so player can see it
        ImageOverlay.getInstance().revealFullImage();
        let winText = this.createWinText(I18nService.t('game.levelComplete', this.levels.currentLevel), "#000000");

        const _this = this;

        // Check if this is the last level in a custom game
        const isLastCustomLevel = this.customGame &&
            (this.currentLevelIndex >= this.customGame.levels.length - 1);

        // Show full image for a moment, then show quiz
        setTimeout(function () {
            winText.destroy();

            // Show the quiz dialog
            _this.showQuizDialog(isLastCustomLevel);
        }, customConfig.levelWinPauseMs);
    }

    private async showQuizDialog(isLastLevel: boolean) {
        // Get current Pokemon info
        const currentPokemon = this.customGame ?
            this.customGame.levels[this.currentLevelIndex] :
            (this.endlessModePokemon ? {
                pokemonName: this.endlessModePokemon.name,
                pokemonSprite: this.endlessModePokemon.spriteUrl,
                pokemonNameJP: this.endlessModePokemon.name_jp
            } : { pokemonName: 'Mystery Pokemon', pokemonSprite: ImageOverlay.getInstance().getCurrentImageUrl() });

        logger.log('[QixScene] Generating Quiz for:', {
            gameMode: this.customGame ? 'Custom' : 'Endless',
            pokemonName: currentPokemon.pokemonName,
            pokemonNameJP: (currentPokemon as any).pokemonNameJP,
            spriteUrl: currentPokemon.pokemonSprite
        });

        try {
            // Generate quiz question
            const allPokemonNames = this.customGame ?
                this.customGame.levels.map(l => l.pokemonName) :
                [];

            const quiz = await QuizService.generateQuiz(
                currentPokemon.pokemonName,
                currentPokemon.pokemonSprite,
                allPokemonNames,
                (currentPokemon as any).pokemonNameJP
            );

            // Create quiz UI
            this.createQuizUI(quiz, isLastLevel);
        } catch (error) {
            logger.error('Failed to generate quiz:', error);
            // If quiz fails, just proceed to next level
            this.proceedToNextLevel(isLastLevel);
        }
    }

    private createQuizUI(quiz: QuizQuestion, isLastLevel: boolean) {
        // Create DOM container for quiz
        const quizContainer = document.createElement('div');
        quizContainer.id = 'quiz-container';
        quizContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;

        const quizBox = document.createElement('div');
        quizBox.className = 'nes-container is-dark with-title';
        quizBox.style.cssText = `
            max-width: 600px;
            width: 90%;
            padding: 30px;
        `;

        const title = document.createElement('p');
        title.className = 'title';
        title.textContent = 'QUIZ TIME!';
        title.style.cssText = 'color: #92cc41; font-size: 16px; text-align: center;';
        quizBox.appendChild(title);

        // Show Pokemon image
        const pokemonImg = document.createElement('img');
        pokemonImg.src = quiz.spriteUrl;
        pokemonImg.style.cssText = `
            display: block;
            margin: 20px auto;
            width: 150px;
            height: 150px;
            image-rendering: pixelated;
        `;
        quizBox.appendChild(pokemonImg);

        // Question
        const question = document.createElement('p');
        question.textContent = quiz.question;
        question.style.cssText = 'font-size: 12px; text-align: center; margin: 20px 0; color: #fff;';
        quizBox.appendChild(question);

        // Choices
        const choicesContainer = document.createElement('div');
        choicesContainer.style.cssText = 'display: flex; flex-direction: column; gap: 15px; margin: 20px 0;';

        quiz.choices.forEach((choice, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'nes-btn';
            btn.textContent = choice.toUpperCase();
            btn.style.cssText = 'width: 100%; font-size: 10px; text-transform: capitalize;';

            btn.addEventListener('click', () => {
                this.handleQuizAnswer(choice, quiz.correctAnswer, isLastLevel, quizContainer);
            });

            choicesContainer.appendChild(btn);
        });

        quizBox.appendChild(choicesContainer);
        quizContainer.appendChild(quizBox);
        document.body.appendChild(quizContainer);
    }

    private handleQuizAnswer(selectedAnswer: string, correctAnswer: string, isLastLevel: boolean, quizContainer: HTMLDivElement) {
        logger.log('[QixScene] Quiz answer check:', {
            selectedAnswer,
            correctAnswer,
            selectedLower: selectedAnswer.toLowerCase(),
            correctLower: correctAnswer.toLowerCase()
        });
        const isCorrect = selectedAnswer.toLowerCase() === correctAnswer.toLowerCase();
        logger.log('[QixScene] Is correct:', isCorrect);

        // Play quiz result sound
        audioService.playSFX(isCorrect ? 'quizCorrect' : 'quizWrong');

        // Record quiz attempt
        sessionStore.recordQuizAttempt();

        // Show feedback
        const feedback = document.createElement('div');
        feedback.className = `nes-balloon from-left ${isCorrect ? 'is-success' : 'is-error'}`;
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 3000;
            font-size: 14px;
        `;
        feedback.innerHTML = `<p>${isCorrect ? '✓ Correct! Well done!' : '✗ Wrong answer! Try again!'}</p>`;
        document.body.appendChild(feedback);

        setTimeout(() => {
            feedback.remove();

            if (isCorrect) {
                // Remove quiz and proceed
                quizContainer.remove();
                // Submit score for completed level
                this.submitLevelScore(isLastLevel);
            }
            // If wrong, keep quiz open for another attempt
        }, 2000);
    }

    private async submitLevelScore(isLastLevel: boolean) {
        logger.log('[QixScene] submitLevelScore called, isLastLevel:', isLastLevel);
        try {
            logger.log('[QixScene] Calling sessionStore.completeLevel()...');
            const result = await sessionStore.completeLevel();
            logger.log('[QixScene] completeLevel result:', result);
            if (result) {
                logger.log('[QixScene] Score submitted:', result.breakdown.totalScore);
                // Show score breakdown toast
                this.showScoreToast(result);
            } else {
                logger.warn('[QixScene] completeLevel returned null/undefined');
            }
        } catch (error) {
            logger.error('[QixScene] Failed to submit score:', error);
        }

        // Proceed to next level after score submission
        this.proceedToNextLevel(isLastLevel);
    }

    private showScoreToast(result: ScoreSubmissionResult) {
        const toast = document.createElement('div');
        toast.className = 'nes-container is-dark score-toast';
        toast.style.cssText = `
            position: fixed;
            top: 60px;
            right: 20px;
            z-index: 3000;
            padding: 15px;
            font-size: 10px;
            animation: slideIn 0.3s ease-out;
            max-width: 280px;
        `;

        // Add responsive styles
        const responsiveStyle = document.createElement('style');
        responsiveStyle.id = 'score-toast-responsive';
        if (!document.getElementById('score-toast-responsive')) {
            responsiveStyle.textContent = `
                @media (max-width: 480px) {
                    .score-toast {
                        top: 50px !important;
                        right: 10px !important;
                        left: 10px !important;
                        max-width: none !important;
                        padding: 10px !important;
                        font-size: 9px !important;
                    }
                }
            `;
            document.head.appendChild(responsiveStyle);
        }

        const { breakdown, rankings, achievements, pokemon } = result;
        let achievementsHtml = '';
        if (achievements.unlocked.length > 0) {
            achievementsHtml = `
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #444;">
                    <div style="color: #ffd700;">Achievement Unlocked!</div>
                    ${achievements.unlocked.map(a => `<div>${a.icon} ${a.name}</div>`).join('')}
                </div>
            `;
        }

        let rankChangeHtml = '';
        if (rankings.rankChange !== 0) {
            const direction = rankings.rankChange > 0 ? '↑' : '↓';
            const color = rankings.rankChange > 0 ? '#92cc41' : '#e76e55';
            rankChangeHtml = `<span style="color: ${color};">${direction}${Math.abs(rankings.rankChange)}</span>`;
        }

        toast.innerHTML = `
            <div style="color: #92cc41; font-size: 14px; margin-bottom: 8px;">
                +${breakdown.totalScore.toLocaleString()} pts
            </div>
            <div style="color: #888; font-size: 9px;">
                Territory: ${breakdown.territoryScore} | Time: +${breakdown.timeBonus} | Lives: +${breakdown.lifeBonus}
            </div>
            ${breakdown.streakBonus > 0 ? `<div style="color: #ffd700;">Streak Bonus: +${breakdown.streakBonus}</div>` : ''}
            ${rankings.isNewPersonalBest ? '<div style="color: #92cc41;">New Personal Best!</div>' : ''}
            <div style="margin-top: 5px;">Rank: #${rankings.globalRank} ${rankChangeHtml}</div>
            ${pokemon.isNewReveal ? `<div style="color: #ffd700;">New Pokemon: ${pokemon.pokemonName}!</div>` : ''}
            ${achievementsHtml}
        `;

        document.body.appendChild(toast);

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        // Remove toast after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                toast.remove();
                style.remove();
            }, 300);
        }, 4000);
    }

    private proceedToNextLevel(isLastLevel: boolean) {
        // Hide overlay so text is visible
        ImageOverlay.getInstance().hide();

        if (isLastLevel) {
            // Game complete! Show congratulations
            this.showGameComplete();
        } else {
            const winText = this.createWinText(I18nService.t('game.sweet', this.levels.currentLevel + 1), "#000000");

            setTimeout(() => {
                winText.destroy();
                this.levels.nextLevel();
                // Pass game data to next level
                // Note: currentLevelIndex already incremented by nextLevel() -> advanceLevel()
                this.scene.restart({
                    gameId: this.gameId,
                    customGame: this.customGame,
                    levelIndex: this.currentLevelIndex
                });
            }, customConfig.levelWinPauseMs / 2);
        }
    }

    private async showGameComplete(): Promise<void> {
        // End the session and get final stats
        let finalScore = sessionStore.getTotalScore();
        let levelsCompleted = sessionStore.getLevelsCompleted();

        if (sessionStore.hasActiveSession()) {
            try {
                await sessionStore.endSession();
            } catch (error) {
                logger.error('[QixScene] Failed to end session:', error);
            }
        }

        // Hide the game overlay
        ImageOverlay.getInstance().hide();

        // Determine if mobile for responsive sizing
        const screenWidth = window.innerWidth;
        const isMobile = screenWidth <= 480;
        const isTablet = screenWidth <= 768 && screenWidth > 480;

        // Responsive font sizes
        const fontSizes = {
            congrats: isMobile ? '22px' : isTablet ? '28px' : '36px',
            message: isMobile ? '14px' : isTablet ? '18px' : '24px',
            levels: isMobile ? '12px' : isTablet ? '16px' : '20px',
            score: isMobile ? '14px' : isTablet ? '18px' : '22px',
            button: isMobile ? '12px' : isTablet ? '14px' : '18px'
        };

        // Responsive spacing
        const spacing = {
            congratsY: isMobile ? -70 : isTablet ? -85 : -100,
            messageY: isMobile ? -30 : isTablet ? -35 : -40,
            levelsY: 0,
            scoreY: isMobile ? 30 : isTablet ? 35 : 40,
            buttonY: isMobile ? 65 : isTablet ? 75 : 90
        };

        // Responsive button size
        const buttonWidth = isMobile ? 150 : isTablet ? 175 : 200;
        const buttonHeight = isMobile ? 38 : isTablet ? 44 : 50;

        // Create dark overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.8);
        overlay.fillRect(0, 0, config.width as number, customConfig.frameHeight as number);
        overlay.setDepth(999);

        // Congratulations text
        const centerX = (config.width as number) / 2;
        const centerY = (customConfig.frameHeight as number) / 2;

        const congratsText = this.add.text(centerX, centerY + spacing.congratsY, I18nService.t('game.congrats'), {
            fontFamily: 'Arial',
            fontSize: fontSizes.congrats,
            color: '#FFD700',
            align: 'center'
        });
        congratsText.setOrigin(0.5);
        congratsText.setDepth(1000);

        const gameName = this.customGame?.name || 'the game';
        const messageText = this.add.text(centerX, centerY + spacing.messageY, I18nService.t('game.completed', gameName), {
            fontFamily: 'Arial',
            fontSize: fontSizes.message,
            color: '#FFFFFF',
            align: 'center'
        });
        messageText.setOrigin(0.5);
        messageText.setDepth(1000);

        const levelsText = this.add.text(centerX, centerY + spacing.levelsY, I18nService.t('game.pokemonRevealed', this.customGame?.levels.length || levelsCompleted), {
            fontFamily: 'Arial',
            fontSize: fontSizes.levels,
            color: '#CCAAFF',
            align: 'center'
        });
        levelsText.setOrigin(0.5);
        levelsText.setDepth(1000);

        // Show final score
        const scoreText = this.add.text(centerX, centerY + spacing.scoreY, I18nService.t('game.finalScore', finalScore.toLocaleString()), {
            fontFamily: 'Arial',
            fontSize: fontSizes.score,
            color: '#92cc41',
            align: 'center'
        });
        scoreText.setOrigin(0.5);
        scoreText.setDepth(1000);

        // Create return to menu button using Graphics (Phaser 3.10 compatible)
        const buttonX = centerX - buttonWidth / 2;
        const buttonY = centerY + spacing.buttonY;

        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x4CAF50, 1);
        buttonBg.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        buttonBg.setDepth(1000);
        buttonBg.setInteractive(new Phaser.Geom.Rectangle(buttonX, buttonY, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains);

        const buttonText = this.add.text(centerX, buttonY + buttonHeight / 2, I18nService.t('game.returnMenu'), {
            fontFamily: 'Arial',
            fontSize: fontSizes.button,
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
        const screenWidth = window.innerWidth;
        const isMobile = screenWidth <= 480;
        const x = isMobile ? ((config.width as number) / 4) : ((config.width as number) / 3);
        const y = ((customConfig.frameHeight as number) / 2) - (isMobile ? 25 : 35);
        let winText = this.add.text(x, y, message, this.getTextOptions());
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

    isPaused(time?: number): boolean {
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