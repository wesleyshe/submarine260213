// Main game logic and p5.js setup

// Game state
let terrain;
let player1;
let player2;
let torpedoes = [];
let particles = [];

let gameState = 'playing'; // 'playing', 'gameover'
let winner = null;

// Graphics buffers
let scene; // Offscreen buffer for scene rendering
let mini1, mini2; // Mini view buffers for annulus previews

// Computed layout values (set in setup)
let layoutInfo = {};

function setup() {
    try {
        const miniSize = CONFIG.VISIBILITY.OUTER_RADIUS * 2 + CONFIG.DISPLAY.ANNULUS_BORDER;
        const lowresSize = CONFIG.LOWRES_RING.OUTER_RADIUS * 2;
        
        const canvas = createCanvas(
            CONFIG.MAP_SIZE * CONFIG.SCALE + CONFIG.PADDING * 2 + CONFIG.ANNULUS_GAP + miniSize + CONFIG.LOWRES_GAP + lowresSize + CONFIG.PADDING,
            CONFIG.MAP_SIZE * CONFIG.SCALE + CONFIG.PADDING * 2
        );
        canvas.parent('game-container');
        
        pixelDensity(1);
        
        // Set up terminal-like font
        textFont(CONFIG.UI.FONT_FAMILY);
        
        // Create graphics buffers
        scene = createGraphics(width, height);
        scene.pixelDensity(1);
        
        mini1 = createGraphics(miniSize, miniSize);
        mini1.pixelDensity(1);
        mini2 = createGraphics(miniSize, miniSize);
        mini2.pixelDensity(1);
        
        // Store layout info for use in draw
        layoutInfo = {
            arenaSize: CONFIG.MAP_SIZE * CONFIG.SCALE,
            arenaRight: CONFIG.PADDING + CONFIG.MAP_SIZE * CONFIG.SCALE,
            arenaTop: CONFIG.PADDING,
            arenaHeight: CONFIG.MAP_SIZE * CONFIG.SCALE,
            miniSize: miniSize
        };
        
        // Initialize sound manager
        SoundManager.init();
        
        initGame();
    } catch (e) {
        console.error('Setup failed:', e);
    }
}

function initGame() {
    try {
        gameState = 'playing';
        winner = null;
        torpedoes = [];
        particles = [];
        
        terrain = new Terrain(CONFIG.MAP_SIZE);
        
        const spawn1 = terrain.findSafeSpawn(20, 20, null, CONFIG.MAP_SIZE);
        const spawn2 = terrain.findSafeSpawn(CONFIG.MAP_SIZE - 20, CONFIG.MAP_SIZE - 20, spawn1, CONFIG.MAP_SIZE);
        
        player1 = new Submarine(spawn1.x, spawn1.y, 1);
        player2 = new Submarine(spawn2.x, spawn2.y, 2);
    } catch (e) {
        console.error('Init game failed:', e);
    }
}

function keyPressed() {
    try {
        // Resume audio context on first user interaction
        SoundManager.resume();
        
        // Player 1 fire
        if ((key === 'x' || key === 'X') && player1) {
            const torpedo = player1.fireTorpedo();
            if (torpedo) {
                torpedoes.push(torpedo);
                SoundManager.playTorpedoLaunch();
            }
        }
        
        // Player 2 fire
        if ((key === 'm' || key === 'M') && player2) {
            const torpedo = player2.fireTorpedo();
            if (torpedo) {
                torpedoes.push(torpedo);
                SoundManager.playTorpedoLaunch();
            }
        }
        
        // Reset game
        if (key === 'r' || key === 'R') {
            initGame();
        }
        
        return false;
    } catch (e) {
        console.error('Key pressed error:', e);
        return false;
    }
}

function handleInput() {
    if (gameState !== 'playing' || !player1 || !player2) return;
    
    try {
        // Player 1 controls
        if (keyIsDown(CONFIG.CONTROLS.PLAYER1.FORWARD)) player1.accelerate(1);
        if (keyIsDown(CONFIG.CONTROLS.PLAYER1.BRAKE)) player1.brake();
        if (keyIsDown(CONFIG.CONTROLS.PLAYER1.LEFT)) player1.turn(-1);
        if (keyIsDown(CONFIG.CONTROLS.PLAYER1.RIGHT)) player1.turn(1);
        
        // Player 2 controls
        if (keyIsDown(UP_ARROW)) player2.accelerate(1);
        if (keyIsDown(DOWN_ARROW)) player2.brake();
        if (keyIsDown(LEFT_ARROW)) player2.turn(-1);
        if (keyIsDown(RIGHT_ARROW)) player2.turn(1);
    } catch (e) {
        console.error('Input handling error:', e);
    }
}

