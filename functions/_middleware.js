// Cloudflare Pages Edge Middleware for Playing.co.in
// Protects direct access with password authentication & prevents search indexing

const MASTER_PASSWORD = "Goldwinner007#";
const AUTH_COOKIE_NAME = "cf_games_auth";
const AUTH_COOKIE_VALUE = "authenticated_7f8d6a9e1b2c"; // constant edge token

function isAuthorized(request) {
  const cookieHeader = request.headers.get("Cookie") || "";
  return cookieHeader.includes(`${AUTH_COOKIE_NAME}=${AUTH_COOKIE_VALUE}`);
}

function renderLoginPage(errorMessage = "") {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restricted Access - Playing.co.in Edge</title>
  <meta name="robots" content="noindex, nofollow, noarchive">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-[#0b0f19] text-white min-h-screen flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur">
    <div class="text-center mb-6">
      <div class="inline-flex items-center justify-center size-14 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-400 text-2xl mb-3">
        <i class="fa-solid fa-lock"></i>
      </div>
      <h1 class="text-xl font-bold tracking-tight text-white">Private Edge CDN</h1>
      <p class="text-xs text-slate-400 mt-1">Direct access to games.playing.co.in requires authorization.</p>
    </div>

    ${errorMessage ? `
    <div class="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs text-center font-medium">
      ${errorMessage}
    </div>` : ''}

    <form method="POST" action="" class="space-y-4">
      <div>
        <label for="password" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Access Password</label>
        <input type="password" id="password" name="auth_password" required autofocus
               placeholder="Enter password..."
               class="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm">
      </div>
      <div class="flex gap-3 pt-2">
        <button type="submit"
                class="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide uppercase transition shadow-lg shadow-blue-600/30">
          Unlock Access
        </button>
        <a href="https://playing.co.in"
           class="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition text-center flex items-center justify-center">
          Cancel
        </a>
      </div>
    </form>

    <div class="mt-6 pt-4 border-t border-slate-800 text-center">
      <p class="text-[11px] text-slate-500">Unauthenticated direct requests are redirected to <a href="https://playing.co.in" class="text-blue-400 hover:underline">playing.co.in</a>.</p>
    </div>
  </div>
</body>
</html>`, {
    status: 401,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet"
    }
  });
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // 1. Static sub-resources (images, scripts, styles, sounds, fonts) are always allowed directly for portal embedding
  if (path.match(/\.(webp|png|jpg|jpeg|gif|svg|ico|css|js|mp3|ogg|wav|json|txt|woff2?|eot|ttf)$/i)) {
    const res = await next();
    const h = new Headers(res.headers);
    h.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    h.set("Content-Security-Policy", "frame-ancestors 'self' https://playing.co.in http://localhost:8000;");
    return new Response(res.body, { status: res.status, headers: h });
  }

  // 2. Legitimate iframe embed requests from playing.co.in
  const referer = request.headers.get("Referer") || "";
  const secFetchDest = request.headers.get("Sec-Fetch-Dest");

  if (
    secFetchDest === "iframe" ||
    referer.includes("https://playing.co.in") ||
    referer.includes("http://localhost:8000")
  ) {
    const res = await next();
    const h = new Headers(res.headers);
    h.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    h.set("Content-Security-Policy", "frame-ancestors 'self' https://playing.co.in http://localhost:8000;");
    return new Response(res.body, { status: res.status, headers: h });
  }

  // 3. Direct browser navigation: Handle password submission
  if (method === "POST") {
    try {
      const formData = await request.formData();
      const enteredPassword = formData.get("auth_password");

      if (enteredPassword === MASTER_PASSWORD) {
        // Correct password: Set 30-day authentication cookie and reload current URL
        const redirectRes = Response.redirect(url.toString(), 302);
        const headers = new Headers(redirectRes.headers);
        headers.set(
          "Set-Cookie",
          `${AUTH_COOKIE_NAME}=${AUTH_COOKIE_VALUE}; Path=/; Max-Age=2592000; Secure; HttpOnly; SameSite=Lax`
        );
        headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
        return new Response(null, { status: 302, headers });
      } else {
        // Wrong password: redirect immediately to playing.co.in
        return Response.redirect("https://playing.co.in", 302);
      }
    } catch (e) {
      return Response.redirect("https://playing.co.in", 302);
    }
  }

  // Handle URL query password bypass ?auth=...
  if (url.searchParams.get("auth") === MASTER_PASSWORD) {
    const cleanUrl = new URL(url.toString());
    cleanUrl.searchParams.delete("auth");
    const redirectRes = Response.redirect(cleanUrl.toString(), 302);
    const headers = new Headers(redirectRes.headers);
    headers.set(
      "Set-Cookie",
      `${AUTH_COOKIE_NAME}=${AUTH_COOKIE_VALUE}; Path=/; Max-Age=2592000; Secure; HttpOnly; SameSite=Lax`
    );
    headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    return new Response(null, { status: 302, headers });
  }

  // 4. If already authenticated via cookie, serve the content
  if (isAuthorized(request)) {
    const res = await next();
    const h = new Headers(res.headers);
    h.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    h.set("Content-Security-Policy", "frame-ancestors 'self' https://playing.co.in http://localhost:8000;");
    return new Response(res.body, { status: res.status, headers: h });
  }

  // 5. Unauthenticated direct browser visit: Show login gate
  return renderLoginPage();
}
