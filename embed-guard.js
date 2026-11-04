/**
 * Playing.co.in Frame Enforcer & Arcade Runtime Enhancer
 * - Allows iframe playback on playing.co.in
 * - Injects universal mobile touch controls for HTML5 canvas elements
 * - Replaces blocking browser alerts with non-blocking arcade notifications
 * - Protects direct access with password check and 302 redirect
 */
(function() {
  // 1. Universal non-blocking arcade banner polyfill for window.alert
  var lastAlertTime = 0;
  window.alert = function(msg) {
    var now = Date.now();
    if (now - lastAlertTime < 1500) {
      console.log('Arcade Notice (throttled):', msg);
      return;
    }
    lastAlertTime = now;

    try {
      var existing = document.getElementById('cf-arcade-modal');
      if (existing) existing.remove();

      var modal = document.createElement('div');
      modal.id = 'cf-arcade-modal';
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:999999;font-family:system-ui,-apple-system,sans-serif;backdrop-filter:blur(2px);';
      
      var card = document.createElement('div');
      card.style.cssText = 'background:#1e293b;color:#f8fafc;padding:20px 28px;border-radius:14px;max-width:320px;width:85%;text-align:center;box-shadow:0 15px 35px rgba(0,0,0,0.5);border:1px solid #334155;';

      var text = document.createElement('div');
      text.style.cssText = 'font-size:16px;font-weight:600;margin-bottom:18px;line-height:1.4;color:#f1f5f9;';
      text.textContent = msg;

      var btn = document.createElement('button');
      btn.style.cssText = 'background:#2563eb;color:#fff;border:none;padding:8px 22px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;';
      btn.textContent = 'OK';
      btn.onclick = function() { modal.remove(); };

      card.appendChild(text);
      card.appendChild(btn);
      modal.appendChild(card);
      (document.body || document.documentElement).appendChild(modal);

      setTimeout(function() {
        if (modal.parentNode) modal.remove();
      }, 3500);
    } catch(e) {
      console.log('Arcade Notice:', msg);
    }
  };

  // 2. Universal Touch-to-Mouse bridge for all Canvas elements
  function attachCanvasTouchBridge() {
    var canvases = document.querySelectorAll('canvas');
    canvases.forEach(function(canvas) {
      if (canvas.dataset.touchBridged) return;
      canvas.dataset.touchBridged = 'true';

      function dispatchMouse(touch, eventName) {
        var rect = canvas.getBoundingClientRect();
        var mouseEvent = new MouseEvent(eventName, {
          clientX: touch.clientX,
          clientY: touch.clientY,
          screenX: touch.screenX,
          screenY: touch.screenY,
          bubbles: true,
          cancelable: true,
          view: window
        });
        canvas.dispatchEvent(mouseEvent);
      }

      canvas.addEventListener('touchstart', function(e) {
        if (e.touches.length > 0) {
          dispatchMouse(e.touches[0], 'mousedown');
        }
      }, { passive: false });

      canvas.addEventListener('touchmove', function(e) {
        if (e.touches.length > 0) {
          e.preventDefault(); // Lock viewport from scrolling on swipe
          dispatchMouse(e.touches[0], 'mousemove');
        }
      }, { passive: false });

      canvas.addEventListener('touchend', function(e) {
        var t = e.changedTouches[0] || e.touches[0];
        if (t) {
          dispatchMouse(t, 'mouseup');
        }
      }, { passive: false });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachCanvasTouchBridge);
  } else {
    attachCanvasTouchBridge();
  }
  window.addEventListener('load', attachCanvasTouchBridge);

  // 3. Allow normal playback inside Playing.co.in iframe
  try {
    if (window.self !== window.top) {
      return; // Framed inside portal -> allow game immediately
    }
  } catch (e) {
    // Cross-origin restriction triggered -> definitely inside iframe -> allow
    return;
  }

  // 4. Check if already authenticated for direct CDN inspection
  var MASTER_PASS = "Goldwinner007#";
  var AUTH_KEY = "cf_admin_edge_auth";

  try {
    if (
      localStorage.getItem(AUTH_KEY) === MASTER_PASS ||
      document.cookie.indexOf("cf_games_auth=authenticated") !== -1
    ) {
      return; // Authorized administrator
    }
  } catch (e) {}

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
  var target = CANONICAL_MAP[game] || (game ? ('https://playing.co.in/game/' + game) : 'https://playing.co.in');

  // 5. Direct access password challenge
  var entered = prompt("Playing.co.in Edge CDN - Restricted Access.\nPlease enter Admin Password:");
  if (entered === MASTER_PASS) {
    try {
      localStorage.setItem(AUTH_KEY, MASTER_PASS);
      document.cookie = "cf_games_auth=authenticated; path=/; max-age=2592000; secure";
    } catch (e) {}
    return; // Access granted
  } else {
    // Wrong password or cancelled -> Redirect immediately to canonical URL
    window.location.replace(target);
  }
})();
