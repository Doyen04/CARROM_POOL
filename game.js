const { Engine, Bodies, Body, World, Composite } = Matter;

// Board geometry
const SIZE = Math.max(420, Math.min(window.innerWidth - 36, 560));
const S = SIZE;
const MARGIN = S * 0.06;
const INNER = S - MARGIN * 2;
const CX = S / 2;
const CY = S / 2;
const POCKET_R = S * 0.048;
const PIECE_R = S * 0.032;
const STRIKER_R = S * 0.041;
const WALL_T = 18;

const BASELINE_TOP = MARGIN + INNER * 0.17;
const BASELINE_BOTTOM = S - MARGIN - INNER * 0.17;
const BASELINE_HALF = INNER * 0.30;

const PHASE = {
    AIM: 'aim',
    SHOOTING: 'shooting',
    RESOLVING: 'resolving',
    OVER: 'over',
};

const canvas = document.getElementById('board-canvas');
const aimCanvas = document.getElementById('aim-canvas');
canvas.width = aimCanvas.width = S;
canvas.height = aimCanvas.height = S;
const ctx = canvas.getContext('2d');
const actx = aimCanvas.getContext('2d');

const engine = Engine.create({ gravity: { x: 0, y: 0 } });
const world = engine.world;

const pockets = [
    { x: MARGIN, y: MARGIN },
    { x: S - MARGIN, y: MARGIN },
    { x: MARGIN, y: S - MARGIN },
    { x: S - MARGIN, y: S - MARGIN },
];

const ui = {
    p1Val: document.getElementById('p1-val'),
    p2Val: document.getElementById('p2-val'),
    p1Score: document.getElementById('p1-score'),
    p2Score: document.getElementById('p2-score'),
    status: document.getElementById('status-bar'),
    powerBar: document.getElementById('power-bar'),
    overlay: document.getElementById('overlay'),
    overlayTitle: document.getElementById('overlay-title'),
    overlayMsg: document.getElementById('overlay-msg'),
    newBtn: document.getElementById('new-game-btn'),
    playAgainBtn: document.getElementById('play-again-btn'),
};

const renderer = window.createCarromRenderer({
    ctx,
    actx,
    ui,
    constants: {
        S,
        MARGIN,
        INNER,
        CX,
        CY,
        POCKET_R,
        PIECE_R,
        STRIKER_R,
        BASELINE_TOP,
        BASELINE_BOTTOM,
        BASELINE_HALF,
        PHASE,
    },
    pockets,
    getState: () => ({
        pieces,
        striker,
        phase,
        currentPlayer,
        isDragging,
        interactMode,
        dragCurrent,
        aimAnchor,
    }),
});

let walls = [];
let pieces = [];
let striker = null;
let currentPlayer = 1;
let scores = [0, 0];
let phase = PHASE.AIM;

// Per-shot event log for deterministic turn resolution
let turnEvents = {
    strikerFoul: false,
    queenPocketed: false,
    queenBy: null,
    ownedPocketed: 0,
    enemyPocketed: 0,
};

// Input state
let isDragging = false;
let interactMode = 'slide'; // 'slide' | 'aim'
let dragStart = null;
let dragCurrent = null;
let aimAnchor = null;

// Settling logic
const STOP_THRESHOLD = 0.12;
const STOP_FRAMES_REQUIRED = 18;
let stopFrames = 0;

function setStatus(message) {
    ui.status.textContent = message;
}

function updateScores() {
    ui.p1Val.textContent = scores[0];
    ui.p2Val.textContent = scores[1];
}

function updatePlayerUI() {
    ui.p1Score.classList.toggle('active', currentPlayer === 1);
    ui.p2Score.classList.toggle('active', currentPlayer === 2);
}

function ownedColor(player) {
    return player === 1 ? 'black' : 'white';
}

function clearWorldBodies() {
    const all = Composite.allBodies(world);
    for (const b of all) World.remove(world, b);
}

function createWalls() {
    const opts = { isStatic: true, restitution: 0.92, friction: 0, frictionStatic: 0, label: 'wall' };
    walls = [
        Bodies.rectangle(CX, MARGIN - WALL_T / 2, INNER + 8, WALL_T, opts),
        Bodies.rectangle(CX, S - MARGIN + WALL_T / 2, INNER + 8, WALL_T, opts),
        Bodies.rectangle(MARGIN - WALL_T / 2, CY, WALL_T, INNER + 8, opts),
        Bodies.rectangle(S - MARGIN + WALL_T / 2, CY, WALL_T, INNER + 8, opts),
    ];
    World.add(world, walls);
}

