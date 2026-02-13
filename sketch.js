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

function setup() {
    // Add padding for green border
    const PADDING = 40;
    const canvas = createCanvas(MAP_SIZE * SCALE + PADDING * 2, MAP_SIZE * SCALE + PADDING * 2);
    canvas.parent('game-container');
    
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
    if (keyIsDown(83)) { // S
        player1.accelerate(-1);
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
    if (keyIsDown(DOWN_ARROW)) {
        player2.accelerate(-1);
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
    // Green background (surrounding terrain)
    background(0, 255, 0);
    
    keyIsDownHandler(); // Check for held keys
    
    const PADDING = 40;
    
    // Draw black arena in the center
    push();
    translate(PADDING, PADDING);
    fill(0);
    noStroke();
    rect(0, 0, MAP_SIZE * SCALE, MAP_SIZE * SCALE);
    
    // Scale and draw game elements
    scale(SCALE);
    
    terrain.draw();
    updateAndDrawParticles(particles);
    
    for (let i = torpedoes.length - 1; i >= 0; i--) {
        const torpedo = torpedoes[i];
        torpedo.update(terrain, MAP_SIZE);
        torpedo.draw();
        
        if (!torpedo.alive) {
            torpedoes.splice(i, 1);
        }
    }
    
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
    
    player1.draw();
    player2.draw();
    
    pop();
}
