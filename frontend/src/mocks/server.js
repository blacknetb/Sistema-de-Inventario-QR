/**
 * server.js - Configuración del servidor para pruebas con Node.js
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);