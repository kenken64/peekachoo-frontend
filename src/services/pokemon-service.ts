import * as AuthService from './auth-service';
import { config } from '../config';

export interface Pokemon {
    id: number;
    name: string;
    nameJp?: string;
    nameCn?: string;
    height: number;
    weight: number;
    baseExperience: number;
    spriteUrl: string;
    types: string[];
    abilities: string[];
    stats: any;
}

export class PokemonService {
    private static API_URL = `${config.apiUrl}/pokemon`;

    static async syncPokemon(syncAll: boolean = false, limit: number = 50): Promise<any> {
        const token = AuthService.getToken();
        const response = await fetch(`${this.API_URL}/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ syncAll, limit })
        });
        return response.json();
    }

    static async getAllPokemon(limit: number = 50, offset: number = 0): Promise<Pokemon[]> {
        const token = AuthService.getToken();
        const response = await fetch(`${this.API_URL}?limit=${limit}&offset=${offset}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();
        return result.data || [];
    }

    static async searchPokemon(query: string): Promise<Pokemon[]> {
        const token = AuthService.getToken();
        const response = await fetch(`${this.API_URL}/search?q=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();
        return result.data || [];
    }

    static async getPokemonById(id: number): Promise<Pokemon | null> {
        const token = AuthService.getToken();
        const response = await fetch(`${this.API_URL}/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();
        return result.data || null;
    }

    static async getPokemonByType(type: string): Promise<Pokemon[]> {
        const token = AuthService.getToken();
        const response = await fetch(`${this.API_URL}/type/${type}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();
        return result.data || [];
    }

    static async getRandomUnrevealed(): Promise<{
        id: number;
        name: string;
        name_jp?: string;
        name_cn?: string;
        spriteUrl: string;
        types: string[];
        isNew: boolean;
        revealedCount: number;
        totalCount: number;
    } | null> {
        const token = AuthService.getToken();
        const response = await fetch(`${this.API_URL}/random-unrevealed`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();
        if (result.success) {
            return result.data;
        }
        return null;
    }
}
