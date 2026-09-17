const CACHE = "snapar-shell-v1";
const CORE = ["/", "/manifest.webmanifest", "/brand/snap-ar-icon.png"];
self.addEventListener("install", event => { event.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", event => { event.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(res => {
    if (res.ok && new URL(event.request.url).origin === self.location.origin) {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(event.request, copy));
    }
    return res;
  }).catch(() => cached)));
});
