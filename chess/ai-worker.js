// ============================================================
// AI Worker — Chess vs AI | Naty Games
// Runs Minimax + Alpha-Beta with Move Ordering off the main thread
// ============================================================

'use strict';

// ────────────────────────────────────────
// PIECE HELPERS
// ────────────────────────────────────────

const isWhite  = p => p && p === p.toUpperCase();
const isBlack  = p => p && p === p.toLowerCase();
const colorOf  = p => p ? (isWhite(p) ? 'w' : 'b') : null;
const inBounds = (r,c) => r >= 0 && r < 8 && c >= 0 && c < 8;

// ────────────────────────────────────────
// PIECE VALUES + TABLES
// ────────────────────────────────────────

const PIECE_VALUE = { p:100, n:320, b:330, r:500, q:900, k:20000 };

const PIECE_TABLES = {
  p: [
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [ 5,  5, 10, 25, 25, 10,  5,  5],
    [ 0,  0,  0, 20, 20,  0,  0,  0],
    [ 5, -5,-10,  0,  0,-10, -5,  5],
    [ 5, 10, 10,-20,-20, 10, 10,  5],
    [ 0,  0,  0,  0,  0,  0,  0,  0]
  ],
  n: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ],
  b: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ],
  r: [
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [ 0,  0,  0,  5,  5,  0,  0,  0]
  ],
  q: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [ -5,  0,  5,  5,  5,  5,  0, -5],
    [  0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
  ],
  k: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [ 20, 20,  0,  0,  0,  0, 20, 20],
    [ 20, 30, 10,  0,  0, 10, 30, 20]
  ]
};

// ────────────────────────────────────────
// MOVE GENERATION  (identical to main thread)
// ────────────────────────────────────────

function rawMoves(board, r, c, enPassant) {
  const p = board[r][c];
  if (!p) return [];
  const moves = [];
  const add = (nr, nc) => { if (inBounds(nr, nc)) moves.push([nr, nc]); };
  const type = p.toLowerCase();
  const mine = colorOf(p);

  if (type === 'p') {
    const dir  = isWhite(p) ? -1 : 1;
    const start = isWhite(p) ? 6 : 1;
    if (inBounds(r+dir, c) && !board[r+dir][c]) {
      add(r+dir, c);
      if (r === start && !board[r+dir][c] && !board[r+2*dir][c]) add(r+2*dir, c);
    }
    for (const dc of [-1, 1]) {
      if (inBounds(r+dir, c+dc)) {
        const t = board[r+dir][c+dc];
        if (t && colorOf(t) !== mine) add(r+dir, c+dc);
        if (enPassant && enPassant[0] === r+dir && enPassant[1] === c+dc) add(r+dir, c+dc);
      }
    }
  }

  if (type === 'n') {
    for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      const nr = r+dr, nc = c+dc;
      if (inBounds(nr,nc) && colorOf(board[nr][nc]) !== mine) add(nr, nc);
    }
  }

  if (type === 'b' || type === 'q') {
    for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
      let nr=r+dr, nc=c+dc;
      while (inBounds(nr,nc)) {
        if (colorOf(board[nr][nc]) === mine) break;
        add(nr, nc);
        if (board[nr][nc]) break;
        nr+=dr; nc+=dc;
      }
    }
  }

  if (type === 'r' || type === 'q') {
    for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      let nr=r+dr, nc=c+dc;
      while (inBounds(nr,nc)) {
        if (colorOf(board[nr][nc]) === mine) break;
        add(nr, nc);
        if (board[nr][nc]) break;
        nr+=dr; nc+=dc;
      }
    }
  }

  if (type === 'k') {
    for (const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      const nr=r+dr, nc=c+dc;
      if (inBounds(nr,nc) && colorOf(board[nr][nc]) !== mine) add(nr, nc);
    }
  }

  return moves;
}

function isAttacked(board, r, c, byColor) {
  for (let rr=0; rr<8; rr++) for (let cc=0; cc<8; cc++) {
    const p = board[rr][cc];
    if (p && colorOf(p) === byColor) {
      if (rawMoves(board, rr, cc, null).some(([mr,mc]) => mr===r && mc===c)) return true;
    }
  }
  return false;
}

function findKing(board, col) {
  const king = col === 'w' ? 'K' : 'k';
  for (let r=0; r<8; r++) for (let c=0; c<8; c++) if (board[r][c] === king) return [r,c];
  return null;
}

