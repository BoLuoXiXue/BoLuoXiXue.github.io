// 定义缓存名称和要缓存的静态文件列表
const CACHE_NAME = 'my-offline-notes-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    'https://cdn.tailwindcss.com',
    'https://placehold.co/192x192/000000/FFFFFF?text=PWA',
    'https://placehold.co/512x512/000000/FFFFFF?text=PWA'
];

// 安装 Service Worker，并在其中缓存文件
self.addEventListener('install', (event) => {
    console.log('Service Worker: 安装中...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: 缓存核心文件');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// 激活 Service Worker，清理旧的缓存
self.addEventListener('activate', (event) => {
    console.log('Service Worker: 激活中...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: 清理旧缓存:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// 拦截网络请求，实现离线优先策略
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    console.log('Service Worker: 从缓存中获取:', event.request.url);
                    return response;
                }

                console.log('Service Worker: 从网络获取:', event.request.url);
                return fetch(event.request).then(
                    networkResponse => {
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    }
                );
            }).catch(() => {
                // 如果网络请求失败且缓存中也没有，可以返回一个离线页面
                console.error('Service Worker: 无法获取资源，并无离线缓存。');
            })
    );
});
