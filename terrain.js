// Terrain generation and management

class Terrain {
    constructor(mapSize) {
        this.mapSize = mapSize;
        this.grid = [];
        this.pixelSize = 2; // Size of each terrain pixel
        this.targetDensity = 0.15; // 15% coverage
        this.generate();
    }
    
    generate() {
        // Initialize empty grid
        const gridSize = Math.floor(this.mapSize / this.pixelSize);
        this.grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
        
        // Seed all four edges with terrain
        const active = [];
        
        // Top and bottom edges
        for (let x = 0; x < gridSize; x++) {
            this.grid[0][x] = 1; // Top edge
            this.grid[gridSize - 1][x] = 1; // Bottom edge
            active.push({x: x, y: 1}); // Add row below top edge as active
            active.push({x: x, y: gridSize - 2}); // Add row above bottom edge as active
        }
        
        // Left and right edges (skip corners already done)
        for (let y = 1; y < gridSize - 1; y++) {
            this.grid[y][0] = 1; // Left edge
            this.grid[y][gridSize - 1] = 1; // Right edge
            active.push({x: 1, y: y}); // Add column right of left edge as active
            active.push({x: gridSize - 2, y: y}); // Add column left of right edge as active
        }
        
        // Grow terrain inward from edges
        const maxDepth = Math.floor(gridSize * 0.25); // Control how far terrain extends inward
        const growthProbability = 0.35; // Probability of growth
        
        while (active.length > 0) {
            // Pick random active cell
            const idx = Math.floor(random(active.length));
            const current = active.splice(idx, 1)[0];
            
            // Check depth from edge
            const minDistToEdge = Math.min(current.x, current.y, gridSize - 1 - current.x, gridSize - 1 - current.y);
            if (minDistToEdge >= maxDepth) continue;
            
            // Maybe place terrain here
            if (this.grid[current.y][current.x] === 0 && random() < growthProbability) {
                this.grid[current.y][current.x] = 1;
                
                // Add neighbors as potential growth points
                const neighbors = [
                    {x: current.x + 1, y: current.y},
                    {x: current.x - 1, y: current.y},
                    {x: current.x, y: current.y + 1},
                    {x: current.x, y: current.y - 1}
                ];
                
                for (let n of neighbors) {
                    if (n.x > 0 && n.x < gridSize - 1 && n.y > 0 && n.y < gridSize - 1) {
                        // Check if this neighbor is already terrain or already in active list
                        if (this.grid[n.y][n.x] === 0) {
                            // Avoid duplicates in active list
                            const alreadyActive = active.some(a => a.x === n.x && a.y === n.y);
                            if (!alreadyActive) {
                                active.push(n);
                            }
                        }
                    }
                }
            }
        }
        
        // Smoothing pass to make terrain more organic
        this.smooth();
        this.smooth();
        
        // Generate interior obstacles
        this.generateInteriorBlobs(gridSize);
    }
    
    generateInteriorBlobs(gridSize) {
        // Generate 3-7 interior terrain blobs
        const numBlobs = Math.floor(random(3, 8)); // 3-7 blobs
        const edgeMargin = Math.floor(25 / this.pixelSize); // 25 pixels from edge
        
        for (let i = 0; i < numBlobs; i++) {
            // Find a valid interior seed point
            let seedX, seedY;
            let attempts = 0;
            let validSeed = false;
            
            while (!validSeed && attempts < 50) {
                // Pick random point in interior
                seedX = Math.floor(random(edgeMargin, gridSize - edgeMargin));
                seedY = Math.floor(random(edgeMargin, gridSize - edgeMargin));
                
                // Check if seed location is clear (not touching existing terrain)
                const clearRadius = 3; // Small radius around seed must be clear
                validSeed = true;
                
                for (let dy = -clearRadius; dy <= clearRadius; dy++) {
                    for (let dx = -clearRadius; dx <= clearRadius; dx++) {
                        const checkX = seedX + dx;
                        const checkY = seedY + dy;
                        if (checkX >= 0 && checkX < gridSize && checkY >= 0 && checkY < gridSize) {
                            if (this.grid[checkY][checkX] === 1) {
                                validSeed = false;
                                break;
                            }
                        }
                    }
                    if (!validSeed) break;
                }
                
                attempts++;
            }
            
            if (validSeed) {
                // Grow blob from this seed
                const blobSize = Math.floor(random(40, 80)); // Medium-sized blobs
                this.growInteriorBlob(seedX, seedY, blobSize, gridSize);
            }
        }
        
        // Apply light smoothing to interior blobs
        this.smooth();
    }
    
    growInteriorBlob(seedX, seedY, maxSize, gridSize) {
        const active = [{x: seedX, y: seedY}];
        const blobCells = new Set(); // Track cells in this blob
        let grown = 0;
        
        while (active.length > 0 && grown < maxSize) {
            // Pick random active cell
            const idx = Math.floor(random(active.length));
            const current = active.splice(idx, 1)[0];
            
            // Skip if already placed
            const cellKey = `${current.x},${current.y}`;
            if (blobCells.has(cellKey)) continue;
            
            // Check if this cell touches pre-existing terrain (not part of this blob)
            let touchesPreExisting = false;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const checkX = current.x + dx;
                    const checkY = current.y + dy;
                    const neighborKey = `${checkX},${checkY}`;
                    
                    if (checkX >= 0 && checkX < gridSize && checkY >= 0 && checkY < gridSize) {
                        // If neighbor is terrain but NOT part of this blob, it's pre-existing
                        if (this.grid[checkY][checkX] === 1 && !blobCells.has(neighborKey)) {
                            touchesPreExisting = true;
                            break;
                        }
                    }
                }
                if (touchesPreExisting) break;
            }
            
