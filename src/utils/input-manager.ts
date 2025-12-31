import { VirtualCursorKeys } from '../objects/virtual-dpad';

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
     * Returns the keyboard cursors object with updated isDown values
     */
    static combine(
        keyboard: CursorKeys,
        virtual?: VirtualCursorKeys
    ): CursorKeys {
        if (!virtual) {
            return keyboard;
        }

        // Create a proxy-like object that wraps the keyboard cursors
        // but overrides isDown with combined values
        const combined = {
            ...keyboard,
            left: {
                ...keyboard.left,
                isDown: keyboard.left.isDown || virtual.left.isDown
            },
            right: {
                ...keyboard.right,
                isDown: keyboard.right.isDown || virtual.right.isDown
            },
            up: {
                ...keyboard.up,
                isDown: keyboard.up.isDown || virtual.up.isDown
            },
            down: {
                ...keyboard.down,
                isDown: keyboard.down.isDown || virtual.down.isDown
            }
        };

        return combined as CursorKeys;
    }
}
