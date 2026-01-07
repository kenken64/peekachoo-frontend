import { config, logger } from "../config";
import * as AuthService from "./auth-service";

/**
 * WebSocket event types
 */
export type WebSocketEventType =
	| "connected"
	| "disconnected"
	| "auth_success"
	| "auth_error"
	| "score_submitted"
	| "leaderboard_update"
	| "rank_change"
	| "top_rank_change"
	| "achievement_unlocked"
	| "pokemon_revealed"
	| "streak_milestone"
	| "user_online"
	| "user_offline"
	| "error";

/**
 * WebSocket event data types
 */
export interface ScoreSubmittedEvent {
	userId: string;
	displayName: string;
	score: number;
	level: number;
	rank: number;
	isNewPersonalBest: boolean;
}

export interface RankChangeEvent {
	oldRank: number;
	newRank: number;
	change: number;
}

export interface AchievementUnlockedEvent {
	id: string;
	name: string;
	description: string;
	icon: string;
	points: number;
}

export interface PokemonRevealedEvent {
	pokemon: {
		id: number;
		name: string;
	};
	collectionProgress: {
		count: number;
		total: number;
	};
}

export interface StreakMilestoneEvent {
	streak: number;
	bonus: number;
}

export interface LeaderboardUpdateEvent {
	userId: string;
	displayName: string;
	score: number;
	level: number;
	rank: number;
}

export interface UserStatusEvent {
	userId: string;
}

type EventCallback = (data: any) => void;

/**
 * WebSocket Service for real-time notifications
 */
class WebSocketService {
	private ws: WebSocket | null = null;
	private reconnectAttempts: number = 0;
	private maxReconnectAttempts: number = 5;
	private reconnectDelay: number = 1000;
	private pingInterval: NodeJS.Timeout | null = null;
	private isConnecting: boolean = false;
	private eventListeners: Map<string, Set<EventCallback>> = new Map();
	private connectionStatus:
		| "disconnected"
		| "connecting"
		| "connected"
		| "authenticated" = "disconnected";

	/**
	 * Connect to WebSocket server
	 */
	connect(): void {
		if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
			return;
		}

		const token = AuthService.getToken();
		if (!token) {
			logger.log("[WebSocket] No auth token, skipping connection");
			return;
		}

		this.isConnecting = true;
		this.connectionStatus = "connecting";

		// Build WebSocket URL
		const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		const apiHost = config.apiUrl
			.replace(/^https?:\/\//, "")
			.replace(/\/api$/, "");
		const wsUrl = `${wsProtocol}//${apiHost}/ws`;

		logger.log("[WebSocket] Connecting to", wsUrl);

		try {
			this.ws = new WebSocket(wsUrl);

			this.ws.onopen = () => {
				logger.log("[WebSocket] Connected");
				this.isConnecting = false;
				this.connectionStatus = "connected";
				this.reconnectAttempts = 0;

				// Authenticate
				this.send({ type: "auth", token });

				// Start ping interval
				this.startPing();

				this.emit("connected", {});
			};

			this.ws.onmessage = (event) => {
				this.handleMessage(event.data);
			};

			this.ws.onclose = (event) => {
				logger.log("[WebSocket] Disconnected:", event.code, event.reason);
				this.isConnecting = false;
				this.connectionStatus = "disconnected";
				this.stopPing();

				this.emit("disconnected", { code: event.code, reason: event.reason });

				// Attempt reconnect if not intentional close
				if (event.code !== 1000 && event.code !== 4001) {
					this.attemptReconnect();
				}
			};

			this.ws.onerror = (error) => {
				logger.error("[WebSocket] Error:", error);
				this.isConnecting = false;
				this.emit("error", { error });
			};
		} catch (error) {
			logger.error("[WebSocket] Failed to connect:", error);
			this.isConnecting = false;
			this.attemptReconnect();
		}
	}

	/**
	 * Disconnect from WebSocket server
	 */
	disconnect(): void {
		this.stopPing();
		if (this.ws) {
			this.ws.close(1000, "Client disconnect");
			this.ws = null;
		}
		this.connectionStatus = "disconnected";
		this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnect
	}

