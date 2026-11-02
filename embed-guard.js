/**
 * Playing.co.in Frame Enforcer & Fallback Protection Gate
 * Allows iframe playback on playing.co.in
 * Protects direct access with password check; redirects unauthorized attempts to canonical playing.co.in game URL
 */
(function() {
  // 1. Allow normal playback inside Playing.co.in iframe
  if (window.top !== window.self) {
    return;
  }

  // 2. Check if already authenticated
  var MASTER_PASS = "Goldwinner007#";
  var AUTH_KEY = "cf_admin_edge_auth";

  if (
    localStorage.getItem(AUTH_KEY) === MASTER_PASS ||
    document.cookie.indexOf("cf_games_auth=authenticated") !== -1
  ) {
    return; // Authorized administrator
  }

  var CANONICAL_MAP = {
    'snake': 'https://playing.co.in/game/classic-snake',
    'space-invaders': 'https://playing.co.in/game/space-invaders',
    '2048': 'https://playing.co.in/game/2048-classic',
    'hextris': 'https://playing.co.in/game/hextris',
    'clumsy-bird': 'https://playing.co.in/game/clumsy-bird',
    'pacman': 'https://playing.co.in/game/pacman-canvas',
    'sudoku': 'https://playing.co.in/game/sudoku-master',
    'chess': 'https://playing.co.in/game/chess-2d-engine',
    'asteroids': 'https://playing.co.in/game/asteroids-reloaded',
    'breakout': 'https://playing.co.in/game/breakout-dx',
    'solitaire': 'https://playing.co.in/game/klondike-solitaire',
    'minesweeper': 'https://playing.co.in/game/minesweeper-classic',
    'tetris': 'https://playing.co.in/game/tetris-blocks',
    'connect-four': 'https://playing.co.in/game/connect-four',
    'pong': 'https://playing.co.in/game/pong-classic'
  };

  var path = window.location.pathname.toLowerCase().split('/').filter(Boolean);
  var game = path[0] || '';
  var target = CANONICAL_MAP[game] || 'https://playing.co.in';

  // 3. Direct access password challenge
  var entered = prompt("Playing.co.in Edge CDN - Restricted Access.\nPlease enter Admin Password:");
  if (entered === MASTER_PASS) {
    localStorage.setItem(AUTH_KEY, MASTER_PASS);
    document.cookie = "cf_games_auth=authenticated; path=/; max-age=2592000; secure";
    return; // Access granted
  } else {
    // Wrong password or cancelled -> Redirect immediately to canonical URL
    window.location.replace(target);
  }
})();
