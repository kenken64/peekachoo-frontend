import 'phaser';
import { StatsService, PlayerStats, PlayerStatsResponse, RecentGame } from '../services/stats-service';
import { AchievementsService, AchievementsResponse } from '../services/achievements-service';

type StatsTab = 'overview' | 'achievements' | 'history' | 'collection';

export class StatsScene extends Phaser.Scene {
    private domContainer: HTMLDivElement | null = null;
    private stats: PlayerStatsResponse | null = null;
    private achievements: AchievementsResponse | null = null;
    private currentTab: StatsTab = 'overview';
    private loading: boolean = false;

    constructor() {
        super({ key: 'StatsScene' });
    }

    create() {
        this.stats = null;
        this.achievements = null;
        this.currentTab = 'overview';
        this.createDOMUI();
        this.loadData();
    }

    private createDOMUI() {
        this.domContainer = document.createElement('div');
        this.domContainer.id = 'stats-container';
        this.domContainer.innerHTML = `
            <style>
                #stats-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    overflow-y: auto;
                    z-index: 2000;
                }

                .stats-panel {
                    max-width: 800px;
                    margin: 40px auto;
                    padding: 20px;
                }

                .stats-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .stats-title {
                    font-size: 18px;
                    color: #ffd700;
                    margin: 0;
                }

                .stats-close {
                    font-size: 24px;
                    cursor: pointer;
                    color: #888;
                    background: none;
                    border: none;
                    padding: 5px 10px;
                }

                .stats-close:hover {
                    color: #fff;
                }

                .stats-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }

                .stats-tab {
                    padding: 8px 16px;
                    font-size: 10px;
                    cursor: pointer;
                    border: 2px solid #444;
                    background: #333;
                    color: #888;
                    transition: all 0.2s;
                }

                .stats-tab:hover {
                    background: #444;
                    color: #fff;
                }

                .stats-tab.active {
                    background: #209cee;
                    border-color: #209cee;
                    color: #fff;
                }

                .stats-content {
                    min-height: 300px;
                }

                .stats-loading {
                    text-align: center;
                    padding: 40px;
                    color: #92cc41;
                    font-size: 12px;
                }

                .stats-error {
                    text-align: center;
                    padding: 40px;
                    color: #e76e55;
                    font-size: 12px;
                }

                /* Overview Tab Styles */
                .stats-overview {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                }

                .stats-card {
                    background: #1a1a2e;
                    padding: 15px;
                    border: 2px solid #333;
                }

                .stats-card-title {
                    font-size: 10px;
                    color: #888;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                }

                .stats-card-value {
                    font-size: 24px;
                    color: #92cc41;
                    margin-bottom: 5px;
                }

                .stats-card-subtitle {
                    font-size: 10px;
                    color: #666;
                }

                .stats-rank-card {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .stats-rank-number {
                    font-size: 32px;
                    color: #ffd700;
                }

                .stats-rank-details {
                    flex: 1;
                }

                .stats-percentile {
                    font-size: 11px;
                    color: #92cc41;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                }

                .stats-grid-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #333;
                    font-size: 11px;
                }

                .stats-grid-label {
                    color: #888;
                }

                .stats-grid-value {
                    color: #fff;
                }

                /* Achievements Tab Styles */
                .achievements-summary {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    background: #1a1a2e;
                    border: 2px solid #333;
                    margin-bottom: 20px;
                }

                .achievements-progress {
                    flex: 1;
                }

                .achievements-progress-bar {
                    height: 8px;
                    background: #333;
                    border-radius: 4px;
                    overflow: hidden;
                    margin: 10px 0;
                }

                .achievements-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #92cc41, #ffd700);
                    transition: width 0.3s;
                }

                .achievements-points {
                    font-size: 24px;
                    color: #ffd700;
                    text-align: right;
                }

                .achievements-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 10px;
                }

                .achievement-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: #1a1a2e;
                    border: 2px solid #333;
                    transition: all 0.2s;
                }

                .achievement-item.unlocked {
                    border-color: #92cc41;
                }

                .achievement-item.locked {
                    opacity: 0.6;
                }

                .achievement-icon {
                    font-size: 24px;
                    width: 40px;
                    text-align: center;
                }

                .achievement-info {
                    flex: 1;
                }

                .achievement-name {
                    font-size: 11px;
                    color: #fff;
                    margin-bottom: 4px;
                }

                .achievement-desc {
                    font-size: 9px;
                    color: #888;
                }

                .achievement-progress {
                    height: 4px;
                    background: #333;
                    margin-top: 6px;
                    border-radius: 2px;
                    overflow: hidden;
                }

                .achievement-progress-fill {
                    height: 100%;
                    background: #92cc41;
                }

                .achievement-points {
                    font-size: 10px;
                    color: #ffd700;
                }

                /* History Tab Styles */
                .history-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .history-item {
                    display: flex;
                    align-items: center;
                    padding: 15px;
                    background: #1a1a2e;
                    border: 2px solid #333;
                    gap: 15px;
                }

                .history-date {
                    font-size: 10px;
                    color: #888;
                    width: 80px;
                }

                .history-details {
                    flex: 1;
                }

                .history-score {
                    font-size: 14px;
                    color: #92cc41;
                }

                .history-levels {
                    font-size: 10px;
                    color: #888;
                    margin-top: 4px;
                }

                .history-duration {
                    font-size: 10px;
                    color: #666;
                    width: 60px;
                    text-align: right;
                }

                /* Collection Tab Styles */
                .collection-summary {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    background: #1a1a2e;
                    border: 2px solid #333;
                    margin-bottom: 20px;
                }

                .collection-count {
                    font-size: 24px;
                    color: #92cc41;
                }

                .collection-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
                    gap: 8px;
                }

                .collection-item {
                    aspect-ratio: 1;
                    background: #1a1a2e;
                    border: 2px solid #333;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                .collection-item.revealed {
                    border-color: #92cc41;
                }

                .collection-item.hidden {
                    opacity: 0.3;
                }

                .collection-sprite {
                    width: 48px;
                    height: 48px;
                    image-rendering: pixelated;
                }

                .collection-id {
                    position: absolute;
                    bottom: 2px;
                    right: 4px;
                    font-size: 8px;
                    color: #666;
                }

                /* Mobile Responsive Styles */
                @media (max-width: 768px) {
                    .stats-panel {
                        margin: 20px auto;
                        padding: 15px;
                        max-width: 95%;
                    }

                    .stats-title {
                        font-size: 14px;
                    }

                    .stats-tabs {
                        gap: 5px;
                    }

                    .stats-tab {
                        padding: 6px 10px;
                        font-size: 8px;
                    }

                    .stats-overview {
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 15px;
                    }

                    .stats-card {
                        padding: 12px;
                    }

                    .stats-card-value {
                        font-size: 20px;
                    }

                    .stats-rank-number {
                        font-size: 26px;
                    }

                    .stats-grid {
                        grid-template-columns: 1fr;
                    }

                    .stats-grid-item {
                        font-size: 10px;
                    }

                    .achievements-list {
                        grid-template-columns: 1fr;
                    }

                    .achievement-item {
                        padding: 10px;
                        gap: 10px;
                    }

                    .achievement-icon {
                        font-size: 20px;
                        width: 32px;
                    }

                    .achievement-name {
                        font-size: 10px;
                    }

                    .achievement-desc {
                        font-size: 8px;
                    }

                    .history-item {
                        padding: 12px;
                        gap: 10px;
                        flex-wrap: wrap;
                    }

                    .history-date {
                        width: auto;
                        font-size: 9px;
                    }

                    .history-score {
                        font-size: 12px;
                    }

                    .collection-grid {
                        grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
                        gap: 5px;
                    }

                    .collection-sprite {
                        width: 40px;
                        height: 40px;
                    }
                }

                @media (max-width: 480px) {
                    .stats-panel {
                        margin: 10px auto;
                        padding: 10px;
                    }

                    .stats-title {
                        font-size: 12px;
                    }

                    .stats-close {
                        font-size: 20px;
                        padding: 3px 8px;
                    }

                    .stats-tab {
                        padding: 5px 8px;
                        font-size: 7px;
                    }

                    .stats-overview {
                        grid-template-columns: 1fr;
                        gap: 10px;
                    }

                    .stats-card {
                        padding: 10px;
                    }

                    .stats-card[style*="grid-column: span 2"] {
                        grid-column: span 1 !important;
                    }

                    .stats-card-title {
                        font-size: 9px;
                    }

                    .stats-card-value {
                        font-size: 18px;
                    }

                    .stats-card-subtitle {
                        font-size: 8px;
                    }

                    .stats-rank-number {
                        font-size: 22px;
                    }

                    .stats-percentile {
                        font-size: 9px;
                    }

                    .achievements-summary {
                        flex-direction: column;
                        gap: 10px;
                        text-align: center;
                    }

                    .achievements-points {
                        text-align: center;
                        font-size: 20px;
                    }

                    .collection-summary {
                        flex-direction: column;
                        gap: 10px;
                        text-align: center;
                    }

                    .collection-count {
                        font-size: 20px;
                    }

                    .collection-grid {
                        grid-template-columns: repeat(auto-fill, minmax(45px, 1fr));
                    }

                    .collection-sprite {
                        width: 36px;
                        height: 36px;
                    }

                    .collection-id {
                        font-size: 6px;
                    }

                    .history-item {
                        padding: 10px;
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .history-date {
                        display: flex;
                        gap: 10px;
                        width: 100%;
                    }

                    .history-duration {
                        width: auto;
                        text-align: left;
                    }
                }
            </style>

            <div class="stats-panel nes-container is-dark">
                <div class="stats-header">
                    <h2 class="stats-title">📊 MY STATS</h2>
                    <button class="stats-close" id="stats-close">✕</button>
                </div>

                <div class="stats-tabs">
                    <button class="stats-tab active" data-tab="overview">OVERVIEW</button>
                    <button class="stats-tab" data-tab="achievements">ACHIEVEMENTS</button>
                    <button class="stats-tab" data-tab="history">HISTORY</button>
                    <button class="stats-tab" data-tab="collection">COLLECTION</button>
                </div>

                <div class="stats-content" id="stats-content">
                    <div class="stats-loading">Loading...</div>
                </div>
            </div>
        `;
        document.body.appendChild(this.domContainer);

        // Event listeners
        document.getElementById('stats-close')?.addEventListener('click', () => this.close());

        // Tab listeners
        this.domContainer.querySelectorAll('.stats-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = (tab as HTMLElement).dataset.tab as StatsTab;
                this.switchTab(tabName);
            });
        });
    }

    private async loadData() {
        if (this.loading) return;

        this.loading = true;
        this.showLoading();

        try {
            const [statsResult, achievementsResult] = await Promise.all([
                StatsService.getMyStats(),
                AchievementsService.getAchievements()
            ]);

            this.stats = statsResult;
            this.achievements = achievementsResult;

            this.renderContent();
        } catch (error) {
            console.error('[StatsScene] Failed to load data:', error);
            this.showError();
        } finally {
            this.loading = false;
        }
    }

    private showLoading() {
        const container = document.getElementById('stats-content');
        if (container) {
            container.innerHTML = '<div class="stats-loading">Loading...</div>';
        }
    }

    private showError() {
        const container = document.getElementById('stats-content');
        if (container) {
            container.innerHTML = '<div class="stats-error">Failed to load stats</div>';
        }
    }

    private renderContent() {
        switch (this.currentTab) {
            case 'overview':
                this.renderOverview();
                break;
            case 'achievements':
                this.renderAchievements();
                break;
            case 'history':
                this.renderHistory();
                break;
            case 'collection':
                this.renderCollection();
                break;
        }
    }

    private renderOverview() {
        const container = document.getElementById('stats-content');
        if (!container || !this.stats) return;

        const { stats, rankings, user } = this.stats;
        const skillBreakdown = StatsService.calculateSkillBreakdown(stats);

        container.innerHTML = `
            <div class="stats-overview">
                <div class="stats-card">
                    <div class="stats-card-title">Global Rank</div>
                    <div class="stats-rank-card">
                        <div class="stats-rank-number">#${rankings.global.rank || '—'}</div>
                        <div class="stats-rank-details">
                            <div class="stats-percentile">Top ${rankings.global.percentile.toFixed(1)}%</div>
                            <div class="stats-card-subtitle">of ${rankings.global.total.toLocaleString()} players</div>
                        </div>
                    </div>
                </div>

                <div class="stats-card">
                    <div class="stats-card-title">Total Score</div>
                    <div class="stats-card-value">${this.formatNumber(stats.totalScoreAllTime)}</div>
                    <div class="stats-card-subtitle">Best game: ${this.formatNumber(stats.bestSingleGameScore)}</div>
                </div>

                <div class="stats-card">
                    <div class="stats-card-title">Highest Level</div>
                    <div class="stats-card-value">${stats.highestLevelReached}</div>
                    <div class="stats-card-subtitle">${stats.totalLevelsCompleted} levels completed</div>
                </div>

                <div class="stats-card">
                    <div class="stats-card-title">Best Streak</div>
                    <div class="stats-card-value">🔥 ${stats.bestStreak}</div>
                    <div class="stats-card-subtitle">Current: ${stats.currentStreak}</div>
                </div>

                <div class="stats-card">
                    <div class="stats-card-title">Games Played</div>
                    <div class="stats-card-value">${stats.totalGamesPlayed}</div>
                    <div class="stats-card-subtitle">Avg: ${this.formatNumber(stats.averageScorePerGame)} pts/game</div>
                </div>

                <div class="stats-card">
                    <div class="stats-card-title">Play Time</div>
                    <div class="stats-card-value">${StatsService.formatPlayTime(stats.totalPlayTimeSeconds)}</div>
                    <div class="stats-card-subtitle">Since ${this.formatDate(stats.firstPlayedAt)}</div>
                </div>

                <div class="stats-card" style="grid-column: span 2;">
                    <div class="stats-card-title">Performance Stats</div>
                    <div class="stats-grid">
                        <div class="stats-grid-item">
                            <span class="stats-grid-label">Territory Avg</span>
                            <span class="stats-grid-value">${(stats.averageCoverage * 100).toFixed(1)}%</span>
                        </div>
                        <div class="stats-grid-item">
                            <span class="stats-grid-label">Best Coverage</span>
                            <span class="stats-grid-value">${(stats.bestCoverage * 100).toFixed(1)}%</span>
                        </div>
                        <div class="stats-grid-item">
                            <span class="stats-grid-label">Quiz Accuracy</span>
                            <span class="stats-grid-value">${(stats.quizAccuracy * 100).toFixed(1)}%</span>
                        </div>
                        <div class="stats-grid-item">
                            <span class="stats-grid-label">Fastest Level</span>
                            <span class="stats-grid-value">${stats.fastestLevelSeconds ? stats.fastestLevelSeconds + 's' : '—'}</span>
                        </div>
                        <div class="stats-grid-item">
                            <span class="stats-grid-label">Pokemon Revealed</span>
                            <span class="stats-grid-value">${stats.uniquePokemonRevealed}/${stats.totalPokemon}</span>
                        </div>
                        <div class="stats-grid-item">
                            <span class="stats-grid-label">Total Territory</span>
                            <span class="stats-grid-value">${this.formatNumber(stats.totalTerritoryClaimed)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private renderAchievements() {
        const container = document.getElementById('stats-content');
        if (!container || !this.achievements) return;

        const { unlocked, locked, totalPoints, maxPoints, completionPercentage } = this.achievements;

        container.innerHTML = `
            <div class="achievements-summary">
                <div class="achievements-progress">
                    <div style="font-size: 11px; color: #888;">
                        ${unlocked.length} / ${unlocked.length + locked.length} achievements
                    </div>
                    <div class="achievements-progress-bar">
                        <div class="achievements-progress-fill" style="width: ${completionPercentage}%"></div>
                    </div>
                </div>
                <div class="achievements-points">
                    ${totalPoints} / ${maxPoints} pts
                </div>
            </div>

            <div class="achievements-list">
                ${unlocked.map(a => this.renderAchievementItem(a, true)).join('')}
                ${locked.map(a => this.renderAchievementItem(a, false)).join('')}
            </div>
        `;
    }

    private renderAchievementItem(achievement: any, isUnlocked: boolean): string {
        const progressBar = !isUnlocked && achievement.progress
            ? `<div class="achievement-progress">
                   <div class="achievement-progress-fill" style="width: ${achievement.progress.percentage}%"></div>
               </div>`
            : '';

        return `
            <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.description}</div>
                    ${progressBar}
                </div>
                <div class="achievement-points">${achievement.points}pts</div>
            </div>
        `;
    }

    private async renderHistory() {
        const container = document.getElementById('stats-content');
        if (!container) return;

        container.innerHTML = '<div class="stats-loading">Loading history...</div>';

        try {
            const result = await StatsService.getGameHistory({ limit: 20 });

            if (result.history.length === 0) {
                container.innerHTML = '<div class="stats-error">No games played yet</div>';
                return;
            }

            container.innerHTML = `
                <div class="history-list">
                    ${result.history.map(game => this.renderHistoryItem(game)).join('')}
                </div>
            `;
        } catch (error) {
            console.error('[StatsScene] Failed to load history:', error);
            container.innerHTML = '<div class="stats-error">Failed to load history</div>';
        }
    }

    private renderHistoryItem(game: any): string {
        const date = new Date(game.playedAt);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="history-item">
                <div class="history-date">
                    <div>${dateStr}</div>
                    <div style="color: #666;">${timeStr}</div>
                </div>
                <div class="history-details">
                    <div class="history-score">${this.formatNumber(game.totalScore)} pts</div>
                    <div class="history-levels">
                        Level ${game.highestLevel} · ${game.levelsCompleted} levels
                        ${game.gameName ? ` · ${game.gameName}` : ''}
                    </div>
                </div>
                <div class="history-duration">${StatsService.formatPlayTime(game.duration)}</div>
            </div>
        `;
    }

    private async renderCollection() {
        const container = document.getElementById('stats-content');
        if (!container) return;

        container.innerHTML = '<div class="stats-loading">Loading collection...</div>';

        try {
            const result = await StatsService.getCollection({ filter: 'all', sortBy: 'id' });

            container.innerHTML = `
                <div class="collection-summary">
                    <div>
                        <div style="font-size: 10px; color: #888;">Pokemon Revealed</div>
                        <div class="collection-count">${result.summary.revealed} / ${result.summary.total}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 24px; color: #ffd700;">${result.summary.percentage.toFixed(1)}%</div>
                        <div style="font-size: 10px; color: #888;">Complete</div>
                    </div>
                </div>

                <div class="collection-grid">
                    ${result.pokemon.slice(0, 151).map(p => this.renderCollectionItem(p)).join('')}
                </div>
            `;
        } catch (error) {
            console.error('[StatsScene] Failed to load collection:', error);
            container.innerHTML = '<div class="stats-error">Failed to load collection</div>';
        }
    }

    private renderCollectionItem(pokemon: any): string {
        const revealed = pokemon.isRevealed;
        const sprite = revealed && pokemon.spriteUrl
            ? `<img class="collection-sprite" src="${pokemon.spriteUrl}" alt="${pokemon.name}" />`
            : '?';

        return `
            <div class="collection-item ${revealed ? 'revealed' : 'hidden'}" title="${revealed ? pokemon.name : '???'}">
                ${sprite}
                <span class="collection-id">#${pokemon.id}</span>
            </div>
        `;
    }

    private switchTab(tab: StatsTab) {
        if (tab === this.currentTab) return;

        // Update tabs UI
        this.domContainer?.querySelectorAll('.stats-tab').forEach(t => {
            t.classList.toggle('active', (t as HTMLElement).dataset.tab === tab);
        });

        this.currentTab = tab;
        this.renderContent();
    }

    private formatNumber(num: number): string {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toLocaleString();
    }

    private formatDate(dateStr: string | null): string {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    private close() {
        this.cleanup();
        this.scene.stop('StatsScene');
    }

    private cleanup() {
        if (this.domContainer && this.domContainer.parentNode) {
            this.domContainer.parentNode.removeChild(this.domContainer);
        }
        this.domContainer = null;
    }

    shutdown() {
        this.cleanup();
    }
}
