import 'phaser';
import { LeaderboardService, LeaderboardEntry, LeaderboardPeriod } from '../services/leaderboard-service';
import { I18nService } from '../services/i18n-service';

export class LeaderboardScene extends Phaser.Scene {
    private domContainer: HTMLDivElement | null = null;
    private entries: LeaderboardEntry[] = [];
    private period: LeaderboardPeriod = 'all_time';
    private loading: boolean = false;
    private currentPage: number = 0;
    private totalPages: number = 1;
    private pageSize: number = 30;

    constructor() {
        super({ key: 'LeaderboardScene' });
    }

    create() {
        this.entries = [];
        this.currentPage = 0;
        this.createDOMUI();
        this.loadLeaderboard();
    }

    private createDOMUI() {
        this.domContainer = document.createElement('div');
        this.domContainer.id = 'leaderboard-container';
        this.domContainer.innerHTML = `
            <style>
                #leaderboard-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    overflow-y: auto;
                    z-index: 2000;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .leaderboard-panel {
                    max-width: 700px;
                    width: 100%;
                    margin-top: 40px;
                    margin-bottom: 40px;
                    padding: 20px;
                    box-sizing: border-box;
                }

                .leaderboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .leaderboard-title {
                    font-size: 18px;
                    color: #ffd700;
                    margin: 0;
                }

                .leaderboard-close {
                    font-size: 24px;
                    cursor: pointer;
                    color: #888;
                    background: none;
                    border: none;
                    padding: 5px 10px;
                }

                .leaderboard-close:hover {
                    color: #fff;
                }

                .leaderboard-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }

                .leaderboard-tab {
                    padding: 8px 16px;
                    font-size: 10px;
                    cursor: pointer;
                    border: 2px solid #444;
                    background: #333;
                    color: #888;
                    transition: all 0.2s;
                }

                .leaderboard-tab:hover {
                    background: #444;
                    color: #fff;
                }

                .leaderboard-tab.active {
                    background: #209cee;
                    border-color: #209cee;
                    color: #fff;
                }

                .leaderboard-table {
                    width: 100%;
                    margin-bottom: 20px;
                }

                .leaderboard-row {
                    display: flex;
                    align-items: center;
                    padding: 12px 15px;
                    border-bottom: 1px solid #333;
                    transition: background 0.2s;
                }

                .leaderboard-row:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .leaderboard-row.top-1 {
                    background: rgba(255, 215, 0, 0.1);
                }

                .leaderboard-row.top-2 {
                    background: rgba(192, 192, 192, 0.1);
                }

                .leaderboard-row.top-3 {
                    background: rgba(205, 127, 50, 0.1);
                }

                .leaderboard-row-header {
                    background: #1a1a2e;
                    font-size: 10px;
                    color: #888;
                    border-bottom: 2px solid #333;
                }

                .leaderboard-rank {
                    width: 60px;
                    min-width: 60px;
                    font-size: 14px;
                    text-align: center;
                    margin-right: 8px;
                }

                .leaderboard-player {
                    flex: 1;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .leaderboard-online {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #92cc41;
                }

                .leaderboard-score {
                    width: 100px;
                    text-align: right;
                    font-size: 12px;
                    color: #92cc41;
                }

                .leaderboard-level {
                    width: 60px;
                    text-align: center;
                    font-size: 11px;
                }

                .leaderboard-streak {
                    width: 70px;
                    text-align: center;
                    font-size: 11px;
                }

                .leaderboard-loading {
                    text-align: center;
                    padding: 40px;
                    color: #92cc41;
                    font-size: 12px;
                }

                .leaderboard-empty {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                    font-size: 12px;
                }

                .leaderboard-pagination {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 20px;
                    margin-top: 20px;
                }

                .leaderboard-page-btn {
                    padding: 8px 16px;
                    font-size: 10px;
                    cursor: pointer;
                }

                .leaderboard-page-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .leaderboard-page-info {
                    font-size: 10px;
                    color: #888;
                }

                .leaderboard-my-rank {
                    margin-top: 20px;
                    padding: 15px;
                    background: rgba(146, 204, 65, 0.1);
                    border: 2px solid #92cc41;
                }

                .leaderboard-my-rank-title {
                    font-size: 10px;
                    color: #92cc41;
                    margin-bottom: 10px;
                }

                .leaderboard-my-rank-row {
                    display: flex;
                    align-items: center;
                }

                /* Mobile Responsive Styles */
                @media (max-width: 768px) {
                    .leaderboard-panel {
                        margin: 20px auto;
                        padding: 15px;
                        max-width: 95%;
                    }

                    .leaderboard-title {
                        font-size: 14px;
                    }

                    .leaderboard-tabs {
                        gap: 5px;
                    }

                    .leaderboard-tab {
                        padding: 6px 12px;
                        font-size: 8px;
                    }

                    .leaderboard-row {
                        padding: 10px 8px;
                    }

                    .leaderboard-rank {
                        width: 35px;
                        font-size: 12px;
                    }

                    .leaderboard-player {
                        font-size: 10px;
                        gap: 5px;
                    }

                    .leaderboard-score {
                        width: 70px;
                        font-size: 10px;
                    }

                    .leaderboard-level {
                        width: 40px;
                        font-size: 9px;
                    }

                    .leaderboard-streak {
                        width: 50px;
                        font-size: 9px;
                    }

                    .leaderboard-row-header {
                        font-size: 8px;
                    }

                    .leaderboard-pagination {
                        gap: 10px;
                        flex-wrap: wrap;
                    }

                    .leaderboard-page-btn {
                        padding: 6px 10px;
                        font-size: 8px;
                    }

                    .leaderboard-my-rank {
                        padding: 10px;
                    }
                }

                @media (max-width: 480px) {
                    .leaderboard-panel {
                        margin: 10px auto;
                        padding: 10px;
                    }

                    .leaderboard-title {
                        font-size: 12px;
                    }

                    .leaderboard-close {
                        font-size: 20px;
                        padding: 3px 8px;
                    }

                    .leaderboard-tab {
                        padding: 5px 8px;
                        font-size: 7px;
                    }

                    .leaderboard-row {
                        padding: 8px 5px;
                    }

                    .leaderboard-rank {
                        width: 30px;
                        font-size: 10px;
                    }

                    .leaderboard-player {
                        font-size: 9px;
                    }

                    .leaderboard-score {
                        width: 55px;
                        font-size: 9px;
                    }

                    .leaderboard-level,
                    .leaderboard-streak {
                        display: none;
                    }

                    .leaderboard-row-header .leaderboard-level,
                    .leaderboard-row-header .leaderboard-streak {
                        display: none;
                    }

                    .leaderboard-online {
                        width: 6px;
                        height: 6px;
                    }
                }
            </style>

            <div class="leaderboard-panel nes-container is-dark">
                <div class="leaderboard-header">
                    <h2 class="leaderboard-title">🏆 LEADERBOARD</h2>
                    <button class="leaderboard-close" id="leaderboard-close">✕</button>
                </div>

                <div class="leaderboard-tabs">
                    <button class="leaderboard-tab active" data-period="all_time">ALL TIME</button>
                    <button class="leaderboard-tab" data-period="weekly">WEEKLY</button>
                    <button class="leaderboard-tab" data-period="daily">DAILY</button>
                </div>

                <div class="leaderboard-table">
                    <div class="leaderboard-row leaderboard-row-header">
                        <div class="leaderboard-rank">RANK</div>
                        <div class="leaderboard-player">PLAYER</div>
                        <div class="leaderboard-score">SCORE</div>
                        <div class="leaderboard-level">LVL</div>
                        <div class="leaderboard-streak">STREAK</div>
                    </div>
                    <div id="leaderboard-entries">
                        <div class="leaderboard-loading">Loading...</div>
                    </div>
                </div>

                <div class="leaderboard-pagination">
                    <button class="nes-btn leaderboard-page-btn" id="leaderboard-prev" disabled>< PREV</button>
                    <span class="leaderboard-page-info" id="leaderboard-page-info">Page 1</span>
                    <button class="nes-btn leaderboard-page-btn" id="leaderboard-next" disabled>NEXT ></button>
                </div>

                <div id="leaderboard-my-rank"></div>
            </div>
        `;
        document.body.appendChild(this.domContainer);

        // Event listeners
        document.getElementById('leaderboard-close')?.addEventListener('click', () => this.close());

        // Tab listeners
        this.domContainer.querySelectorAll('.leaderboard-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const period = (tab as HTMLElement).dataset.period as LeaderboardPeriod;
                this.switchPeriod(period);
            });
        });

        // Pagination listeners
        document.getElementById('leaderboard-prev')?.addEventListener('click', () => this.prevPage());
        document.getElementById('leaderboard-next')?.addEventListener('click', () => this.nextPage());
    }

    private async loadLeaderboard() {
        if (this.loading) return;

        this.loading = true;
        this.showLoading();

        try {
            const result = await LeaderboardService.getGlobalLeaderboard({
                period: this.period,
                limit: this.pageSize,
                offset: this.currentPage * this.pageSize,
            });

            this.entries = result.leaderboard;
            this.totalPages = Math.ceil(result.pagination.total / this.pageSize);

            this.renderEntries();
            this.updatePagination();
            this.loadMyRank();
        } catch (error) {
            console.error('[LeaderboardScene] Failed to load leaderboard:', error);
            this.showError();
        } finally {
            this.loading = false;
        }
    }

    private async loadMyRank() {
        try {
            const result = await LeaderboardService.getAroundMe({ period: this.period });
            this.renderMyRank(result.player);
        } catch (error) {
            console.error('[LeaderboardScene] Failed to load my rank:', error);
        }
    }

    private showLoading() {
        const container = document.getElementById('leaderboard-entries');
        if (container) {
            container.innerHTML = '<div class="leaderboard-loading">Loading...</div>';
        }
    }

    private showError() {
        const container = document.getElementById('leaderboard-entries');
        if (container) {
            container.innerHTML = '<div class="leaderboard-empty">Failed to load leaderboard</div>';
        }
    }

    private renderEntries() {
        const container = document.getElementById('leaderboard-entries');
        if (!container) return;

        if (this.entries.length === 0) {
            container.innerHTML = '<div class="leaderboard-empty">No entries yet. Be the first!</div>';
            return;
        }

        container.innerHTML = this.entries.map(entry => this.renderEntry(entry)).join('');
    }

    private renderEntry(entry: LeaderboardEntry): string {
        const rankDisplay = this.getRankDisplay(entry.rank);
        const topClass = entry.rank <= 3 ? `top-${entry.rank}` : '';
        const onlineIndicator = entry.isOnline ? '<div class="leaderboard-online"></div>' : '';

        return `
            <div class="leaderboard-row ${topClass}">
                <div class="leaderboard-rank">${rankDisplay}</div>
                <div class="leaderboard-player">
                    ${onlineIndicator}
                    ${entry.displayName}
                </div>
                <div class="leaderboard-score">${this.formatNumber(entry.totalScore)}</div>
                <div class="leaderboard-level">${entry.highestLevel}</div>
                <div class="leaderboard-streak">🔥${entry.bestStreak}</div>
            </div>
        `;
    }

    private renderMyRank(player: { rank: number; totalScore: number; percentile: number }) {
        const container = document.getElementById('leaderboard-my-rank');
        if (!container) return;

        if (player.rank === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <div class="nes-container is-dark leaderboard-my-rank">
                <div class="leaderboard-my-rank-title">YOUR POSITION</div>
                <div class="leaderboard-my-rank-row">
                    <div class="leaderboard-rank">#${player.rank}</div>
                    <div class="leaderboard-player">You</div>
                    <div class="leaderboard-score">${this.formatNumber(player.totalScore)}</div>
                    <div style="flex: 1; text-align: right; font-size: 10px; color: #888;">
                        Top ${player.percentile.toFixed(1)}%
                    </div>
                </div>
            </div>
        `;
    }

    private getRankDisplay(rank: number): string {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `#${rank}`;
        }
    }

    private formatNumber(num: number): string {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toLocaleString();
    }

    private updatePagination() {
        const prevBtn = document.getElementById('leaderboard-prev') as HTMLButtonElement;
        const nextBtn = document.getElementById('leaderboard-next') as HTMLButtonElement;
        const pageInfo = document.getElementById('leaderboard-page-info');

        if (prevBtn) prevBtn.disabled = this.currentPage === 0;
        if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages - 1;
        if (pageInfo) pageInfo.textContent = `Page ${this.currentPage + 1} of ${this.totalPages}`;
    }

    private switchPeriod(period: LeaderboardPeriod) {
        if (period === this.period) return;

        // Update tabs UI
        this.domContainer?.querySelectorAll('.leaderboard-tab').forEach(tab => {
            tab.classList.toggle('active', (tab as HTMLElement).dataset.period === period);
        });

        this.period = period;
        this.currentPage = 0;
        this.loadLeaderboard();
    }

    private prevPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.loadLeaderboard();
        }
    }

    private nextPage() {
        if (this.currentPage < this.totalPages - 1) {
            this.currentPage++;
            this.loadLeaderboard();
        }
    }

    private close() {
        this.cleanup();
        this.scene.start('MenuScene');
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
