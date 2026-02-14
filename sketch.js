// Main game logic and p5.js setup

const MAP_SIZE = 200;
const SCALE = 4; // Display scale multiplier

let terrain;
let player1;
let player2;
let torpedoes = [];
let particles = [];

let gameState = 'playing'; // 'playing', 'gameover'
let winner = null;

// Offscreen buffer for scene rendering
let scene;

// Mini view buffers for annulus previews
let mini1;
let mini2;

// Visibility ring parameters (in screen pixels)
const INNER_RADIUS = 100;
const OUTER_RADIUS = 125;
const INNER_RADIUS_SQ = INNER_RADIUS * INNER_RADIUS;
const OUTER_RADIUS_SQ = OUTER_RADIUS * OUTER_RADIUS;
const MASK_FORWARD_OFFSET = 40; // How far ahead of submarine to center the ring

// Low-res ring display parameters
const LOWRES_RING_SEGMENTS = 50; // Number of chunks around the circle
const LOWRES_RING_INNER_RADIUS = 100; // Inner radius of the ring strip (matches INNER_RADIUS)
const LOWRES_RING_OUTER_RADIUS = 125; // Outer radius of the ring strip (matches OUTER_RADIUS)
const LOWRES_RING_CHUNK_WIDTH = 12; // Visual width of each chunk (pixels)
const LOWRES_RING_CHUNK_GAP = 1; // Gap between chunks (pixels)
const LOWRES_RING_SAMPLES = 3; // Number of radial samples per chunk
const COLUMN_SPACING = 60; // Horizontal spacing between display columns

function setup() {
    // Add padding for green border and UI area on the right
    const PADDING = 40;
    const miniW = OUTER_RADIUS * 2 + 6;
    const miniH = OUTER_RADIUS * 2 + 6;
    const RIGHT_PANEL_WIDTH = miniW + PADDING * 2;
    const LOWRES_PANEL_WIDTH = LOWRES_RING_OUTER_RADIUS * 2 + PADDING * 2;
    
    const canvas = createCanvas(
        MAP_SIZE * SCALE + PADDING * 2 + RIGHT_PANEL_WIDTH + LOWRES_PANEL_WIDTH, 
        MAP_SIZE * SCALE + PADDING * 2
    );
    canvas.parent('game-container');
    
    // Use pixel density 1 for predictable and fast pixel processing
    pixelDensity(1);
    
    // Create offscreen buffer for scene rendering
    scene = createGraphics(width, height);
    scene.pixelDensity(1);
    
    // Create mini view buffers for annulus previews
    mini1 = createGraphics(miniW, miniH);
    mini1.pixelDensity(1);
    mini2 = createGraphics(miniW, miniH);
    mini2.pixelDensity(1);
    
    initGame();
}

function initGame() {
    // Reset game state
    gameState = 'playing';
    winner = null;
    torpedoes = [];
    particles = [];
    
    // Generate terrain
    terrain = new Terrain(MAP_SIZE);
    
    // Find safe spawn positions away from terrain and each other
    const spawn1 = terrain.findSafeSpawn(20, 20, null, MAP_SIZE);
    const spawn2 = terrain.findSafeSpawn(MAP_SIZE - 20, MAP_SIZE - 20, spawn1, MAP_SIZE);
    
    // Create players at safe spawn points
    player1 = new Submarine(spawn1.x, spawn1.y, 1);
    player2 = new Submarine(spawn2.x, spawn2.y, 2);
}


function keyPressed() {
    // Player 1 fire
    if (key === 'x' || key === 'X') {
        const torpedo = player1.fireTorpedo();
        if (torpedo) {
            torpedoes.push(torpedo);
        }
    }
    
    // Player 2 fire
    if (key === 'm' || key === 'M') {
        const torpedo = player2.fireTorpedo();
        if (torpedo) {
            torpedoes.push(torpedo);
        }
    }
    
    // Reset game
    if (key === 'r' || key === 'R') {
        initGame();
    }
    
    return false; // Prevent default browser behavior
}


