/**
 * ✅ UPLOADMIDDLEWARE.JS - MIDDLEWARE MEJORADO DE SUBIDA DE ARCHIVOS
 *
 * Correcciones aplicadas:
 * 1. Manejo robusto de errores
 * 2. Validación de archivos mejorada
 * 3. Sanitización de nombres de archivo
 * 4. Limpieza automática de archivos temporales
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const crypto = require("crypto");
const logger = require("../utils/logger");
const config = require("../config/env");

// ✅ MEJORA: Configuración de uploads desde variables de entorno
const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: config.uploads?.maxFileSize || 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: config.uploads?.allowedMimeTypes || [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  UPLOAD_DIR: config.uploads?.directory || "./uploads",
};

/**
 * Crea directorios de upload si no existen
 * @returns {Promise<void>}
 */
const ensureUploadDirs = async () => {
  const uploadDirs = [
    UPLOAD_CONFIG.UPLOAD_DIR,
    `${UPLOAD_CONFIG.UPLOAD_DIR}/products`,
    `${UPLOAD_CONFIG.UPLOAD_DIR}/qrcodes`,
    `${UPLOAD_CONFIG.UPLOAD_DIR}/temp`,
    `${UPLOAD_CONFIG.UPLOAD_DIR}/documents`,
    `${UPLOAD_CONFIG.UPLOAD_DIR}/backups`,
  ];

  for (const dir of uploadDirs) {
    try {
      await fs.mkdir(dir, { recursive: true, mode: 0o755 });
    } catch (error) {
      if (error.code !== "EEXIST") {
        logger.error(`Error creando directorio ${dir}:`, error);
        throw error;
      }
    }
  }
};

// ✅ MEJORA: Inicializar directorios al cargar el módulo
ensureUploadDirs().catch((error) => {
  logger.error("Error inicializando directorios de upload:", error);
});

/**
 * Genera nombre de archivo seguro
 * @param {string} originalname - Nombre original
 * @param {string} prefix - Prefijo para el archivo
 * @returns {string} Nombre seguro
 */
const generateSecureFilename = (originalname, prefix = "file") => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString("hex");
  const sanitizedOriginal = originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const ext = path.extname(sanitizedOriginal).toLowerCase();
  const name = path.basename(sanitizedOriginal, ext).substring(0, 50);

  return `${prefix}-${timestamp}-${randomString}-${name}${ext}`;
};

/**
 * Crea configuración de almacenamiento
 * @param {string} destination - Directorio destino
 * @param {string} filenamePrefix - Prefijo para nombres de archivo
 * @returns {Object} Configuración de almacenamiento
 */
const createStorage = (destination, filenamePrefix = "file") => {
  return multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        await ensureUploadDirs();
        cb(null, destination);
      } catch (error) {
        cb(error);
      }
    },
    filename: (req, file, cb) => {
      try {
        const userId = req.userId ? `user${req.userId}` : "anonymous";
        const prefix = `${filenamePrefix}-${userId}`;
        const filename = generateSecureFilename(file.originalname, prefix);

        logger.debug("Generando nombre de archivo seguro:", {
          original: file.originalname,
          secure: filename,
          userId,
        });

        cb(null, filename);
      } catch (error) {
        cb(error);
      }
    },
  });
};

/**
 * Crea filtro de archivos
 * @param {Array} allowedMimeTypes - Tipos MIME permitidos
 * @returns {Function} Filtro de archivos
 */
const createFileFilter = (allowedMimeTypes) => {
  return (req, file, cb) => {
    try {
      // Validar tipo MIME
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(
          new Error(
            `Tipo de archivo no permitido: ${file.mimetype}. Tipos permitidos: ${allowedMimeTypes.join(", ")}`,
          ),
          false,
        );
      }

      // ✅ MEJORA: Validar extensión del archivo
      const allowedExtensions = allowedMimeTypes
        .map((mime) => {
          const parts = mime.split("/");
          if (parts[1] === "jpeg") return ".jpg";
          if (
            parts[1] ===
            "vnd.openxmlformats-officedocument.wordprocessingml.document"
          )
            return ".docx";
          if (
            parts[1] === "vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          )
            return ".xlsx";
          return `.${parts[1]}`;
        })
        .filter((ext) => ext);

      const fileExt = path.extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(fileExt)) {
        return cb(
          new Error(
            `Extensión de archivo no permitida: ${fileExt}. Extensiones permitidas: ${allowedExtensions.join(", ")}`,
          ),
          false,
        );
      }

      // ✅ MEJORA: Prevenir path traversal attacks
      const sanitizedFilename = path.basename(file.originalname);
      if (sanitizedFilename !== file.originalname) {
        return cb(
          new Error("Nombre de archivo contiene caracteres no permitidos"),
          false,
        );
      }

      cb(null, true);
    } catch (error) {
      cb(error);
    }
  };
};

