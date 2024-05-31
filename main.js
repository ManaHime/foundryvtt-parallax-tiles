const MODULE_NAME = "parallax-tiles";

// Initialization hook
Hooks.once('init', () => {
    console.log(`${MODULE_NAME} | Initializing Parallax Tiles plugin`);

    // Register new fields in the tile configuration for enabling parallax and setting the parallax strength
    game.settings.register(MODULE_NAME, "enableParallax", {
        name: "Enable Parallax",
        hint: "Enable or disable the parallax effect for this tile.",
        scope: "world",
        config: false,
        default: false,
        type: Boolean
    });

    game.settings.register(MODULE_NAME, "parallaxStrength", {
        name: "Parallax Strength",
        hint: "Set the parallax strength for this tile.",
        scope: "world",
        config: false,
        default: 0,
        type: Number
    });

    // Extend the tile configuration to include these new settings
    libWrapper.register(MODULE_NAME, 'TileConfig.prototype._updateObject', async function (wrapped, ...args) {
        const [event, formData] = args;
        formData['flags.parallax-tiles.enableParallax'] = formData['enableParallax'] || false;
        formData['flags.parallax-tiles.parallaxStrength'] = parseFloat(formData['parallaxStrength']) || 0;
        return wrapped(event, formData);
    }, 'WRAPPER');
});

// Render tile configuration
Hooks.on('renderTileConfig', (app, html, data) => {
    const enableParallax = app.object.getFlag(MODULE_NAME, 'enableParallax') || false;
    const parallaxStrength = app.object.getFlag(MODULE_NAME, 'parallaxStrength') || 0;

    const parallaxOptions = `
        <div class="form-group">
            <label>Enable Parallax</label>
            <input type="checkbox" name="enableParallax" ${enableParallax ? 'checked' : ''}>
        </div>
        <div class="form-group">
            <label>Parallax Strength</label>
            <input type="number" name="parallaxStrength" value="${parallaxStrength}" step="0.1" min="-1" max="1">
        </div>
    `;
    html.find('div[data-tab="basic"]').append(parallaxOptions);
});

const initialPositions = new Map();

// Store initial positions. The center is used for offsets so that's what we're going to store here
function storeInitialPositions() {
    if (canvas.tiles && canvas.tiles.placeables) {
        canvas.tiles.placeables.forEach(tile => {
            initialPositions.set(tile.id, { x: tile.center.x, y: tile.center.y});
        });
    }
}

// Apply parallax effect based on camera position
function applyParallaxEffect(position) {
    if (canvas.tiles && canvas.tiles.placeables) {
        canvas.tiles.placeables.forEach(tile => {
            const enableParallax = tile.document.getFlag(MODULE_NAME, 'enableParallax');
            let parallaxStrength = parseFloat(tile.document.getFlag(MODULE_NAME, 'parallaxStrength'));

            if (enableParallax && !isNaN(parallaxStrength) && parallaxStrength >= -1 && parallaxStrength <= 1) {
                const initialPosition = initialPositions.get(tile.id);
                if (!initialPosition) return;
                const posX = initialPosition.x + ((position.x - initialPosition.x) * parallaxStrength);
                const posY = initialPosition.y + ((position.y - initialPosition.y) * parallaxStrength);
                tile.mesh.position.set(posX, posY);
            }
        });
    }
}

// Canvas ready hook
Hooks.on('canvasReady', () => {
    console.log(`${MODULE_NAME} | Canvas ready`);

    // Store initial positions and apply parallax effect initially
    storeInitialPositions();
    applyParallaxEffect(canvas.stage.pivot);
    
    // Listen for canvas pan
    Hooks.on('canvasPan', (canvas, position) => {
        applyParallaxEffect(position);
    });
    // This is a temporarly solution until I find something better.
    // To initialize the parallax we need to wait for the canvas to be ready,
    // but maybe we're not waiting enough for the initial pos to be stored.
    Hooks.on('initializeVisionSources', () => {
        applyParallaxEffect(canvas.stage.pivot);
    });
    Hooks.on('updateTile', () => {
        storeInitialPositions();
        applyParallaxEffect(canvas.stage.pivot);
    });
});
