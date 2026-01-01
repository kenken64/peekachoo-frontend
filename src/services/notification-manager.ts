import {
    websocketService,
    RankChangeEvent,
    AchievementUnlockedEvent,
    PokemonRevealedEvent,
    StreakMilestoneEvent,
    LeaderboardUpdateEvent
} from './websocket-service';
import { logger } from '../config';

/**
 * Notification types
 */
type NotificationType = 'success' | 'info' | 'warning' | 'error' | 'achievement' | 'rank';

interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    icon?: string;
    duration?: number;
}

/**
 * Notification Manager
 * Handles displaying real-time notifications from WebSocket events
 */
class NotificationManager {
    private container: HTMLDivElement | null = null;
    private notifications: Map<string, HTMLDivElement> = new Map();
    private notificationCount: number = 0;
    private initialized: boolean = false;

    /**
     * Initialize the notification manager
     */
    initialize(): void {
        if (this.initialized) return;

        this.createContainer();
        this.setupWebSocketListeners();
        this.initialized = true;

        logger.log('[NotificationManager] Initialized');
    }

    /**
     * Create the notification container
     */
    private createContainer(): void {
        // Remove existing container if present
        const existing = document.getElementById('notification-container');
        if (existing) {
            existing.remove();
        }

        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.innerHTML = `
            <style>
                #notification-container {
                    position: fixed;
                    top: 60px;
                    right: 20px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-width: 320px;
                    pointer-events: none;
                }

                .live-notification {
                    pointer-events: auto;
                    background: #1a1a2e;
                    border: 2px solid #333;
                    border-radius: 8px;
                    padding: 12px 15px;
                    color: #fff;
                    font-family: 'Press Start 2P', monospace, sans-serif;
                    font-size: 10px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                    animation: notificationSlideIn 0.3s ease-out;
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                }

                .live-notification.hiding {
                    animation: notificationSlideOut 0.3s ease-in forwards;
                }

                .live-notification.success {
                    border-color: #92cc41;
                    background: linear-gradient(135deg, #1a1a2e 0%, #1a2e1a 100%);
                }

                .live-notification.achievement {
                    border-color: #ffd700;
                    background: linear-gradient(135deg, #1a1a2e 0%, #2e2a1a 100%);
                }

                .live-notification.rank {
                    border-color: #209cee;
                    background: linear-gradient(135deg, #1a1a2e 0%, #1a1a2e 100%);
                }

                .live-notification.info {
                    border-color: #209cee;
                }

                .live-notification.warning {
                    border-color: #f0ad4e;
                }

                .live-notification.error {
                    border-color: #e76e55;
                }

                .notification-icon {
                    font-size: 20px;
                    flex-shrink: 0;
                }

                .notification-content {
                    flex: 1;
                    min-width: 0;
                }

                .notification-title {
                    font-size: 11px;
                    margin-bottom: 4px;
                    color: #fff;
                }

                .notification-message {
                    font-size: 9px;
                    color: #aaa;
                    line-height: 1.4;
                }

                .notification-close {
                    background: none;
                    border: none;
                    color: #666;
                    cursor: pointer;
                    padding: 0;
                    font-size: 14px;
                    line-height: 1;
                }

                .notification-close:hover {
                    color: #fff;
                }

                @keyframes notificationSlideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes notificationSlideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }

                /* Connection status indicator */
                .ws-status {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 9px;
                    font-family: 'Press Start 2P', monospace, sans-serif;
                    z-index: 9998;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.3s;
                }

                .ws-status.connected {
                    background: rgba(146, 204, 65, 0.2);
                    color: #92cc41;
                    border: 1px solid #92cc41;
                }

                .ws-status.disconnected {
                    background: rgba(231, 110, 85, 0.2);
                    color: #e76e55;
                    border: 1px solid #e76e55;
                }

                .ws-status.connecting {
                    background: rgba(240, 173, 78, 0.2);
                    color: #f0ad4e;
                    border: 1px solid #f0ad4e;
                }

                .ws-status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: currentColor;
                }

                .ws-status.connecting .ws-status-dot {
                    animation: pulse 1s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }

                /* Mobile Responsive Styles */
                @media (max-width: 768px) {
                    #notification-container {
                        top: 50px;
                        right: 10px;
                        max-width: 280px;
                    }

                    .live-notification {
                        padding: 10px 12px;
                        font-size: 9px;
                        gap: 8px;
                    }

                    .notification-icon {
                        font-size: 18px;
                    }

                    .notification-title {
                        font-size: 10px;
                    }

                    .notification-message {
                        font-size: 8px;
                    }

                    .ws-status {
                        bottom: 15px;
                        right: 15px;
                        padding: 5px 10px;
                        font-size: 8px;
                    }

                    .ws-status-dot {
                        width: 6px;
                        height: 6px;
                    }
                }

                @media (max-width: 480px) {
                    #notification-container {
                        top: 45px;
                        right: 5px;
                        left: 5px;
                        max-width: none;
                    }

                    .live-notification {
                        padding: 8px 10px;
                        font-size: 8px;
                        border-radius: 6px;
                    }

                    .notification-icon {
                        font-size: 16px;
                        width: 24px;
                    }

                    .notification-title {
                        font-size: 9px;
                    }

                    .notification-message {
                        font-size: 7px;
                        line-height: 1.3;
                    }

                    .notification-close {
                        font-size: 12px;
                    }

                    .ws-status {
                        bottom: 10px;
                        right: 10px;
                        padding: 4px 8px;
                        font-size: 7px;
                        gap: 4px;
                    }

                    .ws-status-dot {
                        width: 5px;
                        height: 5px;
                    }
                }
            </style>
        `;
        document.body.appendChild(this.container);
    }

