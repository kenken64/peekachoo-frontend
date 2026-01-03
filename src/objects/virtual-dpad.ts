import * as Phaser from 'phaser';

export interface VirtualCursorKeys {
    left: { isDown: boolean };
    right: { isDown: boolean };
    up: { isDown: boolean };
    down: { isDown: boolean };
}

export class VirtualDpad {
    private container: HTMLDivElement;
    private thumbPad!: HTMLDivElement;
    private thumbStick!: HTMLDivElement;
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
    private readonly PRESS_PERSISTENCE_MS = 80;

    // Thumb pad configuration
    private readonly DEAD_ZONE = 0.15; // 15% of radius before registering input
    private readonly THUMB_PAD_SIZE = 140;
    private readonly THUMB_STICK_SIZE = 56;
    
    private centerX = 0;
    private centerY = 0;
    private maxDistance = 0;
    private isActive = false;

    constructor(scene: Phaser.Scene) {
        this.maxDistance = (this.THUMB_PAD_SIZE - this.THUMB_STICK_SIZE) / 2;
        this.createThumbPadDOM();
        this.setupTouchHandlers();
    }

    private createThumbPadDOM(): void {
        this.container = document.createElement('div');
        this.container.id = 'virtual-dpad';
        this.container.innerHTML = `
            <style>
                #virtual-dpad {
                    position: fixed;
                    bottom: 30px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 100;
                    touch-action: none;
                }
                .thumb-pad {
                    width: ${this.THUMB_PAD_SIZE}px;
                    height: ${this.THUMB_PAD_SIZE}px;
                    background: rgba(33, 37, 41, 0.7);
                    border: 4px solid rgba(255, 255, 255, 0.6);
                    border-radius: 50%;
                    position: relative;
                    box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.3);
                }
                .thumb-pad::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 10%;
                    right: 10%;
                    height: 2px;
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateY(-50%);
                }
                .thumb-pad::after {
                    content: '';
                    position: absolute;
                    left: 50%;
                    top: 10%;
                    bottom: 10%;
                    width: 2px;
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateX(-50%);
                }
                .thumb-stick {
                    width: ${this.THUMB_STICK_SIZE}px;
                    height: ${this.THUMB_STICK_SIZE}px;
                    background: linear-gradient(145deg, #92cc41, #76a833);
                    border: 3px solid #fff;
                    border-radius: 50%;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    box-shadow: 
                        0 4px 8px rgba(0, 0, 0, 0.3),
                        inset 0 2px 4px rgba(255, 255, 255, 0.3);
                    transition: background 0.1s ease;
                    touch-action: none;
                    cursor: pointer;
                }
                .thumb-stick.active {
                    background: linear-gradient(145deg, #a8e04a, #8bc43a);
                    box-shadow: 
                        0 2px 4px rgba(0, 0, 0, 0.2),
                        inset 0 2px 4px rgba(255, 255, 255, 0.4);
                }
                .direction-indicator {
                    position: absolute;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.3);
                    font-family: 'Press Start 2P', cursive;
                    pointer-events: none;
                }
                .direction-indicator.up {
                    top: 6px;
                    left: 50%;
                    transform: translateX(-50%);
                }
                .direction-indicator.down {
                    bottom: 6px;
                    left: 50%;
                    transform: translateX(-50%);
                }
                .direction-indicator.left {
                    left: 6px;
                    top: 50%;
                    transform: translateY(-50%);
                }
                .direction-indicator.right {
                    right: 6px;
                    top: 50%;
                    transform: translateY(-50%);
                }
                .direction-indicator.active {
                    color: rgba(146, 204, 65, 0.9);
                }
            </style>
            <div class="thumb-pad" id="thumb-pad">
                <span class="direction-indicator up" id="indicator-up">▲</span>
                <span class="direction-indicator down" id="indicator-down">▼</span>
                <span class="direction-indicator left" id="indicator-left">◄</span>
                <span class="direction-indicator right" id="indicator-right">►</span>
                <div class="thumb-stick" id="thumb-stick"></div>
            </div>
        `;
        document.body.appendChild(this.container);
        
        this.thumbPad = document.getElementById('thumb-pad') as HTMLDivElement;
        this.thumbStick = document.getElementById('thumb-stick') as HTMLDivElement;
    }

