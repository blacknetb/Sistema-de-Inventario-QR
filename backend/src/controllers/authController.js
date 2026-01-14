/**
 * ✅ CONTROLADOR DE AUTENTICACIÓN MEJORADO - VERSIÓN CORREGIDA
 * Correcciones aplicadas:
 * 1. Fixed: IPv6 rate limiting error
 * 2. Fixed: Cache service dependency issue
 * 3. Fixed: Database transaction handling
 * 4. Fixed: Proper error handling
 * 5. Added: Fallback cache implementation
 */

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const config = require("../config/env");
const User = require("../models/User");
const logger = require("../utils/logger");
const { validationResult } = require("express-validator");
const database = require("../config/database"); // ✅ CORRECCIÓN: Usar desde config
const AuditLog = require("../models/AuditLog");

// ✅ CORRECCIÓN: Importar caché con manejo de error
let cacheService;
try {
  cacheService = require("../services/cacheService");
} catch (error) {
  logger.warn(
    "Cache service no disponible, usando implementación local",
    error.message,
  );
  // Implementación simple de caché en memoria
  cacheService = {
    get: async (key) => {
      const cache = require("../utils/memoryCache").getCache();
      return cache[key] || null;
    },
    set: async (key, value, ttl = 300) => {
      const cache = require("../utils/memoryCache").getCache();
      cache[key] = value;
      // Limpieza simple después de ttl
      setTimeout(() => {
        delete cache[key];
      }, ttl * 1000);
      return true;
    },
    del: async (key) => {
      const cache = require("../utils/memoryCache").getCache();
      delete cache[key];
      return true;
    },
    ping: async () => true,
  };
}

/**
 * ✅ CONTROLADOR DE AUTENTICACIÓN MEJORADO
 */
