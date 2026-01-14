/**
 * ✅ RUTAS DE USUARIOS - CORRECCIONES APLICADAS
 */

const express = require("express");
const router = express.Router();

// ✅ IMPORTACIONES CORREGIDAS
const validator = require("../middlewares/validator");
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const errorHandler = require("../middlewares/errorHandler");

// ✅ MIDDLEWARE COMÚN MEJORADO
const applyCommonMiddleware = (req, res, next) => {
  // Sanitizar inputs
  validator.sanitizeInput(req, res, () => {
    // Validar content type para métodos POST/PUT/PATCH
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      const contentType = req.headers["content-type"];
      if (!contentType || !contentType.includes("application/json")) {
        return res.status(415).json({
          success: false,
          message:
            "Tipo de contenido no soportado. Se requiere: application/json",
          received: contentType,
        });
      }
    }
    next();
  });
};

// ✅ Ruta de health check
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "User service is healthy",
    timestamp: new Date().toISOString(),
  });
});

// ✅ RUTAS DE PERFIL DEL USUARIO ACTUAL (protegidas)
const profileRouter = express.Router();

// Aplicar middlewares de autenticación
profileRouter.use(authMiddleware.verifyToken, authMiddleware.verifyActiveUser);

// Obtener perfil
profileRouter.get("/", errorHandler.asyncHandler(userController.getProfile));

// Actualizar perfil
profileRouter.put(
  "/",
  applyCommonMiddleware,
  validator.validateBody(
    validator.Joi.object({
      name: validator.Joi.string().trim().min(2).max(50).optional(),
      phone: validator.commonValidators.phone().optional(),
      email: validator.commonValidators.email().optional(),
      avatar: validator.Joi.string().uri().max(500).optional(),
      preferences: validator.Joi.object({
        notifications: validator.Joi.boolean().default(true),
        language: validator.Joi.string().valid("es", "en").default("es"),
        timezone: validator.Joi.string().default("America/Costa_Rica"),
      }).optional(),
    }),
  ),
  errorHandler.asyncHandler(userController.updateProfile),
);

// ✅ RUTAS DE ADMINISTRACIÓN (solo admin)
const adminRouter = express.Router();

// Verificar que el usuario sea admin
adminRouter.use(
  authMiddleware.verifyToken,
  authMiddleware.verifyActiveUser,
  authMiddleware.verifyAdmin,
);

// Listar usuarios
adminRouter.get(
  "/",
  validator.validatePagination,
  (req, res, next) => {
    const querySchema = validator.extendSchema(validator.schemas.pagination, {
      role: validator.Joi.string()
        .valid("user", "admin", "manager", "all")
        .default("all"),
      status: validator.Joi.string()
        .valid("active", "inactive", "suspended", "all")
        .default("active"),
      search: validator.Joi.string().max(100).allow(""),
      sortBy: validator.Joi.string()
        .valid("name", "email", "createdAt", "lastLogin")
        .default("name"),
      sortOrder: validator.Joi.string().valid("ASC", "DESC").default("ASC"),
    });

    const { error, value } = querySchema.validate(req.query);
    if (error) return res.status(400).json({ error: error.details });
    req.query = value;
    next();
  },
  errorHandler.asyncHandler(userController.getAllUsers),
);

// Obtener usuario por ID
adminRouter.get(
  "/:id",
  validator.validateParams(validator.schemas.idParam),
  errorHandler.asyncHandler(userController.getUserById),
);

// Crear usuario
adminRouter.post(
  "/",
  applyCommonMiddleware,
  validator.validateBody(
    validator.extendSchema(validator.schemas.register, {
      sendWelcomeEmail: validator.Joi.boolean().default(true),
      requirePasswordChange: validator.Joi.boolean().default(false),
    }),
  ),
  errorHandler.asyncHandler(userController.createUser),
);

// ✅ MONTAR RUTAS
router.use("/profile", profileRouter);
router.use("/admin", adminRouter);

module.exports = router;
