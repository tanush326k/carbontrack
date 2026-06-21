const CACHE_NAME = 'ecotrace-v2';
const ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            })
        ))
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    // Ignore cross-origin and CDN requests (e.g. jDelivr, cdnjs, Google Fonts)
    if (url.origin !== self.location.origin) {
        return; // Normal browser fetch, bypassing service worker interception
    }
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
