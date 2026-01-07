/**
 * AudioService - Singleton service for managing game audio
 *
 * Handles sound effects and background music with:
 * - Volume control
 * - Mute/unmute functionality
 * - LocalStorage persistence for user preferences
 */

export type SoundKey =
	| "claim"
	| "death"
	| "levelComplete"
	| "enemySpawn"
	| "menuClick"
	| "quizCorrect"
	| "quizWrong";
export type MusicKey = "gameMusic" | "menuMusic";

interface AudioPreferences {
	sfxVolume: number;
	musicVolume: number;
	isMuted: boolean;
}

const STORAGE_KEY = "peekachoo_audio_prefs";

// Base64 encoded 8-bit sound effects (generated with JSFXR-style synthesis)
// These are short, retro-style sounds that match the NES.css aesthetic
const SOUND_DATA: Record<SoundKey, string> = {
	// Coin/powerup sound for territory claim
	claim:
		"data:audio/wav;base64,UklGRl4FAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YToFAACAgICAgICAgICAgICAgICAgICAgICBgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/v///////////////////////////////////////v79/Pv6+fj39vX08/Lx8O/u7ezr6uno5+bl5OPi4eDf3t3c29rZ2NfW1dTT0tHQz87NzMvKycjHxsXEw8LBwL++vby7urm4t7a1tLOysbCvrq2sq6qpqKempaSjoqGgn56dnJuamZiXlpWUk5KRkI+OjYyLiomIh4aFhIOCgYCAgICAgICAgICAgICAgICAgA==",

	// Explosion/hit sound for death
	death:
		"data:audio/wav;base64,UklGRoYEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YWIEAACAf4F+gn2DfIR7hXqGdod4iHmJeop7i3yMfY5+j3+QgJGBkoKTg5SElYaXh5iImYqai5yMnY6fj6CQoZGikqOTpJWllqeYqJmpmqqbrJytnq6fr6CwoLGhs6K0o7WktqS3pbilu6e8qL2pvqq/q8CswK3BrsKvw7DEscWxxrLHs8i0ybbKt8u4zLnNus66z7vQu9G80bzSvdO91L7Vv9bA18HYwtjD2cTaxdrG28fbyNzJ3crdy97M38zg0OHR4tPj1OTV5dbn1+jY6dnt2u/c8N3x3vLf8+D04fXi9uP34/jk+eX65vrn++j86f3q/uv/7ADtAO4B7wLwA/EE8gXzBvQH9Qj2CfcK+Av4DPkN+Q76D/oQ+xH7EvsT+xT7FfsW+hb6F/kY+Rj4GfgZ9xr2GvUb9BvzHPIc8R3wHe8e7h7tH+wf6yDqIOkh6CHnIuYi5SPlI+Qk4yTiJeEl4CbfJt4n3SfcKNso2inZKdgq1yrWK9Ur1CzTLNIt0S7QLs8vzi/NMMwwyTHIMcgyxzPGM8U0xDTDNcI1wTbANr83vje9OLw4uzm6Obk6uDq3O7Y7tTy0PLM9sj2xPrA+rz+uP60/rECrQKpBqUGoQqdCpkKlQ6RDo0SiRKFFoEWfRp5GnUecR5tIm0iaSZlJmEqXSpdLlkuVTJRMk02STZFOT05OT01QTE9LUEpRSVJIU0dUR1VGVkVXRFhDWUJaQVtAXD9dPl49Xz1gPGE7Yjtj",

	// Victory fanfare for level complete
	levelComplete:
		"data:audio/wav;base64,UklGRkIGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YR4GAACAgIGCg4SFhoeIiYqLjI2Oj5CRkpOUlZaXmJmam5ydnp+goaKjpKWmp6ipqqusra6vsLGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNzs/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fb3+Pn6+/z9/v///////////v79/Pv6+fj39vX08/Lx8O/u7ezr6uno5+bl5OPi4eDf3t3c29rZ2NfW1dTT0tHQz87NzMvKycjHxsXEw8LBwL++vby7urm4t7a1tLOysbCvrq2sq6qpqKempaSjoqGgn56dnJuamZiXlpWUk5KRkI+OjYyLiomIh4aFhIOCgYCAgICAgICBgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7///////////////7+/f38+/r5+Pf29fTz8vHw7+7t7Ovq6ejn5uXk4+Lh4N/e3dzb2tnY19bV1NPS0dDPzs3My8rJyMfGxcTDwsHAv769vLu6ubg=",

	// Warning beep for enemy spawn
	enemySpawn:
		"data:audio/wav;base64,UklGRjYCAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YRICAACAf4B/gH+Af4B/gH+Af4B/gH+Af4CAf39/gICAf39/gICAf39/gIGBfn5+gYKCfX19goODfHx8g4SEe3t7hIWFeXl5hYaGd3d3homJdXV1ioyMc3NzjI6OcXFxjo+PcHBwkJKScG9vkpSUb25ulZeXbm1tmJqabWxsnJycbGtrn6Cgampop6mnZ2dnqqysa2pqr7GxaWhov8TEdnZ21t3db29v7vb2fX193+fneXl59P7+hISE/v//j4+P+/v7mZmZ8/Pzn5+f5+fnpKSk2dnZp6entbW1qqqqoaGhrKysjo6OqqqqgICAp6eneHh4pqamcnJypqamcHBwqampb29vra2tb29vtLS0cHBwu7u7cnJywsLCdHR0yMjId3d3zc3NfX1909PTgoKC19fXiIiI2dnZjY2N2NjYkpKS1NTUlZWVz8/PlpaWycnJl5eXw8PDmZmZvb29m5ubtra2nZ2dr6+vn5+fqKiooaGhpaWlo6OjoKCgpKSkn5+foaGhnp6enZ2dnJycmpqamZmZlpaWk5OTkZGRj4+PjY2Ni4uLiYmJh4eHhYWFg4ODgYGBf39/gICAgICAgA==",

	// Click sound for menu
	menuClick:
		"data:audio/wav;base64,UklGRroBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YZYBAACAf4B/gH+Af4B/gH+AgICAgYKDhIWGiImKjI6PkZOVl5qcn6KlqKuusbS3ur3AwsPFx8nKy8zNzs7Oz87Ozs3NzMvKycjHxcTCwL68ubi2tLKwrqyqqKakoqCenJqYlpSSjouIhYJ/fHl2c3BybnBwd3h+hYyTmqCnrrS6v8TJzNDT1dfZ2tvb29va2dnY19bU09HOy8fDvri0r6umoZ2Zk5CQkZKVmp+krLK4vsXLz9PX2t3f4OHh4eDg39/e3dzb2djV0s7KxsC7trGsqKSgnpmWk5CQkZKWmp+kqrC2vMHHz9bh7Pf///////////////////////3z5djLvq+ilYl9cmhgWFJPTU5QU1hfZ2+Ag5KdqbXAxszT2d7i5efp6enp6Ofl4t7Z1M7IwLmyq6ahoJ6dnp+hpKmvtLvCyM/V2t/j5ung",

	// Success chime for quiz correct
	quizCorrect:
		"data:audio/wav;base64,UklGRjoCAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YRYCAACAf4CAf4GAf4GAf4GBf4GBf4GCf4KCf4KDf4ODf4OEf4SEf4SFf4WFf4WGf4aHgIeIgIiJgImKgIqLgIuMgIyNgI2OgY6PgY+RgZGSgZKUgZSVgpWXgpebg5idhZyihqCoiKSuj6q1lbC8nLfEo77Mqr/Qtb/TvMDVwcDYxsDZysDazcDb0MDc08De1sDf2MDh2cDi2cDj2cDk2sDl2sDl2sHm2sLn2sTo3Mfq38rv5M747+H58en79uv8+e78+fD8+fD8+fD8+fD8+fD8+PD8+O/89+/89+789u789O389O388u387+386+376e375u374O373e372u371O370O370O370O/70e/71O/71+/72u/73e/74O/74+/75vD76PD76vH77fH78PH78/L79vP7+fP7+/T8/fX8//b9AP///wAAAAAAAAD/AAD/+f/5+Pn38vbw7uzq5uXh39vY1dHOysfEwL25trOvrKiloZ6amJSTkpGQj4+OjY6Njo2OjY6Ojo6Oj4+QkJGRkpOUlZeYmpyeoKKkpqiqrK6wsbO1tri6vL7Aw8XHycvNz9HT1NbX2Nnb3N3e3+Dh4uPk5OXm5ufn6Onq6uvr7O3t7u7v8PHy8vP09fX29/f4+fn5+vr7+/z8/f3+/v///////////w==",

	// Error buzz for quiz wrong
	quizWrong:
		"data:audio/wav;base64,UklGRoQBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YWABAACAf4B/gH9/f39/f39/f3+AgICAgICBgYGBgoKCg4ODhISFhYaGh4eIiImJioqLi4yMjY2Oj4+QkJGRkpKTk5SUlZWWlpaXl5iYmZmampqam5ubnJycnZ2dnZ6enp6fn5+foKCgoKChoaGhoqKioqOjo6OkpKSk",
};

