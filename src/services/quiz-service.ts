import { getToken } from './auth-service';
import { config } from '../config';

const API_URL = config.apiUrl;

export interface QuizQuestion {
    question: string;
    choices: string[];
    correctAnswer: string;
    spriteUrl: string;
}

export class QuizService {
    /**
     * Generate a quiz question for a Pokemon
     */
    static async generateQuiz(pokemonName: string, spriteUrl: string, allPokemonNames: string[] = []): Promise<QuizQuestion> {
        const token = getToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${API_URL}/quiz/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                pokemonName,
                spriteUrl,
                allPokemonNames
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate quiz');
        }

        return response.json();
    }
}
