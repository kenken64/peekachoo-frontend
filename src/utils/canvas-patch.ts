
// Patch getContext to ensure willReadFrequently is set to true for 2D contexts
// This must run before Phaser is loaded to ensure all internal Phaser canvases use this attribute.

(function() {
    if (typeof HTMLCanvasElement !== 'undefined') {
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        // @ts-ignore
        HTMLCanvasElement.prototype.getContext = function(type: string, attributes?: any) {
            if (type === '2d') {
                attributes = attributes || {};
                attributes.willReadFrequently = true;
            }
            // @ts-ignore
            return originalGetContext.call(this, type, attributes);
        };
    }
})();