function draw() {
    try {
        handleInput();
        
        // Start ambient sound when playing
        if (gameState === 'playing') {
            SoundManager.startAmbient();
        } else if (gameState === 'gameover') {
            SoundManager.stopAmbient();
        }
        
        // Render full scene to offscreen buffer
        renderScene();
        
        // Copy scene to main canvas
        image(scene, 0, 0);
        
        // Apply visibility mask
        applyVisibilityMask();
        
        // Re-draw submarines and torpedoes at full brightness
        redrawEntitiesFullBright();
        
        // Render annulus previews
        renderAnnulusPreviews();
        
        // Render low-res ring displays
        renderLowResRings();
        
        // Draw game over UI if needed
        if (gameState === 'gameover') {
            drawGameOverUI();
        }
    } catch (e) {
        console.error('Draw loop error:', e);
    }
}

function renderScene() {
    if (!scene || !terrain) return;
    
    scene.push();
    
    // Background
    scene.background(...CONFIG.COLORS.BACKGROUND);
    
    // Arena
    scene.translate(CONFIG.PADDING, CONFIG.PADDING);
    scene.fill(...CONFIG.COLORS.ARENA);
    scene.noStroke();
    scene.rect(0, 0, layoutInfo.arenaSize, layoutInfo.arenaSize);
    
    scene.scale(CONFIG.SCALE);
    
    // Draw world elements
    Renderer.drawTerrain(scene, terrain);
    Renderer.drawParticles(scene, particles);
    
    // Update and draw torpedoes
    for (let i = torpedoes.length - 1; i >= 0; i--) {
        const torpedo = torpedoes[i];
        if (!torpedo) {
            torpedoes.splice(i, 1);
            continue;
        }
        
        torpedo.update(terrain, CONFIG.MAP_SIZE);
        Renderer.drawTorpedo(scene, torpedo);
        
        if (!torpedo.alive) {
            torpedoes.splice(i, 1);
        }
    }
    
    // Update game logic
    if (gameState === 'playing') {
        if (player1) player1.update(terrain);
        if (player2) player2.update(terrain);
        
        // Update engine sound based on submarine movement and speed
        const player1Speed = player1 ? Math.sqrt(player1.velocity.x * player1.velocity.x + player1.velocity.y * player1.velocity.y) : 0;
        const player2Speed = player2 ? Math.sqrt(player2.velocity.x * player2.velocity.x + player2.velocity.y * player2.velocity.y) : 0;
        
        const isPlayer1Moving = player1 && (player1Speed > CONFIG.SUBMARINE.STOP_THRESHOLD || player1.isSteering);
        const isPlayer2Moving = player2 && (player2Speed > CONFIG.SUBMARINE.STOP_THRESHOLD || player2.isSteering);
        const isAnySubMoving = isPlayer1Moving || isPlayer2Moving;
        
        // Use the faster submarine's speed for engine sound
        const currentSpeed = Math.max(player1Speed, player2Speed);
        SoundManager.updateEngine(isAnySubMoving, currentSpeed, CONFIG.SUBMARINE.MAX_SPEED);
        
        checkTorpedoHits(torpedoes, [player1, player2], particles);
        checkSubmarineCollision(player1, player2);
        
        if (player1 && !player1.alive) {
            gameState = 'gameover';
            winner = 2;
            createDebris(particles, player1.x, player1.y, CONFIG.PARTICLES.DEBRIS_COUNT);
            SoundManager.playExplosion();
        } else if (player2 && !player2.alive) {
            gameState = 'gameover';
            winner = 1;
            createDebris(particles, player2.x, player2.y, CONFIG.PARTICLES.DEBRIS_COUNT);
            SoundManager.playExplosion();
        }
    }
    
    // Draw submarines
    Renderer.drawSubmarine(scene, player1);
    Renderer.drawSubmarine(scene, player2);
    
    scene.pop();
}

