/**
 * Playing.co.in Edge CDN HTTP Security Middleware
 * Executes at Cloudflare Edge Anycast network before any HTML/JS is served.
 * 
 * - Backend HTTP 302 redirection for direct browser navigation (cannot be bypassed by disabling JS)
 * - Allows authorized embedding inside iframes on playing.co.in
 * - Allows sub-resources (scripts, styles, audio, images)
 * - Allows admin bypass via ?auth=Goldwinner007# or authenticated cookie
 */

const CANONICAL_GAME_MAP = {
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

const ALLOWED_REFERER_PREFIXES = [
  'https://playing.co.in',
  'https://www.playing.co.in',
  'http://localhost:8000',
  'http://localhost:3000',
  'http://127.0.0.1:8000'
];

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const pathname = url.pathname.toLowerCase();

  // 1. Admin / Dev Passphrase Bypass (?auth=Goldwinner007# or cookie)
  const authQuery = url.searchParams.get('auth');
  const cookieHeader = request.headers.get('cookie') || '';
  const isAuthCookie = cookieHeader.includes('cf_games_auth=authenticated');

  if (authQuery === 'Goldwinner007#' || isAuthCookie) {
    const response = await context.next();
    if (authQuery === 'Goldwinner007#') {
      const newHeaders = new Headers(response.headers);
      newHeaders.append('Set-Cookie', 'cf_games_auth=authenticated; Path=/; Max-Age=2592000; Secure; SameSite=None');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    }
    return response;
  }

  // 2. Allow sub-resources (CSS, JS, images, audio, fonts)
  const secFetchDest = (request.headers.get('sec-fetch-dest') || '').toLowerCase();
  const isAssetDest = ['style', 'script', 'image', 'font', 'audio', 'video'].includes(secFetchDest);
  const isStaticAsset = /\.(css|js|png|jpg|jpeg|gif|webp|svg|ico|mp3|ogg|wav|json|woff|woff2|ttf|eot)$/i.test(pathname);

  if (isAssetDest || (isStaticAsset && !pathname.endsWith('.html'))) {
    return context.next();
  }

  // 3. Referer validation
  const referer = (request.headers.get('referer') || request.headers.get('referrer') || '').toLowerCase();
  const isAllowedReferer = ALLOWED_REFERER_PREFIXES.some(prefix => referer.startsWith(prefix));

  // If inside an iframe on playing.co.in
  const isIframe = secFetchDest === 'iframe';
  if (isAllowedReferer && (isIframe || secFetchDest === '' || secFetchDest === 'empty')) {
    return context.next();
  }

  // If self-referencing sub-page navigation inside the iframe
  if (referer.includes('games.playing.co.in') && !isIframe && secFetchDest !== 'document') {
    return context.next();
  }

  // 4. Determine canonical target for direct navigation
  const segments = pathname.split('/').filter(Boolean);
  const gameKey = segments[0] || '';

  if (gameKey) {
    if (CANONICAL_GAME_MAP[gameKey]) {
      return Response.redirect(CANONICAL_GAME_MAP[gameKey], 302);
    }
    return Response.redirect(`https://playing.co.in/game/${gameKey}`, 302);
  }

  // 5. Default direct access redirect to playing.co.in home
  return Response.redirect('https://playing.co.in/', 302);
}
