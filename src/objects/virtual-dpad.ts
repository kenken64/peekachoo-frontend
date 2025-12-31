import * as Phaser from 'phaser';

export interface VirtualCursorKeys {
    left: { isDown: boolean };
    right: { isDown: boolean };
    up: { isDown: boolean };
    down: { isDown: boolean };
}

export class VirtualDpad {
    private container: HTMLDivElement;
    private activeDirections = {
        left: false,
        right: false,
        up: false,
        down: false
    };

    constructor(scene: Phaser.Scene) {
        this.createDpadDOM();
        this.setupTouchHandlers();
    }

    private createDpadDOM(): void {
        this.container = document.createElement('div');
        this.container.id = 'virtual-dpad';
        this.container.innerHTML = `
            <style>
                #virtual-dpad {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 160px;
                    height: 160px;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    grid-template-rows: repeat(3, 1fr);
                    gap: 4px;
                    z-index: 100;
                }
                .dpad-btn {
                    background: #212529;
                    border: 4px solid #fff;
                    box-shadow: inset -4px -4px #adafbc;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    user-select: none;
                    touch-action: none;
                    color: #fff;
                    cursor: pointer;
                    font-family: 'Press Start 2P', cursive;
                }
                .dpad-btn:active {
                    background: #92cc41;
                    color: #212529;
                }
                .dpad-btn-empty {
                    visibility: hidden;
                }
            </style>
            <div class="dpad-btn dpad-btn-empty"></div>
            <button class="dpad-btn" id="dpad-up">▲</button>
            <div class="dpad-btn dpad-btn-empty"></div>
            <button class="dpad-btn" id="dpad-left">◄</button>
            <div class="dpad-btn dpad-btn-empty"></div>
            <button class="dpad-btn" id="dpad-right">►</button>
            <div class="dpad-btn dpad-btn-empty"></div>
            <button class="dpad-btn" id="dpad-down">▼</button>
            <div class="dpad-btn dpad-btn-empty"></div>
        `;
        document.body.appendChild(this.container);
    }

    private setupTouchHandlers(): void {
        const directions: ('up' | 'down' | 'left' | 'right')[] = ['up', 'down', 'left', 'right'];

        directions.forEach(dir => {
            const btn = document.getElementById(`dpad-${dir}`);
            if (!btn) return;

            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.activeDirections[dir] = true;
            });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.activeDirections[dir] = false;
            });

            btn.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.activeDirections[dir] = false;
            });

            // Also support mouse events for testing
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.activeDirections[dir] = true;
            });

            btn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.activeDirections[dir] = false;
            });

            btn.addEventListener('mouseleave', (e) => {
                this.activeDirections[dir] = false;
            });
        });
    }

    getCursors(): VirtualCursorKeys {
        return {
            left: { isDown: this.activeDirections.left },
            right: { isDown: this.activeDirections.right },
            up: { isDown: this.activeDirections.up },
            down: { isDown: this.activeDirections.down }
        };
    }

    destroy(): void {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
