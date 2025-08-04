// CraftConnect PWA Service Worker - Advanced Offline & Mobile Features
const CACHE_NAME = 'craftconnect-v2.0.0';
const STATIC_CACHE = 'craftconnect-static-v2';
const DYNAMIC_CACHE = 'craftconnect-dynamic-v2';
const IMAGES_CACHE = 'craftconnect-images-v2';
const API_CACHE = 'craftconnect-api-v2';

// Enhanced assets to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/assets/ogajobs-logo.png',
  // Core app routes for offline access
  '/auth',
  '/dashboard',
  '/artisan-dashboard',
  '/client-dashboard',
  '/agent-dashboard',
  '/booking-request',
  '/service-directory',
  '/portfolio',
  '/messages',
  '/profile',
  '/settings',
  '/my-bookings',
  '/verification',
  '/reviews',
  '/disputes'
];

// Background sync queue management
let syncQueue = [];
let notificationQueue = [];
let batchTimeout = null;
const BATCH_DELAY = 3000;

// Install event - enhanced caching
self.addEventListener('install', (event) => {
  console.log('[SW] Installing CraftConnect service worker v2.0.0...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Initialize IndexedDB for offline storage
      initializeOfflineStorage(),
      self.skipWaiting()
    ]).then(() => {
      console.log('[SW] Installation complete');
    }).catch(error => {
      console.error('[SW] Installation failed:', error);
    })
  );
});

// Activate event - clean up and claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (![STATIC_CACHE, DYNAMIC_CACHE, IMAGES_CACHE, API_CACHE].includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Service worker activated and ready');
    })
  );
});

// Advanced fetch handling with multiple strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle different request types with appropriate strategies
  if (request.method === 'GET') {
    // Supabase API requests - Network first with background update
    if (url.hostname.includes('supabase.co') || url.pathname.includes('/api/')) {
      event.respondWith(networkFirstWithUpdate(request, API_CACHE));
    }
    // Images - Cache first with background update
    else if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      event.respondWith(cacheFirstWithUpdate(request, IMAGES_CACHE));
    }
    // Static assets - Cache first
    else if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset))) {
      event.respondWith(cacheFirst(request, STATIC_CACHE));
    }
    // App shell - Cache with SPA fallback
    else if (isAppShellRequest(request)) {
      event.respondWith(appShellStrategy(request));
    }
    // Default - Network first with cache fallback
    else {
      event.respondWith(networkFirstWithUpdate(request, DYNAMIC_CACHE));
    }
  }
  // Mutation requests - Handle with background sync
  else if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    event.respondWith(handleMutationRequest(request));
  }
});

// Caching strategies implementation
async function networkFirstWithUpdate(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return appropriate offline response
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html');
      return offlineResponse || createOfflineResponse('Page not available offline');
    }
    
    return createOfflineResponse('Content not available offline');
  }
}

async function cacheFirstWithUpdate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse);
      }
    }).catch(() => {});
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return createOfflineResponse('Resource not available offline');
  }
}

async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  return cachedResponse || fetch(request);
}

async function appShellStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // For SPA routes, return index.html
  const indexResponse = await caches.match('/index.html');
  return indexResponse || fetch(request);
}

async function handleMutationRequest(request) {
  try {
    // Try to send request immediately
    const response = await fetch(request);
    
    // If successful, process any background sync queue
    if (response.ok) {
      processBackgroundSyncQueue();
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Mutation request failed, queuing for background sync');
    
    // Queue for background sync
    const requestData = await serializeRequest(request);
    await queueForBackgroundSync(requestData);
    
    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      self.registration.sync.register('background-sync');
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Request queued for when connection is restored',
        queued: true,
        timestamp: Date.now()
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Helper functions
function isAppShellRequest(request) {
  const url = new URL(request.url);
  return request.mode === 'navigate' && 
         !url.pathname.includes('.') && 
         !url.pathname.startsWith('/api/');
}

function createOfflineResponse(message) {
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message,
      offline: true,
      timestamp: Date.now()
    }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

async function serializeRequest(request) {
  const headers = {};
  for (const [key, value] of request.headers.entries()) {
    headers[key] = value;
  }
  
  let body = null;
  if (request.body) {
    try {
      body = await request.text();
    } catch (error) {
      console.error('[SW] Failed to serialize request body:', error);
    }
  }
  
  return {
    url: request.url,
    method: request.method,
    headers,
    body,
    timestamp: Date.now(),
    id: generateRequestId()
  };
}

function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Background sync implementation
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(processBackgroundSyncQueue());
  }
});

