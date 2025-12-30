import 'phaser';
import * as AuthService from '../services/auth-service';

export default class LoginScene extends Phaser.Scene {
    private usernameInput!: HTMLInputElement;
    private statusText!: Phaser.GameObjects.Text;
    private formContainer!: HTMLDivElement;

    constructor() {
        super({ key: 'LoginScene' });
    }

    create(): void {
        const { width, height } = this.cameras.main;

        // Background using Graphics (compatible with Phaser 3.10)
        const bg = this.add.graphics();
        bg.fillStyle(0x2a2a4a, 1);
        bg.fillRect(0, 0, width, height);

        // Title
        this.add.text(width / 2, 80, 'PEEKACHOO', {
            fontSize: '48px',
            fontFamily: 'Arial, sans-serif',
            color: '#CCAAFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, 130, 'Sign in to play', {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            color: '#AAAAAA'
        }).setOrigin(0.5);

        // Check WebAuthn support
        if (!AuthService.isWebAuthnSupported()) {
            this.add.text(width / 2, height / 2, 'Your browser does not support passkeys.\nPlease use a modern browser.', {
                fontSize: '18px',
                fontFamily: 'Arial, sans-serif',
                color: '#FF6666',
                align: 'center'
            }).setOrigin(0.5);
            return;
        }

        // Check if already logged in
        if (AuthService.isLoggedIn()) {
            this.validateAndProceed();
            return;
        }

        // Create HTML form
        this.createLoginForm();

        // Status text
        this.statusText = this.add.text(width / 2, 420, '', {
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            color: '#FFAAAA',
            align: 'center'
        }).setOrigin(0.5);

        // Info text
        this.add.text(width / 2, height - 60, 'Passkey authentication uses your device\'s\nbiometrics or security key for secure login.', {
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            color: '#888888',
            align: 'center'
        }).setOrigin(0.5);
    }

    private createLoginForm(): void {
        const { width, height } = this.cameras.main;
        
        // Create container div
        this.formContainer = document.createElement('div');
        this.formContainer.style.cssText = `
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            z-index: 1000;
        `;

        // Username input
        this.usernameInput = document.createElement('input');
        this.usernameInput.type = 'text';
        this.usernameInput.placeholder = 'Enter username';
        this.usernameInput.style.cssText = `
            width: 250px;
            padding: 12px 16px;
            font-size: 16px;
            border: 2px solid #CCAAFF;
            border-radius: 8px;
            background: #1a1a2e;
            color: #FFFFFF;
            outline: none;
            text-align: center;
        `;
        this.usernameInput.addEventListener('focus', () => {
            this.usernameInput.style.borderColor = '#AA88EE';
        });
        this.usernameInput.addEventListener('blur', () => {
            this.usernameInput.style.borderColor = '#CCAAFF';
        });

        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 10px;
        `;

        // Register button
        const registerBtn = this.createButton('Register', '#4CAF50', async () => {
            await this.handleRegister();
        });

        // Login button
        const loginBtn = this.createButton('Login', '#2196F3', async () => {
            await this.handleLogin();
        });

        buttonContainer.appendChild(registerBtn);
        buttonContainer.appendChild(loginBtn);

        this.formContainer.appendChild(this.usernameInput);
        this.formContainer.appendChild(buttonContainer);

        // Append to game container
        const gameContainer = document.getElementById('content');
        if (gameContainer) {
            gameContainer.style.position = 'relative';
            this.formContainer.style.position = 'absolute';
            this.formContainer.style.left = '50%';
            this.formContainer.style.top = '50%';
            gameContainer.appendChild(this.formContainer);
        } else {
            // Fallback to body with fixed positioning
            this.formContainer.style.position = 'fixed';
            document.body.appendChild(this.formContainer);
        }
    }

    private createButton(text: string, bgColor: string, onClick: () => void): HTMLButtonElement {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            padding: 12px 24px;
            font-size: 16px;
            font-weight: bold;
            border: none;
            border-radius: 8px;
            background: ${bgColor};
            color: #FFFFFF;
            cursor: pointer;
            transition: opacity 0.2s, transform 0.1s;
        `;
        button.addEventListener('mouseenter', () => {
            button.style.opacity = '0.9';
        });
        button.addEventListener('mouseleave', () => {
            button.style.opacity = '1';
        });
        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(0.98)';
        });
        button.addEventListener('mouseup', () => {
            button.style.transform = 'scale(1)';
        });
        button.addEventListener('click', onClick);
        return button;
    }

    private async handleRegister(): Promise<void> {
        const username = this.usernameInput.value.trim();
        
        if (!username) {
            this.showStatus('Please enter a username', true);
            return;
        }

        if (username.length < 3) {
            this.showStatus('Username must be at least 3 characters', true);
            return;
        }

        try {
            this.showStatus('Creating passkey...', false);
            await AuthService.register(username);
            this.showStatus('Registration successful!', false);
            this.cleanup();
            this.scene.start('QixScene');
        } catch (error: any) {
            console.error('Registration error:', error);
            this.showStatus(error.message || 'Registration failed', true);
        }
    }

    private async handleLogin(): Promise<void> {
        const username = this.usernameInput.value.trim();

        try {
            this.showStatus('Authenticating...', false);
            await AuthService.login(username || undefined);
            this.showStatus('Login successful!', false);
            this.cleanup();
            this.scene.start('QixScene');
        } catch (error: any) {
            console.error('Login error:', error);
            this.showStatus(error.message || 'Login failed', true);
        }
    }

    private async validateAndProceed(): Promise<void> {
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Validating session...', {
            fontSize: '18px',
            fontFamily: 'Arial, sans-serif',
            color: '#CCAAFF'
        }).setOrigin(0.5);

        const user = await AuthService.getCurrentUser();
        if (user) {
            this.scene.start('QixScene');
        } else {
            // Token invalid, show login form
            this.scene.restart();
        }
    }

    private showStatus(message: string, isError: boolean): void {
        if (this.statusText) {
            this.statusText.setText(message);
            this.statusText.setColor(isError ? '#FF6666' : '#66FF66');
        }
    }

    private cleanup(): void {
        if (this.formContainer && this.formContainer.parentNode) {
            this.formContainer.parentNode.removeChild(this.formContainer);
        }
    }

    shutdown(): void {
        this.cleanup();
    }
}
