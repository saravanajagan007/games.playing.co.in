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
    'space-rocks-2': 'https://playing.co.in/game/space-rocks-2',
    'galaga-assault': 'https://playing.co.in/game/galaga-assault',
    'brick-breaker-dx': 'https://playing.co.in/game/brick-breaker-dx',
    'dig-dug-underground': 'https://playing.co.in/game/dig-dug-underground',
    'pong-2player': 'https://playing.co.in/game/pong-2player',
    'centipede-retro': 'https://playing.co.in/game/centipede-retro',
    'qbert-jumper': 'https://playing.co.in/game/qbert-jumper',
    'pentris-deluxe': 'https://playing.co.in/game/pentris-deluxe',
    'retro-racing-2d': 'https://playing.co.in/game/retro-racing-2d',
    'pinball-arcade': 'https://playing.co.in/game/pinball-arcade',
    'boulder-dash': 'https://playing.co.in/game/boulder-dash',
    'tron-light-cycles': 'https://playing.co.in/game/tron-light-cycles',
    'snake-3310': 'https://playing.co.in/game/snake-3310',
    'missile-command': 'https://playing.co.in/game/missile-command',
    'lunar-lander': 'https://playing.co.in/game/lunar-lander',
    'duck-hunt': 'https://playing.co.in/game/duck-hunt',
    'bubble-shooter': 'https://playing.co.in/game/bubble-shooter',
    'frogger-classic': 'https://playing.co.in/game/frogger-classic',
    'flappy-bird': 'https://playing.co.in/game/flappy-bird',
    'dino-runner': 'https://playing.co.in/game/dino-runner',
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
