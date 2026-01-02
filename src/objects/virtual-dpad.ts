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

    // Track when each direction was last pressed to ensure persistence across frames
    private lastPressTime = {
        left: 0,
        right: 0,
        up: 0,
        down: 0
    };

    // Minimum time (ms) to keep direction active after touch release
    // This ensures the game loop captures at least one frame of movement
    private readonly PRESS_PERSISTENCE_MS = 50;

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
                this.lastPressTime[dir] = Date.now();
            }, { passive: false });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Don't immediately set to false - let getCursors handle persistence
                this.activeDirections[dir] = false;
            }, { passive: false });

            btn.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.activeDirections[dir] = false;
            }, { passive: false });

            // Also support mouse events for testing
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.activeDirections[dir] = true;
                this.lastPressTime[dir] = Date.now();
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
        const now = Date.now();

        // Check if direction is active OR was recently pressed (within persistence window)
        // This ensures touch events persist for at least one game frame
        const isDirectionActive = (dir: 'left' | 'right' | 'up' | 'down'): boolean => {
            if (this.activeDirections[dir]) {
                return true;
            }
            // Check if recently released but still within persistence window
            return (now - this.lastPressTime[dir]) < this.PRESS_PERSISTENCE_MS;
        };

        return {
            left: { isDown: isDirectionActive('left') },
            right: { isDown: isDirectionActive('right') },
            up: { isDown: isDirectionActive('up') },
            down: { isDown: isDirectionActive('down') }
        };
    }

    destroy(): void {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
