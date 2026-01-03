import * as AuthService from './auth-service';
import { config } from '../config';

// Types
export interface LeaderboardEntry {
    rank: number;
    userId: string;
    displayName: string;
    totalScore: number;
    highestLevel: number;
    bestStreak: number;
    gamesPlayed: number;
    achievementCount: number;
    lastPlayedAt: string;
    isOnline: boolean;
}

export interface LeaderboardResponse {
    leaderboard: LeaderboardEntry[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
    period: string;
    periodStart: string;
    periodEnd: string;
    lastUpdated: string;
}

export interface AroundMeResponse {
    player: {
        rank: number;
        totalScore: number;
        percentile: number;
    };
    above: LeaderboardEntry[];
    below: LeaderboardEntry[];
    period: string;
}

export interface ScoreBreakdown {
    territoryScore: number;
    timeBonus: number;
    lifeBonus: number;
    quizBonus: number;
    subtotal: number;
    levelMultiplier: number;
    levelScore: number;
    streakBonus: number;
    totalScore: number;
}

export interface ScoreSubmissionResult {
    scoreId: string;
    breakdown: ScoreBreakdown;
    session: {
        sessionScore: number;
        levelsCompleted: number;
        currentStreak: number;
    };
    rankings: {
        globalRank: number;
        previousRank: number;
        rankChange: number;
        isNewPersonalBest: boolean;
        isNewLevelBest: boolean;
    };
    achievements: {
        unlocked: Array<{
            id: string;
            name: string;
            description: string;
            icon: string;
            points: number;
        }>;
    };
    pokemon: {
        pokemonId: number;
        pokemonName: string;
        isNewReveal: boolean;
        collectionCount: number;
        collectionTotal: number;
    };
}

export type LeaderboardPeriod = 'all_time' | 'monthly' | 'weekly' | 'daily';
export type LeaderboardSortBy = 'score' | 'level' | 'streak';

export class LeaderboardService {
    private static API_URL = `${config.apiUrl}/leaderboard`;

    /**
     * Get global leaderboard
     */
    static async getGlobalLeaderboard(params: {
        period?: LeaderboardPeriod;
        limit?: number;
        offset?: number;
        sortBy?: LeaderboardSortBy;
    } = {}): Promise<LeaderboardResponse> {
        const token = AuthService.getToken();
        const queryParams = new URLSearchParams();
        if (params.period) queryParams.set('period', params.period);
        if (params.limit) queryParams.set('limit', params.limit.toString());
        if (params.offset) queryParams.set('offset', params.offset.toString());
        if (params.sortBy) queryParams.set('sortBy', params.sortBy);

        const response = await fetch(`${this.API_URL}/global?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to fetch leaderboard');
        }

        return result.data;
    }

    /**
     * Get leaderboard entries around the current player
     */
    static async getAroundMe(params: {
        period?: LeaderboardPeriod;
        range?: number;
    } = {}): Promise<AroundMeResponse> {
        const token = AuthService.getToken();
        const queryParams = new URLSearchParams();
        if (params.period) queryParams.set('period', params.period);
        if (params.range) queryParams.set('range', params.range.toString());

        const response = await fetch(`${this.API_URL}/around-me?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to fetch around me');
        }

        return result.data;
    }

    /**
     * Get leaderboard for a specific level
     */
    static async getLevelLeaderboard(level: number, params: {
        limit?: number;
        offset?: number;
    } = {}): Promise<{
        level: number;
        leaderboard: LeaderboardEntry[];
        pagination: { total: number; limit: number; offset: number; hasMore: boolean };
    }> {
        const token = AuthService.getToken();
        const queryParams = new URLSearchParams();
        if (params.limit) queryParams.set('limit', params.limit.toString());
        if (params.offset) queryParams.set('offset', params.offset.toString());

        const response = await fetch(`${this.API_URL}/level/${level}?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to fetch level leaderboard');
        }

        return result.data;
    }

    /**
     * Get leaderboard for a custom game
     */
    static async getGameLeaderboard(gameId: string, params: {
        limit?: number;
        offset?: number;
    } = {}): Promise<{
        game: { id: string; name: string; creatorName: string; levelCount: number; playCount: number };
        leaderboard: LeaderboardEntry[];
        pagination: { total: number; limit: number; offset: number; hasMore: boolean };
    }> {
        const token = AuthService.getToken();
        const queryParams = new URLSearchParams();
        if (params.limit) queryParams.set('limit', params.limit.toString());
        if (params.offset) queryParams.set('offset', params.offset.toString());

        const response = await fetch(`${this.API_URL}/game/${gameId}?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to fetch game leaderboard');
        }

        return result.data;
    }

    /**
     * Submit a score after completing a level
     */
    static async submitScore(data: {
        gameId?: string | null;
        sessionId: string;
        level: number;
        territoryPercentage: number;
        timeTakenSeconds: number;
        livesRemaining: number;
        quizAttempts: number;
        pokemonId?: number | null;
        pokemonName?: string | null;
    }): Promise<ScoreSubmissionResult> {
        const token = AuthService.getToken();
        const response = await fetch(`${this.API_URL}/scores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to submit score');
        }

        return result.data;
    }

    /**
     * Start a new game session
     */
    static async startSession(gameId?: string | null): Promise<string> {
        const token = AuthService.getToken();
        const response = await fetch(`${this.API_URL}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ gameId })
        });
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to start session');
        }

        return result.data.sessionId;
    }

    /**
     * End a game session
     */
    static async endSession(sessionId: string): Promise<{
        sessionId: string;
        totalScore: number;
        levelsCompleted: number;
        highestLevel: number;
        maxStreak: number;
    }> {
        const token = AuthService.getToken();
        const response = await fetch(`${this.API_URL}/sessions/${sessionId}/end`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to end session');
        }

        return result.data;
    }
}
