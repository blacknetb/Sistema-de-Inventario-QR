/**
 * ✅ HELPER FUNCTIONS MEJORADAS Y CORREGIDAS
 * Correcciones aplicadas:
 * 1. Solucionado error de importación de express-rate-limit
 * 2. Validación mejorada de parámetros
 * 3. Manejo robusto de errores
 * 4. Funciones optimizadas para producción
 */

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs").promises;

// ✅ CORRECCIÓN: Importar logger con fallback seguro
let logger;
try {
  logger = require("./logger");
} catch (error) {
  // Fallback logger si el módulo no está disponible
  logger = {
    debug: (...args) => console.debug("[DEBUG]", ...args),
    info: (...args) => console.log("[INFO]", ...args),
    warn: (...args) => console.warn("[WARN]", ...args),
    error: (...args) => console.error("[ERROR]", ...args),
  };
}

// ✅ CORRECCIÓN: Importar config y constants con fallback
let config, constants;
try {
  config = require("../config/env");
} catch (error) {
  config = {
    server: { nodeEnv: process.env.NODE_ENV || "development" },
  };
}

try {
  constants = require("./constants");
} catch (error) {
  // Constantes por defecto si el módulo no está disponible
  constants = {
    SECURITY: {
      PASSWORD: {
        MIN_LENGTH: 8,
        MAX_LENGTH: 128,
      },
    },
    DATE_FORMATS: {
      ISO: "iso",
      DATE_ONLY: "date",
      DATETIME: "datetime",
      HUMAN: "human",
      TIMESTAMP: "timestamp",
      SQL_DATE: "sql_date",
      SQL_DATETIME: "sql_datetime",
    },
    UNITS: {
      WEIGHT: {
        kg: { conversion: 1 },
        g: { conversion: 0.001 },
        lb: { conversion: 0.453592 },
      },
    },
  };
}

