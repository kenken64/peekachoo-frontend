// Auth Service for Passkey (WebAuthn) Authentication

const API_BASE = 'http://localhost:3000/api/auth';

interface User {
    id: string;
    username: string;
    displayName: string;
}

interface AuthResponse {
    verified: boolean;
    token: string;
    user: User;
}

// Store token in sessionStorage (unique per tab/window, so multiple users can play simultaneously)
export function setToken(token: string): void {
    console.log('[Auth] Setting token:', token.substring(0, 20) + '...');
    sessionStorage.setItem('peekachoo_token', token);
}

export function getToken(): string | null {
    const token = sessionStorage.getItem('peekachoo_token');
    console.log('[Auth] Getting token:', token ? token.substring(0, 20) + '...' : 'null');
    return token;
}

export function removeToken(): void {
    console.log('[Auth] Removing token');
    sessionStorage.removeItem('peekachoo_token');
}

export function setUser(user: User): void {
    console.log('[Auth] Setting user:', user.username);
    sessionStorage.setItem('peekachoo_user', JSON.stringify(user));
}

export function getUser(): User | null {
    const userStr = sessionStorage.getItem('peekachoo_user');
    const user = userStr ? JSON.parse(userStr) : null;
    console.log('[Auth] Getting user:', user?.username || 'null');
    return user;
}

export function removeUser(): void {
    console.log('[Auth] Removing user');
    sessionStorage.removeItem('peekachoo_user');
}

export function isLoggedIn(): boolean {
    return !!getToken();
}

export function logout(): void {
    console.log('[Auth] LOGOUT called! Stack trace:');
    console.trace();
    removeToken();
    removeUser();
}

// Check if username exists
export async function checkUsername(username: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/check-username/${encodeURIComponent(username)}`);
    const data = await response.json();
    return data.exists;
}

// Convert base64url to ArrayBuffer
function base64urlToBuffer(base64url: string): ArrayBuffer {
    const padding = '='.repeat((4 - base64url.length % 4) % 4);
    const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// Convert ArrayBuffer to base64url
function bufferToBase64url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Register new user with passkey
export async function register(username: string, displayName?: string): Promise<AuthResponse> {
    // Step 1: Get registration options
    const startResponse = await fetch(`${API_BASE}/register/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, displayName: displayName || username })
    });

    if (!startResponse.ok) {
        const error = await startResponse.json();
        throw new Error(error.error || 'Failed to start registration');
    }

    const { options, challengeId, userId } = await startResponse.json();

    // Step 2: Create credential with browser WebAuthn API
    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
        challenge: base64urlToBuffer(options.challenge),
        rp: {
            name: options.rp.name,
            id: options.rp.id
        },
        user: {
            id: base64urlToBuffer(options.user.id),
            name: options.user.name,
            displayName: options.user.displayName
        },
        pubKeyCredParams: options.pubKeyCredParams,
        timeout: options.timeout,
        attestation: options.attestation,
        authenticatorSelection: options.authenticatorSelection,
        excludeCredentials: (options.excludeCredentials || []).map((cred: any) => ({
            ...cred,
            id: base64urlToBuffer(cred.id)
        }))
    };

    const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions
    }) as PublicKeyCredential;

    if (!credential) {
        throw new Error('Failed to create credential');
    }

    const attestationResponse = credential.response as AuthenticatorAttestationResponse;

    // Step 3: Send credential to server
    const completeResponse = await fetch(`${API_BASE}/register/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            challengeId,
            response: {
                id: credential.id,
                rawId: bufferToBase64url(credential.rawId),
                type: credential.type,
                response: {
                    clientDataJSON: bufferToBase64url(attestationResponse.clientDataJSON),
                    attestationObject: bufferToBase64url(attestationResponse.attestationObject),
                    transports: attestationResponse.getTransports ? attestationResponse.getTransports() : []
                },
                clientExtensionResults: credential.getClientExtensionResults()
            }
        })
    });

    if (!completeResponse.ok) {
        const error = await completeResponse.json();
        throw new Error(error.error || 'Failed to complete registration');
    }

    const result: AuthResponse = await completeResponse.json();
    
    // Store token and user
    setToken(result.token);
    setUser(result.user);

    return result;
}

// Login with passkey
export async function login(username?: string): Promise<AuthResponse> {
    // Step 1: Get authentication options
    const startResponse = await fetch(`${API_BASE}/login/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    });

    if (!startResponse.ok) {
        const error = await startResponse.json();
        throw new Error(error.error || 'Failed to start login');
    }

    const { options, challengeId } = await startResponse.json();

    // Step 2: Get credential with browser WebAuthn API
    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
        challenge: base64urlToBuffer(options.challenge),
        timeout: options.timeout,
        rpId: options.rpId,
        allowCredentials: (options.allowCredentials || []).map((cred: any) => ({
            ...cred,
            id: base64urlToBuffer(cred.id)
        })),
        userVerification: options.userVerification
    };

    const credential = await navigator.credentials.get({
        publicKey: publicKeyOptions
    }) as PublicKeyCredential;

    if (!credential) {
        throw new Error('Failed to get credential');
    }

    const assertionResponse = credential.response as AuthenticatorAssertionResponse;

    // Step 3: Send assertion to server
    const completeResponse = await fetch(`${API_BASE}/login/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            challengeId,
            response: {
                id: credential.id,
                rawId: bufferToBase64url(credential.rawId),
                type: credential.type,
                response: {
                    clientDataJSON: bufferToBase64url(assertionResponse.clientDataJSON),
                    authenticatorData: bufferToBase64url(assertionResponse.authenticatorData),
                    signature: bufferToBase64url(assertionResponse.signature),
                    userHandle: assertionResponse.userHandle ? bufferToBase64url(assertionResponse.userHandle) : null
                },
                clientExtensionResults: credential.getClientExtensionResults()
            }
        })
    });

    if (!completeResponse.ok) {
        const error = await completeResponse.json();
        throw new Error(error.error || 'Failed to complete login');
    }

    const result: AuthResponse = await completeResponse.json();
    
    // Store token and user
    setToken(result.token);
    setUser(result.user);

    return result;
}

// Check if WebAuthn is supported
export function isWebAuthnSupported(): boolean {
    return !!(
        window.PublicKeyCredential &&
        typeof window.PublicKeyCredential === 'function'
    );
}

// Get current user from server (validates token)
export async function getCurrentUser(): Promise<User | null> {
    const token = getToken();
    if (!token) return null;

    try {
        const response = await fetch(`${API_BASE}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            logout();
            return null;
        }

        const user = await response.json();
        setUser(user);
        return user;
    } catch {
        return null;
    }
}
