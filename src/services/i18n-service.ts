import { logger } from '../config';

export type Language = 'en' | 'jp' | 'cn';

interface TranslationDictionary {
    [key: string]: string;
}

interface Translations {
    en: TranslationDictionary;
    jp: TranslationDictionary;
    cn: TranslationDictionary;
}

const translations: Translations = {
    en: {
        // App
        "app.title": "PEEKACHOO",

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
        "game.quizTime": "QUIZ TIME!",
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

        // Login
        "login.signIn": "Sign in to play",
        "login.username": "Username",
        "login.enterUsername": "Enter username",
        "login.register": "Register",
        "login.login": "Login",
        "login.securityKey": "Use your device biometrics\nor security key for login",
        "login.validating": "Validating session...",
        "login.registering": "Creating passkey...",
        "login.registerSuccess": "Registration successful!",
        "login.authenticating": "Authenticating...",
        "login.loginSuccess": "Login successful!",
        "login.userNotFound": "User not found. Click Register to create an account.",
        "login.enterUsernameError": "Please enter a username",
        "login.usernameLengthError": "Username must be at least 3 characters",

        // Notifications
        "notify.rankUp": "Rank Up!",
        "notify.rankUpMsg": "You moved up {0} position{1} to #{2}!",
        "notify.rankChanged": "Rank Changed",
        "notify.rankChangedMsg": "You moved to rank #{0}",
        "notify.achievement": "Achievement Unlocked!",
        "notify.newPokemon": "New Pokemon!",
        "notify.newPokemonMsg": "{0} added to collection!\n{1}/{2} collected",
        "notify.streak": "{0} Streak!",
        "notify.streakMsg": "+{0} bonus points!",
        "notify.leaderboardUpdate": "Leaderboard Update",
        "notify.leaderboardUpdateMsg": "{0} scored {1} pts on level {2}!",
        "notify.topRankUpdate": "Top 10 Update",
        "notify.topRankUpdateMsg": "{0} reached rank #{1}!",
        "notify.connected": "LIVE",
        "notify.disconnected": "OFFLINE",
        "notify.connecting": "CONNECTING",
    },
    jp: {
        // App
        "app.title": "クイックスカッコー",

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
        "menu.toggleLang": "中文", // Switch to CN
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
        "game.quizTime": "クイズタイム！",
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

        // Login
        "login.signIn": "ログインしてプレイ",
        "login.username": "ユーザー名",
        "login.enterUsername": "ユーザー名を入力",
        "login.register": "登録",
        "login.login": "ログイン",
        "login.securityKey": "生体認証または\nセキュリティキーでログイン",
        "login.validating": "セッションを確認中...",
        "login.registering": "パスキーを作成中...",
        "login.registerSuccess": "登録完了！",
        "login.authenticating": "認証中...",
        "login.loginSuccess": "ログイン成功！",
        "login.userNotFound": "ユーザーが見つかりません。登録ボタンからアカウントを作成してください。",
        "login.enterUsernameError": "ユーザー名を入力してください",
        "login.usernameLengthError": "ユーザー名は3文字以上で入力してください",

        // Notifications
        "notify.rankUp": "ランクアップ！",
        "notify.rankUpMsg": "{0} ランクアップ！ 現在 #{2} 位です！",
        "notify.rankChanged": "ランク変動",
        "notify.rankChangedMsg": "現在 #{0} 位です",
        "notify.achievement": "実績解除！",
        "notify.newPokemon": "新ポケモン！",
        "notify.newPokemonMsg": "{0} をコレクションに追加！\n{1}/{2} 匹",
        "notify.streak": "{0} 連勝！",
        "notify.streakMsg": "+{0} ボーナスポイント！",
        "notify.leaderboardUpdate": "ランキング更新",
        "notify.leaderboardUpdateMsg": "{0} がレベル {2} で {1} 点を獲得！",
        "notify.topRankUpdate": "トップ10更新",
        "notify.topRankUpdateMsg": "{0} が #{1} 位にランクイン！",
        "notify.connected": "接続中",
        "notify.disconnected": "オフライン",
        "notify.connecting": "接続試行中",
    },
    cn: {
        // App
        "app.title": "皮卡丘大冒险",

        // Menu
        "menu.play": "无尽模式",
        "menu.create": "创建游戏",
        "menu.leaderboard": "排行榜",
        "menu.stats": "我的数据",
        "menu.myGames": "我的游戏",
        "menu.communityGames": "社区游戏",
        "menu.loading": "加载中...",
        "menu.donation": "捐赠",
        "menu.logout": "登出",
        "menu.toggleSound": "切换声音",
        "menu.toggleLang": "English", // Switch to EN
        "menu.noMyGames": "你还没有创建任何游戏。<br>点击“创建游戏”开始吧！",
        "menu.noCommunityGames": "暂时没有社区游戏。<br>成为第一个发布者吧！",
        "menu.published": "已发布",
        "menu.draft": "草稿",
        "menu.playing": "🎮 {0} 人正在玩",
        "menu.playBtn": "开始",
        "menu.editBtn": "编辑",
        "menu.publishBtn": "发布",
        "menu.unpublishBtn": "取消发布",
        "menu.deleteBtn": "删除",
        "menu.noDescription": "暂无描述",
        "menu.levelsCount": "共 {0} 关",
        "menu.playsCount": "{0} 次游玩",
        "menu.byCreator": "作者: {0}",

        // Game
        "game.score": "分数: {0}",
        "game.level": "关卡: {0}",
        "game.lives": "生命: {0}",
        "game.gameOver": "游戏结束",
        "game.win": "胜利！",
        "game.paused": "暂停",
        "game.resume": "继续",
        "game.quit": "退出",
        "game.restart": "重新开始",
        "game.levelComplete": "关卡 {0} 完成！",
        "game.congrats": "🎉 恭喜！ 🎉",
        "game.completed": "你完成了 {0}！",
        "game.pokemonRevealed": "发现了 {0} 只宝可梦！",
        "game.finalScore": "最终得分: {0}",
        "game.returnMenu": "返回菜单",
        "game.ouch": "哎哟！！！",
        "game.sweet": "太棒了！！\n进入第 {0} 关",
        "game.newPokemon": "(新发现!)",
        "game.revealed": "(已发现)",
        "game.menu": "菜单",
        "game.howToPlay": "游戏说明",
        "game.filled": "覆盖率:",
        "game.target": "目标:",
        "game.controls": "操作方法",
        "game.objective": "目标",
        "game.rules": "规则",
        "game.dangers": "危险",
        "game.tips": "提示",
        "game.quizTime": "问答时间！",
        "game.gotIt": "✓ 明白了！",
        "game.howToPlayTitle": "🎮 游戏说明",
        "game.controlsList": "<li><strong>方向键</strong> - 沿边界移动</li><li><strong>↑ 上</strong> - 向上移动</li><li><strong>↓ 下</strong> - 向下移动</li><li><strong>← 左</strong> - 向左移动</li><li><strong>→ 右</strong> - 向右移动</li>",
        "game.objectiveText": "通过画线圈地来占领区域。填满 <strong style=\"color: #FFD700;\">75%</strong> 或更多区域以显示隐藏图像并进入下一关！",
        "game.rulesList": "<li>你只能在<strong>边界</strong>或<strong>已占领区域</strong>上移动</li><li>当你进入未占领区域时，会画出一条线</li><li>回到已占领区域以闭合形状并填充它</li><li>没有敌人的区域会被填充！</li>",
        "game.dangersList": "<li><strong style=\"color: #FF6B6B;\">Qix</strong> - 在中心弹跳的敌人。画线时不要让它碰到你的线！</li><li><strong style=\"color: #FF6B6B;\">Sparky</strong> - 沿边界巡逻的敌人。避开它们！</li><li>如果被击中，你会失去一条生命并重新开始本关</li>",
        "game.tipsList": "<li>快速画线以降低风险</li><li>先占领小区域以确保安全</li><li>观察敌人模式后再行动</li><li>一次圈更大的区域可以获得更多百分比！</li>",

        // Leaderboard
        "leaderboard.title": "排行榜",
        "leaderboard.rank": "排名",
        "leaderboard.player": "玩家",
        "leaderboard.score": "分数",
        "leaderboard.level": "关卡",
        "leaderboard.daily": "每日",
        "leaderboard.weekly": "每周",
        "leaderboard.monthly": "每月",
        "leaderboard.allTime": "总榜",
        "leaderboard.back": "返回",
        "leaderboard.noData": "暂无数据！",
        "leaderboard.streak": "连胜",
        "leaderboard.prev": "< 上一页",
        "leaderboard.next": "下一页 >",
        "leaderboard.page": "第 {0} 页",
        "leaderboard.loading": "加载中...",

        // Stats
        "stats.title": "玩家数据",
        "stats.overview": "概览",
        "stats.achievements": "成就",
        "stats.history": "历史",
        "stats.collection": "图鉴",
        "stats.loading": "加载中...",
        "stats.error": "加载数据失败",
        "stats.globalRank": "全球排名",
        "stats.topPercent": "前 {0}%",
        "stats.ofPlayers": "共 {0} 名玩家",
        "stats.totalScore": "总分",
        "stats.bestGame": "最高分: {0}",
        "stats.highestLevel": "最高关卡",
        "stats.levelsCompleted": "完成 {0} 关",
        "stats.bestStreak": "最高连胜",
        "stats.currentStreak": "当前: {0}",
        "stats.gamesPlayed": "游戏次数",
        "stats.avgScore": "平均: {0} 分/局",
        "stats.playTime": "游戏时间",
        "stats.since": "始于 {0}",
        "stats.performance": "表现数据",
        "stats.territoryAvg": "平均领地",
        "stats.bestCoverage": "最佳覆盖",
        "stats.quizAccuracy": "问答准确率",
        "stats.fastestLevel": "最快通关",
        "stats.pokemonRevealed": "发现宝可梦",
        "stats.totalTerritory": "总领地",
        "stats.gamesPlayedTitle": "游戏次数",
        "stats.pokemonCollected": "收集宝可梦",
        
        // Create Game
        "create.title": "创建游戏",
        "create.editTitle": "编辑游戏",
        "create.name": "游戏名称",
        "create.description": "描述",
        "create.levels": "关卡",
        "create.save": "保存游戏",
        "create.update": "更新",
        "create.cancel": "取消",
        "create.addLevel": "添加关卡",
        "create.selectPokemon": "选择宝可梦",
        "create.search": "搜索...",
        "create.back": "返回",
        "create.gameDetails": "游戏详情",
        "create.enterName": "输入名称",
        "create.descriptionOptional": "描述 (可选)",
        "create.enterDescription": "输入描述",
        "create.searchPokemon": "搜索宝可梦",
        "create.syncApi": "从API同步",
        "create.enterPokemonName": "输入宝可梦名称",
        "create.gameLevels": "游戏关卡",
        "create.noLevels": "暂无关卡。<br>搜索并添加宝可梦",
        "create.syncing": "正在同步所有宝可梦...",
        "create.synced": "已同步 {0} 只宝可梦！",
        "create.syncFailed": "同步失败: {0}",

        // Login
        "login.signIn": "登录以开始游戏",
        "login.username": "用户名",
        "login.enterUsername": "输入用户名",
        "login.register": "注册",
        "login.login": "登录",
        "login.securityKey": "使用设备生物识别\n或安全密钥登录",
        "login.validating": "验证会话中...",
        "login.registering": "创建通行密钥中...",
        "login.registerSuccess": "注册成功！",
        "login.authenticating": "认证中...",
        "login.loginSuccess": "登录成功！",
        "login.userNotFound": "用户不存在。点击注册创建账户。",
        "login.enterUsernameError": "请输入用户名",
        "login.usernameLengthError": "用户名至少需要3个字符",

        // Notifications
        "notify.rankUp": "排名上升！",
        "notify.rankUpMsg": "你上升了 {0} 位，当前排名 #{2}！",
        "notify.rankChanged": "排名变动",
        "notify.rankChangedMsg": "你现在的排名是 #{0}",
        "notify.achievement": "成就解锁！",
        "notify.newPokemon": "新宝可梦！",
        "notify.newPokemonMsg": "{0} 已添加到图鉴！\n已收集 {1}/{2}",
        "notify.streak": "{0} 连胜！",
        "notify.streakMsg": "+{0} 奖励分！",
        "notify.leaderboardUpdate": "排行榜更新",
        "notify.leaderboardUpdateMsg": "{0} 在第 {2} 关获得了 {1} 分！",
        "notify.topRankUpdate": "前10名更新",
        "notify.topRankUpdateMsg": "{0} 达到了第 #{1} 名！",
        "notify.connected": "已连接",
        "notify.disconnected": "离线",
        "notify.connecting": "连接中",
    }
};

