function createCarromRenderer(config) {
    const {
        ctx,
        actx,
        ui,
        constants,
        pockets,
        getState,
    } = config;

    const {
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
    } = constants;

    function drawRoundRect(c, x, y, w, h, r) {
        c.beginPath();
        c.moveTo(x + r, y);
        c.lineTo(x + w - r, y);
        c.quadraticCurveTo(x + w, y, x + w, y + r);
        c.lineTo(x + w, y + h - r);
        c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        c.lineTo(x + r, y + h);
        c.quadraticCurveTo(x, y + h, x, y + h - r);
        c.lineTo(x, y + r);
        c.quadraticCurveTo(x, y, x + r, y);
        c.closePath();
    }

    function drawBoard() {
        const grad = ctx.createLinearGradient(0, 0, S, S);
        grad.addColorStop(0, '#c08a3a');
        grad.addColorStop(0.5, '#d4a85a');
        grad.addColorStop(1, '#a06820');
        ctx.fillStyle = grad;
        drawRoundRect(ctx, 0, 0, S, S, 10);
        ctx.fill();

        ctx.fillStyle = '#c8a455';
        drawRoundRect(ctx, MARGIN, MARGIN, INNER, INNER, 4);
        ctx.fill();

        ctx.strokeStyle = 'rgba(140,100,40,0.12)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= INNER; i += 18) {
            ctx.beginPath();
            ctx.moveTo(MARGIN + i, MARGIN);
            ctx.lineTo(MARGIN + i, MARGIN + INNER);
            ctx.stroke();
        }

        ctx.strokeStyle = '#7a5010';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(MARGIN, MARGIN, INNER, INNER);

        const inset = S * 0.022;
        ctx.strokeStyle = '#8a6030';
        ctx.lineWidth = 1;
        ctx.strokeRect(MARGIN + inset, MARGIN + inset, INNER - inset * 2, INNER - inset * 2);

        for (const p of pockets) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, POCKET_R + 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2);
            ctx.fillStyle = '#100800';
            ctx.fill();

            ctx.strokeStyle = '#5a3810';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(CX, CY, S * 0.12, 0, Math.PI * 2);
        ctx.strokeStyle = '#8a6030';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(CX, CY, S * 0.05, 0, Math.PI * 2);
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(CX - BASELINE_HALF, BASELINE_BOTTOM);
        ctx.lineTo(CX + BASELINE_HALF, BASELINE_BOTTOM);
        ctx.moveTo(CX - BASELINE_HALF, BASELINE_TOP);
        ctx.lineTo(CX + BASELINE_HALF, BASELINE_TOP);
        ctx.strokeStyle = '#8a6030';
        ctx.stroke();
    }

    function drawOnePiece(x, y, r, type) {
        ctx.save();
        ctx.translate(x, y);

        ctx.beginPath();
        ctx.arc(1.5, 2, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);

        if (type === 'black') {
            ctx.fillStyle = '#222';
            ctx.fill();
            ctx.strokeStyle = '#4b4b4b';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(-r * 0.25, -r * 0.25, r * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fill();
        } else if (type === 'white') {
            ctx.fillStyle = '#efe8da';
            ctx.fill();
            ctx.strokeStyle = '#c1b89f';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(-r * 0.25, -r * 0.25, r * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.fill();
        } else if (type === 'queen') {
            ctx.fillStyle = '#c02828';
            ctx.fill();
            ctx.strokeStyle = '#e06060';
            ctx.lineWidth = 1.4;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
            ctx.fillStyle = '#ff8f8f';
            ctx.fill();
        } else {
            ctx.fillStyle = '#d4a820';
            ctx.fill();
            ctx.strokeStyle = '#f0cc60';
            ctx.lineWidth = 1.4;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
            ctx.strokeStyle = '#9f7d10';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawPieces() {
        const { pieces, striker } = getState();
        for (const p of pieces) {
            drawOnePiece(p.position.x, p.position.y, PIECE_R, p.pieceType);
        }
        if (striker) {
            drawOnePiece(striker.position.x, striker.position.y, STRIKER_R, 'striker');
        }
    }

    function drawAimOverlay() {
        const {
            striker,
            phase,
            currentPlayer,
            isDragging,
            interactMode,
            dragCurrent,
            aimAnchor,
        } = getState();

        actx.clearRect(0, 0, S, S);
        if (!striker || phase !== PHASE.AIM) return;

        const by = currentPlayer === 1 ? BASELINE_BOTTOM : BASELINE_TOP;
        actx.save();
        actx.strokeStyle = 'rgba(255,220,80,0.18)';
        actx.lineWidth = 2;
        actx.beginPath();
        actx.moveTo(CX - BASELINE_HALF, by);
        actx.lineTo(CX + BASELINE_HALF, by);
        actx.stroke();
        actx.restore();

        if (!isDragging || interactMode !== 'aim' || !dragCurrent || !aimAnchor) return;

        const dx = dragCurrent.x - aimAnchor.x;
        const dy = dragCurrent.y - aimAnchor.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 6) return;

        const power = Math.min(dist / (INNER * 0.30), 1);
        ui.powerBar.style.width = (power * 100).toFixed(1) + '%';

        const nx = dx / dist;
        const ny = dy / dist;
        const sx = striker.position.x;
        const sy = striker.position.y;

        actx.save();
        actx.strokeStyle = 'rgba(255,230,100,0.55)';
        actx.lineWidth = 1.6;
        actx.setLineDash([7, 6]);
        actx.beginPath();
        actx.moveTo(sx, sy);
        actx.lineTo(sx + nx * INNER * 0.38, sy + ny * INNER * 0.38);
        actx.stroke();

        actx.setLineDash([]);
        actx.strokeStyle = 'rgba(255,170,40,0.55)';
        actx.beginPath();
        actx.moveTo(aimAnchor.x, aimAnchor.y);
        actx.lineTo(dragCurrent.x, dragCurrent.y);
        actx.stroke();

        actx.fillStyle = 'rgba(255,230,100,0.85)';
        actx.beginPath();
        actx.arc(sx + nx * STRIKER_R * 1.25, sy + ny * STRIKER_R * 1.25, 4.4, 0, Math.PI * 2);
        actx.fill();
        actx.restore();
    }

    function render() {
        ctx.clearRect(0, 0, S, S);
        drawBoard();
        drawPieces();
        drawAimOverlay();
    }

    return {
        render,
        drawAimOverlay,
    };
}

window.createCarromRenderer = createCarromRenderer;
