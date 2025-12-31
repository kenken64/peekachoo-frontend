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
        // Cleanup any existing DOM elements from previous session
        this.cleanup();

        const { width, height } = this.cameras.main;

        // Background using Graphics (compatible with Phaser 3.10)
        const bg = this.add.graphics();
        bg.fillStyle(0x212529, 1);
        bg.fillRect(0, 0, width, height);

        // Check WebAuthn support
        if (!AuthService.isWebAuthnSupported()) {
            this.add.text(width / 2, height / 2, 'Your browser does not support passkeys.\nPlease use a modern browser.', {
                fontSize: '18px',
                fontFamily: 'Press Start 2P',
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
        this.statusText = this.add.text(width / 2, 520, '', {
            fontSize: '12px',
            fontFamily: 'Press Start 2P',
            color: '#FFAAAA',
            align: 'center'
        }).setOrigin(0.5);

        // Info text
        this.add.text(width / 2, height - 60, 'Use your device biometrics\nor security key for login', {
            fontSize: '10px',
            fontFamily: 'Press Start 2P',
            color: '#888888',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5);
    }

    private createPikachuBackground(): void {
        const gameContainer = document.getElementById('content');
        if (!gameContainer) return;

        // Add CSS animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float {
                0%, 100% { transform: translateY(0px) translateX(0px); }
                25% { transform: translateY(-20px) translateX(10px); }
                50% { transform: translateY(-10px) translateX(-10px); }
                75% { transform: translateY(-15px) translateX(5px); }
            }
            @keyframes float-reverse {
                0%, 100% { transform: translateY(0px) translateX(0px) scaleX(-1); }
                25% { transform: translateY(-15px) translateX(-10px) scaleX(-1); }
                50% { transform: translateY(-20px) translateX(10px) scaleX(-1); }
                75% { transform: translateY(-10px) translateX(-5px) scaleX(-1); }
            }
            @keyframes pulse {
                0%, 100% { opacity: 0.6; }
                50% { opacity: 0.9; }
            }
            .pikachu-bg {
                position: absolute;
                width: 150px;
                height: 150px;
                background-image: url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                pointer-events: none;
                image-rendering: pixelated;
                filter: drop-shadow(0 0 10px rgba(255, 193, 7, 0.3));
                z-index: 2000;
            }
        `;
        document.head.appendChild(style);

        // Create multiple Pikachus at different positions
        const positions = [
            { left: '10%', top: '15%', animation: 'float 4s ease-in-out infinite', delay: '0s', opacity: '0.6' },
            { left: '80%', top: '20%', animation: 'float-reverse 5s ease-in-out infinite', delay: '1s', opacity: '0.7' },
            { left: '15%', top: '70%', animation: 'float 6s ease-in-out infinite', delay: '2s', opacity: '0.5' },
            { left: '75%', top: '75%', animation: 'float-reverse 4.5s ease-in-out infinite', delay: '0.5s', opacity: '0.6' },
            { left: '50%', top: '10%', animation: 'float 5.5s ease-in-out infinite', delay: '1.5s', opacity: '0.4' }
        ];

        positions.forEach((pos, index) => {
            const pikachu = document.createElement('div');
            pikachu.className = 'pikachu-bg';
            pikachu.style.cssText = `
                left: ${pos.left};
                top: ${pos.top};
                animation: ${pos.animation}, pulse 3s ease-in-out infinite;
                animation-delay: ${pos.delay};
                opacity: ${pos.opacity};
            `;
            gameContainer.appendChild(pikachu);
        });
    }

    private createLoginForm(): void {
        const { width, height } = this.cameras.main;

        // Create animated Pikachu background
        this.createPikachuBackground();

        // Create container div
        this.formContainer = document.createElement('div');
        this.formContainer.className = 'nes-container is-dark with-title';
        this.formContainer.style.cssText = `
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 500px;
            z-index: 1000;
            background-color: rgba(33, 37, 41, 0.95);
            box-shadow: 0 0 30px rgba(146, 204, 65, 0.3);
        `;

        // Logo
        const logoContainer = document.createElement('div');
        logoContainer.className = 'title';
        logoContainer.style.cssText = `
            text-align: center;
            padding: 10px 0;
            background: transparent !important;
        `;

        const logo = document.createElement('img');
        logo.src = 'assets/logo.png';
        logo.alt = 'PEEKACHOO';
        logo.style.cssText = `
            width: 450px;
            height: auto;
            image-rendering: auto;
            filter: drop-shadow(0 0 15px rgba(146, 204, 65, 0.6));
            margin: 0 auto;
            display: block;
        `;

        logoContainer.appendChild(logo);
        this.formContainer.appendChild(logoContainer);

        // Subtitle
        const subtitle = document.createElement('p');
        subtitle.style.cssText = `
            text-align: center;
            margin-bottom: 20px;
            font-size: 10px;
            color: #aaa;
        `;
        subtitle.textContent = 'Sign in to play';
        this.formContainer.appendChild(subtitle);

        // Username field container
        const fieldContainer = document.createElement('div');
        fieldContainer.className = 'nes-field';
        fieldContainer.style.marginBottom = '20px';

        const label = document.createElement('label');
        label.setAttribute('for', 'username-input');
        label.textContent = 'Username';
        label.style.fontSize = '10px';

        this.usernameInput = document.createElement('input');
        this.usernameInput.type = 'text';
        this.usernameInput.id = 'username-input';
        this.usernameInput.className = 'nes-input is-dark';
        this.usernameInput.placeholder = 'Enter username';
        this.usernameInput.style.fontSize = '12px';

        fieldContainer.appendChild(label);
        fieldContainer.appendChild(this.usernameInput);
        this.formContainer.appendChild(fieldContainer);

        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 15px;
            justify-content: center;
        `;

        // Register button
        const registerBtn = document.createElement('button');
        registerBtn.type = 'button';
        registerBtn.className = 'nes-btn is-success';
        registerBtn.textContent = 'Register';
        registerBtn.style.fontSize = '10px';
        registerBtn.addEventListener('click', async () => {
            await this.handleRegister();
        });

        // Login button
        const loginBtn = document.createElement('button');
        loginBtn.type = 'button';
        loginBtn.className = 'nes-btn is-primary';
        loginBtn.textContent = 'Login';
        loginBtn.style.fontSize = '10px';
        loginBtn.addEventListener('click', async () => {
            await this.handleLogin();
        });

        buttonContainer.appendChild(registerBtn);
        buttonContainer.appendChild(loginBtn);
        this.formContainer.appendChild(buttonContainer);

        // Append to game container
        const gameContainer = document.getElementById('content');
        if (gameContainer) {
            gameContainer.style.position = 'relative';
            gameContainer.appendChild(this.formContainer);
        } else {
            // Fallback to body with fixed positioning
            this.formContainer.style.position = 'fixed';
            document.body.appendChild(this.formContainer);
        }
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
            this.scene.start('MenuScene');
        } catch (error: any) {
            console.error('Registration error:', error);
            this.showStatus(error.message || 'Registration failed', true);
        }
    }

    private async handleLogin(): Promise<void> {
        const username = this.usernameInput.value.trim();

        if (!username) {
            this.showStatus('Please enter a username', true);
            return;
        }

        try {
            // First check if user exists
            const exists = await AuthService.checkUsername(username);
            if (!exists) {
                this.showStatus('User not found. Click Register to create an account.', true);
                return;
            }

            this.showStatus('Authenticating...', false);
            await AuthService.login(username);
            this.showStatus('Login successful!', false);
            this.cleanup();
            this.scene.start('MenuScene');
        } catch (error: any) {
            console.error('Login error:', error);
            this.showStatus(error.message || 'Login failed', true);
        }
    }

    private async validateAndProceed(): Promise<void> {
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Validating session...', {
            fontSize: '14px',
            fontFamily: 'Press Start 2P',
            color: '#92cc41'
        }).setOrigin(0.5);

        const user = await AuthService.getCurrentUser();
        if (user) {
            this.scene.start('MenuScene');
        } else {
            // Token invalid, show login form
            this.scene.restart();
        }
    }

    private showStatus(message: string, isError: boolean): void {
        if (this.statusText) {
            this.statusText.setText(message);
            this.statusText.setColor(isError ? '#e76e55' : '#92cc41');
        }
    }

    private cleanup(): void {
        if (this.formContainer && this.formContainer.parentNode) {
            this.formContainer.parentNode.removeChild(this.formContainer);
        }
        // Remove Pikachu background elements
        const pikachus = document.querySelectorAll('.pikachu-bg');
        pikachus.forEach(pikachu => pikachu.remove());
    }

    shutdown(): void {
        this.cleanup();
    }
}
