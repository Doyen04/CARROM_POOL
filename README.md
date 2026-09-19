# Carrom Pool

A compact browser Carrom/Pool hybrid implemented in plain HTML, CSS, and JavaScript.

## Project summary
- Simple single-page game that simulates flicking pieces (carrom men) on a board.
- Focuses on local, offline play and small-code readability for learning and extension.

## Features
- Physics-like piece movement and collisions (basic friction and bounce).
- Mouse and touch input for aiming and shooting.
- Scoring and simple rule checks (pocketed pieces, turn handling).

## Files and structure
- `index.html` — HTML container and basic UI elements.
- `styles.css` — layout, board styling, and responsive rules.
- `game.js` — game rules, state management, input handling, and physics.
- `renderer.js` — draws the board and pieces to the canvas and handles animations.
- (Optional) `assets/` — place images or sound files here if you add them.

## How to run
1. Quick (no server): open `index.html` in a modern browser (Chrome, Edge, Firefox).
2. Recommended (local server): run a simple static server to avoid some browser restrictions:

```bash
# Python 3
python -m http.server 8000

# Node (http-server)
npx http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

## Controls
- Mouse:
  - Click and drag on the striker to set direction and power; release to shoot.
  - Click on the board to reposition the striker when allowed by the rules.
- Touch:
  - Tap+drag on the striker to aim and set power; lift to shoot.
- Keyboard (if implemented):
  - `R` — reset the board
  - `P` — pause/unpause the simulation

Behavior details: aiming uses the vector from the striker's center to the pointer; drag distance maps to shot power. See `game.js` for exact input handling.

## Game mechanics
- Pieces: striker and colored carrom pieces with simple collision resolution.
- Physics: velocity, friction, and elastic collisions; tuned for arcade feel rather than exact realism.
- Scoring: pocket detection removes pieces from play and updates scores.
- Fouls & rules: simple checks are implemented; extend `game.js` to add official Carrom rule enforcement.

## Development notes
- Hot-edit: change `.js` or `.css` files and refresh the browser to see updates.
- Key places to modify:
  - `game.js` — adjust `FRICTION`, `POCKET_RADIUS`, and scoring logic.
  - `renderer.js` — change colors, piece radii, or add visual effects.
  - `styles.css` — tweak layout and responsive behavior.
- Useful debugging: open DevTools Console to inspect `game` state (the project exposes basic state objects while running).

## Testing & troubleshooting
- If visuals don't update, ensure the browser console has no 404 errors for the scripts.
- If input feels off, check for pointer event handling in `game.js` and whether the canvas coordinates are converted correctly.

## Contribution
- To contribute, fork the project, make changes, and submit a PR with a clear description of the change.
- Suggested improvements: add sounds, improve collision physics, add AI/opponent, or save/restore game state.

## Browser compatibility
- Designed for modern evergreen browsers (latest Chrome, Edge, Firefox, Safari).
- Mobile touch support is included, but performance may vary on older devices.

## License
Add a `LICENSE` file to declare terms if you plan to publish. MIT is a good starter option.

---
If you want, I can:
- add a demo screenshot and GIF to the repo,
- add a minimal `LICENSE` (`MIT`) and `CONTRIBUTING.md`, or
- extract configuration constants from `game.js` into a `config.js` for easier tuning.