// Handle continuous key presses for movement
function keyIsDownHandler() {
    if (gameState !== 'playing') return;
    
    // Player 1 controls
    if (keyIsDown(87)) { // W
        player1.accelerate(1);
    }
    if (keyIsDown(83)) { // S - Brake instead of reverse
        player1.brake();
    }
    if (keyIsDown(65)) { // A
        player1.turn(-1);
    }
    if (keyIsDown(68)) { // D
        player1.turn(1);
    }
    
    // Player 2 controls
    if (keyIsDown(UP_ARROW)) {
        player2.accelerate(1);
    }
    if (keyIsDown(DOWN_ARROW)) { // Down - Brake instead of reverse
        player2.brake();
    }
    if (keyIsDown(LEFT_ARROW)) {
        player2.turn(-1);
    }
    if (keyIsDown(RIGHT_ARROW)) {
        player2.turn(1);
    }
}

// Call movement handler every frame
function draw() {
    keyIsDownHandler(); // Check for held keys
    
    const PADDING = 40;
    const ARENA_SIZE = MAP_SIZE * SCALE;
    const ARENA_RIGHT = PADDING + ARENA_SIZE;
    const ARENA_TOP = PADDING;
    const ARENA_HEIGHT = ARENA_SIZE;
    
    // === PASS A: Render full scene to offscreen buffer ===
    scene.push();
    
    // Green background (surrounding terrain)
    scene.background(0, 255, 0);
    
    // Draw black arena in the center
    scene.translate(PADDING, PADDING);
    scene.fill(0);
    scene.noStroke();
    scene.rect(0, 0, ARENA_SIZE, ARENA_SIZE);
    
    // Scale and draw game elements
    scene.scale(SCALE);
    
    // Draw terrain (need to draw on scene buffer)
    drawTerrainToBuffer(scene, terrain);
    
    // Draw particles
    drawParticlesToBuffer(scene, particles);
    
    // Update and draw torpedoes
    for (let i = torpedoes.length - 1; i >= 0; i--) {
        const torpedo = torpedoes[i];
        torpedo.update(terrain, MAP_SIZE);
        drawTorpedoToBuffer(scene, torpedo);
        
        if (!torpedo.alive) {
            torpedoes.splice(i, 1);
        }
    }
    
    // Update game logic
    if (gameState === 'playing') {
        player1.update(terrain);
        player2.update(terrain);
        
        checkTorpedoHits(torpedoes, [player1, player2], particles);
        checkSubmarineCollision(player1, player2);
        
        if (!player1.alive) {
            gameState = 'gameover';
            winner = 2;
            createDebris(particles, player1.x, player1.y, 30);
        } else if (!player2.alive) {
            gameState = 'gameover';
            winner = 1;
            createDebris(particles, player2.x, player2.y, 30);
        }
    }
    
    // Draw submarines
    drawSubmarineToBuffer(scene, player1);
    drawSubmarineToBuffer(scene, player2);
    
    scene.pop();
    
    // === PASS B: Copy to main canvas and apply visibility mask ===
    
    // First, copy the scene to main canvas
    image(scene, 0, 0);
    
    // Apply visibility ring mask using pixel processing
    applyVisibilityMask(PADDING);
    
    // === PASS C: Re-draw submarines and torpedoes at full brightness (after dimming) ===
    push();
    translate(PADDING, PADDING);
    scale(SCALE);
    
    // Draw submarines at full brightness on main canvas
    if (player1.alive) {
        push();
        translate(player1.x, player1.y);
        rotate(player1.angle);
        
        fill(player1.getColor());
        noStroke();
        
        rect(-player1.width/2, -player1.height/2, player1.width, player1.height);
        rect(player1.width/2, -1, 4, 2);
        rect(-1, -player1.height/2 - 1, 2, 2);
        
        pop();
    }
    
    if (player2.alive) {
        push();
        translate(player2.x, player2.y);
        rotate(player2.angle);
        
        fill(player2.getColor());
        noStroke();
        
        rect(-player2.width/2, -player2.height/2, player2.width, player2.height);
        rect(player2.width/2, -1, 4, 2);
        rect(-1, -player2.height/2 - 1, 2, 2);
        
        pop();
    }
    
    // Draw torpedoes at full brightness (always red)
    for (let torpedo of torpedoes) {
        if (torpedo.alive) {
            push();
            translate(torpedo.x, torpedo.y);
            rotate(torpedo.angle);
            
            // Torpedo body - red
            fill(255, 0, 0);
            noStroke();
            ellipse(0, 0, 4, 2);
            
            // Trail
            fill(255, 0, 0, 100);
            ellipse(-2, 0, 2, 1);
            
            pop();
        }
    }
    
    pop();
    
    // === PASS D: Render annulus preview buffers ===
    renderAnnulusPreviews(PADDING, ARENA_RIGHT, ARENA_TOP, ARENA_HEIGHT);
    
    // === PASS E: Render low-res ring displays ===
    renderLowResRings(PADDING, ARENA_RIGHT, ARENA_TOP, ARENA_HEIGHT);
}

