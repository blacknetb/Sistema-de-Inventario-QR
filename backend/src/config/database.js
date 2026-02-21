const mysql = require("mysql2/promise"); // ✅ Asegurarse de usar la versión con promesas
const config = require("./env");

// ✅ MEJORA: Configuración optimizada del pool
const poolConfig = {
  // Configuración básica
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,

  // ✅ MEJORA: Configuración de pool optimizada
  connectionLimit: config.db.connectionLimit || 10,
  connectTimeout: config.db.connectTimeout || 10000,

  // ✅ MEJORA: Configuraciones de rendimiento
  waitForConnections: true,
  queueLimit: config.db.queueLimit || 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: config.db.keepAliveInitialDelay || 0,

  // ✅ MEJORA: Configuraciones de charset y timezone
  charset: "utf8mb4",
  timezone: "+00:00",
  dateStrings: true,

  // // ✅ MEJORA: Configuraciones de SSL
  ssl: config.db.ssl === 'true' ? { rejectUnauthorized: false } : undefined,

  // // ✅ MEJORA: Soporte para múltiples statements
   multipleStatements: config.db.multipleStatements === 'true',

  // // ✅ MEJORA: Configuraciones de debug
   debug: config.server.nodeEnv === 'development' && config.db.debug === 'true'
};

console.log(
  `📊 Configurando pool de conexiones MySQL: ${config.db.database}@${config.db.host}:${config.db.port}`,
);

// Crear pool de conexiones
const pool = mysql.createPool(poolConfig);

// ✅ CORRECCIÓN: Eventos del pool para monitoreo
pool.on("acquire", (connection) => {
  if (
    config.server.nodeEnv === "development" &&
    config.app?.logLevel === "debug"
  ) {
    console.debug(`🔗 Conexión adquirida (ID: ${connection.threadId})`);
  }
});

pool.on("release", (connection) => {
  if (
    config.server.nodeEnv === "development" &&
    config.app?.logLevel === "debug"
  ) {
    console.debug(`🔗 Conexión liberada (ID: ${connection.threadId})`);
  }
});

pool.on("enqueue", () => {
  console.warn(
    "⚠️  Solicitud de conexión en cola - considere aumentar connectionLimit",
  );
});

/**
 * ✅ FUNCIÓN MEJORADA PARA PROBAR CONEXIÓN
 */