// External music file paths (relative to assets folder)
const MUSIC_FILES: Record<MusicKey, string> = {
	gameMusic: "assets/sounds/music/game-music.mp3",
	menuMusic: "assets/sounds/music/menu-music.mp3",
};

class AudioService {
	private static instance: AudioService | null = null;

	private sounds: Map<SoundKey, HTMLAudioElement> = new Map();
	private music: HTMLAudioElement | null = null;
	private currentMusicKey: MusicKey | null = null;

	private sfxVolume: number = 0.7;
	private musicVolume: number = 0.5;
	private muted: boolean = false;

	private initialized: boolean = false;
	private userInteracted: boolean = false;

	private constructor() {
		this.loadPreferences();
		this.initializeSounds();
		this.setupUserInteractionListener();
	}

	static getInstance(): AudioService {
		if (!AudioService.instance) {
			AudioService.instance = new AudioService();
		}
		return AudioService.instance;
	}

	private initializeSounds(): void {
		// Pre-create audio elements for each sound effect
		(Object.keys(SOUND_DATA) as SoundKey[]).forEach((key) => {
			const audio = new Audio(SOUND_DATA[key]);
			audio.volume = this.muted ? 0 : this.sfxVolume;
			audio.preload = "auto";
			this.sounds.set(key, audio);
		});

		this.initialized = true;
	}