function makePiece(x, y, type) {
    const body = Bodies.circle(x, y, PIECE_R, {
        restitution: 0.94,
        friction: 0.004,
        frictionStatic: 0,
        frictionAir: 0.018,
        density: 0.0018,
        label: type,
    });
    body.pieceType = type;
    return body;
}

function createRack() {
    const r1 = PIECE_R * 2.32;
    const r2 = r1 * 2.02;
    const list = [
        [CX + r1 * Math.cos(0), CY + r1 * Math.sin(0), 'white'],
        [CX + r1 * Math.cos(Math.PI / 3), CY + r1 * Math.sin(Math.PI / 3), 'black'],
        [CX + r1 * Math.cos(2 * Math.PI / 3), CY + r1 * Math.sin(2 * Math.PI / 3), 'white'],
        [CX + r1 * Math.cos(Math.PI), CY + r1 * Math.sin(Math.PI), 'black'],
        [CX + r1 * Math.cos(4 * Math.PI / 3), CY + r1 * Math.sin(4 * Math.PI / 3), 'white'],
        [CX + r1 * Math.cos(5 * Math.PI / 3), CY + r1 * Math.sin(5 * Math.PI / 3), 'black'],

        [CX + r2 * Math.cos(0), CY + r2 * Math.sin(0), 'black'],
        [CX + r2 * Math.cos(Math.PI / 6), CY + r2 * Math.sin(Math.PI / 6), 'white'],
        [CX + r2 * Math.cos(2 * Math.PI / 6), CY + r2 * Math.sin(2 * Math.PI / 6), 'black'],
        [CX + r2 * Math.cos(3 * Math.PI / 6), CY + r2 * Math.sin(3 * Math.PI / 6), 'white'],
        [CX + r2 * Math.cos(4 * Math.PI / 6), CY + r2 * Math.sin(4 * Math.PI / 6), 'black'],
        [CX + r2 * Math.cos(5 * Math.PI / 6), CY + r2 * Math.sin(5 * Math.PI / 6), 'white'],
        [CX + r2 * Math.cos(6 * Math.PI / 6), CY + r2 * Math.sin(6 * Math.PI / 6), 'black'],
        [CX + r2 * Math.cos(7 * Math.PI / 6), CY + r2 * Math.sin(7 * Math.PI / 6), 'white'],
        [CX + r2 * Math.cos(8 * Math.PI / 6), CY + r2 * Math.sin(8 * Math.PI / 6), 'black'],
        [CX + r2 * Math.cos(9 * Math.PI / 6), CY + r2 * Math.sin(9 * Math.PI / 6), 'white'],
        [CX + r2 * Math.cos(10 * Math.PI / 6), CY + r2 * Math.sin(10 * Math.PI / 6), 'black'],
        [CX + r2 * Math.cos(11 * Math.PI / 6), CY + r2 * Math.sin(11 * Math.PI / 6), 'white'],

        [CX, CY, 'queen'],
    ];

    pieces = list.map(([x, y, type]) => makePiece(x, y, type));
    World.add(world, pieces);
}

function spawnStriker() {
    if (striker) World.remove(world, striker);
    const sy = currentPlayer === 1 ? BASELINE_BOTTOM : BASELINE_TOP;
    striker = Bodies.circle(CX, sy, STRIKER_R, {
        restitution: 0.9,
        friction: 0.005,
        frictionStatic: 0,
        frictionAir: 0.025,
        density: 0.003,
        label: 'striker',
    });
    World.add(world, striker);
}

function inPocket(body) {
    const p = body.position;
    for (const pk of pockets) {
        const dx = p.x - pk.x;
        const dy = p.y - pk.y;
        if (dx * dx + dy * dy <= (POCKET_R * 1.08) ** 2) return true;
    }
    return false;
}

