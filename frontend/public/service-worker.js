// Service Worker para Sistema de Inventario QR
// Versión: 1.0.0
// Cache: inventario-qr-v1

const CACHE_NAME = 'inventario-qr-v1';
const OFFLINE_URL = '/offline.html';

// Archivos críticos para el funcionamiento offline
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/src/assets/styles/main.css',
    '/src/assets/styles/components.css',
    '/src/assets/js/app-config.js',
    '/src/assets/js/main.js',
    '/site.webmanifest',
    '/offline.html'
];

// =============== EVENTO: INSTALACIÓN ===============
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Cacheando archivos críticos');
                return cache.addAll(CORE_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Instalación completada');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Error en instalación:', error);
            })
    );
});

// =============== EVENTO: ACTIVACIÓN ===============
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activando...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Eliminar caches antiguos
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            console.log('[Service Worker] Activación completada');
            return self.clients.claim();
        })
    );
});

// =============== EVENTO: FETCH ===============
self.addEventListener('fetch', (event) => {
    // Solo manejar solicitudes GET
    if (event.request.method !== 'GET') return;
    
    // Excluir ciertas rutas del cache
    if (event.request.url.includes('/api/') || 
        event.request.url.includes('/socket.io/') ||
        event.request.url.includes('/admin/')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Si existe en cache, devolverlo
                if (cachedResponse) {
                    console.log('[Service Worker] Sirviendo desde cache:', event.request.url);
                    return cachedResponse;
                }
                
                // Si no está en cache, hacer la petición a la red
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Si la respuesta es válida, guardarla en cache
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    console.log('[Service Worker] Guardando en cache:', event.request.url);
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Si falla la red y es una navegación, mostrar página offline
                        if (event.request.mode === 'navigate') {
                            return caches.match(OFFLINE_URL);
                        }
                        
                        // Para otros recursos, devolver respuesta vacía
                        return new Response('', {
                            status: 408,
                            statusText: 'Offline'
                        });
                    });
            })
    );
});

// =============== EVENTO: SINCRONIZACIÓN EN BACKGROUND ===============
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Sincronización:', event.tag);
    
    if (event.tag === 'sync-pending-changes') {
        event.waitUntil(syncPendingChanges());
    }
});

// =============== EVENTO: PUSH NOTIFICATIONS ===============
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push recibido');
    
    let data = {};
    if (event.data) {
        data = event.data.json();
    }
    
    const options = {
        body: data.body || 'Nueva notificación del Sistema de Inventario QR',
        icon: '/assets/favicon/favicon-192x192.png',
        badge: '/assets/favicon/favicon-96x96.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'open',
                title: 'Abrir aplicación'
            },
            {
                action: 'close',
                title: 'Cerrar'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Inventario QR', options)
    );
});

// =============== EVENTO: CLICK EN NOTIFICACIÓN ===============
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Click en notificación:', event.action);
    
    event.notification.close();
    
    if (event.action === 'close') {
        return;
    }
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((clientList) => {
            // Si hay una ventana abierta, enfocarla
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // Si no hay ventana abierta, abrir una nueva
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// =============== FUNCIONES AUXILIARES ===============

/**
 * Sincroniza cambios pendientes cuando se recupera la conexión
 */
async function syncPendingChanges() {
    try {
        // Aquí iría la lógica para sincronizar cambios pendientes
        // Por ejemplo, datos guardados en IndexedDB mientras estaba offline
        console.log('[Service Worker] Sincronizando cambios pendientes');
        
        // Simular sincronización
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Enviar notificación de éxito
        self.registration.showNotification('Sincronización completada', {
            body: 'Los cambios se han sincronizado correctamente',
            icon: '/assets/favicon/favicon-192x192.png'
        });
        
        return Promise.resolve();
    } catch (error) {
        console.error('[Service Worker] Error en sincronización:', error);
        return Promise.reject(error);
    }
}

/**
 * Limpia el cache periódicamente
 */
async function cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const currentCacheName = CACHE_NAME;
    
    for (const cacheName of cacheNames) {
        if (cacheName !== currentCacheName) {
            await caches.delete(cacheName);
            console.log('[Service Worker] Cache limpiado:', cacheName);
        }
    }
}

// =============== MANEJO DE MENSAJES ===============
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Mensaje recibido:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME)
            .then(() => {
                console.log('[Service Worker] Cache limpiado por solicitud');
                event.ports[0].postMessage({ success: true });
            })
            .catch((error) => {
                console.error('[Service Worker] Error al limpiar cache:', error);
                event.ports[0].postMessage({ success: false, error: error.message });
            });
    }
});

// =============== PERIODIC SYNC (Experimental) ===============
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-inventory') {
        console.log('[Service Worker] Sincronización periódica iniciada');
        event.waitUntil(updateInventoryData());
    }
});

async function updateInventoryData() {
    // Aquí iría la lógica para actualizar datos del inventario
    console.log('[Service Worker] Actualizando datos del inventario');
    
    try {
        // Simular actualización
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('[Service Worker] Datos actualizados correctamente');
    } catch (error) {
        console.error('[Service Worker] Error actualizando datos:', error);
    }
}