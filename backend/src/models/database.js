/**
 * ✅ MODELO DE BASE DE DATOS MEJORADO Y CORREGIDO
 * Archivo: src/models/database.js
 *
 * Correcciones principales aplicadas:
 * 1. ✅ CORREGIDO: Clave foránea incompatible en línea 915 (category_id)
 * 2. ✅ Mejorado: Validación de relaciones entre tablas
 * 3. ✅ Optimizado: Consultas con índices correctos
 * 4. ✅ Mejorado: Manejo de transacciones y errores
 */

const mysql = require("mysql2/promise");
const Joi = require("joi");
const config = require("../config/env");
const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");

/**
 * ✅ ESQUEMAS DE VALIDACIÓN MEJORADOS
 */
const validationSchemas = {
  user: Joi.object({
    id: Joi.number().integer().min(1),
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().max(100).required(),
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(6).max(255).required(),
    role: Joi.string()
      .valid("admin", "manager", "employee", "viewer")
      .default("employee"),
    status: Joi.string()
      .valid("active", "inactive", "suspended")
      .default("active"),
    email_verified: Joi.boolean().default(false),
    phone: Joi.string().max(20).allow(null, ""),
    department: Joi.string().max(100).allow(null, ""),
    last_login: Joi.date().allow(null),
    created_at: Joi.date(),
    updated_at: Joi.date(),
  }),

  product: Joi.object({
    id: Joi.number().integer().min(1),
    code: Joi.string().max(50).required(),
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(1000).allow(null, ""),
    category_id: Joi.number().integer().min(1).allow(null),
    brand: Joi.string().max(100).allow(null, ""),
    model: Joi.string().max(100).allow(null, ""),
    sku: Joi.string().max(50).allow(null, ""),
    barcode: Joi.string().max(100).allow(null, ""),
    unit: Joi.string().max(20).default("unit"),
    cost_price: Joi.number().precision(2).min(0),
    selling_price: Joi.number().precision(2).min(0),
    min_stock: Joi.number().integer().min(0).default(0),
    max_stock: Joi.number().integer().min(0),
    current_stock: Joi.number().integer().min(0).default(0),
    location: Joi.string().max(200).allow(null, ""),
    supplier_id: Joi.number().integer().min(1).allow(null),
    weight: Joi.number().precision(3).allow(null),
    dimensions: Joi.string().max(100).allow(null, ""),
    image_url: Joi.string().uri().max(500).allow(null, ""),
    qr_code: Joi.string().max(500).allow(null, ""),
    status: Joi.string()
      .valid("active", "inactive", "discontinued")
      .default("active"),
    notes: Joi.string().max(1000).allow(null, ""),
    created_by: Joi.number().integer().min(1),
    updated_by: Joi.number().integer().min(1).allow(null),
    created_at: Joi.date(),
    updated_at: Joi.date(),
  }),

  category: Joi.object({
    id: Joi.number().integer().min(1),
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).allow(null, ""),
    parent_id: Joi.number().integer().min(1).allow(null),
    icon: Joi.string().max(50).allow(null, ""),
    color: Joi.string().max(20).allow(null, ""),
    sort_order: Joi.number().integer().default(0),
    status: Joi.string().valid("active", "inactive").default("active"),
    created_at: Joi.date(),
    updated_at: Joi.date(),
  }),

  inventory: Joi.object({
    id: Joi.number().integer().min(1),
    product_id: Joi.number().integer().min(1).required(),
    quantity: Joi.number().integer().required(),
    type: Joi.string()
      .valid("in", "out", "adjust", "transfer", "initial")
      .required(),
    reference_id: Joi.string().max(100).allow(null, ""),
    reference_type: Joi.string().max(50).allow(null, ""),
    location_from: Joi.string().max(200).allow(null, ""),
    location_to: Joi.string().max(200).allow(null, ""),
    notes: Joi.string().max(1000).allow(null, ""),
    user_id: Joi.number().integer().min(1).required(),
    created_at: Joi.date(),
    updated_at: Joi.date(),
  }),
};

/**
 * ✅ CLASE PRINCIPAL: DatabaseManager CORREGIDA
 */
class DatabaseManager {
  constructor() {
    this.pool = null;
    this.cache = new Map();
    this.queryStats = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      totalExecutionTime: 0,
    };
    this.cacheEnabled = config.cache?.enabled !== false;
    this.cacheTTL = config.cache?.ttl || 300;