// Render both annulus preview buffers with rotation and masking
function renderAnnulusPreviews(padding, arenaRight, arenaTop, arenaHeight) {
    const miniW = OUTER_RADIUS * 2 + 6;
    const miniH = OUTER_RADIUS * 2 + 6;
    
    // Calculate centers for both previews on the right side
    const cx = arenaRight + padding + miniW / 2;
    const topCy = arenaTop + arenaHeight * 0.25;
    const bottomCy = arenaTop + arenaHeight * 0.75;
    
    // Render player 1's annulus view (top)
    renderAnnulusPreview(mini1, player1, miniW, miniH, padding);
    image(mini1, cx - miniW / 2, topCy - miniH / 2);
    
    // Render player 2's annulus view (bottom)
    renderAnnulusPreview(mini2, player2, miniW, miniH, padding);
    image(mini2, cx - miniW / 2, bottomCy - miniH / 2);
}

// Render a single annulus preview for a submarine
function renderAnnulusPreview(g, sub, miniW, miniH, padding) {
    // Clear buffer (transparent)
    g.clear();
    
    // Fill with green background
    g.background(0, 255, 0);
    
    // Calculate mask center (submarine position + forward offset)
    const maskCx = padding + sub.x * SCALE + cos(sub.angle) * MASK_FORWARD_OFFSET;
    const maskCy = padding + sub.y * SCALE + sin(sub.angle) * MASK_FORWARD_OFFSET;
    
    // Render world rotated so submarine's forward direction points up
    g.push();
    g.translate(miniW / 2, miniH / 2);
    g.rotate((PI / 2) - sub.angle + PI); // Forward points up, then rotate 180 degrees
    g.translate(-maskCx, -maskCy); // Center on mask center
    
    // Draw black arena
    g.translate(padding, padding);
    g.fill(0);
    g.noStroke();
    g.rect(0, 0, MAP_SIZE * SCALE, MAP_SIZE * SCALE);
    
    // Draw world elements in scaled coordinates
    g.scale(SCALE);
    
    // Draw terrain
    drawTerrainToBuffer(g, terrain);
    
    // Draw particles
    drawParticlesToBuffer(g, particles);
    
    // Draw torpedoes
    for (let torpedo of torpedoes) {
        drawTorpedoToBuffer(g, torpedo);
    }
    
    // Draw submarines
    drawSubmarineToBuffer(g, player1);
    drawSubmarineToBuffer(g, player2);
    
    g.pop();
    
    // Apply annulus mask (make everything outside the ring transparent)
    g.loadPixels();
    for (let y = 0; y < miniH; y++) {
        for (let x = 0; x < miniW; x++) {
            const dx = x - miniW / 2;
            const dy = y - miniH / 2;
            const d2 = dx * dx + dy * dy;
            
            // If pixel is NOT in annulus range, set alpha to 0
            if (d2 < INNER_RADIUS_SQ || d2 > OUTER_RADIUS_SQ) {
                const idx = (y * miniW + x) * 4;
                g.pixels[idx + 3] = 0; // Set alpha to transparent
            }
        }
    }
    g.updatePixels();
}

// Render both low-res ring displays
function renderLowResRings(padding, arenaRight, arenaTop, arenaHeight) {
    const miniW = OUTER_RADIUS * 2 + 6;
    const ringSize = LOWRES_RING_OUTER_RADIUS * 2;
    
    // Calculate centers - to the right of the annulus previews with column spacing
    const cx = arenaRight + padding + miniW + COLUMN_SPACING + ringSize / 2;
    const topCy = arenaTop + arenaHeight * 0.25;
    const bottomCy = arenaTop + arenaHeight * 0.75;
    
    // Render player 1's low-res ring (top)
    renderLowResRing(cx, topCy, player1, padding);
    
    // Render player 2's low-res ring (bottom)
    renderLowResRing(cx, bottomCy, player2, padding);
}

