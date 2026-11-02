// Cloudflare Pages Edge Middleware for Playing.co.in
// Automatically protects games from direct navigation and hotlinking

const slugMap = {
  '/': 'https://playing.co.in',
  '/2048/': 'https://playing.co.in/game/2048-classic',
  '/2048': 'https://playing.co.in/game/2048-classic',
  '/hextris/': 'https://playing.co.in/game/hextris',
  '/hextris': 'https://playing.co.in/game/hextris',
  '/clumsy-bird/': 'https://playing.co.in/game/clumsy-bird',
  '/clumsy-bird': 'https://playing.co.in/game/clumsy-bird',
  '/pacman/': 'https://playing.co.in/game/pacman-canvas',
  '/pacman': 'https://playing.co.in/game/pacman-canvas',
  '/sudoku/': 'https://playing.co.in/game/sudoku-master',
  '/sudoku': 'https://playing.co.in/game/sudoku-master',
  '/chess/': 'https://playing.co.in/game/chess-2d-engine',
  '/chess': 'https://playing.co.in/game/chess-2d-engine',
  '/snake/': 'https://playing.co.in/game/classic-snake',
  '/snake': 'https://playing.co.in/game/classic-snake',
  '/asteroids/': 'https://playing.co.in/game/asteroids-reloaded',
  '/asteroids': 'https://playing.co.in/game/asteroids-reloaded',
  '/breakout/': 'https://playing.co.in/game/breakout-dx',
  '/breakout': 'https://playing.co.in/game/breakout-dx',
  '/solitaire/': 'https://playing.co.in/game/klondike-solitaire',
  '/solitaire': 'https://playing.co.in/game/klondike-solitaire',
  '/minesweeper/': 'https://playing.co.in/game/minesweeper-classic',
  '/minesweeper': 'https://playing.co.in/game/minesweeper-classic',
  '/space-invaders/': 'https://playing.co.in/game/space-invaders',
  '/space-invaders': 'https://playing.co.in/game/space-invaders',
  '/tetris/': 'https://playing.co.in/game/tetris-blocks',
  '/tetris': 'https://playing.co.in/game/tetris-blocks',
  '/connect-four/': 'https://playing.co.in/game/connect-four',
  '/connect-four': 'https://playing.co.in/game/connect-four',
  '/pong/': 'https://playing.co.in/game/pong-classic',
  '/pong': 'https://playing.co.in/game/pong-classic',
};

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const secFetchDest = request.headers.get('sec-fetch-dest');

  // Allow static assets (images, css, js, audio) directly
  if (url.pathname.match(/\.(webp|png|jpg|jpeg|gif|svg|ico|css|js|mp3|ogg|wav|json|txt|woff2?|eot|ttf)$/i)) {
    return next();
  }

  // If a user navigates directly in their browser tab (Sec-Fetch-Dest: document)
  if (secFetchDest === 'document') {
    const target = slugMap[path] || slugMap[path + '/'];
    if (target) {
      return Response.redirect(target, 302);
    }
  }

  // Otherwise serve the request and enforce Content-Security-Policy headers
  const response = await next();
  const headers = new Headers(response.headers);
  headers.set('Content-Security-Policy', "frame-ancestors 'self' https://playing.co.in http://localhost:8000;");
  headers.set('X-Frame-Options', 'ALLOW-FROM https://playing.co.in');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
