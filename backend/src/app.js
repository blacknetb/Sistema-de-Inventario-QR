/**
 * ✅ APLICACIÓN PRINCIPAL EXPRESS - VERSIÓN CORREGIDA
 * Correcciones aplicadas:
 * 1. ✅ SOLUCIONADO: Error crítico de path-to-regexp con "/api/*"
 * 2. ✅ Rate limiting IPv6 corregido
 * 3. Manejo robusto de imports con validación
 */

// ============================================
// ✅ IMPORTS Y CONFIGURACIÓN INICIAL
// ============================================

// Core dependencies
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");
const compression = require("compression");

// ✅ CORRECCIÓN: Validación de imports críticos corregida
const requiredModules = [
  "express",
  "cors",
  "helmet",
  "express-rate-limit",
  "path",
  "fs",
  "morgan",
  "compression",
];

requiredModules.forEach((moduleName) => {
  try {
    require(moduleName);
  } catch (error) {
    console.error(`❌ Error cargando módulo requerido: ${moduleName}`);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
});

// Local dependencies
let config, corsOptions, testConnection, errorHandler;
try {
  // ✅ MEJORA: Cargar configuraciones con validación
  config = require("./config/env");

  // ✅ MEJORA: Importar CORS mejorado
  const corsModule = require("./config/cors");
  corsOptions = corsModule.corsOptions || corsModule;

  // ✅ MEJORA: Importar funciones de base de datos
  const dbModule = require("./config/database");
  testConnection = dbModule.testConnection || (async () => ({ success: true }));

  // ✅ MEJORA: Manejo de errores mejorado
  errorHandler = require("./middlewares/errorHandler");
} catch (error) {
  console.error("❌ Error cargando módulos locales:", error.message);

  // Configuración de emergencia
  config = {
    server: { nodeEnv: process.env.NODE_ENV || "development" },
    security: { rateLimit: { windowMs: 900000, max: 100 } },
    app: { maxRequestSize: "10mb" },
  };

  corsOptions = { origin: "*" };
  testConnection = async () => ({ success: false, error: "Module not loaded" });
  errorHandler = require("./middlewares/errorHandler") || {
    notFound: (req, res) => res.status(404).json({ error: "Not Found" }),
    handleError: (err, req, res, next) => {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    },
  };
}

// ============================================
// ✅ CONFIGURACIÓN DE RATE LIMITING CORREGIDA
// ============================================

// ✅ CORRECCIÓN: Importar helper oficial
const { ipKeyGenerator } = require("express-rate-limit");

// Limiter general optimizado
const generalLimiter = rateLimit({
  windowMs: config.security?.rateLimit?.windowMs || 15 * 60 * 1000,
  max: config.security?.rateLimit?.max || 100,
  message: {
    success: false,
    message:
      "Demasiadas peticiones desde esta IP. Por favor intente más tarde.",
    code: "RATE_LIMIT_EXCEEDED",
    retryAfter:
      Math.floor((config.security?.rateLimit?.windowMs || 900000) / 60000) +
      " minutos",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests:
    config.security?.rateLimit?.skipSuccessfulRequests || false,

  // ✅ CORRECCIÓN: Usar ipKeyGenerator oficial
  keyGenerator: (req, res) => {
    try {
      return ipKeyGenerator(req, req.ip);
    } catch (error) {
      console.error("Error en keyGenerator:", error.message);
      return "fallback-" + Math.random().toString(36).substring(2, 10);
    }
  },

  handler: (req, res, next, options) => {
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "unknown";
    console.warn(
      `🚨 Rate limit excedido: ${clientIp} - ${req.method} ${req.path}`,
    );

    if (config.server.nodeEnv === "development") {
      options.message.details = {
        ip: clientIp,
        path: req.path,
        timestamp: new Date().toISOString(),
        limit: options.max,
        windowMs: options.windowMs,
      };
    }

    res.status(options.statusCode || 429).json(options.message);
  },

  skip: (req) => {
    if (
      req.path === "/health" ||
      req.path === "/health/live" ||
      req.path === "/health/ready"
    ) {
      return true;
    }

    if (req.path.startsWith("/internal/")) {
      return true;
    }

    if (req.path.startsWith("/uploads/")) {
      return true;
    }

    return false;
  },
});

// Limiter específico para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.security?.rateLimit?.authMax || 5,
  message: {
    success: false,
    message:
      "Demasiados intentos de autenticación. Por favor intente más tarde.",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
    retryAfter: "15 minutos",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,

  // ✅ CORRECCIÓN: Usar ipKeyGenerator oficial
  keyGenerator: (req, res) => {
    try {
      return ipKeyGenerator(req, req.ip);
    } catch (error) {
      console.error("Error en keyGenerator auth:", error.message);
      return "fallback-" + Math.random().toString(36).substring(2, 10);
    }
  },

  handler: (req, res, next, options) => {
    const userIdentifier = req.body?.email || req.body?.username || "unknown";
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "unknown";

    console.warn(
      `🔐 Rate limit de autenticación excedido: ${userIdentifier} desde ${clientIp}`,
    );

    res.status(options.statusCode || 429).json(options.message);
  },
});

// ============================================
// ✅ FUNCIONES AUXILIARES
// ============================================

/**
 * ✅ MEJORA: Función para crear directorios necesarios
 */
const ensureDirectories = () => {
  const directories = [
    "./uploads",
    "./logs",
    "./logs/security",
    "./logs/access",
    "./temp",
  ];

  directories.forEach((dir) => {
    const fullPath = path.join(__dirname, "..", dir);

    if (!fs.existsSync(fullPath)) {
      try {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`📁 Directorio creado: ${fullPath}`);
      } catch (error) {
        console.error(`❌ Error creando directorio ${dir}:`, error.message);
      }
    }
  });
};

