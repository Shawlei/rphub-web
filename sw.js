// RP-Hub 定制网页版 Service Worker
// 注意：每次发版请递增下面的 CACHE_NAME 版本号，以刷新客户端缓存。
const CACHE_NAME = 'rphub-web-v2';
const STATIC_ASSETS = [
    './',
    './index.html',
    './assets/css/styles.css',
    // 业务脚本（10 个）
    './assets/js/api-utils.js',
    './assets/js/app.js',
    './assets/js/built-in-content.js',
    './assets/js/core-utils.js',
    './assets/js/data-services.js',
    './assets/js/presence.js',
    './assets/js/runtime-services.js',
    './assets/js/ui-components.js',
    './assets/js/update-check.js',
    './assets/js/upstream-sync.js',
    // 第三方库（6 个）
    './assets/js/vendor/jquery.min.js',
    './assets/js/vendor/marked.min.js',
    './assets/js/vendor/purify.min.js',
    './assets/js/vendor/Sortable.min.js',
    './assets/js/vendor/tailwind.js',
    './assets/js/vendor/vue.global.prod.js',
    // 样式与工具库
    './libs/tailwind.css',
    './libs/daisyui.min.css',
    './libs/localforage.min.js',
    // 子页面
    './character/index.html',
    './novel/index.html'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip API calls
    if (request.url.includes('/v1/') || request.url.includes('api.')) {
        return;
    }

    // 带查询串的请求（如 assets/js/app.js?v=1735... 的时间戳防缓存机制）不接管、不写入缓存：
    // 既保证业务脚本永远走网络拿最新版本，也避免 cache.put 无限制膨胀。
    if (new URL(request.url).search) return;

    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request).then((response) => {
                // Don't cache non-success responses
                if (!response || response.status !== 200) {
                    return response;
                }

                // Clone the response
                const responseToCache = response.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseToCache);
                });

                return response;
            }).catch(() => {
                // Return offline fallback for navigation requests
                if (request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
