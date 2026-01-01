import { LeaderboardService, ScoreSubmissionResult } from '../services/leaderboard-service';
import { logger } from '../config';

/**
 * Level tracking data during gameplay
 */
interface LevelData {
    level: number;
    startTime: number;
    endTime?: number;
    territoryPercentage: number;
    livesRemaining: number;
    deathCount: number;
    quizAttempts: number;
    pokemonId?: number;
    pokemonName?: string;
    score?: number;
}

/**
 * Game session data
 */
interface SessionData {
    sessionId: string;
    gameId: string | null;
    startTime: number;
    currentLevel: number;
    totalScore: number;
    currentStreak: number;
    levelsCompleted: LevelData[];
    currentLevelData: LevelData | null;
}

/**
 * Session store for tracking game progress
 * Persists during a game session and handles score submissions
 */
class SessionStore {
    private session: SessionData | null = null;
    private static instance: SessionStore;

    private constructor() {}

    static getInstance(): SessionStore {
        if (!SessionStore.instance) {
            SessionStore.instance = new SessionStore();
        }
        return SessionStore.instance;
    }

    /**
     * Start a new game session
     */
    async startSession(gameId: string | null = null): Promise<string> {
        try {
            // Request session ID from server
            const sessionId = await LeaderboardService.startSession(gameId);

            this.session = {
                sessionId,
                gameId,
                startTime: Date.now(),
                currentLevel: 1,
                totalScore: 0,
                currentStreak: 0,
                levelsCompleted: [],
                currentLevelData: null,
            };

            logger.log('[SessionStore] Session started:', sessionId);
            return sessionId;
        } catch (error) {
            logger.error('[SessionStore] Failed to start session:', error);
            // Fallback to local session ID if server is unavailable
            const fallbackId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            this.session = {
                sessionId: fallbackId,
                gameId,
                startTime: Date.now(),
                currentLevel: 1,
                totalScore: 0,
                currentStreak: 0,
                levelsCompleted: [],
                currentLevelData: null,
            };
            return fallbackId;
        }
    }

    /**
     * Start tracking a new level
     */
    startLevel(level: number, pokemonId?: number, pokemonName?: string): void {
        if (!this.session) {
            logger.warn('[SessionStore] No active session, cannot start level');
            return;
        }

        this.session.currentLevel = level;
        this.session.currentLevelData = {
            level,
            startTime: Date.now(),
            territoryPercentage: 0,
            livesRemaining: 3,
            deathCount: 0,
            quizAttempts: 0,
            pokemonId,
            pokemonName,
        };

        logger.log('[SessionStore] Level started:', level);
    }

    /**
     * Update territory coverage during gameplay
     */
    updateTerritory(percentage: number): void {
        if (this.session?.currentLevelData) {
            this.session.currentLevelData.territoryPercentage = percentage;
        }
    }

    /**
     * Record a player death
     */
    recordDeath(): void {
        if (this.session?.currentLevelData) {
            this.session.currentLevelData.deathCount++;
            this.session.currentLevelData.livesRemaining--;
            // Reset streak on death
            this.session.currentStreak = 0;
            logger.log('[SessionStore] Death recorded, lives remaining:', this.session.currentLevelData.livesRemaining);
        }
    }

    /**
     * Update lives remaining (called when player loses a life)
     */
    updateLives(lives: number): void {
        if (this.session?.currentLevelData) {
            const previousLives = this.session.currentLevelData.livesRemaining;
            this.session.currentLevelData.livesRemaining = lives;

            // If lives decreased, it counts as a death
            if (lives < previousLives) {
                this.session.currentLevelData.deathCount++;
                this.session.currentStreak = 0;
            }
        }
    }

    /**
     * Record a quiz attempt
     */
    recordQuizAttempt(): void {
        if (this.session?.currentLevelData) {
            this.session.currentLevelData.quizAttempts++;
        }
    }

    /**
     * Complete the current level and submit score
     */
    async completeLevel(): Promise<ScoreSubmissionResult | null> {
        logger.log('[SessionStore] completeLevel called, session:', {
            hasSession: !!this.session,
            sessionId: this.session?.sessionId,
            currentLevelData: this.session?.currentLevelData
        });

        if (!this.session?.currentLevelData) {
            logger.warn('[SessionStore] No active level to complete - currentLevelData is null');
            return null;
        }

        const levelData = this.session.currentLevelData;
        levelData.endTime = Date.now();

        const timeTakenSeconds = Math.floor((levelData.endTime - levelData.startTime) / 1000);

        // If no deaths this level, increment streak
        if (levelData.deathCount === 0) {
            this.session.currentStreak++;
        }

        try {
            // Convert territory percentage from 0-100 to 0-1 for backend
            const territoryAsDecimal = levelData.territoryPercentage > 1
                ? levelData.territoryPercentage / 100
                : levelData.territoryPercentage;

            // Submit score to server
            const result = await LeaderboardService.submitScore({
                gameId: this.session.gameId,
                sessionId: this.session.sessionId,
                level: levelData.level,
                territoryPercentage: territoryAsDecimal,
                timeTakenSeconds,
                livesRemaining: levelData.livesRemaining,
                quizAttempts: levelData.quizAttempts || 1,
                pokemonId: levelData.pokemonId,
                pokemonName: levelData.pokemonName,
            });

            // Update session with result
            levelData.score = result.breakdown.totalScore;
            this.session.levelsCompleted.push(levelData);
            this.session.totalScore = result.session.sessionScore;
            this.session.currentStreak = result.session.currentStreak;
            this.session.currentLevelData = null;

            logger.log('[SessionStore] Level completed:', {
                level: levelData.level,
                score: result.breakdown.totalScore,
                totalScore: this.session.totalScore,
            });

            return result;
        } catch (error) {
            logger.error('[SessionStore] Failed to submit score:', error);
            // Still track locally even if submission fails
            this.session.levelsCompleted.push(levelData);
            this.session.currentLevelData = null;
            return null;
        }
    }

    /**
     * End the current game session
     */
    async endSession(): Promise<SessionData | null> {
        if (!this.session) {
            return null;
        }

        try {
            await LeaderboardService.endSession(this.session.sessionId);
        } catch (error) {
            logger.error('[SessionStore] Failed to end session on server:', error);
        }

        const session = this.session;
        this.session = null;

        logger.log('[SessionStore] Session ended:', {
            totalScore: session.totalScore,
            levelsCompleted: session.levelsCompleted.length,
        });

        return session;
    }

    /**
     * Get current session data
     */
    getSession(): SessionData | null {
        return this.session;
    }

    /**
     * Get current level data
     */
    getCurrentLevel(): LevelData | null {
        return this.session?.currentLevelData || null;
    }

    /**
     * Check if there's an active session
     */
    hasActiveSession(): boolean {
        return this.session !== null;
    }

    /**
     * Get session ID
     */
    getSessionId(): string | null {
        return this.session?.sessionId || null;
    }

    /**
     * Get current streak
     */
    getCurrentStreak(): number {
        return this.session?.currentStreak || 0;
    }

    /**
     * Get total session score
     */
    getTotalScore(): number {
        return this.session?.totalScore || 0;
    }

    /**
     * Get levels completed count
     */
    getLevelsCompleted(): number {
        return this.session?.levelsCompleted.length || 0;
    }

    /**
     * Get current level number
     */
    getCurrentLevelNumber(): number {
        return this.session?.currentLevel || 1;
    }
}

// Export singleton instance
export const sessionStore = SessionStore.getInstance();
export { SessionData, LevelData };
