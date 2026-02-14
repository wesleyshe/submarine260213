// Utility functions for common operations

const Utils = {
    /**
     * Rotate a 2D vector by an angle
     * @param {number} x - X component
     * @param {number} y - Y component  
     * @param {number} angle - Rotation angle in radians
     * @returns {{x: number, y: number}} Rotated vector
     */
    rotateVector(x, y, angle) {
        const cos_a = Math.cos(angle);
        const sin_a = Math.sin(angle);
        return {
            x: x * cos_a - y * sin_a,
            y: x * sin_a + y * cos_a
        };
    },
    
    /**
     * Clamp a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    /**
     * Check if a value is a valid number (not NaN or Infinity)
     * @param {number} value - Value to check
     * @returns {boolean} True if valid
     */
    isValidNumber(value) {
        return isFinite(value) && !isNaN(value);
    },
    
    /**
     * Sanitize a numeric value, returning fallback if invalid
     * @param {number} value - Value to sanitize
     * @param {number} fallback - Fallback value if invalid
     * @returns {number} Sanitized value
     */
    sanitizeNumber(value, fallback = 0) {
        return this.isValidNumber(value) ? value : fallback;
    },
    
    /**
     * Calculate distance squared between two points (faster than dist)
     * @param {number} x1 - First point x
     * @param {number} y1 - First point y
     * @param {number} x2 - Second point x
     * @param {number} y2 - Second point y
     * @returns {number} Distance squared
     */
    distSq(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy;
    },
    
    /**
     * Check if a point is within bounds
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} minX - Min X bound
     * @param {number} minY - Min Y bound
     * @param {number} maxX - Max X bound
     * @param {number} maxY - Max Y bound
     * @returns {boolean} True if within bounds
     */
    inBounds(x, y, minX, minY, maxX, maxY) {
        return x >= minX && x <= maxX && y >= minY && y <= maxY;
    },
    
    /**
     * Safely access array element with bounds checking
     * @param {Array} array - 2D array
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {*} defaultValue - Default value if out of bounds
     * @returns {*} Array element or default
     */
    safeArrayAccess(array, row, col, defaultValue = null) {
        if (!array || row < 0 || row >= array.length) return defaultValue;
        if (!array[row] || col < 0 || col >= array[row].length) return defaultValue;
        return array[row][col];
    },
    
    /**
     * Clamp delta time to prevent huge spikes
     * @param {number} dt - Delta time in milliseconds
     * @returns {number} Clamped delta time
     */
    clampDeltaTime(dt) {
        return this.clamp(dt, 0, CONFIG.MAX_DELTA_TIME);
    }
};
