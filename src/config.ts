// Runtime configuration
// This allows environment variables to be injected at container runtime

declare global {
    interface Window {
        _env_?: {
            API_URL?: string;
        };
    }
}

// Get API URL from runtime config or fallback to build-time env var
export const getApiUrl = (): string => {
    // Runtime injection (for Docker/Railway)
    if (window._env_ && window._env_.API_URL) {
        return window._env_.API_URL;
    }

    // Build-time environment variable (for local development)
    if (process.env.API_URL) {
        return process.env.API_URL;
    }

    // Fallback
    return 'http://localhost:3000/api';
};

export const config = {
    apiUrl: getApiUrl()
};
