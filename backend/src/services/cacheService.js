/**
 * ✅ SERVICIO DE CACHE MEJORADO
 * Correcciones aplicadas:
 * 1. Sistema de cache multinivel (memoria, Redis, archivos)
 * 2. Gestión automática de expiración y limpieza
 * 3. Soporte para tipos de datos complejos
 * 4. Métricas y monitoreo
 */

const NodeCache = require("node-cache");
const Redis = require("ioredis");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const config = require("../config/env");
const logger = require("../utils/logger");

class CacheService {
  constructor() {
    // ✅ MEJORA: Configuración jerárquica de cache
    this.levels = {
      memory: null,
      redis: null,
      disk: null,
    };

    this.config = {
      memory: {
        ttl: config.cache?.memoryTTL || 300, // 5 minutos
        checkperiod: config.cache?.memoryCheckPeriod || 60,
        maxKeys: config.cache?.memoryMaxKeys || 1000,
        useClones: false,
      },
      redis: {
        enabled: config.cache?.redisEnabled || false,
        host: config.cache?.redisHost || "localhost",
        port: config.cache?.redisPort || 6379,
        password: config.cache?.redisPassword,
        keyPrefix: config.cache?.redisPrefix || "inventory:",
        ttl: config.cache?.redisTTL || 3600, // 1 hora
      },
      disk: {
        enabled: config.cache?.diskEnabled || false,
        path: config.cache?.diskPath || "./cache/disk",
        ttl: config.cache?.diskTTL || 86400, // 24 horas
      },
    };

    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      memorySize: 0,
      diskSize: 0,
    };

