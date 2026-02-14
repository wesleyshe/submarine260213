// Torpedo projectile

class Torpedo {
    constructor(x, y, angle, owner) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.owner = owner; // Which player fired it
        
        this.speed = CONFIG.TORPEDO.SPEED;
        this.velocity = createVector(cos(angle) * this.speed, sin(angle) * this.speed);
        
        this.radius = CONFIG.TORPEDO.RADIUS;
        this.damage = CONFIG.TORPEDO.DAMAGE;
        this.alive = true;
        this.lifetime = CONFIG.TORPEDO.LIFETIME;
        this.age = 0;
    }
    
    update(terrain, mapSize) {
        if (!this.alive) return;
        
        // Sanitize velocity to prevent NaN propagation
        this.velocity.x = Utils.sanitizeNumber(this.velocity.x, 0);
        this.velocity.y = Utils.sanitizeNumber(this.velocity.y, 0);
        
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.age++;
        
        // Bounds check before terrain check
        if (this.x < 0 || this.x > mapSize || this.y < 0 || this.y > mapSize) {
            this.alive = false;
            return;
        }
        
        // Check terrain collision with null safety
        if (terrain && terrain.isSolid(this.x, this.y)) {
            this.explode();
            return;
        }
        
        // Check lifetime
        if (this.age > this.lifetime) {
            this.alive = false;
        }
    }
    
    explode() {
        this.alive = false;
    }
    
    checkHit(submarine) {
        if (!this.alive || !submarine || !submarine.alive) return false;
        if (this.owner === submarine.playerNumber) return false;
        
        // Use the submarine's irregular hitbox check
        return submarine.checkPointHit(this.x, this.y);
    }
}
