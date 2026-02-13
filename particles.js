// Particle system for visual effects

class Particle {
    constructor(x, y, vx, vy, lifespan, col) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.lifespan = lifespan;
        this.maxLifespan = lifespan;
        this.col = col;
        this.size = random(1, 3);
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.lifespan--;
    }
    
    draw() {
        const alpha = map(this.lifespan, 0, this.maxLifespan, 0, 255);
        push();
        noStroke();
        fill(red(this.col), green(this.col), blue(this.col), alpha);
        ellipse(this.x, this.y, this.size);
        pop();
    }
    
    isDead() {
        return this.lifespan <= 0;
    }
}

function createExplosion(particles, x, y, count) {
    for (let i = 0; i < count; i++) {
        const angle = random(TWO_PI);
        const speed = random(0.5, 2);
        const vx = cos(angle) * speed;
        const vy = sin(angle) * speed;
        const lifespan = random(20, 40);
        const col = color(0, 255, 0); // Console green
        
        particles.push(new Particle(x, y, vx, vy, lifespan, col));
    }
}

function createDebris(particles, x, y, count) {
    for (let i = 0; i < count; i++) {
        const angle = random(TWO_PI);
        const speed = random(0.2, 1.5);
        const vx = cos(angle) * speed;
        const vy = sin(angle) * speed;
        const lifespan = random(30, 60);
        const col = color(0, 255, 0); // Console green
        
        particles.push(new Particle(x, y, vx, vy, lifespan, col));
    }
}

function updateAndDrawParticles(particles) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        
        if (p.isDead()) {
            particles.splice(i, 1);
        }
    }
}
