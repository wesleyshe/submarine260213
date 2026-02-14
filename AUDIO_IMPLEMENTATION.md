# Audio Implementation

## Overview

Lightweight audio feedback system using Web Audio API with procedurally generated sounds. No external audio files required.

## Sound Categories

### 1. Ambient Ocean Loop
- **Type**: Continuous loop (60 Hz sine wave)
- **Volume**: Very low (0.05)
- **Behavior**: 
  - Starts when gameState === 'playing'
  - Stops when gameState === 'gameover'
  - Subtle background presence

### 2. Engine Sound - REDESIGNED ✨
- **Type**: Multi-oscillator loop (diesel rumble + propeller)
- **Components**:
  - Main: 45 Hz triangle wave (deep diesel rumble)
  - Harmonic: 90 Hz sine wave (body/richness)
  - LFO: 4 Hz wobble on main frequency (propeller churn)
  - Low-pass filter at 300 Hz (removes harsh highs)
- **Volume**: Low (0.12 base) - **scales with speed** ✨
  - Idle/slow: 70% of base volume
  - Max speed: 100% of base volume
- **Pitch**: **Scales with speed** ✨
  - Idle: 45 Hz / 90 Hz (main/harmonic)
  - Max speed: 50 Hz / 100 Hz (~11% increase)
- **Character**: Smooth, weighty, mechanical underwater propulsion
- **Behavior**:
  - Plays only when at least one submarine is moving or steering
  - Smooth fade in (0.15s) / gentle fade out (0.8s)
  - **Dynamic modulation**: Volume and pitch increase with speed
  - Uses faster submarine's speed when both are moving
  - Checks: velocity > STOP_THRESHOLD or isSteering flag
  - Silent when both submarines idle

### 3. Torpedo Launch
- **Type**: One-shot (200 Hz square wave, 0.15s)
- **Volume**: Medium (0.25)
- **Trigger**: Immediately when torpedo is created (keyPressed X or M)
- **Multiple launches**: Can overlap

### 4. Explosion
- **Type**: One-shot (white noise burst, 0.3s decay)
- **Volume**: High (0.4)
- **Trigger**: When submarine.alive becomes false
- **Continues into game over screen**

### 5. Collision Sound - REDESIGNED ✨
- **Type**: One-shot composite (impact + crunch)
- **Components**:
  - Low-frequency impact: 60 Hz sine wave (hull thud, 0.12s)
  - Crunchy scrape: Filtered noise with bit-crushing (rocky texture)
  - Band-pass filter at 400 Hz for mid-range character
- **Volume**: High (0.5) ✨
- **Character**: Rocky, crunchy, physical hull scrape - LOUD and satisfying
- **Trigger**: 
  - Terrain collision (submarine.update)
  - Map boundary collision
  - Submarine-to-submarine collision (collision.js)
- **Cooldown**: 200ms per player to prevent spam

## Architecture

### SoundManager Module (`soundManager.js`)
Centralized audio control with:
- Named handles for each sound type
- Volume configuration in one place
- Cooldown tracking for collision sounds
- Browser autoplay policy handling (resume on first interaction)
- Procedurally generated sounds (no asset loading needed)

### Integration Points

**setup()** - Initialize sound manager
```javascript
SoundManager.init();
```

**keyPressed()** - Resume audio context + torpedo sounds
```javascript
SoundManager.resume();
SoundManager.playTorpedoLaunch();
```

**draw()** - Ambient control
```javascript
if (gameState === 'playing') SoundManager.startAmbient();
else SoundManager.stopAmbient();
```

**renderScene()** - Engine sound + explosion
```javascript
// Calculate movement state
const isAnySubMoving = isPlayer1Moving || isPlayer2Moving;
SoundManager.updateEngine(isAnySubMoving);

// On death
SoundManager.playExplosion();
```

**submarine.update()** - Collision sounds
```javascript
// On terrain/boundary collision
if (speed > CONFIG.SUBMARINE.STOP_THRESHOLD) {
    SoundManager.playCollision(this.playerNumber);
}
```

**checkSubmarineCollision()** - Sub-to-sub collision
```javascript
SoundManager.playCollision(sub1.playerNumber);
SoundManager.playCollision(sub2.playerNumber);
```

## Performance Safeguards

1. **No asset loading** - All sounds procedurally generated
2. **Oscillator reuse** - Ambient and engine use persistent oscillators
3. **One-shot cleanup** - Short sounds auto-stop
4. **Cooldown system** - Prevents collision sound spam (200ms/player)
5. **No frame-by-frame audio creation** - Engine uses fade in/out, not restart
6. **Browser compatibility** - Handles suspended audio context

## Volume Balance

Relative scale (all modest volumes):
- Ambient: 0.1 (low, felt more than heard)
- Engine: 0.12 (low, smooth diesel rumble - no buzzing)
- Torpedo: 0.25 (medium, clear cue)
- Collision: 0.5 (high, loud and crunchy)
- Explosion: 0.4 (high, dramatic impact)

**Mix hierarchy**: Ambient < Engine < Torpedo < Explosion < Collision

## Testing Checklist

- [x] Ambient loop present during gameplay
- [x] Engine sound only when submarines move/steer
- [x] **Engine sounds like diesel/propeller, NOT buzzy** ✨
- [x] Torpedo launch produces sound on X/M press
- [x] Explosion plays on submarine death
- [x] **Collision sounds rocky/crunchy, NOT thin** ✨
- [x] Collision thud on terrain impact (with cooldown)
- [x] Collision thud on submarine-submarine collision
- [x] No audio distortion or overlap chaos
- [x] No performance impact
- [x] Sounds fit minimalist aesthetic
- [x] **Nothing piercing or annoying in repeated play** ✨

## Sound Design Details

### Engine Rumble Design
The engine uses a sophisticated multi-oscillator approach with **dynamic speed modulation**:

**Static Components:**
1. **Main oscillator** (45 Hz triangle): Provides the deep, smooth diesel base
2. **Harmonic oscillator** (90 Hz sine): Adds body and richness at the octave
3. **LFO modulation** (4 Hz): Creates subtle propeller wobble/vibration
4. **Low-pass filter** (300 Hz cutoff): Removes harsh high frequencies that caused the "buzzy" character

**Dynamic Modulation (Speed-Based):** ✨
- **Volume scaling**: 70% at idle → 100% at max speed
  - Subtle increase makes faster movement feel more powerful
  - Smooth transitions prevent jarring changes
- **Pitch scaling**: 45/90 Hz at idle → 50/100 Hz at max speed
  - ~11% frequency increase at top speed
  - Creates sense of engine working harder
  - Still restrained and not exaggerated

**Result:** A weighty, mechanical underwater propulsion sound that dynamically responds to speed, making acceleration and deceleration feel alive and connected to the submarine's physics.

### Collision Crunch Design
The collision uses a two-layer approach:
1. **Impact layer** (60 Hz sine): Deep hull thud for the initial contact
2. **Crunch layer** (filtered noise): 
   - Bit-crushed noise for gritty texture
   - Band-pass filter at 400 Hz for rocky mid-range
   - Short exponential decay for punchy impact

This creates a physical rock/metal scrape sensation that's satisfying without being cartoony.

## Future Enhancements (Optional)

If you want to replace procedural sounds with audio files:
1. Add sound files to `assets/sounds/` folder
2. Modify `SoundManager.init()` to load audio files
3. Replace oscillator/noise creation with HTMLAudioElement or AudioBufferSourceNode
4. Keep the same API (playTorpedoLaunch, playExplosion, etc.)
