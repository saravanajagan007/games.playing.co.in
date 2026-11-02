/**
 * Playing.co.in Frame Enforcer
 * Bounces unauthorized direct visitors to playing.co.in
 * Allows authenticated administrators with cf_games_auth cookie
 */
(function() {
  if (document.cookie.indexOf("cf_games_auth=") !== -1) {
    return; // Authorized administrator
  }

  if (window.top === window.self) {
    var p = window.location.pathname.replace(/^\/|\/$/g, '');
    var map = {
      '': 'https://playing.co.in',
      '2048': '2048-classic',
      'hextris': 'hextris',
      'clumsy-bird': 'clumsy-bird',
      'pacman': 'pacman-canvas',
      'sudoku': 'sudoku-master',
      'chess': 'chess-2d-engine',
      'snake': 'classic-snake',
      'asteroids': 'asteroids-reloaded',
      'breakout': 'breakout-dx',
      'solitaire': 'klondike-solitaire',
      'minesweeper': 'minesweeper-classic',
      'space-invaders': 'space-invaders',
      'tetris': 'tetris-blocks',
      'connect-four': 'connect-four',
      'pong': 'pong-classic'
    };
    var target = map[p];
    if (target) {
      if (target.indexOf('http') === 0) {
        window.location.replace(target);
      } else {
        window.location.replace('https://playing.co.in/game/' + target);
      }
    }
  }
})();