/**
 * Configuraciones de upload predefinidas
 */
const uploadConfigs = {
  productImage: {
    storage: createStorage(`${UPLOAD_CONFIG.UPLOAD_DIR}/products`, "product"),
    fileFilter: createFileFilter(
      UPLOAD_CONFIG.ALLOWED_MIME_TYPES.filter((mime) =>
        mime.startsWith("image/"),
      ),
    ),
    limits: {
      fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
      files: 1,
    },
  },

  productImages: {
    storage: createStorage(`${UPLOAD_CONFIG.UPLOAD_DIR}/products`, "product"),
    fileFilter: createFileFilter(
      UPLOAD_CONFIG.ALLOWED_MIME_TYPES.filter((mime) =>
        mime.startsWith("image/"),
      ),
    ),
    limits: {
      fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
      files: 10,
    },
  },

  document: {
    storage: createStorage(`${UPLOAD_CONFIG.UPLOAD_DIR}/documents`, "doc"),
    fileFilter: createFileFilter(
      UPLOAD_CONFIG.ALLOWED_MIME_TYPES.filter(
        (mime) => mime.startsWith("application/") && !mime.includes("image"),
      ),
    ),
    limits: {
      fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
      files: 1,
    },
  },

  mixedFiles: {
    storage: createStorage(`${UPLOAD_CONFIG.UPLOAD_DIR}/temp`, "mixed"),
    fileFilter: createFileFilter(UPLOAD_CONFIG.ALLOWED_MIME_TYPES),
    limits: {
      fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
      files: 5,
    },
  },
};

/**
 * Maneja errores de multer
 * @param {Error} err - Error
 * @param {Object} req - Request
 * @param {Object} res - Response
 * @param {Function} next - Next function
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = "Error al subir el archivo";
    let code = "UPLOAD_ERROR";

    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = `El archivo es demasiado grande. Tamaño máximo: ${UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`;
        code = "FILE_TOO_LARGE";
        break;
      case "LIMIT_FILE_COUNT":
        message = "Se excedió el número máximo de archivos";
        code = "TOO_MANY_FILES";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = "Campo de archivo no esperado";
        code = "UNEXPECTED_FIELD";
        break;
      default:
        message = `Error de upload: ${err.code}`;
    }

    logger.warn(`Error de upload (${err.code}): ${message}`, {
      userId: req.userId,
      field: err.field,
    });

    return res.status(400).json({
      success: false,
      message,
      code,
      maxFileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
      maxFiles: uploadConfigs.productImages.limits.files,
    });
  }

  if (err) {
    logger.error("Error inesperado en upload:", {
      error: err.message,
      stack: err.stack,
      userId: req.userId,
    });

    return res.status(400).json({
      success: false,
      message: err.message || "Error al procesar el archivo",
      code: "UPLOAD_PROCESSING_ERROR",
    });
  }

  next();
};

/**
 * Valida que se haya subido un archivo
 * @param {string} fieldName - Nombre del campo
 * @param {Object} options - Opciones de validación
 * @returns {Function} Middleware de validación
 */
const validateFileUpload =
  (fieldName = "file", options = {}) =>
  async (req, res, next) => {
    try {
      const file = req.file || (req.files && req.files[fieldName]);

      if (!file || (Array.isArray(file) && file.length === 0)) {
        return res.status(400).json({
          success: false,
          message: `Por favor, sube al menos un archivo para ${fieldName}`,
          code: "FILE_REQUIRED",
          field: fieldName,
        });
      }

      // Validar tamaño máximo
      if (options.maxSize) {
        const files = Array.isArray(file) ? file : [file];
        for (const f of files) {
          if (f.size > options.maxSize) {
            return res.status(400).json({
              success: false,
              message: `El archivo ${f.originalname} excede el tamaño máximo permitido`,
              code: "FILE_SIZE_EXCEEDED",
              maxSize: options.maxSize,
              actualSize: f.size,
            });
          }
        }
      }

      // Validar tipos MIME
      if (options.allowedMimeTypes) {
        const files = Array.isArray(file) ? file : [file];
        for (const f of files) {
          if (!options.allowedMimeTypes.includes(f.mimetype)) {
            return res.status(400).json({
              success: false,
              message: `Tipo de archivo no permitido para ${f.originalname}`,
              code: "INVALID_FILE_TYPE",
              allowedTypes: options.allowedMimeTypes,
              actualType: f.mimetype,
            });
          }
        }
      }

      // ✅ MEJORA: Agregar información del archivo a la request
      req.uploadedFiles = Array.isArray(file) ? file : [file];

      next();
    } catch (error) {
      logger.error("Error validando upload:", error);
      res.status(500).json({
        success: false,
        message: "Error interno validando archivo",
        code: "FILE_VALIDATION_ERROR",
      });
    }
  };