    /**
     * Setup WebSocket event listeners
     */
    private setupWebSocketListeners(): void {
        // Connection status
        websocketService.on('connected', () => {
            this.updateConnectionStatus('connecting');
        });

        websocketService.on('auth_success', () => {
            this.updateConnectionStatus('connected');
        });

        websocketService.on('disconnected', () => {
            this.updateConnectionStatus('disconnected');
        });

        // Rank change notifications
        websocketService.on('rank_change', (data: RankChangeEvent) => {
            if (data.change > 0) {
                this.show({
                    id: `rank-${Date.now()}`,
                    type: 'rank',
                    title: 'Rank Up!',
                    message: `You moved up ${data.change} position${data.change > 1 ? 's' : ''} to #${data.newRank}!`,
                    icon: '📈',
                    duration: 5000
                });
            } else if (data.change < 0) {
                this.show({
                    id: `rank-${Date.now()}`,
                    type: 'info',
                    title: 'Rank Changed',
                    message: `You moved to rank #${data.newRank}`,
                    icon: '📊',
                    duration: 4000
                });
            }
        });

        // Achievement notifications (via WebSocket, in addition to score response)
        websocketService.on('achievement_unlocked', (data: AchievementUnlockedEvent) => {
            this.show({
                id: `achievement-${data.id}`,
                type: 'achievement',
                title: 'Achievement Unlocked!',
                message: `${data.icon} ${data.name}\n${data.description}`,
                icon: '🏆',
                duration: 6000
            });
        });

        // Pokemon reveal notifications
        websocketService.on('pokemon_revealed', (data: PokemonRevealedEvent) => {
            if (data.pokemon) {
                this.show({
                    id: `pokemon-${data.pokemon.id}`,
                    type: 'success',
                    title: 'New Pokemon!',
                    message: `${data.pokemon.name} added to collection!\n${data.collectionProgress.count}/${data.collectionProgress.total} collected`,
                    icon: '🎉',
                    duration: 5000
                });
            }
        });

        // Streak milestone notifications
        websocketService.on('streak_milestone', (data: StreakMilestoneEvent) => {
            this.show({
                id: `streak-${data.streak}`,
                type: 'achievement',
                title: `${data.streak} Streak!`,
                message: `+${data.bonus} bonus points!`,
                icon: '🔥',
                duration: 4000
            });
        });

        // Leaderboard updates (other players)
        websocketService.on('leaderboard_update', (data: LeaderboardUpdateEvent) => {
            if (data.rank <= 10) {
                this.show({
                    id: `leaderboard-${Date.now()}`,
                    type: 'info',
                    title: 'Leaderboard Update',
                    message: `${data.displayName} scored ${data.score.toLocaleString()} pts on level ${data.level}!`,
                    icon: '🏅',
                    duration: 4000
                });
            }
        });

        // Top rank changes
        websocketService.on('top_rank_change', (data: any) => {
            this.show({
                id: `top-rank-${Date.now()}`,
                type: 'info',
                title: 'Top 10 Update',
                message: `${data.displayName} reached rank #${data.newRank}!`,
                icon: '👑',
                duration: 4000
            });
        });
    }

    /**
     * Show a notification
     */
    show(notification: Notification): void {
        if (!this.container) {
            this.createContainer();
        }

        // Create notification element
        const el = document.createElement('div');
        el.className = `live-notification ${notification.type}`;
        el.innerHTML = `
            ${notification.icon ? `<div class="notification-icon">${notification.icon}</div>` : ''}
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message.replace(/\n/g, '<br>')}</div>
            </div>
            <button class="notification-close">&times;</button>
        `;

        // Add close handler
        const closeBtn = el.querySelector('.notification-close');
        closeBtn?.addEventListener('click', () => this.hide(notification.id));

        // Add to container
        this.container!.appendChild(el);
        this.notifications.set(notification.id, el);

        // Auto-hide after duration
        const duration = notification.duration || 5000;
        setTimeout(() => {
            this.hide(notification.id);
        }, duration);

        // Limit max notifications
        if (this.notifications.size > 5) {
            const oldest = this.notifications.keys().next().value;
            if (oldest) {
                this.hide(oldest);
            }
        }
    }

    /**
     * Hide a notification
     */
    hide(id: string): void {
        const el = this.notifications.get(id);
        if (el) {
            el.classList.add('hiding');
            setTimeout(() => {
                el.remove();
                this.notifications.delete(id);
            }, 300);
        }
    }

    /**
     * Update connection status indicator
     */
    private updateConnectionStatus(status: 'connected' | 'disconnected' | 'connecting'): void {
        let indicator = document.getElementById('ws-status-indicator');

        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'ws-status-indicator';
            indicator.className = 'ws-status';
            document.body.appendChild(indicator);
        }

        indicator.className = `ws-status ${status}`;

        const statusText = {
            connected: 'LIVE',
            disconnected: 'OFFLINE',
            connecting: 'CONNECTING'
        };

        indicator.innerHTML = `
            <span class="ws-status-dot"></span>
            <span>${statusText[status]}</span>
        `;

        // Auto-hide connected status after 3 seconds
        if (status === 'connected') {
            setTimeout(() => {
                indicator?.classList.add('hiding');
                setTimeout(() => {
                    indicator?.remove();
                }, 300);
            }, 3000);
        }
    }

    /**
     * Manually show a custom notification
     */
    notify(title: string, message: string, type: NotificationType = 'info', icon?: string): void {
        this.notificationCount++;
        this.show({
            id: `custom-${this.notificationCount}`,
            type,
            title,
            message,
            icon,
            duration: 5000
        });
    }

    /**
     * Cleanup
     */
    destroy(): void {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        this.notifications.clear();
        this.initialized = false;
    }
}

// Export singleton instance
export const notificationManager = new NotificationManager();
