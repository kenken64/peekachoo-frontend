import * as AuthService from './auth-service';
import { Pokemon } from './pokemon-service';
import { config } from '../config';

export interface GameLevel {
    levelNumber: number;
    pokemonId: number;
    pokemonName: string;
    pokemonSprite: string;
    difficulty: number;
}

export interface Game {
    id: string;
    name: string;
    description: string;
    levels: GameLevel[];
    isPublished?: boolean;
    creatorName?: string;
    playCount?: number;
    activePlayerCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface GameError {
    code: string;
    message: string;
    activePlayerCount?: number;
}

export class GameService {
    private static API_URL = `${config.apiUrl}/games`;

    static async createGame(name: string, description: string, levels: GameLevel[]): Promise<Game> {
        const token = AuthService.getToken();
        const response = await fetch(this.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, description, levels })
        });
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to create game');
        }
        return result.data;
    }

    static async getMyGames(): Promise<Game[]> {
        const token = AuthService.getToken();
        const response = await fetch(`${this.API_URL}/my-games`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();
        return result.data || [];
    }

    static async getPublishedGames(limit: number = 20, offset: number = 0): Promise<Game[]> {
        const token = AuthService.getToken();
        const response = await fetch(`${this.API_URL}/published?limit=${limit}&offset=${offset}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();
        return result.data || [];
    }

    static async getGameById(id: string): Promise<Game | null> {
        const token = AuthService.getToken();
        const response = await fetch(`${this.API_URL}/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();
        return result.data || null;
    }

    static async updateGame(id: string, name: string, description: string, levels: GameLevel[]): Promise<void> {
        const token = AuthService.getToken();
        const response = await fetch(`${this.API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, description, levels })
        });
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to update game');
        }
    }

    static async togglePublish(id: string): Promise<boolean> {
        const token = AuthService.getToken();
        const response = await fetch(`${this.API_URL}/${id}/publish`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (!result.success && result.error) {
            const error = result.error as GameError;
            if (error.code === 'ACTIVE_PLAYERS') {
                throw new Error(error.message);
            }
            throw new Error(error.message || 'Failed to toggle publish status');
        }

        return result.isPublished;
    }

    static async deleteGame(id: string): Promise<void> {
        const token = AuthService.getToken();
        const response = await fetch(`${this.API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (!result.success) {
            const error = result.error as GameError;
            if (error?.code === 'GAME_PUBLISHED') {
                throw new Error(error.message);
            }
            throw new Error(error?.message || result.error || 'Failed to delete game');
        }
    }

    static async incrementPlayCount(id: string): Promise<number> {
        const token = AuthService.getToken();
        const response = await fetch(`${this.API_URL}/${id}/play`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();
        return result.playCount;
    }

    static pokemonToLevel(pokemon: Pokemon, levelNumber: number, difficulty: number = 1): GameLevel {
        return {
            levelNumber,
            pokemonId: pokemon.id,
            pokemonName: pokemon.name,
            pokemonSprite: pokemon.spriteUrl,
            difficulty
        };
    }
}