/**
 * Limpia archivos temporales
 * @param {Object} req - Request
 * @param {Object} res - Response
 * @param {Function} next - Next function
 */
const cleanupTempFiles = async (req, res, next) => {
  const originalSend = res.send;
  const filesToCleanup = [];

  // Recolectar archivos temporales
  if (req.file && req.file.path && req.file.path.includes("/temp/")) {
    filesToCleanup.push(req.file.path);
  }

  if (req.files) {
    Object.values(req.files)
      .flat()
      .forEach((file) => {
        if (file.path && file.path.includes("/temp/")) {
          filesToCleanup.push(file.path);
        }
      });
  }

  // Sobrescribir res.send para limpiar después
  res.send = function (data) {
    originalSend.call(this, data);

    // Limpiar archivos temporales de forma asíncrona
    if (filesToCleanup.length > 0) {
      setTimeout(async () => {
        for (const filePath of filesToCleanup) {
          try {
            await fs.unlink(filePath);
            logger.debug(`Archivo temporal eliminado: ${filePath}`);
          } catch (error) {
            if (error.code !== "ENOENT") {
              logger.error(
                `Error eliminando archivo temporal ${filePath}:`,
                error,
              );
            }
          }
        }
      }, 1000);
    }
  };

  next();
};

/**
 * Genera URL pública para archivo
 * @param {string} filename - Nombre del archivo
 * @param {string} type - Tipo de archivo
 * @returns {string} URL pública
 */
const generateFileUrl = (filename, type = "product") => {
  if (!filename) return null;

  const baseUrl = config.app.url || "http://localhost:3000";
  const uploadPath =
    type === "qr" ? "qrcodes" : type === "document" ? "documents" : "products";

  return `${baseUrl}/uploads/${uploadPath}/${filename}`;
};

/**
 * Elimina archivo del sistema
 * @param {string} filePath - Ruta del archivo
 * @returns {Promise<boolean>} Éxito de la operación
 */
const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    logger.debug(`Archivo eliminado: ${filePath}`);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      logger.warn(`Archivo no encontrado: ${filePath}`);
      return true; // Ya no existe
    }
    logger.error(`Error eliminando archivo ${filePath}:`, error);
    return false;
  }
};

// ✅ MEJORA: Objeto upload con configuraciones predefinidas
const upload = {
  // Single file uploads
  productImage: multer(uploadConfigs.productImage).single("image"),
  qrImage: multer(uploadConfigs.productImage).single("qrImage"),
  document: multer(uploadConfigs.document).single("document"),

  // Multiple file uploads
  productImages: multer(uploadConfigs.productImages).array("images", 10),
  documents: multer(uploadConfigs.document).array("documents", 5),

  // Mixed file uploads
  mixedFiles: multer(uploadConfigs.mixedFiles).fields([
    { name: "images", maxCount: 3 },
    { name: "documents", maxCount: 2 },
  ]),

  // Middleware functions
  handleUploadError,
  validateFileUpload,
  cleanupTempFiles,

  // Utility functions
  generateFileUrl,
  deleteFile,

  // ✅ NUEVO: Obtener información de configuración
  getConfig: () => ({
    maxFileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
    allowedMimeTypes: UPLOAD_CONFIG.ALLOWED_MIME_TYPES,
    uploadDir: UPLOAD_CONFIG.UPLOAD_DIR,
  }),

  // ✅ NUEVO: Middleware para validar antes de upload
  validateBeforeUpload:
    (options = {}) =>
    (req, res, next) => {
      const contentLength = req.headers["content-length"];

      if (contentLength) {
        const sizeInBytes = parseInt(contentLength, 10);
        const maxBytes = options.maxSize || UPLOAD_CONFIG.MAX_FILE_SIZE;

        if (sizeInBytes > maxBytes) {
          return res.status(413).json({
            success: false,
            message: `La solicitud es demasiado grande. Tamaño máximo: ${maxBytes / (1024 * 1024)}MB`,
            code: "REQUEST_TOO_LARGE",
          });
        }
      }

      next();
    },
};

module.exports = upload;
