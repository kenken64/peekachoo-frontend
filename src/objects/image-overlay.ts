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
    private currentImageSrc: string = 'assets/1.jpeg';

    private constructor() {
        // Create the overlay canvas - only cover the play area, not the info bar or message area
        this.canvas = document.createElement('canvas');
        this.canvas.width = config.width as number;
        this.canvas.height = customConfig.frameHeight + customConfig.margin * 2; // Only cover play area
        this.canvas.style.position = 'absolute';
        this.canvas.style.pointerEvents = 'none'; // Don't intercept mouse events
        this.canvas.style.left = '0';
        this.canvas.style.top = '0';
        this.canvas.id = 'image-overlay-canvas';
        
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;

        // Load the image
        this.image = new Image();
        this.image.crossOrigin = 'anonymous'; // Allow loading from external URLs
        this.image.onload = () => {
            this.imageLoaded = true;
            this.redraw();
        };
        this.image.src = this.currentImageSrc;

        // Position the canvas over the Phaser game after a short delay
        setTimeout(() => this.positionCanvas(), 100);

        // Listen for resize events to reposition canvas
        window.addEventListener('resize', () => this.positionCanvas());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.positionCanvas(), 200);
        });
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

    /**
     * Set a new image to be revealed
     */
    setImage(imageSrc: string): void {
        if (imageSrc === this.currentImageSrc && this.imageLoaded) {
            return; // Already loaded
        }
        
        this.currentImageSrc = imageSrc;
        this.imageLoaded = false;
        this.image = new Image();
        this.image.crossOrigin = 'anonymous';
        this.image.onload = () => {
            this.imageLoaded = true;
            this.redraw();
        };
        this.image.onerror = () => {
            console.error('Failed to load image:', imageSrc);
            // Fallback to default image
            this.image.src = 'assets/1.jpeg';
        };
        this.image.src = imageSrc;
    }

    /**
     * Get the current image source
     */
    getImageSrc(): string {
        return this.currentImageSrc;
    }

    /**
     * Get the current image URL (alias for getImageSrc)
     */
    getCurrentImageUrl(): string {
        return this.currentImageSrc;
    }

    private positionCanvas(): void {
        const contentDiv = document.getElementById('content');
        if (!contentDiv) return;
        
        // Remove any existing overlay canvas first
        const existingCanvas = document.getElementById('image-overlay-canvas');
        if (existingCanvas && existingCanvas !== this.canvas) {
            existingCanvas.remove();
        }
        
        const phaserCanvas = contentDiv.querySelector('canvas:not(#image-overlay-canvas)') as HTMLCanvasElement;
        if (!phaserCanvas) return;
        
        // Always use absolute positioning within the content container
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = '0';
        this.canvas.style.top = '0';
        
        // On mobile, apply scaling transform
        const windowWidth = window.innerWidth;
        if (windowWidth < 768) {
            contentDiv.style.position = 'relative';
            
            // Calculate the same scale as main.ts resizeCanvas
            const gameWidth = 800;
            const gameHeight = 650;
            const scaleX = windowWidth / gameWidth;
            const scaleY = window.innerHeight / gameHeight;
            const scale = Math.min(scaleX, scaleY * 0.95);
            
            this.canvas.style.width = `${gameWidth}px`;
            this.canvas.style.transformOrigin = 'top left';
            this.canvas.style.transform = `scale(${scale})`;
            this.canvas.style.zIndex = '2';
        } else {
            // Desktop - no transform, just absolute positioning
            this.canvas.style.width = '';
            this.canvas.style.transform = '';
            this.canvas.style.transformOrigin = '';
            this.canvas.style.zIndex = '';
        }
        
        if (!this.canvas.parentElement) {
            contentDiv.appendChild(this.canvas);
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
        // Reposition to match Phaser canvas (important for mobile scaling)
        this.positionCanvas();
    }

    /**
     * Reveal the entire image (no clipping) - used when level is complete
     */
    revealFullImage(): void {
        if (!this.imageLoaded) return;

        const width = config.width as number;
        const height = customConfig.frameHeight + customConfig.margin * 2;

        // Clear the canvas
        this.ctx.clearRect(0, 0, width, height);

        // Calculate image scaling to cover the play area
        const scale = Math.max(width / this.image.width, height / this.image.height);
        const scaledWidth = this.image.width * scale;
        const scaledHeight = this.image.height * scale;
        const offsetX = (width - scaledWidth) / 2;
        const offsetY = (height - scaledHeight) / 2;

        // Draw the full image without any clipping
        this.ctx.drawImage(this.image, offsetX, offsetY, scaledWidth, scaledHeight);

        // Draw a border around the play area
        this.ctx.strokeStyle = '#FFFF00';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(customConfig.margin, customConfig.margin, 
            width - customConfig.margin * 2, customConfig.frameHeight);
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