function redrawEntitiesFullBright() {
    push();
    translate(CONFIG.PADDING, CONFIG.PADDING);
    scale(CONFIG.SCALE);
    
    // Submarines
    Renderer.drawSubmarine(this, player1);
    Renderer.drawSubmarine(this, player2);
    
    // Torpedoes
    for (let torpedo of torpedoes) {
        Renderer.drawTorpedo(this, torpedo);
    }
    
    pop();
}

function applyVisibilityMask() {
    if (!player1 || !player2) return;
    
    const sx1 = CONFIG.PADDING + player1.x * CONFIG.SCALE;
    const sy1 = CONFIG.PADDING + player1.y * CONFIG.SCALE;
    const sx2 = CONFIG.PADDING + player2.x * CONFIG.SCALE;
    const sy2 = CONFIG.PADDING + player2.y * CONFIG.SCALE;
    
    const cx1 = sx1 + cos(player1.angle) * CONFIG.VISIBILITY.MASK_FORWARD_OFFSET;
    const cy1 = sy1 + sin(player1.angle) * CONFIG.VISIBILITY.MASK_FORWARD_OFFSET;
    const cx2 = sx2 + cos(player2.angle) * CONFIG.VISIBILITY.MASK_FORWARD_OFFSET;
    const cy2 = sy2 + sin(player2.angle) * CONFIG.VISIBILITY.MASK_FORWARD_OFFSET;
    
    loadPixels();
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const d1sq = Utils.distSq(x, y, cx1, cy1);
            const d2sq = Utils.distSq(x, y, cx2, cy2);
            
            const inRing1 = (d1sq >= CONFIG.VISIBILITY.INNER_RADIUS_SQ) && (d1sq <= CONFIG.VISIBILITY.OUTER_RADIUS_SQ);
            const inRing2 = (d2sq >= CONFIG.VISIBILITY.INNER_RADIUS_SQ) && (d2sq <= CONFIG.VISIBILITY.OUTER_RADIUS_SQ);
            
            if (!inRing1 && !inRing2) {
                const idx = (y * width + x) * 4;
                pixels[idx + 0] *= CONFIG.VISIBILITY.DIM_FACTOR;
                pixels[idx + 1] *= CONFIG.VISIBILITY.DIM_FACTOR;
                pixels[idx + 2] *= CONFIG.VISIBILITY.DIM_FACTOR;
            }
        }
    }
    
    updatePixels();
}

function renderAnnulusPreviews() {
    if (!player1 || !player2 || !mini1 || !mini2) return;
    
    const cx = layoutInfo.arenaRight + CONFIG.ANNULUS_GAP + layoutInfo.miniSize / 2;
    const topCy = layoutInfo.arenaTop + layoutInfo.arenaHeight * CONFIG.DISPLAY.PLAYER1_VERTICAL_POS;
    const bottomCy = layoutInfo.arenaTop + layoutInfo.arenaHeight * CONFIG.DISPLAY.PLAYER2_VERTICAL_POS;
    
    renderAnnulusPreview(mini1, player1, layoutInfo.miniSize, layoutInfo.miniSize);
    image(mini1, cx - layoutInfo.miniSize / 2, topCy - layoutInfo.miniSize / 2);
    
    renderAnnulusPreview(mini2, player2, layoutInfo.miniSize, layoutInfo.miniSize);
    image(mini2, cx - layoutInfo.miniSize / 2, bottomCy - layoutInfo.miniSize / 2);
}

