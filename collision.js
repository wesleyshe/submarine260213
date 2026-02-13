// Collision detection utilities

function checkTorpedoHits(torpedoes, submarines, particles) {
    for (let i = torpedoes.length - 1; i >= 0; i--) {
        const torpedo = torpedoes[i];
        
        for (let submarine of submarines) {
            if (torpedo.checkHit(submarine)) {
                submarine.kill(); // One-hit kill
                torpedo.alive = false;
                
                // Create explosion particles
                createExplosion(particles, torpedo.x, torpedo.y, 15);
                break;
            }
        }
        
        // Remove dead torpedoes
        if (!torpedo.alive) {
            torpedoes.splice(i, 1);
        }
    }
}

function checkSubmarineCollision(sub1, sub2) {
    if (!sub1.alive || !sub2.alive) return;
    
    const d = dist(sub1.x, sub1.y, sub2.x, sub2.y);
    const minDist = (sub1.width + sub2.width) / 2;
    
    if (d < minDist) {
        // Push submarines apart
        const angle = atan2(sub2.y - sub1.y, sub2.x - sub1.x);
        const pushForce = (minDist - d) / 2;
        
        sub1.x -= cos(angle) * pushForce;
        sub1.y -= sin(angle) * pushForce;
        sub2.x += cos(angle) * pushForce;
        sub2.y += sin(angle) * pushForce;
        
        // Bounce velocities
        sub1.velocity.mult(-0.5);
        sub2.velocity.mult(-0.5);
        
        // No damage from submarine collisions
    }
}
