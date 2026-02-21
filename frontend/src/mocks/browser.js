/**
 * browser.js - Configuración del Service Worker para MSW en el navegador
 */

import { setupWorker } from 'msw';
import { handlers } from './handlers';

// Configurar el worker con los manejadores
export const worker = setupWorker(...handlers);

// Log para verificar que el worker está configurado
if (import.meta.env.DEV) {
    console.log('📦 MSW Worker configurado para desarrollo');
}