function renderAnnulusPreview(g, sub, miniW, miniH) {
    if (!g || !sub || !terrain) return;
    
    g.clear();
    g.background(...CONFIG.COLORS.BACKGROUND);
    
    const maskCx = CONFIG.PADDING + sub.x * CONFIG.SCALE + cos(sub.angle) * CONFIG.VISIBILITY.MASK_FORWARD_OFFSET;
    const maskCy = CONFIG.PADDING + sub.y * CONFIG.SCALE + sin(sub.angle) * CONFIG.VISIBILITY.MASK_FORWARD_OFFSET;
    
    const subScreenX = CONFIG.PADDING + sub.x * CONFIG.SCALE;
    const subScreenY = CONFIG.PADDING + sub.y * CONFIG.SCALE;
    
    const vecX = subScreenX - maskCx;
    const vecY = subScreenY - maskCy;
    
    const rotationAngle = (PI / 2) - sub.angle + PI;
    const rotated = Utils.rotateVector(vecX, vecY, rotationAngle);
    
    const markerX = miniW / 2 + rotated.x;
    const markerY = miniH / 2 + rotated.y;
    
    g.push();
    g.translate(miniW / 2, miniH / 2);
    g.rotate(rotationAngle);
    g.translate(-maskCx, -maskCy);
    
    g.translate(CONFIG.PADDING, CONFIG.PADDING);
    g.fill(...CONFIG.COLORS.ARENA);
    g.noStroke();
    g.rect(0, 0, CONFIG.MAP_SIZE * CONFIG.SCALE, CONFIG.MAP_SIZE * CONFIG.SCALE);
    
    g.scale(CONFIG.SCALE);
    
    Renderer.drawTerrain(g, terrain);
    Renderer.drawParticles(g, particles);
    
    for (let torpedo of torpedoes) {
        Renderer.drawTorpedo(g, torpedo);
    }
    
    Renderer.drawSubmarine(g, player1);
    Renderer.drawSubmarine(g, player2);
    
    g.pop();
    
    // Apply annulus mask
    g.loadPixels();
    for (let y = 0; y < miniH; y++) {
        for (let x = 0; x < miniW; x++) {
            const d2 = Utils.distSq(x, y, miniW / 2, miniH / 2);
            
            if (d2 < CONFIG.VISIBILITY.INNER_RADIUS_SQ || d2 > CONFIG.VISIBILITY.OUTER_RADIUS_SQ) {
                const idx = (y * miniW + x) * 4;
                g.pixels[idx + 3] = 0;
            }
        }
    }
    g.updatePixels();
    
    Renderer.drawSelfMarker(g, markerX, markerY, sub, 0);
}

function renderLowResRings() {
    if (!player1 || !player2) return;
    
    const miniW = CONFIG.VISIBILITY.OUTER_RADIUS * 2 + CONFIG.DISPLAY.ANNULUS_BORDER;
    const ringSize = CONFIG.LOWRES_RING.OUTER_RADIUS * 2;
    
    // Position: arenaRight + ANNULUS_GAP + miniW + LOWRES_GAP + ringSize/2
    const cx = layoutInfo.arenaRight + CONFIG.ANNULUS_GAP + miniW + CONFIG.LOWRES_GAP + ringSize / 2;
    const topCy = layoutInfo.arenaTop + layoutInfo.arenaHeight * CONFIG.DISPLAY.PLAYER1_VERTICAL_POS;
    const bottomCy = layoutInfo.arenaTop + layoutInfo.arenaHeight * CONFIG.DISPLAY.PLAYER2_VERTICAL_POS;
    
    renderLowResRing(cx, topCy, player1);
    renderLowResRing(cx, bottomCy, player2);
}

function renderLowResRing(cx, cy, sub) {
    if (!sub) return;
    
    const maskCx = CONFIG.PADDING + sub.x * CONFIG.SCALE + cos(sub.angle) * CONFIG.VISIBILITY.MASK_FORWARD_OFFSET;
    const maskCy = CONFIG.PADDING + sub.y * CONFIG.SCALE + sin(sub.angle) * CONFIG.VISIBILITY.MASK_FORWARD_OFFSET;
    
    const subScreenX = CONFIG.PADDING + sub.x * CONFIG.SCALE;
    const subScreenY = CONFIG.PADDING + sub.y * CONFIG.SCALE;
    
    const vecX = subScreenX - maskCx;
    const vecY = subScreenY - maskCy;
    
    const rotationAngle = (PI / 2) - sub.angle + PI;
    const lowresRotation = rotationAngle + (PI / 2);
    
    const rotated = Utils.rotateVector(vecX, vecY, lowresRotation);
    
    // Rotate marker position counter-clockwise by 90 degrees
    const finalRotVecX = rotated.y;
    const finalRotVecY = -rotated.x;
    
    const markerX = cx + finalRotVecX;
    const markerY = cy + finalRotVecY;
    
    // Draw chunks
    for (let i = 0; i < CONFIG.LOWRES_RING.SEGMENTS; i++) {
        const chunkAngle = (i / CONFIG.LOWRES_RING.SEGMENTS) * TWO_PI;
        const chunkColor = sampleAnnulusForChunk(chunkAngle, lowresRotation, maskCx, maskCy);
        drawRingChunk(cx, cy, chunkAngle, chunkColor);
    }
    
    // Draw marker
    push();
    Renderer.drawSelfMarker(this, markerX, markerY, sub, 0);
    pop();
}

