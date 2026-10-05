// Offline support, included by every page.
// - Registers the service worker (sw.js), which serves pages and audio from the cache.
// - On the home page (#offline panel), downloads every file listed in offline-files.json
//   into the cache, re-fetching only files whose hash changed since the last download.
(function () {
  if (!("serviceWorker" in navigator) || !location.protocol.startsWith("http")) return; // file:// works as-is
  const BASE = new URL(".", document.currentScript.src); // site root, wherever the page lives
  const CACHE = "dutch-lessons";
  const FONT_CACHE = "dutch-lessons-fonts";
  const REVS = new URL("__offline-revs__", BASE).href; // cached {path: hash} of what we have
  const CONCURRENCY = 6;

  navigator.serviceWorker.register(new URL("sw.js", BASE)).catch(() => {});

  const panel = document.getElementById("offline");
  if (!panel) return;
  const statusEl = panel.querySelector(".offline-status");
  const bar = panel.querySelector(".offline-bar span");
  const btn = panel.querySelector("button");
  const hint = panel.querySelector(".offline-hint");
  panel.hidden = false;
  // On iPhone the Home Screen app has its own storage, separate from Safari: download there.
  if (navigator.standalone === false && /iPhone|iPad/.test(navigator.userAgent)) hint.hidden = false;

  function show(text, done, total, state) {
    statusEl.textContent = text;
    bar.style.width = total ? (100 * done / total).toFixed(1) + "%" : "0";
    panel.dataset.state = state;
  }

  async function sync() {
    btn.hidden = true;
    let manifest;
    try {
      manifest = await (await fetch(new URL("offline-files.json", BASE), { cache: "no-store" })).json();
    } catch {
      const cache = await caches.open(CACHE);
      const revs = await cache.match(REVS);
      const have = revs ? Object.keys(await revs.json()).length : 0;
      return show(have ? `Offline · ${have} files saved on this device` : "Offline — connect once to download the lessons", 1, 1, have ? "ready" : "error");
    }
    const cache = await caches.open(CACHE);
    const old = await cache.match(REVS);
    const revs = old ? await old.json() : {};
    const keys = new Set((await cache.keys()).map(r => r.url));
    const entries = Object.entries(manifest.files);
    const urlOf = path => new URL(path, BASE).href;
    const todo = entries.filter(([p, h]) => revs[p] !== h || !keys.has(urlOf(p)));

    // Drop files that are no longer part of the site.
    const wanted = new Set(entries.map(([p]) => urlOf(p)).concat(REVS));
    for (const k of keys) if (!wanted.has(k)) await cache.delete(k);
    for (const p of Object.keys(revs)) if (!(p in manifest.files)) delete revs[p];

    const total = entries.length;
    let done = total - todo.length, failed = 0, sinceSave = 0;
    const saveRevs = () => cache.put(REVS, new Response(JSON.stringify(revs), { headers: { "Content-Type": "application/json" } }));
    if (todo.length) show(`Downloading for offline… ${done} / ${total}`, done, total, "busy");

    let next = 0;
    async function worker() {
      while (next < todo.length) {
        const [path, hash] = todo[next++];
        let ok = false;
        for (let attempt = 0; attempt < 3 && !ok; attempt++) {
          try {
            const res = await fetch(urlOf(path), { cache: "reload" });
            if (!res.ok) throw new Error(res.status);
            await cache.put(urlOf(path), res);
            revs[path] = hash;
            ok = true;
          } catch { /* retry */ }
        }
        if (ok) done++; else failed++;
        if (++sinceSave >= 50) { sinceSave = 0; await saveRevs(); } // so an interrupted download resumes
        show(`Downloading for offline… ${done} / ${total}`, done, total, "busy");
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    await saveRevs();
    await cacheFonts();

    if (failed) {
      show(`${failed} files failed to download — tap to retry`, done, total, "error");
      btn.textContent = "Retry download";
      btn.hidden = false;
    } else {
      show(`Ready offline ✓ · all ${total} pages & audio clips saved on this device`, total, total, "ready");
    }
  }

  // The Google Fonts stylesheet differs per browser, so fetch it from this device.
  async function cacheFonts() {
    const link = document.querySelector('link[href*="fonts.googleapis.com/css"]');
    if (!link) return;
    try {
      const fonts = await caches.open(FONT_CACHE);
      const res = await fetch(link.href, { mode: "cors" });
      await fonts.put(link.href, res.clone());
      const files = [...(await res.text()).matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)].map(m => m[1]);
      await Promise.all(files.map(async f => { if (!(await fonts.match(f))) await fonts.add(f); }));
    } catch { /* fonts are optional — pages fall back to system fonts */ }
  }

  btn.addEventListener("click", () => sync().catch(err => show("Download failed: " + err.message, 0, 1, "error")));
  sync().catch(err => {
    show("Download failed: " + err.message, 0, 1, "error");
    btn.hidden = false;
  });
})();