function inCheck(board, col) {
  const pos = findKing(board, col);
  if (!pos) return false;
  return isAttacked(board, pos[0], pos[1], col === 'w' ? 'b' : 'w');
}

function applyMove(board, fr, fc, tr, tc, enPassant, castling, promoChoice) {
  const nb = board.map(row => [...row]);
  const p  = nb[fr][fc];
  const newCast = { ...castling };
  let newEp = null;

  if (p === 'P' && fr === 6 && tr === 4) newEp = [5, fc];
  if (p === 'p' && fr === 1 && tr === 3) newEp = [2, fc];

  if (p === 'K') { newCast.wK = false; newCast.wQ = false; }
  if (p === 'k') { newCast.bK = false; newCast.bQ = false; }
  if (fr===7 && fc===0) newCast.wQ = false;
  if (fr===7 && fc===7) newCast.wK = false;
  if (fr===0 && fc===0) newCast.bQ = false;
  if (fr===0 && fc===7) newCast.bK = false;

  if (p === 'K' && fc===4 && tc===6) { nb[7][5]=nb[7][7]; nb[7][7]=null; }
  if (p === 'K' && fc===4 && tc===2) { nb[7][3]=nb[7][0]; nb[7][0]=null; }
  if (p === 'k' && fc===4 && tc===6) { nb[0][5]=nb[0][7]; nb[0][7]=null; }
  if (p === 'k' && fc===4 && tc===2) { nb[0][3]=nb[0][0]; nb[0][0]=null; }

  if (enPassant && (p==='P'||p==='p') && tr===enPassant[0] && tc===enPassant[1]) {
    nb[fr][tc] = null;
  }

  nb[tr][tc] = p;
  nb[fr][fc] = null;

  if (p === 'P' && tr === 0) nb[tr][tc] = promoChoice || 'Q';
  if (p === 'p' && tr === 7) nb[tr][tc] = promoChoice || 'q';

  return { nb, newEp, newCast };
}

function getLegalMoves(board, r, c, enPassant, castling) {
  const p = board[r][c];
  if (!p) return [];
  const mine = colorOf(p);
  const type = p.toLowerCase();
  const moves = rawMoves(board, r, c, enPassant);
  const legal = [];

  if (type === 'k') {
    const opp = mine === 'w' ? 'b' : 'w';
    if (mine==='w' && castling.wK && !board[7][5] && !board[7][6] && !inCheck(board,'w') && !isAttacked(board,7,5,opp) && !isAttacked(board,7,6,opp)) legal.push([7,6]);
    if (mine==='w' && castling.wQ && !board[7][3] && !board[7][2] && !board[7][1] && !inCheck(board,'w') && !isAttacked(board,7,3,opp) && !isAttacked(board,7,2,opp)) legal.push([7,2]);
    if (mine==='b' && castling.bK && !board[0][5] && !board[0][6] && !inCheck(board,'b') && !isAttacked(board,0,5,'w') && !isAttacked(board,0,6,'w')) legal.push([0,6]);
    if (mine==='b' && castling.bQ && !board[0][3] && !board[0][2] && !board[0][1] && !inCheck(board,'b') && !isAttacked(board,0,3,'w') && !isAttacked(board,0,2,'w')) legal.push([0,2]);
  }

  for (const [tr,tc] of moves) {
    const { nb } = applyMove(board, r, c, tr, tc, enPassant, castling);
    if (!inCheck(nb, mine)) legal.push([tr, tc]);
  }

  return legal;
}

function allLegalMoves(board, col, enPassant, castling) {
  const moves = [];
  for (let r=0; r<8; r++) for (let c=0; c<8; c++) {
    if (board[r][c] && colorOf(board[r][c]) === col) {
      for (const [tr,tc] of getLegalMoves(board, r, c, enPassant, castling)) {
        moves.push([r, c, tr, tc]);
      }
    }
  }
  return moves;
}

// ────────────────────────────────────────
// EVALUATION
// ────────────────────────────────────────

function evaluate(board) {
  let score = 0;
  for (let r=0; r<8; r++) for (let c=0; c<8; c++) {
    const p = board[r][c];
    if (!p) continue;
    const type  = p.toLowerCase();
    const val   = PIECE_VALUE[type];
    const table = PIECE_TABLES[type];
    const tval  = isWhite(p) ? table[r][c] : table[7-r][c];
    score += isWhite(p) ? (val + tval) : -(val + tval);
  }
  return score;
}

