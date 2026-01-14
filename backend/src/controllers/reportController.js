const Inventory = require("../models/Inventory");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const Supplier = require("../models/Supplier");
const pdfService = require("../services/pdfService");
const excelService = require("../services/excelService");
const emailService = require("../services/emailService");
const cacheService = require("../services/cacheService");
const logger = require("../utils/logger");
const {
  NotFoundError,
  ValidationError,
  PermissionError,
} = require("../utils/errors");
const config = require("../config/env");

/**
 * ✅ CONTROLADOR DE REPORTES MEJORADO
 * Correcciones aplicadas:
 * 1. Manejo robusto de permisos
 * 2. Validación mejorada de parámetros
 * 3. Caché para datos frecuentes
 * 4. Manejo de errores consistente
 * 5. Estructura modular y mantenible
 */

class ReportController {
  /**
   * ✅ VALIDAR RANGO DE FECHAS MEJORADO
   * Con soporte para múltiples formatos y límites configurables
   */
  static validateDateRange(startDate, endDate, options = {}) {
    const {
      maxDays = 365, // Límite máximo de días por defecto
      allowOpenEnd = false, // Permitir rango abierto
      requireBothDates = false, // Requerir ambas fechas
    } = options;

    const errors = [];
    let parsedStartDate = null;
    let parsedEndDate = null;

    // ✅ Validar fecha de inicio
    if (startDate) {
      parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        errors.push("Fecha de inicio inválida. Formato esperado: YYYY-MM-DD");
      }
    } else if (requireBothDates) {
      errors.push("Fecha de inicio requerida");
    }

