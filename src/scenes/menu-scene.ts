import 'phaser';
import * as AuthService from '../services/auth-service';
import { GameService, Game } from '../services/game-service';
import { ImageOverlay } from '../objects/image-overlay';

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
        console.log('[MenuScene] Creating menu for user:', currentUser?.username, 'Token:', currentToken?.substring(0, 20) + '...');

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
            </style>

            <div class="menu-header">
                <h1>🎮 PEEKACHOO</h1>
                <div class="menu-user-info">
                    <span class="menu-username">👤 ${user?.username || 'Player'}</span>
                    <button type="button" class="nes-btn is-error" id="menu-logout" style="font-size: 8px;">Logout</button>
                </div>
            </div>

            <div class="menu-content">
                <div class="menu-actions">
                    <button type="button" class="nes-btn is-primary menu-action-btn" id="menu-play">
                        <span class="menu-btn-icon">🕹️</span>
                        <span>Play Classic</span>
                    </button>
                    <button type="button" class="nes-btn is-success menu-action-btn" id="menu-create">
                        <span class="menu-btn-icon">✨</span>
                        <span>Create Game</span>
                    </button>
                </div>

                <div class="menu-section">
                    <h2>📁 MY GAMES</h2>
                    <div id="menu-my-games" class="menu-games-grid">
                        <div class="menu-loading">Loading...</div>
                    </div>
                </div>

                <div class="menu-section">
                    <h2>🌍 COMMUNITY GAMES</h2>
                    <div id="menu-published-games" class="menu-games-grid">
                        <div class="menu-loading">Loading...</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.domContainer);

        // Setup event listeners
        document.getElementById('menu-logout')?.addEventListener('click', () => this.logout());
        document.getElementById('menu-play')?.addEventListener('click', () => this.playClassic());
        document.getElementById('menu-create')?.addEventListener('click', () => this.createGame());
    }

    private async loadGames() {
        try {
            console.log('[MenuScene] Loading games with token:', AuthService.getToken()?.substring(0, 20) + '...');
            const [myGames, publishedGames] = await Promise.all([
                GameService.getMyGames(),
                GameService.getPublishedGames()
            ]);

            console.log('[MenuScene] Loaded', myGames.length, 'my games,', publishedGames.length, 'published games');

            this.myGames = myGames;
            this.publishedGames = publishedGames;

            this.renderMyGames();
            this.renderPublishedGames();
        } catch (error: any) {
            console.error('[MenuScene] Failed to load games:', error);
        }
    }

    private renderMyGames() {
        const container = document.getElementById('menu-my-games');
        if (!container) return;

        if (this.myGames.length === 0) {
            container.innerHTML = '<div class="nes-container is-dark menu-empty">You haven\'t created any games yet.<br>Click "Create Game" to start!</div>';
            return;
        }

        container.innerHTML = this.myGames.map(game => this.renderGameCard(game, true)).join('');
        this.attachGameCardListeners(container, true);
    }

    private renderPublishedGames() {
        const container = document.getElementById('menu-published-games');
        if (!container) return;

        if (this.publishedGames.length === 0) {
            container.innerHTML = '<div class="nes-container is-dark menu-empty">No community games available yet.<br>Be the first to publish one!</div>';
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
            ? `<span class="nes-badge ${game.isPublished ? 'is-primary' : 'is-dark'}" style="font-size: 8px;"><span class="${game.isPublished ? 'is-primary' : 'is-dark'}">${game.isPublished ? 'Published' : 'Draft'}</span></span>`
            : '';

        const ownerActions = isOwner ? `
            <div class="menu-game-actions">
                <button type="button" class="nes-btn is-success menu-game-btn" data-action="play" data-game-id="${game.id}">Play</button>
                <button type="button" class="nes-btn is-warning menu-game-btn" data-action="edit" data-game-id="${game.id}">Edit</button>
                <button type="button" class="nes-btn ${game.isPublished ? 'is-dark' : 'is-primary'} menu-game-btn" data-action="publish" data-game-id="${game.id}">${game.isPublished ? 'Unpublish' : 'Publish'}</button>
                <button type="button" class="nes-btn is-error menu-game-btn" data-action="delete" data-game-id="${game.id}">Delete</button>
            </div>
        ` : '';

        return `
            <div class="nes-container is-dark menu-game-card" data-game-id="${game.id}" data-is-owner="${isOwner}">
                <div class="menu-game-title">${game.name} ${statusBadge}</div>
                <div class="menu-game-desc">${game.description || 'No description'}</div>
                <div class="menu-game-levels">${levelPreviews}</div>
                <div class="menu-game-meta">
                    <span>${game.levels.length} levels</span>
                    <span>${isOwner ? '' : `by ${game.creatorName} • `}${game.playCount || 0} plays</span>
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

    private logout() {
        AuthService.logout();
        this.cleanup();
        // Ensure game overlay is hidden when logging out
        ImageOverlay.getInstance().reset();
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