// ============================================
// ✅ INICIALIZACIÓN DE LA APLICACIÓN
// ============================================

// Crear aplicación Express
const app = express();

// ✅ MEJORA: Configurar trust proxy si está detrás de un proxy
if (config.server?.trustProxy) {
  app.set("trust proxy", config.server.trustProxy);
  console.log("🔒 Trust proxy configurado");
}

// ============================================
// ✅ MIDDLEWARES DE SEGURIDAD MEJORADOS
// ============================================

// 1. Helmet - Seguridad HTTP mejorada
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },

  // Configuraciones específicas por entorno
  ...(config.server.nodeEnv === "development" && {
    contentSecurityPolicy: false,
  }),
};

app.use(helmet(helmetConfig));

// 2. CORS - Control de acceso mejorado
app.use(cors(corsOptions));

// 3. Compression - Compresión GZIP para mejor rendimiento
if (config.server?.enableCompression !== false) {
  app.use(
    compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) {
          return false;
        }
        return compression.filter(req, res);
      },
    }),
  );
  console.log("📦 Compresión GZIP habilitada");
}

// ============================================
// ✅ MIDDLEWARES DE PARSING Y LOGGING
// ============================================

// 4. Parsing de JSON y URL-encoded
app.use(
  express.json({
    limit: config.app?.maxRequestSize || "10mb",
    strict: true,
    verify: (req, res, buf, encoding) => {
      try {
        if (buf && buf.length > 0) {
          JSON.parse(buf.toString());
        }
      } catch (error) {
        console.error("JSON inválido recibido:", error.message);
        throw new Error("JSON inválido");
      }
    },
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: config.app?.maxRequestSize || "10mb",
    parameterLimit: 1000,
  }),
);

// 5. Crear directorios necesarios
ensureDirectories();

// 6. Logging con Morgan mejorado
if (config.server?.nodeEnv !== "test") {
  const morganFormat =
    config.server.nodeEnv === "production" ? "combined" : "dev";

  // Stream para archivo de logs
  const accessLogStream = fs.createWriteStream(
    path.join(__dirname, "../logs/access/access.log"),
    {
      flags: "a",
      encoding: "utf8",
    },
  );

  // Formato personalizado para Morgan
  const morganCustomFormat = (tokens, req, res) => {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: tokens.status(req, res),
      response_time: tokens["response-time"](req, res) + "ms",
      content_length: tokens.res(req, res, "content-length"),
      remote_address: req.ip || req.headers["x-forwarded-for"] || "unknown",
      user_agent: req.headers["user-agent"] || "",
      referrer: req.headers["referer"] || "",
    });
  };

  // Aplicar logging a archivo
  app.use(
    morgan(morganCustomFormat, {
      stream: accessLogStream,
      skip: (req) => {
        return (
          req.path.startsWith("/health") ||
          req.path.startsWith("/internal/") ||
          req.path === "/favicon.ico"
        );
      },
    }),
  );

  // También mostrar en consola en desarrollo
  if (config.server.nodeEnv === "development") {
    app.use(
      morgan("dev", {
        skip: (req) => req.path === "/health",
      }),
    );
  }

  console.log("📝 Logging habilitado");
}

