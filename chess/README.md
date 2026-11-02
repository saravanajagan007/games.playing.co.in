# Chess vs AI

A browser-based chess game built from scratch with vanilla HTML, CSS, and JavaScript. No frameworks, no libraries, no dependencies — just open `index.html` and play.

Built by **Naty Games**.

---

## Features

- **Minimax AI** with alpha-beta pruning and piece-square table evaluation
- **3 difficulty levels** — Easy, Medium, Hard
- **Full rule support** — castling, en passant, pawn promotion with piece selection
- **Move history** in standard algebraic notation
- **Undo** — rolls back your move and the AI's response together
- **Flip board** — play from either side
- **Evaluation bar** — live position score
- **Sound effects** — move, capture, check, and checkmate via Web Audio API
- **Dark mode** — toggles and remembers your preference
- **Play as black or white** — AI always takes the other side

---

## Getting Started

No installation needed.

```bash
git clone https://github.com/natygames/chess-vs-ai.git
cd chess-vs-ai
```

Then open `index.html` in any modern browser.

---

## Project Structure

```
chess-vs-ai/
├── index.html    # Markup and layout
├── styles.css    # All styling, theming, dark mode
└── index.js      # Game logic, AI, move generation
```

---

## How the AI Works

The AI uses the **minimax algorithm** with **alpha-beta pruning** to search ahead and pick the best move.

- **Depth 1** (Easy) — looks 1 move ahead
- **Depth 2** (Medium) — looks 2 moves ahead
- **Depth 3** (Hard) — looks 3 moves ahead with pruning

Positions are evaluated using material count plus **piece-square tables** — bonuses and penalties that push pieces toward good squares (center control for knights, open files for rooks, etc).

---

## Controls

| Action | How |
|---|---|
| Select a piece | Click it |
| Move | Click a highlighted square |
| Undo | Undo Move button |
| Flip board | Flip Board button |
| New game | New Game button |
| Dark mode | Sun/moon icon in header |

---

## Browser Support

Works in any modern browser that supports ES6 and the Web Audio API — Chrome, Firefox, Safari, Edge.

---

## License

MIT — do whatever you want with it.

---

*Naty Games*

---

## Features

- Minimax AI
- Drag and Drop
- Dark Mode

