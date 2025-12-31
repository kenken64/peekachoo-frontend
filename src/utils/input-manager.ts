import { VirtualCursorKeys } from '../objects/virtual-dpad';

export interface CombinedCursorKeys {
    left: { isDown: boolean };
    right: { isDown: boolean };
    up: { isDown: boolean };
    down: { isDown: boolean };
}

export class InputManager {
    /**
     * Detect if the current device is mobile based on screen width or touch capability
     */
    static isMobile(): boolean {
        return window.innerWidth < 768 ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0);
    }

    /**
     * Combine keyboard and virtual cursor inputs
     * Uses OR logic: if either input says a direction is down, it's down
     */
    static combine(
        keyboard: CursorKeys,
        virtual?: VirtualCursorKeys
    ): CombinedCursorKeys {
        if (!virtual) {
            return keyboard;
        }

        return {
            left: { isDown: keyboard.left.isDown || virtual.left.isDown },
            right: { isDown: keyboard.right.isDown || virtual.right.isDown },
            up: { isDown: keyboard.up.isDown || virtual.up.isDown },
            down: { isDown: keyboard.down.isDown || virtual.down.isDown }
        };
    }
}