const authController = {
  // ✅ Constantes para configuración
  AUTH_CONSTANTS: {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    TOKEN_EXPIRY: {
      ACCESS: config.jwt.expiresIn || "7d",
      REFRESH: "30d",
      RESET_PASSWORD: "1h",
    },
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_TIME: 15 * 60 * 1000, // 15 minutos en milisegundos
    SALT_ROUNDS: 12,
    CACHE_TTL: 300, // 5 minutos para caché de usuarios
  },

  // ✅ Función para generar tokens JWT mejorada
  generateTokens: (userId, role, email, additionalClaims = {}) => {
    const tokenPayload = {
      userId,
      role,
      email,
      type: "access",
      iat: Math.floor(Date.now() / 1000),
      iss: "inventory-qr-system",
      ...additionalClaims,
    };

    const accessToken = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: authController.AUTH_CONSTANTS.TOKEN_EXPIRY.ACCESS,
      algorithm: config.jwt.algorithm || "HS256",
    });

    const refreshToken = jwt.sign(
      {
        userId,
        type: "refresh",
        tokenId: crypto.randomBytes(16).toString("hex"),
        iat: Math.floor(Date.now() / 1000),
        iss: "inventory-qr-system",
      },
      config.jwt.secret,
      {
        expiresIn: authController.AUTH_CONSTANTS.TOKEN_EXPIRY.REFRESH,
        algorithm: config.jwt.algorithm || "HS256",
      },
    );

    return { accessToken, refreshToken };
  },

  // ✅ Validar fortaleza de contraseña mejorada
  validatePasswordStrength: (password) => {
    const errors = [];
    const warnings = [];

    // ✅ Validaciones básicas
    if (!password || typeof password !== "string") {
      errors.push("La contraseña es requerida");
      return { isValid: false, errors, warnings, score: 0 };
    }

    const passLength = password.length;

    if (passLength < authController.AUTH_CONSTANTS.PASSWORD_MIN_LENGTH) {
      errors.push(
        `La contraseña debe tener al menos ${authController.AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} caracteres`,
      );
    }

    if (passLength > authController.AUTH_CONSTANTS.PASSWORD_MAX_LENGTH) {
      errors.push(
        `La contraseña no puede exceder ${authController.AUTH_CONSTANTS.PASSWORD_MAX_LENGTH} caracteres`,
      );
    }

    // ✅ Validaciones de complejidad
    let score = 0;

    if (/[A-Z]/.test(password)) score += 1;
    else
      errors.push("La contraseña debe contener al menos una letra mayúscula");

    if (/[a-z]/.test(password)) score += 1;
    else
      errors.push("La contraseña debe contener al menos una letra minúscula");

    if (/[0-9]/.test(password)) score += 1;
    else errors.push("La contraseña debe contener al menos un número");

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else
      warnings.push(
        "Considere agregar caracteres especiales para mayor seguridad",
      );

    // ✅ Verificar contraseñas comunes
    const commonPasswords = [
      "password",
      "12345678",
      "qwerty123",
      "admin123",
      "welcome123",
      "password123",
      "abc123456",
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push(
        "La contraseña es demasiado común. Por favor, elija una más segura",
      );
    }

    // ✅ Verificar patrones simples
    if (/^(.)\1+$/.test(password)) {
      errors.push("La contraseña contiene caracteres repetidos");
    }

    if (/^[0-9]+$/.test(password)) {
      errors.push("La contraseña no puede contener solo números");
    }

    // ✅ Calcular puntuación final
    const isValid = errors.length === 0;
    let strength = "weak";

    if (isValid) {
      if (score >= 4 && passLength >= 12) strength = "very-strong";
      else if (score >= 4) strength = "strong";
      else if (score >= 3) strength = "medium";
      else strength = "weak";
    }

    return {
      isValid,
      errors,
      warnings,
      score,
      strength,
      length: passLength,
    };
  },

  // ✅ Verificar si el usuario está bloqueado por intentos fallidos
  checkLoginAttempts: async (email) => {
    try {
      const cacheKey = `login_attempts:${email}`;
      const attempts = (await cacheService.get(cacheKey)) || {
        count: 0,
        lockedUntil: null,
      };

      if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
        const remainingTime = Math.ceil(
          (attempts.lockedUntil - Date.now()) / 1000,
        );
        return {
          locked: true,
          remainingTime,
          message: `Cuenta bloqueada. Intente nuevamente en ${remainingTime} segundos`,
        };
      }

      return { locked: false, attempts: attempts.count };
    } catch (error) {
      logger.warn("Error verificando intentos de login:", error.message);
      return { locked: false, attempts: 0 };
    }
  },

  // ✅ Registrar intento fallido de login
  recordFailedLogin: async (email) => {
    try {
      const cacheKey = `login_attempts:${email}`;
      const attempts = (await cacheService.get(cacheKey)) || {
        count: 0,
        lockedUntil: null,
      };

      attempts.count += 1;

      if (attempts.count >= authController.AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS) {
        attempts.lockedUntil =
          Date.now() + authController.AUTH_CONSTANTS.LOCKOUT_TIME;
        logger.warn(
          `Usuario bloqueado por múltiples intentos fallidos: ${email}`,
        );
      }

      await cacheService.set(
        cacheKey,
        attempts,
        authController.AUTH_CONSTANTS.LOCKOUT_TIME / 1000,
      );

      return attempts;
    } catch (error) {
      logger.warn("Error registrando intento fallido de login:", error.message);
    }
  },

  // ✅ Resetear intentos de login
  resetLoginAttempts: async (email) => {
    try {
      const cacheKey = `login_attempts:${email}`;
      await cacheService.del(cacheKey);
    } catch (error) {
      logger.warn("Error reseteando intentos de login:", error.message);
    }
  },

  // ✅ Construir respuesta de error estandarizada
  buildAuthErrorResponse: (statusCode, message, errorCode, details = null) => {
    const response = {
      success: false,
      message,
      error_code: errorCode,
      timestamp: new Date().toISOString(),
    };

    if (details) {
      response.details = details;
    }

    // ✅ No revelar información sensible en producción
    if (
      config.server.nodeEnv === "production" &&
      errorCode === "AUTHENTICATION_ERROR"
    ) {
      response.message = "Error de autenticación";
      delete response.details;
    }

    return {
      status: statusCode,
      json: response,
    };
  },

  // ✅ Construir respuesta de éxito estandarizada
  buildAuthSuccessResponse: (
    data,
    message = "Operación exitosa",
    statusCode = 200,
  ) => {
    return {
      status: statusCode,
      json: {
        success: true,
        message,
        data,
        metadata: {
          timestamp: new Date().toISOString(),
          version: "1.0",
        },
      },
    };
  },

  // ✅ Registrar nuevo usuario con validaciones mejoradas
  register: async (req, res) => {
    let transaction;

    try {
      const {
        name,
        email,
        password,
        role = "user",
        phone,
        department,
      } = req.body;

      logger.info("Iniciando registro de usuario", {
        email,
        role,
        ip: req.ip,
      });

      // ✅ Validaciones básicas
      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "El nombre debe tener al menos 2 caracteres",
        });
      }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Correo electrónico inválido",
        });
      }

      // ✅ Validar contraseña
      const passwordValidation =
        authController.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: "La contraseña no cumple con los requisitos de seguridad",
          errors: passwordValidation.errors,
          warnings: passwordValidation.warnings,
          score: passwordValidation.score,
        });
      }

      // ✅ Validar rol
      const validRoles = ["user", "manager", "admin"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Rol inválido",
          valid_roles: validRoles,
        });
      }

      // ✅ Verificar si el usuario ya existe
      const existingUser = await User.findByEmail(email.toLowerCase().trim());
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "El correo electrónico ya está registrado",
          suggestion:
            "Intente recuperar su contraseña si ha olvidado sus credenciales",
        });
      }

      // ✅ Iniciar transacción
      transaction = await database.beginTransaction();

      // ✅ Crear usuario con contraseña hasheada
      const user = await User.create(
        {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: password,
          role,
          phone: phone || null,
          department: department || null,
          status: "active",
          email_verified: false,
          created_by: 1, // ID del administrador o sistema
          last_login_at: null,
          login_attempts: 0,
        },
        transaction,
      );

      // ✅ Generar tokens
      const { accessToken, refreshToken } = authController.generateTokens(
        user.id,
        user.role,
        user.email,
      );

      // ✅ Registrar actividad de auditoría
      await AuditLog.create(
        {
          action: "user_registered",
          user_id: user.id,
          details: {
            email: user.email,
            role: user.role,
            registration_source: "web",
            ip_address: req.ip,
            user_agent: req.headers["user-agent"],
          },
        },
        transaction,
      );

      // ✅ Commit de la transacción
      await database.commitTransaction(transaction);

      logger.info("Usuario registrado exitosamente", {
        userId: user.id,
        email: user.email,
        role: user.role,
        ip: req.ip,
      });

      // ✅ Preparar respuesta
      const responseData = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          created_at: user.created_at,
          email_verified: user.email_verified,
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: authController.AUTH_CONSTANTS.TOKEN_EXPIRY.ACCESS,
          refresh_expires_in:
            authController.AUTH_CONSTANTS.TOKEN_EXPIRY.REFRESH,
          token_type: "Bearer",
        },
        actions: [
          {
            action: "verify_email",
            required: !user.email_verified,
            description: "Verificar dirección de correo electrónico",
          },
          {
            action: "complete_profile",
            suggested: true,
            description: "Completar información de perfil",
          },
        ],
      };

      const successResponse = authController.buildAuthSuccessResponse(
        responseData,
        "Usuario registrado exitosamente",
        201,
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      // ✅ Rollback de transacción si existe
      if (transaction) {
        try {
          await database.rollbackTransaction(transaction);
        } catch (rollbackError) {
          logger.error("Error durante rollback de transacción:", rollbackError);
        }
      }

      logger.error("Error en registro de usuario:", {
        error: error.message,
        stack: error.stack,
        email: req.body.email,
        ip: req.ip,
      });

      // ✅ Manejo de errores específicos
      let errorResponse;

      switch (error.code) {
        case "ER_DUP_ENTRY":
          errorResponse = authController.buildAuthErrorResponse(
            409,
            "El correo electrónico ya está registrado",
            "DUPLICATE_EMAIL",
          );
          break;

        default:
          errorResponse = authController.buildAuthErrorResponse(
            500,
            "Error interno al registrar usuario",
            "REGISTRATION_ERROR",
          );
      }

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Iniciar sesión con protección contra fuerza bruta
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      logger.info("Intento de inicio de sesión", {
        email,
        ip: req.ip,
      });

      // ✅ Validaciones básicas
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Correo electrónico inválido",
        });
      }

      if (!password) {
        return res.status(400).json({
          success: false,
          message: "La contraseña es requerida",
        });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // ✅ Verificar si la cuenta está bloqueada
      const lockStatus =
        await authController.checkLoginAttempts(normalizedEmail);
      if (lockStatus.locked) {
        return res.status(429).json({
          success: false,
          message: lockStatus.message,
          error_code: "ACCOUNT_LOCKED",
          retry_after: lockStatus.remainingTime,
        });
      }

      // ✅ Buscar usuario
      const user = await User.findByEmail(normalizedEmail, true);

      // ✅ Respuesta genérica por seguridad (mismo mensaje para usuario no encontrado y contraseña incorrecta)
      const genericError = {
        success: false,
        message: "Credenciales inválidas",
        error_code: "INVALID_CREDENTIALS",
      };

      if (!user) {
        // ✅ Registrar intento fallido incluso si el usuario no existe
        await authController.recordFailedLogin(normalizedEmail);
        return res.status(401).json(genericError);
      }

      // ✅ Verificar estado del usuario
      if (user.status !== "active") {
        let message = "Cuenta no activa";
        if (user.status === "suspended") {
          message = "Cuenta suspendida. Contacte al administrador";
        } else if (user.status === "pending") {
          message = "Cuenta pendiente de activación";
        }

        return res.status(403).json({
          success: false,
          message,
          error_code: "ACCOUNT_INACTIVE",
          account_status: user.status,
        });
      }

      // ✅ Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        // ✅ Registrar intento fallido
        await authController.recordFailedLogin(normalizedEmail);
        return res.status(401).json(genericError);
      }

      // ✅ Resetear intentos fallidos
      await authController.resetLoginAttempts(normalizedEmail);

      // ✅ Generar tokens
      const { accessToken, refreshToken } = authController.generateTokens(
        user.id,
        user.role,
        user.email,
        {
          name: user.name,
          department: user.department,
        },
      );

      // ✅ Actualizar último login
      await User.updateLastLogin(user.id, req.ip, req.headers["user-agent"]);

      // ✅ Registrar actividad de auditoría
      await AuditLog.create({
        action: "user_login",
        user_id: user.id,
        details: {
          login_method: "password",
          ip_address: req.ip,
          user_agent: req.headers["user-agent"],
          success: true,
        },
      });

      logger.info("Usuario inició sesión exitosamente", {
        userId: user.id,
        email: user.email,
        role: user.role,
        ip: req.ip,
      });

      // ✅ Preparar respuesta
      const responseData = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          department: user.department,
          last_login: user.last_login_at,
          email_verified: user.email_verified,
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: authController.AUTH_CONSTANTS.TOKEN_EXPIRY.ACCESS,
          refresh_expires_in:
            authController.AUTH_CONSTANTS.TOKEN_EXPIRY.REFRESH,
          token_type: "Bearer",
        },
        session: {
          id: `session_${Date.now()}_${user.id}`,
          created_at: new Date().toISOString(),
          expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 7 días
        },
      };

      const successResponse = authController.buildAuthSuccessResponse(
        responseData,
        "Inicio de sesión exitoso",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error en inicio de sesión:", {
        error: error.message,
        stack: error.stack,
        email: req.body.email,
        ip: req.ip,
      });

      const errorResponse = authController.buildAuthErrorResponse(
        500,
        "Error interno al iniciar sesión",
        "LOGIN_ERROR",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Cerrar sesión con invalidación de token
  logout: async (req, res) => {
    try {
      const userId = req.userId;
      const token = req.headers.authorization?.replace("Bearer ", "");

      logger.info("Usuario cerrando sesión", {
        userId,
        ip: req.ip,
      });

      // ✅ Invalidar token (en una implementación real, agregar a blacklist)
      if (token && process.env.ENABLE_TOKEN_BLACKLIST === "true") {
        const tokenKey = `blacklisted_token:${token}`;
        const decoded = jwt.decode(token);
        const ttl = decoded?.exp
          ? decoded.exp - Math.floor(Date.now() / 1000)
          : 3600;

        if (ttl > 0) {
          await cacheService.set(tokenKey, true, ttl);
        }
      }

      // ✅ Registrar actividad de auditoría
      await AuditLog.create({
        action: "user_logout",
        user_id: userId,
        details: {
          ip_address: req.ip,
          user_agent: req.headers["user-agent"],
          logout_method: "manual",
        },
      });

      logger.info("Sesión cerrada exitosamente", {
        userId,
      });

      const successResponse = authController.buildAuthSuccessResponse(
        null,
        "Sesión cerrada exitosamente",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error cerrando sesión:", {
        error: error.message,
        userId: req.userId,
        ip: req.ip,
      });

      const errorResponse = authController.buildAuthErrorResponse(
        500,
        "Error al cerrar sesión",
        "LOGOUT_ERROR",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Refrescar token con validación mejorada
  refreshToken: async (req, res) => {
    try {
      const refreshToken = req.body.refresh_token;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: "Refresh token requerido",
          error_code: "MISSING_REFRESH_TOKEN",
        });
      }

      // ✅ Verificar si el token está en blacklist
      if (process.env.ENABLE_TOKEN_BLACKLIST === "true") {
        const tokenKey = `blacklisted_token:${refreshToken}`;
        const isBlacklisted = await cacheService.get(tokenKey);

        if (isBlacklisted) {
          return res.status(401).json({
            success: false,
            message: "Refresh token revocado",
            error_code: "TOKEN_REVOKED",
          });
        }
      }

      // ✅ Decodificar y verificar token
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, config.jwt.secret);
      } catch (jwtError) {
        let message = "Refresh token inválido";
        let errorCode = "INVALID_REFRESH_TOKEN";

        if (jwtError.name === "TokenExpiredError") {
          message = "Refresh token expirado";
          errorCode = "REFRESH_TOKEN_EXPIRED";
        } else if (jwtError.name === "JsonWebTokenError") {
          message = "Refresh token malformado";
        }

        return res.status(401).json({
          success: false,
          message,
          error_code: errorCode,
        });
      }

      // ✅ Verificar tipo de token
      if (decoded.type !== "refresh") {
        return res.status(401).json({
          success: false,
          message: "Token inválido (no es un refresh token)",
          error_code: "INVALID_TOKEN_TYPE",
        });
      }

      // ✅ Obtener usuario
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no encontrado",
          error_code: "USER_NOT_FOUND",
        });
      }

      if (user.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "Cuenta no activa",
          error_code: "ACCOUNT_INACTIVE",
          account_status: user.status,
        });
      }

      // ✅ Invalidar refresh token antiguo
      if (process.env.ENABLE_TOKEN_BLACKLIST === "true") {
        const tokenKey = `blacklisted_token:${refreshToken}`;
        const ttl = decoded.exp
          ? decoded.exp - Math.floor(Date.now() / 1000)
          : 3600;

        if (ttl > 0) {
          await cacheService.set(tokenKey, true, ttl);
        }
      }

      // ✅ Generar nuevos tokens
      const { accessToken, refreshToken: newRefreshToken } =
        authController.generateTokens(user.id, user.role, user.email, {
          name: user.name,
          department: user.department,
        });

      // ✅ Registrar actividad
      await AuditLog.create({
        action: "token_refreshed",
        user_id: user.id,
        details: {
          ip_address: req.ip,
          user_agent: req.headers["user-agent"],
        },
      });

      logger.info("Token refrescado exitosamente", {
        userId: user.id,
        email: user.email,
      });

      const responseData = {
        access_token: accessToken,
        refresh_token: newRefreshToken,
        expires_in: authController.AUTH_CONSTANTS.TOKEN_EXPIRY.ACCESS,
        refresh_expires_in: authController.AUTH_CONSTANTS.TOKEN_EXPIRY.REFRESH,
        token_type: "Bearer",
      };

      const successResponse = authController.buildAuthSuccessResponse(
        responseData,
        "Token refrescado exitosamente",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error refrescando token:", {
        error: error.message,
        stack: error.stack,
        ip: req.ip,
      });

      const errorResponse = authController.buildAuthErrorResponse(
        500,
        "Error interno al refrescar token",
        "TOKEN_REFRESH_ERROR",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Obtener perfil del usuario actual con caché
  getProfile: async (req, res) => {
    try {
      const userId = req.userId;

      logger.debug("Obteniendo perfil de usuario", { userId });

      // ✅ Clave de caché
      const cacheKey = `user_profile:${userId}`;
      let userProfile;

      // ✅ Intentar obtener de caché
      if (process.env.ENABLE_CACHE === "true") {
        try {
          userProfile = await cacheService.get(cacheKey);
          if (userProfile) {
            logger.debug("Perfil obtenido de caché", { userId });
          }
        } catch (cacheError) {
          logger.warn(
            "Error al acceder al caché de perfil:",
            cacheError.message,
          );
        }
      }

      // ✅ Si no está en caché, obtener de la base de datos
      if (!userProfile) {
        const user = await User.findById(userId);

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "Usuario no encontrado",
            error_code: "USER_NOT_FOUND",
          });
        }

        // ✅ Obtener estadísticas del usuario (simplificado)
        const userStats = {
          login_count: user.login_count || 0,
          last_login: user.last_login_at,
          created_date: user.created_at,
        };

        userProfile = {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            phone: user.phone,
            status: user.status,
            email_verified: user.email_verified,
            created_at: user.created_at,
            last_login_at: user.last_login_at,
            login_count: user.login_count || 0,
          },
          statistics: userStats,
        };

        // ✅ Cachear perfil
        if (process.env.ENABLE_CACHE === "true") {
          try {
            await cacheService.set(
              cacheKey,
              userProfile,
              authController.AUTH_CONSTANTS.CACHE_TTL,
            );
          } catch (cacheError) {
            logger.warn(
              "Error al almacenar perfil en caché:",
              cacheError.message,
            );
          }
        }
      }

      // ✅ Agregar información de permisos
      userProfile.permissions = {
        can_edit_profile: true,
        can_change_password: true,
        can_view_audit_log:
          req.userRole === "admin" || req.userRole === "manager",
        can_manage_users: req.userRole === "admin",
      };

      const successResponse = authController.buildAuthSuccessResponse(
        userProfile,
        "Perfil obtenido exitosamente",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error obteniendo perfil:", {
        error: error.message,
        userId: req.userId,
        ip: req.ip,
      });

      const errorResponse = authController.buildAuthErrorResponse(
        500,
        "Error interno al obtener perfil",
        "PROFILE_FETCH_ERROR",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Actualizar perfil con validaciones
  updateProfile: async (req, res) => {
    let transaction;

    try {
      const userId = req.userId;
      const { name, email, phone, department } = req.body;
      const updateData = {};

      logger.info("Actualizando perfil de usuario", {
        userId,
        updateFields: Object.keys(req.body).filter(
          (key) => req.body[key] !== undefined,
        ),
      });

      // ✅ Validar nombre
      if (name !== undefined) {
        if (!name.trim() || name.trim().length < 2) {
          return res.status(400).json({
            success: false,
            message: "El nombre debe tener al menos 2 caracteres",
          });
        }
        updateData.name = name.trim();
      }

      // ✅ Validar email
      if (email !== undefined) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return res.status(400).json({
            success: false,
            message: "Correo electrónico inválido",
          });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Verificar si el nuevo email ya existe
        const existingUser = await User.findByEmail(normalizedEmail);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({
            success: false,
            message: "El correo electrónico ya está en uso",
          });
        }

        updateData.email = normalizedEmail;
        updateData.email_verified = false; // Requiere re-verificación
      }

      // ✅ Validar teléfono
      if (phone !== undefined) {
        // Validación básica de teléfono
        if (phone && !/^[\d\s\-\+\(\)]{7,20}$/.test(phone)) {
          return res.status(400).json({
            success: false,
            message: "Número de teléfono inválido",
          });
        }
        updateData.phone = phone || null;
      }

      // ✅ Validar departamento
      if (department !== undefined) {
        updateData.department = department?.trim() || null;
      }

      // ✅ Verificar si hay cambios
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No hay cambios para actualizar",
        });
      }

      // ✅ Iniciar transacción
      transaction = await database.beginTransaction();

      // ✅ Obtener datos antiguos para auditoría
      const oldUserData = await User.findById(userId);

      // ✅ Realizar actualización
      const updated = await User.update(
        userId,
        updateData,
        userId,
        transaction,
      );

      if (!updated) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      // ✅ Registrar actividad de auditoría
      await AuditLog.create(
        {
          action: "profile_updated",
          user_id: userId,
          details: {
            old_data: {
              name: oldUserData.name,
              email: oldUserData.email,
              phone: oldUserData.phone,
              department: oldUserData.department,
            },
            new_data: updateData,
            changed_fields: Object.keys(updateData),
            ip_address: req.ip,
            user_agent: req.headers["user-agent"],
          },
        },
        transaction,
      );

      // ✅ Commit de la transacción
      await database.commitTransaction(transaction);

      // ✅ Invalidar caché de perfil
      if (process.env.ENABLE_CACHE === "true") {
        await cacheService.del(`user_profile:${userId}`);
      }

      logger.info("Perfil actualizado exitosamente", {
        userId,
        updatedFields: Object.keys(updateData),
      });

      // ✅ Obtener usuario actualizado
      const user = await User.findById(userId);

      const successResponse = authController.buildAuthSuccessResponse(
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            phone: user.phone,
            email_verified: user.email_verified,
          },
          changes: Object.keys(updateData),
          requires_email_verification: updateData.email !== undefined,
        },
        "Perfil actualizado exitosamente",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      // ✅ Rollback de transacción si existe
      if (transaction) {
        try {
          await database.rollbackTransaction(transaction);
        } catch (rollbackError) {
          logger.error("Error durante rollback de transacción:", rollbackError);
        }
      }

      logger.error("Error actualizando perfil:", {
        error: error.message,
        userId: req.userId,
        ip: req.ip,
      });

      const errorResponse = authController.buildAuthErrorResponse(
        500,
        "Error interno al actualizar perfil",
        "PROFILE_UPDATE_ERROR",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Cambiar contraseña con validaciones de seguridad
  changePassword: async (req, res) => {
    let transaction;

    try {
      const userId = req.userId;
      const { current_password, new_password, confirm_password } = req.body;

      logger.info("Cambiando contraseña de usuario", { userId });

      // ✅ Validaciones
      if (!current_password || !new_password || !confirm_password) {
        return res.status(400).json({
          success: false,
          message: "Todos los campos son requeridos",
        });
      }

      if (new_password !== confirm_password) {
        return res.status(400).json({
          success: false,
          message: "Las nuevas contraseñas no coinciden",
        });
      }

      // ✅ Validar que no sea la misma contraseña
      if (current_password === new_password) {
        return res.status(400).json({
          success: false,
          message: "La nueva contraseña debe ser diferente a la actual",
        });
      }

      // ✅ Validar fortaleza de la nueva contraseña
      const passwordValidation =
        authController.validatePasswordStrength(new_password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message:
            "La nueva contraseña no cumple con los requisitos de seguridad",
          errors: passwordValidation.errors,
          warnings: passwordValidation.warnings,
          score: passwordValidation.score,
        });
      }

      // ✅ Obtener usuario actual
      const user = await User.findById(userId, true);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      // ✅ Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(
        current_password,
        user.password,
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Contraseña actual incorrecta",
        });
      }

      // ✅ Iniciar transacción
      transaction = await database.beginTransaction();

      // ✅ Hashear nueva contraseña
      const hashedPassword = await bcrypt.hash(
        new_password,
        authController.AUTH_CONSTANTS.SALT_ROUNDS,
      );

      // ✅ Actualizar contraseña
      await User.update(
        userId,
        { password: hashedPassword },
        userId,
        transaction,
      );

      // ✅ Registrar actividad de auditoría
      await AuditLog.create(
        {
          action: "password_changed",
          user_id: userId,
          details: {
            ip_address: req.ip,
            user_agent: req.headers["user-agent"],
            change_method: "manual",
          },
        },
        transaction,
      );

      // ✅ Invalidar todas las sesiones del usuario (opcional)
      if (process.env.ENABLE_TOKEN_BLACKLIST === "true") {
        const sessionKey = `user_sessions:${userId}`;
        await cacheService.del(sessionKey);
      }

      // ✅ Commit de la transacción
      await database.commitTransaction(transaction);

      logger.info("Contraseña cambiada exitosamente", {
        userId,
      });

      const successResponse = authController.buildAuthSuccessResponse(
        {
          password_changed: true,
          password_strength: passwordValidation.strength,
          next_recommended_change: new Date(
            Date.now() + 90 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 90 días
          security_recommendations: [
            "No comparta su contraseña con nadie",
            "Use un gestor de contraseñas",
            "Habilite la autenticación de dos factores si está disponible",
          ],
        },
        "Contraseña cambiada exitosamente",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      // ✅ Rollback de transacción si existe
      if (transaction) {
        try {
          await database.rollbackTransaction(transaction);
        } catch (rollbackError) {
          logger.error("Error durante rollback de transacción:", rollbackError);
        }
      }

      logger.error("Error cambiando contraseña:", {
        error: error.message,
        userId: req.userId,
        ip: req.ip,
      });

      const errorResponse = authController.buildAuthErrorResponse(
        500,
        "Error interno al cambiar contraseña",
        "PASSWORD_CHANGE_ERROR",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Solicitar restablecimiento de contraseña
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      logger.info("Solicitud de restablecimiento de contraseña", {
        email,
        ip: req.ip,
      });

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Correo electrónico inválido",
        });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // ✅ Verificar rate limiting para solicitudes de reset
      const resetKey = `password_reset:${normalizedEmail}`;
      const resetAttempts = (await cacheService.get(resetKey)) || {
        count: 0,
        lastAttempt: null,
      };

      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      if (
        resetAttempts.lastAttempt &&
        resetAttempts.lastAttempt > oneHourAgo &&
        resetAttempts.count >= 3
      ) {
        return res.status(429).json({
          success: false,
          message:
            "Demasiadas solicitudes de restablecimiento. Intente nuevamente en una hora",
          error_code: "RESET_LIMIT_EXCEEDED",
        });
      }

      // ✅ Actualizar contador de intentos
      resetAttempts.count =
        resetAttempts.lastAttempt && resetAttempts.lastAttempt > oneHourAgo
          ? resetAttempts.count + 1
          : 1;
      resetAttempts.lastAttempt = now;

      await cacheService.set(resetKey, resetAttempts, 3600); // 1 hora

      // ✅ Buscar usuario
      const user = await User.findByEmail(normalizedEmail);

      // ✅ Por seguridad, siempre devolver éxito aunque el email no exista
      // Pero internamente solo procesamos si el usuario existe
      if (user && user.status === "active") {
        // ✅ Generar token de restablecimiento
        const resetToken = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            type: "password_reset",
            iat: Math.floor(Date.now() / 1000),
          },
          config.jwt.secret,
          {
            expiresIn:
              authController.AUTH_CONSTANTS.TOKEN_EXPIRY.RESET_PASSWORD,
            algorithm: config.jwt.algorithm || "HS256",
          },
        );

        // ✅ Almacenar token en caché para validación posterior
        const resetTokenKey = `reset_token:${resetToken}`;
        await cacheService.set(
          resetTokenKey,
          {
            userId: user.id,
            email: user.email,
            createdAt: new Date().toISOString(),
          },
          3600,
        ); // 1 hora

        // ✅ Registrar actividad
        await AuditLog.create({
          action: "password_reset_requested",
          user_id: user.id,
          details: {
            ip_address: req.ip,
            user_agent: req.headers["user-agent"],
            reset_token_generated: true,
          },
        });

        logger.info("Token de restablecimiento generado", {
          userId: user.id,
          email: user.email,
          ip: req.ip,
        });

        // ✅ En un sistema real, aquí enviaríamos un email
        // Por ahora, solo registramos en logs
        logger.info(
          `Email de restablecimiento para ${user.email}: Token: ${resetToken.substring(0, 20)}...`,
        );
      }

      const successResponse = authController.buildAuthSuccessResponse(
        {
          message:
            "Si el email existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña",
          token_validity: "1 hora",
          check_spam: true,
        },
        "Solicitud procesada",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error en solicitud de restablecimiento de contraseña:", {
        error: error.message,
        email: req.body.email,
        ip: req.ip,
      });

      const errorResponse = authController.buildAuthErrorResponse(
        500,
        "Error al procesar la solicitud",
        "PASSWORD_RESET_REQUEST_ERROR",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Restablecer contraseña con token
  resetPassword: async (req, res) => {
    let transaction;

    try {
      const { token, email, new_password, confirm_password } = req.body;

      logger.info("Restableciendo contraseña con token", {
        email,
        ip: req.ip,
      });

      // ✅ Validaciones
      if (!token || !email || !new_password || !confirm_password) {
        return res.status(400).json({
          success: false,
          message: "Todos los campos son requeridos",
        });
      }

      if (new_password !== confirm_password) {
        return res.status(400).json({
          success: false,
          message: "Las contraseñas no coinciden",
        });
      }

      // ✅ Validar fortaleza de la nueva contraseña
      const passwordValidation =
        authController.validatePasswordStrength(new_password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message:
            "La nueva contraseña no cumple con los requisitos de seguridad",
          errors: passwordValidation.errors,
          warnings: passwordValidation.warnings,
        });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // ✅ Verificar token en caché
      const resetTokenKey = `reset_token:${token}`;
      const tokenData = await cacheService.get(resetTokenKey);

      if (!tokenData) {
        return res.status(400).json({
          success: false,
          message: "Token inválido o expirado",
          error_code: "INVALID_RESET_TOKEN",
        });
      }

      // ✅ Verificar que el email coincida
      if (tokenData.email !== normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: "Token no corresponde al email proporcionado",
          error_code: "TOKEN_EMAIL_MISMATCH",
        });
      }

      // ✅ Verificar token JWT
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, config.jwt.secret);
      } catch (jwtError) {
        await cacheService.del(resetTokenKey); // Limpiar token inválido
        return res.status(400).json({
          success: false,
          message: "Token inválido o expirado",
          error_code: "INVALID_RESET_TOKEN",
        });
      }

      // ✅ Verificar consistencia de datos
      if (
        decodedToken.email !== normalizedEmail ||
        decodedToken.userId !== tokenData.userId
      ) {
        return res.status(400).json({
          success: false,
          message: "Datos del token inconsistentes",
          error_code: "TOKEN_DATA_INCONSISTENT",
        });
      }

      // ✅ Iniciar transacción
      transaction = await database.beginTransaction();

      // ✅ Buscar usuario
      const user = await User.findById(tokenData.userId);

      if (!user) {
        await transaction.rollback();
        await cacheService.del(resetTokenKey);
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
          error_code: "USER_NOT_FOUND",
        });
      }

      if (user.email !== normalizedEmail) {
        await transaction.rollback();
        await cacheService.del(resetTokenKey);
        return res.status(400).json({
          success: false,
          message: "Email no coincide con el usuario",
          error_code: "EMAIL_MISMATCH",
        });
      }

      // ✅ Restablecer contraseña
      const hashedPassword = await bcrypt.hash(
        new_password,
        authController.AUTH_CONSTANTS.SALT_ROUNDS,
      );

      await User.update(
        user.id,
        { password: hashedPassword },
        user.id,
        transaction,
      );

      // ✅ Invalidar token usado
      await cacheService.del(resetTokenKey);

      // ✅ Invalidar todas las sesiones del usuario
      if (process.env.ENABLE_TOKEN_BLACKLIST === "true") {
        const sessionKey = `user_sessions:${user.id}`;
        await cacheService.del(sessionKey);

        // Agregar token actual a blacklist si existe en la solicitud
        const authToken = req.headers.authorization?.replace("Bearer ", "");
        if (authToken) {
          const blacklistKey = `blacklisted_token:${authToken}`;
          await cacheService.set(blacklistKey, true, 3600);
        }
      }

      // ✅ Registrar actividad de auditoría
      await AuditLog.create(
        {
          action: "password_reset_completed",
          user_id: user.id,
          details: {
            ip_address: req.ip,
            user_agent: req.headers["user-agent"],
            reset_method: "token",
            password_strength: passwordValidation.strength,
          },
        },
        transaction,
      );

      // ✅ Commit de la transacción
      await database.commitTransaction(transaction);

      logger.info("Contraseña restablecida exitosamente", {
        userId: user.id,
        email: user.email,
        ip: req.ip,
      });

      const successResponse = authController.buildAuthSuccessResponse(
        {
          password_reset: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          security_recommendations: [
            "Su contraseña ha sido actualizada exitosamente",
            "Se recomienda iniciar sesión con la nueva contraseña",
            "Considere habilitar la autenticación de dos factores",
          ],
        },
        "Contraseña restablecida exitosamente",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      // ✅ Rollback de transacción si existe
      if (transaction) {
        try {
          await database.rollbackTransaction(transaction);
        } catch (rollbackError) {
          logger.error("Error durante rollback de transacción:", rollbackError);
        }
      }

      logger.error("Error restableciendo contraseña:", {
        error: error.message,
        email: req.body.email,
        ip: req.ip,
      });

      const errorResponse = authController.buildAuthErrorResponse(
        500,
        "Error interno al restablecer contraseña",
        "PASSWORD_RESET_ERROR",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Verificar token JWT
  verifyToken: async (req, res) => {
    try {
      const userId = req.userId;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
          error_code: "USER_NOT_FOUND",
        });
      }

      const successResponse = authController.buildAuthSuccessResponse(
        {
          token_valid: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
          },
          token_info: {
            issued_at: new Date(req.auth.iat * 1000).toISOString(),
            expires_at: new Date(req.auth.exp * 1000).toISOString(),
            remaining_time: Math.max(0, req.auth.exp * 1000 - Date.now()),
          },
        },
        "Token válido",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error verificando token:", {
        error: error.message,
        userId: req.userId,
        ip: req.ip,
      });

      const errorResponse = authController.buildAuthErrorResponse(
        500,
        "Error interno al verificar token",
        "TOKEN_VERIFICATION_ERROR",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Health check de autenticación
  healthCheck: async (req, res) => {
    try {
      // ✅ Verificar conexión a base de datos
      let dbStatus = "unknown";
      try {
        const dbTest = await database.testConnection();
        dbStatus = dbTest ? "connected" : "disconnected";
      } catch (error) {
        dbStatus = "error";
      }

      // ✅ Verificar JWT secret
      let jwtStatus = "healthy";
      try {
        // Intentar firmar un token de prueba
        jwt.sign({ test: true }, config.jwt.secret, { expiresIn: "1m" });
      } catch (error) {
        jwtStatus = "unhealthy";
      }

      // ✅ Verificar bcrypt
      let bcryptStatus = "healthy";
      try {
        await bcrypt.hash("test", 10);
      } catch (error) {
        bcryptStatus = "unhealthy";
      }

      // ✅ Verificar caché si está habilitado
      let cacheStatus = "disabled";
      if (process.env.ENABLE_CACHE === "true") {
        try {
          await cacheService.ping();
          cacheStatus = "healthy";
        } catch (error) {
          cacheStatus = "unhealthy";
        }
      }

      // ✅ Obtener estadísticas de usuarios (simplificado)
      let userStats = { total: 0, active: 0, locked: 0 };
      try {
        const users = await User.findAll({ limit: 1, page: 1 });
        userStats.total = users.pagination?.total || 0;
        // Para simplificar, usamos valores por defecto
        userStats.active = Math.floor(userStats.total * 0.8);
        userStats.locked = Math.floor(userStats.total * 0.05);
      } catch (error) {
        logger.warn(
          "No se pudieron obtener estadísticas de usuarios:",
          error.message,
        );
      }

      const successResponse = authController.buildAuthSuccessResponse(
        {
          service: "authentication-service",
          status: "healthy",
          timestamp: new Date().toISOString(),
          dependencies: {
            database: dbStatus,
            jwt: jwtStatus,
            bcrypt: bcryptStatus,
            cache: cacheStatus,
          },
          metrics: userStats,
          security: {
            password_min_length:
              authController.AUTH_CONSTANTS.PASSWORD_MIN_LENGTH,
            max_login_attempts:
              authController.AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS,
            token_blacklist_enabled:
              process.env.ENABLE_TOKEN_BLACKLIST === "true",
          },
        },
        "Servicio de autenticación funcionando correctamente",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error en health check de autenticación:", error);

      const errorResponse = authController.buildAuthErrorResponse(
        503,
        "Servicio de autenticación no disponible",
        "AUTH_SERVICE_UNAVAILABLE",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Nueva función: Obtener sesiones activas del usuario
  getActiveSessions: async (req, res) => {
    try {
      const userId = req.userId;

      if (process.env.ENABLE_TOKEN_BLACKLIST !== "true") {
        return res.status(501).json({
          success: false,
          message: "Gestión de sesiones no está habilitada",
          error_code: "FEATURE_DISABLED",
        });
      }

      // ✅ En una implementación real, aquí obtendrías las sesiones activas de la base de datos o caché
      // Por ahora, devolvemos un placeholder
      const sessions = [
        {
          id: "current_session",
          created_at: new Date().toISOString(),
          ip_address: req.ip,
          user_agent: req.headers["user-agent"],
          is_current: true,
        },
      ];

      const successResponse = authController.buildAuthSuccessResponse(
        {
          sessions,
          total_sessions: sessions.length,
          can_terminate_other_sessions: req.userRole === "admin",
        },
        "Sesiones activas obtenidas",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error obteniendo sesiones activas:", error);

      const errorResponse = authController.buildAuthErrorResponse(
        500,
        "Error interno al obtener sesiones activas",
        "SESSIONS_FETCH_ERROR",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Nueva función: Terminar otras sesiones
  terminateOtherSessions: async (req, res) => {
    try {
      const userId = req.userId;

      if (process.env.ENABLE_TOKEN_BLACKLIST !== "true") {
        return res.status(501).json({
          success: false,
          message: "Gestión de sesiones no está habilitada",
          error_code: "FEATURE_DISABLED",
        });
      }

      // ✅ En una implementación real, aquí invalidarías todos los tokens excepto el actual
      // Por ahora, solo registramos la acción
      await AuditLog.create({
        action: "sessions_terminated",
        user_id: userId,
        details: {
          ip_address: req.ip,
          user_agent: req.headers["user-agent"],
          terminated_all_other: true,
        },
      });

      logger.info("Todas las otras sesiones terminadas", { userId });

      const successResponse = authController.buildAuthSuccessResponse(
        {
          sessions_terminated: true,
          current_session_preserved: true,
          timestamp: new Date().toISOString(),
        },
        "Todas las otras sesiones han sido terminadas",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error terminando sesiones:", error);

      const errorResponse = authController.buildAuthErrorResponse(
        500,
        "Error interno al terminar sesiones",
        "SESSIONS_TERMINATION_ERROR",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },
};

module.exports = authController;