    private setupTouchHandlers(): void {
        const handleStart = (clientX: number, clientY: number) => {
            const rect = this.thumbPad.getBoundingClientRect();
            this.centerX = rect.left + rect.width / 2;
            this.centerY = rect.top + rect.height / 2;
            this.isActive = true;
            this.thumbStick.classList.add('active');
            this.updateThumbPosition(clientX, clientY);
        };

        const handleMove = (clientX: number, clientY: number) => {
            if (!this.isActive) return;
            this.updateThumbPosition(clientX, clientY);
        };

        const handleEnd = () => {
            this.isActive = false;
            this.thumbStick.classList.remove('active');
            this.resetThumbPosition();
            this.clearAllDirections();
        };

        // Touch events on the thumb pad
        this.thumbPad.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const touch = e.touches[0];
            handleStart(touch.clientX, touch.clientY);
        }, { passive: false });

        this.thumbPad.addEventListener('touchmove', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const touch = e.touches[0];
            handleMove(touch.clientX, touch.clientY);
        }, { passive: false });

        this.thumbPad.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleEnd();
        }, { passive: false });

        this.thumbPad.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleEnd();
        }, { passive: false });

        // Mouse events for desktop testing
        this.thumbPad.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handleStart(e.clientX, e.clientY);
            
            const onMouseMove = (moveEvent: MouseEvent) => {
                handleMove(moveEvent.clientX, moveEvent.clientY);
            };
            
            const onMouseUp = () => {
                handleEnd();
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    private updateThumbPosition(clientX: number, clientY: number): void {
        // Calculate offset from center
        let deltaX = clientX - this.centerX;
        let deltaY = clientY - this.centerY;
        
        // Calculate distance from center
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Clamp to max distance
        if (distance > this.maxDistance) {
            const scale = this.maxDistance / distance;
            deltaX *= scale;
            deltaY *= scale;
        }
        
        // Update thumb stick visual position
        const stickX = 50 + (deltaX / this.maxDistance) * 35; // 35% max offset
        const stickY = 50 + (deltaY / this.maxDistance) * 35;
        this.thumbStick.style.left = `${stickX}%`;
        this.thumbStick.style.top = `${stickY}%`;
        
        // Calculate normalized direction (-1 to 1)
        const normalizedX = deltaX / this.maxDistance;
        const normalizedY = deltaY / this.maxDistance;
        
        // Apply dead zone
        const deadZoneX = Math.abs(normalizedX) > this.DEAD_ZONE ? normalizedX : 0;
        const deadZoneY = Math.abs(normalizedY) > this.DEAD_ZONE ? normalizedY : 0;
        
        // Determine active directions based on threshold
        const threshold = 0.25;
        
        const now = Date.now();
        
        // Update directions - allow diagonal movement
        const newLeft = deadZoneX < -threshold;
        const newRight = deadZoneX > threshold;
        const newUp = deadZoneY < -threshold;
        const newDown = deadZoneY > threshold;
        
        // Track press times for newly activated directions
        if (newLeft && !this.activeDirections.left) this.lastPressTime.left = now;
        if (newRight && !this.activeDirections.right) this.lastPressTime.right = now;
        if (newUp && !this.activeDirections.up) this.lastPressTime.up = now;
        if (newDown && !this.activeDirections.down) this.lastPressTime.down = now;
        
        this.activeDirections.left = newLeft;
        this.activeDirections.right = newRight;
        this.activeDirections.up = newUp;
        this.activeDirections.down = newDown;
        
        // Update visual indicators
        this.updateIndicators();
    }

    private resetThumbPosition(): void {
        this.thumbStick.style.left = '50%';
        this.thumbStick.style.top = '50%';
    }

    private clearAllDirections(): void {
        this.activeDirections.left = false;
        this.activeDirections.right = false;
        this.activeDirections.up = false;
        this.activeDirections.down = false;
        this.updateIndicators();
    }

    private updateIndicators(): void {
        const directions: ('up' | 'down' | 'left' | 'right')[] = ['up', 'down', 'left', 'right'];
        directions.forEach(dir => {
            const indicator = document.getElementById(`indicator-${dir}`);
            if (indicator) {
                if (this.activeDirections[dir]) {
                    indicator.classList.add('active');
                } else {
                    indicator.classList.remove('active');
                }
            }
        });
    }

    getCursors(): VirtualCursorKeys {
        const now = Date.now();

        // Check if direction is active OR was recently pressed (within persistence window)
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
