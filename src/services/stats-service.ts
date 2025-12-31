import * as AuthService from './auth-service';
import { config } from '../config';

// Types
export interface PlayerStats {
    highestLevelReached: number;
    totalLevelsCompleted: number;
    totalGamesPlayed: number;
    totalScoreAllTime: number;
    bestSingleGameScore: number;
    averageScorePerGame: number;
    totalTerritoryClaimed: number;
    averageCoverage: number;
    bestCoverage: number;
    fastestLevelSeconds: number | null;
    currentStreak: number;
    bestStreak: number;
    quizCorrectTotal: number;
    quizAttemptsTotal: number;
    quizAccuracy: number;
    totalPlayTimeSeconds: number;
    uniquePokemonRevealed: number;
    totalPokemon: number;
    firstPlayedAt: string | null;
    lastPlayedAt: string | null;
}

export interface PlayerRankings {
    global: {
        rank: number;
        total: number;
        percentile: number;
    };
    weekly?: {
        rank: number;
        total: number;
    };
}

export interface RecentGame {
    sessionId: string;
    gameId: string | null;
    gameName: string | null;
    levelsCompleted: number;
    highestLevel: number;
    totalScore: number;
    playedAt: string;
    duration: number;
}

export interface PlayerStatsResponse {
    user: {
        id: string;
        displayName: string;
        createdAt: string;
    };
    stats: PlayerStats;
    rankings: PlayerRankings;
    recentGames?: RecentGame[];
}

export interface LevelHistoryEntry {
    level: number;
    score: number;
    territoryPercentage: number;
    timeTakenSeconds: number;
    livesRemaining: number;
    quizAttempts: number;
    pokemonRevealed: string;
}

export interface GameHistoryEntry {
    sessionId: string;
    gameId: string | null;
    gameName: string | null;
    levelsCompleted: number;
    highestLevel: number;
    totalScore: number;
    maxStreak: number;
    playedAt: string;
    endedAt: string | null;
    duration: number;
    levels: LevelHistoryEntry[];
}

export interface CollectionPokemon {
    id: number;
    name: string;
    spriteUrl: string;
    types: string[];
    isRevealed: boolean;
    revealedAt?: string;
    timesRevealed?: number;
    bestCoverage?: number;
    fastestReveal?: number;
}

export interface CollectionResponse {
    summary: {
        revealed: number;
        total: number;
        percentage: number;
    };
    pokemon: CollectionPokemon[];
    recentlyRevealed: CollectionPokemon[];
}

export class StatsService {
    private static API_URL = `${config.apiUrl}/stats`;

    /**
     * Get current player's stats
     */
    static async getMyStats(): Promise<PlayerStatsResponse> {
        const token = AuthService.getToken();
        const response = await fetch(`${this.API_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to fetch stats');
        }

        return result.data;
    }

    /**
     * Get another player's public stats
     */
    static async getPlayerStats(userId: string): Promise<PlayerStatsResponse> {
        const token = AuthService.getToken();
        const response = await fetch(`${this.API_URL}/player/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to fetch player stats');
        }

        return result.data;
    }

    /**
     * Get player's game history
     */
    static async getGameHistory(params: {
        limit?: number;
        offset?: number;
        gameId?: string;
    } = {}): Promise<{
        history: GameHistoryEntry[];
        pagination: { total: number; limit: number; offset: number; hasMore: boolean };
    }> {
        const token = AuthService.getToken();
        const queryParams = new URLSearchParams();
        if (params.limit) queryParams.set('limit', params.limit.toString());
        if (params.offset) queryParams.set('offset', params.offset.toString());
        if (params.gameId) queryParams.set('gameId', params.gameId);

        const response = await fetch(`${this.API_URL}/history?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to fetch game history');
        }

        return result.data;
    }

    /**
     * Get player's Pokemon collection
     */
    static async getCollection(params: {
        filter?: 'all' | 'revealed' | 'hidden';
        sortBy?: 'id' | 'name' | 'revealed_at' | 'times_revealed';
        order?: 'asc' | 'desc';
    } = {}): Promise<CollectionResponse> {
        const token = AuthService.getToken();
        const queryParams = new URLSearchParams();
        if (params.filter) queryParams.set('filter', params.filter);
        if (params.sortBy) queryParams.set('sortBy', params.sortBy);
        if (params.order) queryParams.set('order', params.order);

        const response = await fetch(`${this.API_URL}/collection?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to fetch collection');
        }

        return result.data;
    }

    /**
     * Calculate skill breakdown for radar chart
     */
    static calculateSkillBreakdown(stats: PlayerStats): {
        territory: number;
        speed: number;
        survival: number;
        quiz: number;
    } {
        return {
            territory: Math.min(100, stats.averageCoverage * 120),
            speed: Math.min(100, Math.max(0, 100 - ((stats.fastestLevelSeconds || 60) - 15) * 2)),
            survival: Math.min(100, (stats.bestStreak / 20) * 100),
            quiz: stats.quizAccuracy * 100,
        };
    }

    /**
     * Format play time for display
     */
    static formatPlayTime(seconds: number): string {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
}
