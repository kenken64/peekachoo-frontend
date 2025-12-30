import { config, customConfig } from "../main";
import { ExtPolygon } from "./ext-polygon";

/**
 * Manages a separate HTML Canvas overlay to display the revealed image
 * using standard Canvas 2D clipping (more reliable than Phaser masks)
 */
export class ImageOverlay {
    private static instance: ImageOverlay | null = null;
    
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private image: HTMLImageElement;
    private imageLoaded: boolean = false;
    private polygons: ExtPolygon[] = [];

    private constructor() {
        // Create the overlay canvas - only cover the play area, not the info bar or message area
        this.canvas = document.createElement('canvas');
        this.canvas.width = config.width as number;
        this.canvas.height = customConfig.frameHeight + customConfig.margin * 2; // Only cover play area
        this.canvas.style.position = 'absolute';
        this.canvas.style.pointerEvents = 'none'; // Don't intercept mouse events
        this.canvas.id = 'image-overlay-canvas';
        
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;

        // Load the image
        this.image = new Image();
        this.image.onload = () => {
            this.imageLoaded = true;
            this.redraw();
        };
        this.image.src = 'assets/1.jpeg';

        // Position the canvas over the Phaser game after a short delay
        setTimeout(() => this.positionCanvas(), 100);
    }

    /**
     * Get the singleton instance of ImageOverlay
     */
    static getInstance(): ImageOverlay {
        if (!ImageOverlay.instance) {
            ImageOverlay.instance = new ImageOverlay();
        }
        return ImageOverlay.instance;
    }

    private positionCanvas(): void {
        const contentDiv = document.getElementById('content');
        if (contentDiv) {
            // Remove any existing overlay canvas first
            const existingCanvas = document.getElementById('image-overlay-canvas');
            if (existingCanvas && existingCanvas !== this.canvas) {
                existingCanvas.remove();
            }
            
            contentDiv.style.position = 'relative';
            contentDiv.style.display = 'inline-block';
            const phaserCanvas = contentDiv.querySelector('canvas:not(#image-overlay-canvas)');
            if (phaserCanvas) {
                // Match the Phaser canvas position exactly
                this.canvas.style.left = (phaserCanvas as HTMLCanvasElement).offsetLeft + 'px';
                this.canvas.style.top = (phaserCanvas as HTMLCanvasElement).offsetTop + 'px';
                if (!this.canvas.parentElement) {
                    contentDiv.appendChild(this.canvas);
                }
            }
        }
    }

    /**
     * Add a polygon to reveal and redraw the overlay
     */
    addPolygon(polygon: ExtPolygon): void {
        this.polygons.push(polygon);
        this.redraw();
    }

    /**
     * Clear all polygons (e.g., on level reset)
     */
    reset(): void {
        this.polygons = [];
        this.show(); // Make sure overlay is visible again
        this.redraw();
    }

    /**
     * Hide the overlay temporarily (e.g., when showing text)
     */
    hide(): void {
        this.canvas.style.display = 'none';
    }

    /**
     * Show the overlay
     */
    show(): void {
        this.canvas.style.display = 'block';
    }

    /**
     * Redraw the entire overlay with all claimed polygons
     */
    private redraw(): void {
        if (!this.imageLoaded) return;

        const width = config.width as number;
        const height = customConfig.frameHeight + customConfig.margin * 2;
        const margin = customConfig.margin;
        const frameHeight = customConfig.frameHeight;

        // Clear the canvas
        this.ctx.clearRect(0, 0, width, height);

        if (this.polygons.length === 0) return;

        // Save context state
        this.ctx.save();

        // Create a combined clipping path from all polygons
        this.ctx.beginPath();
        
        for (const polygon of this.polygons) {
            const points = polygon.polygon.points;
            if (points.length < 3) continue;

            this.ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                this.ctx.lineTo(points[i].x, points[i].y);
            }
            this.ctx.closePath();
        }

        // Apply the clip
        this.ctx.clip();

        // Calculate image scaling to cover the play area
        const scale = Math.max(width / this.image.width, height / this.image.height);
        const scaledWidth = this.image.width * scale;
        const scaledHeight = this.image.height * scale;
        const offsetX = (width - scaledWidth) / 2;
        const offsetY = (height - scaledHeight) / 2;

        // Draw the image (only visible through clipped areas)
        this.ctx.drawImage(this.image, offsetX, offsetY, scaledWidth, scaledHeight);

        // Restore context state
        this.ctx.restore();

        // Draw outlines for all polygons
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        for (const polygon of this.polygons) {
            const points = polygon.polygon.points;
            if (points.length < 3) continue;

            this.ctx.beginPath();
            this.ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                this.ctx.lineTo(points[i].x, points[i].y);
            }
            this.ctx.closePath();
            this.ctx.stroke();
        }
    }
}
