const CACHE_NAME = "flappy-bird-remake-cache-v5.2.3";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./src/main.js",
  "./src/config.js",
  "./src/difficulty.js",
  "./src/haptics.js",
  "./src/i18n.js",
  "./src/assetLoader.js",
  "./src/entities.js",
  "./src/game.js",
  "./src/input.js",
  "./src/save.js",
  "./src/sound.js",
  "./src/ui.js",
  "./src/updateNotifier.js",
  "./assets/images/sky.png",
  "./assets/images/land.png",
  "./assets/images/pipe_up.png",
  "./assets/images/pipe_down.png",
  "./assets/images/bird1.png",
  "./assets/images/bird2.png",
  "./assets/images/bird3.png",
  "./assets/images/scoreboard.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/fonts/Poppins-Bold.ttf",
  "./assets/fonts/Poppins-Medium.ttf",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isNavigationRequest(request) {
  return request.mode === "navigate" || request.headers.get("accept")?.includes("text/html");
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