async function queueForBackgroundSync(requestData) {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('craftconnect-sync', 2);
    
    dbRequest.onerror = () => reject(dbRequest.error);
    
    dbRequest.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('sync-queue')) {
        const store = db.createObjectStore('sync-queue', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('offline-data')) {
        db.createObjectStore('offline-data', { keyPath: 'key' });
      }
    };
    
    dbRequest.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['sync-queue'], 'readwrite');
      const store = transaction.objectStore('sync-queue');
      
      store.add(requestData);
      
      transaction.oncomplete = () => {
        console.log('[SW] Request queued for background sync:', requestData.id);
        resolve();
      };
      
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

async function processBackgroundSyncQueue() {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('craftconnect-sync', 2);
    
    dbRequest.onsuccess = async (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['sync-queue'], 'readwrite');
      const store = transaction.objectStore('sync-queue');
      
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = async () => {
        const queuedRequests = getAllRequest.result;
        console.log('[SW] Processing', queuedRequests.length, 'queued requests');
        
        let successCount = 0;
        
        for (const requestData of queuedRequests) {
          try {
            const response = await fetch(requestData.url, {
              method: requestData.method,
              headers: requestData.headers,
              body: requestData.body
            });
            
            if (response.ok) {
              // Remove successful request from queue
              await deleteFromStore(store, requestData.id);
              successCount++;
              console.log('[SW] Background sync successful:', requestData.url);
            } else {
              console.log('[SW] Background sync failed with status:', response.status);
            }
          } catch (error) {
            console.log('[SW] Background sync request failed:', error);
            
            // Remove old failed requests (older than 24 hours)
            if (Date.now() - requestData.timestamp > 24 * 60 * 60 * 1000) {
              await deleteFromStore(store, requestData.id);
              console.log('[SW] Removed expired request:', requestData.id);
            }
          }
        }
        
        console.log(`[SW] Background sync complete: ${successCount}/${queuedRequests.length} successful`);
        resolve();
      };
    };
    
    dbRequest.onerror = () => reject(dbRequest.error);
  });
}

function deleteFromStore(store, id) {
  return new Promise((resolve) => {
    const deleteRequest = store.delete(id);
    deleteRequest.onsuccess = () => resolve();
    deleteRequest.onerror = () => resolve(); // Don't fail the whole operation
  });
}

// Initialize offline storage
async function initializeOfflineStorage() {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('craftconnect-offline', 1);
    
    dbRequest.onerror = () => reject(dbRequest.error);
    
    dbRequest.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store for offline bookings
      if (!db.objectStoreNames.contains('offline-bookings')) {
        const bookingsStore = db.createObjectStore('offline-bookings', { keyPath: 'id' });
        bookingsStore.createIndex('status', 'status', { unique: false });
        bookingsStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      // Store for offline messages
      if (!db.objectStoreNames.contains('offline-messages')) {
        const messagesStore = db.createObjectStore('offline-messages', { keyPath: 'id' });
        messagesStore.createIndex('conversation_id', 'conversation_id', { unique: false });
      }
      
      // Store for cached user data
      if (!db.objectStoreNames.contains('cached-data')) {
        db.createObjectStore('cached-data', { keyPath: 'key' });
      }
    };
    
    dbRequest.onsuccess = () => {
      console.log('[SW] Offline storage initialized');
      resolve();
    };
  });
}

