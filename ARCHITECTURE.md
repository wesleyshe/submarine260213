# Submarine Game Architecture

## Overview

The submarine game is now organized into clear, modular components with single responsibilities.

## File Structure

```
submarine260213/
├── index.html           # Entry point (loads scripts in order)
├── config.js            # All game constants and configuration
├── utils.js             # Common utilities (math, validation)
├── debug.js             # Debug overlay and FPS counter
├── renderer.js          # Centralized drawing functions
├── sketch.js            # Main game loop (p5.js)
├── submarine.js         # Submarine entity class
├── torpedo.js           # Torpedo entity class
├── terrain.js           # Terrain generation algorithm
├── collision.js         # Collision detection logic
├── particles.js         # Particle system
├── README.md            # Original readme
├── CONFIG_GUIDE.md      # Configuration customization guide
└── REFACTOR_REPORT.md   # This refactoring summary
```

## Module Dependencies

```
index.html
    ↓
config.js (foundation - loaded first)
    ↓
utils.js (utilities - depends on config)
    ↓
debug.js (debug system)
renderer.js (drawing functions)
    ↓
terrain.js   submarine.js   torpedo.js   particles.js   collision.js
    ↓               ↓             ↓             ↓              ↓
    └───────────────┴─────────────┴─────────────┴──────────────┘
                                ↓
                            sketch.js (orchestrates everything)
```

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                       sketch.js                         │
│  - Game loop coordination                               │
│  - Input handling                                       │
│  - State management                                     │
└─────────┬───────────────────────────────────────────────┘
          │
          ├──→ handleInput() ──→ player1/player2.accelerate/turn/brake/fire()
          │
          ├──→ renderScene() ──→ Renderer.drawSubmarine/Torpedo/Terrain/Particles()
          │
          ├──→ update() ──→ submarine.update(terrain)
          │              └→ torpedo.update(terrain)
          │
          ├──→ checkTorpedoHits() ──→ collision.js
          │
          ├──→ checkSubmarineCollision() ──→ collision.js
          │
          ├──→ applyVisibilityMask() ──→ pixel manipulation
          │
          └──→ Debug.draw() ──→ FPS and state overlay
```

## Component Responsibilities

### config.js
**Purpose:** Single source of truth for all game parameters  
**Exports:** `CONFIG` object  
**Dependencies:** None  
**Used by:** All modules

```javascript
CONFIG = {
    MAP_SIZE, SCALE, PADDING,
    VISIBILITY: {...},
    SUBMARINE: {...},
    TORPEDO: {...},
    TERRAIN: {...},
    PARTICLES: {...},
    COLLISION: {...},
    CONTROLS: {...},
    COLORS: {...},
    DEBUG: {...}
}
```

### utils.js
**Purpose:** Common utility functions  
**Exports:** `Utils` object  
**Dependencies:** `CONFIG`  
**Used by:** All game logic modules

```javascript
Utils = {
    rotateVector(x, y, angle),
    clamp(value, min, max),
    isValidNumber(value),
    sanitizeNumber(value, fallback),
    distSq(x1, y1, x2, y2),
    inBounds(x, y, minX, minY, maxX, maxY),
    safeArrayAccess(array, row, col, default),
    clampDeltaTime(dt)
}
```

### debug.js
**Purpose:** Debug overlay and diagnostics  
**Exports:** `Debug` object  
**Dependencies:** `CONFIG`  
**Used by:** `sketch.js`

```javascript
Debug = {
    init(),
    update(),
    draw(x, y),
    toggleDebug()
}
```

### renderer.js
**Purpose:** Centralized drawing functions  
**Exports:** `Renderer` object  
**Dependencies:** `CONFIG`  
**Used by:** `sketch.js`

```javascript
Renderer = {
    drawSubmarine(buffer, sub),
    drawTorpedo(buffer, torpedo),
    drawTerrain(buffer, terrain),
    drawParticles(buffer, particles),
    drawSelfMarker(buffer, x, y, sub, rotation)
}
```

### terrain.js
**Purpose:** Terrain generation and collision  
**Exports:** `Terrain` class  
**Dependencies:** `CONFIG`, `Utils`  
**Used by:** `sketch.js`, `submarine.js`, `torpedo.js`

```javascript
class Terrain {
    constructor(mapSize)
    generate()
    generateInteriorBlobs(gridSize)
    growInteriorBlob(seedX, seedY, maxSize, gridSize)
    smooth()
    isSolid(x, y)
    isAreaClear(x, y, radius)
    findSafeSpawn(preferredX, preferredY, otherSpawn, mapSize)
}
```

### submarine.js
**Purpose:** Submarine entity logic  
**Exports:** `Submarine` class  
**Dependencies:** `CONFIG`, `Utils`, `Torpedo`  
**Used by:** `sketch.js`

```javascript
class Submarine {
    constructor(x, y, playerNumber)
    update(terrain)
    getColor()
    checkCollisionAt(testX, testY, terrain)
    getSubmarinePixels(cx, cy)
    accelerate(direction)
    brake()
    turn(direction)
    fireTorpedo()
    kill()
    getBounds()
}
```

### torpedo.js
**Purpose:** Torpedo entity logic  
**Exports:** `Torpedo` class  
**Dependencies:** `CONFIG`, `Utils`  
**Used by:** `sketch.js`, `submarine.js`

```javascript
class Torpedo {
    constructor(x, y, angle, owner)
    update(terrain, mapSize)
    explode()
    checkHit(submarine)
}
```

### collision.js
**Purpose:** Collision detection  
**Exports:** Functions  
**Dependencies:** `CONFIG`  
**Used by:** `sketch.js`

```javascript
checkTorpedoHits(torpedoes, submarines, particles)
checkSubmarineCollision(sub1, sub2)
```

### particles.js
**Purpose:** Particle effects  
**Exports:** `Particle` class + functions  
**Dependencies:** `CONFIG`  
**Used by:** `sketch.js`, `collision.js`

```javascript
class Particle {
    constructor(x, y, vx, vy, lifespan, col)
    update()
    isDead()
}

