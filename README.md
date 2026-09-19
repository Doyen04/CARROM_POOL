# Carrom Pool

A small browser-based Carrom Pool game built with plain HTML, CSS, and JavaScript.

## Overview
- Minimal single-page project implementing Carrom-style gameplay.
- Files:
  - `index.html` — game container and assets.
  - `styles.css` — styling.
  - `game.js` — core game logic.
  - `renderer.js` — rendering / UI glue.

## Run
Open `index.html` in a modern browser (double-click or drag into the browser).

For a local static server (recommended for some features), run one of these:

```bash
# Python 3
python -m http.server 8000

# Node (http-server)
npx http-server -p 8000
```

Then visit `http://localhost:8000`.

## Controls
- Use the mouse or touch to interact with the board. (Exact controls are implemented in `game.js`.)

## Development notes
- Edit the JavaScript and CSS files and reload the page to see changes.
- Report bugs or request features by opening an issue in your tracker.

## License
This project has no license file. Add one if you plan to publish.
