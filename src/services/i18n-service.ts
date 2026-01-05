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
        "menu.noMyGames": "You haven't created any games yet.<br>Click \"Create Game\" to start!",
        "menu.noCommunityGames": "No community games available yet.<br>Be the first to publish one!",
        "menu.published": "Published",
        "menu.draft": "Draft",
        "menu.playing": "🎮 {0} playing",
        "menu.playBtn": "Play",
        "menu.editBtn": "Edit",
        "menu.publishBtn": "Publish",
        "menu.unpublishBtn": "Unpublish",
        "menu.deleteBtn": "Delete",
        "menu.noDescription": "No description",
        "menu.levelsCount": "{0} levels",
        "menu.playsCount": "{0} plays",
        "menu.byCreator": "by {0}",

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
        "game.menu": "Menu",
        "game.howToPlay": "How to Play",
        "game.filled": "% Filled:",
        "game.target": "% Target:",
        "game.controls": "Controls",
        "game.objective": "Objective",
        "game.rules": "Rules",
        "game.dangers": "Dangers",
        "game.tips": "Tips",
        "game.gotIt": "✓ Got it!",
        "game.howToPlayTitle": "🎮 How to Play",
        "game.controlsList": "<li><strong>Arrow Keys</strong> - Move your player around the border</li><li><strong>↑ Up</strong> - Move up</li><li><strong>↓ Down</strong> - Move down</li><li><strong>← Left</strong> - Move left</li><li><strong>→ Right</strong> - Move right</li>",
        "game.objectiveText": "Claim territory by drawing lines across the playing field. Fill up <strong style=\"color: #FFD700;\">75%</strong> or more of the area to reveal the hidden image and advance to the next level!",
        "game.rulesList": "<li>You can only move along the <strong>border</strong> or <strong>claimed areas</strong></li><li>When you venture into unclaimed territory, you draw a line</li><li>Complete a shape by returning to claimed territory to fill it in</li><li>The area without enemies gets filled!</li>",
        "game.dangersList": "<li><strong style=\"color: #FF6B6B;\">Qix</strong> - The bouncing enemy in the center. Don't let it touch your line while drawing!</li><li><strong style=\"color: #FF6B6B;\">Sparky</strong> - Enemies that patrol the borders. Avoid them!</li><li>If hit, you lose a life and restart the level</li>",
        "game.tipsList": "<li>Draw quickly to minimize risk</li><li>Claim smaller areas at first for safety</li><li>Watch enemy patterns before making your move</li><li>Larger claims give more area percentage!</li>",

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
        "leaderboard.streak": "STREAK",
        "leaderboard.prev": "< PREV",
        "leaderboard.next": "NEXT >",
        "leaderboard.page": "Page {0}",
        "leaderboard.loading": "Loading...",

        // Stats
        "stats.title": "PLAYER STATS",
        "stats.overview": "OVERVIEW",
        "stats.achievements": "ACHIEVEMENTS",
        "stats.history": "HISTORY",
        "stats.collection": "COLLECTION",
        "stats.loading": "Loading...",
        "stats.error": "Failed to load stats",
        "stats.globalRank": "Global Rank",
        "stats.topPercent": "Top {0}%",
        "stats.ofPlayers": "of {0} players",
        "stats.totalScore": "Total Score",
        "stats.bestGame": "Best game: {0}",
        "stats.highestLevel": "Highest Level",
        "stats.levelsCompleted": "{0} levels completed",
        "stats.bestStreak": "Best Streak",
        "stats.currentStreak": "Current: {0}",
        "stats.gamesPlayed": "Games Played",
        "stats.avgScore": "Avg: {0} pts/game",
        "stats.playTime": "Play Time",
        "stats.since": "Since {0}",
        "stats.performance": "Performance Stats",
        "stats.territoryAvg": "Territory Avg",
        "stats.bestCoverage": "Best Coverage",
        "stats.quizAccuracy": "Quiz Accuracy",
        "stats.fastestLevel": "Fastest Level",
        "stats.pokemonRevealed": "Pokemon Revealed",
        "stats.totalTerritory": "Total Territory",
        "stats.gamesPlayedTitle": "Games Played",
        "stats.pokemonCollected": "Pokémon Collected",
        
        // Create Game
        "create.title": "CREATE GAME",
        "create.editTitle": "EDIT GAME",
        "create.name": "Game Name",
        "create.description": "Description",
        "create.levels": "Levels",
        "create.save": "Save Game",
        "create.update": "Update",
        "create.cancel": "Cancel",
        "create.addLevel": "Add Level",
        "create.selectPokemon": "Select Pokémon",
        "create.search": "Search...",
        "create.back": "Back",
        "create.gameDetails": "GAME DETAILS",
        "create.enterName": "Enter name",
        "create.descriptionOptional": "Description (optional)",
        "create.enterDescription": "Enter description",
        "create.searchPokemon": "SEARCH POKEMON",
        "create.syncApi": "Sync from API",
        "create.enterPokemonName": "Enter Pokemon name",
        "create.gameLevels": "GAME LEVELS",
        "create.noLevels": "No levels yet.<br>Search and add Pokemon",
        "create.syncing": "Syncing all Pokemon...",
        "create.synced": "Synced {0} Pokemon!",
        "create.syncFailed": "Sync failed: {0}",
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
        "menu.noMyGames": "まだゲームを作成していません。<br>「ゲーム作成」をクリックして始めましょう！",
        "menu.noCommunityGames": "コミュニティゲームはまだありません。<br>最初のゲームを公開しましょう！",
        "menu.published": "公開中",
        "menu.draft": "下書き",
        "menu.playing": "🎮 {0}人がプレイ中",
        "menu.playBtn": "プレイ",
        "menu.editBtn": "編集",
        "menu.publishBtn": "公開",
        "menu.unpublishBtn": "非公開",
        "menu.deleteBtn": "削除",
        "menu.noDescription": "説明なし",
        "menu.levelsCount": "全{0}レベル",
        "menu.playsCount": "{0} プレイ",
        "menu.byCreator": "作成者: {0}",

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
        "game.menu": "メニュー",
        "game.howToPlay": "遊び方",
        "game.filled": "獲得率:",
        "game.target": "目標:",
        "game.controls": "操作方法",
        "game.objective": "目的",
        "game.rules": "ルール",
        "game.dangers": "危険",
        "game.tips": "ヒント",
        "game.gotIt": "✓ 分かった！",
        "game.howToPlayTitle": "🎮 遊び方",
        "game.controlsList": "<li><strong>矢印キー</strong> - プレイヤーを移動</li><li><strong>↑ 上</strong> - 上へ移動</li><li><strong>↓ 下</strong> - 下へ移動</li><li><strong>← 左</strong> - 左へ移動</li><li><strong>→ 右</strong> - 右へ移動</li>",
        "game.objectiveText": "線を引いて陣地を広げましょう。<strong style=\"color: #FFD700;\">75%</strong> 以上のエリアを埋めると、隠された画像が現れて次のレベルに進めます！",
        "game.rulesList": "<li><strong>境界線</strong>や<strong>自分の陣地</strong>の上だけ移動できます</li><li>未開拓のエリアに入ると線を引きます</li><li>自分の陣地に戻ると、囲んだエリアが埋まります</li><li>敵がいない方のエリアが埋まります！</li>",
        "game.dangersList": "<li><strong style=\"color: #FF6B6B;\">Qix (クイックス)</strong> - 中央を跳ね回る敵。線を引いている最中に触れないように！</li><li><strong style=\"color: #FF6B6B;\">Sparky (スパーキー)</strong> - 境界線を巡回する敵。避けましょう！</li><li>当たるとライフを失い、レベルの最初からやり直しです</li>",
        "game.tipsList": "<li>素早く線を引いてリスクを減らしましょう</li><li>最初は小さなエリアから確保するのが安全です</li><li>敵の動きをよく見てから動き出しましょう</li><li>大きく囲めば獲得率もアップ！</li>",

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
        "leaderboard.streak": "連勝",
        "leaderboard.prev": "< 前へ",
        "leaderboard.next": "次へ >",
        "leaderboard.page": "ページ {0}",
        "leaderboard.loading": "読み込み中...",

        // Stats
        "stats.title": "プレイヤーステータス",
        "stats.overview": "概要",
        "stats.achievements": "実績",
        "stats.history": "履歴",
        "stats.collection": "コレクション",
        "stats.loading": "読み込み中...",
        "stats.error": "ステータスの読み込みに失敗しました",
        "stats.globalRank": "世界ランク",
        "stats.topPercent": "上位 {0}%",
        "stats.ofPlayers": "全 {0} プレイヤー中",
        "stats.totalScore": "合計スコア",
        "stats.bestGame": "最高スコア: {0}",
        "stats.highestLevel": "最高レベル",
        "stats.levelsCompleted": "{0} レベルクリア",
        "stats.bestStreak": "最高連勝",
        "stats.currentStreak": "現在: {0}",
        "stats.gamesPlayed": "プレイ回数",
        "stats.avgScore": "平均: {0} 点/回",
        "stats.playTime": "プレイ時間",
        "stats.since": "{0} から",
        "stats.performance": "パフォーマンス",
        "stats.territoryAvg": "平均領域",
        "stats.bestCoverage": "最高領域",
        "stats.quizAccuracy": "クイズ正解率",
        "stats.fastestLevel": "最速クリア",
        "stats.pokemonRevealed": "発見ポケモン",
        "stats.totalTerritory": "合計領域",
        "stats.gamesPlayedTitle": "プレイ回数",
        "stats.pokemonCollected": "収集ポケモン",
        
        // Create Game
        "create.title": "ゲーム作成",
        "create.editTitle": "ゲーム編集",
        "create.name": "ゲーム名",
        "create.description": "説明",
        "create.levels": "レベル",
        "create.save": "保存",
        "create.update": "更新",
        "create.cancel": "キャンセル",
        "create.addLevel": "レベル追加",
        "create.selectPokemon": "ポケモン選択",
        "create.search": "検索...",
        "create.back": "戻る",
        "create.gameDetails": "ゲーム詳細",
        "create.enterName": "名前を入力",
        "create.descriptionOptional": "説明 (任意)",
        "create.enterDescription": "説明を入力",
        "create.searchPokemon": "ポケモン検索",
        "create.syncApi": "APIから同期",
        "create.enterPokemonName": "ポケモン名を入力",
        "create.gameLevels": "ゲームレベル",
        "create.noLevels": "レベルがありません。<br>ポケモンを検索して追加してください",
        "create.syncing": "全ポケモンを同期中...",
        "create.synced": "{0}匹のポケモンを同期しました！",
        "create.syncFailed": "同期に失敗しました: {0}",
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

        // Apply class
        if (this.currentLang === 'jp') {
            document.body.classList.add('lang-jp');
        } else {
            document.body.classList.remove('lang-jp');
        }

        logger.log(`[I18n] Initialized with language: ${this.currentLang}`);
    }

    static getLang(): Language {
        return this.currentLang;
    }

    static setLang(lang: Language) {
        this.currentLang = lang;
        localStorage.setItem('lang', lang);
        
        // Update body class for styling
        if (lang === 'jp') {
            document.body.classList.add('lang-jp');
        } else {
            document.body.classList.remove('lang-jp');
        }

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