createExplosion(particles, x, y, count)
createDebris(particles, x, y, count)
```

### sketch.js
**Purpose:** Game loop orchestration  
**Exports:** None (p5.js functions)  
**Dependencies:** All modules  
**Used by:** p5.js runtime

```javascript
// p5.js lifecycle
setup()
draw()
keyPressed()

// Game logic
initGame()
handleInput()
renderScene()
redrawEntitiesFullBright()
applyVisibilityMask()
renderAnnulusPreviews()
renderLowResRings()

// Helper functions
renderAnnulusPreview(g, sub, miniW, miniH)
renderLowResRing(cx, cy, sub)
sampleAnnulusForChunk(...)
checkPointNearSubmarine(x, y, sub)
drawRingChunk(cx, cy, angle, chunkColor)
```

## Key Design Patterns

### Singleton Pattern
- `CONFIG`: Global configuration object
- `Utils`: Global utility functions
- `Debug`: Global debug system
- `Renderer`: Global rendering functions

### Entity-Component Pattern (Light)
- `Submarine`: Entity with movement, rendering, collision
- `Torpedo`: Entity with movement, lifetime, collision
- `Particle`: Entity with movement, lifetime, rendering

### Strategy Pattern
- Terrain generation uses different strategies (edge growth, blob growth, smoothing)
- Collision detection uses different strategies (terrain, submarine, torpedo)

### Observer Pattern (Implicit)
- Debug mode observes game state
- Visibility mask observes submarine positions

## State Management

```
Global State (in sketch.js):
├── terrain: Terrain
├── player1: Submarine
├── player2: Submarine
├── torpedoes: Torpedo[]
├── particles: Particle[]
├── gameState: 'playing' | 'gameover'
├── winner: null | 1 | 2
└── graphics buffers: scene, mini1, mini2
```

## Performance Considerations

### Optimizations Applied:
- Pre-computed squared radii (avoid sqrt in hot loop)
- Single rendering pass per entity type
- Eliminated duplicate rotation calculations
- Proper particle cleanup
- Safe bounds checking (fail fast)
- Delta time clamping (prevent spikes)

### Hot Paths (optimize carefully):
- `applyVisibilityMask()`: O(width × height) pixel loop
- `submarine.getSubmarinePixels()`: Called every collision check
- `terrain.isSolid()`: Called for every torpedo and submarine pixel
- `renderAnnulusPreview()`: Full scene render × 2 per frame

## Extension Points

### Adding New Entities:
1. Create class in new file (e.g., `mine.js`)
2. Add to `index.html` script list
3. Add to game state in `sketch.js`
4. Add update/render calls in `draw()`
5. Add configuration to `config.js`

### Adding New Features:
1. Add configuration to `config.js`
2. Add utility functions to `utils.js` if needed
3. Add rendering function to `renderer.js` if needed
4. Implement logic in appropriate module
5. Wire up in `sketch.js`

### Modifying Terrain:
- Edit `TERRAIN` section in `config.js`
- Modify generation algorithm in `terrain.js`
- No changes needed elsewhere

### Changing Controls:
- Edit `CONTROLS` section in `config.js`
- Modify `handleInput()` in `sketch.js`
- No changes needed in entity classes

## Testing Strategy

### Manual Testing:
1. Load `index.html` in browser
2. Press 'd' to enable debug mode
3. Follow smoke test checklist in `REFACTOR_REPORT.md`
4. Check browser console for errors/warnings

### Automated Testing (Future):
- Unit tests for `Utils` functions
- Integration tests for collision detection
- Snapshot tests for terrain generation
- Performance benchmarks for hot paths

## Common Pitfalls

### ❌ Don't:
- Add magic numbers directly in code
- Duplicate drawing logic
- Modify state without null checks
- Use inline rotation math
- Access arrays without bounds checking

### ✅ Do:
- Add constants to `config.js`
- Use `Renderer` for drawing
- Use `Utils.sanitizeNumber()` for safety
- Use `Utils.rotateVector()` for rotation
- Use `Utils.safeArrayAccess()` for arrays

## Maintenance Notes

### When CONFIG changes:
- No code changes needed (usually)
- Test affected features
- Update `CONFIG_GUIDE.md` if adding new sections

### When adding features:
- Keep single responsibility principle
- Add to appropriate module
- Update this document
- Add to smoke test checklist

### When fixing bugs:
- Add safeguards (null checks, bounds checks)
- Add debug logging if helpful
- Update `REFACTOR_REPORT.md`
- Consider if CONFIG should control behavior
