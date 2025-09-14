// Service Worker for Our Memories
const CACHE_NAME = 'our-memories-v1';
const STATIC_CACHE = 'static-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/db.js',
  '/manifest.webmanifest',
  // Add other static assets as needed
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the response
            caches.open(STATIC_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If network fails and no cache, return offline page
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Background sync for notifications (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    // Handle background sync if needed
  }
});

// Push event for notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  if (event.data) {
    const data = event.data.json();
    console.log('Push data:', data);

    const options = {
      body: data.body || 'You have a new message',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'our-memories-notification',
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: 'Open App',
          icon: '/icons/icon-72x72.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Our Memories', options)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url === self.location.origin && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, data } = event.data;
    
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'our-memories-notification',
      data: data || {}
    });
  }
});