            // If touching pre-existing terrain, skip this cell but continue with others
            if (touchesPreExisting) {
                continue;
            }
            
            // Place terrain at current position
            if (this.grid[current.y][current.x] === 0) {
                this.grid[current.y][current.x] = 1;
                blobCells.add(cellKey);
                grown++;
                
                // Add neighbors as potential growth points
                const neighbors = [
                    {x: current.x + 1, y: current.y},
                    {x: current.x - 1, y: current.y},
                    {x: current.x, y: current.y + 1},
                    {x: current.x, y: current.y - 1}
                ];
                
                // Randomly add neighbors with high probability for continuous blobs
                for (let n of neighbors) {
                    if (n.x > 0 && n.x < gridSize - 1 && n.y > 0 && n.y < gridSize - 1) {
                        const nKey = `${n.x},${n.y}`;
                        if (this.grid[n.y][n.x] === 0 && !blobCells.has(nKey) && random() < 0.6) {
                            // Check if neighbor isn't already in active list
                            const alreadyActive = active.some(a => a.x === n.x && a.y === n.y);
                            if (!alreadyActive) {
                                active.push(n);
                            }
                        }
                    }
                }
            }
        }
    }
    
    smooth() {
        const gridSize = this.grid.length;
        const newGrid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
        
        // Preserve edges
        for (let x = 0; x < gridSize; x++) {
            newGrid[0][x] = this.grid[0][x];
            newGrid[gridSize - 1][x] = this.grid[gridSize - 1][x];
        }
        for (let y = 0; y < gridSize; y++) {
            newGrid[y][0] = this.grid[y][0];
            newGrid[y][gridSize - 1] = this.grid[y][gridSize - 1];
        }
        
        for (let y = 1; y < gridSize - 1; y++) {
            for (let x = 1; x < gridSize - 1; x++) {
                // Count neighbors
                let neighbors = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        if (this.grid[y + dy][x + dx] === 1) neighbors++;
                    }
                }
                
                // More lenient rules to preserve continuous terrain
                if (this.grid[y][x] === 1) {
                    newGrid[y][x] = neighbors >= 3 ? 1 : 0;
                } else {
                    newGrid[y][x] = neighbors >= 5 ? 1 : 0;
                }
            }
        }
        
        this.grid = newGrid;
    }
    
    draw() {
        push();
        noStroke();
        fill(0, 255, 0); // Console green terrain
        
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                if (this.grid[y][x] === 1) {
                    rect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize);
                }
            }
        }
        pop();
    }
    
    isSolid(x, y) {
        const gridX = Math.floor(x / this.pixelSize);
        const gridY = Math.floor(y / this.pixelSize);
        
        if (gridX < 0 || gridX >= this.grid[0].length || 
            gridY < 0 || gridY >= this.grid.length) {
            return true; // Treat out of bounds as solid
        }
        
        return this.grid[gridY][gridX] === 1;
    }
    
    isAreaClear(x, y, radius) {
        // Check if area around position is clear of terrain
        const checkRadius = Math.ceil(radius / this.pixelSize);
        const centerX = Math.floor(x / this.pixelSize);
        const centerY = Math.floor(y / this.pixelSize);
        
        for (let dy = -checkRadius; dy <= checkRadius; dy++) {
            for (let dx = -checkRadius; dx <= checkRadius; dx++) {
                const gx = centerX + dx;
                const gy = centerY + dy;
                
                if (gx >= 0 && gx < this.grid[0].length && 
                    gy >= 0 && gy < this.grid.length) {
                    if (this.grid[gy][gx] === 1) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    findSafeSpawn(preferredX, preferredY, otherSpawn, mapSize) {
        const minClearRadius = 15; // Minimum clear space around spawn
        const minDistanceFromOther = 80; // Minimum distance between spawns
        
        // Try preferred position first
        if (this.isAreaClear(preferredX, preferredY, minClearRadius)) {
            if (!otherSpawn || dist(preferredX, preferredY, otherSpawn.x, otherSpawn.y) > minDistanceFromOther) {
                return {x: preferredX, y: preferredY};
            }
        }
        
        // Search in expanding radius for a safe spot
        const searchRadius = 50;
        for (let r = 10; r < searchRadius; r += 5) {
            for (let angle = 0; angle < TWO_PI; angle += PI / 8) {
                const testX = preferredX + cos(angle) * r;
                const testY = preferredY + sin(angle) * r;
                
                // Keep within bounds
                if (testX < 20 || testX > mapSize - 20 || testY < 20 || testY > mapSize - 20) {
                    continue;
                }
                
                if (this.isAreaClear(testX, testY, minClearRadius)) {
                    if (!otherSpawn || dist(testX, testY, otherSpawn.x, otherSpawn.y) > minDistanceFromOther) {
                        return {x: testX, y: testY};
                    }
                }
            }
        }
        
        // Fallback: return preferred position (shouldn't happen often)
        return {x: preferredX, y: preferredY};
    }
    
}
