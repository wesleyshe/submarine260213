# Configuration & Customization Guide

## Quick Start

All game parameters are now centralized in `config.js`. To customize the game, edit values in the `CONFIG` object.

## Common Tweaks

### Submarine Speed
```javascript
SUBMARINE: {
    MAX_SPEED: 0.375,        // Maximum forward speed
    ACCELERATION: 0.0125,    // How fast speed builds up
    TURN_SPEED: 0.0125,      // Rotation speed
    FRICTION: 0.98,          // Momentum decay (higher = more slippery)
    BRAKE_FACTOR: 0.92       // Braking effectiveness
}
```

### Torpedo Properties
```javascript
TORPEDO: {
    SPEED: 1.5,              // Torpedo speed (relative to max sub speed)
    LIFETIME: 200,           // Frames before despawn (60 fps ≈ 3.3 seconds)
    COOLDOWN: 30             // Frames between shots (60 fps = 0.5 seconds)
}
```

### Visibility Rings
```javascript
VISIBILITY: {
    INNER_RADIUS: 100,       // Inner edge of visible ring
    OUTER_RADIUS: 125,       // Outer edge of visible ring
    MASK_FORWARD_OFFSET: 40, // How far ahead of sub to center the ring
    DIM_FACTOR: 0.1          // Brightness outside rings (0.1 = 10%)
}
```

### Terrain Generation
```javascript
TERRAIN: {
    PIXEL_SIZE: 2,                    // Size of each terrain block
    EDGE_GROWTH_DEPTH: 0.25,         // How far inward edges grow (0-1)
    GROWTH_PROBABILITY: 0.35,        // Density of edge terrain
    MIN_BLOBS: 3,                    // Minimum interior obstacles
    MAX_BLOBS: 8,                    // Maximum interior obstacles
    BLOB_MIN_SIZE: 40,               // Smallest obstacle size
    BLOB_MAX_SIZE: 80                // Largest obstacle size
}
```

### Particle Effects
```javascript
PARTICLES: {
    EXPLOSION_COUNT: 15,             // Particles per explosion
    DEBRIS_COUNT: 30,                // Particles on submarine death
    EXPLOSION_SPEED_MIN: 0.5,        // Minimum particle speed
    EXPLOSION_SPEED_MAX: 2,          // Maximum particle speed
    EXPLOSION_LIFE_MIN: 20,          // Minimum lifetime (frames)
    EXPLOSION_LIFE_MAX: 40,          // Maximum lifetime (frames)
    FRICTION: 0.95                   // Particle slowdown
}
```

### Debug Mode
```javascript
DEBUG: {
    ENABLED: false,                  // Toggle with 'd' key
    SHOW_FPS: true,                  // Display FPS counter
    SHOW_STATE: true,                // Display game state info
    LOG_COLLISIONS: false,           // Log collisions to console
    LOG_SPAWN: false,                // Log spawn attempts to console
    MAX_DELTA_TIME: 100              // Cap frame delta (ms) to prevent spikes
}
```

### Colors
```javascript
COLORS: {
    BACKGROUND: [0, 255, 0],         // Green
    ARENA: [0, 0, 0],                // Black
    TERRAIN: [0, 255, 0],            // Green
    TORPEDO: [255, 0, 0],            // Red
    SUBMARINE_IDLE: [0, 255, 0],     // Green (stopped)
    SUBMARINE_MOVING: [255, 0, 0]    // Red (moving)
}
```

## Game Modes

### Fast & Furious
```javascript
SUBMARINE.MAX_SPEED = 0.75;          // 2x faster
SUBMARINE.ACCELERATION = 0.025;      // 2x faster acceleration
SUBMARINE.TURN_SPEED = 0.025;        // 2x faster turning
TORPEDO.SPEED = 3.0;                 // 2x faster torpedoes
TORPEDO.COOLDOWN = 15;               // 2x faster firing
```

### Stealth Mode
```javascript
VISIBILITY.INNER_RADIUS = 75;        // Smaller visibility
VISIBILITY.OUTER_RADIUS = 100;
SUBMARINE.MAX_SPEED = 0.25;          // Slower movement
TORPEDO.LIFETIME = 300;              // Longer range torpedoes
```

### Maze Mode
```javascript
TERRAIN.MIN_BLOBS = 10;              // More obstacles
TERRAIN.MAX_BLOBS = 20;
TERRAIN.BLOB_MIN_SIZE = 60;          // Larger obstacles
TERRAIN.BLOB_MAX_SIZE = 120;
TERRAIN.EDGE_GROWTH_DEPTH = 0.4;     // Edges grow farther
```

### Particle Spam
```javascript
PARTICLES.EXPLOSION_COUNT = 50;      // More particles
PARTICLES.DEBRIS_COUNT = 100;
PARTICLES.FRICTION = 0.99;           // Slower decay
PARTICLES.EXPLOSION_LIFE_MAX = 80;   // Longer life
```

## Key Bindings

Currently hardcoded in `CONFIG.CONTROLS`:

```javascript
CONTROLS: {
    PLAYER1: {
        FORWARD: 87,         // W
        BRAKE: 83,           // S
        LEFT: 65,            // A
        RIGHT: 68,           // D
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
}
```

## Tips

1. **Balance**: If you change submarine speed, adjust torpedo speed proportionally
2. **Visibility**: Larger rings = easier to see but less stealth gameplay
3. **Terrain**: More/bigger obstacles = more strategic but slower gameplay
4. **Cooldown**: Lower cooldown = more spam but less aim skill required
5. **Particles**: More particles = prettier but slower performance

## Performance Tuning

If the game is slow:
```javascript
PARTICLES.EXPLOSION_COUNT = 5;       // Fewer particles
PARTICLES.DEBRIS_COUNT = 10;
TERRAIN.PIXEL_SIZE = 4;              // Larger blocks (less detail)
LOWRES_RING.SEGMENTS = 25;           // Fewer ring segments
LOWRES_RING.SAMPLES = 2;             // Fewer samples per segment
```

## Advanced: Adding New Config Sections

To add new configuration:

1. Add to `config.js`:
```javascript
MY_NEW_FEATURE: {
    PARAM1: 10,
    PARAM2: 'value'
}
```

2. Access anywhere:
```javascript
const x = CONFIG.MY_NEW_FEATURE.PARAM1;
```

3. Pre-compute expensive values:
```javascript
CONFIG.MY_NEW_FEATURE.COMPUTED = CONFIG.MY_NEW_FEATURE.PARAM1 * 2;
```

## Debugging

Enable debug mode to see:
- Real-time FPS
- Game state
- Player positions
- Entity counts

Toggle with **'d'** key or set `CONFIG.DEBUG.ENABLED = true` in config.js.

Enable detailed logging:
```javascript
DEBUG: {
    ENABLED: true,
    LOG_COLLISIONS: true,    // See every collision
    LOG_SPAWN: true          // See spawn attempts
}
```

Check browser console (F12) for warnings and errors.
