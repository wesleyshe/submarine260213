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
        this.maxSpeed = CONFIG.SUBMARINE.MAX_SPEED;
        this.acceleration = CONFIG.SUBMARINE.ACCELERATION;
        this.turnSpeed = CONFIG.SUBMARINE.TURN_SPEED;
        this.friction = CONFIG.SUBMARINE.FRICTION;
        
        // Submarine size and shape
        this.width = CONFIG.SUBMARINE.WIDTH;
        this.height = CONFIG.SUBMARINE.HEIGHT;
        
        // Combat
        this.alive = true;
        this.torpedoCooldown = 0;
        this.torpedoCooldownMax = CONFIG.TORPEDO.COOLDOWN;
        
        // Visual and idle detection
        this.idleTime = 0;
        this.isSteering = false;
        
        // Start submarines as green (fully idle)
        this.idleTime = CONFIG.SUBMARINE.HOLD_RED_SECONDS + CONFIG.SUBMARINE.FADE_SECONDS;
    }
    
    update(terrain) {
        if (!this.alive || !terrain) return;
        
        // Update cooldowns
        if (this.torpedoCooldown > 0) {
            this.torpedoCooldown--;
        }
        
        // Clamp delta time to prevent huge spikes
        const safeDelta = Utils.clampDeltaTime(deltaTime);
        
        // Determine if submarine is "moving" (translating or steering)
        const speed = sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        const isMoving = (speed > CONFIG.SUBMARINE.STOP_THRESHOLD) || this.isSteering;
        
        // Update idle time based on movement state
        if (isMoving) {
            this.idleTime = 0;
        } else {
            this.idleTime += safeDelta / 1000; // Convert ms to seconds
        }
        
        // Clear steering flag for next frame
        this.isSteering = false;
        
        // Sanitize velocity to prevent NaN propagation
        this.velocity.x = Utils.sanitizeNumber(this.velocity.x, 0);
        this.velocity.y = Utils.sanitizeNumber(this.velocity.y, 0);
        
        // Apply friction
        this.velocity.mult(this.friction);
        
        // Compute proposed new position
        const nx = this.x + this.velocity.x;
        const ny = this.y + this.velocity.y;
        
        // Axis-separated collision: try X first
        if (this.checkCollisionAt(nx, this.y, terrain)) {
            this.velocity.x = 0;
        } else {
            this.x = nx;
        }
        
        // Then try Y
        if (this.checkCollisionAt(this.x, ny, terrain)) {
            this.velocity.y = 0;
        } else {
            this.y = ny;
        }
        
        // Clamp position to map bounds
        const oldX = this.x;
        const oldY = this.y;
        this.x = constrain(this.x, CONFIG.SUBMARINE.COLLISION_RADIUS, terrain.mapSize - CONFIG.SUBMARINE.COLLISION_RADIUS);
        this.y = constrain(this.y, CONFIG.SUBMARINE.COLLISION_RADIUS, terrain.mapSize - CONFIG.SUBMARINE.COLLISION_RADIUS);
        
        // If we hit bounds, zero velocity
        if (this.x !== oldX) this.velocity.x = 0;
        if (this.y !== oldY) this.velocity.y = 0;
    }
    
    getColor() {
        // Compute color transition parameter t
        // t = 1 means fully red, t = 0 means fully green
        let t;
        
        if (this.idleTime <= CONFIG.SUBMARINE.HOLD_RED_SECONDS) {
            t = 1;
        } else {
            const u = (this.idleTime - CONFIG.SUBMARINE.HOLD_RED_SECONDS) / CONFIG.SUBMARINE.FADE_SECONDS;
            const clampedU = constrain(u, 0, 1);
            t = 1 - clampedU;
        }
        
        const greenColor = color(...CONFIG.COLORS.SUBMARINE_IDLE);
        const redColor = color(...CONFIG.COLORS.SUBMARINE_MOVING);
        return lerpColor(greenColor, redColor, t);
    }
    
    checkCollisionAt(testX, testY, terrain) {
        if (!terrain) return false;
        
        // Get all submarine pixel positions at the test position
        const pixels = this.getSubmarinePixels(testX, testY);
        
        // Check if any submarine pixel overlaps terrain
        for (let pixel of pixels) {
            // Skip out-of-bounds pixels (boundary clamping handles map edges separately)
            if (!Utils.inBounds(pixel.x, pixel.y, 0, 0, terrain.mapSize - 1, terrain.mapSize - 1)) {
                continue;
            }
            
            // Check terrain
            if (terrain.isSolid(pixel.x, pixel.y)) {
                return true;
            }
        }
        
        return false;
    }
    
    getSubmarinePixels(cx, cy) {
        const pixels = [];
        
        // Simplified rectangular collision box (ignoring rotation for efficiency)
        // Use a simple bounding box instead of the detailed submarine shape
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        for (let ly = -halfHeight; ly < halfHeight; ly++) {
            for (let lx = -halfWidth; lx < halfWidth; lx++) {
                const wx = cx + lx;
                const wy = cy + ly;
                pixels.push({ x: wx, y: wy });
            }
        }
        
        return pixels;
    }
    
    accelerate(direction) {
        if (!this.alive) return;
        
        // Only allow forward acceleration (direction = 1)
        if (direction > 0) {
            this.speed += this.acceleration * direction;
            this.speed = constrain(this.speed, 0, this.maxSpeed);
            
            this.velocity.x = cos(this.angle) * this.speed;
            this.velocity.y = sin(this.angle) * this.speed;
        }
    }
    
    brake() {
        if (!this.alive) return;
        
        this.velocity.x *= CONFIG.SUBMARINE.BRAKE_FACTOR;
        this.velocity.y *= CONFIG.SUBMARINE.BRAKE_FACTOR;
        
        this.speed = sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    }
    
    turn(direction) {
        if (!this.alive) return;
        this.angle += this.turnSpeed * direction;
        this.isSteering = true;
    }
    
    fireTorpedo() {
        if (!this.alive || this.torpedoCooldown > 0) return null;
        
        this.torpedoCooldown = this.torpedoCooldownMax;
        
        const spawnDist = CONFIG.TORPEDO.SPAWN_DISTANCE;
        const tx = this.x + cos(this.angle) * spawnDist;
        const ty = this.y + sin(this.angle) * spawnDist;
        
        return new Torpedo(tx, ty, this.angle, this.playerNumber);
    }
    
    kill() {
        this.alive = false;
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
