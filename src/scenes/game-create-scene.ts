import 'phaser';
import { PokemonService, Pokemon } from '../services/pokemon-service';
import { GameService, GameLevel, Game } from '../services/game-service';
import * as AuthService from '../services/auth-service';

export class GameCreateScene extends Phaser.Scene {
    private gameName: string = '';
    private gameDescription: string = '';
    private selectedLevels: GameLevel[] = [];
    private searchResults: Pokemon[] = [];
    private domContainer: HTMLDivElement | null = null;
    private isLoading: boolean = false;
    private editGameId: string | null = null;
    private isEditMode: boolean = false;

    constructor() {
        super({ key: 'GameCreateScene' });
    }

    init(data: { editGameId?: string }) {
        this.editGameId = data?.editGameId || null;
        this.isEditMode = !!this.editGameId;
    }

    create() {
        this.createDOMUI();
        if (this.isEditMode && this.editGameId) {
            this.loadGameForEdit(this.editGameId);
        }
    }

    private async loadGameForEdit(gameId: string) {
        try {
            const game = await GameService.getGameById(gameId);
            if (game) {
                this.gameName = game.name;
                this.gameDescription = game.description || '';
                this.selectedLevels = game.levels || [];

                // Update form fields
                const nameInput = document.getElementById('gc-name') as HTMLInputElement;
                const descInput = document.getElementById('gc-description') as HTMLTextAreaElement;
                if (nameInput) nameInput.value = this.gameName;
                if (descInput) descInput.value = this.gameDescription;

                this.renderLevels();
                this.updateSaveButton();
            }
        } catch (error: any) {
            this.showToast('Failed to load game: ' + error.message, 'error');
            this.goBack();
        }
    }

