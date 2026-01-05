import * as Phaser from 'phaser';

export class PowerUp extends Phaser.GameObjects.Container {
    private graphics: Phaser.GameObjects.Graphics;
    public isActive: boolean = true;
    private glowTween: Phaser.Tweens.Tween;
    private floatTween: Phaser.Tweens.Tween;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.graphics = scene.add.graphics();
        this.add(this.graphics);

        // Draw a lightning bolt icon
        this.graphics.fillStyle(0xFFFF00, 1); // Yellow
        this.graphics.lineStyle(1, 0xFFFFFF, 1); // White border

        // Draw lightning bolt shape (centered at 0,0)
        this.graphics.beginPath();
        this.graphics.moveTo(0, -10);
        this.graphics.lineTo(6, -2);
        this.graphics.lineTo(2, -2);
        this.graphics.lineTo(8, 10);
        this.graphics.lineTo(-2, 2);
        this.graphics.lineTo(2, 2);
        this.graphics.closePath();
        this.graphics.fillPath();
        this.graphics.strokePath();

        // Add a glow effect (simple circle)
        this.graphics.lineStyle(2, 0xFFFF00, 0.5);
        this.graphics.strokeCircle(0, 0, 15);

        // Add tween for floating effect
        this.floatTween = scene.tweens.add({
            targets: this,
            y: y - 5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Add tween for glow pulse
        this.glowTween = scene.tweens.add({
            targets: this.graphics,
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        scene.add.existing(this);
        
        // Set depth to be above grid but below player/enemies if needed
        this.setDepth(500);
    }

    collect() {
        this.isActive = false;
        if (this.floatTween) this.floatTween.stop();
        if (this.glowTween) this.glowTween.stop();
        this.destroy();
    }
}