function sampleAnnulusForChunk(chunkAngle, rotationAngle, maskCx, maskCy) {
    let hasSubmarine = false;
    let hasTorpedo = false;
    let hasTerrain = false;
    let submarineColor = null;
    
    for (let s = 0; s < CONFIG.LOWRES_RING.SAMPLES; s++) {
        const radius = lerp(CONFIG.VISIBILITY.INNER_RADIUS, CONFIG.VISIBILITY.OUTER_RADIUS, 
                           s / (CONFIG.LOWRES_RING.SAMPLES - 1));
        
        const localX = cos(chunkAngle) * radius;
        const localY = sin(chunkAngle) * radius;
        
        const rotated = Utils.rotateVector(localX, localY, -rotationAngle);
        
        const worldX = maskCx + rotated.x;
        const worldY = maskCy + rotated.y;
        
        const mapX = (worldX - CONFIG.PADDING) / CONFIG.SCALE;
        const mapY = (worldY - CONFIG.PADDING) / CONFIG.SCALE;
        
        // Check submarines
        if (player1 && checkPointNearSubmarine(mapX, mapY, player1)) {
            hasSubmarine = true;
            submarineColor = player1.getColor();
        }
        if (player2 && checkPointNearSubmarine(mapX, mapY, player2)) {
            hasSubmarine = true;
            submarineColor = player2.getColor();
        }
        
        // Check torpedoes
        for (let torpedo of torpedoes) {
            if (torpedo && torpedo.alive && dist(mapX, mapY, torpedo.x, torpedo.y) < CONFIG.COLLISION.TORPEDO_CHECK_RADIUS) {
                hasTorpedo = true;
                break;
            }
        }
        
        // Check terrain
        if (terrain && terrain.isSolid(mapX, mapY)) {
            hasTerrain = true;
        }
    }
    
    if (hasSubmarine && submarineColor) return submarineColor;
    if (hasTorpedo) return color(...CONFIG.COLORS.TORPEDO);
    if (hasTerrain) return color(...CONFIG.COLORS.TERRAIN);
    return color(...CONFIG.COLORS.ARENA);
}

function checkPointNearSubmarine(x, y, sub) {
    if (!sub || !sub.alive) return false;
    return dist(x, y, sub.x, sub.y) < sub.width / 2 + 2;
}

function drawRingChunk(cx, cy, angle, chunkColor) {
    push();
    translate(cx, cy);
    rotate(angle);
    
    const avgRadius = (CONFIG.LOWRES_RING.INNER_RADIUS + CONFIG.LOWRES_RING.OUTER_RADIUS) / 2;
    const radialThickness = CONFIG.LOWRES_RING.OUTER_RADIUS - CONFIG.LOWRES_RING.INNER_RADIUS;
    
    fill(chunkColor);
    noStroke();
    rectMode(CENTER);
    rect(0, -avgRadius, CONFIG.LOWRES_RING.CHUNK_WIDTH, radialThickness - CONFIG.LOWRES_RING.CHUNK_GAP);
    
    pop();
}

function drawGameOverUI() {
    if (!winner) return;
    
    push();
    
    // Semi-transparent overlay
    fill(0, 0, 0, CONFIG.UI.OVERLAY_ALPHA);
    noStroke();
    rect(0, 0, width, height);
    
    // Winner text
    textAlign(CENTER, CENTER);
    textFont(CONFIG.UI.FONT_FAMILY);
    textSize(CONFIG.UI.WINNER_TEXT_SIZE);
    fill(0, 255, 0); // Green text
    
    const winnerText = winner === 1 ? 'player 1 wins!' : 'player 2 wins!';
    text(winnerText, width / 2, height / 2 - 40);
    
    // Restart instruction
    textSize(CONFIG.UI.RESTART_TEXT_SIZE);
    fill(0, 255, 0, 200);
    text('press r to restart', width / 2, height / 2 + 40);
    
    pop();
}
