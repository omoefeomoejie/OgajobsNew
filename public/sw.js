// OgaJobs Enhanced Service Worker - Push Notifications & Offline Support
const CACHE_NAME = 'ogajobs-v1.2';
const API_CACHE = 'ogajobs-api-v1';
const STATIC_CACHE = 'ogajobs-static-v1';

// Enhanced caching strategy for competitive performance
const urlsToCache = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icon-192.png',
  '/icon-512.png'
];

// Notification batching for smart user experience
let notificationQueue = [];
let batchTimeout = null;
const BATCH_DELAY = 3000; // 3 seconds

// Install - Cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(urlsToCache)),
      self.skipWaiting()
    ])
  );
});

// Activate - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE && cacheName !== STATIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Advanced fetch handling with network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests - Network first with fallback
  if (url.pathname.includes('/api/') || url.hostname.includes('supabase.co')) {
    event.respondWith(
      caches.open(API_CACHE).then(cache => {
        return fetch(request)
          .then(response => {
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cache.match(request))
          .then(response => response || new Response('Offline', { status: 503 }));
      })
    );
  }
  // Static resources - Cache first
  else {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request))
        .catch(() => caches.match('/offline.html'))
    );
  }
});

// Enhanced Push Notifications with Smart Batching
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  console.log('Push received:', data);

  // Add to batch queue
  notificationQueue.push(data);

  // Clear existing timeout
  if (batchTimeout) {
    clearTimeout(batchTimeout);
  }

  // Set new timeout for batch processing
  batchTimeout = setTimeout(() => {
    processBatchedNotifications();
  }, BATCH_DELAY);

  // For high-priority notifications, show immediately
  if (data.priority === 'high' || data.type === 'emergency') {
    event.waitUntil(showNotification(data));
  }
});

// Process batched notifications intelligently
function processBatchedNotifications() {
  if (notificationQueue.length === 0) return;

  // Group notifications by type
  const grouped = notificationQueue.reduce((acc, notification) => {
    const type = notification.type || 'general';
    if (!acc[type]) acc[type] = [];
    acc[type].push(notification);
    return acc;
  }, {});

  // Show grouped or individual notifications
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

// Show individual notification with rich content
async function showNotification(data) {
  const options = {
    body: data.body || data.message,
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    image: data.image,
    tag: data.tag || `ogajobs-${data.type}-${Date.now()}`,
    renotify: data.renotify || false,
    requireInteraction: data.requireInteraction || false,
    vibrate: getVibrationPattern(data.type),
    data: {
      ...data,
      timestamp: Date.now(),
      clickAction: data.action_url || '/'
    },
    actions: getNotificationActions(data.type, data)
  };

  return self.registration.showNotification(data.title || 'OgaJobs', options);
}

// Show grouped notifications for better UX
async function showGroupedNotification(type, notifications) {
  const count = notifications.length;
  const latest = notifications[notifications.length - 1];
  
  const typeLabels = {
    'booking': 'bookings',
    'message': 'messages', 
    'payment': 'payments',
    'system': 'updates'
  };

  const options = {
    body: `You have ${count} new ${typeLabels[type] || 'notifications'}`,
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    tag: `ogajobs-group-${type}`,
    data: {
      type: 'grouped',
      groupType: type,
      count,
      notifications,
      clickAction: getGroupClickAction(type)
    },
    actions: [
      { action: 'view_all', title: `View All (${count})` },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  return self.registration.showNotification(`${count} New ${typeLabels[type] || 'Notifications'}`, options);
}

// Dynamic vibration patterns based on notification type
function getVibrationPattern(type) {
  const patterns = {
    'booking': [200, 100, 200],
    'message': [100, 50, 100],
    'payment': [300, 100, 300, 100, 300],
    'emergency': [500, 200, 500, 200, 500],
    'system': [150]
  };
  return patterns[type] || [100, 50, 100];
}

// Context-aware notification actions
function getNotificationActions(type, data) {
  const commonActions = [
    { action: 'dismiss', title: 'Dismiss' }
  ];

  const typeActions = {
    'booking': [
      { action: 'view_booking', title: 'View Booking' },
      { action: 'accept', title: 'Accept', icon: '/icon-check.png' },
      ...commonActions
    ],
    'message': [
      { action: 'reply', title: 'Reply' },
      { action: 'view_conversation', title: 'Open Chat' },
      ...commonActions
    ],
    'payment': [
      { action: 'view_payment', title: 'View Details' },
      { action: 'view_earnings', title: 'View Earnings' },
      ...commonActions
    ],
    'system': [
      { action: 'view_details', title: 'View Details' },
      ...commonActions
    ]
  };

  return typeActions[type] || [
    { action: 'view', title: 'View' },
    ...commonActions
  ];
}

// Get click action URL for grouped notifications
function getGroupClickAction(type) {
  const actions = {
    'booking': '/my-bookings',
    'message': '/messages',
    'payment': '/earnings',
    'system': '/notifications'
  };
  return actions[type] || '/notifications';
}

// Enhanced notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { action, data } = event;
  const clickAction = data.clickAction || '/';

  event.waitUntil(
    handleNotificationClick(action, data, clickAction)
  );
});

// Smart notification click handler
async function handleNotificationClick(action, data, defaultUrl) {
  const clients = await self.clients.matchAll({ type: 'window' });
  
  // Determine target URL based on action
  let targetUrl = defaultUrl;
  
  switch (action) {
    case 'view_booking':
    case 'accept':
      targetUrl = `/bookings/${data.booking_id || ''}`;
      break;
    case 'reply':
    case 'view_conversation':
      targetUrl = `/messages/${data.conversation_id || ''}`;
      break;
    case 'view_payment':
    case 'view_earnings':
      targetUrl = '/earnings';
      break;
    case 'view_all':
      targetUrl = data.groupType ? getGroupClickAction(data.groupType) : '/notifications';
      break;
    case 'dismiss':
      return; // Just close, no navigation
  }

  // Post message to existing client or open new window
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

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  switch (event.tag) {
    case 'booking-response':
      event.waitUntil(syncBookingResponses());
      break;
    case 'message-send':
      event.waitUntil(syncPendingMessages());
      break;
    case 'notification-read':
      event.waitUntil(syncNotificationStatus());
      break;
    default:
      event.waitUntil(performGeneralSync());
  }
});

// Sync booking responses when back online
async function syncBookingResponses() {
  try {
    const cache = await caches.open('offline-actions');
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('booking-response')) {
        try {
          await fetch(request);
          await cache.delete(request);
        } catch (error) {
          console.error('Failed to sync booking response:', error);
        }
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Sync pending messages
async function syncPendingMessages() {
  try {
    const cache = await caches.open('offline-actions');
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('messages')) {
        try {
          await fetch(request);
          await cache.delete(request);
        } catch (error) {
          console.error('Failed to sync message:', error);
        }
      }
    }
  } catch (error) {
    console.error('Message sync failed:', error);
  }
}

// Sync notification read status
async function syncNotificationStatus() {
  try {
    const cache = await caches.open('offline-actions');
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('notifications')) {
        try {
          await fetch(request);
          await cache.delete(request);
        } catch (error) {
          console.error('Failed to sync notification status:', error);
        }
      }
    }
  } catch (error) {
    console.error('Notification sync failed:', error);
  }
}

// General background sync
async function performGeneralSync() {
  console.log('Performing general background sync');
  // Sync any pending actions
}