// ============================================
// ✅ APLICAR RATE LIMITING CORREGIDO
// ============================================

// Aplicar rate limiting general
app.use(generalLimiter);
console.log(
  `⏱️  Rate limiting configurado: ${config.security?.rateLimit?.max || 100} req/15min`,
);

// ============================================
// ✅ SERVIR ARCHIVOS ESTÁTICOS MEJORADO
// ============================================

// Servir archivos estáticos con configuraciones de seguridad
const staticOptions = {
  maxAge: config.server.nodeEnv === "production" ? "1d" : "0",
  setHeaders: (res, path) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");

    if (path.includes("/uploads/")) {
      res.setHeader("Cache-Control", "public, max-age=86400");
    }
  },
};

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), staticOptions),
);

// ============================================
// ✅ ENDPOINTS DEL SISTEMA
// ============================================

// ✅ MEJORA: Health check endpoint mejorado
app.get("/health", async (req, res) => {
  const startTime = Date.now();

  try {
    const dbStatus = await testConnection();
    const dbHealthy =
      dbStatus && (dbStatus.success === true || dbStatus === true);

    const healthStatus = {
      status: dbHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - startTime + "ms",
      services: {
        database: {
          status: dbHealthy ? "connected" : "disconnected",
          details: typeof dbStatus === "object" ? dbStatus : {},
        },
        api: "running",
        memory: {
          used:
            (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + " MB",
          total:
            (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2) + " MB",
        },
      },
      version: require("../package.json")?.version || "unknown",
      environment: config.server?.nodeEnv || "development",
      nodeVersion: process.version,
    };

    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    console.error("Error en health check:", error);

    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        database: "error",
        api: "running",
      },
      uptime: process.uptime(),
    });
  }
});

// ✅ MEJORA: Health check liveliness
app.get("/health/live", (req, res) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
  });
});

