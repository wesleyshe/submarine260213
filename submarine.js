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
        
        // Visual - console green
        this.color = color(0, 255, 0);
    }
    
    update(terrain) {
        if (!this.alive) return;
        
        // Update cooldowns
        if (this.torpedoCooldown > 0) {
            this.torpedoCooldown--;
        }
        
        // Apply velocity
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        
        // Apply friction
        this.velocity.mult(this.friction);
        
        // Keep in bounds with terrain collision
        this.checkTerrainCollision(terrain);
        
        // Clamp position to map
        this.x = constrain(this.x, 5, terrain.mapSize - 5);
        this.y = constrain(this.y, 5, terrain.mapSize - 5);
    }
    
    checkTerrainCollision(terrain) {
        // Check collision points around the submarine
        const points = this.getCollisionPoints();
        
        for (let point of points) {
            if (terrain.isSolid(point.x, point.y)) {
                // Bounce back
                this.velocity.mult(-0.3);
                this.x += this.velocity.x * 2;
                this.y += this.velocity.y * 2;
                break;
            }
        }
    }
    
    getCollisionPoints() {
        // Get points around the submarine for collision detection
        const points = [];
        const angles = [0, PI/2, PI, -PI/2];
        
        for (let a of angles) {
            const checkAngle = this.angle + a;
            const distance = this.width / 2;
            points.push({
                x: this.x + cos(checkAngle) * distance,
                y: this.y + sin(checkAngle) * distance
            });
        }
        
        return points;
    }
    
    accelerate(direction) {
        if (!this.alive) return;
        
        this.speed += this.acceleration * direction;
        this.speed = constrain(this.speed, -this.maxSpeed/2, this.maxSpeed);
        
        this.velocity.x = cos(this.angle) * this.speed;
        this.velocity.y = sin(this.angle) * this.speed;
    }
    
    turn(direction) {
        if (!this.alive) return;
        this.angle += this.turnSpeed * direction;
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
        
        // Submarine body - console green
        fill(this.color);
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
