/**
 * ✅ SERVIDOR PRINCIPAL MEJORADO
 * Correcciones aplicadas:
 * 1. Manejo robusto de inicio y shutdown
 * 2. Health checks mejorados
 * 3. Manejo de señales optimizado
 * 4. Logging estructurado
 * 5. Configuración validada
 */

// ============================================
// ✅ IMPORTS CON VALIDACIÓN
// ============================================

// Core modules
const http = require('http');
const fs = require('fs');
const path = require('path');

// ✅ MEJORA: Validar imports críticos
const requiredModules = [
  'express', 
  './src/app', 
  './src/config/env', 
  './src/config/database'
];

requiredModules.forEach(modulePath => {
  try {
    if (modulePath.startsWith('./')) {
      require.resolve(modulePath);
    } else {
      require(modulePath);
    }
  } catch (error) {
    console.error(`❌ Error cargando módulo requerido: ${modulePath}`);
    console.error(`   Detalles: ${error.message}`);
    
    // En producción, salir si falta módulo crítico
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
});

// Application modules
const app = require('./src/app');
const config = require('./src/config/env');
const { testConnection, closePool, getPoolStats } = require('./src/config/database');

// ✅ MEJORA: Importar logger con fallback
let logger;
try {
  logger = require('./src/utils/logger');
} catch (error) {
  console.warn('⚠️  Logger no disponible, usando console');
  logger = {
    info: (...args) => console.log('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    debug: (...args) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[DEBUG]', ...args);
      }
    }
  };
}

// ============================================
// ✅ CONFIGURACIÓN Y VALIDACIÓN
// ============================================

// ✅ MEJORA: Validar configuración crítica
const validateConfig = () => {
  const errors = [];
  
  // Validar puerto
  if (!config.server?.port || isNaN(config.server.port)) {
    errors.push('Puerto del servidor no configurado o inválido');
  }
  
  // Validar entorno
  const validEnvs = ['development', 'production', 'staging', 'test'];
  if (!validEnvs.includes(config.server?.nodeEnv)) {
    errors.push(`Entorno inválido: ${config.server?.nodeEnv}. Debe ser: ${validEnvs.join(', ')}`);
  }
  
  // Validar configuración de base de datos en producción
  if (config.server?.nodeEnv === 'production') {
    if (!config.db?.host || config.db.host === 'localhost') {
      errors.push('Host de base de datos no configurado o es localhost en producción');
    }
    
    if (!config.db?.password || config.db.password.includes('fallback')) {
      errors.push('Contraseña de base de datos no configurada o insegura en producción');
    }
  }
  
  if (errors.length > 0) {
    console.error('❌ Errores de configuración:');
    errors.forEach(error => console.error(`   - ${error}`));
    return false;
  }
  
  return true;
};

// ✅ MEJORA: Crear directorios necesarios
const ensureDirectories = () => {
  const directories = [
    './logs',
    './logs/pm2',
    './logs/app',
    './uploads',
    './temp'
  ];
  
  directories.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    
    if (!fs.existsSync(fullPath)) {
      try {
        fs.mkdirSync(fullPath, { recursive: true });
        logger.info(`Directorio creado: ${fullPath}`);
      } catch (error) {
        logger.error(`Error creando directorio ${dir}:`, error.message);
      }
    }
  });
};

// ============================================
// ✅ FUNCIONES DE INICIO Y MANEJO
// ============================================

// Variable global del servidor
let server = null;
let isShuttingDown = false;

/**
 * ✅ MEJORA: Función para verificar conexión a la base de datos
 */
