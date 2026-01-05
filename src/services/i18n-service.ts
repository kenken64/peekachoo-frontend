import { logger } from '../config';

export type Language = 'en' | 'jp';

interface TranslationDictionary {
    [key: string]: string;
}

interface Translations {
    en: TranslationDictionary;
    jp: TranslationDictionary;
}

const translations: Translations = {
    en: {
        // Menu
        "menu.play": "Endless Mode",
        "menu.create": "Create Game",
        "menu.leaderboard": "Leaderboard",
        "menu.stats": "My Stats",
        "menu.myGames": "MY GAMES",
        "menu.communityGames": "COMMUNITY GAMES",
        "menu.loading": "Loading...",
        "menu.donation": "Donation",
        "menu.logout": "Logout",
        "menu.toggleSound": "Toggle Sound",
        "menu.toggleLang": "日本語", // Switch to JP

        // Game
        "game.score": "Score: {0}",
        "game.level": "Level: {0}",
        "game.lives": "Lives: {0}",
        "game.gameOver": "GAME OVER",
        "game.win": "YOU WIN!",
        "game.paused": "PAUSED",
        "game.resume": "Resume",
        "game.quit": "Quit",
        "game.restart": "Restart",
        "game.levelComplete": "Level {0} Complete!",
        "game.congrats": "🎉 Congratulations! 🎉",
        "game.completed": "You completed {0}!",
        "game.pokemonRevealed": "{0} Pokémon revealed!",
        "game.finalScore": "Final Score: {0}",
        "game.returnMenu": "Return to Menu",
        "game.ouch": "Ouch!!!",
        "game.sweet": "Sweet!!\nOn to level {0}",
        "game.newPokemon": "(NEW!)",
        "game.revealed": "(already revealed)",

        // Leaderboard
        "leaderboard.title": "LEADERBOARD",
        "leaderboard.rank": "RANK",
        "leaderboard.player": "PLAYER",
        "leaderboard.score": "SCORE",
        "leaderboard.level": "LEVEL",
        "leaderboard.daily": "Daily",
        "leaderboard.weekly": "Weekly",
        "leaderboard.monthly": "Monthly",
        "leaderboard.allTime": "All Time",
        "leaderboard.back": "Back",
        "leaderboard.noData": "No scores yet!",

        // Stats
        "stats.title": "PLAYER STATS",
        "stats.gamesPlayed": "Games Played",
        "stats.totalScore": "Total Score",
        "stats.highestLevel": "Highest Level",
        "stats.pokemonCollected": "Pokémon Collected",
        
        // Create Game
        "create.title": "CREATE GAME",
        "create.name": "Game Name",
        "create.description": "Description",
        "create.levels": "Levels",
        "create.save": "Save Game",
        "create.cancel": "Cancel",
        "create.addLevel": "Add Level",
        "create.selectPokemon": "Select Pokémon",
        "create.search": "Search...",
    },
    jp: {
        // Menu
        "menu.play": "エンドレスモード",
        "menu.create": "ゲーム作成",
        "menu.leaderboard": "ランキング",
        "menu.stats": "ステータス",
        "menu.myGames": "マイゲーム",
        "menu.communityGames": "みんなのゲーム",
        "menu.loading": "読み込み中...",
        "menu.donation": "寄付",
        "menu.logout": "ログアウト",
        "menu.toggleSound": "音量切替",
        "menu.toggleLang": "English", // Switch to EN

        // Game
        "game.score": "スコア: {0}",
        "game.level": "レベル: {0}",
        "game.lives": "ライフ: {0}",
        "game.gameOver": "ゲームオーバー",
        "game.win": "クリア！",
        "game.paused": "一時停止",
        "game.resume": "再開",
        "game.quit": "終了",
        "game.restart": "リスタート",
        "game.levelComplete": "レベル {0} クリア！",
        "game.congrats": "🎉 おめでとう！ 🎉",
        "game.completed": "{0} をクリアしました！",
        "game.pokemonRevealed": "{0} 匹のポケモンを発見！",
        "game.finalScore": "最終スコア: {0}",
        "game.returnMenu": "メニューに戻る",
        "game.ouch": "痛っ！！！",
        "game.sweet": "やったね！！\nレベル {0} へ",
        "game.newPokemon": "(新発見!)",
        "game.revealed": "(発見済み)",

        // Leaderboard
        "leaderboard.title": "ランキング",
        "leaderboard.rank": "順位",
        "leaderboard.player": "プレイヤー",
        "leaderboard.score": "スコア",
        "leaderboard.level": "レベル",
        "leaderboard.daily": "デイリー",
        "leaderboard.weekly": "ウィークリー",
        "leaderboard.monthly": "マンスリー",
        "leaderboard.allTime": "全期間",
        "leaderboard.back": "戻る",
        "leaderboard.noData": "データがありません",

        // Stats
        "stats.title": "プレイヤーステータス",
        "stats.gamesPlayed": "プレイ回数",
        "stats.totalScore": "合計スコア",
        "stats.highestLevel": "最高レベル",
        "stats.pokemonCollected": "ポケモン収集数",

        // Create Game
        "create.title": "ゲーム作成",
        "create.name": "ゲーム名",
        "create.description": "説明",
        "create.levels": "レベル",
        "create.save": "保存",
        "create.cancel": "キャンセル",
        "create.addLevel": "レベル追加",
        "create.selectPokemon": "ポケモン選択",
        "create.search": "検索...",
    }
};

export class I18nService {
    private static currentLang: Language = 'en';
    private static listeners: (() => void)[] = [];

    static init() {
        const savedLang = localStorage.getItem('lang') as Language;
        if (savedLang && (savedLang === 'en' || savedLang === 'jp')) {
            this.currentLang = savedLang;
        } else {
            // Detect browser language
            const browserLang = navigator.language;
            if (browserLang.startsWith('ja')) {
                this.currentLang = 'jp';
            } else {
                this.currentLang = 'en';
            }
        }
        logger.log(`[I18n] Initialized with language: ${this.currentLang}`);
    }

    static getLang(): Language {
        return this.currentLang;
    }

    static setLang(lang: Language) {
        this.currentLang = lang;
        localStorage.setItem('lang', lang);
        logger.log(`[I18n] Language set to: ${lang}`);
        this.notifyListeners();
    }

    static toggleLang() {
        this.setLang(this.currentLang === 'en' ? 'jp' : 'en');
    }

    static t(key: string, ...args: any[]): string {
        const dict = translations[this.currentLang];
        let text = dict[key] || key;

        // Replace placeholders {0}, {1}, etc.
        args.forEach((arg, index) => {
            text = text.replace(`{${index}}`, String(arg));
        });

        return text;
    }

    static onChange(callback: () => void) {
        this.listeners.push(callback);
    }

    private static notifyListeners() {
        this.listeners.forEach(callback => callback());
    }
}

// Initialize immediately
I18nService.init();
