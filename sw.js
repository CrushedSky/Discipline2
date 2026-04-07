// DISCIPLINE — Service Worker
// Caches the app shell for full offline support

const CACHE_NAME = ‘discipline-v3’;
const ASSETS = [
‘./habit-tracker.html’,
‘./manifest.json’,
‘./icon-192.png’,
‘./icon-512.png’,
‘https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap’
];

// Install: cache all core assets
self.addEventListener(‘install’, event => {
event.waitUntil(
caches.open(CACHE_NAME).then(cache => {
// Cache what we can — fonts may fail due to CORS, that’s fine
return Promise.allSettled(
ASSETS.map(url =>
cache.add(url).catch(() => {})
)
);
}).then(() => self.skipWaiting())
);
});

// Activate: clear old caches
self.addEventListener(‘activate’, event => {
event.waitUntil(
caches.keys().then(keys =>
Promise.all(
keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
)
).then(() => self.clients.claim())
);
});

// Fetch: cache-first for local assets, network-first for everything else
self.addEventListener(‘fetch’, event => {
const url = new URL(event.request.url);
const isLocal = url.origin === self.location.origin;

if (isLocal) {
// Cache-first strategy for local files
event.respondWith(
caches.match(event.request).then(cached => {
if (cached) return cached;
return fetch(event.request).then(response => {
if (response && response.status === 200) {
const clone = response.clone();
caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
}
return response;
});
})
);
} else {
// Network-first for external (fonts, etc.) with cache fallback
event.respondWith(
fetch(event.request)
.then(response => {
if (response && response.status === 200) {
const clone = response.clone();
caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
}
return response;
})
.catch(() => caches.match(event.request))
);
}
});