const checkDatabaseConnection = async (retries = 3, delay = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(`Intento ${attempt}/${retries} de conexión a base de datos...`);
      
      const connectionResult = await testConnection();
      const isConnected = connectionResult && 
                         (connectionResult.success === true || 
                          connectionResult === true);
      
      if (isConnected) {
        logger.info('✅ Conexión a base de datos establecida', {
          database: config.db?.database,
          host: config.db?.host,
          attempt
        });
        
        // ✅ MEJORA: Obtener estadísticas del pool
        try {
          const poolStats = getPoolStats ? await getPoolStats() : null;
          if (poolStats) {
            logger.debug('Estadísticas del pool de conexiones:', poolStats);
          }
        } catch (statsError) {
          // No crítico, solo log
          logger.debug('No se pudieron obtener estadísticas del pool:', statsError.message);
        }
        
        return true;
      } else {
        logger.warn(`Intento ${attempt} fallido: ${connectionResult?.message || 'Sin conexión'}`);
      }
    } catch (error) {
      logger.error(`Error en intento ${attempt} de conexión a BD:`, error.message);
    }
    
    // Esperar antes del próximo intento (excepto en el último)
    if (attempt < retries) {
      logger.info(`Esperando ${delay}ms antes del próximo intento...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false;
};

/**
 * ✅ MEJORA: Función de inicio del servidor
 */
async function startServer() {
  const startTime = Date.now();
  
  try {
    // 1. Mostrar banner de inicio
    console.log(`
╔══════════════════════════════════════════════════════════╗
║      🚀 INVENTORY QR BACKEND - INICIANDO SISTEMA        ║
║                ${new Date().toLocaleString()}                ║
╚══════════════════════════════════════════════════════════╝
    `);
    
    logger.info('Iniciando servidor Inventory QR...', {
      nodeEnv: config.server?.nodeEnv,
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid
    });
    
    // 2. Validar configuración
    logger.info('Validando configuración...');
    if (!validateConfig()) {
      throw new Error('Configuración inválida');
    }
    
    // 3. Crear directorios necesarios
    ensureDirectories();
    
    // 4. Verificar conexión a base de datos
    logger.info('Verificando conexión a base de datos...');
    const dbConnected = await checkDatabaseConnection();
    
    if (!dbConnected) {
      const errorMsg = 'No se pudo conectar a la base de datos después de varios intentos';
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    // 5. Crear servidor HTTP
    server = http.createServer(app);
    
    // ✅ MEJORA: Configurar timeout del servidor
    server.keepAliveTimeout = 65000; // 65 segundos
    server.headersTimeout = 66000; // 66 segundos
    
    // ✅ MEJORA: Manejar errores del servidor
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`El puerto ${config.server.port} ya está en uso`);
        console.error(`\n❌ ERROR: Puerto ${config.server.port} ya está en uso`);
        console.error('   Soluciones posibles:');
        console.error('   1. Cambie el puerto en la variable de entorno PORT');
        console.error('   2. Libere el puerto con: kill -9 $(lsof -t -i:3000)');
        console.error('   3. Espere a que el proceso actual termine\n');
      } else {
        logger.error('Error del servidor HTTP:', error);
      }
      
      if (!isShuttingDown) {
        process.exit(1);
      }
    });
    
    // ✅ MEJORA: Evento de conexión (para logging)
    server.on('connection', (socket) => {
      if (config.server?.nodeEnv === 'development' && config.app?.logLevel === 'debug') {
        logger.debug('Nueva conexión HTTP', {
          remoteAddress: socket.remoteAddress,
          remotePort: socket.remotePort
        });
      }
    });
    
    // 6. Iniciar servidor
    return new Promise((resolve, reject) => {
      server.listen(config.server.port, config.server.host || '0.0.0.0', () => {
        const startupTime = Date.now() - startTime;
        
        // Mostrar información de inicio
        console.log(`
╔══════════════════════════════════════════════════════════╗
║                 ✅ SERVIDOR INICIADO                    ║
╠══════════════════════════════════════════════════════════╣
║ Puerto:      ${config.server.port.toString().padEnd(40)} ║
║ Host:        ${(config.server.host || '0.0.0.0').padEnd(40)} ║
║ Entorno:     ${config.server.nodeEnv.padEnd(40)} ║
║ BD:          ${config.db.database.padEnd(40)} ║
║ Tiempo:      ${startupTime}ms${' '.repeat(36 - startupTime.toString().length)}║
║ PID:         ${process.pid}${' '.repeat(38 - process.pid.toString().length)}║
╚══════════════════════════════════════════════════════════╝
        `);
        
        console.log(`🔗 URL Local:  http://localhost:${config.server.port}`);
        console.log(`🔗 URL Red:    http://${getLocalIp()}:${config.server.port}`);
        console.log(`📊 Health:     http://localhost:${config.server.port}/health`);
        console.log(`⏰ Tiempo:     ${new Date().toLocaleString()}`);
        console.log(`🔄 Uptime:     ${process.uptime().toFixed(2)}s`);
        console.log('');
        
        logger.info('Servidor iniciado exitosamente', {
          port: config.server.port,
          host: config.server.host,
          environment: config.server.nodeEnv,
          database: config.db.database,
          startupTime,
          pid: process.pid,
          memoryUsage: process.memoryUsage()
        });
        
        // ✅ MEJORA: Emitir evento 'ready' para PM2
        if (process.send) {
          process.send('ready');
        }
        
        resolve(server);
      });
      
      // Timeout para listen
      server.once('error', reject);
    });
    
  } catch (error) {
    logger.error('❌ Error crítico al iniciar el servidor:', {
      message: error.message,
      stack: error.stack,
      nodeEnv: config.server?.nodeEnv
    });
    
    console.error('\n❌ ERROR CRÍTICO:', error.message);
    console.error('   Stack:', error.stack);
    
    // Intentar cerrar recursos antes de salir
    await gracefulShutdown();
    
    throw error;
  }
}

/**
 * ✅ MEJORA: Función para obtener IP local
 */
function getLocalIp() {
  try {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  } catch (error) {
    // Silenciar error
  }
  
  return '127.0.0.1';
}

/**
 * ✅ MEJORA: Shutdown graceful mejorado
 */