	/**
	 * Handle incoming messages
	 */
	private handleMessage(data: string): void {
		try {
			const message = JSON.parse(data);
			logger.log("[WebSocket] Received:", message.type);

			switch (message.type) {
				case "welcome":
					// Already authenticated on connect
					break;

				case "auth_success":
					this.connectionStatus = "authenticated";
					this.emit("auth_success", message);
					// Subscribe to global channel
					this.subscribe("global");
					break;

				case "auth_error":
					logger.error("[WebSocket] Auth failed:", message.message);
					this.emit("auth_error", message);
					break;

				case "pong":
					// Heartbeat response
					break;

				case "score_submitted":
					this.emit("score_submitted", message.data);
					break;

				case "leaderboard_update":
					this.emit("leaderboard_update", message.data);
					break;

				case "rank_change":
					this.emit("rank_change", message.data);
					break;

				case "top_rank_change":
					this.emit("top_rank_change", message.data);
					break;

				case "achievement_unlocked":
					this.emit("achievement_unlocked", message.data);
					break;

				case "pokemon_revealed":
					this.emit("pokemon_revealed", message.data);
					break;

				case "streak_milestone":
					this.emit("streak_milestone", message.data);
					break;

				case "user_online":
					this.emit("user_online", message);
					break;

				case "user_offline":
					this.emit("user_offline", message);
					break;

				case "subscribed":
				case "unsubscribed":
					logger.log(`[WebSocket] ${message.type}:`, message.channel);
					break;

				default:
					logger.log("[WebSocket] Unknown message type:", message.type);
			}
		} catch (error) {
			logger.error("[WebSocket] Failed to parse message:", error);
		}
	}

	/**
	 * Send message to server
	 */
	private send(data: object): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(data));
		}
	}

	/**
	 * Subscribe to a channel
	 */
	subscribe(channel: string): void {
		this.send({ type: "subscribe", channel });
	}

	/**
	 * Unsubscribe from a channel
	 */
	unsubscribe(channel: string): void {
		this.send({ type: "unsubscribe", channel });
	}

	/**
	 * Start ping interval for keepalive
	 */
	private startPing(): void {
		this.stopPing();
		this.pingInterval = setInterval(() => {
			this.send({ type: "ping" });
		}, 25000); // 25 seconds
	}

	/**
	 * Stop ping interval
	 */
	private stopPing(): void {
		if (this.pingInterval) {
			clearInterval(this.pingInterval);
			this.pingInterval = null;
		}
	}

	/**
	 * Attempt to reconnect
	 */
	private attemptReconnect(): void {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			logger.log("[WebSocket] Max reconnect attempts reached");
			return;
		}

		this.reconnectAttempts++;
		const delay = this.reconnectDelay * 2 ** (this.reconnectAttempts - 1);

		logger.log(
			`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`,
		);

		setTimeout(() => {
			this.connect();
		}, delay);
	}

	/**
	 * Add event listener
	 */
	on(event: WebSocketEventType, callback: EventCallback): void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, new Set());
		}
		this.eventListeners.get(event)?.add(callback);
	}

	/**
	 * Remove event listener
	 */
	off(event: WebSocketEventType, callback: EventCallback): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			listeners.delete(callback);
		}
	}

	/**
	 * Emit event to listeners
	 */
	private emit(event: string, data: any): void {
		const listeners = this.eventListeners.get(event as WebSocketEventType);
		if (listeners) {
			listeners.forEach((callback) => {
				try {
					callback(data);
				} catch (error) {
					logger.error(`[WebSocket] Error in ${event} listener:`, error);
				}
			});
		}
	}

	/**
	 * Get connection status
	 */
	getStatus(): "disconnected" | "connecting" | "connected" | "authenticated" {
		return this.connectionStatus;
	}

	/**
	 * Check if connected and authenticated
	 */
	isReady(): boolean {
		return this.connectionStatus === "authenticated";
	}
}

// Export singleton instance
export const websocketService = new WebSocketService();