// Render a single low-res ring display for a submarine
function renderLowResRing(cx, cy, sub, padding) {
    // Calculate mask center (same as annulus preview)
    const maskCx = padding + sub.x * SCALE + cos(sub.angle) * MASK_FORWARD_OFFSET;
    const maskCy = padding + sub.y * SCALE + sin(sub.angle) * MASK_FORWARD_OFFSET;
    
    // Rotation angle (same as annulus preview: forward up + 180, then +90 clockwise)
    const rotationAngle = (PI / 2) - sub.angle + PI;
    const lowresRotation = rotationAngle + (PI / 2); // Additional 90 degrees clockwise
    
    // Draw each chunk around the ring
    for (let i = 0; i < LOWRES_RING_SEGMENTS; i++) {
        // Angle for this chunk (in ring space, 0 = up)
        const chunkAngle = (i / LOWRES_RING_SEGMENTS) * TWO_PI;
        
        // Sample the annulus preview to determine chunk color
        const chunkColor = sampleAnnulusForChunk(
            chunkAngle, lowresRotation, maskCx, maskCy, padding
        );
        
        // Draw the chunk
        drawRingChunk(cx, cy, chunkAngle, chunkColor);
    }
}

// Sample the annulus preview at a given angle to determine chunk color
function sampleAnnulusForChunk(chunkAngle, rotationAngle, maskCx, maskCy, padding) {
    let hasSubmarine = false;
    let hasTorpedo = false;
    let hasTerrain = false;
    let submarineColor = null;
    
    // Sample at multiple radii within the annulus
    for (let s = 0; s < LOWRES_RING_SAMPLES; s++) {
        const radius = lerp(INNER_RADIUS, OUTER_RADIUS, s / (LOWRES_RING_SAMPLES - 1));
        
        // Position in ring-local space (relative to mask center, unrotated)
        const localX = cos(chunkAngle) * radius;
        const localY = sin(chunkAngle) * radius;
        
        // Rotate back to world view (inverse of preview rotation)
        const cos_r = cos(-rotationAngle);
        const sin_r = sin(-rotationAngle);
        const rotX = localX * cos_r - localY * sin_r;
        const rotY = localX * sin_r + localY * cos_r;
        
        // World position (screen coordinates)
        const worldX = maskCx + rotX;
        const worldY = maskCy + rotY;
        
        // Convert to map coordinates
        const mapX = (worldX - padding) / SCALE;
        const mapY = (worldY - padding) / SCALE;
        
        // Check what's at this position
        // Check submarines
        if (checkPointNearSubmarine(mapX, mapY, player1)) {
            hasSubmarine = true;
            submarineColor = player1.getColor();
        }
        if (checkPointNearSubmarine(mapX, mapY, player2)) {
            hasSubmarine = true;
            submarineColor = player2.getColor();
        }
        
        // Check torpedoes
        for (let torpedo of torpedoes) {
            if (torpedo.alive && dist(mapX, mapY, torpedo.x, torpedo.y) < 3) {
                hasTorpedo = true;
                break;
            }
        }
        
        // Check terrain
        if (terrain.isSolid(mapX, mapY)) {
            hasTerrain = true;
        }
    }
    
    // Determine chunk color based on what was found
    if (hasSubmarine && submarineColor) {
        return submarineColor;
    } else if (hasTorpedo) {
        return color(255, 0, 0); // Red for torpedoes
    } else if (hasTerrain) {
        return color(0, 255, 0); // Green for terrain
    } else {
        return color(0, 0, 0); // Black for empty space
    }
}

// Check if a point is near a submarine
function checkPointNearSubmarine(x, y, sub) {
    if (!sub.alive) return false;
    return dist(x, y, sub.x, sub.y) < sub.width / 2 + 2;
}

// Draw a single chunk of the low-res ring
function drawRingChunk(cx, cy, angle, chunkColor) {
    push();
    translate(cx, cy);
    rotate(angle);
    
    // Calculate chunk dimensions
    const avgRadius = (LOWRES_RING_INNER_RADIUS + LOWRES_RING_OUTER_RADIUS) / 2;
    const radialThickness = LOWRES_RING_OUTER_RADIUS - LOWRES_RING_INNER_RADIUS;
    
    // Draw as a rectangle at the radius
    fill(chunkColor);
    noStroke();
    rectMode(CENTER);
    rect(0, -avgRadius, LOWRES_RING_CHUNK_WIDTH, radialThickness - LOWRES_RING_CHUNK_GAP);
    
    pop();
}