export class I18nService {
    private static currentLang: Language = 'en';
    private static listeners: (() => void)[] = [];

    static init() {
        const savedLang = localStorage.getItem('lang') as Language;
        if (savedLang && (savedLang === 'en' || savedLang === 'jp' || savedLang === 'cn')) {
            this.currentLang = savedLang;
        } else {
            // Detect browser language
            const browserLang = navigator.language;
            if (browserLang.startsWith('ja')) {
                this.currentLang = 'jp';
            } else if (browserLang.startsWith('zh')) {
                this.currentLang = 'cn';
            } else {
                this.currentLang = 'en';
            }
        }

        this.applyLangToDOM();
        logger.log(`[I18n] Initialized with language: ${this.currentLang}`);
    }

    static getLang(): Language {
        return this.currentLang;
    }

    static setLang(lang: Language) {
        this.currentLang = lang;
        localStorage.setItem('lang', lang);
        this.applyLangToDOM();
        logger.log(`[I18n] Language set to: ${lang}`);
        this.notifyListeners();
    }

    private static applyLangToDOM() {
        document.body.classList.remove('lang-jp', 'lang-cn');
        
        if (this.currentLang === 'jp') {
            document.body.classList.add('lang-jp');
            document.documentElement.lang = 'ja';
        } else if (this.currentLang === 'cn') {
            document.body.classList.add('lang-cn');
            document.documentElement.lang = 'zh';
        } else {
            document.documentElement.lang = 'en';
        }
    }

    static toggleLang() {
        if (this.currentLang === 'en') {
            this.setLang('jp');
        } else if (this.currentLang === 'jp') {
            this.setLang('cn');
        } else {
            this.setLang('en');
        }
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
