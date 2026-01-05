import 'phaser';
import * as AuthService from '../services/auth-service';
import { websocketService } from '../services/websocket-service';
import { notificationManager } from '../services/notification-manager';
import { I18nService } from '../services/i18n-service';

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
        this.add.text(width / 2, height - 60, I18nService.t('login.securityKey'), {
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

            /* Mobile Responsive Styles */
            @media (max-width: 767px) {
                .nes-container.is-dark.with-title {
                    width: 85% !important;
                    max-width: 400px !important;
                    padding: 15px !important;
                    top: 50% !important;
                    left: 50% !important;
                    transform: translate(-50%, -50%) !important;
                    max-height: none !important;
                    overflow-y: visible !important;
                }

                .nes-container.is-dark.with-title .title {
                    padding: 8px 0 !important;
                    margin-bottom: 8px !important;
                }

                .nes-container.is-dark.with-title img[alt="PEEKACHOO"] {
                    width: 100% !important;
                    max-width: 320px !important;
                    margin: 0 auto !important;
                }

                .nes-container.is-dark.with-title p {
                    margin-bottom: 12px !important;
                    font-size: 10px !important;
                }

                .nes-container.is-dark.with-title .nes-field {
                    margin-bottom: 15px !important;
                }

                .nes-container.is-dark.with-title .nes-input {
                    font-size: 14px !important;
                    padding: 10px !important;
                }

                .nes-container.is-dark.with-title .nes-btn {
                    font-size: 11px !important;
                    padding: 10px 16px !important;
                }

                .nes-container.is-dark.with-title label {
                    font-size: 11px !important;
                }

                .nes-container.is-dark.with-title #login-error-message {
                    min-height: 18px !important;
                    margin-bottom: 12px !important;
                    font-size: 8px !important;
                }

                .pikachu-bg {
                    width: 80px !important;
                    height: 80px !important;
                    opacity: 0.3 !important;
                }
            }

            @media (max-width: 480px) {
                .nes-container.is-dark.with-title {
                    width: 90% !important;
                    max-width: 350px !important;
                    padding: 12px !important;
                }

                .nes-container.is-dark.with-title img[alt="PEEKACHOO"] {
                    width: 100% !important;
                    max-width: 280px !important;
                }

                .nes-container.is-dark.with-title p {
                    font-size: 9px !important;
                    margin-bottom: 10px !important;
                }

                .nes-container.is-dark.with-title .nes-input {
                    font-size: 12px !important;
                    padding: 8px !important;
                }

                .nes-container.is-dark.with-title .nes-btn {
                    font-size: 10px !important;
                    padding: 8px 14px !important;
                }

                .pikachu-bg {
                    width: 60px !important;
                    height: 60px !important;
                    opacity: 0.2 !important;
                }
            }

            @media (max-width: 360px) {
                .nes-container.is-dark.with-title {
                    width: 92% !important;
                    max-width: 300px !important;
                    padding: 10px !important;
                }

                .nes-container.is-dark.with-title img[alt="PEEKACHOO"] {
                    max-width: 240px !important;
                }

                .nes-container.is-dark.with-title .title {
                    padding: 5px 0 !important;
                }

                .nes-container.is-dark.with-title p {
                    font-size: 8px !important;
                }

                .nes-container.is-dark.with-title .nes-btn {
                    font-size: 9px !important;
                    padding: 6px 12px !important;
                }

                .nes-container.is-dark.with-title label {
                    font-size: 10px !important;
                }

                .pikachu-bg {
                    display: none !important;
                }
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
        this.formContainer.className = 'nes-container is-dark';
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
        logoContainer.style.cssText = `
            text-align: center;
            margin-bottom: 10px;
        `;

        const logo = document.createElement('img');
        logo.src = I18nService.getLang() === 'jp' ? 'assets/logo_jp.png' : 'assets/logo.png';
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
        subtitle.textContent = I18nService.t('login.signIn');
        this.formContainer.appendChild(subtitle);

        // Username field container
        const fieldContainer = document.createElement('div');
        fieldContainer.className = 'nes-field';
        fieldContainer.style.marginBottom = '20px';

        const label = document.createElement('label');
        label.setAttribute('for', 'username-input');
        label.textContent = I18nService.t('login.username');
        label.style.fontSize = '10px';

        this.usernameInput = document.createElement('input');
        this.usernameInput.type = 'text';
        this.usernameInput.id = 'username-input';
        this.usernameInput.className = 'nes-input is-dark';
        this.usernameInput.placeholder = I18nService.t('login.enterUsername');
        this.usernameInput.style.fontSize = '12px';

        fieldContainer.appendChild(label);
        fieldContainer.appendChild(this.usernameInput);
        this.formContainer.appendChild(fieldContainer);

        // Error message container
        const errorContainer = document.createElement('div');
        errorContainer.id = 'login-error-message';
        errorContainer.style.cssText = `
            min-height: 20px;
            margin-bottom: 15px;
            text-align: center;
            font-size: 8px;
            color: #e76e55;
            word-wrap: break-word;
        `;
        this.formContainer.appendChild(errorContainer);

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
        registerBtn.textContent = I18nService.t('login.register');
        registerBtn.style.fontSize = '10px';
        registerBtn.addEventListener('click', async () => {
            await this.handleRegister();
        });

        // Login button
        const loginBtn = document.createElement('button');
        loginBtn.type = 'button';
        loginBtn.className = 'nes-btn is-primary';
        loginBtn.textContent = I18nService.t('login.login');
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
            this.showStatus(I18nService.t('login.enterUsernameError'), true);
            return;
        }

        if (username.length < 3) {
            this.showStatus(I18nService.t('login.usernameLengthError'), true);
            return;
        }

        try {
            this.showStatus(I18nService.t('login.registering'), false);
            await AuthService.register(username);
            this.showStatus(I18nService.t('login.registerSuccess'), false);

            // Initialize WebSocket and notifications
            notificationManager.initialize();
            websocketService.connect();

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
            this.showStatus(I18nService.t('login.enterUsernameError'), true);
            return;
        }

        try {
            // First check if user exists
            const exists = await AuthService.checkUsername(username);
            if (!exists) {
                this.showStatus(I18nService.t('login.userNotFound'), true);
                return;
            }

            this.showStatus(I18nService.t('login.authenticating'), false);
            await AuthService.login(username);
            this.showStatus(I18nService.t('login.loginSuccess'), false);

            // Initialize WebSocket and notifications
            notificationManager.initialize();
            websocketService.connect();

            this.cleanup();
            this.scene.start('MenuScene');
        } catch (error: any) {
            console.error('Login error:', error);
            this.showStatus(error.message || 'Login failed', true);
        }
    }

    private async validateAndProceed(): Promise<void> {
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, I18nService.t('login.validating'), {
            fontSize: '14px',
            fontFamily: 'Press Start 2P',
            color: '#92cc41'
        }).setOrigin(0.5);

        const user = await AuthService.getCurrentUser();
        if (user) {
            // Initialize WebSocket and notifications for returning session
            notificationManager.initialize();
            websocketService.connect();

            this.scene.start('MenuScene');
        } else {
            // Token invalid, show login form
            this.scene.restart();
        }
    }

    private showStatus(message: string, isError: boolean): void {
        // Update DOM error message container
        const errorContainer = document.getElementById('login-error-message');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.color = isError ? '#e76e55' : '#92cc41';
        }

        // Also update Phaser text for consistency
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

        // Remove virtual D-pad if it exists (safety net for logout from game)
        const virtualDpad = document.getElementById('virtual-dpad');
        if (virtualDpad) {
            virtualDpad.remove();
        }
    }

    shutdown(): void {
        this.cleanup();
    }
}
