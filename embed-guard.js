/**
 * Playing.co.in Frame Enforcer & Admin Protection Gate
 * Allows iframe playback on playing.co.in
 * Protects direct access with password check; redirects wrong attempts to playing.co.in
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

  // 3. Direct access password challenge
  var entered = prompt("Playing.co.in Edge CDN - Restricted Access.\nPlease enter Admin Password:");
  if (entered === MASTER_PASS) {
    localStorage.setItem(AUTH_KEY, MASTER_PASS);
    document.cookie = "cf_games_auth=authenticated; path=/; max-age=2592000; secure";
    return; // Access granted
  } else {
    // Wrong password or cancelled -> Redirect immediately to playing.co.in
    window.location.replace("https://playing.co.in");
  }
})();