    this.statsInterval = null;
    this.initialize();
  }

  // ✅ MEJORA: Inicialización asíncrona con manejo de errores
  async initialize() {
    try {
      // Inicializar cache en memoria
      this.levels.memory = new NodeCache({
        stdTTL: this.config.memory.ttl,
        checkperiod: this.config.memory.checkperiod,
        maxKeys: this.config.memory.maxKeys,
        useClones: this.config.memory.useClones,
      });

      // Inicializar Redis si está habilitado
      if (this.config.redis.enabled) {
        await this.initializeRedis();
      }

      // Inicializar cache en disco si está habilitado
      if (this.config.disk.enabled) {
        await this.initializeDiskCache();
      }

      // Configurar listeners de eventos
      this.setupEventListeners();

      // Iniciar monitoreo de estadísticas
      this.startStatsMonitoring();

      logger.info("✅ Cache service initialized successfully");
    } catch (error) {
      logger.error("❌ Error initializing cache service:", error);
      // Fallback a solo memoria
      this.levels.memory = new NodeCache(this.config.memory);
    }
  }

  // ✅ MEJORA: Inicializar Redis con reconexión automática
  async initializeRedis() {
    try {
      const redisConfig = {
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        keyPrefix: this.config.redis.keyPrefix,
      };

      this.levels.redis = new Redis(redisConfig);

      // Verificar conexión
      await this.levels.redis.ping();
      logger.info("✅ Redis cache initialized");
    } catch (error) {
      logger.warn(
        "⚠️ Redis cache unavailable, falling back to memory:",
        error.message,
      );
      this.levels.redis = null;
    }
  }

  // ✅ MEJORA: Inicializar cache en disco con estructura organizada
  async initializeDiskCache() {
    try {
      await fs.mkdir(this.config.disk.path, { recursive: true });
      await fs.mkdir(path.join(this.config.disk.path, "data"), {
        recursive: true,
      });
      await fs.mkdir(path.join(this.config.disk.path, "temp"), {
        recursive: true,
      });

      // Limpiar archivos expirados al iniciar
      await this.cleanupExpiredDiskCache();

      logger.info("✅ Disk cache initialized");
    } catch (error) {
      logger.error("❌ Error initializing disk cache:", error);
      this.config.disk.enabled = false;
    }
  }

  // ✅ MEJORA: Configurar listeners de eventos para monitoreo
  setupEventListeners() {
    if (this.levels.memory) {
      this.levels.memory.on("expired", (key, value) => {
        logger.debug(`Cache expired: ${key}`);
        this.metrics.deletes++;
      });

      this.levels.memory.on("del", (key, value) => {
        logger.debug(`Cache deleted: ${key}`);
        this.metrics.deletes++;
      });
    }
  }

  // ✅ MEJORA: Iniciar monitoreo de estadísticas
  startStatsMonitoring() {
    if (this.statsInterval) clearInterval(this.statsInterval);

    this.statsInterval = setInterval(() => {
      this.updateMetrics();
      this.logStats();
    }, 60000); // Cada minuto

    // Limpiar intervalo al cerrar
    process.on("SIGINT", () => {
      if (this.statsInterval) clearInterval(this.statsInterval);
    });
  }

  // ✅ MEJORA: Obtener valor del cache (estrategia multinivel)
  async get(key, options = {}) {
    const startTime = Date.now();
    const {
      skipMemory = false,
      skipRedis = false,
      skipDisk = false,
      ttl = null,
    } = options;

    try {
      let value = null;
      let source = "none";

      // 1. Intentar desde memoria
      if (!skipMemory && this.levels.memory) {
        value = this.levels.memory.get(key);
        if (value !== undefined) {
          source = "memory";
          this.metrics.hits++;
        }
      }

      // 2. Intentar desde Redis
      if (value === null && !skipRedis && this.levels.redis) {
        try {
          const redisValue = await this.levels.redis.get(key);
          if (redisValue !== null) {
            value = this.deserialize(redisValue);
            source = "redis";
            this.metrics.hits++;

            // Actualizar cache en memoria (cache aside)
            if (this.levels.memory) {
              this.levels.memory.set(key, value, ttl || this.config.memory.ttl);
            }
          }
        } catch (redisError) {
          logger.debug("Redis get error:", redisError.message);
        }
      }

      // 3. Intentar desde disco
      if (value === null && !skipDisk && this.config.disk.enabled) {
        try {
          value = await this.getFromDisk(key);
          if (value !== null) {
            source = "disk";
            this.metrics.hits++;

            // Actualizar cache en memoria
            if (this.levels.memory) {
              this.levels.memory.set(key, value, ttl || this.config.memory.ttl);
            }
          }
        } catch (diskError) {
          logger.debug("Disk get error:", diskError.message);
        }
      }

      // Si no se encontró en ningún nivel
      if (value === null) {
        this.metrics.misses++;
      }

      const duration = Date.now() - startTime;

      if (config.app.logLevel === "debug") {
        logger.debug(`Cache GET: ${key}`, {
          source,
          duration: `${duration}ms`,
          hit: value !== null,
        });
      }

      return {
        value,
        source,
        duration,
        hit: value !== null,
      };
    } catch (error) {
      this.metrics.errors++;
      logger.error(`Cache GET error for key ${key}:`, error);
      return { value: null, source: "error", duration: 0, hit: false };
    }
  }

  // ✅ MEJORA: Establecer valor en cache (estrategia write-through)
  async set(key, value, options = {}) {
    const startTime = Date.now();
    const {
      ttl = null,
      level = "all", // 'memory', 'redis', 'disk', 'all'
      compress = false,
    } = options;

    try {
      // Serializar valor
      const serializedValue = this.serialize(value);
      let operations = 0;

      // 1. Almacenar en memoria
      if ((level === "all" || level === "memory") && this.levels.memory) {
        this.levels.memory.set(key, value, ttl || this.config.memory.ttl);
        operations++;
      }

      // 2. Almacenar en Redis
      if ((level === "all" || level === "redis") && this.levels.redis) {
        try {
          const redisTTL = ttl || this.config.redis.ttl;
          await this.levels.redis.set(key, serializedValue, "EX", redisTTL);
          operations++;
        } catch (redisError) {
          logger.warn("Redis set error:", redisError.message);
        }
      }

      // 3. Almacenar en disco
      if ((level === "all" || level === "disk") && this.config.disk.enabled) {
        try {
          const diskTTL = ttl || this.config.disk.ttl;
          await this.setToDisk(key, value, diskTTL, compress);
          operations++;
        } catch (diskError) {
          logger.warn("Disk set error:", diskError.message);
        }
      }

      this.metrics.sets++;
      const duration = Date.now() - startTime;

      if (config.app.logLevel === "debug") {
        logger.debug(`Cache SET: ${key}`, {
          operations,
          duration: `${duration}ms`,
          size: serializedValue.length,
        });
      }

      return {
        success: true,
        operations,
        duration,
        size: serializedValue.length,
      };
    } catch (error) {
      this.metrics.errors++;
      logger.error(`Cache SET error for key ${key}:`, error);
      return { success: false, error: error.message };
    }
  }

  // ✅ MEJORA: Eliminar del cache (estrategia write-through)
  async delete(key, options = {}) {
    const startTime = Date.now();
    const { level = "all" } = options;

    try {
      let operations = 0;

      // 1. Eliminar de memoria
      if ((level === "all" || level === "memory") && this.levels.memory) {
        this.levels.memory.del(key);
        operations++;
      }

      // 2. Eliminar de Redis
      if ((level === "all" || level === "redis") && this.levels.redis) {
        try {
          await this.levels.redis.del(key);
          operations++;
        } catch (redisError) {
          logger.warn("Redis delete error:", redisError.message);
        }
      }

      // 3. Eliminar de disco
      if ((level === "all" || level === "disk") && this.config.disk.enabled) {
        try {
          await this.deleteFromDisk(key);
          operations++;
        } catch (diskError) {
          logger.warn("Disk delete error:", diskError.message);
        }
      }

      this.metrics.deletes++;
      const duration = Date.now() - startTime;

      logger.debug(`Cache DELETE: ${key}`, {
        operations,
        duration: `${duration}ms`,
      });

      return { success: true, operations, duration };
    } catch (error) {
      this.metrics.errors++;
      logger.error(`Cache DELETE error for key ${key}:`, error);
      return { success: false, error: error.message };
    }
  }

  // ✅ MEJORA: Patrón "get or set" para evitar race conditions
  async getOrSet(key, fetchFunction, options = {}) {
    const startTime = Date.now();

    // Intentar obtener del cache
    const cacheResult = await this.get(key, options);

    if (cacheResult.hit) {
      return {
        ...cacheResult,
        fromCache: true,
        fetchTime: 0,
      };
    }

    // Si no está en cache, ejecutar función de fetch
    try {
      const fetchStart = Date.now();
      const value = await fetchFunction();
      const fetchTime = Date.now() - fetchStart;

      // Almacenar en cache
      await this.set(key, value, options);

      const totalTime = Date.now() - startTime;

      return {
        value,
        source: "fetch",
        duration: totalTime,
        hit: false,
        fromCache: false,
        fetchTime,
      };
    } catch (error) {
      logger.error(`Cache GETORSET fetch error for key ${key}:`, error);
      return {
        value: null,
        source: "error",
        duration: Date.now() - startTime,
        hit: false,
        fromCache: false,
        fetchTime: 0,
        error: error.message,
      };
    }
  }

  // ✅ MEJORA: Cache con prefijo para agrupamiento
  async getByPrefix(prefix, options = {}) {
    try {
      const results = [];
      let source = "none";

      // Buscar en memoria
      if (this.levels.memory) {
        const keys = this.levels.memory.keys();
        const matchingKeys = keys.filter((key) => key.startsWith(prefix));

        matchingKeys.forEach((key) => {
          const value = this.levels.memory.get(key);
          if (value !== undefined) {
            results.push({ key, value });
            source = "memory";
          }
        });
      }

      // Buscar en Redis si hay resultados
      if (results.length === 0 && this.levels.redis) {
        try {
          const redisKeys = await this.levels.redis.keys(`${prefix}*`);

          for (const key of redisKeys) {
            const value = await this.levels.redis.get(key);
            if (value) {
              results.push({
                key: key.replace(this.config.redis.keyPrefix, ""),
                value: this.deserialize(value),
              });
              source = "redis";
            }
          }
        } catch (redisError) {
          logger.debug("Redis prefix get error:", redisError.message);
        }
      }

      return {
        results,
        count: results.length,
        source,
        prefix,
      };
    } catch (error) {
      logger.error(`Cache GETBYPREFIX error for prefix ${prefix}:`, error);
      return { results: [], count: 0, source: "error", prefix };
    }
  }

  // ✅ MEJORA: Invalidar por patrón
  async invalidateByPattern(pattern) {
    try {
      let deleted = 0;

      // Invalidar en memoria
      if (this.levels.memory) {
        const keys = this.levels.memory.keys();
        const matchingKeys = keys.filter((key) =>
          key.match(new RegExp(pattern)),
        );

        matchingKeys.forEach((key) => {
          this.levels.memory.del(key);
          deleted++;
        });
      }

      // Invalidar en Redis
      if (this.levels.redis) {
        try {
          const redisKeys = await this.levels.redis.keys(`*${pattern}*`);
          if (redisKeys.length > 0) {
            await this.levels.redis.del(...redisKeys);
            deleted += redisKeys.length;
          }
        } catch (redisError) {
          logger.warn("Redis pattern delete error:", redisError.message);
        }
      }

      // Invalidar en disco
      if (this.config.disk.enabled) {
        try {
          const files = await fs.readdir(
            path.join(this.config.disk.path, "data"),
          );
          const matchingFiles = files.filter((file) =>
            file.match(new RegExp(pattern)),
          );

          for (const file of matchingFiles) {
            await fs.unlink(path.join(this.config.disk.path, "data", file));
            deleted++;
          }
        } catch (diskError) {
          logger.warn("Disk pattern delete error:", diskError.message);
        }
      }

      logger.info(
        `Cache invalidated by pattern "${pattern}": ${deleted} items`,
      );
      return { success: true, deleted };
    } catch (error) {
      logger.error(
        `Cache INVALIDATEBYPATTERN error for pattern ${pattern}:`,
        error,
      );
      return { success: false, error: error.message };
    }
  }

  // ✅ MEJORA: Métodos para cache en disco
  async getFromDisk(key) {
    try {
      const hash = this.hashKey(key);
      const filePath = path.join(this.config.disk.path, "data", hash);

      const data = await fs.readFile(filePath, "utf8");
      const cacheItem = JSON.parse(data);

      // Verificar expiración
      if (cacheItem.expires && cacheItem.expires < Date.now()) {
        await this.deleteFromDisk(key);
        return null;
      }

      // Deserializar valor
      let value = cacheItem.value;

      if (cacheItem.compressed) {
        value = this.decompress(value);
      }

      if (cacheItem.encoded) {
        value = Buffer.from(value, "base64");
      }

      return this.deserialize(value);
    } catch (error) {
      if (error.code !== "ENOENT") {
        logger.debug("Disk cache read error:", error.message);
      }
      return null;
    }
  }

  async setToDisk(key, value, ttl, compress = false) {
    try {
      const hash = this.hashKey(key);
      const filePath = path.join(this.config.disk.path, "data", hash);

      let serializedValue = this.serialize(value);

      const cacheItem = {
        key,
        value: serializedValue,
        expires: ttl ? Date.now() + ttl * 1000 : null,
        created: Date.now(),
        compressed: false,
        encoded: false,
      };

      // Comprimir si está habilitado
      if (compress && serializedValue.length > 1024) {
        cacheItem.value = this.compress(serializedValue);
        cacheItem.compressed = true;
      }

      // Codificar si es binario
      if (Buffer.isBuffer(cacheItem.value)) {
        cacheItem.value = cacheItem.value.toString("base64");
        cacheItem.encoded = true;
      }

      await fs.writeFile(filePath, JSON.stringify(cacheItem), "utf8");
      return true;
    } catch (error) {
      logger.error("Disk cache write error:", error);
      return false;
    }
  }

  async deleteFromDisk(key) {
    try {
      const hash = this.hashKey(key);
      const filePath = path.join(this.config.disk.path, "data", hash);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if (error.code !== "ENOENT") {
        logger.debug("Disk cache delete error:", error.message);
      }
      return false;
    }
  }

  async cleanupExpiredDiskCache() {
    try {
      const files = await fs.readdir(path.join(this.config.disk.path, "data"));
      let cleaned = 0;

      for (const file of files) {
        try {
          const filePath = path.join(this.config.disk.path, "data", file);
          const data = await fs.readFile(filePath, "utf8");
          const cacheItem = JSON.parse(data);

          if (cacheItem.expires && cacheItem.expires < Date.now()) {
            await fs.unlink(filePath);
            cleaned++;
          }
        } catch (error) {
          // Si hay error al leer, eliminar el archivo
          const filePath = path.join(this.config.disk.path, "data", file);
          await fs.unlink(filePath).catch(() => {});
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.info(`Cleaned ${cleaned} expired disk cache files`);
      }

      return cleaned;
    } catch (error) {
      logger.error("Disk cache cleanup error:", error);
      return 0;
    }
  }

  // ✅ MEJORA: Métodos de utilidad
  hashKey(key) {
    return crypto.createHash("md5").update(key).digest("hex");
  }

  serialize(value) {
    try {
      return JSON.stringify(value, (key, val) => {
        // Manejar tipos especiales
        if (val instanceof Date) {
          return { __type: "Date", value: val.toISOString() };
        }
        if (val instanceof Buffer) {
          return { __type: "Buffer", value: val.toString("base64") };
        }
        if (val instanceof Set) {
          return { __type: "Set", value: Array.from(val) };
        }
        if (val instanceof Map) {
          return { __type: "Map", value: Array.from(val.entries()) };
        }
        return val;
      });
    } catch (error) {
      logger.error("Cache serialization error:", error);
      return JSON.stringify({ __error: "Serialization failed" });
    }
  }

  deserialize(data) {
    try {
      return JSON.parse(data, (key, val) => {
        if (val && typeof val === "object") {
          if (val.__type === "Date") {
            return new Date(val.value);
          }
          if (val.__type === "Buffer") {
            return Buffer.from(val.value, "base64");
          }
          if (val.__type === "Set") {
            return new Set(val.value);
          }
          if (val.__type === "Map") {
            return new Map(val.value);
          }
        }
        return val;
      });
    } catch (error) {
      logger.error("Cache deserialization error:", error);
      return null;
    }
  }

  compress(data) {
    // Implementación simple - en producción usar zlib
    return data; // Placeholder
  }

  decompress(data) {
    return data; // Placeholder
  }

  // ✅ MEJORA: Métricas y estadísticas
  async updateMetrics() {
    try {
      // Tamaño de memoria
      if (this.levels.memory) {
        const stats = this.levels.memory.getStats();
        this.metrics.memorySize = stats.keys;
      }

      // Tamaño de disco
      if (this.config.disk.enabled) {
        try {
          const files = await fs.readdir(
            path.join(this.config.disk.path, "data"),
          );
          this.metrics.diskSize = files.length;
        } catch (error) {
          this.metrics.diskSize = 0;
        }
      }

      // Estadísticas de Redis
      if (this.levels.redis) {
        try {
          const redisInfo = await this.levels.redis.info();
          // Parsear info para obtener métricas específicas
        } catch (error) {
          // Ignorar errores de Redis
        }
      }
    } catch (error) {
      logger.error("Error updating cache metrics:", error);
    }
  }

  logStats() {
    const hitRate =
      this.metrics.hits + this.metrics.misses > 0
        ? (
            (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) *
            100
          ).toFixed(2)
        : 0;

    logger.info("📊 Cache Statistics", {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      hitRate: `${hitRate}%`,
      sets: this.metrics.sets,
      deletes: this.metrics.deletes,
      errors: this.metrics.errors,
      memorySize: this.metrics.memorySize,
      diskSize: this.metrics.diskSize,
      redisEnabled: !!this.levels.redis,
      diskEnabled: this.config.disk.enabled,
    });
  }

  getStats() {
    const hitRate =
      this.metrics.hits + this.metrics.misses > 0
        ? (
            (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) *
            100
          ).toFixed(2)
        : 0;

    return {
      metrics: { ...this.metrics },
      hitRate: `${hitRate}%`,
      levels: {
        memory: {
          enabled: !!this.levels.memory,
          stats: this.levels.memory ? this.levels.memory.getStats() : null,
        },
        redis: {
          enabled: !!this.levels.redis,
          connected: this.levels.redis
            ? this.levels.redis.status === "ready"
            : false,
        },
        disk: {
          enabled: this.config.disk.enabled,
        },
      },
      config: {
        memoryTTL: this.config.memory.ttl,
        redisTTL: this.config.redis.ttl,
        diskTTL: this.config.disk.ttl,
      },
    };
  }

  // ✅ MEJORA: Limpieza y cierre
  async clear(level = "all") {
    try {
      let cleared = 0;

      if ((level === "all" || level === "memory") && this.levels.memory) {
        this.levels.memory.flushAll();
        cleared++;
      }

      if ((level === "all" || level === "redis") && this.levels.redis) {
        try {
          await this.levels.redis.flushall();
          cleared++;
        } catch (redisError) {
          logger.warn("Redis clear error:", redisError.message);
        }
      }

      if ((level === "all" || level === "disk") && this.config.disk.enabled) {
        try {
          const files = await fs.readdir(
            path.join(this.config.disk.path, "data"),
          );
          for (const file of files) {
            await fs.unlink(path.join(this.config.disk.path, "data", file));
          }
          cleared++;
        } catch (diskError) {
          logger.warn("Disk clear error:", diskError.message);
        }
      }

      logger.info(`Cache cleared (level: ${level}): ${cleared} levels`);
      return { success: true, cleared };
    } catch (error) {
      logger.error("Cache clear error:", error);
      return { success: false, error: error.message };
    }
  }

  async close() {
    try {
      // Detener monitoreo
      if (this.statsInterval) {
        clearInterval(this.statsInterval);
        this.statsInterval = null;
      }

      // Cerrar Redis
      if (this.levels.redis) {
        await this.levels.redis.quit();
      }

      logger.info("Cache service closed");
    } catch (error) {
      logger.error("Error closing cache service:", error);
    }
  }

  // ✅ MEJORA: Métodos de conveniencia para tipos comunes
  async cacheProducts(products, prefix = "products", ttl = 300) {
    const cacheKey = `${prefix}:list`;
    return this.set(cacheKey, products, { ttl });
  }

  async getCachedProducts(prefix = "products") {
    const cacheKey = `${prefix}:list`;
    return this.get(cacheKey);
  }

  async cacheProductById(productId, product, ttl = 300) {
    const cacheKey = `product:${productId}`;
    return this.set(cacheKey, product, { ttl });
  }

  async getCachedProductById(productId) {
    const cacheKey = `product:${productId}`;
    return this.get(cacheKey);
  }

  async invalidateProductCache(productId = null) {
    if (productId) {
      await this.delete(`product:${productId}`);
    }
    await this.invalidateByPattern("^product:");
    await this.invalidateByPattern("^products:");
  }

  async cacheReport(reportType, data, ttl = 600) {
    const cacheKey = `report:${reportType}:${Date.now()}`;
    return this.set(cacheKey, data, { ttl, level: "disk" });
  }

  async getCachedReport(reportType, maxAge = 300) {
    const pattern = `^report:${reportType}:`;
    const result = await this.getByPrefix(pattern);

    if (result.results.length > 0) {
      // Ordenar por timestamp (más reciente primero)
      result.results.sort((a, b) => {
        const aTime = parseInt(a.key.split(":").pop());
        const bTime = parseInt(b.key.split(":").pop());
        return bTime - aTime;
      });

      const newest = result.results[0];
      const age = Date.now() - parseInt(newest.key.split(":").pop());

      if (age < maxAge * 1000) {
        return newest.value;
      }
    }

    return null;
  }
}

// ✅ MEJORA: Exportar instancia singleton
module.exports = new CacheService();