    private createDOMUI() {
        const headerTitle = this.isEditMode ? 'EDIT GAME' : 'CREATE NEW GAME';
        const saveButtonText = this.isEditMode ? 'Update' : 'Save';

        // Create container for DOM elements
        this.domContainer = document.createElement('div');
        this.domContainer.id = 'game-create-container';
        this.domContainer.innerHTML = `
            <style>
                #game-create-container {
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
                .gc-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 30px;
                    background: rgba(0,0,0,0.3);
                    border-bottom: 4px solid #212529;
                }
                .gc-header h1 {
                    margin: 0;
                    font-size: 14px;
                    color: #92cc41;
                }
                .gc-header-buttons {
                    display: flex;
                    gap: 10px;
                }
                .gc-header-buttons button {
                    font-size: 10px;
                }

                .gc-content {
                    display: flex;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 20px;
                    gap: 20px;
                }
                .gc-left {
                    flex: 1;
                    min-width: 300px;
                }
                .gc-right {
                    flex: 1;
                    min-width: 400px;
                }
                .gc-section {
                    margin-bottom: 20px;
                }
                .gc-section h2 {
                    font-size: 12px;
                    color: #92cc41;
                    margin-bottom: 15px;
                }

                .nes-field {
                    margin-bottom: 15px;
                }
                .nes-field label {
                    font-size: 10px;
                }
                .nes-input, .nes-textarea {
                    font-size: 10px;
                }
                .nes-textarea {
                    min-height: 80px;
                    resize: vertical;
                    font-family: 'Press Start 2P', cursive;
                }

                .gc-search-results {
                    max-height: 400px;
                    overflow-y: auto;
                    margin-top: 10px;
                }
                .gc-pokemon-item {
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    margin-bottom: 10px;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .gc-pokemon-item:hover {
                    transform: translateX(5px);
                }
                .gc-pokemon-item img {
                    width: 50px;
                    height: 50px;
                    margin-right: 15px;
                    image-rendering: pixelated;
                }
                .gc-pokemon-info {
                    flex: 1;
                }
                .gc-pokemon-name {
                    font-size: 10px;
                    text-transform: capitalize;
                    color: #92cc41;
                }
                .gc-pokemon-types {
                    font-size: 8px;
                    color: #aaa;
                    margin-top: 4px;
                }
                .gc-add-btn {
                    font-size: 8px;
                }

                .gc-levels-list {
                    min-height: 200px;
                }
                .gc-level-item {
                    display: flex;
                    align-items: center;
                    padding: 12px;
                    margin-bottom: 10px;
                }
                .gc-level-number {
                    width: 35px;
                    height: 35px;
                    background: #92cc41;
                    color: #000;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    margin-right: 15px;
                    font-weight: bold;
                }
                .gc-level-item img {
                    width: 45px;
                    height: 45px;
                    margin-right: 15px;
                    image-rendering: pixelated;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .gc-level-item img:hover {
                    transform: scale(1.1);
                }
                .gc-level-info {
                    flex: 1;
                }
                .gc-level-name {
                    font-size: 10px;
                    text-transform: capitalize;
                    color: #92cc41;
                }
                .nes-select {
                    font-size: 8px;
                    margin-right: 10px;
                }
                .gc-remove-btn {
                    font-size: 8px;
                }

                .gc-empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: #666;
                    font-size: 8px;
                }
                .gc-loading {
                    text-align: center;
                    padding: 20px;
                    color: #92cc41;
                    font-size: 10px;
                }

                .gc-popup-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    cursor: pointer;
                }
                .gc-popup-content {
                    cursor: default;
                    max-width: 90%;
                }
                .gc-popup-content img {
                    width: 200px;
                    height: 200px;
                    image-rendering: pixelated;
                    margin: 20px auto;
                    display: block;
                }
                .gc-popup-name {
                    font-size: 16px;
                    text-transform: capitalize;
                    color: #92cc41;
                    margin: 15px 0;
                    text-align: center;
                }
                .gc-popup-info {
                    color: #aaa;
                    font-size: 10px;
                    text-align: center;
                    margin-bottom: 20px;
                }
                .gc-popup-close {
                    display: block;
                    margin: 0 auto;
                    font-size: 10px;
                }

                /* Toast notifications */
                .gc-toast-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 3000;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .gc-toast {
                    animation: gc-toast-slide-in 0.3s ease-out;
                    font-size: 10px;
                }
                @keyframes gc-toast-slide-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes gc-toast-slide-out {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            </style>

            <div class="gc-header">
                <h1>${this.isEditMode ? '✏️' : '🎮'} ${headerTitle}</h1>
                <div class="gc-header-buttons">
                    <button type="button" class="nes-btn" id="gc-back-btn">Back</button>
                    <button type="button" class="nes-btn is-primary" id="gc-save-btn" disabled>${saveButtonText}</button>
                </div>
            </div>

            <div class="gc-content">
                <div class="gc-left">
                    <div class="nes-container is-dark gc-section">
                        <h2>GAME DETAILS</h2>
                        <div class="nes-field">
                            <label for="gc-name">Game Name</label>
                            <input type="text" class="nes-input is-dark" id="gc-name" placeholder="Enter name" maxlength="50">
                        </div>
                        <div class="nes-field">
                            <label for="gc-description">Description (optional)</label>
                            <textarea class="nes-textarea is-dark" id="gc-description" placeholder="Enter description" maxlength="200"></textarea>
                        </div>
                    </div>

                    <div class="nes-container is-dark gc-section">
                        <h2>SEARCH POKEMON</h2>
                        <button type="button" class="nes-btn is-warning" id="gc-sync-btn" style="width: 100%; margin-bottom: 15px; font-size: 8px;">🔄 Sync from API</button>
                        <div class="nes-field">
                            <label for="gc-search">Search</label>
                            <input type="text" class="nes-input is-dark" id="gc-search" placeholder="Enter name">
                        </div>
                        <div class="gc-search-results" id="gc-search-results">
                            <div class="gc-empty-state">Enter Pokemon name</div>
                        </div>
                    </div>
                </div>

                <div class="gc-right">
                    <div class="nes-container is-dark gc-section">
                        <h2>GAME LEVELS (${this.selectedLevels.length})</h2>
                        <div class="gc-levels-list" id="gc-levels-list">
                            <div class="gc-empty-state">No levels yet.<br>Search and add Pokemon</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.domContainer);

        // Setup event listeners
        this.setupEventListeners();
    }

    private setupEventListeners() {
        const backBtn = document.getElementById('gc-back-btn');
        const saveBtn = document.getElementById('gc-save-btn');
        const nameInput = document.getElementById('gc-name') as HTMLInputElement;
        const descInput = document.getElementById('gc-description') as HTMLTextAreaElement;
        const searchInput = document.getElementById('gc-search') as HTMLInputElement;
        const syncBtn = document.getElementById('gc-sync-btn');

        backBtn?.addEventListener('click', () => this.goBack());
        saveBtn?.addEventListener('click', () => this.saveGame());
        syncBtn?.addEventListener('click', () => this.syncPokemon());

        nameInput?.addEventListener('input', (e) => {
            this.gameName = (e.target as HTMLInputElement).value;
            this.updateSaveButton();
        });

        descInput?.addEventListener('input', (e) => {
            this.gameDescription = (e.target as HTMLTextAreaElement).value;
        });

        let searchTimeout: any;
        searchInput?.addEventListener('input', (e) => {
            const query = (e.target as HTMLInputElement).value;
            clearTimeout(searchTimeout);
            if (query.length >= 2) {
                searchTimeout = setTimeout(() => this.searchPokemon(query), 300);
            } else {
                this.renderSearchResults([]);
            }
        });
    }

    private async syncPokemon() {
        const syncBtn = document.getElementById('gc-sync-btn') as HTMLButtonElement;
        if (syncBtn) {
            syncBtn.disabled = true;
            syncBtn.textContent = '⏳ Syncing all Pokemon...';
        }

        try {
            const result = await PokemonService.syncPokemon(true); // syncAll = true
            if (result.success) {
                this.showToast(`Synced ${result.data.total} Pokemon!`, 'success');
            } else {
                this.showToast('Sync failed: ' + result.error, 'error');
            }
        } catch (error: any) {
            this.showToast('Sync error: ' + error.message, 'error');
        } finally {
            if (syncBtn) {
                syncBtn.disabled = false;
                syncBtn.textContent = '🔄 Sync from API';
            }
        }
    }

    private async searchPokemon(query: string) {
        const resultsDiv = document.getElementById('gc-search-results');
        if (resultsDiv) {
            resultsDiv.innerHTML = '<div class="gc-loading">Searching...</div>';
        }

        try {
            const results = await PokemonService.searchPokemon(query);
            this.searchResults = results;
            this.renderSearchResults(results);
        } catch (error: any) {
            if (resultsDiv) {
                resultsDiv.innerHTML = `<div class="gc-empty-state">Error: ${error.message}</div>`;
            }
        }
    }

    private renderSearchResults(results: Pokemon[]) {
        const resultsDiv = document.getElementById('gc-search-results');
        if (!resultsDiv) return;

        if (results.length === 0) {
            resultsDiv.innerHTML = '<div class="gc-empty-state">No Pokemon found.<br>Try syncing first!</div>';
            return;
        }

        resultsDiv.innerHTML = results.map(pokemon => `
            <div class="nes-container is-dark gc-pokemon-item" data-pokemon-id="${pokemon.id}">
                <img src="${pokemon.spriteUrl}" alt="${pokemon.name}" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png'">
                <div class="gc-pokemon-info">
                    <div class="gc-pokemon-name">${pokemon.name}</div>
                    <div class="gc-pokemon-types">${pokemon.types.join(', ')}</div>
                </div>
                <button type="button" class="nes-btn is-success gc-add-btn" data-pokemon-id="${pokemon.id}">Add</button>
            </div>
        `).join('');

        // Add click handlers
        resultsDiv.querySelectorAll('.gc-add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const pokemonId = parseInt((btn as HTMLElement).dataset.pokemonId || '0');
                const pokemon = results.find(p => p.id === pokemonId);
                if (pokemon) {
                    this.addLevel(pokemon);
                }
            });
        });
    }

    private addLevel(pokemon: Pokemon) {
        // Check if already added
        if (this.selectedLevels.some(l => l.pokemonId === pokemon.id)) {
            this.showToast('Pokemon already added!', 'warning');
            return;
        }

        const level: GameLevel = {
            levelNumber: this.selectedLevels.length + 1,
            pokemonId: pokemon.id,
            pokemonName: pokemon.name,
            pokemonSprite: pokemon.spriteUrl,
            difficulty: 1
        };

        this.selectedLevels.push(level);
        this.renderLevels();
        this.updateSaveButton();
    }

    private removeLevel(index: number) {
        this.selectedLevels.splice(index, 1);
        // Renumber levels
        this.selectedLevels.forEach((level, i) => {
            level.levelNumber = i + 1;
        });
        this.renderLevels();
        this.updateSaveButton();
    }

    private updateDifficulty(index: number, difficulty: number) {
        if (this.selectedLevels[index]) {
            this.selectedLevels[index].difficulty = difficulty;
        }
    }

    private renderLevels() {
        const levelsDiv = document.getElementById('gc-levels-list');
        const sectionTitle = document.querySelector('.gc-right .gc-section h2');

        if (sectionTitle) {
            sectionTitle.textContent = `GAME LEVELS (${this.selectedLevels.length})`;
        }

        if (!levelsDiv) return;

        if (this.selectedLevels.length === 0) {
            levelsDiv.innerHTML = '<div class="gc-empty-state">No levels yet.<br>Search and add Pokemon</div>';
            return;
        }

        levelsDiv.innerHTML = this.selectedLevels.map((level, index) => `
            <div class="nes-container is-dark gc-level-item">
                <div class="gc-level-number">${level.levelNumber}</div>
                <img src="${level.pokemonSprite}" alt="${level.pokemonName}" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png'">
                <div class="gc-level-info">
                    <div class="gc-level-name">${level.pokemonName}</div>
                </div>
                <select class="nes-select is-dark" data-level-index="${index}" style="font-size: 8px;">
                    <option value="1" ${level.difficulty === 1 ? 'selected' : ''}>Easy</option>
                    <option value="2" ${level.difficulty === 2 ? 'selected' : ''}>Medium</option>
                    <option value="3" ${level.difficulty === 3 ? 'selected' : ''}>Hard</option>
                </select>
                <button type="button" class="nes-btn is-error gc-remove-btn" data-level-index="${index}">X</button>
            </div>
        `).join('');

        // Add event handlers
        levelsDiv.querySelectorAll('.gc-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt((btn as HTMLElement).dataset.levelIndex || '0');
                this.removeLevel(index);
            });
        });

        levelsDiv.querySelectorAll('.nes-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const index = parseInt((select as HTMLSelectElement).dataset.levelIndex || '0');
                const difficulty = parseInt((e.target as HTMLSelectElement).value);
                this.updateDifficulty(index, difficulty);
            });
        });

        // Add click handlers for images to show popup
        levelsDiv.querySelectorAll('.gc-level-item img').forEach((img, index) => {
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                const level = this.selectedLevels[index];
                if (level) {
                    this.showSpritePopup(level);
                }
            });
        });
    }

    private showSpritePopup(level: GameLevel) {
        const overlay = document.createElement('div');
        overlay.className = 'gc-popup-overlay';
        overlay.innerHTML = `
            <div class="nes-container is-dark with-title gc-popup-content">
                <p class="title" style="color: #92cc41;">LEVEL ${level.levelNumber}</p>
                <img src="${level.pokemonSprite}" alt="${level.pokemonName}" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png'">
                <div class="gc-popup-name">${level.pokemonName}</div>
                <div class="gc-popup-info">Difficulty: ${level.difficulty === 1 ? 'Easy' : level.difficulty === 2 ? 'Medium' : 'Hard'}</div>
                <button type="button" class="nes-btn is-primary gc-popup-close">Close</button>
            </div>
        `;

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        // Close on button click
        overlay.querySelector('.gc-popup-close')?.addEventListener('click', () => {
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

    private updateSaveButton() {
        const saveBtn = document.getElementById('gc-save-btn') as HTMLButtonElement;
        if (saveBtn) {
            const canSave = this.gameName.trim().length > 0 && this.selectedLevels.length > 0;
            saveBtn.disabled = !canSave;
        }
    }

    private async saveGame() {
        if (this.isLoading) return;

        const saveBtn = document.getElementById('gc-save-btn') as HTMLButtonElement;
        const buttonText = this.isEditMode ? 'Update' : 'Save';
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = this.isEditMode ? 'Updating...' : 'Saving...';
        }

        this.isLoading = true;

        try {
            if (this.isEditMode && this.editGameId) {
                await GameService.updateGame(
                    this.editGameId,
                    this.gameName.trim(),
                    this.gameDescription.trim(),
                    this.selectedLevels
                );
                this.showToast('Game updated!', 'success');
            } else {
                await GameService.createGame(
                    this.gameName.trim(),
                    this.gameDescription.trim(),
                    this.selectedLevels
                );
                this.showToast('Game created!', 'success');
            }
            // Delay goBack slightly so toast is visible
            setTimeout(() => this.goBack(), 500);
        } catch (error: any) {
            this.showToast('Save failed: ' + error.message, 'error');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = buttonText;
            }
        } finally {
            this.isLoading = false;
        }
    }

    private goBack() {
        this.cleanup();
        this.scene.start('MenuScene');
    }

    private cleanup() {
        if (this.domContainer && this.domContainer.parentNode) {
            this.domContainer.parentNode.removeChild(this.domContainer);
        }
        this.domContainer = null;
        this.selectedLevels = [];
        this.searchResults = [];
        this.gameName = '';
        this.gameDescription = '';
        this.editGameId = null;
        this.isEditMode = false;
    }

    shutdown() {
        this.cleanup();
    }

    private showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
        // Get or create toast container
        let container = document.getElementById('gc-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'gc-toast-container';
            container.className = 'gc-toast-container';
            document.body.appendChild(container);
        }

        // Create toast element with NES style
        const toast = document.createElement('div');
        const balloonClass = type === 'success' ? 'is-success' : type === 'error' ? 'is-error' : type === 'warning' ? 'is-warning' : 'is-dark';
        toast.className = `nes-balloon from-right ${balloonClass} gc-toast`;
        toast.innerHTML = `<p>${message}</p>`;
        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'gc-toast-slide-out 0.3s ease-in forwards';
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