// ────────────────────────────────────────
// MOVE ORDERING
//
// Sort moves so captures & promotions are searched first.
// This dramatically increases alpha-beta cutoffs.
//
// Priority (higher = searched first):
//   1. Promotions          (+10000)
//   2. Captures by MVV-LVA (+victim_value - attacker_value/100)
//   3. Checks              (+500)   — detected cheaply via king proximity
//   4. Center moves        (small bonus)
//   5. Quiet moves         (0)
// ────────────────────────────────────────

function scoreMoveForOrdering(board, fr, fc, tr, tc, enPassant) {
  let priority = 0;
  const piece    = board[fr][fc];
  const target   = board[tr][tc];
  const type     = piece.toLowerCase();

  // Promotion
  if ((piece === 'P' && tr === 0) || (piece === 'p' && tr === 7)) {
    priority += 10000;
  }

  // Capture (MVV-LVA: Most Valuable Victim - Least Valuable Attacker)
  if (target) {
    const victimVal   = PIECE_VALUE[target.toLowerCase()] || 0;
    const attackerVal = PIECE_VALUE[type] || 0;
    // Capturing a queen with a pawn = 900 - 1 = 899 (great)
    // Capturing a pawn with a queen = 100 - 9 = 91 (less great, but still a capture)
    priority += 5000 + victimVal - (attackerVal / 100);
  }

  // En passant capture
  if (enPassant && (piece === 'P' || piece === 'p') &&
      tr === enPassant[0] && tc === enPassant[1]) {
    priority += 5100; // pawn capture value
  }

  // Center control bonus (subtle tiebreaker for quiet moves)
  if (tr >= 2 && tr <= 5 && tc >= 2 && tc <= 5) {
    priority += 10;
    if (tr >= 3 && tr <= 4 && tc >= 3 && tc <= 4) {
      priority += 10;
    }
  }

  return priority;
}

function orderMoves(board, moves, enPassant) {
  // Annotate each move with a sort score, then sort descending
  const scored = moves.map(m => ({
    m,
    s: scoreMoveForOrdering(board, m[0], m[1], m[2], m[3], enPassant)
  }));
  scored.sort((a, b) => b.s - a.s);
  return scored.map(x => x.m);
}

// ────────────────────────────────────────
// MINIMAX  (with Move Ordering)
// ────────────────────────────────────────

function minimax(board, depth, alpha, beta, maximizing, enPassant, castling) {
  const col = maximizing ? 'w' : 'b';
  if (depth === 0) return evaluate(board);

  let moves = allLegalMoves(board, col, enPassant, castling);
  if (moves.length === 0) {
    if (inCheck(board, col)) return maximizing ? -99999 : 99999;
    return 0;
  }

  // ★ Move Ordering: sort captures/promotions first for better cutoffs
  moves = orderMoves(board, moves, enPassant);

  if (maximizing) {
    let best = -Infinity;
    for (const [fr,fc,tr,tc] of moves) {
      const { nb, newEp, newCast } = applyMove(board, fr, fc, tr, tc, enPassant, castling);
      best = Math.max(best, minimax(nb, depth-1, alpha, beta, false, newEp, newCast));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const [fr,fc,tr,tc] of moves) {
      const { nb, newEp, newCast } = applyMove(board, fr, fc, tr, tc, enPassant, castling);
      best = Math.min(best, minimax(nb, depth-1, alpha, beta, true, newEp, newCast));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

// ────────────────────────────────────────
// WORKER MESSAGE HANDLER
// ────────────────────────────────────────

self.onmessage = function(e) {
  const { board, playerColor, depth, enPassant, castling } = e.data;

  const aiCol = playerColor === 'w' ? 'b' : 'w';
  const moves = allLegalMoves(board, aiCol, enPassant, castling);

  if (!moves.length) {
    self.postMessage({ bestMove: null, score: 0 });
    return;
  }

  // Order root moves too
  const orderedMoves = orderMoves(board, moves, enPassant);

  let bestScore = -Infinity;
  let bestMove  = null;

  for (const [fr,fc,tr,tc] of orderedMoves) {
    const { nb, newEp, newCast } = applyMove(board, fr, fc, tr, tc, enPassant, castling);
    const score = aiCol === 'b'
      ? -minimax(nb, depth-1, -Infinity, Infinity, true, newEp, newCast)
      :  minimax(nb, depth-1, -Infinity, Infinity, false, newEp, newCast);

    if (score > bestScore) {
      bestScore = score;
      bestMove  = { from: [fr, fc], to: [tr, tc] };
    }
  }

  self.postMessage({ bestMove, score: bestScore });
};