const testConnection = async () => {
  const startTime = Date.now();

  try {
    const connection = await pool.getConnection();
    // ✅ CORRECCIÓN: Usar query() en lugar de execute() para consultas simples
    const [result] = await connection.query(
      "SELECT 1 + 1 AS test, NOW() as server_time, VERSION() as version",
    );

    console.log("✅ Conexión a MySQL establecida correctamente");
    console.log(`   - Base de datos: ${config.db.database}`);
    console.log(`   - Versión MySQL: ${result[0].version}`);
    console.log(`   - Tiempo respuesta: ${Date.now() - startTime}ms`);

    connection.release();
    return {
      success: true,
      message: "Conexión establecida",
      version: result[0].version,
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error("❌ Error conectando a MySQL:", error.message);
    console.error(`   - Host: ${config.db.host}:${config.db.port}`);
    console.error(`   - Usuario: ${config.db.user}`);

    return {
      success: false,
      message: "Error de conexión a la base de datos",
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * ✅ FUNCIÓN MEJORADA PARA EJECUTAR CONSULTAS
 * ✅ CORRECCIÓN: Usar execute() para queries con parámetros
 */
const query = async (sql, params = [], options = {}) => {
  const startTime = Date.now();
  const queryId = Math.random().toString(36).substring(7);

  const defaultOptions = {
    logQuery: config.server.nodeEnv === "development",
    timeout: config.db.queryTimeout || 30000,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  if (mergedOptions.logQuery) {
    console.debug(`🔍 Query [${queryId}]:`, {
      sql: sql.substring(0, 200) + (sql.length > 200 ? "..." : ""),
      params: params,
      timeout: mergedOptions.timeout,
    });
  }

  try {
    // ✅ CORRECCIÓN: Usar execute() para queries con parámetros
    // Si no hay parámetros, usar query() para mejor performance
    let results, fields;

    if (params && params.length > 0) {
      [results, fields] = await pool.execute(sql, params);
    } else {
      [results, fields] = await pool.query(sql);
    }

    const executionTime = Date.now() - startTime;

    if (mergedOptions.logQuery) {
      console.debug(`✅ Query [${queryId}] completada en ${executionTime}ms`, {
        rows: Array.isArray(results) ? results.length : "N/A",
        affectedRows: results.affectedRows || 0,
      });
    }

    return {
      success: true,
      data: results,
      fields: fields,
      meta: {
        queryId,
        executionTime,
        affectedRows: results.affectedRows || 0,
        changedRows: results.changedRows || 0,
        insertId: results.insertId || null,
      },
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(
      `❌ Error en consulta [${queryId}] después de ${executionTime}ms:`,
      error.message,
    );
    console.error("   SQL:", sql);
    console.error("   Parámetros:", params);

    const enrichedError = new Error(`Database query failed: ${error.message}`);
    enrichedError.queryId = queryId;
    enrichedError.sql = sql;
    enrichedError.params = params;
    enrichedError.executionTime = executionTime;
    enrichedError.originalError = error;

    throw enrichedError;
  }
};

/**
 * ✅ FUNCIÓN PARA OBTENER CONEXIÓN
 */
const getConnection = async () => {
  try {
    const connection = await pool.getConnection();

    // Configurar conexión
    await connection.query("SET time_zone = ?", [
      config.db.timezone || "+00:00",
    ]);

    return connection;
  } catch (error) {
    console.error("❌ Error obteniendo conexión:", error.message);
    throw error;
  }
};

/**
 * ✅ TRANSACCIONES MEJORADAS
 */
const beginTransaction = async () => {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();
    return connection;
  } catch (error) {
    connection.release();
    console.error("❌ Error iniciando transacción:", error.message);
    throw error;
  }
};

const commitTransaction = async (connection) => {
  try {
    if (connection && typeof connection.commit === "function") {
      await connection.commit();
    }
  } catch (error) {
    console.error("❌ Error confirmando transacción:", error.message);
    throw error;
  } finally {
    if (connection && typeof connection.release === "function") {
      connection.release();
    }
  }
};

const rollbackTransaction = async (connection) => {
  try {
    if (connection && typeof connection.rollback === "function") {
      await connection.rollback();
    }
  } catch (error) {
    console.error("❌ Error revirtiendo transacción:", error.message);
  } finally {
    if (connection && typeof connection.release === "function") {
      connection.release();
    }
  }
};

/**
 * ✅ FUNCIÓN MEJORADA PARA EJECUTAR OPERACIONES EN TRANSACCIÓN
 */
const executeInTransaction = async (operations, options = {}) => {
  const { maxRetries = 0, retryDelay = 100 } = options;
  let retries = 0;
  let lastError;

  while (retries <= maxRetries) {
    const connection = await beginTransaction();

    try {
      const result = await operations(connection);
      await commitTransaction(connection);
      return result;
    } catch (error) {
      await rollbackTransaction(connection);
      lastError = error;

      if (error.code === "ER_LOCK_DEADLOCK" && retries < maxRetries) {
        retries++;
        console.warn(
          `🔄 Deadlock detectado, reintentando (${retries}/${maxRetries})...`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * retries),
        );
        continue;
      }

      throw error;
    }
  }

  throw lastError;
};

/**
 * ✅ FUNCIÓN PARA OBTENER ESTADÍSTICAS DEL POOL
 */
const getPoolStats = () => {
  return {
    totalConnections: pool._allConnections ? pool._allConnections.length : 0,
    idleConnections: pool._freeConnections ? pool._freeConnections.length : 0,
    activeConnections: pool._allConnections
      ? pool._allConnections.length -
        (pool._freeConnections ? pool._freeConnections.length : 0)
      : 0,
    taskQueueSize: pool._queue ? pool._queue.length : 0,
    config: {
      connectionLimit: pool.config.connectionLimit,
      queueLimit: pool.config.queueLimit || 0,
    },
  };
};

/**
 * ✅ FUNCIÓN MEJORADA PARA CERRAR EL POOL
 */
const closePool = async () => {
  console.log("🔒 Cerrando pool de conexiones MySQL...");

  try {
    const stats = getPoolStats();
    console.log(`   - Conexiones activas: ${stats.activeConnections}`);
    console.log(`   - Conexiones inactivas: ${stats.idleConnections}`);

    if (stats.activeConnections > 0) {
      console.log(
        `   ⏳ Esperando ${config.server.shutdownTimeout || 10000}ms para que terminen las conexiones activas...`,
      );
      await new Promise((resolve) =>
        setTimeout(resolve, config.server.shutdownTimeout || 10000),
      );
    }

    await pool.end();
    console.log("✅ Pool de conexiones MySQL cerrado correctamente");
    return true;
  } catch (error) {
    console.error("❌ Error cerrando el pool de conexiones:", error.message);
    return false;
  }
};

// ✅ EXPORTAR MÓDULO MEJORADO
module.exports = {
  pool,
  getConnection,
  testConnection,
  query,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  executeInTransaction,
  closePool,
  getPoolStats,
  DB_CONFIG: config.db,
};