// Enhanced push notifications with batching
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  console.log('[SW] Push notification received:', data);

  // Add to notification queue
  notificationQueue.push(data);

  // Clear existing timeout
  if (batchTimeout) {
    clearTimeout(batchTimeout);
  }

  // Show high-priority notifications immediately
  if (data.priority === 'high' || data.type === 'emergency') {
    event.waitUntil(showNotification(data));
    return;
  }

  // Batch low-priority notifications
  batchTimeout = setTimeout(() => {
    processBatchedNotifications();
  }, BATCH_DELAY);
});

async function showNotification(data) {
  const options = {
    body: data.body || data.message,
    icon: '/assets/ogajobs-logo.png',
    badge: '/assets/ogajobs-logo.png',
    tag: data.tag || `craftconnect-${data.type}-${Date.now()}`,
    renotify: data.renotify || false,
    requireInteraction: data.requireInteraction || false,
    vibrate: getVibrationPattern(data.type),
    data: {
      ...data,
      timestamp: Date.now()
    },
    actions: getNotificationActions(data.type)
  };

  return self.registration.showNotification(
    data.title || 'CraftConnect',
    options
  );
}

function processBatchedNotifications() {
  if (notificationQueue.length === 0) return;

  // Group by type
  const grouped = notificationQueue.reduce((acc, notification) => {
    const type = notification.type || 'general';
    if (!acc[type]) acc[type] = [];
    acc[type].push(notification);
    return acc;
  }, {});

  // Show notifications
  Object.entries(grouped).forEach(([type, notifications]) => {
    if (notifications.length === 1) {
      showNotification(notifications[0]);
    } else {
      showGroupedNotification(type, notifications);
    }
  });

  // Clear queue
  notificationQueue = [];
  batchTimeout = null;
}

function showGroupedNotification(type, notifications) {
  const count = notifications.length;
  const typeLabels = {
    'booking': 'bookings',
    'message': 'messages',
    'payment': 'payments',
    'system': 'updates'
  };

  const options = {
    body: `You have ${count} new ${typeLabels[type] || 'notifications'}`,
    icon: '/assets/ogajobs-logo.png',
    badge: '/assets/ogajobs-logo.png',
    tag: `craftconnect-group-${type}`,
    data: {
      type: 'grouped',
      groupType: type,
      count,
      notifications
    },
    actions: [
      { action: 'view_all', title: `View All (${count})` },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  return self.registration.showNotification(
    `${count} New ${typeLabels[type] || 'Notifications'}`,
    options
  );
}

function getVibrationPattern(type) {
  const patterns = {
    'booking': [200, 100, 200],
    'message': [100, 50, 100],
    'payment': [300, 100, 300],
    'emergency': [500, 200, 500],
    'system': [150]
  };
  return patterns[type] || [100, 50, 100];
}

function getNotificationActions(type) {
  const actions = {
    'booking': [
      { action: 'view', title: 'View Booking' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    'message': [
      { action: 'reply', title: 'Reply' },
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    'payment': [
      { action: 'view', title: 'View Payment' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  
  return actions[type] || [
    { action: 'view', title: 'View' },
    { action: 'dismiss', title: 'Dismiss' }
  ];
}

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { action, data } = event;
  
  event.waitUntil(handleNotificationClick(action, data));
});

async function handleNotificationClick(action, data) {
  if (action === 'dismiss') return;
  
  const clients = await self.clients.matchAll({ type: 'window' });
  let targetUrl = '/dashboard';
  
  // Determine target URL based on notification type and action
  if (data.type === 'booking') {
    targetUrl = '/my-bookings';
  } else if (data.type === 'message') {
    targetUrl = '/messages';
  } else if (data.type === 'payment') {
    targetUrl = '/earnings';
  }
  
  if (data.url) {
    targetUrl = data.url;
  }
  
  // Open or focus window
  if (clients.length > 0) {
    const client = clients[0];
    client.postMessage({
      type: 'NOTIFICATION_CLICK',
      action,
      data,
      url: targetUrl
    });
    return client.focus();
  } else {
    return self.clients.openWindow(targetUrl);
  }
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  const { data } = event;
  
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  } else if (data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

console.log('[SW] CraftConnect PWA Service Worker v2.0.0 loaded successfully');