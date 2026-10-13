/* عجلة حياتك — عامل الخدمة: يعمل التطبيق حتى مع ضعف الإنترنت */
const CACHE = "qa3da-wheel-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.pathname.includes("/api/") || url.pathname.endsWith("/stats")) return;
  /* الصفحة: الشبكة أولاً ثم النسخة المحفوظة */
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put("index.html", cp)); return r; })
      .catch(() => caches.match("index.html")));
    return;
  }
  /* الخطوط والأيقونات: المحفوظ أولاً */
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok && (url.origin === location.origin || url.host.includes("fonts.g"))) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return r;
  }).catch(() => hit)));
});