async function gracefulShutdown(signal = 'SIGTERM') {
  if (isShuttingDown) {
    logger.debug('Shutdown ya en proceso, ignorando señal:', signal);
    return;
  }
  
  isShuttingDown = true;
  const shutdownStart = Date.now();
  
  logger.info(`🔄 Iniciando shutdown graceful (señal: ${signal})...`);
  console.log(`\n📴 Recibida señal ${signal}. Cerrando servidor...`);
  
  try {
    const shutdownPromises = [];
    
    // 1. Cerrar servidor HTTP
    if (server && server.listening) {
      shutdownPromises.push(new Promise((resolve) => {
        logger.info('Cerrando servidor HTTP...');
        
        server.close((error) => {
          if (error) {
            logger.error('Error cerrando servidor HTTP:', error);
          } else {
            logger.info('✅ Servidor HTTP cerrado');
          }
          resolve();
        });
        
        // Timeout forzado
        setTimeout(() => {
          logger.warn('Timeout cerrando servidor HTTP, forzando cierre');
          resolve();
        }, 8000);
      }));
    }
    
    // 2. Cerrar pool de base de datos
    if (typeof closePool === 'function') {
      shutdownPromises.push(new Promise(async (resolve) => {
        try {
          logger.info('Cerrando pool de conexiones de base de datos...');
          await closePool();
          logger.info('✅ Pool de conexiones cerrado');
        } catch (error) {
          logger.error('Error cerrando pool de conexiones:', error);
        } finally {
          resolve();
        }
      }));
    }
    
    // 3. Esperar a que todas las promesas se resuelvan
    await Promise.allSettled(shutdownPromises);
    
    const shutdownTime = Date.now() - shutdownStart;
    logger.info(`✅ Shutdown completado en ${shutdownTime}ms`);
    console.log(`✅ Servidor cerrado exitosamente (${shutdownTime}ms)`);
    
    // Salir del proceso
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Error durante shutdown:', error);
    console.error('❌ Error cerrando recursos:', error.message);
    
    // Forzar salida después de timeout
    setTimeout(() => {
      logger.error('Forzando salida después de error en shutdown');
      process.exit(1);
    }, 5000);
  }
}

/**
 * ✅ MEJORA: Configurar manejo de señales
 */
function setupSignalHandlers() {
  const signals = ['SIGTERM', 'SIGINT', 'SIGQUIT', 'SIGUSR2'];
  
  signals.forEach(signal => {
    process.on(signal, () => {
      logger.info(`Señal recibida: ${signal}`);
      gracefulShutdown(signal).catch(error => {
        logger.error(`Error manejando señal ${signal}:`, error);
      });
    });
  });
  
  // ✅ MEJORA: Manejar señales específicas de PM2
  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      logger.info('Mensaje de shutdown recibido de PM2');
      gracefulShutdown('PM2_SHUTDOWN');
    }
  });
}

/**
 * ✅ MEJORA: Configurar manejo de errores no capturados
 */
function setupErrorHandlers() {
  // Errores no capturados
  process.on('uncaughtException', (error) => {
    logger.error('💥 Error no capturado (uncaughtException):', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    console.error('\n💥 ERROR NO CAPTURADO:', error.message);
    console.error('Stack:', error.stack);
    
    // En producción, intentar shutdown graceful
    if (config.server?.nodeEnv === 'production' && !isShuttingDown) {
      gracefulShutdown('UNCAUGHT_EXCEPTION').catch(() => {
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
  
  // Promesas rechazadas no manejadas
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('💥 Promesa rechazada no manejada (unhandledRejection):', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise
    });
    
    console.error('\n💥 PROMESA RECHAZADA NO MANEJADA:', reason?.message || reason);
    
    // En producción, solo loguear pero no salir
    if (config.server?.nodeEnv !== 'production') {
      process.exit(1);
    }
  });
}

// ============================================
// ✅ INICIALIZACIÓN PRINCIPAL
// ============================================

// Solo iniciar si se ejecuta directamente (no en tests)
if (require.main === module) {
  // Configurar handlers de errores y señales
  setupErrorHandlers();
  setupSignalHandlers();
  
  // Iniciar servidor
  startServer().catch(async (error) => {
    logger.error('Error fatal durante el inicio:', error);
    console.error('\n❌ ERROR FATAL DURANTE EL INICIO:', error.message);
    
    // Intentar shutdown antes de salir
    await gracefulShutdown('STARTUP_ERROR').catch(() => {});
    
    process.exit(1);
  });
}

// ============================================
// ✅ EXPORTS MEJORADOS
// ============================================

module.exports = {
  app,
  startServer,
  gracefulShutdown,
  checkDatabaseConnection,
  
  // ✅ MEJORA: Métodos para testing y monitoreo
  getServerInstance: () => server,
  isServerRunning: () => server && server.listening,
  
  // ✅ MEJORA: Métodos para health checks externos
  getHealthStatus: async () => {
    try {
      const dbConnected = await checkDatabaseConnection(1, 1000);
      
      return {
        status: dbConnected ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: dbConnected ? 'connected' : 'disconnected',
          api: server && server.listening ? 'running' : 'stopped'
        },
        uptime: process.uptime(),
        memory: process.memoryUsage()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        services: {
          database: 'error',
          api: 'error'
        }
      };
    }
  }
};