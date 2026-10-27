// Zi'Dara's service worker. It keeps the site's shell, the fonts, the
// Characters page and every rules page on the phone, so sheets and rules open
// with no signal. scripts/build-sw.mjs fills in the version and the list of
// files after each build, and writes the result to dist/sw.js.
const VERSION = "__VERSION__";
const PRECACHE = __PRECACHE__;
const CACHE = `zi-${VERSION}`;
const OFFLINE = `<!doctype html><html lang="en-NZ"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Offline · Zi’Dara</title>
<style>body{margin:0;padding:2rem 1rem;font:18px/1.6 system-ui,sans-serif;background:#120d18;color:#f0e9f6}main{max-width:32rem;margin:0 auto}a{color:#b596f5}</style></head>
<body><main><h1>You’re offline</h1><p>This page isn’t saved on this phone yet. Your characters and the rules are, so carry on with those.</p><p><a href="/characters/">Characters</a> · <a href="/rules/">The rules</a></p></main></body></html>`;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(PRECACHE);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // The maps' pictures (zi-maps) are the account's, kept by the Characters
    // page itself, so a new version of the site leaves them be.
    for (const key of await caches.keys()) if (key.startsWith("zi-") && key !== CACHE && key !== "zi-maps") await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Sign-in and accounts (/api/) always go to the site, never to a saved copy.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/pagefind/") || url.pathname.startsWith("/api/")) return;
  if (req.mode === "navigate") event.respondWith(page(req, url));
  else if (url.pathname.startsWith("/_astro/")) event.respondWith(kept(req));
  else event.respondWith(fresh(req));
});

const wait = (ms) => new Promise((done) => setTimeout(done, ms));

// Pages: the newest copy when there's signal, the saved one when there isn't
// or the signal's too slow, so the rules never fall behind for long.
async function page(req, url) {
  const cache = await caches.open(CACHE);
  const key = url.pathname.endsWith("/") || url.pathname.includes(".") ? url.pathname : `${url.pathname}/`;
  const network = fetch(req).then((res) => {
    if (res.ok && res.type === "basic" && !res.redirected) cache.put(key, res.clone());
    return res;
  });
  const saved = await cache.match(key);
  if (!saved) return network.catch(() => new Response(OFFLINE, { status: 503, headers: { "content-type": "text/html; charset=utf-8" } }));
  return Promise.race([network.catch(() => saved), wait(3000).then(() => saved)]);
}

// Built files have their hash in the name, so a saved copy is always right.
async function kept(req) {
  const cache = await caches.open(CACHE);
  const saved = await cache.match(req);
  if (saved) return saved;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

// Everything else: the saved copy straight away, refreshed in the background.
async function fresh(req) {
  const cache = await caches.open(CACHE);
  const saved = await cache.match(req, { ignoreSearch: true });
  const network = fetch(req).then((res) => {
    if (res.ok && res.type === "basic") cache.put(req, res.clone());
    return res;
  }).catch(() => saved || Response.error());
  return saved || network;
}
