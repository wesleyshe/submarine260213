// Torpedo projectile

class Torpedo {
    constructor(x, y, angle, owner) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.owner = owner; // Which player fired it
        
        this.speed = 1.5;
        this.velocity = createVector(cos(angle) * this.speed, sin(angle) * this.speed);
        
        this.radius = 2;
        this.damage = 35;
        this.alive = true;
        this.lifetime = 200; // Despawn after this many frames
        this.age = 0;
    }
    
    update(terrain, mapSize) {
        if (!this.alive) return;
        
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.age++;
        
        // Check terrain collision
        if (terrain.isSolid(this.x, this.y)) {
            this.explode();
            return;
        }
        
        // Check bounds
        if (this.x < 0 || this.x > mapSize || this.y < 0 || this.y > mapSize) {
            this.alive = false;
            return;
        }
        
        // Check lifetime
        if (this.age > this.lifetime) {
            this.alive = false;
        }
    }
    
    explode() {
        this.alive = false;
        // Terrain is not destroyed - permanent obstacles
    }
    
    draw() {
        if (!this.alive) return;
        
        push();
        translate(this.x, this.y);
        rotate(this.angle);
        
        // Torpedo body - red
        fill(255, 0, 0);
        noStroke();
        ellipse(0, 0, 4, 2);
        
        // Trail
        fill(255, 0, 0, 100);
        ellipse(-2, 0, 2, 1);
        
        pop();
    }
    
    checkHit(submarine) {
        if (!this.alive || !submarine.alive) return false;
        if (this.owner === submarine.playerNumber) return false;
        
        const d = dist(this.x, this.y, submarine.x, submarine.y);
        return d < this.radius + submarine.width / 2;
    }
}