function processPocketEvents() {
    if (phase !== PHASE.SHOOTING) return;

    // Striker foul
    if (striker && inPocket(striker)) {
        turnEvents.strikerFoul = true;
        World.remove(world, striker);
        striker = null;
    }

    // Piece pockets (safe filtering)
    const stillOnBoard = [];
    for (const piece of pieces) {
        if (!inPocket(piece)) {
            stillOnBoard.push(piece);
            continue;
        }

        World.remove(world, piece);
        if (piece.pieceType === 'queen') {
            turnEvents.queenPocketed = true;
            turnEvents.queenBy = currentPlayer;
        } else if (piece.pieceType === ownedColor(currentPlayer)) {
            turnEvents.ownedPocketed += 1;
        } else {
            turnEvents.enemyPocketed += 1;
        }
    }
    pieces = stillOnBoard;
}

function allBodiesStopped() {
    const all = [striker, ...pieces].filter(Boolean);
    if (!all.length) return true;
    for (const b of all) {
        const speed = Math.hypot(b.velocity.x, b.velocity.y);
        if (speed > STOP_THRESHOLD) return false;
    }
    return true;
}

function beginShot() {
    turnEvents = {
        strikerFoul: false,
        queenPocketed: false,
        queenBy: null,
        ownedPocketed: 0,
        enemyPocketed: 0,
    };
    stopFrames = 0;
    phase = PHASE.SHOOTING;
    setStatus('Shot in progress...');
}

function resolveTurn() {
    if (phase === PHASE.OVER) return;

    phase = PHASE.RESOLVING;

    const playerIndex = currentPlayer - 1;

    // Foul first
    if (turnEvents.strikerFoul) {
        scores[playerIndex] = Math.max(0, scores[playerIndex] - 1);
    }

    // Base scoring
    if (turnEvents.ownedPocketed > 0) scores[playerIndex] += turnEvents.ownedPocketed;
    if (turnEvents.enemyPocketed > 0) scores[playerIndex] = Math.max(0, scores[playerIndex] - turnEvents.enemyPocketed);

    // Queen (simplified but deterministic):
    // +3 only if current player pocketed at least one own piece in same turn and no striker foul.
    if (turnEvents.queenPocketed) {
        const queenCovered = turnEvents.ownedPocketed > 0 && !turnEvents.strikerFoul;
        if (queenCovered) {
            scores[playerIndex] += 3;
            setStatus(`Player ${currentPlayer} covered queen (+3)`);
        } else {
            // Respawn queen to center when not covered
            const queen = makePiece(CX, CY, 'queen');
            pieces.push(queen);
            World.add(world, queen);
            setStatus('Queen returned to center (not covered)');
        }
    }

    updateScores();

    // Win condition: player clears own color
    const myColor = ownedColor(currentPlayer);
    const ownLeft = pieces.filter(p => p.pieceType === myColor).length;
    if (ownLeft === 0) {
        showWinner(currentPlayer);
        return;
    }

    // Turn retain logic: keep turn only if own piece pocketed and no foul
    const keepTurn = turnEvents.ownedPocketed > 0 && !turnEvents.strikerFoul;
    if (!keepTurn) currentPlayer = currentPlayer === 1 ? 2 : 1;

    updatePlayerUI();
    spawnStriker();
    ui.powerBar.style.width = '0%';
    isDragging = false;
    interactMode = 'slide';
    dragStart = null;
    dragCurrent = null;
    aimAnchor = null;
    phase = PHASE.AIM;

    if (keepTurn) {
        setStatus(`Player ${currentPlayer} continues — pocketed own coin`);
    } else {
        setStatus(`Player ${currentPlayer}'s turn — place and shoot`);
    }
}

function showWinner(player) {
    phase = PHASE.OVER;
    updateScores();
    ui.overlayTitle.textContent = `Player ${player} Wins!`;
    ui.overlayMsg.textContent = `Final Score — P1: ${scores[0]} | P2: ${scores[1]}`;
    ui.overlay.classList.add('show');
    setStatus('Game over');
}

function getPointerPos(e) {
    const rect = aimCanvas.getBoundingClientRect();
    const sx = S / rect.width;
    const sy = S / rect.height;
    return {
        x: (e.clientX - rect.left) * sx,
        y: (e.clientY - rect.top) * sy,
    };
}

function strikerDistance(pos) {
    if (!striker) return Number.POSITIVE_INFINITY;
    return Math.hypot(pos.x - striker.position.x, pos.y - striker.position.y);
}

function onPointerDown(e) {
    if (phase !== PHASE.AIM || !striker) return;
    const pos = getPointerPos(e);
    if (strikerDistance(pos) > STRIKER_R * 3.7) return;
    isDragging = true;
    interactMode = 'slide';
    dragStart = { x: striker.position.x, y: striker.position.y };
    dragCurrent = pos;
    aimAnchor = null;
}

