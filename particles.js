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
        this.size = random(CONFIG.PARTICLES.MIN_SIZE, CONFIG.PARTICLES.MAX_SIZE);
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= CONFIG.PARTICLES.FRICTION;
        this.vy *= CONFIG.PARTICLES.FRICTION;
        this.lifespan--;
    }
    
    isDead() {
        return this.lifespan <= 0;
    }
}

function createExplosion(particles, x, y, count = CONFIG.PARTICLES.EXPLOSION_COUNT) {
    if (!particles) return;
    
    for (let i = 0; i < count; i++) {
        const angle = random(TWO_PI);
        const speed = random(CONFIG.PARTICLES.EXPLOSION_SPEED_MIN, CONFIG.PARTICLES.EXPLOSION_SPEED_MAX);
        const vx = cos(angle) * speed;
        const vy = sin(angle) * speed;
        const lifespan = random(CONFIG.PARTICLES.EXPLOSION_LIFE_MIN, CONFIG.PARTICLES.EXPLOSION_LIFE_MAX);
        const col = color(...CONFIG.COLORS.PARTICLE);
        
        particles.push(new Particle(x, y, vx, vy, lifespan, col));
    }
}

function createDebris(particles, x, y, count = CONFIG.PARTICLES.DEBRIS_COUNT) {
    if (!particles) return;
    
    for (let i = 0; i < count; i++) {
        const angle = random(TWO_PI);
        const speed = random(CONFIG.PARTICLES.DEBRIS_SPEED_MIN, CONFIG.PARTICLES.DEBRIS_SPEED_MAX);
        const vx = cos(angle) * speed;
        const vy = sin(angle) * speed;
        const lifespan = random(CONFIG.PARTICLES.DEBRIS_LIFE_MIN, CONFIG.PARTICLES.DEBRIS_LIFE_MAX);
        const col = color(...CONFIG.COLORS.PARTICLE);
        
        particles.push(new Particle(x, y, vx, vy, lifespan, col));
    }
}