// Helper function to draw terrain to a graphics buffer
function drawTerrainToBuffer(buffer, terrain) {
    buffer.push();
    buffer.noStroke();
    buffer.fill(0, 255, 0); // Console green terrain
    
    for (let y = 0; y < terrain.grid.length; y++) {
        for (let x = 0; x < terrain.grid[y].length; x++) {
            if (terrain.grid[y][x] === 1) {
                buffer.rect(x * terrain.pixelSize, y * terrain.pixelSize, terrain.pixelSize, terrain.pixelSize);
            }
        }
    }
    buffer.pop();
}

// Helper function to draw particles to a graphics buffer
function drawParticlesToBuffer(buffer, particles) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
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
}

// Helper function to draw torpedo to a graphics buffer
function drawTorpedoToBuffer(buffer, torpedo) {
    if (!torpedo.alive) return;
    
    buffer.push();
    buffer.translate(torpedo.x, torpedo.y);
    buffer.rotate(torpedo.angle);
    
    // Torpedo body - red
    buffer.fill(255, 0, 0);
    buffer.noStroke();
    buffer.ellipse(0, 0, 4, 2);
    
    // Trail
    buffer.fill(255, 0, 0, 100);
    buffer.ellipse(-2, 0, 2, 1);
    
    buffer.pop();
}

// Helper function to draw submarine to a graphics buffer
function drawSubmarineToBuffer(buffer, sub) {
    if (!sub.alive) return;
    
    buffer.push();
    buffer.translate(sub.x, sub.y);
    buffer.rotate(sub.angle);
    
    // Submarine body - use dynamic color based on idle state
    buffer.fill(sub.getColor());
    buffer.noStroke();
    
    // Main hull
    buffer.rect(-sub.width/2, -sub.height/2, sub.width, sub.height);
    
    // Extended nose for clearer direction (4 pixels long)
    buffer.rect(sub.width/2, -1, 4, 2);
    
    // Conning tower
    buffer.rect(-1, -sub.height/2 - 1, 2, 2);
    
    buffer.pop();
}

// Apply visibility mask: dim pixels outside both annulus rings
function applyVisibilityMask(padding) {
    // Convert submarine map coordinates to screen coordinates
    const sx1 = padding + player1.x * SCALE;
    const sy1 = padding + player1.y * SCALE;
    const sx2 = padding + player2.x * SCALE;
    const sy2 = padding + player2.y * SCALE;
    
    // Compute ring centers offset forward along submarine heading
    const cx1 = sx1 + cos(player1.angle) * MASK_FORWARD_OFFSET;
    const cy1 = sy1 + sin(player1.angle) * MASK_FORWARD_OFFSET;
    const cx2 = sx2 + cos(player2.angle) * MASK_FORWARD_OFFSET;
    const cy2 = sy2 + sin(player2.angle) * MASK_FORWARD_OFFSET;
    
    // Process pixels
    loadPixels();
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Calculate squared distances to both ring centers
            const dx1 = x - cx1;
            const dy1 = y - cy1;
            const d1sq = dx1 * dx1 + dy1 * dy1;
            
            const dx2 = x - cx2;
            const dy2 = y - cy2;
            const d2sq = dx2 * dx2 + dy2 * dy2;
            
            // Check if pixel is inside either annulus (ring)
            const inRing1 = (d1sq >= INNER_RADIUS_SQ) && (d1sq <= OUTER_RADIUS_SQ);
            const inRing2 = (d2sq >= INNER_RADIUS_SQ) && (d2sq <= OUTER_RADIUS_SQ);
            
            // If NOT visible (not in either ring), dim by 50%
            if (!inRing1 && !inRing2) {
                const idx = (y * width + x) * 4;
                pixels[idx + 0] *= 0.1; // Red
                pixels[idx + 1] *= 0.1; // Green
                pixels[idx + 2] *= 0.1; // Blue
                // Leave alpha unchanged
            }
        }
    }
    
    updatePixels();
}
