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

---

## Mandatory Open-Source Game Sanitization Standard (Pre-Upload Checklist)
Whenever an open-source or HTML5 game is added or updated in the repository, the following audit checklist MUST be performed before committing or deploying:

1. **Delete Debug, Dev & Test Files:**
   - Remove all auxiliary debug/test files (e.g. `*debug*.html`, `*dev*.html`, `*test*.html`, `*ios*.html`, `.git`, `.github`). Only production game files and assets must remain.

2. **Strip Source Code Downloads & Repository Links:**
   - Delete all source zip archives (e.g. `*.zip`, `*.tar.gz`).
   - Remove all UI links or buttons offering source code downloads (e.g. "Download Source Code", "Download Zip", "Fork on GitHub", "View Repository").

3. **Sanitize Author Credits & External Links:**
   - Convert all outward hyperlinks (`<a href="http...">Author</a>`, personal portfolios, blogs, social media) to clean, static plain text (e.g. `<span>Author Name</span>`).
   - Strip GitHub corner ribbons, "More Games" links, author demos/experiments links, and donation buttons (PayPal, Buy Me a Coffee).
   - Strip mobile store badges and outward app redirects (Google Play, Apple App Store).

4. **Eliminate Foreign Ads & Third-Party Analytics:**
   - Remove any hardcoded third-party Google AdSense tags (`ca-pub-*`, `adsbygoogle`), foreign Google Analytics scripts (`UA-*`, `G-*`), or tracking telemetry (e.g. `a.js`, Facebook Pixel, AddThis).

5. **Security & Embed Guard Requirement:**
   - Every game entry file (`index.html`) MUST include `<script src="/embed-guard.js"></script>` at the top of the `<head>` section to enforce iframe-only embedding within `playing.co.in`.
   - All assets (scripts, stylesheets, fonts) must use HTTPS or local relative paths (no mixed-content `http://`).

6. **Pre-Deployment Verification Audit:**
   - Before deploying, run a regex scan across all HTML and JS files for outward URLs (`href="http`, `window.open`, `.zip`, `debug`) to guarantee 100% compliance.