function onPointerMove(e) {
    if (!isDragging || phase !== PHASE.AIM || !striker) return;
    dragCurrent = getPointerPos(e);

    if (interactMode === 'slide') {
        const dx = Math.abs(dragCurrent.x - dragStart.x);
        const dy = Math.abs(dragCurrent.y - dragStart.y);

        if (dx > 5 || dy > 5) {
            if (dy > dx) {
                interactMode = 'aim';
                aimAnchor = { x: striker.position.x, y: striker.position.y };
            } else {
                const baselineY = currentPlayer === 1 ? BASELINE_BOTTOM : BASELINE_TOP;
                const nx = Math.max(CX - BASELINE_HALF, Math.min(CX + BASELINE_HALF, dragCurrent.x));
                Body.setPosition(striker, { x: nx, y: baselineY });
                Body.setVelocity(striker, { x: 0, y: 0 });
                dragStart = { x: nx, y: baselineY };
            }
        }
    }
}

function onPointerUp() {
    if (!isDragging || phase !== PHASE.AIM || !striker) return;
    isDragging = false;

    if (interactMode !== 'aim' || !aimAnchor || !dragCurrent) {
        ui.powerBar.style.width = '0%';
        interactMode = 'slide';
        aimAnchor = null;
        return;
    }

    const dx = dragCurrent.x - aimAnchor.x;
    const dy = dragCurrent.y - aimAnchor.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 8) {
        ui.powerBar.style.width = '0%';
        interactMode = 'slide';
        aimAnchor = null;
        return;
    }

    const maxDist = INNER * 0.30;
    const power = Math.min(dist / maxDist, 1);
    const speed = power * S * 0.17;
    const nx = dx / dist;
    const ny = dy / dist;

    Body.setVelocity(striker, { x: nx * speed, y: ny * speed });
    ui.powerBar.style.width = '0%';
    interactMode = 'slide';
    aimAnchor = null;
    beginShot();
}

let lastTs = 0;
let accumulator = 0;
const FIXED_DT = 1000 / 120;

function loop(ts) {
    if (!lastTs) lastTs = ts;
    const frame = Math.min(32, ts - lastTs);
    lastTs = ts;
    accumulator += frame;

    while (accumulator >= FIXED_DT) {
        Engine.update(engine, FIXED_DT);

        if (phase === PHASE.SHOOTING) {
            processPocketEvents();

            if (allBodiesStopped()) {
                stopFrames += 1;
                if (stopFrames >= STOP_FRAMES_REQUIRED) {
                    resolveTurn();
                }
            } else {
                stopFrames = 0;
            }
        }

        accumulator -= FIXED_DT;
    }

    renderer.render();
    requestAnimationFrame(loop);
}

function resetGame() {
    ui.overlay.classList.remove('show');
    clearWorldBodies();
    createWalls();

    pieces = [];
    striker = null;
    currentPlayer = 1;
    scores = [0, 0];
    phase = PHASE.AIM;

    isDragging = false;
    interactMode = 'slide';
    dragStart = null;
    dragCurrent = null;
    aimAnchor = null;
    stopFrames = 0;
    ui.powerBar.style.width = '0%';

    turnEvents = {
        strikerFoul: false,
        queenPocketed: false,
        queenBy: null,
        ownedPocketed: 0,
        enemyPocketed: 0,
    };

    createRack();
    spawnStriker();
    updateScores();
    updatePlayerUI();
    setStatus('Player 1 — drag horizontally to place, drag to aim and release to shoot');
}

// Bind pointer handlers
aimCanvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    aimCanvas.setPointerCapture(e.pointerId);
    onPointerDown(e);
});

aimCanvas.addEventListener('pointermove', e => {
    e.preventDefault();
    onPointerMove(e);
});

aimCanvas.addEventListener('pointerup', e => {
    e.preventDefault();
    try { aimCanvas.releasePointerCapture(e.pointerId); } catch (_) { }
    onPointerUp();
});

aimCanvas.addEventListener('pointercancel', () => {
    isDragging = false;
    ui.powerBar.style.width = '0%';
    renderer.drawAimOverlay();
});

ui.newBtn.addEventListener('click', resetGame);
ui.playAgainBtn.addEventListener('click', resetGame);

resetGame();
requestAnimationFrame(loop);
