const config = require("./env");

/**
 * ✅ CONFIGURACIÓN CORS OPTIMIZADA Y COMPATIBLE
 * Correcciones aplicadas:
 * 1. ✅ MEJORA: Manejo de errores robusto
 * 2. ✅ MEJORA: Cache optimizado
 * 3. ✅ MEJORA: Validación de orígenes mejorada
 */

// ✅ CACHE optimizado para orígenes permitidos
let cachedAllowedOrigins = null;
let cacheExpiry = 0;
const CACHE_TTL = 60000; // 1 minuto

/**
 * Obtiene lista de orígenes permitidos con cache optimizado
 */
const getAllowedOrigins = () => {
  const now = Date.now();

  // Usar cache si es válido
  if (cachedAllowedOrigins && now < cacheExpiry) {
    return cachedAllowedOrigins;
  }

  const origins = new Set();

  // Orígenes base obligatorios
  const baseUrls = [
    config.app?.frontendUrl,
    config.app?.url,
    "http://localhost:8080",
    "http://localhost:3000",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:3000",
  ].filter((url) => url && typeof url === "string");

  baseUrls.forEach((url) => {
    try {
      origins.add(new URL(url).origin);
    } catch (error) {
      console.warn(`⚠️  URL base inválida ignorada: ${url}`);
    }
  });

  // Orígenes adicionales desde variables de entorno
  if (process.env.ADDITIONAL_CORS_ORIGINS) {
    const additionalOrigins = process.env.ADDITIONAL_CORS_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter((origin) => {
        if (!origin) return false;
        try {
          const url = new URL(origin);
          return url.protocol === "http:" || url.protocol === "https:";
        } catch {
          console.warn(`⚠️  Origen CORS inválido ignorado: ${origin}`);
          return false;
        }
      });

    additionalOrigins.forEach((origin) => origins.add(origin));
  }

  // En desarrollo, permitir rangos de puertos locales
  if (config.server?.nodeEnv === "development") {
    for (let port = 3000; port <= 3010; port++) {
      origins.add(`http://localhost:${port}`);
      origins.add(`http://127.0.0.1:${port}`);
    }
  }

  cachedAllowedOrigins = Array.from(origins);
  cacheExpiry = now + CACHE_TTL;

  console.log(`✅ CORS: ${cachedAllowedOrigins.length} orígenes configurados`);

  return cachedAllowedOrigins;
};

/**
 * Verifica si un origen está permitido
 */
const isOriginAllowed = (origin) => {
  if (!origin) return false;
  return getAllowedOrigins().includes(origin);
};

/**
 * Verifica si es un origen localhost o red local
 */
const isLocalOrigin = (origin) => {
  if (!origin) return false;

  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();

    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.endsWith(".local")
    );
  } catch {
    return false;
  }
};

// ✅ CONFIGURACIÓN CORS PRINCIPAL
const corsOptions = {
  origin: function (origin, callback) {
    // Si CORS está deshabilitado, permitir todo (solo desarrollo/testing)
    if (config.security?.corsEnabled === false) {
      if (config.server?.nodeEnv === "development") {
        console.debug("🔧 CORS deshabilitado pero permitido en desarrollo");
        return callback(null, true);
      }
      return callback(new Error("CORS deshabilitado"), false);
    }

    // Manejo de solicitudes sin origen
    if (!origin) {
      if (
        config.server?.nodeEnv === "development" ||
        config.server?.nodeEnv === "test"
      ) {
        return callback(null, true);
      }
      console.warn("⚠️  Solicitud sin origen en producción");
      return callback(new Error("Solicitudes sin origen no permitidas"), false);
    }

    // Reglas especiales para desarrollo
    if (config.server?.nodeEnv === "development" && isLocalOrigin(origin)) {
      return callback(null, true);
    }

    // Verificación contra lista de orígenes permitidos
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 Origen no permitido: ${origin}`);

      if (config.server?.nodeEnv === "development") {
        console.debug(
          `   Orígenes permitidos: ${getAllowedOrigins().join(", ")}`,
        );
      }

      callback(new Error("Origen no permitido por CORS"), false);
    }
  },

  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],

  allowedHeaders: [
    "Origin",
    "Content-Type",
    "Authorization",
    "Accept",
    "X-Requested-With",
    "X-Access-Token",
    "X-Refresh-Token",
    "Cache-Control",
    "Pragma",
  ],

  exposedHeaders: [
    "X-Access-Token",
    "X-Refresh-Token",
    "Content-Range",
    "X-Total-Count",
  ],

  maxAge: config.server?.nodeEnv === "production" ? 86400 : 3600,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Funciones auxiliares
const refreshCorsCache = () => {
  cachedAllowedOrigins = null;
  cacheExpiry = 0;
  console.log("🔄 Cache CORS refrescado");
  return getAllowedOrigins();
};

module.exports = {
  corsOptions,
  getAllowedOrigins,
  isOriginAllowed,
  refreshCorsCache,
  isLocalOrigin,
};
