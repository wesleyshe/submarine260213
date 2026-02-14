// Submarine class with momentum-based movement

class Submarine {
    constructor(x, y, playerNumber) {
        this.x = x;
        this.y = y;
        this.playerNumber = playerNumber;
        
        // Movement
        this.angle = playerNumber === 1 ? 0 : PI; // Face opposite directions
        this.velocity = createVector(0, 0);
        this.speed = 0;
        this.maxSpeed = 0.375; // Reduced to 25%
        this.acceleration = 0.0125; // Reduced to 25%
        this.turnSpeed = 0.0125; // Reduced to 25%
        this.friction = 0.98;
        
        // Submarine size and shape
        this.width = 8;
        this.height = 4;
        
        // Combat
        this.alive = true;
        this.torpedoCooldown = 0;
        this.torpedoCooldownMax = 30; // frames
        
        // Visual and idle detection
        this.idleTime = 0; // Time spent stopped (in seconds)
        this.STOP_EPS = 0.05; // Speed threshold for considering stopped
        this.HOLD_RED_SECONDS = 0.5; // Stay red for 0.5 seconds after stopping
        this.FADE_SECONDS = 1.5; // Fade from red to green over 1.5 seconds
        this.isSteering = false; // Set to true when turn input is applied
        
        // Start submarines as green (fully idle)
        this.idleTime = this.HOLD_RED_SECONDS + this.FADE_SECONDS;
    }
    
    update(terrain) {
        if (!this.alive) return;
        
        // Update cooldowns
        if (this.torpedoCooldown > 0) {
            this.torpedoCooldown--;
        }
        
        // Determine if submarine is "moving" (translating or steering)
        const speed = sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        const isMoving = (speed > this.STOP_EPS) || this.isSteering;
        
        // Update idle time based on movement state
        if (isMoving) {
            // Moving or steering: reset idle time (instant red)
            this.idleTime = 0;
        } else {
            // Stopped and not steering: accumulate idle time
            this.idleTime += deltaTime / 1000; // deltaTime is in milliseconds
        }
        
        // Clear steering flag for next frame
        this.isSteering = false;
        
        // Apply friction
        this.velocity.mult(this.friction);
        
        // Compute proposed new position
        const nx = this.x + this.velocity.x;
        const ny = this.y + this.velocity.y;
        
        // Axis-separated collision: try X first
        if (this.checkCollisionAt(nx, this.y, terrain)) {
            // Cancel X movement
            this.velocity.x = 0;
        } else {
            // Accept X movement
            this.x = nx;
        }
        
        // Then try Y
        if (this.checkCollisionAt(this.x, ny, terrain)) {
            // Cancel Y movement
            this.velocity.y = 0;
        } else {
            // Accept Y movement
            this.y = ny;
        }
        
        // Clamp position to map bounds (treat out-of-bounds as solid)
        const oldX = this.x;
        const oldY = this.y;
        this.x = constrain(this.x, 5, terrain.mapSize - 5);
        this.y = constrain(this.y, 5, terrain.mapSize - 5);
        
        // If we hit bounds, zero velocity
        if (this.x !== oldX) this.velocity.x = 0;
        if (this.y !== oldY) this.velocity.y = 0;
    }
    
    getColor() {
        // Compute color transition parameter t
        // t = 1 means fully red, t = 0 means fully green
        let t;
        
        if (this.idleTime <= this.HOLD_RED_SECONDS) {
            // Stay red during hold period
            t = 1;
        } else {
            // Fade from red to green over FADE_SECONDS
            const u = (this.idleTime - this.HOLD_RED_SECONDS) / this.FADE_SECONDS;
            const clampedU = constrain(u, 0, 1);
            t = 1 - clampedU; // t goes from 1 to 0
        }
        
        // Lerp from green to red based on t
        const greenColor = color(0, 255, 0);
        const redColor = color(255, 0, 0);
        return lerpColor(greenColor, redColor, t);
    }
    
    checkCollisionAt(testX, testY, terrain) {
        // Get all submarine pixel positions at the test position
        const pixels = this.getSubmarinePixels(testX, testY);
        
        // Check if any submarine pixel overlaps terrain
        for (let pixel of pixels) {
            // Check bounds (treat out-of-bounds as solid)
            if (pixel.x < 0 || pixel.x >= terrain.mapSize || 
                pixel.y < 0 || pixel.y >= terrain.mapSize) {
                return true;
            }
            
            // Check terrain
            if (terrain.isSolid(pixel.x, pixel.y)) {
                return true;
            }
        }
        
        return false;
    }
    
    getSubmarinePixels(cx, cy) {
        // Returns all pixel positions occupied by the submarine
        // Submarine is drawn as rectangles, we need to get all pixels
        const pixels = [];
        
        // Helper to add rotated rectangle pixels
        const addRotatedRect = (localX, localY, w, h) => {
            // For each pixel in the rectangle
            for (let ly = 0; ly < h; ly++) {
                for (let lx = 0; lx < w; lx++) {
                    // Local position relative to submarine center
                    const px = localX + lx;
                    const py = localY + ly;
                    
                    // Rotate around submarine center
                    const cos_a = cos(this.angle);
                    const sin_a = sin(this.angle);
                    const rx = px * cos_a - py * sin_a;
                    const ry = px * sin_a + py * cos_a;
                    
                    // World position
                    const wx = cx + rx;
                    const wy = cy + ry;
                    
                    pixels.push({ x: wx, y: wy });
                }
            }
        };
        
        // Main hull: 8x4 centered at (0,0)
        addRotatedRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Extended nose: 4 pixels long, 2 pixels wide
        addRotatedRect(this.width/2, -1, 4, 2);
        
        // Conning tower: 2x2 at top
        addRotatedRect(-1, -this.height/2 - 1, 2, 2);
        
        return pixels;
    }
    
    accelerate(direction) {
        if (!this.alive) return;
        
        // Only allow forward acceleration (direction = 1)
        if (direction > 0) {
            this.speed += this.acceleration * direction;
            this.speed = constrain(this.speed, 0, this.maxSpeed); // Never negative
            
            this.velocity.x = cos(this.angle) * this.speed;
            this.velocity.y = sin(this.angle) * this.speed;
        }
    }
    
    brake() {
        if (!this.alive) return;
        
        // Apply braking by reducing velocity
        this.velocity.x *= 0.92;
        this.velocity.y *= 0.92;
        
        // Update speed to match
        this.speed = sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    }
    
    turn(direction) {
        if (!this.alive) return;
        this.angle += this.turnSpeed * direction;
        this.isSteering = true; // Mark as steering for idle detection
    }
    
    fireTorpedo() {
        if (!this.alive || this.torpedoCooldown > 0) return null;
        
        this.torpedoCooldown = this.torpedoCooldownMax;
        
        // Spawn torpedo slightly in front of submarine
        const spawnDist = this.width;
        const tx = this.x + cos(this.angle) * spawnDist;
        const ty = this.y + sin(this.angle) * spawnDist;
        
        return new Torpedo(tx, ty, this.angle, this.playerNumber);
    }
    
    kill() {
        this.alive = false;
    }
    
    draw() {
        if (!this.alive) return;
        
        push();
        translate(this.x, this.y);
        rotate(this.angle);
        
        // Submarine body - use dynamic color based on idle state
        fill(this.getColor());
        noStroke();
        
        // Main hull
        rect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Extended nose for clearer direction (4 pixels long)
        rect(this.width/2, -1, 4, 2);
        
        // Conning tower
        rect(-1, -this.height/2 - 1, 2, 2);
        
        pop();
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            angle: this.angle
        };
    }
}
