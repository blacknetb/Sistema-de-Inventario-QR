require("dotenv").config();

// Configuración base validada y corregida
const config = {
  // ✅ CORRECCIÓN: Configuración de base de datos solo con parámetros válidos
  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || "xxx",
    password: process.env.DB_PASSWORD || "xxx",
    database: process.env.DB_NAME || "xxxxx",

    // ✅ SOLO PARÁMETROS VÁLIDOS PARA MYSQL2:
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: "utf8mb4",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "fallback_secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
    algorithm: process.env.JWT_ALGORITHM || "HS256",
  },

  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    host: process.env.HOST || "0.0.0.0",
    nodeEnv: process.env.NODE_ENV || "development",
    shutdownTimeout: parseInt(process.env.SHUTDOWN_TIMEOUT, 10) || 10000,
    trustProxy: process.env.TRUST_PROXY === "true",
    enableCompression: process.env.ENABLE_COMPRESSION !== "false",
  },

  app: {
    name: process.env.APP_NAME || "Inventory QR System",
    url: process.env.APP_URL || "http://localhost:3000",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:8080",
    maxRequestSize: process.env.MAX_REQUEST_SIZE || "10mb",
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760,
    pagination: {
      defaultLimit: parseInt(process.env.PAGINATION_DEFAULT_LIMIT, 10) || 20,
      maxLimit: parseInt(process.env.PAGINATION_MAX_LIMIT, 10) || 100,
      defaultPage: 1,
    },
    logLevel: process.env.LOG_LEVEL || "info",
    logRequests: process.env.LOG_REQUESTS !== "false",
    logQueries: process.env.LOG_QUERIES === "true",
    queryTimeout: parseInt(process.env.QUERY_TIMEOUT, 10) || 30000,
  },

  email: {
    enabled: process.env.EMAIL_ENABLED === "true",
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
    from: process.env.EMAIL_FROM || "noreply@inventory-qr-system.com",
    secure: process.env.EMAIL_SECURE === "true",
    connectionTimeout: parseInt(process.env.EMAIL_TIMEOUT, 10) || 5000,
  },

  security: {
    corsEnabled: process.env.CORS_ENABLED !== "false",
    rateLimit: {
      enabled: process.env.RATE_LIMIT_ENABLED !== "false",
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
      message: "Demasiadas solicitudes, por favor intente más tarde",
      skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL === "true",
    },
    helmetEnabled: process.env.HELMET_ENABLED !== "false",
    hstsEnabled: process.env.HSTS_ENABLED !== "false",
    contentSecurityPolicy: process.env.CSP_ENABLED === "true",
  },

  cache: {
    enabled: process.env.CACHE_ENABLED === "true",
    ttl: parseInt(process.env.CACHE_TTL, 10) || 300,
  },

  uploads: {
    directory: process.env.UPLOADS_DIR || "./uploads",
    maxFiles: parseInt(process.env.MAX_UPLOAD_FILES, 10) || 5,
    allowedMimeTypes: (
      process.env.ALLOWED_MIME_TYPES ||
      "image/jpeg,image/png,image/gif,application/pdf"
    ).split(","),
  },
};

const validateEnvironment = () => {
  const { nodeEnv } = config.server;

  console.log(`🔧 Entorno configurado: ${nodeEnv.toUpperCase()}`);

  if (nodeEnv === "production") {
    const requiredEnvVars = [
      "DB_HOST",
      "DB_USER",
      "DB_PASSWORD",
      "DB_NAME",
      "JWT_SECRET",
    ];

    const missingVars = requiredEnvVars.filter((varName) => {
      const value = process.env[varName];
      return !value || value.trim() === "";
    });

    if (missingVars.length > 0) {
      console.error(`❌ ERROR: Variables de entorno faltantes en producción:`);
      missingVars.forEach((varName) => console.error(`   - ${varName}`));
      console.error(
        "Configure estas variables antes de iniciar en producción.",
      );

      if (process.env.NODE_ENV === "production") {
        process.exit(1);
      }
    }

    if (config.jwt.secret === "fallback_secret") {
      console.warn(
        "⚠️  ADVERTENCIA: Usando JWT secret por defecto. INSEGURO para producción.",
      );
    }

    if (config.db.password === "J-admin-crfenix55") {
      console.warn("⚠️  ADVERTENCIA: Usando contraseña de BD por defecto.");
    }
  }

  if (nodeEnv === "development") {
    console.log("🎯 Modo desarrollo: CORS habilitado, logging detallado");
    config.app.logLevel = "debug";
    config.security.corsEnabled = true;
    config.app.logQueries = true;
  }

  if (nodeEnv === "test") {
    console.log("🧪 Modo testing: Configuración de testing");
    config.db.database =
      process.env.TEST_DB_NAME || `${config.db.database}_test`;
    config.app.logLevel = "error";
  }

  try {
    new URL(config.app.url);
  } catch (error) {
    console.warn(`⚠️  APP_URL inválida: ${config.app.url}`);
  }

  try {
    new URL(config.app.frontendUrl);
  } catch (error) {
    console.warn(`⚠️  FRONTEND_URL inválida: ${config.app.frontendUrl}`);
  }

  console.log(
    `📊 Base de datos: ${config.db.database}@${config.db.host}:${config.db.port}`,
  );
  console.log(`🌐 Servidor: ${config.server.host}:${config.server.port}`);
  console.log(
    `🔐 CORS: ${config.security.corsEnabled ? "Habilitado" : "Deshabilitado"}`,
  );
};

validateEnvironment();

module.exports = config;