	private setupUserInteractionListener(): void {
		// Browser requires user interaction before playing audio
		const enableAudio = () => {
			this.userInteracted = true;
			// Play and immediately pause a silent sound to unlock audio
			const silentAudio = new Audio(
				"data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",
			);
			silentAudio.volume = 0;
			silentAudio.play().catch(() => {});

			document.removeEventListener("click", enableAudio);
			document.removeEventListener("keydown", enableAudio);
			document.removeEventListener("touchstart", enableAudio);
		};

		document.addEventListener("click", enableAudio);
		document.addEventListener("keydown", enableAudio);
		document.addEventListener("touchstart", enableAudio);
	}

	/**
	 * Play a sound effect
	 */
	playSFX(key: SoundKey): void {
		if (!this.initialized || this.muted || !this.userInteracted) {
			return;
		}

		const audio = this.sounds.get(key);
		if (audio) {
			// Clone the audio to allow overlapping sounds
			const clone = audio.cloneNode() as HTMLAudioElement;
			clone.volume = this.sfxVolume;
			clone.play().catch((e) => {
				// Ignore autoplay errors
				console.debug("Audio play failed:", e);
			});
		}
	}

	/**
	 * Play background music
	 */
	playMusic(key: MusicKey, loop: boolean = true): void {
		if (!this.initialized) {
			return;
		}

		// Don't restart if already playing same music
		if (this.currentMusicKey === key && this.music && !this.music.paused) {
			return;
		}

		this.stopMusic();

		const musicSrc = MUSIC_FILES[key];
		if (!musicSrc) {
			// No music file available - skip silently
			return;
		}

		this.music = new Audio(musicSrc);
		this.music.volume = this.muted ? 0 : this.musicVolume;
		this.music.loop = loop;
		this.currentMusicKey = key;

		if (this.userInteracted) {
			this.music.play().catch((e) => {
				console.debug("Music play failed:", e);
			});
		}
	}

	/**
	 * Stop background music
	 */
	stopMusic(): void {
		if (this.music) {
			this.music.pause();
			this.music.currentTime = 0;
			this.music = null;
			this.currentMusicKey = null;
		}
	}

	/**
	 * Pause background music
	 */
	pauseMusic(): void {
		if (this.music) {
			this.music.pause();
		}
	}

	/**
	 * Resume background music
	 */
	resumeMusic(): void {
		if (this.music && this.userInteracted) {
			this.music.play().catch(() => {});
		}
	}

	/**
	 * Set muted state
	 */
	setMuted(muted: boolean): void {
		this.muted = muted;

		// Update all sound volumes
		this.sounds.forEach((audio) => {
			audio.volume = muted ? 0 : this.sfxVolume;
		});

		// Update music volume
		if (this.music) {
			this.music.volume = muted ? 0 : this.musicVolume;
		}

		this.savePreferences();
	}

	/**
	 * Toggle mute state
	 */
	toggleMute(): boolean {
		this.setMuted(!this.muted);
		return this.muted;
	}

	/**
	 * Get muted state
	 */
	isMuted(): boolean {
		return this.muted;
	}

	/**
	 * Set SFX volume (0-1)
	 */
	setSFXVolume(volume: number): void {
		this.sfxVolume = Math.max(0, Math.min(1, volume));

		if (!this.muted) {
			this.sounds.forEach((audio) => {
				audio.volume = this.sfxVolume;
			});
		}

		this.savePreferences();
	}

	/**
	 * Set music volume (0-1)
	 */
	setMusicVolume(volume: number): void {
		this.musicVolume = Math.max(0, Math.min(1, volume));

		if (this.music && !this.muted) {
			this.music.volume = this.musicVolume;
		}

		this.savePreferences();
	}

	/**
	 * Get SFX volume
	 */
	getSFXVolume(): number {
		return this.sfxVolume;
	}

	/**
	 * Get music volume
	 */
	getMusicVolume(): number {
		return this.musicVolume;
	}

	/**
	 * Save preferences to localStorage
	 */
	private savePreferences(): void {
		const prefs: AudioPreferences = {
			sfxVolume: this.sfxVolume,
			musicVolume: this.musicVolume,
			isMuted: this.muted,
		};

		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
		} catch (e) {
			console.debug("Failed to save audio preferences:", e);
		}
	}

	/**
	 * Load preferences from localStorage
	 */
	private loadPreferences(): void {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const prefs: AudioPreferences = JSON.parse(stored);
				this.sfxVolume = prefs.sfxVolume ?? 0.7;
				this.musicVolume = prefs.musicVolume ?? 0.5;
				this.muted = prefs.isMuted ?? false;
			}
		} catch (e) {
			console.debug("Failed to load audio preferences:", e);
		}
	}
}

// Export singleton instance getter
export const audioService = AudioService.getInstance();
