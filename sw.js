// Service worker: serves pages and audio from the cache so the site works offline.
// The cache itself is filled by offline.js (the download panel on the home page).
const CACHE = "dutch-lessons";
const FONT_CACHE = "dutch-lessons-fonts";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // The downloader asks for fresh copies with cache: "reload"/"no-store" — let those hit the network.
    if (req.cache === "reload" || req.cache === "no-store") return;
    e.respondWith(req.mode === "navigate" ? networkFirst(req) : cacheFirst(req));
  } else if (/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(fontFirst(req));
  }
});

// Pages: try the network briefly (to pick up new lessons), fall back to the cached copy.
async function networkFirst(req) {
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000)),
    ]);
    if (res.ok && res.type === "basic" && !res.redirected && !new URL(req.url).search) {
      const cache = await caches.open(CACHE);
      cache.put(req.url, res.clone());
    }
    return res;
  } catch {
    return (await cachedPage(req.url)) || Response.error();
  }
}

async function cachedPage(href) {
  const url = new URL(href);
  url.search = "";
  const tries = [url.href];
  if (url.pathname.endsWith("/index.html")) tries.push(url.href.replace(/index\.html$/, ""));
  else if (!url.pathname.endsWith("/")) tries.push(url.href + "/");
  tries.push(new URL("./", self.registration.scope).href); // last resort: the lesson list
  for (const t of tries) {
    const hit = await caches.match(t);
    if (hit) return hit;
  }
  return null;
}

// Audio and other files: cached copy first. Safari's <audio> asks for byte ranges and
// refuses to play a plain 200 from a service worker, so answer those with a 206.
async function cacheFirst(req) {
  const hit = await caches.match(req.url, { ignoreSearch: true });
  if (hit) return req.headers.has("range") ? rangeResponse(hit, req.headers.get("range")) : hit;
  try {
    return await fetch(req);
  } catch {
    return Response.error(); // the page's speak() then falls back to speechSynthesis
  }
}

async function rangeResponse(res, header) {
  const buf = await res.arrayBuffer();
  const size = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(header) || [];
  let start = m[1] ? Number(m[1]) : 0;
  let end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  if (!m[1] && m[2]) { start = Math.max(0, size - Number(m[2])); end = size - 1; } // "bytes=-500"
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
    },
  });
}

// Google Fonts: keep whatever we've fetched; offline the pages fall back to system fonts anyway.
async function fontFirst(req) {
  const hit = await caches.match(req.url);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok && res.type !== "opaque") (await caches.open(FONT_CACHE)).put(req.url, res.clone());
    return res;
  } catch {
    return Response.error();
  }
}
