// Runtime configuration
// This allows environment variables to be injected at container runtime

declare global {
	interface Window {
		_env_?: {
			API_URL?: string;
			DEBUG?: string;
			RAZORPAY_KEY_ID?: string;
		};
		ENV_CONFIG?: {
			API_URL?: string;
			DEBUG?: string;
			RAZORPAY_KEY_ID?: string;
		};
	}
}

// Get API URL from runtime config or fallback to build-time env var
export const getApiUrl = (): string => {
	// Runtime injection (for Docker/Railway)
	if (window._env_?.API_URL) {
		return window._env_.API_URL;
	}

	// Build-time environment variable (for local development)
	if (process.env.API_URL) {
		return process.env.API_URL;
	}

	// Fallback
	return "http://localhost:3000/api";
};

// Get Razorpay Key ID
export const getRazorpayKeyId = (): string => {
	// Runtime injection
	if (window._env_?.RAZORPAY_KEY_ID) {
		return window._env_.RAZORPAY_KEY_ID;
	}

	// Build-time environment variable
	if (process.env.RAZORPAY_KEY_ID) {
		return process.env.RAZORPAY_KEY_ID;
	}

	return "";
};

// Check if debug mode is enabled
export const isDebugEnabled = (): boolean => {
	// Runtime injection
	if (window._env_?.DEBUG === "true" || window.ENV_CONFIG?.DEBUG === "true") {
		return true;
	}
	// Build-time environment variable
	if (process.env.DEBUG === "true") {
		return true;
	}
	// Default: disabled in production
	return false;
};

export const config = {
	apiUrl: getApiUrl(),
	debug: isDebugEnabled(),
	razorpayKeyId: getRazorpayKeyId(),
};

// Logger utility - only logs when debug is enabled (errors always log)
export const logger = {
	log: (...args: unknown[]): void => {
		if (config.debug) console.log(...args);
	},
	info: (...args: unknown[]): void => {
		if (config.debug) console.info(...args);
	},
	warn: (...args: unknown[]): void => {
		if (config.debug) console.warn(...args);
	},
	error: (...args: unknown[]): void => {
		// Always log errors
		console.error(...args);
	},
	debug: (...args: unknown[]): void => {
		if (config.debug) console.debug(...args);
	},
};