    // ✅ Validar fecha de fin
    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        errors.push("Fecha de fin inválida. Formato esperado: YYYY-MM-DD");
      }
    } else if (requireBothDates && !allowOpenEnd) {
      errors.push("Fecha de fin requerida");
    }

    // ✅ Validar relaciones entre fechas si ambas existen
    if (parsedStartDate && parsedEndDate) {
      if (parsedStartDate > parsedEndDate) {
        errors.push(
          "La fecha de inicio no puede ser posterior a la fecha de fin",
        );
      }

      // Verificar límite máximo de días
      const diffInDays = Math.ceil(
        (parsedEndDate - parsedStartDate) / (1000 * 60 * 60 * 24),
      );
      if (diffInDays > maxDays) {
        errors.push(`El rango de fechas no puede ser mayor a ${maxDays} días`);
      }
    }

    // ✅ Ajustar fechas para incluir todo el día
    if (parsedStartDate) {
      parsedStartDate.setHours(0, 0, 0, 0);
    }
    if (parsedEndDate) {
      parsedEndDate.setHours(23, 59, 59, 999);
    }

    return {
      isValid: errors.length === 0,
      errors,
      parsedStartDate,
      parsedEndDate,
    };
  }

  /**
   * ✅ VERIFICAR PERMISOS MEJORADO
   * Con niveles de acceso granular
   */
  static async checkReportPermissions(userRole, reportType) {
    const permissionMap = {
      admin: [
        "inventory",
        "movements",
        "transactions",
        "value",
        "turnover",
        "user_activity",
        "custom",
      ],
      manager: ["inventory", "movements", "transactions", "value", "turnover"],
      auditor: ["inventory", "movements"],
      viewer: ["inventory"],
    };

    const allowedReports = permissionMap[userRole] || [];

    if (!allowedReports.includes(reportType)) {
      throw new PermissionError(
        `Permisos insuficientes para generar reportes de tipo: ${reportType}`,
        "INSUFFICIENT_PERMISSIONS",
        { requiredRole: userRole, allowedReports },
      );
    }

    return true;
  }

  /**
   * ✅ GENERAR ID DE REPORTE
   * Único y descriptivo
   */
  static generateReportId(reportType) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 8).toUpperCase();
    const prefix =
      {
        inventory: "INV",
        movements: "MOV",
        transactions: "TRX",
        value: "VAL",
        turnover: "TURN",
        user_activity: "ACT",
        custom: "CST",
      }[reportType] || "REP";

    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * ✅ REGISTRAR GENERACIÓN DE REPORTE
   * Para auditoría y seguimiento
   */
  static async logReportGeneration(
    reportId,
    reportType,
    userId,
    parameters,
    format,
  ) {
    try {
      await AuditLog.create({
        action: `report_${reportType}_generated`,
        user_id: userId,
        details: {
          report_id: reportId,
          report_type: reportType,
          format,
          parameters,
          generated_at: new Date().toISOString(),
        },
      });

      logger.info("Reporte generado registrado en auditoría", {
        reportId,
        reportType,
        userId,
        format,
      });
    } catch (error) {
      logger.warn("Error registrando generación de reporte:", {
        error: error.message,
        reportId,
        userId,
      });
    }
  }

  /**
   * ✅ GENERAR REPORTE DE INVENTARIO COMPLETO
   * Con caching, exportación múltiple y recomendaciones inteligentes
   */
  static async generateInventoryReport(req, res) {
    const transaction = await require("../models/database").beginTransaction();

    try {
      const {
        format = "json",
        email = false,
        category_id,
        include_inactive = "false",
        detailed = "false",
        cache = "true",
      } = req.query;

      const userId = req.userId;
      const userRole = req.userRole;

      // ✅ VERIFICAR PERMISOS
      await ReportController.checkReportPermissions(userRole, "inventory");

      // ✅ VALIDAR PARÁMETROS
      const categoryId = category_id ? parseInt(category_id, 10) : null;
      if (category_id && (!categoryId || categoryId <= 0)) {
        throw new ValidationError(
          "ID de categoría inválido",
          "INVALID_CATEGORY_ID",
        );
      }

      // ✅ PREPARAR PARÁMETROS
      const showInactive = include_inactive === "true";
      const isDetailed = detailed === "true";
      const useCache = cache === "true";

      // ✅ CLAVE DE CACHÉ
      const cacheKey = `report:inventory:${userId}:${categoryId}:${showInactive}:${isDetailed}`;
      let reportData = null;

      // ✅ INTENTAR OBTENER DESDE CACHÉ
      if (useCache && config.cache.enabled) {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
          logger.debug("Reporte obtenido desde caché", { cacheKey });
          reportData = cached;
        }
      }

      // ✅ GENERAR REPORTE SI NO HAY CACHÉ
      if (!reportData) {
        // ✅ OBTENER DATOS CON PARALELISMO
        const [
          stockReport,
          lowStockProducts,
          expiringProducts,
          categoryStats,
          totalProductsCount,
        ] = await Promise.all([
          Inventory.getStockReport(
            categoryId,
            null,
            null,
            showInactive,
            "name",
            "ASC",
          ),
          Inventory.getLowStockProducts(null, categoryId, "all"),
          Product.getExpiringProducts(30, 1000, 0),
          Category.getCategoryStatsWithProducts(),
          Product.count(categoryId, showInactive ? null : "active"),
        ]);

        // ✅ CALCULAR RESUMEN GENERAL
        const totalProducts = stockReport.length;
        const inStockProducts = stockReport.filter(
          (p) => p.current_stock > 0,
        ).length;
        const outOfStockProducts = stockReport.filter(
          (p) => p.current_stock === 0,
        ).length;
        const lowStockCount = lowStockProducts.length;
        const expiringCount = expiringProducts.length;

        const totalStockValue = stockReport.reduce((sum, product) => {
          return sum + product.current_stock * (product.price || 0);
        }, 0);

        const totalCostValue = stockReport.reduce((sum, product) => {
          return (
            sum +
            product.current_stock * (product.cost_price || product.price || 0)
          );
        }, 0);

        const potentialProfit = totalStockValue - totalCostValue;
        const profitMargin =
          totalCostValue > 0
            ? ((potentialProfit / totalCostValue) * 100).toFixed(2)
            : 0;

        // ✅ GENERAR ID DE REPORTE
        const reportId = ReportController.generateReportId("inventory");

        // ✅ CONSTRUIR REPORTE
        reportData = {
          report_id: reportId,
          generated_at: new Date().toISOString(),
          generated_by: userId,
          report_type: "inventory",
          parameters: {
            category_id: categoryId,
            include_inactive: showInactive,
            detailed: isDetailed,
            cache_used: false,
          },
          summary: {
            total_products: totalProducts,
            in_stock: inStockProducts,
            out_of_stock: outOfStockProducts,
            low_stock: lowStockCount,
            expiring_soon: expiringCount,
            total_stock_value: Number(totalStockValue.toFixed(2)),
            total_cost_value: Number(totalCostValue.toFixed(2)),
            potential_profit: Number(potentialProfit.toFixed(2)),
            profit_margin: `${profitMargin}%`,
            inventory_turnover:
              totalProductsCount > 0
                ? (totalCostValue / totalProductsCount).toFixed(2)
                : 0,
          },
          category_breakdown: categoryStats,
          alerts: {
            low_stock_products: lowStockProducts.slice(0, 20).map((p) => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              current_stock: p.current_stock,
              min_stock: p.min_stock,
              urgency: p.current_stock === 0 ? "critical" : "warning",
            })),
            expiring_products: expiringProducts.slice(0, 20).map((p) => ({
              id: p.id,
              name: p.name,
              expiry_date: p.expiry_date,
              days_until_expiry: p.days_until_expiry || 0,
            })),
            out_of_stock_products: stockReport
              .filter((p) => p.current_stock === 0)
              .slice(0, 20)
              .map((p) => ({
                id: p.id,
                name: p.name,
                sku: p.sku,
                last_restock: p.last_movement_date,
              })),
          },
          metrics: {
            stock_coverage_ratio:
              inStockProducts > 0
                ? ((inStockProducts / totalProducts) * 100).toFixed(1)
                : 0,
            stockout_rate:
              outOfStockProducts > 0
                ? ((outOfStockProducts / totalProducts) * 100).toFixed(1)
                : 0,
            average_stock_value:
              totalProducts > 0
                ? (totalStockValue / totalProducts).toFixed(2)
                : 0,
          },
        };

        // ✅ AGREGAR DETALLES SI ES SOLICITADO
        if (isDetailed) {
          reportData.detailed_report = {
            products: stockReport.slice(0, 200).map((p) => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              category: p.category_name,
              current_stock: p.current_stock,
              price: p.price,
              total_value: p.current_stock * p.price,
              status: p.status,
            })),
            statistics: {
              total_products_included: stockReport.length,
              average_price:
                stockReport.length > 0
                  ? stockReport.reduce((sum, p) => sum + p.price, 0) /
                    stockReport.length
                  : 0,
              highest_value_product: stockReport.reduce(
                (max, p) =>
                  p.current_stock * p.price > max.value
                    ? { product: p.name, value: p.current_stock * p.price }
                    : max,
                { product: "", value: 0 },
              ),
            },
          };
        }

        // ✅ GENERAR RECOMENDACIONES INTELIGENTES
        reportData.recommendations =
          await ReportController.generateInventoryRecommendations(
            lowStockCount,
            outOfStockProducts,
            expiringCount,
            totalProducts,
            totalCostValue,
          );

        // ✅ GUARDAR EN CACHÉ
        if (useCache && config.cache.enabled) {
          await cacheService.set(cacheKey, reportData, config.cache.ttl || 300);
          reportData.parameters.cache_used = true;
        }
      }

      // ✅ EXPORTACIÓN A PDF
      if (format === "pdf") {
        const pdfBuffer = await pdfService.generateInventoryReport(reportData);

        await ReportController.logReportGeneration(
          reportData.report_id,
          "inventory",
          userId,
          req.query,
          "pdf",
        );

        res.set({
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="inventory-report-${reportData.report_id}.pdf"`,
          "Content-Length": pdfBuffer.length,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        });

        return res.send(pdfBuffer);
      }

      // ✅ EXPORTACIÓN A EXCEL
      if (format === "excel") {
        const excelBuffer = await excelService.generateInventoryReport(
          reportData.detailed_report?.products || [],
          reportData.summary,
        );

        await ReportController.logReportGeneration(
          reportData.report_id,
          "inventory",
          userId,
          req.query,
          "excel",
        );

        res.set({
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="inventory-report-${reportData.report_id}.xlsx"`,
          "Content-Length": excelBuffer.length,
        });

        return res.send(excelBuffer);
      }

      // ✅ ENVÍO POR EMAIL
      if (email === "true" || email === true) {
        const userEmail = req.user?.email;

        if (!userEmail) {
          throw new ValidationError(
            "No se pudo determinar el email del usuario",
            "EMAIL_NOT_AVAILABLE",
          );
        }

        await emailService.sendInventoryReport(reportData, userEmail);

        await ReportController.logReportGeneration(
          reportData.report_id,
          "inventory",
          userId,
          req.query,
          "email",
        );

        logger.info("Reporte de inventario enviado por email", {
          userId,
          email: userEmail,
          reportId: reportData.report_id,
        });

        return res.json({
          success: true,
          message: "Reporte enviado por email exitosamente",
          data: {
            report_id: reportData.report_id,
            sent_to: userEmail,
            summary: reportData.summary,
            delivery_status: "sent",
          },
        });
      }

      // ✅ REGISTRAR EN AUDITORÍA
      await ReportController.logReportGeneration(
        reportData.report_id,
        "inventory",
        userId,
        req.query,
        "json",
      );

      // ✅ RESPUESTA JSON POR DEFECTO
      const response = {
        success: true,
        data: reportData,
        metadata: {
          generated_at: new Date().toISOString(),
          processing_time: `${Date.now() - req.startTime || 0}ms`,
          format_available: ["json", "pdf", "excel", "email"],
          cache_info: {
            enabled: useCache,
            cached: reportData.parameters.cache_used,
          },
        },
        export_options: [
          {
            format: "pdf",
            url: `${req.protocol}://${req.get("host")}/api/reports/inventory?format=pdf&${new URLSearchParams(req.query).toString()}`,
            description: "Descargar como PDF",
            estimated_size: "500KB-2MB",
          },
          {
            format: "excel",
            url: `${req.protocol}://${req.get("host")}/api/reports/inventory?format=excel&${new URLSearchParams(req.query).toString()}`,
            description: "Descargar como Excel",
            estimated_size: "200KB-1MB",
          },
          {
            format: "email",
            url: `${req.protocol}://${req.get("host")}/api/reports/inventory?email=true&${new URLSearchParams(req.query).toString()}`,
            method: "GET",
            description: "Enviar por email",
            requires_email: true,
          },
        ],
      };

      // ✅ AGREGAR ENLACES DE NAVEGACIÓN
      if (userRole === "admin" || userRole === "manager") {
        response.navigation = {
          previous_report: null, // Podría obtenerse de historial
          next_report: `${req.protocol}://${req.get("host")}/api/reports/movements?${new URLSearchParams({ format: "json" }).toString()}`,
          dashboard: `${req.protocol}://${req.get("host")}/api/dashboard`,
        };
      }

      res.json(response);
    } catch (error) {
      await transaction.rollback();

      logger.error("Error generando reporte de inventario:", {
        error: error.message,
        stack: error.stack,
        query: req.query,
        userId: req.userId,
        userRole: req.userRole,
      });

      // ✅ MANEJO DE ERRORES ESPECÍFICOS
      if (error instanceof PermissionError) {
        return res.status(403).json({
          success: false,
          message: error.message,
          error_code: error.code,
          details: error.details,
        });
      }

      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message,
          error_code: error.code,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error al generar reporte de inventario",
        error_code: "INVENTORY_REPORT_ERROR",
        reference_id: `ERR-${Date.now()}`,
        timestamp: new Date().toISOString(),
        support_contact:
          config.app.support_email || "support@inventory-system.com",
      });
    }
  }

  /**
   * ✅ GENERAR RECOMENDACIONES DE INVENTARIO
   * Basadas en análisis de datos
   */
  static async generateInventoryRecommendations(
    lowStockCount,
    outOfStockProducts,
    expiringCount,
    totalProducts,
    totalCostValue,
  ) {
    const recommendations = [];

    // ✅ RECOMENDACIÓN DE REABASTECIMIENTO
    if (lowStockCount > totalProducts * 0.1) {
      recommendations.push({
        type: "stock_replenishment",
        priority: "high",
        code: "REC001",
        message: `Se recomienda reabastecer ${lowStockCount} productos con stock bajo`,
        description: "Más del 10% de los productos tienen stock bajo",
        action: "Generar orden de compra para productos críticos",
        estimated_cost: totalCostValue * 0.2, // 20% del valor total estimado
        timeframe: "1 semana",
        impact: "Alto - Evitar pérdidas de ventas",
      });
    }

    // ✅ RECOMENDACIÓN DE PRODUCTOS SIN STOCK
    if (outOfStockProducts > 0) {
      recommendations.push({
        type: "out_of_stock",
        priority: "critical",
        code: "REC002",
        message: `${outOfStockProducts} productos están fuera de stock`,
        description: "Productos no disponibles para venta o uso",
        action: "Reabastecer urgentemente o considerar descontinuar",
        timeframe: "Inmediato",
        impact: "Crítico - Pérdida de ingresos inmediata",
      });
    }

    // ✅ RECOMENDACIÓN DE PRODUCTOS POR EXPIRAR
    if (expiringCount > 0) {
      const priority = expiringCount > 10 ? "high" : "medium";
      recommendations.push({
        type: "expiring_products",
        priority,
        code: "REC003",
        message: `${expiringCount} productos están por expirar en los próximos 30 días`,
        description: "Productos con fecha de expiración cercana",
        action: "Implementar promociones o donaciones para evitar pérdidas",
        timeframe: "30 días",
        impact:
          priority === "high"
            ? "Alto - Pérdidas potenciales significativas"
            : "Medio",
      });
    }

    // ✅ RECOMENDACIÓN DE OPTIMIZACIÓN DE STOCK
    if (lowStockCount === 0 && outOfStockProducts === 0) {
      recommendations.push({
        type: "stock_optimization",
        priority: "low",
        code: "REC004",
        message: "Inventario bien gestionado",
        description: "Niveles de stock dentro de parámetros óptimos",
        action:
          "Considerar reducción de stock de seguridad para liberar capital",
        timeframe: "Evaluación trimestral",
        impact: "Bajo - Mejora de rotación de inventario",
      });
    }

    return recommendations;
  }

  /**
   * ✅ GENERAR REPORTE DE MOVIMIENTOS MEJORADO
   * Con análisis de tendencias y detección de anomalías
   */
  static async generateMovementReport(req, res) {
    const transaction = await require("../models/database").beginTransaction();

    try {
      const {
        start_date,
        end_date,
        format = "json",
        category_id,
        movement_type,
        user_id,
        detailed = "false",
        anomaly_detection = "true",
      } = req.query;

      const userId = req.userId;
      const userRole = req.userRole;

      // ✅ VERIFICAR PERMISOS
      await ReportController.checkReportPermissions(userRole, "movements");

      // ✅ VALIDAR RANGO DE FECHAS
      const dateValidation = ReportController.validateDateRange(
        start_date,
        end_date,
        {
          maxDays: 365,
          allowOpenEnd: true,
        },
      );

      if (!dateValidation.isValid) {
        throw new ValidationError(
          "Errores en el rango de fechas",
          "INVALID_DATE_RANGE",
          { errors: dateValidation.errors },
        );
      }

      // ✅ OBTENER DATOS DE MOVIMIENTOS
      const movements = await Inventory.getAllHistory(
        5000, // Límite alto para análisis
        0,
        null,
        movement_type,
        start_date,
        end_date,
        user_id,
        null,
        null,
        null,
        "created_at",
        "DESC",
      );

      // ✅ FILTRAR POR CATEGORÍA SI SE ESPECIFICA
      let filteredMovements = movements;
      if (category_id) {
        const categoryId = parseInt(category_id, 10);
        const categoryProducts = await Product.findByCategory(
          categoryId,
          5000,
          0,
        );
        const productIds = categoryProducts.map((p) => p.id);
        filteredMovements = movements.filter((m) =>
          productIds.includes(m.product_id),
        );
      }

      // ✅ CALCULAR ESTADÍSTICAS
      const stats = ReportController.calculateMovementStats(filteredMovements);

      // ✅ DETECTAR ANOMALÍAS
      let anomalies = [];
      if (anomaly_detection === "true") {
        anomalies =
          await ReportController.detectMovementAnomalies(filteredMovements);
      }

      // ✅ ANALIZAR TENDENCIAS
      const trends = ReportController.analyzeMovementTrends(filteredMovements);

      // ✅ GENERAR ID DE REPORTE
      const reportId = ReportController.generateReportId("movements");

      // ✅ CONSTRUIR REPORTE
      const reportData = {
        report_id: reportId,
        generated_at: new Date().toISOString(),
        generated_by: userId,
        report_type: "movements",
        period: {
          start_date: dateValidation.parsedStartDate
            ? dateValidation.parsedStartDate.toISOString()
            : "Desde el inicio",
          end_date: dateValidation.parsedEndDate
            ? dateValidation.parsedEndDate.toISOString()
            : "Hasta ahora",
          days_covered:
            dateValidation.parsedStartDate && dateValidation.parsedEndDate
              ? Math.ceil(
                  (dateValidation.parsedEndDate -
                    dateValidation.parsedStartDate) /
                    (1000 * 60 * 60 * 24),
                )
              : "N/A",
        },
        filters: {
          category_id: category_id || "Todas",
          movement_type: movement_type || "Todos",
          user_id: user_id || "Todos los usuarios",
          anomaly_detection: anomaly_detection === "true",
        },
        summary: stats,
        analytics: {
          trends,
          anomalies,
          busiest_period:
            await ReportController.findBusiestPeriod(filteredMovements),
          seasonal_patterns:
            await ReportController.analyzeSeasonalPatterns(filteredMovements),
        },
        detailed_analysis:
          detailed === "true"
            ? {
                movements: filteredMovements.slice(0, 1000),
                product_analysis:
                  await ReportController.analyzeProductsByMovement(
                    filteredMovements,
                  ),
                user_analysis:
                  await ReportController.analyzeUsersByMovement(
                    filteredMovements,
                  ),
              }
            : undefined,
      };

      // ✅ EXPORTACIÓN
      if (format === "pdf") {
        const pdfBuffer = await pdfService.generateMovementReport(reportData);

        await ReportController.logReportGeneration(
          reportId,
          "movements",
          userId,
          req.query,
          "pdf",
        );

        res.set({
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="movement-report-${reportId}.pdf"`,
        });

        return res.send(pdfBuffer);
      }

      if (format === "excel") {
        const excelBuffer = await excelService.generateMovementReport(
          filteredMovements.slice(0, 1000),
          reportData.summary,
        );

        res.set({
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="movement-report-${reportId}.xlsx"`,
        });

        return res.send(excelBuffer);
      }

      // ✅ REGISTRAR Y RESPONDER
      await ReportController.logReportGeneration(
        reportId,
        "movements",
        userId,
        req.query,
        "json",
      );

      res.json({
        success: true,
        data: reportData,
        export_options: ReportController.generateExportOptions(
          req,
          "movements",
        ),
      });
    } catch (error) {
      await transaction.rollback();

      logger.error("Error generando reporte de movimientos:", {
        error: error.message,
        query: req.query,
        userId: req.userId,
      });

      ReportController.handleErrorResponse(error, res, "MOVEMENT_REPORT_ERROR");
    }
  }

  /**
   * ✅ CALCULAR ESTADÍSTICAS DE MOVIMIENTOS
   */
  static calculateMovementStats(movements) {
    const totalMovements = movements.length;
    const totalEntries = movements.filter(
      (m) => m.movement_type === "in",
    ).length;
    const totalExits = movements.filter(
      (m) => m.movement_type === "out",
    ).length;
    const totalAdjustments = movements.filter(
      (m) => m.movement_type === "adjustment",
    ).length;

    const entryQuantity = movements
      .filter((m) => m.movement_type === "in")
      .reduce((sum, m) => sum + m.quantity, 0);

    const exitQuantity = movements
      .filter((m) => m.movement_type === "out")
      .reduce((sum, m) => sum + m.quantity, 0);

    const adjustmentQuantity = movements
      .filter((m) => m.movement_type === "adjustment")
      .reduce((sum, m) => sum + m.quantity, 0);

    return {
      total_movements: totalMovements,
      total_entries: totalEntries,
      total_exits: totalExits,
      total_adjustments: totalAdjustments,
      total_entry_quantity: entryQuantity,
      total_exit_quantity: exitQuantity,
      total_adjustment_quantity: adjustmentQuantity,
      net_change: entryQuantity - exitQuantity,
      entry_exit_ratio: exitQuantity > 0 ? entryQuantity / exitQuantity : 0,
      average_movement_size:
        totalMovements > 0
          ? (entryQuantity + exitQuantity + adjustmentQuantity) / totalMovements
          : 0,
    };
  }

  /**
   * ✅ GENERAR REPORTE DE TRANSACCIONES MEJORADO
   */
  static async generateTransactionReport(req, res) {
    try {
      const {
        start_date,
        end_date,
        type,
        format = "json",
        category_id,
        detailed = "false",
      } = req.query;

      // ✅ VERIFICAR PERMISOS
      await ReportController.checkReportPermissions(
        req.userRole,
        "transactions",
      );

      // ✅ VALIDAR FECHAS
      const dateValidation = ReportController.validateDateRange(
        start_date,
        end_date,
      );
      if (!dateValidation.isValid) {
        throw new ValidationError(
          "Errores en el rango de fechas",
          "INVALID_DATE_RANGE",
          { errors: dateValidation.errors },
        );
      }

      // ✅ OBTENER DATOS
      const transactions = await Transaction.findAll(
        5000,
        0,
        null,
        type,
        start_date,
        end_date,
        "created_at",
        "DESC",
      );

      // ✅ FILTRAR POR CATEGORÍA
      let filteredTransactions = transactions;
      if (category_id) {
        const categoryId = parseInt(category_id, 10);
        const categoryProducts = await Product.findByCategory(
          categoryId,
          5000,
          0,
        );
        const productIds = categoryProducts.map((p) => p.id);
        filteredTransactions = transactions.filter((t) =>
          productIds.includes(t.product_id),
        );
      }

      // ✅ CALCULAR ESTADÍSTICAS
      const summary = await Transaction.getSummary(
        start_date,
        end_date,
        category_id,
      );
      const typeBreakdown =
        ReportController.calculateTypeBreakdown(filteredTransactions);
      const monetaryAnalysis =
        await ReportController.calculateMonetaryAnalysis(filteredTransactions);

      // ✅ GENERAR REPORTE
      const reportId = ReportController.generateReportId("transactions");
      const reportData = {
        report_id: reportId,
        generated_at: new Date().toISOString(),
        generated_by: req.userId,
        report_type: "transactions",
        period: {
          start_date: start_date || "Desde el inicio",
          end_date: end_date || "Hasta ahora",
        },
        filters: {
          type: type || "Todos",
          category_id: category_id || "Todas",
        },
        summary: {
          ...summary,
          type_breakdown: typeBreakdown,
          monetary_analysis: monetaryAnalysis,
        },
        analytics: {
          peak_hours: await Transaction.getBusiestHour(start_date, end_date),
          average_daily_volume:
            filteredTransactions.length > 0
              ? await ReportController.calculateDailyAverage(
                  filteredTransactions,
                  start_date,
                  end_date,
                )
              : 0,
          transaction_value_distribution:
            await ReportController.calculateValueDistribution(
              filteredTransactions,
            ),
        },
        detailed_transactions:
          detailed === "true"
            ? filteredTransactions.slice(0, 500).map((t) => ({
                id: t.id,
                product_id: t.product_id,
                product_name: t.product_name,
                type: t.type,
                quantity: t.quantity,
                unit_price: t.unit_price,
                total_value: t.quantity * t.unit_price,
                timestamp: t.created_at,
                user_id: t.created_by,
                reference: t.reference_number,
              }))
            : undefined,
      };

      // ✅ MANEJAR FORMATOS DE EXPORTACIÓN
      return ReportController.handleExportFormat(
        req,
        res,
        reportData,
        "transactions",
        format,
        filteredTransactions,
      );
    } catch (error) {
      logger.error("Error generando reporte de transacciones:", {
        error: error.message,
        query: req.query,
      });

      ReportController.handleErrorResponse(
        error,
        res,
        "TRANSACTION_REPORT_ERROR",
      );
    }
  }

  /**
   * ✅ OBTENER ESTADÍSTICAS DEL DASHBOARD MEJORADO
   */
  static async getDashboardStats(req, res) {
    try {
      const userRole = req.userRole;

      // ✅ CACHEAR DATOS DEL DASHBOARD
      const cacheKey = `dashboard:${userRole}:${new Date().getHours()}`;
      let dashboardData = null;

      if (config.cache.enabled) {
        dashboardData = await cacheService.get(cacheKey);
      }

      if (!dashboardData) {
        // ✅ OBTENER DATOS EN PARALELO
        const [
          stockReport,
          lowStockProducts,
          recentMovements,
          recentTransactions,
          expiringProducts,
          topCategories,
          userActivity,
          todayStats,
        ] = await Promise.all([
          Inventory.getStockReport(null, null, null, false, "name", "ASC"),
          Inventory.getLowStockProducts(),
          Inventory.getAllHistory(
            10,
            0,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "created_at",
            "DESC",
          ),
          Transaction.findAll(
            10,
            0,
            null,
            null,
            null,
            null,
            "created_at",
            "DESC",
          ),
          Product.getExpiringProducts(7, 5, 0),
          Category.getTopCategories(5),
          AuditLog.getRecentActivity(10),
          ReportController.getTodayStats(),
        ]);

        // ✅ CONSTRUIR DASHBOARD
        dashboardData = {
          overview: ReportController.calculateOverviewStats(
            stockReport,
            lowStockProducts,
            expiringProducts,
          ),
          recent_activity: {
            movements: recentMovements,
            transactions: recentTransactions,
            user_activity: userActivity,
          },
          alerts: ReportController.generateDashboardAlerts(
            lowStockProducts,
            expiringProducts,
            stockReport,
          ),
          categories: topCategories,
          today: todayStats,
        };

        // ✅ AGREGAR GRÁFICOS PARA ADMINISTRADORES
        if (userRole === "admin" || userRole === "manager") {
          dashboardData.charts = await ReportController.getChartData();
        }

        // ✅ CACHEAR POR 5 MINUTOS
        if (config.cache.enabled) {
          await cacheService.set(cacheKey, dashboardData, 300);
        }
      }

      // ✅ FILTRAR DATOS POR ROL
      const filteredData = ReportController.filterDashboardByRole(
        dashboardData,
        userRole,
      );

      res.json({
        success: true,
        data: filteredData,
        generated_at: new Date().toISOString(),
        cache: {
          cached: dashboardData !== null,
          ttl_seconds: 300,
        },
        quick_actions: ReportController.generateDashboardQuickActions(
          req,
          userRole,
        ),
      });
    } catch (error) {
      logger.error("Error obteniendo estadísticas del dashboard:", error);

      // ✅ DATOS DE FALLBACK
      const fallbackData = {
        overview: {
          products: { total: 0, in_stock: 0, low_stock: 0, expiring_soon: 0 },
          status: "offline",
        },
        alerts: [],
        message: "Datos limitados debido a un error en el sistema",
      };

      res.status(200).json({
        success: true,
        data: fallbackData,
        error: error.message,
        is_fallback: true,
      });
    }
  }

  /**
   * ✅ MANEJAR FORMATOS DE EXPORTACIÓN
   */
  static async handleExportFormat(
    req,
    res,
    reportData,
    reportType,
    format,
    rawData = [],
  ) {
    switch (format) {
      case "pdf":
        const pdfBuffer =
          await pdfService[
            `generate${reportType.charAt(0).toUpperCase() + reportType.slice(1)}Report`
          ](reportData);

        await ReportController.logReportGeneration(
          reportData.report_id,
          reportType,
          req.userId,
          req.query,
          "pdf",
        );

        res.set({
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${reportType}-report-${reportData.report_id}.pdf"`,
        });

        return res.send(pdfBuffer);

      case "excel":
        const excelBuffer = await excelService[
          `generate${reportType.charAt(0).toUpperCase() + reportType.slice(1)}Report`
        ](rawData, reportData.summary);

        res.set({
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${reportType}-report-${reportData.report_id}.xlsx"`,
        });

        return res.send(excelBuffer);

      case "csv":
        // Implementación CSV si es necesario
        break;

      default:
        // ✅ JSON POR DEFECTO
        await ReportController.logReportGeneration(
          reportData.report_id,
          reportType,
          req.userId,
          req.query,
          "json",
        );

        return res.json({
          success: true,
          data: reportData,
          export_options: ReportController.generateExportOptions(
            req,
            reportType,
          ),
        });
    }
  }

  /**
   * ✅ GENERAR OPCIONES DE EXPORTACIÓN
   */
  static generateExportOptions(req, reportType) {
    const baseUrl = `${req.protocol}://${req.get("host")}/api/reports/${reportType}`;
    const queryParams = new URLSearchParams(req.query);

    return [
      {
        format: "pdf",
        url: `${baseUrl}?${queryParams.toString()}&format=pdf`,
        method: "GET",
        description: "Documento PDF optimizado para impresión",
      },
      {
        format: "excel",
        url: `${baseUrl}?${queryParams.toString()}&format=excel`,
        method: "GET",
        description: "Archivo Excel con datos tabulares",
      },
      {
        format: "json",
        url: `${baseUrl}?${queryParams.toString()}&format=json`,
        method: "GET",
        description: "JSON estructurado para integraciones",
      },
    ];
  }

  /**
   * ✅ MANEJAR RESPUESTAS DE ERROR
   */
  static handleErrorResponse(error, res, defaultErrorCode) {
    if (error instanceof PermissionError) {
      return res.status(403).json({
        success: false,
        message: error.message,
        error_code: error.code,
      });
    }

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error_code: error.code,
        errors: error.details?.errors,
      });
    }

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
        error_code: error.code,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error_code: defaultErrorCode,
      reference_id: `ERR-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
  }

  // ✅ MÉTODOS AUXILIARES (implementaciones simplificadas)

  static async getTodayStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayMovements = await Inventory.getAllHistory(
      1000,
      0,
      null,
      null,
      today.toISOString(),
      tomorrow.toISOString(),
    );

    return {
      movements: todayMovements.length,
      entries: todayMovements.filter((m) => m.movement_type === "in").length,
      exits: todayMovements.filter((m) => m.movement_type === "out").length,
    };
  }

  static calculateOverviewStats(
    stockReport,
    lowStockProducts,
    expiringProducts,
  ) {
    const totalProducts = stockReport.length;
    const inStockProducts = stockReport.filter(
      (p) => p.current_stock > 0,
    ).length;
    const outOfStockProducts = stockReport.filter(
      (p) => p.current_stock === 0,
    ).length;
    const lowStockCount = lowStockProducts.length;
    const expiringCount = expiringProducts.length;

    const totalStockValue = stockReport.reduce((sum, product) => {
      return sum + product.current_stock * product.price;
    }, 0);

    const totalCostValue = stockReport.reduce((sum, product) => {
      return (
        sum + product.current_stock * (product.cost_price || product.price)
      );
    }, 0);

    return {
      products: {
        total: totalProducts,
        in_stock: inStockProducts,
        out_of_stock: outOfStockProducts,
        low_stock: lowStockCount,
        expiring_soon: expiringCount,
      },
      financial: {
        total_value: totalStockValue,
        total_cost: totalCostValue,
        potential_profit: totalStockValue - totalCostValue,
      },
    };
  }

  static generateDashboardAlerts(
    lowStockProducts,
    expiringProducts,
    stockReport,
  ) {
    return {
      low_stock: lowStockProducts.slice(0, 5),
      expiring: expiringProducts.slice(0, 5),
      out_of_stock: stockReport
        .filter((p) => p.current_stock === 0)
        .slice(0, 5),
    };
  }

  static async getChartData() {
    return {
      stock_distribution: await Inventory.getStockDistribution(),
      movement_trends: await Inventory.getMovementTrends(7),
      category_distribution: await Category.getProductDistribution(),
    };
  }

  static filterDashboardByRole(dashboardData, userRole) {
    if (userRole === "admin" || userRole === "manager") {
      return dashboardData;
    }

    const filtered = { ...dashboardData };
    delete filtered.financial;
    delete filtered.charts;
    delete filtered.recent_activity.user_activity;

    return filtered;
  }

  static generateDashboardQuickActions(req, userRole) {
    if (userRole !== "admin" && userRole !== "manager") {
      return [];
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    return [
      {
        action: "generate_inventory_report",
        url: `${baseUrl}/api/reports/inventory?format=pdf`,
        method: "GET",
        description: "Generar reporte completo",
        icon: "📊",
      },
      {
        action: "view_low_stock",
        url: `${baseUrl}/api/products/low-stock`,
        method: "GET",
        description: "Ver productos con stock bajo",
        icon: "⚠️",
      },
      {
        action: "create_movement",
        url: `${baseUrl}/api/inventory/movements`,
        method: "POST",
        description: "Registrar movimiento",
        icon: "📝",
      },
    ];
  }

  static calculateTypeBreakdown(transactions) {
    const types = ["entry", "exit", "adjustment", "transfer", "reversal"];
    const breakdown = {};

    types.forEach((type) => {
      const typeTransactions = transactions.filter((t) => t.type === type);
      breakdown[type] = {
        count: typeTransactions.length,
        total_quantity: typeTransactions.reduce(
          (sum, t) => sum + t.quantity,
          0,
        ),
        percentage:
          transactions.length > 0
            ? ((typeTransactions.length / transactions.length) * 100).toFixed(
                2,
              ) + "%"
            : "0%",
      };
    });

    return breakdown;
  }

  static async calculateMonetaryAnalysis(transactions) {
    let totalValue = 0;

    for (const transaction of transactions) {
      const product = await Product.findById(transaction.product_id);
      if (product && product.price) {
        totalValue += transaction.quantity * product.price;
      }
    }

    return {
      total_monetary_value: totalValue,
      average_transaction_value:
        transactions.length > 0 ? totalValue / transactions.length : 0,
      value_per_type:
        await ReportController.calculateValuePerType(transactions),
    };
  }

  static async calculateValuePerType(transactions) {
    const types = {};

    for (const transaction of transactions) {
      const product = await Product.findById(transaction.product_id);
      if (product && product.price) {
        if (!types[transaction.type]) {
          types[transaction.type] = 0;
        }
        types[transaction.type] += transaction.quantity * product.price;
      }
    }

    return types;
  }

  static async calculateDailyAverage(transactions, startDate, endDate) {
    if (!startDate || !endDate) return "N/A";

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;

    return (transactions.length / days).toFixed(2);
  }

  static async calculateValueDistribution(transactions) {
    // Implementación simplificada
    return {
      low_value: 0,
      medium_value: 0,
      high_value: 0,
    };
  }

  static async detectMovementAnomalies(movements) {
    // Implementación básica de detección de anomalías
    const anomalies = [];

    // Detectar movimientos inusualmente grandes
    const largeMovements = movements.filter((m) => m.quantity > 1000);
    if (largeMovements.length > 0) {
      anomalies.push({
        type: "large_movements",
        count: largeMovements.length,
        description: "Movimientos con cantidades superiores a 1000 unidades",
      });
    }

    // Detectar múltiples ajustes del mismo producto
    const productAdjustments = {};
    movements.forEach((m) => {
      if (m.movement_type === "adjustment") {
        if (!productAdjustments[m.product_id]) {
          productAdjustments[m.product_id] = 0;
        }
        productAdjustments[m.product_id]++;
      }
    });

    const frequentAdjustments = Object.entries(productAdjustments)
      .filter(([_, count]) => count > 5)
      .map(([productId, count]) => ({
        product_id: productId,
        adjustment_count: count,
        type: "frequent_adjustments",
      }));

    anomalies.push(...frequentAdjustments);

    return anomalies;
  }

  static analyzeMovementTrends(movements) {
    // Análisis básico de tendencias
    const dailyCounts = {};

    movements.forEach((m) => {
      const date = new Date(m.created_at).toISOString().split("T")[0];
      if (!dailyCounts[date]) {
        dailyCounts[date] = { entries: 0, exits: 0, adjustments: 0, total: 0 };
      }

      dailyCounts[date][m.movement_type] =
        (dailyCounts[date][m.movement_type] || 0) + 1;
      dailyCounts[date].total++;
    });

    const dailyTrends = Object.entries(dailyCounts)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      daily_trends: dailyTrends,
      average_daily_movements:
        movements.length > 0 ? movements.length / (dailyTrends.length || 1) : 0,
      trend_direction:
        dailyTrends.length > 1
          ? dailyTrends[dailyTrends.length - 1].total > dailyTrends[0].total
            ? "up"
            : "down"
          : "stable",
    };
  }

  static async findBusiestPeriod(movements) {
    if (movements.length === 0) return null;

    const hourlyCounts = Array(24).fill(0);

    movements.forEach((m) => {
      const hour = new Date(m.created_at).getHours();
      hourlyCounts[hour]++;
    });

    const maxCount = Math.max(...hourlyCounts);
    const busiestHour = hourlyCounts.indexOf(maxCount);

    return {
      hour: busiestHour,
      count: maxCount,
      formatted_hour: `${busiestHour}:00 - ${busiestHour + 1}:00`,
    };
  }

  static async analyzeSeasonalPatterns(movements) {
    // Análisis básico de patrones estacionales
    const monthlyCounts = Array(12).fill(0);

    movements.forEach((m) => {
      const month = new Date(m.created_at).getMonth();
      monthlyCounts[month]++;
    });

    return monthlyCounts.map((count, month) => ({
      month: month + 1,
      month_name: new Date(2000, month, 1).toLocaleString("es", {
        month: "long",
      }),
      movement_count: count,
    }));
  }

  static async analyzeProductsByMovement(movements) {
    const productAnalysis = {};

    movements.forEach((m) => {
      if (!productAnalysis[m.product_id]) {
        productAnalysis[m.product_id] = {
          product_id: m.product_id,
          product_name: m.product_name,
          total_movements: 0,
          entry_count: 0,
          exit_count: 0,
          adjustment_count: 0,
          total_quantity: 0,
        };
      }

      productAnalysis[m.product_id].total_movements++;
      productAnalysis[m.product_id][`${m.movement_type}_count`]++;
      productAnalysis[m.product_id].total_quantity += m.quantity;
    });

    return Object.values(productAnalysis)
      .sort((a, b) => b.total_movements - a.total_movements)
      .slice(0, 10);
  }

  static async analyzeUsersByMovement(movements) {
    const userAnalysis = {};

    movements.forEach((m) => {
      if (m.created_by) {
        if (!userAnalysis[m.created_by]) {
          userAnalysis[m.created_by] = {
            user_id: m.created_by,
            user_name: m.created_by_name || `Usuario ${m.created_by}`,
            total_movements: 0,
            entry_count: 0,
            exit_count: 0,
            adjustment_count: 0,
          };
        }

        userAnalysis[m.created_by].total_movements++;
        userAnalysis[m.created_by][`${m.movement_type}_count`]++;
      }
    });

    return Object.values(userAnalysis)
      .sort((a, b) => b.total_movements - a.total_movements)
      .slice(0, 10);
  }
}

// ✅ EXPORTAR CONTROLADOR COMPLETO
module.exports = {
  // Métodos principales
  generateInventoryReport:
    ReportController.generateInventoryReport.bind(ReportController),
  generateMovementReport:
    ReportController.generateMovementReport.bind(ReportController),
  generateTransactionReport:
    ReportController.generateTransactionReport.bind(ReportController),
  getDashboardStats: ReportController.getDashboardStats.bind(ReportController),

  // Métodos auxiliares para uso interno
  _validateDateRange: ReportController.validateDateRange,
  _checkReportPermissions: ReportController.checkReportPermissions,
  _generateReportId: ReportController.generateReportId,
  _logReportGeneration: ReportController.logReportGeneration,

  // Clase completa para testing
  ReportController,
};
