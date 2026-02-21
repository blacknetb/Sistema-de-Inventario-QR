/**
 * main.jsx - Punto de entrada principal de Inventory QR System
 * Renderiza la aplicación en el DOM y configura los plugins globales
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { configure } from 'axios-hooks';
import axios from 'axios';

// Importar estilos globales
import './styles/global.css';
import './styles/variables.css';
import './styles/responsive.css';
import './styles/animations.css';

// Componente principal
import App from './App';

// Configuración de Axios para axios-hooks
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor para manejar errores de autenticación
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(
                        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/auth/refresh`,
                        { refreshToken }
                    );

                    if (response.data.accessToken) {
                        localStorage.setItem('accessToken', response.data.accessToken);
                        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
                        return axiosInstance(originalRequest);
                    }
                }
            } catch (refreshError) {
                // Si falla el refresh, redirigir al login
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                
                // Redirigir solo si no estamos ya en login
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

// Configurar axios-hooks con la instancia personalizada
configure({ axios: axiosInstance });

// Configuración de dayjs (fechas) si se usa
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';

// Extender dayjs con plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale('es');
dayjs.tz.setDefault('America/Mexico_City');

// Configuración de iconos (si usas FontAwesome o similar)
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';

// Añadir todos los iconos a la librería (puedes optimizar importando solo los que usas)
library.add(fas, far, fab);

// Configuración de React Query (si lo usas)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 minutos
            cacheTime: 10 * 60 * 1000, // 10 minutos
        },
    },
});

// Configuración de React Hot Toast (notificaciones)
import { Toaster } from 'react-hot-toast';

// Configuración de MSW (Mock Service Worker) para desarrollo
if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === 'true') {
    const { worker } = await import('./mocks/browser');
    worker.start({
        onUnhandledRequest: 'bypass',
    });
}

// Registrar service worker para PWA (opcional)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((error) => {
            console.error('Error registering service worker:', error);
        });
    });
}

// Función para renderizar la aplicación
function renderApp() {
    const root = document.getElementById('root');

    if (!root) {
        console.error('No se encontró el elemento root en el DOM');
        return;
    }

    ReactDOM.createRoot(root).render(
        <React.StrictMode>
            <QueryClientProvider client={queryClient}>
                <App />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 5000,
                        style: {
                            background: '#363636',
                            color: '#fff',
                        },
                        success: {
                            duration: 3000,
                            iconTheme: {
                                primary: '#10b981',
                                secondary: '#fff',
                            },
                        },
                        error: {
                            duration: 4000,
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#fff',
                            },
                        },
                    }}
                />
                {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
            </QueryClientProvider>
        </React.StrictMode>
    );
}

// Inicializar la aplicación
renderApp();

// Soporte para Hot Module Replacement (HMR) en desarrollo
if (import.meta.hot) {
    import.meta.hot.accept();
}

// Manejo de errores globales
window.addEventListener('error', (event) => {
    console.error('Error global capturado:', event.error);
    // Aquí podrías enviar el error a un servicio de tracking
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesa rechazada no manejada:', event.reason);
    // Aquí podrías enviar el error a un servicio de tracking
});

// Exportar para testing
export { queryClient, axiosInstance };