const helpers = {
  // ✅ CORRECCIÓN: Función para generar clave para rate limiting (IPv6 compatible)
  createRateLimitKey: (req) => {
    try {
      // Usar el helper de express-rate-limit para IPv6
      const { ipKeyGenerator } = require("express-rate-limit");
      return ipKeyGenerator(req, req.ip);
    } catch (error) {
      // Fallback si el helper no está disponible
      const ip =
        req.headers["x-forwarded-for"] ||
        req.ip ||
        req.socket.remoteAddress ||
        "unknown";

      // Normalizar IPv6
      if (ip.includes(":")) {
        return crypto.createHash("sha256").update(ip).digest("hex");
      }

      return ip;
    }
  },

  // ✅ MEJORA: Encriptar contraseña con validación mejorada
  hashPassword: async (password, saltRounds = 12) => {
    try {
      // Validación robusta del password
      if (typeof password !== "string" || password.trim().length === 0) {
        throw new Error("Password must be a non-empty string");
      }

      const trimmedPassword = password.trim();

      if (trimmedPassword.length < constants.SECURITY.PASSWORD.MIN_LENGTH) {
        throw new Error(
          `Password must be at least ${constants.SECURITY.PASSWORD.MIN_LENGTH} characters long`,
        );
      }

      if (trimmedPassword.length > constants.SECURITY.PASSWORD.MAX_LENGTH) {
        throw new Error(
          `Password cannot exceed ${constants.SECURITY.PASSWORD.MAX_LENGTH} characters`,
        );
      }

      // ✅ CORRECCIÓN: Expresión regular más flexible para passwords
      const passwordRegex = new RegExp(
        `^(?=.*[a-z])` + // al menos una minúscula
          `(?=.*[A-Z])` + // al menos una mayúscula
          `(?=.*\\d)` + // al menos un número
          `[A-Za-z\\d@$!%*?&]{${constants.SECURITY.PASSWORD.MIN_LENGTH},}$`,
      );

      if (!passwordRegex.test(trimmedPassword)) {
        throw new Error("Password does not meet complexity requirements");
      }

      // Generar hash
      const salt = await bcrypt.genSalt(saltRounds);
      const hashed = await bcrypt.hash(trimmedPassword, salt);

      logger.debug("Password hashed successfully", {
        saltRounds,
        hashedLength: hashed.length,
      });

      return hashed;
    } catch (error) {
      logger.error("Error hashing password", {
        error: error.message,
        stack: error.stack,
      });
      throw new Error("Error processing password: " + error.message);
    }
  },

  // ✅ MEJORA: Comparar contraseña con protección timing attack mejorada
  comparePassword: async (password, hashedPassword) => {
    try {
      // Validación de parámetros
      if (
        !password ||
        typeof password !== "string" ||
        !hashedPassword ||
        typeof hashedPassword !== "string"
      ) {
        logger.warn("Invalid parameters for password comparison");
        return false;
      }

      // Usar compare para evitar timing attacks
      const isValid = await bcrypt.compare(password.trim(), hashedPassword);

      if (!isValid) {
        logger.warn("Invalid password attempt", {
          hashedLength: hashedPassword.length,
        });
      }

      return isValid;
    } catch (error) {
      logger.error("Error comparing passwords", {
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  },

  // ✅ CORRECCIÓN: Generar SKU único sin dependencias de módulos faltantes
  generateSKU: (name, categoryId, variant = "", options = {}) => {
    try {
      const {
        prefix = "SKU",
        separator = "-",
        includeTimestamp = true,
        randomLength = 4,
      } = options;

      // Validar y normalizar parámetros
      const nameCode = (name || "PROD")
        .substring(0, 4)
        .replace(/[^A-Z0-9]/gi, "")
        .padEnd(4, "X")
        .toUpperCase();

      const categoryCode = String(categoryId || "000").padStart(3, "0");
      const variantCode = (variant || "00").substring(0, 2).toUpperCase();

      // Generar componente aleatorio seguro
      const random = crypto
        .randomBytes(Math.ceil(randomLength / 2))
        .toString("hex")
        .toUpperCase()
        .substring(0, randomLength);

      // Generar timestamp opcional
      const timestamp = includeTimestamp
        ? Date.now().toString(36).toUpperCase().substring(0, 6)
        : "";

      // Construir SKU
      const parts = [prefix, nameCode, categoryCode, variantCode, random];
      if (timestamp) parts.push(timestamp);

      return parts.filter(Boolean).join(separator);
    } catch (error) {
      logger.error("Error generating SKU", {
        error: error.message,
        name,
        categoryId,
        variant,
      });

      // Fallback seguro
      return `SKU-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
    }
  },

  // ✅ CORRECCIÓN: Formatear fecha con fallbacks robustos
  formatDate: (date, format = "iso", timezone = "UTC", locale = "es-ES") => {
    try {
      let dateObj;

      // Convertir entrada a Date
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === "string" || typeof date === "number") {
        dateObj = new Date(date);
      } else {
        throw new Error("Invalid date type");
      }

      // Validar fecha
      if (isNaN(dateObj.getTime())) {
        throw new Error("Invalid date value");
      }

      // Formatear según especificación
      const formatUpper = format.toUpperCase();

      switch (formatUpper) {
        case "ISO":
          return dateObj.toISOString();

        case "DATE":
        case "DATE_ONLY":
          return dateObj.toISOString().split("T")[0];

        case "DATETIME":
          try {
            return dateObj.toLocaleString(locale, {
              timeZone: timezone,
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
          } catch {
            return dateObj.toLocaleString();
          }

        case "HUMAN":
          try {
            return dateObj.toLocaleDateString(locale, {
              timeZone: timezone,
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            });
          } catch {
            return dateObj.toDateString();
          }

        case "TIMESTAMP":
          return dateObj.getTime();

        case "SQL_DATE":
          return dateObj.toISOString().split("T")[0];

        case "SQL_DATETIME":
          return dateObj.toISOString().slice(0, 19).replace("T", " ");

        default:
          logger.warn(`Unknown date format: ${format}, using ISO`);
          return dateObj.toISOString();
      }
    } catch (error) {
      logger.error("Error formatting date", {
        date,
        format,
        error: error.message,
      });
      return null;
    }
  },

  // ✅ CORRECCIÓN: Validar email simplificada
  isValidEmail: (email, options = {}) => {
    try {
      const {
        checkDomain = false,
        checkMX = false,
        allowDisposable = false,
      } = options;

      if (!email || typeof email !== "string") {
        return false;
      }

      const trimmedEmail = email.trim().toLowerCase();

      // Expresión regular robusta para email
      const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

      if (!emailRegex.test(trimmedEmail)) {
        return false;
      }

      // Verificar longitud
      if (trimmedEmail.length > 254) {
        return false;
      }

      // Verificar dominio básico
      const domain = trimmedEmail.split("@")[1];
      if (!domain || domain.length < 2 || !domain.includes(".")) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error("Error validating email", {
        email,
        error: error.message,
      });
      return false;
    }
  },

  // ✅ CORRECCIÓN: Sanitizar entrada de texto simplificado
  sanitizeInput: (input, options = {}) => {
    try {
      const {
        trim = true,
        stripHtml = true,
        stripDangerousChars = true,
        maxLength = null,
        emptyToNull = false,
        allowLineBreaks = false,
        escapeHtml = false,
      } = options;

      if (input === null || input === undefined) {
        return input;
      }

      let sanitized = String(input);

      // Trim
      if (trim) {
        sanitized = sanitized.trim();
      }

      // Eliminar tags HTML
      if (stripHtml) {
        sanitized = sanitized.replace(/<[^>]*>/g, "");
      }

      // Eliminar caracteres peligrosos básicos
      if (stripDangerousChars) {
        sanitized = sanitized.replace(/[<>'"`;\\]/g, "");
      }

      // Escapar HTML (solo caracteres básicos)
      if (escapeHtml) {
        const htmlEntities = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        };
        sanitized = sanitized.replace(/[&<>"']/g, (char) => htmlEntities[char]);
      }

      // Manejar saltos de línea
      if (!allowLineBreaks) {
        sanitized = sanitized.replace(/[\r\n]+/g, " ");
      }

      // Limitar longitud
      if (maxLength && sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
      }

      // Convertir a null si está vacío
      if (emptyToNull && sanitized === "") {
        return null;
      }

      return sanitized;
    } catch (error) {
      logger.error("Error sanitizing input", {
        input,
        error: error.message,
      });
      return input;
    }
  },

  // ✅ CORRECCIÓN: Generar código aleatorio optimizado
  generateRandomCode: (length = 8, type = "alphanumeric", options = {}) => {
    try {
      const {
        excludeSimilar = true,
        excludeAmbiguous = true,
        customChars = null,
      } = options;

      // Validar longitud
      if (length < 4 || length > 128) {
        throw new Error("Length must be between 4 and 128");
      }

      let chars;

      // Definir set de caracteres según tipo
      if (customChars) {
        chars = customChars;
      } else {
        switch (type.toLowerCase()) {
          case "numeric":
            chars = "0123456789";
            break;
          case "alphabetic":
            chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            break;
          case "alphanumeric":
            chars =
              "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            break;
          case "hex":
            chars = "0123456789ABCDEF";
            break;
          case "secure":
            return crypto
              .randomBytes(Math.ceil(length / 2))
              .toString("hex")
              .toUpperCase()
              .substring(0, length);
          default:
            throw new Error("Invalid type");
        }
      }

      // Filtrar caracteres similares (opcional)
      if (excludeSimilar && type !== "hex") {
        chars = chars.replace(/[0O1Il]/gi, "");
      }

      // Filtrar caracteres ambiguos (opcional)
      if (excludeAmbiguous && type !== "hex") {
        chars = chars.replace(/[{}[\]()\/\\'"`~,;:.<>]/g, "");
      }

      if (chars.length === 0) {
        throw new Error("No characters available after filtering");
      }

      // Generar código seguro
      let result = "";
      const randomBytes = crypto.randomBytes(length);

      for (let i = 0; i < length; i++) {
        const randomIndex = randomBytes[i] % chars.length;
        result += chars[randomIndex];
      }

      return result;
    } catch (error) {
      logger.error("Error generating random code", {
        error: error.message,
        length,
        type,
      });

      // Fallback seguro
      return crypto
        .randomBytes(Math.ceil(length / 2))
        .toString("hex")
        .toUpperCase()
        .substring(0, length);
    }
  },

  // ✅ MEJORA: Generar hash con validación
  generateHash: (data, algorithm = "sha256", encoding = "hex") => {
    try {
      if (data === undefined || data === null) {
        throw new Error("Data cannot be undefined or null");
      }

      const hash = crypto.createHash(algorithm);
      hash.update(String(data));
      return hash.digest(encoding);
    } catch (error) {
      logger.error("Error generating hash", {
        error: error.message,
        algorithm,
      });
      return null;
    }
  },

  // ✅ MEJORA: Generar UUID (soporta Node.js 15+)
  generateUUID: (version = 4) => {
    try {
      if (version === 4) {
        // Usar crypto.randomUUID() si está disponible (Node.js 15+)
        if (crypto.randomUUID) {
          return crypto.randomUUID();
        }

        // Fallback para versiones anteriores
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
          /[xy]/g,
          function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          },
        );
      }

      throw new Error(`UUID version ${version} not supported`);
    } catch (error) {
      logger.error("Error generating UUID", {
        error: error.message,
        version,
      });

      // Fallback
      return `fallback-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    }
  },

  // ✅ CORRECCIÓN: Formatear moneda con fallback
  formatCurrency: (
    amount,
    currency = "USD",
    locale = "es-MX",
    options = {},
  ) => {
    try {
      // Validar amount
      const numericAmount = Number(amount);
      if (isNaN(numericAmount)) {
        throw new Error("Invalid amount");
      }

      // Verificar si Intl está disponible
      if (!Intl || !Intl.NumberFormat) {
        return `${currency} ${numericAmount.toFixed(2)}`;
      }

      // Opciones de formato
      const formatOptions = {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options,
      };

      return new Intl.NumberFormat(locale, formatOptions).format(numericAmount);
    } catch (error) {
      logger.error("Error formatting currency", {
        amount,
        currency,
        error: error.message,
      });
      return `${currency} ${Number(amount).toFixed(2)}`;
    }
  },

  // ✅ CORRECCIÓN: Calcular edad robusta
  calculateAge: (birthDate, referenceDate = new Date()) => {
    try {
      const birth = new Date(birthDate);
      const reference = new Date(referenceDate);

      if (isNaN(birth.getTime()) || isNaN(reference.getTime())) {
        throw new Error("Invalid date");
      }

      let age = reference.getFullYear() - birth.getFullYear();
      const monthDiff = reference.getMonth() - birth.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && reference.getDate() < birth.getDate())
      ) {
        age--;
      }

      return Math.max(0, age);
    } catch (error) {
      logger.error("Error calculating age", {
        birthDate,
        referenceDate,
        error: error.message,
      });
      return null;
    }
  },

  // ✅ CORRECCIÓN: Convertir unidades simplificada
  convertUnits: (value, fromUnit, toUnit, unitType = "weight") => {
    try {
      // Tablas de conversión básicas
      const conversionTables = {
        WEIGHT: {
          kg: { conversion: 1 },
          g: { conversion: 0.001 },
          lb: { conversion: 0.453592 },
          oz: { conversion: 0.0283495 },
        },
        LENGTH: {
          m: { conversion: 1 },
          cm: { conversion: 0.01 },
          mm: { conversion: 0.001 },
          in: { conversion: 0.0254 },
          ft: { conversion: 0.3048 },
        },
        VOLUME: {
          l: { conversion: 1 },
          ml: { conversion: 0.001 },
          gal: { conversion: 3.78541 },
        },
      };

      const units = conversionTables[unitType.toUpperCase()];

      if (!units || !units[fromUnit] || !units[toUnit]) {
        throw new Error("Invalid units or unit type");
      }

      // Convertir a unidad base primero
      const baseValue = value * units[fromUnit].conversion;

      // Convertir de unidad base a destino
      return baseValue / units[toUnit].conversion;
    } catch (error) {
      logger.error("Error converting units", {
        value,
        fromUnit,
        toUnit,
        unitType,
        error: error.message,
      });
      return null;
    }
  },

  // ✅ CORRECCIÓN: Parsear JSON seguro
  safeJsonParse: (jsonString, defaultValue = null) => {
    try {
      if (
        jsonString === null ||
        jsonString === undefined ||
        typeof jsonString !== "string"
      ) {
        return defaultValue;
      }

      const trimmed = jsonString.trim();
      if (trimmed === "") {
        return defaultValue;
      }

      const parsed = JSON.parse(trimmed);
      return parsed;
    } catch (error) {
      logger.error("Error parsing JSON", {
        jsonString: jsonString?.substring(0, 100),
        error: error.message,
      });
      return defaultValue;
    }
  },

  // ✅ CORRECCIÓN: Crear directorio con validación
  ensureDirectoryExists: async (dirPath) => {
    try {
      if (!dirPath || typeof dirPath !== "string") {
        throw new Error("Invalid directory path");
      }

      const normalizedPath = path.normalize(dirPath);

      // Verificar si ya existe
      try {
        await fs.access(normalizedPath);
        return true;
      } catch {
        // Crear directorio
        await fs.mkdir(normalizedPath, { recursive: true });
        logger.debug(`Directory created: ${normalizedPath}`);
        return true;
      }
    } catch (error) {
      logger.error("Error creating directory", {
        dirPath,
        error: error.message,
      });
      return false;
    }
  },

  // ✅ CORRECCIÓN: Generar slug optimizado
  generateSlug: (text, separator = "-", maxLength = 100) => {
    try {
      if (!text || typeof text !== "string") {
        return "";
      }

      let slug = text
        .toLowerCase()
        .normalize("NFD") // Separar acentos
        .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
        .replace(/[^a-z0-9]+/g, separator) // Reemplazar no alfanuméricos
        .replace(new RegExp(`^${separator}+|${separator}+$`, "g"), "") // Trim separadores
        .substring(0, maxLength);

      // Eliminar separador final si existe
      if (slug.endsWith(separator)) {
        slug = slug.slice(0, -1);
      }

      return slug;
    } catch (error) {
      logger.error("Error generating slug", {
        text: text?.substring(0, 50),
        error: error.message,
      });
      return "";
    }
  },

  // ✅ CORRECCIÓN: Truncar texto inteligente
  truncateText: (text, maxLength, ellipsis = "...") => {
    try {
      if (!text || typeof text !== "string") {
        return text;
      }

      if (text.length <= maxLength) {
        return text;
      }

      // Truncar en el último espacio antes del límite
      const truncated = text.substring(0, maxLength - ellipsis.length);
      const lastSpace = truncated.lastIndexOf(" ");

      if (lastSpace > maxLength * 0.6 && lastSpace > 0) {
        return truncated.substring(0, lastSpace) + ellipsis;
      }

      return truncated + ellipsis;
    } catch (error) {
      logger.error("Error truncating text", {
        text: text?.substring(0, 50),
        maxLength,
        error: error.message,
      });
      return text;
    }
  },

  // ✅ NUEVO: Validar objeto vacío o nulo
  isEmpty: (value) => {
    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value === "string" && value.trim() === "") {
      return true;
    }

    if (Array.isArray(value) && value.length === 0) {
      return true;
    }

    if (typeof value === "object" && Object.keys(value).length === 0) {
      return true;
    }

    return false;
  },

  // ✅ NUEVO: Capitalizar texto
  capitalize: (text, allWords = false) => {
    try {
      if (!text || typeof text !== "string") {
        return text;
      }

      if (allWords) {
        return text
          .toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }

      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    } catch (error) {
      logger.error("Error capitalizing text", {
        text,
        error: error.message,
      });
      return text;
    }
  },

  // ✅ NUEVO: Extraer números de texto
  extractNumbers: (text) => {
    try {
      if (!text || typeof text !== "string") {
        return [];
      }

      const numbers = text.match(/\d+/g);
      return numbers ? numbers.map(Number) : [];
    } catch (error) {
      logger.error("Error extracting numbers", {
        text,
        error: error.message,
      });
      return [];
    }
  },

  // ✅ NUEVO: Validar URL
  isValidUrl: (urlString, options = {}) => {
    try {
      const { requireProtocol = true, allowedProtocols = ["http:", "https:"] } =
        options;

      if (!urlString || typeof urlString !== "string") {
        return false;
      }

      let url;
      try {
        url = new URL(urlString);
      } catch {
        // Si no tiene protocolo, intentar agregar https://
        if (!requireProtocol) {
          try {
            url = new URL(`https://${urlString}`);
          } catch {
            return false;
          }
        } else {
          return false;
        }
      }

      // Verificar protocolo
      if (!allowedProtocols.includes(url.protocol)) {
        return false;
      }

      // Verificar hostname
      if (!url.hostname || url.hostname.length < 1) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error("Error validating URL", {
        urlString,
        error: error.message,
      });
      return false;
    }
  },

  // ✅ NUEVO: Delays asíncronos
  delay: (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  // ✅ NUEVO: Función para retry con backoff exponencial
  retryWithBackoff: async (fn, maxRetries = 3, baseDelay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, {
          error: error.message,
        });

        await helpers.delay(delay);
      }
    }
  },
};

module.exports = helpers;
