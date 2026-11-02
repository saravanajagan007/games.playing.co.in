<!-- =========================================================================
     Copyright (c) cloudcrafts.net - All Rights Reserved
     ========================================================================= -->

# games.playing.co.in Workspace Rules & Guidelines

Project-specific configuration for **games.playing.co.in** (First-Party Cloudflare Pages Edge Gaming CDN for Playing.co.in).  
This project-specific rules file inherits from and strictly adheres to:
- `P:\global-rules.md` (Master global rules file)

---

## Project Overview
* **Domain:** `https://games.playing.co.in`
* **Cloudflare Pages Dev URL:** `https://games-playing-co-in.pages.dev`
* **Cloudflare Pages Project:** `games-playing-co-in`
* **Account ID:** `15d3055b885e9a58448a34418c6ab56b` (Zone: `playing.co.in` / `0e7c598929dae8b0327e2abfbca8511e`)
* **Remote Repository:** `https://github.com/saravanajagan007/games.playing.co.in.git`
* **Architecture:** Static HTML5 / Canvas / WebGL open-source game assets and high-performance WebP artwork served directly from Cloudflare's Anycast Edge CDN with 0% load on the main VPS server.

---

## Directory Layout
* `/index.html`: Master Edge CDN showcase and health status hub.
* `/<game-slug>/index.html`: Standalone, self-contained HTML5 game entry point.
* `/<game-slug>/thumb.webp`: Standardized 512x384 / 250x150 responsive card thumbnail.

---

## Active Games (Batch 1 Pilot - 15 Titles)
1. `2048/` (Puzzle)
2. `hextris/` (Arcade)
3. `clumsy-bird/` (Hypercasual)
4. `pacman/` (Retro Arcade)
5. `sudoku/` (Brain / Puzzle)
6. `chess/` (Strategy Engine)
7. `snake/` (Classic Retro)
8. `asteroids/` (Space Shooter)
9. `breakout/` (Brick Breaker)
10. `solitaire/` (Klondike Card)
11. `minesweeper/` (Retro Puzzle)
12. `space-invaders/` (Shooting)
13. `tetris/` (Falling Blocks)
14. `connect-four/` (Strategy 4-in-a-row)
15. `pong/` (Sports Table Tennis)

---

## Deployment Workflow
To deploy updates to Cloudflare Pages:
```powershell
npx wrangler pages deploy . --project-name="games-playing-co-in" --commit-dirty=true
git add .
git commit -m "feat: add new games / updates"
git push origin main
```
