/**
 * Playing.co.in Frame Enforcer
 * Prevents standalone execution outside of Playing.co.in portal iframe.
 */
(function() {
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
