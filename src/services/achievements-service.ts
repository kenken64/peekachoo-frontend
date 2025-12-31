import * as AuthService from './auth-service';
import { config } from '../config';

// Types
export type AchievementCategory =
    | 'progress'
    | 'performance'
    | 'streak'
    | 'quiz'
    | 'territory'
    | 'collection'
    | 'score';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: AchievementCategory;
    points: number;
    rarity: number;
}

export interface UnlockedAchievement extends Achievement {
    unlockedAt: string;
}

export interface LockedAchievement extends Achievement {
    progress?: {
        current: number;
        target: number;
        percentage: number;
    };
    hint?: string;
}

export interface AchievementsResponse {
    unlocked: UnlockedAchievement[];
    locked: LockedAchievement[];
    totalPoints: number;
    maxPoints: number;
    completionPercentage: number;
}

export interface CategorySummary {
    category: string;
    total: number;
    unlocked: number;
    percentage: number;
    totalPoints: number;
    earnedPoints: number;
}

export class AchievementsService {
    private static API_URL = `${config.apiUrl}/achievements`;

    /**
     * Get all achievements with player's progress
     */
    static async getAchievements(): Promise<AchievementsResponse> {
        const token = AuthService.getToken();
        const response = await fetch(this.API_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to fetch achievements');
        }

        return result.data;
    }

    /**
     * Get a specific achievement
     */
    static async getAchievement(achievementId: string): Promise<Achievement & {
        isUnlocked: boolean;
        unlockedAt?: string;
        progress: { current: number; target: number; percentage: number };
        recentUnlockers: Array<{ displayName: string; unlockedAt: string }>;
    }> {
        const token = AuthService.getToken();
        const response = await fetch(`${this.API_URL}/${achievementId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to fetch achievement');
        }

        return result.data;
    }

    /**
     * Get achievements by category
     */
    static async getAchievementsByCategory(category: AchievementCategory): Promise<{
        category: string;
        achievements: Array<Achievement & {
            isUnlocked: boolean;
            unlockedAt?: string;
            progress: { current: number; target: number; percentage: number };
        }>;
        summary: { total: number; unlocked: number; percentage: number };
    }> {
        const token = AuthService.getToken();
        const response = await fetch(`${this.API_URL}/category/${category}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to fetch category achievements');
        }

        return result.data;
    }

    /**
     * Get all categories with summary
     */
    static async getCategories(): Promise<{ categories: CategorySummary[] }> {
        const token = AuthService.getToken();
        const response = await fetch(`${this.API_URL}/categories`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to fetch categories');
        }

        return result.data;
    }

    /**
     * Get category display name
     */
    static getCategoryDisplayName(category: AchievementCategory): string {
        const names: Record<AchievementCategory, string> = {
            progress: 'Progress',
            performance: 'Performance',
            streak: 'Streaks',
            quiz: 'Quiz Master',
            territory: 'Territory',
            collection: 'Collection',
            score: 'High Scores',
        };
        return names[category] || category;
    }

    /**
     * Get category icon
     */
    static getCategoryIcon(category: AchievementCategory): string {
        const icons: Record<AchievementCategory, string> = {
            progress: '🎮',
            performance: '🎯',
            streak: '🔥',
            quiz: '🧠',
            territory: '🌍',
            collection: '🐾',
            score: '💰',
        };
        return icons[category] || '🏆';
    }
}
