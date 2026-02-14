// Sound manager for lightweight audio feedback

const SoundManager = {
    // Audio elements
    sounds: {
        ambient: null,
        engine: null,
        torpedo: null,
        explosion: null,
        collision: null
    },
    
    // State tracking
    enginePlaying: false,
    ambientPlaying: false,
    
    // Cooldown tracking for collision sounds per player
    collisionCooldowns: {
        1: 0,
        2: 0
    },
    
    // Volume levels (relative scale)
    volumes: {
        ambient: 0.2,    // Very low
        engine: 0.12,     // Low (slightly reduced from 0.15)
        torpedo: 0.25,    // Medium
        collision: 0.8,  // High (louder, more noticeable)
        explosion: 0.4    // High
    },
    
    // Initialization flag
    initialized: false,
    
    /**
     * Initialize sound manager with placeholder sounds
     * Uses simple oscillators as placeholders until real audio files are added
     */
    init() {
        if (this.initialized) return;
        
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Initialize ambient loop
            this.sounds.ambient = this.createAmbientLoop();
            
            // Initialize engine loop
            this.sounds.engine = this.createEngineLoop();
            
            this.initialized = true;
            console.log('Sound manager initialized');
        } catch (e) {
            console.warn('Sound manager initialization failed:', e);
        }
    },
    
    /**
     * Create ambient ocean loop using oscillator
     */
    createAmbientLoop() {
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = 60; // Low rumble
            gainNode.gain.value = this.volumes.ambient;
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            return {
                oscillator: oscillator,
                gainNode: gainNode,
                playing: false,
                start: function() {
                    if (!this.playing) {
                        this.oscillator.start();
                        this.playing = true;
                    }
                },
                stop: function() {
                    // Can't stop oscillator, just mute it
                    this.gainNode.gain.value = 0;
                }
            };
        } catch (e) {
            console.warn('Failed to create ambient loop:', e);
            return null;
        }
    },
    
    /**
     * Create engine loop - realistic submarine diesel + propeller sound
     * Uses multiple oscillators for rich, mechanical character
     */
    createEngineLoop() {
        try {
            // Main low-frequency diesel rumble (triangle wave for smoothness)
            const mainOsc = this.audioContext.createOscillator();
            mainOsc.type = 'triangle';
            mainOsc.frequency.value = 45; // Deep diesel rumble
            
            // Secondary harmonic for body (sine wave)
            const harmOsc = this.audioContext.createOscillator();
            harmOsc.type = 'sine';
            harmOsc.frequency.value = 90; // Octave above
            
            // Subtle vibrato LFO for propeller wobble
            const lfo = this.audioContext.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 4; // 4 Hz wobble
            
            const lfoGain = this.audioContext.createGain();
            lfoGain.gain.value = 3; // Subtle frequency modulation
            
            lfo.connect(lfoGain);
            lfoGain.connect(mainOsc.frequency);
            
            // Low-pass filter to remove harsh high frequencies
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 300; // Cut off above 300 Hz
            filter.Q.value = 0.5; // Gentle slope
            
            // Mix the oscillators
            const mainGain = this.audioContext.createGain();
            mainGain.gain.value = 0.7; // Main component
            
            const harmGain = this.audioContext.createGain();
            harmGain.gain.value = 0.3; // Subtle harmonic
            
            // Master gain for fade in/out
            const masterGain = this.audioContext.createGain();
            masterGain.gain.value = 0; // Start muted
            
            // Connect signal chain
            mainOsc.connect(mainGain);
            harmOsc.connect(harmGain);
            
            mainGain.connect(filter);
            harmGain.connect(filter);
            filter.connect(masterGain);
            masterGain.connect(this.audioContext.destination);
            
            return {
                mainOsc: mainOsc,
                harmOsc: harmOsc,
                lfo: lfo,
                masterGain: masterGain,
                filter: filter,
                playing: false,
                targetVolume: this.volumes.engine,
                start: function() {
                    if (!this.playing) {
                        this.mainOsc.start();
                        this.harmOsc.start();
                        this.lfo.start();
                        this.playing = true;
                    }
                },
                fadeIn: function() {
                    this.masterGain.gain.linearRampToValueAtTime(
                        this.targetVolume,
                        this.masterGain.context.currentTime + 0.15
                    );
                },
                fadeOut: function() {
                    this.masterGain.gain.linearRampToValueAtTime(
                        0,
                        this.masterGain.context.currentTime + 0.8
                    );
                }
            };
        } catch (e) {
            console.warn('Failed to create engine loop:', e);
            return null;
        }
    },
    
    /**
     * Play a one-shot sound effect
     */
    playOneShot(type, volume, speed) {
        if (!this.initialized || !this.audioContext) return;
        
        try {
            // Configure based on type
            switch(type) {
                case 'torpedo':
                    // Create lighter noise burst for torpedo launch (similar to explosion but longer and softer)
                    const torpBufferSize = this.audioContext.sampleRate * 0.6; // 0.6 seconds (longer than explosion)
                    const torpBuffer = this.audioContext.createBuffer(1, torpBufferSize, this.audioContext.sampleRate);
                    const torpData = torpBuffer.getChannelData(0);
                    
                    // Generate white noise with gradual decay
                    for (let i = 0; i < torpBufferSize; i++) {
                        const progress = i / torpBufferSize;
                        const envelope = (1 - progress) * 0.6; // Lighter (0.6x) amplitude than explosion
                        torpData[i] = (Math.random() * 2 - 1) * envelope;
                    }
                    
                    const torpSource = this.audioContext.createBufferSource();
                    torpSource.buffer = torpBuffer;
                    
                    const torpGain = this.audioContext.createGain();
                    torpGain.gain.value = volume * 0.8; // Slightly reduced volume
                    
                    torpSource.connect(torpGain);
                    torpGain.connect(this.audioContext.destination);
                    torpSource.start();
                    break;
                    
                case 'explosion':
                    // Create noise burst for explosion
                    const bufferSize = this.audioContext.sampleRate * 0.3; // 0.3 seconds
                    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                    const data = buffer.getChannelData(0);
                    
                    for (let i = 0; i < bufferSize; i++) {
                        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
                    }
                    
                    const noiseSource = this.audioContext.createBufferSource();
                    noiseSource.buffer = buffer;
                    
                    const expGain = this.audioContext.createGain();
                    expGain.gain.value = volume;
                    noiseSource.connect(expGain);
                    expGain.connect(this.audioContext.destination);
                    noiseSource.start();
                    break;
                    
                case 'collision':
                    // Create crunchy rock/metal impact sound
                    // Combination of filtered noise + low frequency thump
                    
                    // 1. Low frequency impact (hull thud)
                    const impactOsc = this.audioContext.createOscillator();
                    const impactGain = this.audioContext.createGain();
                    
                    impactOsc.type = 'sine';
                    impactOsc.frequency.value = 60; // Deep thud
                    impactGain.gain.value = volume * 0.6;
                    impactGain.gain.exponentialRampToValueAtTime(
                        0.001,
                        this.audioContext.currentTime + 0.12
                    );
                    
                    impactOsc.connect(impactGain);
                    impactGain.connect(this.audioContext.destination);
                    impactOsc.start();
                    impactOsc.stop(this.audioContext.currentTime + 0.12);
                    
                    // 2. Crunchy scrape (filtered noise)
                    const crunchSize = this.audioContext.sampleRate * 0.08; // Short burst
                    const crunchBuffer = this.audioContext.createBuffer(1, crunchSize, this.audioContext.sampleRate);
                    const crunchData = crunchBuffer.getChannelData(0);
                    
                    // Generate crunchy noise with exponential decay
                    for (let i = 0; i < crunchSize; i++) {
                        const decay = 1 - (i / crunchSize);
                        // Add some crunchiness with bit crushing effect
                        const noise = Math.random() * 2 - 1;
                        const crushed = Math.floor(noise * 4) / 4; // Bit crush for grit
                        crunchData[i] = crushed * decay * decay; // Exponential decay
                    }
                    
                    const crunchSource = this.audioContext.createBufferSource();
                    crunchSource.buffer = crunchBuffer;
                    
                    // Band-pass filter for rocky mid-range character
                    const crunchFilter = this.audioContext.createBiquadFilter();
                    crunchFilter.type = 'bandpass';
                    crunchFilter.frequency.value = 400; // Mid-range rock/metal scrape
                    crunchFilter.Q.value = 2; // Narrow band for character
                    
                    const crunchGain = this.audioContext.createGain();
                    crunchGain.gain.value = volume * 0.4;
                    
                    crunchSource.connect(crunchFilter);
                    crunchFilter.connect(crunchGain);
                    crunchGain.connect(this.audioContext.destination);
                    crunchSource.start();
                    break;
            }
        } catch (e) {
            console.warn('Failed to play one-shot sound:', e);
        }
    },
    
    /**
     * Start ambient ocean loop
     */
    startAmbient() {
        if (!this.initialized || !this.sounds.ambient) return;
        
        if (!this.ambientPlaying) {
            this.sounds.ambient.start();
            this.sounds.ambient.gainNode.gain.value = this.volumes.ambient;
            this.ambientPlaying = true;
        }
    },
    
    /**
     * Stop ambient loop
     */
    stopAmbient() {
        if (!this.initialized || !this.sounds.ambient) return;
        
        if (this.ambientPlaying) {
            this.sounds.ambient.stop();
            this.ambientPlaying = false;
        }
    },
    
    /**
     * Update engine sound based on movement state and speed
     * @param {boolean} isAnySubMoving - Whether any submarine is moving
     * @param {number} currentSpeed - Current speed (0 to maxSpeed)
     * @param {number} maxSpeed - Maximum possible speed
     */
    updateEngine(isAnySubMoving, currentSpeed, maxSpeed) {
        if (!this.initialized || !this.sounds.engine) return;
        
        // Start oscillator if needed
        if (!this.sounds.engine.playing) {
            this.sounds.engine.start();
        }
        
        // Calculate speed ratio (0 to 1)
        const speedRatio = maxSpeed > 0 ? Math.min(currentSpeed / maxSpeed, 1) : 0;
        
        // Fade in/out based on movement
        if (isAnySubMoving && !this.enginePlaying) {
            this.sounds.engine.fadeIn();
            this.enginePlaying = true;
        } else if (!isAnySubMoving && this.enginePlaying) {
            this.sounds.engine.fadeOut();
            this.enginePlaying = false;
        }
        
        // Modulate volume and pitch based on speed when playing
        if (this.enginePlaying && this.sounds.engine.masterGain) {
            // Volume scaling: 70% at idle to 100% at max speed (subtle)
            const volumeScale = 0.7 + (speedRatio * 0.3);
            const targetVolume = this.volumes.engine * volumeScale;
            
            // Smooth volume transition
            this.sounds.engine.masterGain.gain.linearRampToValueAtTime(
                targetVolume,
                this.sounds.engine.masterGain.context.currentTime + 0.1
            );
            
            // Pitch modulation: slightly higher frequency at higher speeds (very subtle)
            // Main oscillator: 45 Hz base, up to 50 Hz at max speed
            const pitchScale = 1.0 + (speedRatio * 0.11); // 11% increase at max
            if (this.sounds.engine.mainOsc && this.sounds.engine.mainOsc.frequency) {
                this.sounds.engine.mainOsc.frequency.linearRampToValueAtTime(
                    45 * pitchScale,
                    this.sounds.engine.mainOsc.context.currentTime + 0.1
                );
            }
            
            // Harmonic oscillator scales proportionally
            if (this.sounds.engine.harmOsc && this.sounds.engine.harmOsc.frequency) {
                this.sounds.engine.harmOsc.frequency.linearRampToValueAtTime(
                    90 * pitchScale,
                    this.sounds.engine.harmOsc.context.currentTime + 0.1
                );
            }
        }
    },
    
    /**
     * Play torpedo launch sound
     */
    playTorpedoLaunch() {
        this.playOneShot('torpedo', this.volumes.torpedo, 0);
    },
    
    /**
     * Play explosion sound
     */
    playExplosion() {
        this.playOneShot('explosion', this.volumes.explosion, 0);
    },
    
    /**
     * Play collision sound with cooldown
     */
    playCollision(playerNumber, speed) {
        const now = Date.now();
        
        // Check cooldown (200ms)
        if (now - this.collisionCooldowns[playerNumber] < 200) {
            return;
        }
        
        this.collisionCooldowns[playerNumber] = now;
        this.playOneShot('collision', this.volumes.collision, speed || 0);
    },
    
    /**
     * Resume audio context (for browser autoplay policies)
     * Should be called on first user interaction
     */
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
};
