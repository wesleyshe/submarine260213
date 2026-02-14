// Rendering utilities - centralized drawing functions

const Renderer = {
    /**
     * Draw submarine to a graphics buffer
     */
    drawSubmarine(buffer, sub) {
        if (!sub || !sub.alive) return;
        
        buffer.push();
        buffer.translate(sub.x, sub.y);
        buffer.rotate(sub.angle);
        
        buffer.fill(sub.getColor());
        buffer.noStroke();
        
        // Main hull
        buffer.rect(-sub.width/2, -sub.height/2, sub.width, sub.height);
        
        // Extended nose
        buffer.rect(sub.width/2, -1, CONFIG.SUBMARINE.NOSE_LENGTH, 2);
        
        // Conning tower
        buffer.rect(-1, -sub.height/2 - 1, CONFIG.SUBMARINE.TOWER_WIDTH, CONFIG.SUBMARINE.TOWER_HEIGHT);
        
        buffer.pop();
    },
    
    /**
     * Draw torpedo to a graphics buffer
     */
    drawTorpedo(buffer, torpedo) {
        if (!torpedo || !torpedo.alive) return;
        
        buffer.push();
        buffer.translate(torpedo.x, torpedo.y);
        buffer.rotate(torpedo.angle);
        
        // Torpedo body
        buffer.fill(...CONFIG.COLORS.TORPEDO);
        buffer.noStroke();
        buffer.ellipse(0, 0, CONFIG.TORPEDO.WIDTH, CONFIG.TORPEDO.HEIGHT);
        
        // Trail
        buffer.fill(...CONFIG.COLORS.TORPEDO, CONFIG.COLORS.TORPEDO_TRAIL_ALPHA);
        buffer.ellipse(CONFIG.TORPEDO.TRAIL_OFFSET, 0, CONFIG.TORPEDO.TRAIL_WIDTH, CONFIG.TORPEDO.TRAIL_HEIGHT);
        
        buffer.pop();
    },
    
    /**
     * Draw terrain to a graphics buffer
     */
    drawTerrain(buffer, terrain) {
        if (!terrain || !terrain.grid) return;
        
        buffer.push();
        buffer.noStroke();
        buffer.fill(...CONFIG.COLORS.TERRAIN);
        
        for (let y = 0; y < terrain.grid.length; y++) {
            for (let x = 0; x < terrain.grid[y].length; x++) {
                if (terrain.grid[y][x] === 1) {
                    buffer.rect(x * terrain.pixelSize, y * terrain.pixelSize, terrain.pixelSize, terrain.pixelSize);
                }
            }
        }
        buffer.pop();
    },
    
    /**
     * Draw particles to a graphics buffer
     */
    drawParticles(buffer, particles) {
        if (!particles) return;
        
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            if (!p) continue;
            
            p.update();
            
            const alpha = map(p.lifespan, 0, p.maxLifespan, 0, 255);
            buffer.push();
            buffer.noStroke();
            buffer.fill(red(p.col), green(p.col), blue(p.col), alpha);
            buffer.ellipse(p.x, p.y, p.size);
            buffer.pop();
            
            if (p.isDead()) {
                particles.splice(i, 1);
            }
        }
    },
    
    /**
     * Draw self-submarine marker (for annulus and low-res rings)
     */
    drawSelfMarker(buffer, x, y, sub, extraRotation) {
        if (!sub) return;
        
        const ringThickness = CONFIG.VISIBILITY.OUTER_RADIUS - CONFIG.VISIBILITY.INNER_RADIUS;
        const markerSize = ringThickness * 0.5;
        
        buffer.push();
        buffer.translate(x, y);
        buffer.rotate(extraRotation);
        
        buffer.fill(sub.getColor());
        buffer.noStroke();
        
        // Triangle pointing up
        buffer.beginShape();
        buffer.vertex(0, -markerSize * 0.6);
        buffer.vertex(-markerSize * 0.4, markerSize * 0.4);
        buffer.vertex(markerSize * 0.4, markerSize * 0.4);
        buffer.endShape(CLOSE);
        
        buffer.pop();
    }
};
