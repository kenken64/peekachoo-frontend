import 'phaser';
import * as AuthService from '../services/auth-service';
import { GameService, Game } from '../services/game-service';
import { ImageOverlay } from '../objects/image-overlay';
import { websocketService } from '../services/websocket-service';
import { logger } from '../config';
import { audioService } from '../services/audio-service';
import { I18nService } from '../services/i18n-service';

export class MenuScene extends Phaser.Scene {
    private domContainer: HTMLDivElement | null = null;
    private myGames: Game[] = [];
    private publishedGames: Game[] = [];

    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Reset state on scene create to ensure fresh data for current user
        this.myGames = [];
        this.publishedGames = [];
        this.domContainer = null;

        // Debug: Log current user info
        const currentUser = AuthService.getUser();
        const currentToken = AuthService.getToken();
        logger.log('[MenuScene] Creating menu for user:', currentUser?.username, 'Token:', currentToken?.substring(0, 20) + '...');

        // Play menu music
        audioService.playMusic('menuMusic');

        this.createDOMUI();
        this.loadGames();
    }

    private createDOMUI() {
        const user = AuthService.getUser();

        this.domContainer = document.createElement('div');
        this.domContainer.id = 'menu-container';
        this.domContainer.innerHTML = `
            <style>
                #menu-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: #212529;
                    color: white;
                    overflow-y: auto;
                    z-index: 1000;
                }

                .menu-header {
                    padding: 20px 30px;
                    background: rgba(0,0,0,0.3);
                    border-bottom: 4px solid #212529;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .menu-header h1 {
                    margin: 0;
                    font-size: 16px;
                    color: #92cc41;
                }

                .menu-user-info {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    font-size: 10px;
                }

                .menu-username {
                    color: #92cc41;
                }

                .menu-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 30px;
                }

                .menu-actions {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 40px;
                    flex-wrap: wrap;
                    justify-content: center;
                }

                .menu-action-btn {
                    flex: 1;
                    min-width: 200px;
                    max-width: 400px;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    font-size: 12px;
                }

                .menu-btn-icon {
                    font-size: 32px;
                }

                .menu-section {
                    margin-bottom: 40px;
                }

                .menu-section h2 {
                    font-size: 14px;
                    color: #92cc41;
                    margin-bottom: 20px;
                }

                .menu-games-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                }

                .menu-game-card {
                    padding: 15px;
                    cursor: pointer;
                    transition: transform 0.2s;
                    background: #212529;
                }

                .menu-game-card:hover {
                    transform: translateY(-3px);
                }

                .menu-game-title {
                    font-size: 12px;
                    margin-bottom: 10px;
                    color: #92cc41;
                }

                .menu-game-desc {
                    color: #aaa;
                    font-size: 8px;
                    margin-bottom: 12px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .menu-game-meta {
                    display: flex;
                    justify-content: space-between;
                    font-size: 8px;
                    color: #888;
                    margin-bottom: 12px;
                }

                .menu-game-levels {
                    display: flex;
                    gap: 5px;
                    margin: 12px 0;
                    flex-wrap: wrap;
                }

                .menu-game-level-img {
                    width: 40px;
                    height: 40px;
                    border: 2px solid #212529;
                    background: rgba(0,0,0,0.3);
                    image-rendering: pixelated;
                }

                .menu-game-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 2px solid rgba(255,255,255,0.1);
                    flex-wrap: wrap;
                }

                .menu-game-btn {
                    flex: 1;
                    font-size: 8px;
                    min-width: 80px;
                }

                .menu-empty {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                    font-size: 10px;
                }

                .menu-loading {
                    text-align: center;
                    padding: 40px;
                    color: #92cc41;
                    font-size: 10px;
                }

                /* Toast notifications with NES style */
                .menu-toast-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 3000;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .menu-toast {
                    animation: menu-toast-slide-in 0.3s ease-out;
                    font-size: 10px;
                }

                @keyframes menu-toast-slide-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }

                @keyframes menu-toast-slide-out {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }

                /* Mobile Responsive Styles */
                @media (max-width: 768px) {
                    .menu-header {
                        padding: 15px 20px;
                        flex-wrap: wrap;
                        gap: 10px;
                    }

                    .menu-header h1 {
                        font-size: 14px;
                    }

                    .menu-user-info {
                        font-size: 9px;
                        gap: 10px;
                    }

                    .menu-content {
                        padding: 20px 15px;
                    }

                    .menu-actions {
                        gap: 10px;
                        margin-bottom: 25px;
                    }

                    .menu-action-btn {
                        min-width: 150px;
                        padding: 15px;
                        font-size: 10px;
                    }

                    .menu-btn-icon {
                        font-size: 24px;
                    }

                    .menu-section h2 {
                        font-size: 12px;
                        margin-bottom: 15px;
                    }

                    .menu-games-grid {
                        grid-template-columns: 1fr;
                        gap: 15px;
                    }

                    .menu-game-card {
                        padding: 12px;
                    }

                    .menu-game-title {
                        font-size: 11px;
                    }

                    .menu-game-desc {
                        font-size: 7px;
                    }

                    .menu-game-meta {
                        font-size: 7px;
                    }

                    .menu-game-level-img {
                        width: 35px;
                        height: 35px;
                    }

                    .menu-game-actions {
                        flex-wrap: wrap;
                    }

                    .menu-game-btn {
                        font-size: 7px;
                        min-width: 60px;
                    }
                }

                @media (max-width: 480px) {
                    .menu-header {
                        padding: 12px 15px;
                    }

                    .menu-header h1 {
                        font-size: 12px;
                    }

                    .menu-user-info {
                        font-size: 8px;
                        gap: 8px;
                    }

                    #menu-logout {
                        font-size: 7px !important;
                        padding: 4px 8px !important;
                    }

                    .menu-content {
                        padding: 15px 10px;
                    }

                    .menu-actions {
                        flex-direction: column;
                        gap: 8px;
                        margin-bottom: 20px;
                    }

                    .menu-action-btn {
                        min-width: unset;
                        width: 100%;
                        max-width: 100%;
                        padding: 12px;
                        font-size: 9px;
                        flex-direction: row;
                        justify-content: center;
                    }

                    .menu-btn-icon {
                        font-size: 20px;
                    }

                    .menu-section {
                        margin-bottom: 25px;
                    }

                    .menu-section h2 {
                        font-size: 11px;
                    }

                    .menu-game-card {
                        padding: 10px;
                    }

                    .menu-game-title {
                        font-size: 10px;
                    }

                    .menu-game-levels {
                        gap: 3px;
                    }

                    .menu-game-level-img {
                        width: 30px;
                        height: 30px;
                    }

                    .menu-game-actions {
                        gap: 5px;
                    }

                    .menu-game-btn {
                        font-size: 6px;
                        min-width: 50px;
                        padding: 6px 8px;
                    }

                    .menu-empty {
                        padding: 25px;
                        font-size: 9px;
                    }

                    .menu-toast-container {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                    }

                    .menu-toast {
                        font-size: 8px;
                    }
                }

                @media (max-width: 360px) {
                    .menu-header h1 {
                        font-size: 10px;
                    }

                    .menu-action-btn {
                        padding: 10px;
                        font-size: 8px;
                    }

                    .menu-btn-icon {
                        font-size: 18px;
                    }

                    .menu-game-btn {
                        font-size: 5px;
                        min-width: 45px;
                        padding: 5px 6px;
                    }
                }

                /* Japanese and Chinese Font Adjustments */
                body.lang-jp .menu-header h1, body.lang-cn .menu-header h1 { font-size: 18px; }
                body.lang-jp .menu-user-info, body.lang-cn .menu-user-info { font-size: 12px; }
                body.lang-jp .menu-action-btn, body.lang-cn .menu-action-btn { font-size: 14px; }
                body.lang-jp .menu-section h2, body.lang-cn .menu-section h2 { font-size: 16px; }
                body.lang-jp .menu-game-title, body.lang-cn .menu-game-title { font-size: 14px; }
                body.lang-jp .menu-game-desc, body.lang-cn .menu-game-desc { font-size: 10px; }
                body.lang-jp .menu-game-meta, body.lang-cn .menu-game-meta { font-size: 10px; }
                body.lang-jp .menu-game-btn, body.lang-cn .menu-game-btn { font-size: 10px; }
                body.lang-jp #menu-lang-select, body.lang-cn #menu-lang-select,
                body.lang-jp #menu-sound-toggle, body.lang-cn #menu-sound-toggle,
                body.lang-jp #menu-donation, body.lang-cn #menu-donation,
                body.lang-jp #menu-logout, body.lang-cn #menu-logout { font-size: 10px !important; }
            </style>

            <div class="menu-header">
                <h1>🎮 ${I18nService.t('app.title')}</h1>
                <div class="menu-user-info">
                    <span class="menu-username">👤 ${user?.username || 'Player'}</span>
                    ${user?.level ? `<span class="menu-level" style="color: #FFD700;">Lv.${user.level}</span>` : ''}
                    <div class="nes-select is-dark" style="width: auto; display: inline-block; margin: 0;">
                        <select id="menu-lang-select" style="font-size: 8px; padding: 0 25px 0 10px; height: 28px; min-width: 140px;">
                            <option value="en" ${I18nService.getLang() === 'en' ? 'selected' : ''}>🇺🇸 English</option>
                            <option value="jp" ${I18nService.getLang() === 'jp' ? 'selected' : ''}>🇯🇵 日本語 (Japanese)</option>
                            <option value="cn" ${I18nService.getLang() === 'cn' ? 'selected' : ''}>🇨🇳 中文 (Chinese)</option>
                        </select>
                    </div>
                    <button type="button" class="nes-btn" id="menu-sound-toggle" style="font-size: 8px;" title="${I18nService.t('menu.toggleSound')}">${audioService.isMuted() ? '🔇' : '🔊'}</button>
                    <button type="button" class="nes-btn is-warning" id="menu-donation" style="font-size: 8px;">${I18nService.t('menu.donation')}</button>
                    <button type="button" class="nes-btn is-error" id="menu-logout" style="font-size: 8px;">${I18nService.t('menu.logout')}</button>
                </div>
            </div>

            <div class="menu-content">
                <div class="menu-actions">
                    <button type="button" class="nes-btn is-primary menu-action-btn" id="menu-play">
                        <span class="menu-btn-icon">🕹️</span>
                        <span>${I18nService.t('menu.play')}</span>
                    </button>
                    <button type="button" class="nes-btn is-success menu-action-btn" id="menu-create">
                        <span class="menu-btn-icon">✨</span>
                        <span>${I18nService.t('menu.create')}</span>
                    </button>
                </div>
                <div class="menu-actions" style="margin-top: -20px;">
                    <button type="button" class="nes-btn is-warning menu-action-btn" id="menu-leaderboard">
                        <span class="menu-btn-icon">🏆</span>
                        <span>${I18nService.t('menu.leaderboard')}</span>
                    </button>
                    <button type="button" class="nes-btn menu-action-btn" id="menu-stats" style="background: #9b59b6; border-color: #8e44ad;">
                        <span class="menu-btn-icon">📊</span>
                        <span>${I18nService.t('menu.stats')}</span>
                    </button>
                </div>

                <div class="menu-section">
                    <h2>📁 ${I18nService.t('menu.myGames')}</h2>
                    <div id="menu-my-games" class="menu-games-grid">
                        <div class="menu-loading">${I18nService.t('menu.loading')}</div>
                    </div>
                </div>

                <div class="menu-section">
                    <h2>🌍 ${I18nService.t('menu.communityGames')}</h2>
                    <div id="menu-published-games" class="menu-games-grid">
                        <div class="menu-loading">${I18nService.t('menu.loading')}</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.domContainer);

        // Setup event listeners
        document.getElementById('menu-logout')?.addEventListener('click', () => this.logout());
        document.getElementById('menu-play')?.addEventListener('click', () => this.playClassic());
        document.getElementById('menu-create')?.addEventListener('click', () => this.createGame());
        document.getElementById('menu-leaderboard')?.addEventListener('click', () => this.openLeaderboard());
        document.getElementById('menu-stats')?.addEventListener('click', () => this.openStats());
        document.getElementById('menu-donation')?.addEventListener('click', () => this.showDonationPopup());
        document.getElementById('menu-sound-toggle')?.addEventListener('click', () => this.toggleSound());
        document.getElementById('menu-lang-select')?.addEventListener('change', (e) => {
            const lang = (e.target as HTMLSelectElement).value;
            this.changeLanguage(lang);
        });
    }

    private toggleSound() {
        const isMuted = audioService.toggleMute();
        const btn = document.getElementById('menu-sound-toggle');
        if (btn) {
            btn.textContent = isMuted ? '🔇' : '🔊';
        }
        // Play a click sound to confirm (only if unmuting)
        if (!isMuted) {
            audioService.playSFX('menuClick');
        }
    }

    private async loadGames() {
        try {
            logger.log('[MenuScene] Loading games with token:', AuthService.getToken()?.substring(0, 20) + '...');
            const [myGames, publishedGames] = await Promise.all([
                GameService.getMyGames(),
                GameService.getPublishedGames()
            ]);

            logger.log('[MenuScene] Loaded', myGames.length, 'my games,', publishedGames.length, 'published games');

            this.myGames = myGames;
            this.publishedGames = publishedGames;

            this.renderMyGames();
            this.renderPublishedGames();
        } catch (error: any) {
            logger.error('[MenuScene] Failed to load games:', error);
        }
    }

    private renderMyGames() {
        const container = document.getElementById('menu-my-games');
        if (!container) return;

        if (this.myGames.length === 0) {
            container.innerHTML = `<div class="nes-container is-dark menu-empty">${I18nService.t('menu.noMyGames')}</div>`;
            return;
        }

        container.innerHTML = this.myGames.map(game => this.renderGameCard(game, true)).join('');
        this.attachGameCardListeners(container, true);
    }

    private renderPublishedGames() {
        const container = document.getElementById('menu-published-games');
        if (!container) return;

        if (this.publishedGames.length === 0) {
            container.innerHTML = `<div class="nes-container is-dark menu-empty">${I18nService.t('menu.noCommunityGames')}</div>`;
            return;
        }

        container.innerHTML = this.publishedGames.map(game => this.renderGameCard(game, false)).join('');
        this.attachGameCardListeners(container, false);
    }

    private renderGameCard(game: Game, isOwner: boolean): string {
        const levelPreviews = game.levels.slice(0, 4).map(level =>
            `<img class="menu-game-level-img" src="${level.pokemonSprite}" alt="${level.pokemonName}" onerror="this.style.display='none'">`
        ).join('');

        const statusBadge = isOwner
            ? `<span class="nes-badge ${game.isPublished ? 'is-primary' : 'is-dark'}" style="font-size: 8px;"><span class="${game.isPublished ? 'is-primary' : 'is-dark'}">${game.isPublished ? I18nService.t('menu.published') : I18nService.t('menu.draft')}</span></span>`
            : '';

        // Show active players count if any (for owner's published games)
        const activePlayers = isOwner && game.isPublished && game.activePlayerCount && game.activePlayerCount > 0
            ? `<span style="color: #92cc41; margin-left: 10px;">${I18nService.t('menu.playing', game.activePlayerCount)}</span>`
            : '';

        const ownerActions = isOwner ? `
            <div class="menu-game-actions">
                <button type="button" class="nes-btn is-success menu-game-btn" data-action="play" data-game-id="${game.id}">${I18nService.t('menu.playBtn')}</button>
                <button type="button" class="nes-btn is-warning menu-game-btn" data-action="edit" data-game-id="${game.id}">${I18nService.t('menu.editBtn')}</button>
                <button type="button" class="nes-btn ${game.isPublished ? 'is-dark' : 'is-primary'} menu-game-btn" data-action="publish" data-game-id="${game.id}">${game.isPublished ? I18nService.t('menu.unpublishBtn') : I18nService.t('menu.publishBtn')}</button>
                <button type="button" class="nes-btn is-error menu-game-btn" data-action="delete" data-game-id="${game.id}">${I18nService.t('menu.deleteBtn')}</button>
            </div>
        ` : '';

        return `
            <div class="nes-container is-dark menu-game-card" data-game-id="${game.id}" data-is-owner="${isOwner}">
                <div class="menu-game-title">${game.name} ${statusBadge}${activePlayers}</div>
                <div class="menu-game-desc">${game.description || I18nService.t('menu.noDescription')}</div>
                <div class="menu-game-levels">${levelPreviews}</div>
                <div class="menu-game-meta">
                    <span>${I18nService.t('menu.levelsCount', game.levels.length)}</span>
                    <span>${isOwner ? '' : `${I18nService.t('menu.byCreator', game.creatorName)} • `}${I18nService.t('menu.playsCount', game.playCount || 0)}</span>
                </div>
                ${ownerActions}
            </div>
        `;
    }

    private attachGameCardListeners(container: HTMLElement, isOwner: boolean) {
        if (isOwner) {
            // For owner's games, attach action button listeners
            container.querySelectorAll('.menu-game-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = (btn as HTMLElement).dataset.action;
                    const gameId = (btn as HTMLElement).dataset.gameId;
                    if (gameId && action) {
                        this.handleGameAction(gameId, action);
                    }
                });
            });
        } else {
            // For community games, clicking anywhere plays the game
            container.querySelectorAll('.menu-game-card').forEach(card => {
                card.addEventListener('click', () => {
                    const gameId = (card as HTMLElement).dataset.gameId;
                    if (gameId) {
                        this.openGame(gameId, false);
                    }
                });
            });
        }
    }

    private async handleGameAction(gameId: string, action: string) {
        const game = this.myGames.find(g => g.id === gameId);
        if (!game) return;

        switch (action) {
            case 'play':
                this.openGame(gameId, true);
                break;
            case 'edit':
                this.editGame(gameId);
                break;
            case 'publish':
                await this.togglePublish(gameId);
                break;
            case 'delete':
                await this.deleteGame(gameId, game.name);
                break;
        }
    }

    private editGame(gameId: string) {
        this.cleanup();
        this.scene.start('GameCreateScene', { editGameId: gameId });
    }

    private async togglePublish(gameId: string) {
        try {
            const isPublished = await GameService.togglePublish(gameId);
            // Update local state
            const game = this.myGames.find(g => g.id === gameId);
            if (game) {
                game.isPublished = isPublished;
            }
            // Re-render
            this.renderMyGames();
            await this.loadGames(); // Refresh published games list too
        } catch (error: any) {
            this.showToast('Failed to update publish status: ' + error.message, 'error');
        }
    }

    private changeLanguage(lang: string) {
        if (lang === 'en' || lang === 'jp' || lang === 'cn') {
            I18nService.setLang(lang);
            // Re-render the entire scene to update texts
            this.cleanup();
            this.scene.restart();
        }
    }

    private async deleteGame(gameId: string, gameName: string) {
        if (!confirm(`Are you sure you want to delete "${gameName}"? This cannot be undone.`)) {
            return;
        }

        try {
            await GameService.deleteGame(gameId);
            // Remove from local state
            this.myGames = this.myGames.filter(g => g.id !== gameId);
            // Re-render
            this.renderMyGames();
            this.showToast('Game deleted successfully', 'success');
        } catch (error: any) {
            this.showToast('Failed to delete game: ' + error.message, 'error');
        }
    }

    private openGame(gameId: string, isOwner: boolean) {
        // For now, start playing the game
        // TODO: If owner, show edit options
        this.cleanup();
        this.scene.start('Qix', { gameId });
    }

    private playClassic() {
        this.cleanup();
        this.scene.start('Qix');
    }

    private createGame() {
        this.cleanup();
        this.scene.start('GameCreateScene');
    }

    private openLeaderboard() {
        this.cleanup();
        this.scene.start('LeaderboardScene');
    }

    private openStats() {
        this.cleanup();
        this.scene.start('StatsScene');
    }

    private showDonationPopup() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'donation-popup-overlay';
        overlay.innerHTML = `
            <style>
                #donation-popup-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.85);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 5000;
                    cursor: pointer;
                }
                .donation-popup-content {
                    cursor: default;
                    text-align: center;
                    padding: 30px;
                    max-width: 90%;
                }
                .donation-popup-content img {
                    width: 250px;
                    height: 250px;
                    margin: 20px auto;
                    display: block;
                    image-rendering: pixelated;
                    border: 4px solid #92cc41;
                }
                .donation-popup-text {
                    font-size: 12px;
                    color: #fff;
                    margin: 20px 0;
                    line-height: 1.8;
                }
                .donation-popup-close {
                    font-size: 10px;
                    margin-top: 20px;
                }
                @media (max-width: 480px) {
                    .donation-popup-content img {
                        width: 200px;
                        height: 200px;
                    }
                    .donation-popup-text {
                        font-size: 10px;
                    }
                }
            </style>
            <div class="nes-container is-dark with-title donation-popup-content">
                <p class="title" style="color: #f7d51d;">Donation</p>
                <img src="assets/donation.png" alt="Donation QR Code" onerror="this.alt='QR Code not found'">
                <p class="donation-popup-text">Kindly donate if you want improvement for the game<br><br>Contact me at <a href="mailto:bunnyppl@gmail.com" style="color: #92cc41;">bunnyppl@gmail.com</a></p>
                <button type="button" class="nes-btn is-primary donation-popup-close">Close</button>
            </div>
        `;

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        // Close on button click
        overlay.querySelector('.donation-popup-close')?.addEventListener('click', () => {
            overlay.remove();
        });

        // Close on Escape key
        const escHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        document.body.appendChild(overlay);
    }

    private logout() {
        // Disconnect WebSocket
        websocketService.disconnect();

        AuthService.logout();
        this.cleanup();
        // Ensure game overlay is hidden when logging out
        ImageOverlay.getInstance().fullReset();
        ImageOverlay.getInstance().hide();
        this.scene.start('LoginScene');
    }

    private cleanup() {
        if (this.domContainer && this.domContainer.parentNode) {
            this.domContainer.parentNode.removeChild(this.domContainer);
        }
        this.domContainer = null;
        this.myGames = [];
        this.publishedGames = [];
    }

    shutdown() {
        this.cleanup();
    }

    private showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
        // Get or create toast container
        let container = document.getElementById('menu-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'menu-toast-container';
            container.className = 'menu-toast-container';
            document.body.appendChild(container);
        }

        // Create toast element with NES style
        const toast = document.createElement('div');
        const balloonClass = type === 'success' ? 'is-success' : type === 'error' ? 'is-error' : type === 'warning' ? 'is-warning' : 'is-dark';
        toast.className = `nes-balloon from-right ${balloonClass} menu-toast`;
        toast.innerHTML = `<p>${message}</p>`;
        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'menu-toast-slide-out 0.3s ease-in forwards';
            setTimeout(() => {
                toast.remove();
                // Remove container if empty
                if (container && container.children.length === 0) {
                    container.remove();
                }
            }, 300);
        }, 3000);
    }
}
