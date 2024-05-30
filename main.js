// Initialization hook
Hooks.once('init', () => {
    console.log('Parallax Tiles | Initializing Parallax Tiles plugin');

    // Register new fields in the tile configuration for enabling parallax and setting the parallax strength
    game.settings.register("parallax-tiles", "enableParallax", {
        name: "Enable Parallax",
        hint: "Enable or disable the parallax effect for this tile.",
        scope: "world",
        config: false,
        default: false,
        type: Boolean
    });

    game.settings.register("parallax-tiles", "parallaxStrength", {
        name: "Parallax Strength",
        hint: "Set the parallax strength for this tile.",
        scope: "world",
        config: false,
        default: 0.2,
        type: Number
    });

    // Extend the tile configuration to include these new settings
    libWrapper.register('parallax-tiles', 'TileConfig.prototype._updateObject', async function (wrapped, ...args) {
        const [event, formData] = args;
        formData['flags.parallax-tiles.enableParallax'] = formData['enableParallax'] || false;
        formData['flags.parallax-tiles.parallaxStrength'] = parseFloat(formData['parallaxStrength']) || 0.2;
        return wrapped(event, formData);
    }, 'WRAPPER');
});

// Render tile configuration
Hooks.on('renderTileConfig', (app, html, data) => {
    const enableParallax = app.object.getFlag('parallax-tiles', 'enableParallax') || false;
    const parallaxStrength = app.object.getFlag('parallax-tiles', 'parallaxStrength') || 0.2;

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

// Canvas ready hook
Hooks.on('canvasReady', () => {
    console.log('Parallax Tiles | Canvas ready');

    // Listen for canvas pan events
    Hooks.on('canvasPan', (canvas, position) => {
        onCameraMove(position);
    });

    // Listen for canvas zoom events
    Hooks.on('canvasZoom', (canvas, position) => {
        onCameraMove(position);
    });
});

let previousCameraPosition = null;

// Camera movement handler
function onCameraMove(position) {
    if (!previousCameraPosition) {
        previousCameraPosition = { x: position.x, y: position.y };
        return;
    }

    const currentCameraPosition = position;

    // Calculate the delta (difference) in position
    const deltaX = currentCameraPosition.x - previousCameraPosition.x;
    const deltaY = currentCameraPosition.y - previousCameraPosition.y;

    // Check if the tiles layer and placeables are available
    if (canvas.tiles && canvas.tiles.placeables) {
        // Loop through all tiles and adjust their position
        canvas.tiles.placeables.forEach(tile => {
            const enableParallax = tile.document.getFlag('parallax-tiles', 'enableParallax');
            let parallaxStrength = parseFloat(tile.document.getFlag('parallax-tiles', 'parallaxStrength'));

            // Ensure parallaxStrength is a valid number and within the range -1 to 1
            if (isNaN(parallaxStrength) || parallaxStrength < -1 || parallaxStrength > 1) {
                parallaxStrength = 0.2;
            }

            if (enableParallax) {
                // Calculate parallax offset based on delta position
                const offsetX = deltaX * -parallaxStrength;
                const offsetY = deltaY * -parallaxStrength;

                // Apply the offset to the tile's mesh position
                tile.mesh.position.set(tile.mesh.position.x - offsetX, tile.mesh.position.y - offsetY);
            }
        });
    }

    // Update the previous camera position
    previousCameraPosition = { x: currentCameraPosition.x, y: currentCameraPosition.y };
}
