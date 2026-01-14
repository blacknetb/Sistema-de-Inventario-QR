/**
 * ✅ RUTAS DE REPORTES - CORRECCIONES APLICADAS
 */

const express = require("express");
const router = express.Router();

// ✅ IMPORTACIONES CORREGIDAS
const validator = require("../middlewares/validator");
const reportController = require("../controllers/reportController");
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
    message: "Report service is healthy",
    timestamp: new Date().toISOString(),
  });
});

// ✅ RUTAS PROTEGIDAS PARA TODOS LOS USUARIOS AUTENTICADOS
const protectedRouter = express.Router();

// Aplicar middlewares de autenticación
protectedRouter.use(
  authMiddleware.verifyToken,
  authMiddleware.verifyActiveUser,
);

// Estadísticas del dashboard
protectedRouter.get(
  "/dashboard",
  errorHandler.asyncHandler(reportController.getDashboardStats),
);

// ✅ RUTAS PARA MANAGER Y ADMIN
const managerRouter = express.Router();

// Verificar permisos de manager o admin
managerRouter.use(
  authMiddleware.verifyToken,
  authMiddleware.verifyActiveUser,
  (req, res, next) => {
    if (req.userRole === "user") {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para acceder a esta función de reportes",
        code: "REPORT_PERMISSION_DENIED",
      });
    }
    next();
  },
);

// Reporte de inventario
managerRouter.get(
  "/inventory",
  (req, res, next) => {
    const querySchema = validator.Joi.object({
      format: validator.Joi.string()
        .valid("json", "csv", "excel", "pdf")
        .default("json"),
      includeInactive: validator.Joi.boolean().default(false),
      categoryId: validator.Joi.number().integer().positive().allow(null),
      minStock: validator.Joi.number().integer().min(0),
      maxStock: validator.Joi.number().integer().min(0),
      sortBy: validator.Joi.string()
        .valid("name", "sku", "quantity", "category", "lastUpdated")
        .default("name"),
      sortOrder: validator.Joi.string().valid("ASC", "DESC").default("ASC"),
    });

    const { error, value } = querySchema.validate(req.query);
    if (error) return res.status(400).json({ error: error.details });
    req.query = value;
    next();
  },
  errorHandler.asyncHandler(reportController.generateInventoryReport),
);

// ✅ RUTAS SOLO PARA ADMIN
const adminRouter = express.Router();

adminRouter.use(
  authMiddleware.verifyToken,
  authMiddleware.verifyActiveUser,
  authMiddleware.verifyAdmin,
);

// Reporte financiero
adminRouter.get(
  "/financial",
  (req, res, next) => {
    const querySchema = validator.Joi.object({
      startDate: validator.Joi.date().iso().required(),
      endDate: validator.Joi.date()
        .iso()
        .min(validator.Joi.ref("startDate"))
        .required(),
      includeDetails: validator.Joi.boolean().default(false),
      format: validator.Joi.string()
        .valid("json", "csv", "excel", "pdf")
        .default("json"),
    });

    const { error, value } = querySchema.validate(req.query);
    if (error) return res.status(400).json({ error: error.details });
    req.query = value;
    next();
  },
  errorHandler.asyncHandler(reportController.generateFinancialReport),
);

// ✅ MONTAR RUTAS
router.use(protectedRouter);
router.use("/manager", managerRouter);
router.use("/admin", adminRouter);

module.exports = router;
