// Terrain generation and management

class Terrain {
    constructor(mapSize) {
        this.mapSize = mapSize;
        this.grid = [];
        this.pixelSize = CONFIG.TERRAIN.PIXEL_SIZE;
        this.targetDensity = CONFIG.TERRAIN.TARGET_DENSITY;
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
            this.grid[0][x] = 1;
            this.grid[gridSize - 1][x] = 1;
            active.push({x: x, y: 1});
            active.push({x: x, y: gridSize - 2});
        }
        
        // Left and right edges (skip corners already done)
        for (let y = 1; y < gridSize - 1; y++) {
            this.grid[y][0] = 1;
            this.grid[y][gridSize - 1] = 1;
            active.push({x: 1, y: y});
            active.push({x: gridSize - 2, y: y});
        }
        
        // Grow terrain inward from edges
        const maxDepth = Math.floor(gridSize * CONFIG.TERRAIN.EDGE_GROWTH_DEPTH);
        const growthProbability = CONFIG.TERRAIN.GROWTH_PROBABILITY;
        
        while (active.length > 0) {
            const idx = Math.floor(random(active.length));
            const current = active.splice(idx, 1)[0];
            
            const minDistToEdge = Math.min(current.x, current.y, gridSize - 1 - current.x, gridSize - 1 - current.y);
            if (minDistToEdge >= maxDepth) continue;
            
            if (this.grid[current.y][current.x] === 0 && random() < growthProbability) {
                this.grid[current.y][current.x] = 1;
                
                const neighbors = [
                    {x: current.x + 1, y: current.y},
                    {x: current.x - 1, y: current.y},
                    {x: current.x, y: current.y + 1},
                    {x: current.x, y: current.y - 1}
                ];
                
                for (let n of neighbors) {
                    if (n.x > 0 && n.x < gridSize - 1 && n.y > 0 && n.y < gridSize - 1) {
                        if (this.grid[n.y][n.x] === 0) {
                            const alreadyActive = active.some(a => a.x === n.x && a.y === n.y);
                            if (!alreadyActive) {
                                active.push(n);
                            }
                        }
                    }
                }
            }
        }
        
        // Smoothing pass
        for (let i = 0; i < CONFIG.TERRAIN.SMOOTH_PASSES; i++) {
            this.smooth();
        }
        
        // Generate interior obstacles
        this.generateInteriorBlobs(gridSize);
    }
    
    generateInteriorBlobs(gridSize) {
        const numBlobs = Math.floor(random(CONFIG.TERRAIN.MIN_BLOBS, CONFIG.TERRAIN.MAX_BLOBS + 1));
        const edgeMargin = Math.floor(CONFIG.TERRAIN.BLOB_EDGE_MARGIN / this.pixelSize);
        
        for (let i = 0; i < numBlobs; i++) {
            let seedX, seedY;
            let attempts = 0;
            let validSeed = false;
            
            while (!validSeed && attempts < 50) {
                seedX = Math.floor(random(edgeMargin, gridSize - edgeMargin));
                seedY = Math.floor(random(edgeMargin, gridSize - edgeMargin));
                
                const clearRadius = CONFIG.TERRAIN.BLOB_CLEAR_RADIUS;
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
                const blobSize = Math.floor(random(CONFIG.TERRAIN.BLOB_MIN_SIZE, CONFIG.TERRAIN.BLOB_MAX_SIZE));
                this.growInteriorBlob(seedX, seedY, blobSize, gridSize);
            }
        }
        
        // Apply light smoothing to interior blobs
        this.smooth();
    }
    
    growInteriorBlob(seedX, seedY, maxSize, gridSize) {
        const active = [{x: seedX, y: seedY}];
        const blobCells = new Set();
        let grown = 0;
        
        while (active.length > 0 && grown < maxSize) {
            const idx = Math.floor(random(active.length));
            const current = active.splice(idx, 1)[0];
            
            const cellKey = `${current.x},${current.y}`;
            if (blobCells.has(cellKey)) continue;
            
            let touchesPreExisting = false;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const checkX = current.x + dx;
                    const checkY = current.y + dy;
                    const neighborKey = `${checkX},${checkY}`;
                    
                    if (checkX >= 0 && checkX < gridSize && checkY >= 0 && checkY < gridSize) {
                        if (this.grid[checkY][checkX] === 1 && !blobCells.has(neighborKey)) {
                            touchesPreExisting = true;
                            break;
                        }
                    }
                }
                if (touchesPreExisting) break;
            }
            
            if (touchesPreExisting) continue;
            
            if (this.grid[current.y][current.x] === 0) {
                this.grid[current.y][current.x] = 1;
                blobCells.add(cellKey);
                grown++;
                
                const neighbors = [
                    {x: current.x + 1, y: current.y},
                    {x: current.x - 1, y: current.y},
                    {x: current.x, y: current.y + 1},
                    {x: current.x, y: current.y - 1}
                ];
                
                for (let n of neighbors) {
                    if (n.x > 0 && n.x < gridSize - 1 && n.y > 0 && n.y < gridSize - 1) {
                        const nKey = `${n.x},${n.y}`;
                        if (this.grid[n.y][n.x] === 0 && !blobCells.has(nKey) && 
                            random() < CONFIG.TERRAIN.BLOB_GROWTH_PROBABILITY) {
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
                    newGrid[y][x] = neighbors >= CONFIG.TERRAIN.SMOOTH_SURVIVE_THRESHOLD ? 1 : 0;
                } else {
                    newGrid[y][x] = neighbors >= CONFIG.TERRAIN.SMOOTH_BIRTH_THRESHOLD ? 1 : 0;
                }
            }
        }
        
        this.grid = newGrid;
    }
    
    isSolid(x, y) {
        const gridX = Math.floor(x / this.pixelSize);
        const gridY = Math.floor(y / this.pixelSize);
        
        // Use safe array access
        const cell = Utils.safeArrayAccess(this.grid, gridY, gridX, 1);
        return cell === 1;
    }
    
    isAreaClear(x, y, radius) {
        if (!this.grid || !this.grid.length) return false;
        
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
        const minClearRadius = CONFIG.SUBMARINE.SPAWN_CLEAR_RADIUS;
        const minDistanceFromOther = CONFIG.SUBMARINE.MIN_SPAWN_DISTANCE;
        
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
        
        // Fallback
        console.warn('Failed to find safe spawn, using preferred position');
        return {x: preferredX, y: preferredY};
    }
}
