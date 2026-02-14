// Collision detection utilities

function checkTorpedoHits(torpedoes, submarines, particles) {
    for (let i = torpedoes.length - 1; i >= 0; i--) {
        const torpedo = torpedoes[i];
        if (!torpedo || !torpedo.alive) continue;
        
        for (let submarine of submarines) {
            if (!submarine) continue;
            
            if (torpedo.checkHit(submarine)) {
                submarine.kill(); // One-hit kill
                torpedo.alive = false;
                
                // Create explosion particles
                createExplosion(particles, torpedo.x, torpedo.y, CONFIG.PARTICLES.EXPLOSION_COUNT);
                break;
            }
        }
    }
}

function checkSubmarineCollision(sub1, sub2) {
    if (!sub1 || !sub2 || !sub1.alive || !sub2.alive) return;
    
    const d = dist(sub1.x, sub1.y, sub2.x, sub2.y);
    const minDist = (CONFIG.SUBMARINE.WIDTH + CONFIG.SUBMARINE.WIDTH) / 2;
    
    if (d < minDist && d > 0) { // Avoid division by zero
        // Push submarines apart
        const angle = atan2(sub2.y - sub1.y, sub2.x - sub1.x);
        const pushForce = (minDist - d) * CONFIG.COLLISION.PUSH_FACTOR;
        
        sub1.x -= cos(angle) * pushForce;
        sub1.y -= sin(angle) * pushForce;
        sub2.x += cos(angle) * pushForce;
        sub2.y += sin(angle) * pushForce;
        
        // Bounce velocities
        sub1.velocity.mult(-CONFIG.COLLISION.BOUNCE_DAMPING);
        sub2.velocity.mult(-CONFIG.COLLISION.BOUNCE_DAMPING);
        
        // Play collision sounds for both submarines
        SoundManager.playCollision(sub1.playerNumber);
        SoundManager.playCollision(sub2.playerNumber);
    }
}