// ✅ MEJORA: Health check readiness
app.get("/health/ready", async (req, res) => {
  try {
    const dbStatus = await testConnection();
    const ready = dbStatus && (dbStatus.success === true || dbStatus === true);

    res.status(ready ? 200 : 503).json({
      status: ready ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      database: ready ? "connected" : "disconnected",
    });
  } catch (error) {
    res.status(503).json({
      status: "not_ready",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// ✅ MEJORA: Ruta de bienvenida
app.get("/", (req, res) => {
  let packageInfo = {};
  try {
    packageInfo = require("../package.json");
  } catch (error) {
    packageInfo = { version: "1.0.0" };
  }

  res.json({
    success: true,
    message: "🚀 API del Sistema de Inventario con QR",
    version: packageInfo.version || "1.0.0",
    environment: config.server?.nodeEnv || "development",
    timestamp: new Date().toISOString(),
    uptime: process.uptime().toFixed(2) + "s",
    endpoints: {
      auth: "/api/auth",
      products: "/api/products",
      categories: "/api/categories",
      inventory: "/api/inventory",
      qr: "/api/qr",
      reports: "/api/reports",
      health: "/health",
    },
    documentation:
      packageInfo.repository?.url ||
      "https://github.com/yourusername/inventory-qr-backend",
    support: packageInfo.author || "Equipo de desarrollo",
  });
});

// ✅ MEJORA: Ruta para información del sistema (solo desarrollo)
app.get("/system/info", (req, res) => {
  if (config.server?.nodeEnv === "production") {
    return res.status(403).json({
      error: "Acceso no autorizado",
      message: "Esta ruta solo está disponible en desarrollo",
    });
  }

  res.json({
    nodeVersion: process.version,
    platform: process.platform,
    memory: {
      rss: (process.memoryUsage().rss / 1024 / 1024).toFixed(2) + " MB",
      heapTotal:
        (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2) + " MB",
      heapUsed:
        (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + " MB",
    },
    uptime: process.uptime().toFixed(2) + "s",
    environment: config.server?.nodeEnv,
    pid: process.pid,
    config: {
      dbHost: config.db?.host,
      appUrl: config.app?.url,
      corsEnabled: config.security?.corsEnabled,
      port: config.server?.port,
    },
  });
});

// ============================================
// ✅ APLICAR RATE LIMITING ESPECÍFICO
// ============================================

// Aplicar rate limiting específico a rutas de auth
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/reset-password", authLimiter);

console.log("🔐 Rate limiting de autenticación configurado");

// ============================================
// ✅ IMPORTAR Y REGISTRAR RUTAS CORREGIDAS
// ============================================

// ✅ MEJORA: Importar rutas con manejo de errores mejorado
const registerRoutes = () => {
  const routes = [
    { path: "/api/auth", module: "authRoutes" },
    { path: "/api/products", module: "productRoutes" },
    { path: "/api/categories", module: "categoryRoutes" },
    { path: "/api/inventory", module: "inventoryRoutes" },
    { path: "/api/qr", module: "qrRoutes" },
    { path: "/api/reports", module: "reportRoutes" },
  ];

  routes.forEach((route) => {
    try {
      const routePath = `./routes/${route.module}`;
      const routeModule = require(routePath);

      if (
        typeof routeModule === "function" ||
        (routeModule && typeof routeModule === "object")
      ) {
        app.use(route.path, routeModule);
        console.log(`✅ Ruta registrada: ${route.path}`);
      } else {
        console.warn(`⚠️  Ruta ${route.path} no exporta un router válido`);

        // En desarrollo, crear una ruta de error informativa
        if (config.server.nodeEnv === "development") {
          app.use(route.path, (req, res) => {
            res.status(500).json({
              error: "Ruta no disponible",
              message: `El módulo ${route.module} no exporta un router válido`,
              path: req.path,
              timestamp: new Date().toISOString(),
            });
          });
        }
      }
    } catch (error) {
      console.error(`❌ Error cargando ruta ${route.path}:`, error.message);

      // En desarrollo, proveer ruta de error útil
      if (config.server.nodeEnv === "development") {
        app.use(route.path, (req, res) => {
          res.status(500).json({
            error: `Ruta ${route.path} no disponible`,
            message: error.message,
            module: route.module,
            timestamp: new Date().toISOString(),
            suggestion:
              "Verifique que el archivo de rutas exista y exporte correctamente",
          });
        });
      }
    }
  });
};

// Registrar todas las rutas
registerRoutes();

// ============================================
// ✅ CORRECCIÓN CRÍTICA: RUTA DE FALLBACK SIN "*"
// ============================================

// ✅ CORRECCIÓN: En Express, las rutas que no coinciden se manejan al final
// No necesitamos "/api/*" que causa el error de path-to-regexp

// ============================================
// ✅ MIDDLEWARES DE ERROR MEJORADOS
// ============================================

// Middleware para rutas no encontradas (404)
app.use((req, res, next) => {
  console.warn(`🚫 Ruta no encontrada: ${req.method} ${req.originalUrl}`);

  res.status(404).json({
    success: false,
    error: "Ruta no encontrada",
    message: `La ruta ${req.method} ${req.originalUrl} no existe`,
    timestamp: new Date().toISOString(),
    suggestedRoutes: [
      "/api/auth/login",
      "/api/products",
      "/api/categories",
      "/health",
    ],
  });
});

// Middleware para manejo de errores global
app.use((err, req, res, next) => {
  console.error("🔥 Error no manejado:", err);

  // Determinar status code
  const statusCode = err.statusCode || err.status || 500;

  // Respuesta de error
  const errorResponse = {
    success: false,
    error: err.name || "InternalServerError",
    message: err.message || "Ocurrió un error interno",
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  };

  // En desarrollo, incluir stack trace
  if (config.server.nodeEnv === "development") {
    errorResponse.stack = err.stack;
    if (err.details) {
      errorResponse.details = err.details;
    }
  }

  // En producción, sanitizar errores sensibles
  if (config.server.nodeEnv === "production") {
    // Ocultar detalles de errores de base de datos
    if (
      err.message &&
      (err.message.includes("database") || err.message.includes("sql"))
    ) {
      errorResponse.message = "Error de base de datos";
    }

    // Ocultar detalles de errores de sistema
    if (err.message && err.message.includes("Cannot find module")) {
      errorResponse.message = "Error del sistema";
    }
  }

  res.status(statusCode).json(errorResponse);
});

// ============================================
// ✅ MANEJO DE SHUTDOWN MEJORADO
// ============================================

// ✅ MEJORA: Manejo de señales para shutdown graceful
const setupGracefulShutdown = () => {
  const shutdownSignals = ["SIGINT", "SIGTERM", "SIGQUIT"];

  shutdownSignals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(
        `\n⚠️  Recibida señal ${signal}. Iniciando shutdown graceful...`,
      );

      try {
        // Cerrar pool de base de datos si existe
        const dbModule = require("./config/database");
        if (dbModule.closePool && typeof dbModule.closePool === "function") {
          await dbModule.closePool();
        }

        // Cerrar servidor si está corriendo
        if (server && typeof server.close === "function") {
          await new Promise((resolve) => {
            server.close(() => {
              console.log("✅ Servidor HTTP cerrado");
              resolve();
            });
          });
        }

        console.log("👋 Shutdown completado. Hasta pronto!");
        process.exit(0);
      } catch (error) {
        console.error("❌ Error durante shutdown:", error);
        process.exit(1);
      }
    });
  });
};

// ============================================
// ✅ EXPORTAR APLICACIÓN Y FUNCIONES
// ============================================

// Variable para el servidor
let server = null;

module.exports = {
  app,
  startServer: (
    port = config.server?.port || 3000,
    host = config.server?.host || "0.0.0.0",
  ) => {
    return new Promise((resolve, reject) => {
      try {
        server = app.listen(port, host, () => {
          console.log(`
╔══════════════════════════════════════════════════════════╗
║                 🚀 SERVIDOR INICIADO                     ║
╠══════════════════════════════════════════════════════════╣
║ Puerto:       ${String(port).padEnd(38)} ║
║ Host:         ${host.padEnd(38)} ║
║ Entorno:      ${(config.server?.nodeEnv || "development").padEnd(38)} ║
║ PID:          ${String(process.pid).padEnd(38)} ║
║ Tiempo:       ${new Date().toLocaleString().padEnd(38)} ║
╚══════════════════════════════════════════════════════════╝
          `);

          console.log(`🔗 URL Local:  http://localhost:${port}`);
          console.log(`🔗 URL Red:    http://${getLocalIp()}:${port}`);
          console.log(`📊 Health:     http://localhost:${port}/health`);
          console.log(`⏰ Uptime:     ${process.uptime().toFixed(2)}s\n`);

          // Configurar shutdown graceful
          setupGracefulShutdown();

          resolve(server);
        });

        // ✅ MEJORA: Manejo de errores del servidor
        server.on("error", (error) => {
          console.error("❌ Error del servidor:", error);

          if (error.code === "EADDRINUSE") {
            console.error(`⚠️  El puerto ${port} ya está en uso.`);
            console.error("   Soluciones posibles:");
            console.error(
              "   1. Cambie el puerto en la variable de entorno PORT",
            );
            console.error(
              "   2. Libere el puerto: kill -9 $(lsof -t -i:" + port + ")",
            );
            console.error("   3. Espere a que el proceso actual termine");
          }

          reject(error);
        });
      } catch (error) {
        console.error("❌ Error iniciando servidor:", error);
        reject(error);
      }
    });
  },

  // ✅ MEJORA: Función para obtener estadísticas
  getStats: () => {
    return {
      environment: config.server?.nodeEnv,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      pid: process.pid,
    };
  },

  // ✅ MEJORA: Función para cerrar el servidor
  closeServer: () => {
    return new Promise((resolve) => {
      if (server) {
        server.close(() => {
          console.log("✅ Servidor cerrado");
          server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  },
};

// ============================================
// ✅ FUNCIÓN AUXILIAR PARA OBTENER IP LOCAL
// ============================================

function getLocalIp() {
  try {
    const { networkInterfaces } = require("os");
    const nets = networkInterfaces();

    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === "IPv4" && !net.internal) {
          return net.address;
        }
      }
    }
  } catch (error) {
    // Silenciar error
  }

  return "127.0.0.1";
}

// ============================================
// ✅ INICIO DIRECTAMENTE SI SE EJECUTA EL ARCHIVO
// ============================================

// Si este archivo se ejecuta directamente, iniciar el servidor
if (require.main === module) {
  const port = config.server?.port || 3000;
  const host = config.server?.host || "0.0.0.0";

  module.exports
    .startServer(port, host)
    .then(() => {
      console.log("✅ app.js ejecutado directamente");
    })
    .catch((error) => {
      console.error("❌ Error iniciando servidor:", error);
      process.exit(1);
    });
}
