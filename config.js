// Centralized game configuration

const CONFIG = {
    // Map and display
    MAP_SIZE: 150,
    SCALE: 4, // Display scale multiplier
    PADDING: 70, // Border padding around arena
    ANNULUS_GAP: 150, // Gap between arena right edge and annulus displays
    LOWRES_GAP: 60, // Gap between annulus displays and low-res displays
    
    // UI and text
    UI: {
        FONT_FAMILY: 'Consolas, Monaco, "Courier New", monospace', // Terminal-like fonts
        WINNER_TEXT_SIZE: 48,
        RESTART_TEXT_SIZE: 24,
        OVERLAY_ALPHA: 180 // Semi-transparent overlay darkness
    },    
    // Visibility rings
    VISIBILITY: {
        INNER_RADIUS: 100,
        OUTER_RADIUS: 125,
        MASK_FORWARD_OFFSET: 40, // How far ahead of submarine to center the ring
        DIM_FACTOR: 0.1 // Brightness multiplier for non-visible areas
    },
    
    // Low-res ring display
    LOWRES_RING: {
        SEGMENTS: 50, // Number of chunks around the circle
        INNER_RADIUS: 100,
        OUTER_RADIUS: 125,
        CHUNK_WIDTH: 12, // Visual width of each chunk (pixels)
        CHUNK_GAP: 1, // Gap between chunks (pixels)
        SAMPLES: 3, // Number of radial samples per chunk
        COLUMN_SPACING: 60 // Horizontal spacing between display columns
    },
    
    // Submarine properties
    SUBMARINE: {
        WIDTH: 8,
        HEIGHT: 4,
        MAX_SPEED: 0.375,
        ACCELERATION: 0.0125,
        TURN_SPEED: 0.0125,
        FRICTION: 0.98,
        BRAKE_FACTOR: 0.92,
        STOP_THRESHOLD: 0.05, // Speed threshold for considering stopped
        HOLD_RED_SECONDS: 0.5, // Stay red for this long after stopping
        FADE_SECONDS: 1.5, // Fade from red to green over this duration
        COLLISION_RADIUS: 5, // Approximate radius for bounds checking
        SPAWN_CLEAR_RADIUS: 15,
        MIN_SPAWN_DISTANCE: 80,
        NOSE_LENGTH: 4, // Extended nose indicator
        TOWER_WIDTH: 2,
        TOWER_HEIGHT: 2
    },
    
    // Torpedo properties
    TORPEDO: {
        SPEED: 1.5,
        RADIUS: 2,
        DAMAGE: 35, // Currently unused (one-hit kill)
        LIFETIME: 200, // Frames before despawn
        COOLDOWN: 30, // Frames between shots
        SPAWN_DISTANCE: 8, // Distance in front of submarine
        WIDTH: 4,
        HEIGHT: 2,
        TRAIL_WIDTH: 2,
        TRAIL_HEIGHT: 1,
        TRAIL_OFFSET: -2
    },
    
    // Terrain generation
    TERRAIN: {
        PIXEL_SIZE: 2,
        TARGET_DENSITY: 0.1, // 15% coverage
        EDGE_GROWTH_DEPTH: 0.25, // How far terrain extends from edges (fraction of grid)
        GROWTH_PROBABILITY: 0.25,
        MIN_BLOBS: 3,
        MAX_BLOBS: 6,
        BLOB_MIN_SIZE: 40,
        BLOB_MAX_SIZE: 80,
        BLOB_EDGE_MARGIN: 25, // Pixels from edge
        BLOB_CLEAR_RADIUS: 3, // Grid cells that must be clear around seed
        BLOB_GROWTH_PROBABILITY: 0.6,
        SMOOTH_PASSES: 2,
        SMOOTH_SURVIVE_THRESHOLD: 3, // Neighbors needed for cell to survive
        SMOOTH_BIRTH_THRESHOLD: 5 // Neighbors needed for cell to be born
    },
    
    // Particle effects
    PARTICLES: {
        EXPLOSION_COUNT: 15,
        DEBRIS_COUNT: 30,
        MIN_SIZE: 1,
        MAX_SIZE: 3,
        EXPLOSION_SPEED_MIN: 0.5,
        EXPLOSION_SPEED_MAX: 2,
        EXPLOSION_LIFE_MIN: 20,
        EXPLOSION_LIFE_MAX: 40,
        DEBRIS_SPEED_MIN: 0.2,
        DEBRIS_SPEED_MAX: 1.5,
        DEBRIS_LIFE_MIN: 30,
        DEBRIS_LIFE_MAX: 60,
        FRICTION: 0.95
    },
    
    // Collision detection
    COLLISION: {
        PUSH_FACTOR: 0.5, // How much to push submarines apart
        BOUNCE_DAMPING: 0.5, // Velocity reduction on collision
        TORPEDO_CHECK_RADIUS: 3 // Radius for chunk sampling torpedo detection
    },
    
    // Controls
    CONTROLS: {
        PLAYER1: {
            FORWARD: 87, // W
            BRAKE: 83, // S
            LEFT: 65, // A
            RIGHT: 68, // D
            FIRE_KEY: 'x'
        },
        PLAYER2: {
            FORWARD: 'UP_ARROW',
            BRAKE: 'DOWN_ARROW',
            LEFT: 'LEFT_ARROW',
            RIGHT: 'RIGHT_ARROW',
            FIRE_KEY: 'm'
        },
        RESTART_KEY: 'r'
    },
    
    // Colors
    COLORS: {
        BACKGROUND: [0, 255, 0], // Green
        ARENA: [0, 0, 0], // Black
        TERRAIN: [0, 255, 0], // Green
        TORPEDO: [255, 0, 0], // Red
        TORPEDO_TRAIL_ALPHA: 100,
        PARTICLE: [0, 255, 0], // Green
        SUBMARINE_IDLE: [0, 255, 0], // Green
        SUBMARINE_MOVING: [255, 0, 0] // Red
    }
};

// Computed values (to avoid repeated calculations)
CONFIG.VISIBILITY.INNER_RADIUS_SQ = CONFIG.VISIBILITY.INNER_RADIUS * CONFIG.VISIBILITY.INNER_RADIUS;
CONFIG.VISIBILITY.OUTER_RADIUS_SQ = CONFIG.VISIBILITY.OUTER_RADIUS * CONFIG.VISIBILITY.OUTER_RADIUS;

// Internal settings (not for customization)
CONFIG.MAX_DELTA_TIME = 100; // Cap delta time to prevent huge spikes (ms)