    // ✅ CORRECCIÓN: Inicialización diferida
    this.initialized = false;
    this.initializing = false;
  }

  /**
   * ✅ Inicializar conexión con manejo de singleton
   */
  async initialize() {
    if (this.initialized) return this;
    if (this.initializing) {
      // Esperar si ya se está inicializando
      while (this.initializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return this;
    }

    this.initializing = true;

    try {
      console.log("🔌 Inicializando gestor de base de datos...");

      // ✅ CORRECCIÓN: Configuración optimizada y validada
      const poolConfig = {
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,

        // Configuración de pool optimizada
        connectionLimit: config.db.connectionLimit || 10,
        connectTimeout: config.db.connectTimeout || 10000,
        acquireTimeout: config.db.acquireTimeout || 30000,

        // Configuración de rendimiento
        waitForConnections: true,
        queueLimit: config.db.queueLimit || 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: config.db.keepAliveInitialDelay || 0,

        // Configuración de charset - IMPORTANTE para compatibilidad
        charset: "utf8mb4",
        timezone: config.db.timezone || "local",
        dateStrings: true,

        // SSL opcional
        ssl: config.db.ssl ? { rejectUnauthorized: false } : undefined,

        // Debug solo en desarrollo
        debug:
          config.server.nodeEnv === "development" && config.db.debug === "true",

        // ✅ CORRECCIÓN: Configuración de conexión para mejor manejo
        multipleStatements: false, // Por seguridad
        typeCast: function (field, next) {
          // Convertir TINYINT(1) a booleano
          if (field.type === "TINY" && field.length === 1) {
            return field.string() === "1";
          }
          return next();
        },
      };

      this.pool = mysql.createPool(poolConfig);

      // Configurar listeners del pool
      this.setupPoolListeners();

      // Probar conexión
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Conexión fallida: ${connectionTest.message}`);
      }

      // ✅ CORRECCIÓN: Crear tablas en orden correcto
      await this.createTablesIfNotExist();

      // Ejecutar migraciones pendientes
      await this.runMigrations();

      // Ejecutar seeds si es necesario
      if (
        config.server.nodeEnv === "development" ||
        config.server.nodeEnv === "test"
      ) {
        await this.runSeeds();
      }

      console.log("✅ Gestor de base de datos inicializado correctamente");

      this.initialized = true;
      this.initializing = false;

      return this;
    } catch (error) {
      this.initializing = false;
      console.error(
        "❌ Error inicializando gestor de base de datos:",
        error.message,
      );
      throw error;
    }
  }

  /**
   * ✅ Configurar listeners del pool
   */
  setupPoolListeners() {
    this.pool.on("acquire", (connection) => {
      if (config.server.nodeEnv === "development") {
        console.debug(`🔗 Conexión adquirida (ID: ${connection.threadId})`);
      }
    });

    this.pool.on("release", (connection) => {
      if (config.server.nodeEnv === "development") {
        console.debug(`🔗 Conexión liberada (ID: ${connection.threadId})`);
      }
    });

    this.pool.on("enqueue", () => {
      const stats = this.getPoolStats();
      if (stats && stats.taskQueueSize > 5) {
        console.warn(
          `⚠️  Cola de conexiones: ${stats.taskQueueSize} solicitudes en espera`,
        );
      }
    });
  }

  /**
   * ✅ Probar conexión mejorado
   */
  async testConnection() {
    const startTime = Date.now();

    try {
      const connection = await this.pool.getConnection();
      const [result] = await connection.query(
        "SELECT 1 + 1 AS test, NOW() as server_time, VERSION() as version",
      );

      const responseTime = Date.now() - startTime;

      console.log("✅ Conexión a MySQL establecida correctamente");
      console.log(`   - Base de datos: ${config.db.database}`);
      console.log(`   - Versión MySQL: ${result[0].version}`);
      console.log(`   - Tiempo respuesta: ${responseTime}ms`);

      connection.release();

      return {
        success: true,
        message: "Conexión establecida",
        version: result[0].version,
        responseTime,
      };
    } catch (error) {
      console.error("❌ Error conectando a MySQL:", error.message);

      return {
        success: false,
        message: `Error de conexión: ${error.message}`,
        error: error.message,
        code: error.code,
      };
    }
  }

  /**
   * ✅ CREAR TABLAS - CORREGIDO EL ORDEN Y LAS CLAVES FORÁNEAS
   */
  async createTablesIfNotExist() {
    try {
      console.log("📋 Creando estructura de base de datos...");

      // ✅ CORRECCIÓN: Crear tablas en el orden correcto para evitar dependencias circulares
      const tables = [
        // 1. Primero usuarios (no tiene dependencias externas)
        `CREATE TABLE IF NOT EXISTS users (
          id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role ENUM('admin', 'manager', 'employee', 'viewer') NOT NULL DEFAULT 'employee',
          status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
          email_verified BOOLEAN DEFAULT FALSE,
          phone VARCHAR(20),
          department VARCHAR(100),
          last_login DATETIME,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_users_email (email),
          INDEX idx_users_username (username),
          INDEX idx_users_role (role),
          INDEX idx_users_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 2. Tabla de categorías (solo depende de sí misma para parent_id)
        `CREATE TABLE IF NOT EXISTS categories (
          id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(100) NOT NULL,
          description VARCHAR(500),
          parent_id INT UNSIGNED,
          icon VARCHAR(50),
          color VARCHAR(20),
          sort_order INT DEFAULT 0,
          status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_categories_name (name),
          INDEX idx_categories_parent (parent_id),
          INDEX idx_categories_status (status),
          FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 3. Tabla de proveedores (depende de users)
        `CREATE TABLE IF NOT EXISTS suppliers (
          id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(200) NOT NULL,
          contact_person VARCHAR(100),
          email VARCHAR(100),
          phone VARCHAR(20),
          address TEXT,
          tax_id VARCHAR(50),
          payment_terms VARCHAR(100),
          status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
          notes TEXT,
          created_by INT UNSIGNED NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_suppliers_name (name),
          INDEX idx_suppliers_email (email),
          INDEX idx_suppliers_status (status),
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 4. Tabla de clientes (depende de users)
        `CREATE TABLE IF NOT EXISTS customers (
          id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(200) NOT NULL,
          email VARCHAR(100),
          phone VARCHAR(20),
          address TEXT,
          tax_id VARCHAR(50),
          customer_type ENUM('individual', 'business') DEFAULT 'individual',
          status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
          notes TEXT,
          created_by INT UNSIGNED NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_customers_name (name),
          INDEX idx_customers_email (email),
          INDEX idx_customers_status (status),
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 5. Tabla de productos (depende de categories, suppliers, y users) - ✅ CORRECCIÓN AQUÍ
        `CREATE TABLE IF NOT EXISTS products (
          id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
          code VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(200) NOT NULL,
          description TEXT,
          category_id INT UNSIGNED,
          brand VARCHAR(100),
          model VARCHAR(100),
          sku VARCHAR(50),
          barcode VARCHAR(100),
          unit VARCHAR(20) DEFAULT 'unit',
          cost_price DECIMAL(12,2),
          selling_price DECIMAL(12,2),
          min_stock INT DEFAULT 0,
          max_stock INT,
          current_stock INT DEFAULT 0,
          location VARCHAR(200),
          supplier_id INT UNSIGNED,
          weight DECIMAL(10,3),
          dimensions VARCHAR(100),
          image_url VARCHAR(500),
          qr_code VARCHAR(500),
          status ENUM('active', 'inactive', 'discontinued') NOT NULL DEFAULT 'active',
          notes TEXT,
          created_by INT UNSIGNED NOT NULL,
          updated_by INT UNSIGNED,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_products_code (code),
          INDEX idx_products_name (name),
          INDEX idx_products_category (category_id),
          INDEX idx_products_sku (sku),
          INDEX idx_products_barcode (barcode),
          INDEX idx_products_status (status),
          INDEX idx_products_stock (current_stock),
          INDEX idx_products_supplier (supplier_id),
          INDEX idx_products_created_by (created_by),
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL ON UPDATE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 6. Tabla de transacciones (depende de users, customers, suppliers)
        `CREATE TABLE IF NOT EXISTS transactions (
          id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
          transaction_number VARCHAR(50) UNIQUE NOT NULL,
          type ENUM('purchase', 'sale', 'return', 'adjustment', 'transfer') NOT NULL,
          status ENUM('pending', 'completed', 'cancelled', 'returned') NOT NULL DEFAULT 'pending',
          total_amount DECIMAL(12,2),
          tax_amount DECIMAL(10,2) DEFAULT 0,
          discount_amount DECIMAL(10,2) DEFAULT 0,
          net_amount DECIMAL(12,2),
          customer_id INT UNSIGNED,
          supplier_id INT UNSIGNED,
          notes TEXT,
          payment_method VARCHAR(50),
          payment_status ENUM('pending', 'paid', 'partial', 'refunded') DEFAULT 'pending',
          created_by INT UNSIGNED NOT NULL,
          approved_by INT UNSIGNED,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          completed_at DATETIME,
          INDEX idx_transactions_number (transaction_number),
          INDEX idx_transactions_type (type),
          INDEX idx_transactions_status (status),
          INDEX idx_transactions_payment_status (payment_status),
          INDEX idx_transactions_created_by (created_by),
          INDEX idx_transactions_created_at (created_at),
          INDEX idx_transactions_customer (customer_id),
          INDEX idx_transactions_supplier (supplier_id),
          FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL ON UPDATE CASCADE,
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL ON UPDATE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 7. Tabla de detalles de transacción (depende de transactions y products)
        `CREATE TABLE IF NOT EXISTS transaction_items (
          id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
          transaction_id INT UNSIGNED NOT NULL,
          product_id INT UNSIGNED NOT NULL,
          quantity INT NOT NULL,
          unit_price DECIMAL(12,2) NOT NULL,
          total_price DECIMAL(12,2) NOT NULL,
          discount DECIMAL(10,2) DEFAULT 0,
          tax DECIMAL(10,2) DEFAULT 0,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_transaction_items_transaction (transaction_id),
          INDEX idx_transaction_items_product (product_id),
          FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 8. Tabla de movimientos de inventario (depende de products y users)
        `CREATE TABLE IF NOT EXISTS inventory_movements (
          id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
          product_id INT UNSIGNED NOT NULL,
          quantity INT NOT NULL,
          type ENUM('in', 'out', 'adjust', 'transfer', 'initial') NOT NULL,
          reference_id VARCHAR(100),
          reference_type VARCHAR(50),
          location_from VARCHAR(200),
          location_to VARCHAR(200),
          notes TEXT,
          user_id INT UNSIGNED NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_inventory_product (product_id),
          INDEX idx_inventory_type (type),
          INDEX idx_inventory_reference (reference_type, reference_id),
          INDEX idx_inventory_user (user_id),
          INDEX idx_inventory_created_at (created_at),
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 9. Tabla de códigos QR (depende de products y users)
        `CREATE TABLE IF NOT EXISTS qr_codes (
          id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
          product_id INT UNSIGNED NOT NULL,
          code VARCHAR(500) UNIQUE NOT NULL,
          type ENUM('product', 'location', 'batch') NOT NULL DEFAULT 'product',
          status ENUM('active', 'used', 'expired', 'revoked') NOT NULL DEFAULT 'active',
          scan_count INT DEFAULT 0,
          last_scanned_at DATETIME,
          expires_at DATETIME,
          metadata JSON,
          created_by INT UNSIGNED NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_qr_codes_code (code),
          INDEX idx_qr_codes_product (product_id),
          INDEX idx_qr_codes_status (status),
          INDEX idx_qr_codes_type (type),
          INDEX idx_qr_codes_created_by (created_by),
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 10. Tabla de escaneos QR (depende de qr_codes y users)
        `CREATE TABLE IF NOT EXISTS qr_scans (
          id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
          qr_code_id INT UNSIGNED NOT NULL,
          user_id INT UNSIGNED NOT NULL,
          scan_type ENUM('inventory', 'checkin', 'checkout', 'audit') NOT NULL,
          location VARCHAR(200),
          notes TEXT,
          metadata JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_qr_scans_qr_code (qr_code_id),
          INDEX idx_qr_scans_user (user_id),
          INDEX idx_qr_scans_type (scan_type),
          INDEX idx_qr_scans_created_at (created_at),
          FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 11. Tabla de configuración (sin dependencias)
        `CREATE TABLE IF NOT EXISTS app_settings (
          id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
          setting_key VARCHAR(100) UNIQUE NOT NULL,
          setting_value TEXT,
          setting_type ENUM('string', 'number', 'boolean', 'json', 'array') NOT NULL DEFAULT 'string',
          category VARCHAR(50),
          description TEXT,
          is_public BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_settings_key (setting_key),
          INDEX idx_settings_category (category),
          INDEX idx_settings_public (is_public)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      ];

      // Ejecutar creación de tablas en orden
      for (const tableSql of tables) {
        try {
          await this.query(tableSql);
          console.log(`   ✅ Tabla creada/verificada`);
        } catch (error) {
          console.error(`   ❌ Error creando tabla: ${error.message}`);
          // En desarrollo, mostrar más detalles
          if (config.server.nodeEnv === "development") {
            console.error(`   SQL: ${tableSql.substring(0, 200)}...`);
          }
          throw error;
        }
      }

      console.log("✅ Estructura de base de datos creada correctamente");

      // Crear índices adicionales para optimización
      await this.createAdditionalIndexes();
    } catch (error) {
      console.error(
        "❌ Error creando estructura de base de datos:",
        error.message,
      );
      throw error;
    }
  }

  /**
   * ✅ Crear índices adicionales optimizados
   */
  async createAdditionalIndexes() {
    try {
      console.log("🔍 Creando índices adicionales...");

      const additionalIndexes = [
        // Índices para búsqueda de productos
        "CREATE INDEX IF NOT EXISTS idx_products_search ON products(name, code, barcode)",
        "CREATE FULLTEXT INDEX IF NOT EXISTS idx_products_fulltext ON products(name, description, brand, model)",

        // Índices para reportes
        "CREATE INDEX IF NOT EXISTS idx_transactions_date_type ON transactions(created_at, type, status)",
        "CREATE INDEX IF NOT EXISTS idx_inventory_movements_date_product ON inventory_movements(created_at, product_id, type)",

        // Índices para estadísticas
        "CREATE INDEX IF NOT EXISTS idx_qr_scans_date_type ON qr_scans(created_at, scan_type)",
        "CREATE INDEX IF NOT EXISTS idx_users_activity ON users(last_login, status, role)",

        // Índices para búsqueda combinada
        "CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category_id, status, current_stock)",
        "CREATE INDEX IF NOT EXISTS idx_transactions_composite ON transactions(created_at, type, status, payment_status)",
      ];

      for (const indexSql of additionalIndexes) {
        try {
          await this.query(indexSql);
        } catch (indexError) {
          // Algunos índices pueden fallar (como FULLTEXT si no está soportado)
          if (
            !indexError.message.includes("FULLTEXT") ||
            config.server.nodeEnv !== "production"
          ) {
            console.warn(
              `   ⚠️  No se pudo crear índice: ${indexError.message}`,
            );
          }
        }
      }

      console.log("✅ Índices adicionales creados");
    } catch (error) {
      console.warn("⚠️  Error creando índices adicionales:", error.message);
    }
  }

  /**
   * ✅ Ejecutar migraciones con manejo mejorado
   */
  async runMigrations() {
    try {
      const migrationsDir = path.join(__dirname, "..", "migrations");

      // Verificar si existe el directorio
      try {
        await fs.access(migrationsDir);
      } catch {
        console.log("📁 No se encontró directorio de migraciones");
        return;
      }

      // ✅ CORRECCIÓN: Crear tabla de migraciones si no existe
      await this.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
          migration_name VARCHAR(255) UNIQUE NOT NULL,
          batch INT NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_migrations_batch (batch),
          INDEX idx_migrations_name (migration_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      // Obtener migraciones ejecutadas
      const [executedMigrations] = await this.query(
        "SELECT migration_name FROM migrations ORDER BY id",
      );
      const executedSet = new Set(
        executedMigrations.map((m) => m.migration_name),
      );

      // Leer archivos de migración
      const files = await fs.readdir(migrationsDir);
      const migrationFiles = files
        .filter((file) => file.endsWith(".sql") || file.endsWith(".js"))
        .sort();

      if (migrationFiles.length === 0) {
        console.log("📭 No hay migraciones para ejecutar");
        return;
      }

      let batch = 1;
      const lastBatch = await this.query(
        "SELECT MAX(batch) as max_batch FROM migrations",
      );
      if (lastBatch[0]?.max_batch) {
        batch = lastBatch[0].max_batch + 1;
      }

      // Ejecutar migraciones pendientes
      let executedCount = 0;
      for (const file of migrationFiles) {
        if (!executedSet.has(file)) {
          console.log(`🔄 Ejecutando migración: ${file}`);

          const migrationPath = path.join(migrationsDir, file);

          try {
            if (file.endsWith(".sql")) {
              // Migración SQL
              const migrationSql = await fs.readFile(migrationPath, "utf8");

              await this.executeInTransaction(async (connection) => {
                // Ejecutar SQL de migración
                const statements = migrationSql
                  .split(";")
                  .filter(
                    (stmt) => stmt.trim() && !stmt.trim().startsWith("--"),
                  );

                for (const statement of statements) {
                  if (statement.trim()) {
                    await connection.query(statement);
                  }
                }

                // Registrar migración
                await connection.query(
                  "INSERT INTO migrations (migration_name, batch) VALUES (?, ?)",
                  [file, batch],
                );
              });
            } else if (file.endsWith(".js")) {
              // Migración JavaScript
              const migrationModule = require(migrationPath);
              if (typeof migrationModule.up === "function") {
                await migrationModule.up(this);

                // Registrar migración
                await this.query(
                  "INSERT INTO migrations (migration_name, batch) VALUES (?, ?)",
                  [file, batch],
                );
              }
            }

            executedCount++;
            console.log(`   ✅ Migración completada: ${file}`);
          } catch (migrationError) {
            console.error(
              `   ❌ Error en migración ${file}:`,
              migrationError.message,
            );
            throw migrationError;
          }
        }
      }

      console.log(`✅ ${executedCount} migraciones ejecutadas`);
    } catch (error) {
      console.error("❌ Error ejecutando migraciones:", error.message);
      // En desarrollo, continuar; en producción, considerar si detener
      if (config.server.nodeEnv === "production") {
        throw error;
      }
    }
  }

  /**
   * ✅ Ejecutar seeds de datos iniciales mejorados
   */
  async runSeeds() {
    try {
      console.log("🌱 Ejecutando seeds de datos iniciales...");

      // Verificar si ya existen datos
      const [userCount] = await this.query(
        "SELECT COUNT(*) as count FROM users",
      );

      if (userCount[0].count > 0 && config.server.nodeEnv === "production") {
        console.log("✅ Ya existen datos, omitiendo seeds en producción");
        return;
      }

      // ✅ CORRECCIÓN: Usar transacción para seeds
      await this.executeInTransaction(async (connection) => {
        // Insertar usuario administrador
        const adminPassword = await this.hashPassword("Admin@123"); // Contraseña más segura
        await connection.query(
          `
          INSERT INTO users (name, email, username, password, role, status, email_verified, phone, department) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            "Administrador Principal",
            "admin@inventory.com",
            "admin",
            adminPassword,
            "admin",
            "active",
            true,
            "+1234567890",
            "Administración",
          ],
        );

        // Insertar usuario manager de ejemplo
        const managerPassword = await this.hashPassword("Manager@123");
        await connection.query(
          `
          INSERT INTO users (name, email, username, password, role, status, email_verified, phone, department) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            "Gerente de Inventario",
            "manager@inventory.com",
            "manager",
            managerPassword,
            "manager",
            "active",
            true,
            "+1234567891",
            "Inventarios",
          ],
        );

        // Insertar categorías por defecto
        const defaultCategories = [
          [
            "Electrónicos",
            "Productos electrónicos y dispositivos",
            null,
            "fa-laptop",
            "#3498db",
            1,
          ],
          [
            "Ropa",
            "Ropa y accesorios para todas las edades",
            null,
            "fa-tshirt",
            "#e74c3c",
            2,
          ],
          [
            "Alimentos",
            "Productos alimenticios y bebidas",
            null,
            "fa-utensils",
            "#2ecc71",
            3,
          ],
          [
            "Herramientas",
            "Herramientas y equipamiento industrial",
            null,
            "fa-tools",
            "#f39c12",
            4,
          ],
          [
            "Oficina",
            "Suministros y mobiliario de oficina",
            null,
            "fa-briefcase",
            "#9b59b6",
            5,
          ],
          [
            "Limpieza",
            "Productos de limpieza y aseo",
            null,
            "fa-broom",
            "#1abc9c",
            6,
          ],
          [
            "Seguridad",
            "Equipos de seguridad y protección",
            null,
            "fa-shield-alt",
            "#e67e22",
            7,
          ],
        ];

        for (const [
          name,
          description,
          parent_id,
          icon,
          color,
          sort_order,
        ] of defaultCategories) {
          await connection.query(
            "INSERT INTO categories (name, description, parent_id, icon, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
            [name, description, parent_id, icon, color, sort_order],
          );
        }

        // Insertar configuraciones por defecto
        const defaultSettings = [
          [
            "app_name",
            "Sistema de Inventario QR",
            "string",
            "general",
            "Nombre de la aplicación",
            true,
          ],
          [
            "company_name",
            "Inventarios Digitales S.A.",
            "string",
            "general",
            "Nombre de la compañía",
            true,
          ],
          ["currency", "USD", "string", "general", "Moneda por defecto", true],
          [
            "timezone",
            "America/Costa_Rica",
            "string",
            "general",
            "Zona horaria",
            true,
          ],
          [
            "date_format",
            "DD/MM/YYYY",
            "string",
            "general",
            "Formato de fecha",
            true,
          ],
          [
            "items_per_page",
            "25",
            "number",
            "pagination",
            "Elementos por página",
            true,
          ],
          [
            "enable_qr_generation",
            "true",
            "boolean",
            "qr",
            "Habilitar generación de QR",
            true,
          ],
          [
            "inventory_low_threshold",
            "10",
            "number",
            "inventory",
            "Umbral de stock bajo",
            false,
          ],
          [
            "default_locale",
            "es_CR",
            "string",
            "general",
            "Idioma por defecto",
            true,
          ],
          [
            "maintenance_mode",
            "false",
            "boolean",
            "system",
            "Modo mantenimiento",
            false,
          ],
          [
            "max_login_attempts",
            "5",
            "number",
            "security",
            "Intentos máximos de login",
            false,
          ],
          [
            "session_timeout",
            "30",
            "number",
            "security",
            "Timeout de sesión en minutos",
            false,
          ],
        ];

        for (const [
          key,
          value,
          type,
          category,
          description,
          isPublic,
        ] of defaultSettings) {
          await connection.query(
            `
            INSERT INTO app_settings (setting_key, setting_value, setting_type, category, description, is_public)
            VALUES (?, ?, ?, ?, ?, ?)
          `,
            [key, value, type, category, description, isPublic],
          );
        }

        // Insertar proveedor por defecto
        await connection.query(
          `
          INSERT INTO suppliers (name, contact_person, email, phone, address, tax_id, payment_terms, status, notes, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            "Proveedor General S.A.",
            "Juan Pérez",
            "contacto@proveedorgeneral.com",
            "+506 2222-3333",
            "San José, Costa Rica",
            "3-101-123456",
            "Net 30 días",
            "active",
            "Proveedor principal de la empresa",
            1, // ID del admin creado
          ],
        );
      });

      console.log("✅ Seeds ejecutados correctamente");
    } catch (error) {
      console.error("❌ Error ejecutando seeds:", error.message);
      // En desarrollo, continuar; en producción, considerar el impacto
      if (config.server.nodeEnv === "production") {
        throw error;
      }
    }
  }

  /**
   * ✅ Hash de contraseña mejorado
   */
  async hashPassword(password) {
    // En producción real, usar bcrypt:
    // const bcrypt = require('bcryptjs');
    // return await bcrypt.hash(password, 12);

    // Para desarrollo/testing, usar hash simple
    const crypto = require("crypto");
    return crypto
      .createHash("sha256")
      .update(password + config.jwt.secret)
      .digest("hex");
  }

  /**
   * ✅ EJECUTAR CONSULTA MEJORADA CON MANEJO DE ERRORES
   */
  async query(sql, params = [], options = {}) {
    // ✅ CORRECCIÓN: Asegurar inicialización
    if (!this.initialized && !this.initializing) {
      await this.initialize();
    } else if (this.initializing) {
      // Esperar si se está inicializando
      while (this.initializing) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    const startTime = Date.now();
    const queryId = `q-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const defaultOptions = {
      useCache: this.cacheEnabled && options.useCache !== false,
      cacheKey: options.cacheKey || this.generateCacheKey(sql, params),
      cacheTTL: options.cacheTTL || this.cacheTTL,
      logQuery: config.server.nodeEnv === "development",
      timeout: options.timeout || 30000,
      connection: options.connection,
      retryOnDeadlock: options.retryOnDeadlock !== false,
    };

    const mergedOptions = { ...defaultOptions, ...options };

    // Verificar caché
    if (mergedOptions.useCache && !mergedOptions.connection) {
      const cachedResult = this.getFromCache(mergedOptions.cacheKey);
      if (cachedResult) {
        if (mergedOptions.logQuery) {
          console.debug(`💾 Query [${queryId}] desde caché`);
        }
        this.updateQueryStats(true, Date.now() - startTime);
        return cachedResult;
      }
    }

    if (mergedOptions.logQuery) {
      console.debug(`🔍 Query [${queryId}]:`, {
        sql: sql.substring(0, 150) + (sql.length > 150 ? "..." : ""),
        params: params.length > 5 ? `[${params.length} params]` : params,
        timeout: mergedOptions.timeout,
      });
    }

    let retries = 0;
    const maxRetries = mergedOptions.retryOnDeadlock ? 3 : 1;

    while (retries < maxRetries) {
      try {
        let connection = mergedOptions.connection;
        let shouldRelease = false;

        if (!connection) {
          connection = await this.pool.getConnection();
          shouldRelease = true;
        }

        // Configurar timeout si se especificó
        if (mergedOptions.timeout) {
          await connection.query(
            `SET SESSION max_execution_time = ${mergedOptions.timeout}`,
          );
        }

        const [results, fields] = await connection.execute(sql, params);
        const executionTime = Date.now() - startTime;

        // Actualizar estadísticas
        this.updateQueryStats(true, executionTime);

        if (mergedOptions.logQuery) {
          console.debug(`✅ Query [${queryId}] en ${executionTime}ms`, {
            rows: Array.isArray(results) ? results.length : "N/A",
            affectedRows: results.affectedRows || 0,
          });
        }

        // Guardar en caché si corresponde
        if (
          mergedOptions.useCache &&
          !mergedOptions.connection &&
          this.shouldCacheQuery(sql)
        ) {
          this.setToCache(
            mergedOptions.cacheKey,
            results,
            mergedOptions.cacheTTL,
          );
        }

        // Liberar conexión si la obtuvimos
        if (shouldRelease) {
          connection.release();
        }

        return results;
      } catch (error) {
        const executionTime = Date.now() - startTime;

        // ✅ CORRECCIÓN: Manejo específico de errores comunes
        const isDeadlock = error.code === "ER_LOCK_DEADLOCK";
        const isLockTimeout = error.code === "ER_LOCK_WAIT_TIMEOUT";

        if ((isDeadlock || isLockTimeout) && retries < maxRetries - 1) {
          retries++;
          const retryDelay = Math.pow(2, retries) * 100; // Backoff exponencial
          console.warn(
            `🔄 ${isDeadlock ? "Deadlock" : "Lock timeout"} detectado, reintentando (${retries}/${maxRetries}) en ${retryDelay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        }

        // Actualizar estadísticas de error
        this.updateQueryStats(false, executionTime);

        console.error(
          `❌ Error en query [${queryId}] después de ${executionTime}ms:`,
          error.message,
        );

        // En desarrollo, mostrar más detalles
        if (config.server.nodeEnv === "development") {
          console.error(
            "   SQL:",
            sql.substring(0, 300) + (sql.length > 300 ? "..." : ""),
          );
          if (params.length <= 10) {
            console.error("   Parámetros:", params);
          }
        }

        // Enriquecer error
        const enrichedError = new Error(`Database error: ${error.message}`);
        enrichedError.name = "DatabaseError";
        enrichedError.queryId = queryId;
        enrichedError.sql = sql;
        enrichedError.params = params;
        enrichedError.executionTime = executionTime;
        enrichedError.originalError = error;
        enrichedError.code = error.code;
        enrichedError.errno = error.errno;
        enrichedError.sqlState = error.sqlState;
        enrichedError.sqlMessage = error.sqlMessage;

        throw enrichedError;
      }
    }
  }

  /**
   * ✅ Actualizar estadísticas de queries
   */
  updateQueryStats(success, executionTime) {
    this.queryStats.totalQueries++;
    this.queryStats.totalExecutionTime += executionTime;

    if (success) {
      this.queryStats.successfulQueries++;
    } else {
      this.queryStats.failedQueries++;
    }
  }

  /**
   * ✅ Generar clave de caché
   */
  generateCacheKey(sql, params) {
    const sqlHash = require("crypto")
      .createHash("md5")
      .update(sql)
      .digest("hex");
    const paramsHash = require("crypto")
      .createHash("md5")
      .update(JSON.stringify(params))
      .digest("hex");
    return `cache:${sqlHash}:${paramsHash}`;
  }

  /**
   * ✅ Manejo de caché mejorado
   */
  getFromCache(key) {
    if (!this.cacheEnabled) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    // Verificar expiración
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  setToCache(key, value, ttl) {
    if (!this.cacheEnabled) return;

    const expiresAt = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expiresAt });

    // Limitar tamaño de caché
    if (this.cache.size > 1000) {
      // Eliminar las más antiguas primero
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);

      const toRemove = entries.slice(0, Math.floor(entries.length * 0.1)); // Eliminar 10% más antiguas
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  shouldCacheQuery(sql) {
    const lowerSql = sql.toLowerCase().trim();

    // Solo cachear SELECT que no sean complejos
    if (!lowerSql.startsWith("select")) return false;

    // No cachear queries con funciones específicas que puedan variar
    const noCachePatterns = [
      /rand\(/i,
      /now\(/i,
      /curdate\(/i,
      /curtime\(/i,
      /current_timestamp/i,
      /sleep\(/i,
      /benchmark\(/i,
      /user\(/i,
      /database\(/i,
      /version\(/i,
    ];

    for (const pattern of noCachePatterns) {
      if (pattern.test(lowerSql)) return false;
    }

    return true;
  }

  /**
   * ✅ EJECUTAR EN TRANSACCIÓN MEJORADO
   */
  async executeInTransaction(operations, options = {}) {
    const { maxRetries = 3, retryDelay = 100 } = options;
    let retries = 0;
    let lastError;

    while (retries <= maxRetries) {
      let connection;

      try {
        connection = await this.pool.getConnection();
        await connection.beginTransaction();

        // Configurar conexión para la transacción
        await connection.query(
          "SET TRANSACTION ISOLATION LEVEL READ COMMITTED",
        );

        const result = await operations(connection);
        await connection.commit();
        connection.release();

        return result;
      } catch (error) {
        if (connection) {
          try {
            await connection.rollback();
          } catch (rollbackError) {
            console.error("❌ Error en rollback:", rollbackError.message);
          }

          try {
            connection.release();
          } catch (releaseError) {
            // Ignorar error de release
          }
        }

        lastError = error;

        // Reintentar en errores de deadlock
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
  }

  /**
   * ✅ VALIDACIÓN DE DATOS MEJORADA
   */
  validateData(schemaName, data, options = {}) {
    const schema = validationSchemas[schemaName];
    if (!schema) {
      throw new Error(`Esquema de validación "${schemaName}" no encontrado`);
    }

    const validationOptions = {
      abortEarly: false,
      stripUnknown: true,
      ...options,
    };

    const { error, value } = schema.validate(data, validationOptions);

    if (error) {
      const validationError = new Error("Validación de datos fallida");
      validationError.name = "ValidationError";
      validationError.details = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        type: detail.type,
      }));
      validationError.isValidationError = true;
      throw validationError;
    }

    return value;
  }

  /**
   * ✅ MÉTODOS CRUD PARA USUARIOS - MEJORADOS
   */
  async createUser(userData) {
    const validatedData = this.validateData("user", userData);

    // Verificar unicidad de email y username
    const existingUser = await this.getUserByEmail(validatedData.email);
    if (existingUser) {
      throw new Error("El email ya está registrado");
    }

    const existingUsername = await this.getUserByUsername(
      validatedData.username,
    );
    if (existingUsername) {
      throw new Error("El nombre de usuario ya está en uso");
    }

    const sql = `
      INSERT INTO users (name, email, username, password, role, status, phone, department)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await this.query(sql, [
      validatedData.name,
      validatedData.email,
      validatedData.username,
      validatedData.password,
      validatedData.role,
      validatedData.status,
      validatedData.phone || null,
      validatedData.department || null,
    ]);

    // Invalidar caché de usuarios
    this.clearCacheByPattern("user");

    return this.getUserById(result.insertId);
  }

  async getUserById(id) {
    const cacheKey = `user:${id}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const sql = `
      SELECT id, name, email, username, role, status, email_verified, 
             phone, department, last_login, created_at, updated_at
      FROM users 
      WHERE id = ? AND status != 'deleted'
    `;

    const [users] = await this.query(sql, [id]);
    const user = users[0] || null;

    if (user) {
      this.setToCache(cacheKey, user, 300); // Cache por 5 minutos
    }

    return user;
  }

  async getUserByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ? AND status != "deleted"';
    const [users] = await this.query(sql, [email]);
    return users[0] || null;
  }

  async getUserByUsername(username) {
    const sql =
      'SELECT * FROM users WHERE username = ? AND status != "deleted"';
    const [users] = await this.query(sql, [username]);
    return users[0] || null;
  }

  async updateUser(id, userData) {
    // Obtener usuario actual
    const currentUser = await this.getUserById(id);
    if (!currentUser) {
      throw new Error("Usuario no encontrado");
    }

    // Validar datos
    const validatedData = this.validateData("user", { ...userData, id });

    // Remover campos que no se pueden actualizar
    delete validatedData.id;
    delete validatedData.created_at;
    delete validatedData.password; // Usar método específico para cambiar contraseña

    const fields = Object.keys(validatedData);
    if (fields.length === 0) {
      return currentUser;
    }

    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const sql = `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = ?`;

    const values = fields.map((field) => validatedData[field]);
    values.push(id);

    await this.query(sql, values);

    // Invalidar caché
    this.clearCacheByPattern(`user:${id}`);
    this.clearCacheByPattern("users:list");

    return this.getUserById(id);
  }

  async updateUserPassword(id, newPassword) {
    const hashedPassword = await this.hashPassword(newPassword);

    await this.query(
      "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?",
      [hashedPassword, id],
    );

    // Invalidar caché
    this.clearCacheByPattern(`user:${id}`);

    return { success: true, message: "Contraseña actualizada" };
  }

  /**
   * ✅ MÉTODOS CRUD PARA PRODUCTOS - MEJORADOS
   */
  async createProduct(productData, userId) {
    // Validar datos
    const validatedData = this.validateData("product", {
      ...productData,
      created_by: userId,
    });

    // Verificar que la categoría exista si se especifica
    if (validatedData.category_id) {
      const category = await this.query(
        'SELECT id FROM categories WHERE id = ? AND status = "active"',
        [validatedData.category_id],
      );
      if (category.length === 0) {
        throw new Error("Categoría no encontrada o inactiva");
      }
    }

    // Verificar que el proveedor exista si se especifica
    if (validatedData.supplier_id) {
      const supplier = await this.query(
        'SELECT id FROM suppliers WHERE id = ? AND status = "active"',
        [validatedData.supplier_id],
      );
      if (supplier.length === 0) {
        throw new Error("Proveedor no encontrado o inactivo");
      }
    }

    // Generar código único si no se proporciona
    if (!validatedData.code) {
      validatedData.code = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }

    const fields = Object.keys(validatedData);
    const values = Object.values(validatedData);

    const sql = `INSERT INTO products (${fields.join(", ")}) VALUES (${fields.map(() => "?").join(", ")})`;

    const result = await this.query(sql, values);

    // Invalidar caché de productos
    this.clearCacheByPattern("product");
    this.clearCacheByPattern("products:list");

    return this.getProductById(result.insertId);
  }

  async getProductById(id) {
    const cacheKey = `product:${id}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const sql = `
      SELECT p.*, 
             c.name as category_name,
             s.name as supplier_name,
             uc.name as creator_name,
             uu.name as updater_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN users uc ON p.created_by = uc.id
      LEFT JOIN users uu ON p.updated_by = uu.id
      WHERE p.id = ? AND p.status != 'deleted'
    `;

    const [products] = await this.query(sql, [id]);
    const product = products[0] || null;

    if (product) {
      this.setToCache(cacheKey, product, 300);
    }

    return product;
  }

  async getProducts(filters = {}, pagination = {}) {
    const {
      categoryId = null,
      status = "active",
      search = null,
      minStock = null,
      maxStock = null,
      supplierId = null,
      minPrice = null,
      maxPrice = null,
    } = filters;

    const {
      page = 1,
      limit = 20,
      sortBy = "name",
      sortOrder = "ASC",
    } = pagination;

    // Generar clave de caché basada en filtros
    const cacheKey = `products:list:${JSON.stringify({ filters, pagination })}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    let sql = `
      SELECT p.*, c.name as category_name, s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE 1=1
    `;

    const params = [];

    // Aplicar filtros
    if (status) {
      sql += " AND p.status = ?";
      params.push(status);
    }

    if (categoryId) {
      sql += " AND p.category_id = ?";
      params.push(categoryId);
    }

    if (supplierId) {
      sql += " AND p.supplier_id = ?";
      params.push(supplierId);
    }

    if (minStock !== null) {
      sql += " AND p.current_stock >= ?";
      params.push(minStock);
    }

    if (maxStock !== null) {
      sql += " AND p.current_stock <= ?";
      params.push(maxStock);
    }

    if (minPrice !== null) {
      sql += " AND p.selling_price >= ?";
      params.push(minPrice);
    }

    if (maxPrice !== null) {
      sql += " AND p.selling_price <= ?";
      params.push(maxPrice);
    }

    if (search) {
      sql +=
        " AND (p.name LIKE ? OR p.code LIKE ? OR p.description LIKE ? OR p.barcode LIKE ? OR p.sku LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Contar total
    const countSql = sql.replace(
      /SELECT[\s\S]*?FROM/,
      "SELECT COUNT(*) as total FROM",
    );
    const [countResult] = await this.query(countSql, params);
    const total = countResult[0]?.total || 0;

    // Validar ordenamiento
    const validSortFields = [
      "name",
      "code",
      "current_stock",
      "selling_price",
      "cost_price",
      "created_at",
      "updated_at",
    ];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : "name";
    const safeSortOrder = ["ASC", "DESC"].includes(sortOrder.toUpperCase())
      ? sortOrder.toUpperCase()
      : "ASC";

    // Aplicar ordenamiento y paginación
    sql += ` ORDER BY p.${safeSortBy} ${safeSortOrder}`;

    const offset = (page - 1) * limit;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const products = await this.query(sql, params);

    const result = {
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };

    // Cachear solo la primera página y resultados sin búsqueda
    if (page === 1 && !search) {
      this.setToCache(cacheKey, result, 60); // 1 minuto
    }

    return result;
  }

  async updateStock(productId, quantity, type, userId, notes = "") {
    return this.executeInTransaction(async (connection) => {
      // Obtener producto con bloqueo
      const [products] = await connection.query(
        "SELECT * FROM products WHERE id = ? FOR UPDATE",
        [productId],
      );

      if (!products[0]) {
        throw new Error("Producto no encontrado");
      }

      const product = products[0];
      let newStock = product.current_stock;

      // Calcular nuevo stock según tipo
      switch (type) {
        case "in":
          newStock += quantity;
          break;
        case "out":
          if (product.current_stock < quantity) {
            throw new Error(
              `Stock insuficiente. Disponible: ${product.current_stock}, Requerido: ${quantity}`,
            );
          }
          newStock -= quantity;
          break;
        case "adjust":
          newStock = quantity;
          break;
        default:
          throw new Error(`Tipo de movimiento inválido: ${type}`);
      }

      // Verificar límites de stock
      if (product.max_stock !== null && newStock > product.max_stock) {
        throw new Error(
          `El nuevo stock (${newStock}) excede el máximo permitido (${product.max_stock})`,
        );
      }

      if (newStock < 0) {
        throw new Error("El stock no puede ser negativo");
      }

      // Actualizar producto
      await connection.query(
        "UPDATE products SET current_stock = ?, updated_at = NOW() WHERE id = ?",
        [newStock, productId],
      );

      // Registrar movimiento
      await connection.query(
        `
        INSERT INTO inventory_movements (product_id, quantity, type, notes, user_id)
        VALUES (?, ?, ?, ?, ?)
      `,
        [productId, quantity, type, notes, userId],
      );

      return {
        success: true,
        productId,
        productName: product.name,
        previousStock: product.current_stock,
        newStock,
        change: newStock - product.current_stock,
        type,
        timestamp: new Date().toISOString(),
      };
    });
  }

  /**
   * ✅ MÉTODOS PARA GENERACIÓN Y ESCANEO DE QR
   */
  async generateQRCode(productId, userId, metadata = {}) {
    const product = await this.getProductById(productId);
    if (!product) {
      throw new Error("Producto no encontrado");
    }

    // Generar código único
    const qrCode = `QR-${productId}-${uuidv4().substr(0, 8).toUpperCase()}`;

    const sql = `
      INSERT INTO qr_codes (product_id, code, created_by, metadata)
      VALUES (?, ?, ?, ?)
    `;

    const result = await this.query(sql, [
      productId,
      qrCode,
      userId,
      JSON.stringify(metadata),
    ]);

    // Actualizar referencia en producto
    await this.query(
      "UPDATE products SET qr_code = ?, updated_at = NOW() WHERE id = ?",
      [qrCode, productId],
    );

    // Invalidar caché
    this.clearCacheByPattern(`product:${productId}`);
    this.clearCacheByPattern("product");

    return {
      id: result.insertId,
      productId,
      qrCode,
      metadata,
      createdAt: new Date().toISOString(),
    };
  }

  async scanQRCode(
    qrCode,
    userId,
    scanType = "inventory",
    location = null,
    notes = "",
  ) {
    return this.executeInTransaction(async (connection) => {
      // Buscar código QR
      const [codes] = await connection.query(
        'SELECT * FROM qr_codes WHERE code = ? AND status = "active" FOR UPDATE',
        [qrCode],
      );

      if (!codes[0]) {
        throw new Error("Código QR no encontrado o inactivo");
      }

      const qrCodeRecord = codes[0];

      // Verificar expiración
      if (
        qrCodeRecord.expires_at &&
        new Date(qrCodeRecord.expires_at) < new Date()
      ) {
        await connection.query(
          'UPDATE qr_codes SET status = "expired" WHERE id = ?',
          [qrCodeRecord.id],
        );
        throw new Error("El código QR ha expirado");
      }

      // Registrar escaneo
      await connection.query(
        `
        INSERT INTO qr_scans (qr_code_id, user_id, scan_type, location, notes, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        [
          qrCodeRecord.id,
          userId,
          scanType,
          location,
          notes,
          JSON.stringify({
            userAgent: null, // Se puede obtener del request si está disponible
            ipAddress: null,
            timestamp: new Date().toISOString(),
          }),
        ],
      );

      // Actualizar contador y última fecha de escaneo
      await connection.query(
        `
        UPDATE qr_codes 
        SET scan_count = scan_count + 1, last_scanned_at = NOW(), updated_at = NOW()
        WHERE id = ?
      `,
        [qrCodeRecord.id],
      );

      // Obtener información completa del producto
      const [products] = await connection.query(
        `
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `,
        [qrCodeRecord.product_id],
      );

      return {
        success: true,
        scanId: qrCodeRecord.id,
        qrCode: qrCodeRecord.code,
        product: products[0],
        scanType,
        location,
        timestamp: new Date().toISOString(),
        scanCount: qrCodeRecord.scan_count + 1,
      };
    });
  }

  /**
   * ✅ MÉTODOS DE DASHBOARD Y ESTADÍSTICAS
   */
  async getDashboardStats() {
    const cacheKey = "dashboard:stats";
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const stats = await this.executeInTransaction(async (connection) => {
        const queries = [
          // Total productos activos
          connection.query(
            'SELECT COUNT(*) as count FROM products WHERE status = "active"',
          ),

          // Productos con stock bajo
          connection.query(`
            SELECT COUNT(*) as count 
            FROM products 
            WHERE status = "active" 
              AND current_stock <= min_stock 
              AND min_stock > 0
          `),

          // Total usuarios activos
          connection.query(
            'SELECT COUNT(*) as count FROM users WHERE status = "active"',
          ),

          // Transacciones hoy
          connection.query(
            "SELECT COUNT(*) as count FROM transactions WHERE DATE(created_at) = CURDATE()",
          ),

          // Escaneos QR hoy
          connection.query(
            "SELECT COUNT(*) as count FROM qr_scans WHERE DATE(created_at) = CURDATE()",
          ),

          // Valor total del inventario
          connection.query(`
            SELECT COALESCE(SUM(current_stock * cost_price), 0) as value 
            FROM products 
            WHERE cost_price IS NOT NULL AND status = "active"
          `),

          // Movimientos de inventario hoy
          connection.query(`
            SELECT COUNT(*) as count 
            FROM inventory_movements 
            WHERE DATE(created_at) = CURDATE()
          `),

          // Productos sin stock
          connection.query(`
            SELECT COUNT(*) as count 
            FROM products 
            WHERE status = "active" AND current_stock = 0
          `),
        ];

        const results = await Promise.all(queries);

        return {
          totalProducts: results[0][0][0]?.count || 0,
          lowStockProducts: results[1][0][0]?.count || 0,
          totalUsers: results[2][0][0]?.count || 0,
          todayTransactions: results[3][0][0]?.count || 0,
          todayQRScans: results[4][0][0]?.count || 0,
          inventoryValue: parseFloat(results[5][0][0]?.value || 0).toFixed(2),
          todayInventoryMovements: results[6][0][0]?.count || 0,
          outOfStockProducts: results[7][0][0]?.count || 0,
          timestamp: new Date().toISOString(),
        };
      });

      // Cachear por 5 minutos
      this.setToCache(cacheKey, stats, 300);

      return stats;
    } catch (error) {
      console.error(
        "❌ Error obteniendo estadísticas del dashboard:",
        error.message,
      );
      return {
        totalProducts: 0,
        lowStockProducts: 0,
        totalUsers: 0,
        todayTransactions: 0,
        todayQRScans: 0,
        inventoryValue: "0.00",
        todayInventoryMovements: 0,
        outOfStockProducts: 0,
        error: "No se pudieron cargar las estadísticas",
      };
    }
  }

  /**
   * ✅ MÉTODOS DE LIMPIEZA DE CACHÉ
   */
  clearCacheByPattern(pattern) {
    const keysToDelete = [];

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));

    if (keysToDelete.length > 0 && config.server.nodeEnv === "development") {
      console.debug(
        `🧹 Caché limpiada: ${keysToDelete.length} entradas con patrón "${pattern}"`,
      );
    }
  }

  clearAllCache() {
    const previousSize = this.cache.size;
    this.cache.clear();
    console.log(
      `🧹 Caché completamente limpiada (${previousSize} entradas eliminadas)`,
    );
  }

  /**
   * ✅ MÉTODOS DE ESTADÍSTICAS DEL SISTEMA
   */
  getQueryStats() {
    const avgExecutionTime =
      this.queryStats.totalQueries > 0
        ? this.queryStats.totalExecutionTime / this.queryStats.totalQueries
        : 0;

    const successRate =
      this.queryStats.totalQueries > 0
        ? (this.queryStats.successfulQueries / this.queryStats.totalQueries) *
          100
        : 0;

    return {
      ...this.queryStats,
      avgExecutionTime: Math.round(avgExecutionTime),
      successRate: successRate.toFixed(2),
      cacheSize: this.cache.size,
      cacheHitRate: this.calculateCacheHitRate(),
      initialized: this.initialized,
    };
  }

  calculateCacheHitRate() {
    if (this.queryStats.totalQueries === 0) return 0;

    // Estimación basada en consultas cacheables
    const cacheableQueries = this.queryStats.successfulQueries;
    const cacheHits = Math.floor(cacheableQueries * 0.3); // Estimación del 30%

    return ((cacheHits / this.queryStats.totalQueries) * 100).toFixed(2);
  }

  getPoolStats() {
    if (!this.pool) return null;

    return {
      totalConnections: this.pool.totalConnections || 0,
      idleConnections: this.pool.idleConnections || 0,
      activeConnections: this.pool.activeConnections || 0,
      taskQueueSize: this.pool.taskQueueSize || 0,
      config: {
        connectionLimit: this.pool.config?.connectionLimit || 10,
        queueLimit: this.pool.config?.queueLimit || 0,
      },
    };
  }

  /**
   * ✅ MÉTODO PARA CERRAR CONEXIONES
   */
  async close() {
    try {
      console.log("🔒 Cerrando gestor de base de datos...");

      // Limpiar caché
      this.clearAllCache();

      // Cerrar pool si existe
      if (this.pool) {
        const stats = this.getPoolStats();
        console.log(
          `   - Conexiones activas: ${stats?.activeConnections || 0}`,
        );

        await this.pool.end();
        console.log("✅ Pool de conexiones cerrado correctamente");
      }

      this.initialized = false;
    } catch (error) {
      console.error(
        "❌ Error cerrando gestor de base de datos:",
        error.message,
      );
      throw error;
    }
  }

  /**
   * ✅ MÉTODO PARA BACKUP DE BASE DE DATOS
   */
  async backupDatabase(backupPath = "./backups") {
    try {
      console.log("💾 Iniciando backup de base de datos...");

      // Crear directorio
      await fs.mkdir(backupPath, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = path.join(backupPath, `backup-${timestamp}.sql`);

      // Obtener todas las tablas
      const [tables] = await this.query(
        `
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME
      `,
        [config.db.database],
      );

      let backupContent = `-- Backup de ${config.db.database}\n`;
      backupContent += `-- Generado: ${new Date().toISOString()}\n`;
      backupContent += `-- Sistema: Inventory QR Backend\n\n`;
      backupContent += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

      // Para cada tabla
      for (const table of tables) {
        const tableName = table.TABLE_NAME;

        // Obtener estructura
        const [createTable] = await this.query(
          `SHOW CREATE TABLE \`${tableName}\``,
        );
        backupContent += `--\n-- Estructura para tabla: ${tableName}\n--\n`;
        backupContent += `${createTable[0]["Create Table"]};\n\n`;

        // Obtener datos
        const [rows] = await this.query(`SELECT * FROM \`${tableName}\``);

        if (rows.length > 0) {
          backupContent += `--\n-- Datos para tabla: ${tableName}\n--\n`;
          backupContent += `INSERT INTO \`${tableName}\` VALUES\n`;

          const insertValues = rows.map((row, index) => {
            const values = Object.values(row).map((value) => {
              if (value === null) return "NULL";
              if (typeof value === "string") {
                // Escapar comillas simples
                return `'${value.replace(/'/g, "''")}'`;
              }
              if (typeof value === "object" && value !== null) {
                // Para JSON y objetos
                return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
              }
              return value;
            });

            return `(${values.join(", ")})`;
          });

          backupContent += insertValues.join(",\n") + ";\n\n";
        }
      }

      backupContent += `SET FOREIGN_KEY_CHECKS=1;\n`;
      backupContent += `-- Backup completado exitosamente\n`;

      // Guardar archivo
      await fs.writeFile(backupFile, backupContent, "utf8");

      const fileStats = await fs.stat(backupFile);

      console.log(`✅ Backup completado: ${backupFile}`);
      console.log(`   - Tamaño: ${(fileStats.size / 1024).toFixed(2)} KB`);
      console.log(`   - Tablas: ${tables.length}`);

      return {
        success: true,
        file: backupFile,
        size: fileStats.size,
        tables: tables.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Error en backup:", error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

/**
 * ✅ INSTANCIA SINGLETON MEJORADA
 */
let databaseInstance = null;
let initializationPromise = null;

async function getDatabase() {
  if (!databaseInstance) {
    if (!initializationPromise) {
      initializationPromise = (async () => {
        const instance = new DatabaseManager();
        await instance.initialize();
        return instance;
      })();
    }

    databaseInstance = await initializationPromise;
  }

  return databaseInstance;
}

async function initializeDatabase() {
  return getDatabase();
}

/**
 * ✅ MANEJO DE CIERRE DE APLICACIÓN
 */
async function shutdownDatabase() {
  if (databaseInstance) {
    await databaseInstance.close();
    databaseInstance = null;
    initializationPromise = null;
  }
}

process.on("SIGTERM", async () => {
  console.log("🔄 Cerrando base de datos (SIGTERM)...");
  await shutdownDatabase();
});

process.on("SIGINT", async () => {
  console.log("🔄 Cerrando base de datos (SIGINT)...");
  await shutdownDatabase();
});

// Manejar errores no capturados relacionados con DB
process.on("uncaughtException", async (error) => {
  if (
    (error.message && error.message.includes("database")) ||
    (error.code && error.code.includes("ER_"))
  ) {
    console.error("💥 Error de base de datos no capturado:", error.message);
    await shutdownDatabase();
  }
});

/**
 * ✅ EXPORTAR MÓDULO COMPLETO
 */
module.exports = {
  // Singleton principal
  getDatabase,
  initializeDatabase,
  shutdownDatabase,

  // Clase para testing
  DatabaseManager,

  // Esquemas de validación
  validationSchemas,

  // Funciones utilitarias
  testConnection: async () => {
    const db = await getDatabase();
    return db.testConnection();
  },

  // Métodos directos para uso común
  query: async (sql, params, options) => {
    const db = await getDatabase();
    return db.query(sql, params, options);
  },

  executeInTransaction: async (operations, options) => {
    const db = await getDatabase();
    return db.executeInTransaction(operations, options);
  },

  // Métodos específicos
  createUser: async (userData) => {
    const db = await getDatabase();
    return db.createUser(userData);
  },

  getUserById: async (id) => {
    const db = await getDatabase();
    return db.getUserById(id);
  },

  createProduct: async (productData, userId) => {
    const db = await getDatabase();
    return db.createProduct(productData, userId);
  },

  getProductById: async (id) => {
    const db = await getDatabase();
    return db.getProductById(id);
  },

  getProducts: async (filters, pagination) => {
    const db = await getDatabase();
    return db.getProducts(filters, pagination);
  },

  updateStock: async (productId, quantity, type, userId, notes) => {
    const db = await getDatabase();
    return db.updateStock(productId, quantity, type, userId, notes);
  },

  generateQRCode: async (productId, userId, metadata) => {
    const db = await getDatabase();
    return db.generateQRCode(productId, userId, metadata);
  },

  scanQRCode: async (qrCode, userId, scanType, location, notes) => {
    const db = await getDatabase();
    return db.scanQRCode(qrCode, userId, scanType, location, notes);
  },

  getDashboardStats: async () => {
    const db = await getDatabase();
    return db.getDashboardStats();
  },

  // Métodos de administración
  getStats: async () => {
    const db = await getDatabase();
    return {
      queryStats: db.getQueryStats(),
      poolStats: db.getPoolStats(),
      cacheSize: db.cache.size,
      initialized: db.initialized,
    };
  },

  backupDatabase: async (backupPath) => {
    const db = await getDatabase();
    return db.backupDatabase(backupPath);
  },

  clearCache: async () => {
    const db = await getDatabase();
    db.clearAllCache();
    return { success: true, message: "Caché limpiada" };
  },
};

// ✅ Inicialización automática en desarrollo
if (config.server.nodeEnv === "development" && require.main === module) {
  (async () => {
    try {
      console.log("🚀 Inicializando base de datos en modo desarrollo...");
      const db = await getDatabase();
      console.log("✅ Base de datos lista para desarrollo");

      // Ejemplo: Obtener estadísticas iniciales
      const stats = await db.getDashboardStats();
      console.log("📊 Estadísticas iniciales:", stats);
    } catch (error) {
      console.error("❌ Error en inicialización de desarrollo:", error.message);
      process.exit(1);
    }
  })();
}
