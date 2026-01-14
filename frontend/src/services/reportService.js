import { get, post, downloadFile, requestWithRetry, clearCache } from "./api";
import notificationService from "./notificationService";

// ✅ MEJORA: Sistema de cache para reportes
const createReportCache = () => {
  const cache = new Map();
  const pendingGenerations = new Map();

  return {
    get: (key) => {
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }
      cache.delete(key);
      return null;
    },

    set: (key, data, ttl = 15 * 60 * 1000) => {
      cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
      });
    },

    delete: (key) => {
      cache.delete(key);
    },

    clear: (pattern = null) => {
      if (pattern) {
        for (const key of cache.keys()) {
          if (key.includes(pattern)) {
            cache.delete(key);
          }
        }
      } else {
        cache.clear();
        pendingGenerations.clear();
      }
    },

    hasPending: (key) => pendingGenerations.has(key),

    setPending: (key, promise) => {
      pendingGenerations.set(key, promise);
    },

    getPending: (key) => pendingGenerations.get(key),

    deletePending: (key) => {
      pendingGenerations.delete(key);
    },
  };
};

const reportCache = createReportCache();

// ✅ MEJORA: Validación de parámetros de reporte
const validateReportParams = (params, reportType) => {
  const errors = [];
  const warnings = [];

  // Validaciones comunes de fechas
  if (params.startDate || params.endDate) {
    const start = params.startDate ? new Date(params.startDate) : null;
    const end = params.endDate ? new Date(params.endDate) : null;

    if (start && isNaN(start.getTime())) {
      errors.push("Fecha de inicio inválida");
    }

    if (end && isNaN(end.getTime())) {
      errors.push("Fecha de fin inválida");
    }

    if (start && end && start > end) {
      errors.push("La fecha de inicio no puede ser mayor a la fecha de fin");
    }

    // Validar rango máximo (2 años)
    if (start && end) {
      const twoYears = 2 * 365 * 24 * 60 * 60 * 1000;
      if (end - start > twoYears) {
        warnings.push(
          "El rango de fechas es muy amplio (máximo recomendado: 2 años)"
        );
      }
    }

    // Validar que no sea fecha futura
    const now = new Date();
    if (end && end > now) {
      warnings.push("La fecha de fin es futura");
    }
  }

  // Validaciones específicas por tipo de reporte
  switch (reportType) {
    case "inventory":
      // Validaciones para reporte de inventario
      if (params.category_id && isNaN(parseInt(params.category_id))) {
        errors.push("ID de categoría inválido");
      }
      break;

    case "movements":
      // Validaciones para reporte de movimientos
      if (params.product_id && isNaN(parseInt(params.product_id))) {
        errors.push("ID de producto inválido");
      }

      if (
        params.movement_type &&
        !["in", "out", "adjustment", "all"].includes(params.movement_type)
      ) {
        errors.push("Tipo de movimiento inválido");
      }
      break;

    case "transactions":
      // Validaciones para reporte de transacciones
      if (
        params.type &&
        !["entry", "exit", "adjustment", "all"].includes(params.type)
      ) {
        errors.push("Tipo de transacción inválido");
      }

      if (
        params.min_amount &&
        (isNaN(parseFloat(params.min_amount)) ||
          parseFloat(params.min_amount) < 0)
      ) {
        errors.push("Monto mínimo inválido");
      }
      break;

    case "trends":
      // Validaciones para reporte de tendencias
      if (
        params.days &&
        (isNaN(parseInt(params.days)) ||
          parseInt(params.days) < 1 ||
          parseInt(params.days) > 365)
      ) {
        errors.push("Días inválidos (1-365)");
      }
      break;
  }

  // Validar formato de salida
  if (
    params.format &&
    !["json", "csv", "excel", "pdf"].includes(params.format)
  ) {
    errors.push("Formato inválido. Use: json, csv, excel o pdf");
  }

  // Validar límites de paginación
  if (
    params.limit &&
    (isNaN(parseInt(params.limit)) ||
      parseInt(params.limit) < 1 ||
      parseInt(params.limit) > 10000)
  ) {
    warnings.push("Límite fuera de rango recomendado (1-10000)");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * ✅ SERVICIO DE REPORTES COMPLETO
 */
export const reportService = {
  /**
   * Generar reporte de inventario
   */
  generateInventoryReport: async (
    format = "json",
    email = false,
    params = {}
  ) => {
    try {
      // Validar parámetros
      const validation = validateReportParams(params, "inventory");
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      // Mostrar warnings
      if (validation.warnings.length > 0) {
        validation.warnings.forEach((warning) => {
          notificationService.warning(warning);
        });
      }

      const queryParams = { format, ...params };
      if (email) queryParams.email = true;

      const cacheKey = `report_inventory_${format}_${JSON.stringify(queryParams)}`;

      // ✅ MEJORA: Evitar generaciones duplicadas
      if (reportCache.hasPending(cacheKey)) {
        return await reportCache.getPending(cacheKey);
      }

      // Para formato JSON, intentar cache
      if (format === "json") {
        const cached = reportCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Crear promise para evitar duplicados
      const promise = (async () => {
        try {
          if (format === "pdf" || format === "excel" || format === "csv") {
            // Generar nombre de archivo descriptivo
            const date = new Date().toISOString().split("T")[0];
            const categoryPart = params.category_id
              ? `_cat${params.category_id}`
              : "";
            const filename = `reporte-inventario${categoryPart}_${date}.${format}`;

            await downloadFile("/reports/inventory", filename, {
              params: queryParams,
            });
            return {
              success: true,
              message: "Reporte descargado exitosamente",
              filename,
              format,
            };
          }

          const response = await get("/reports/inventory", queryParams);

          // Guardar en cache si es JSON
          if (format === "json" && response.success) {
            reportCache.set(cacheKey, response);
          }

          return response;
        } finally {
          reportCache.deletePending(cacheKey);
        }
      })();

      reportCache.setPending(cacheKey, promise);
      return await promise;
    } catch (error) {
      reportCache.deletePending(cacheKey);
      throw error;
    }
  },

  /**
   * Generar reporte de movimientos
   */
  generateMovementReport: async (params = {}) => {
    try {
      const { format = "json", email = false, ...queryParams } = params;

      // Validar parámetros
      const validation = validateReportParams(queryParams, "movements");
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      const cacheKey = `report_movements_${format}_${JSON.stringify(queryParams)}`;

      if (format === "pdf" || format === "excel" || format === "csv") {
        const date = new Date().toISOString().split("T")[0];
        const startDate = queryParams.start_date || "todo";
        const endDate = queryParams.end_date || "hoy";
        const productPart = queryParams.product_id
          ? `_prod${queryParams.product_id}`
          : "";
        const filename = `reporte-movimientos${productPart}_${startDate}-${endDate}_${date}.${format}`;

        await downloadFile("/reports/movements", filename, {
          params: { format, email, ...queryParams },
        });
        return {
          success: true,
          message: "Reporte descargado exitosamente",
          filename,
          format,
        };
      }

      // Para JSON, intentar cache
      if (format === "json") {
        const cached = reportCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get("/reports/movements", queryParams);

      if (format === "json" && response.success) {
        reportCache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Generar reporte de transacciones
   */
  generateTransactionReport: async (params = {}) => {
    try {
      const { format = "json", email = false, ...queryParams } = params;

      // Validar parámetros
      const validation = validateReportParams(queryParams, "transactions");
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      const cacheKey = `report_transactions_${format}_${JSON.stringify(queryParams)}`;

      if (format === "pdf" || format === "excel" || format === "csv") {
        const date = new Date().toISOString().split("T")[0];
        const type = queryParams.type || "todas";
        const amountPart = queryParams.min_amount
          ? `_min${queryParams.min_amount}`
          : "";
        const filename = `reporte-transacciones_${type}${amountPart}_${date}.${format}`;

        await downloadFile("/reports/transactions", filename, {
          params: { format, email, ...queryParams },
        });
        return {
          success: true,
          message: "Reporte descargado exitosamente",
          filename,
          format,
        };
      }

      // Para JSON, intentar cache
      if (format === "json") {
        const cached = reportCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get("/reports/transactions", queryParams);

      if (format === "json" && response.success) {
        reportCache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener estadísticas del dashboard
   */
  getDashboardStats: async (useCache = true) => {
    try {
      const cacheKey = "dashboard_stats";

      if (useCache) {
        const cached = reportCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get("/reports/dashboard");

      if (useCache && response.success) {
        // TTL corto para dashboard (1 minuto)
        reportCache.set(cacheKey, response, 60 * 1000);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Exportar datos a CSV
   */
  exportToCSV: async (data, filename, options = {}) => {
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("No hay datos para exportar");
      }

      // ✅ CORRECCIÓN: Verificar window antes de usar
      if (typeof window === "undefined") {
        throw new Error("No se puede exportar en este entorno");
      }

      const {
        delimiter = ",",
        includeHeaders = true,
        customHeaders = null,
        dateFormat = "iso",
      } = options;

      // Determinar headers
      let headers;
      if (customHeaders && Array.isArray(customHeaders)) {
        headers = customHeaders;
      } else {
        // Obtener todas las keys únicas de todos los objetos
        const allKeys = new Set();
        data.forEach((row) => {
          if (row && typeof row === "object") {
            Object.keys(row).forEach((key) => allKeys.add(key));
          }
        });
        headers = Array.from(allKeys);
      }

      // Función para formatear valores
      const formatValue = (value) => {
        if (value === null || value === undefined) {
          return "";
        }

        // Manejar fechas
        if (value instanceof Date) {
          if (dateFormat === "iso") {
            return value.toISOString();
          } else if (dateFormat === "local") {
            return value.toLocaleString();
          } else {
            return value.toISOString().split("T")[0]; // Solo fecha
          }
        }

        // Manejar objetos (convertir a JSON string)
        if (typeof value === "object") {
          try {
            return JSON.stringify(value);
          } catch {
            return "[Object]";
          }
        }

        // Convertir a string y escapar caracteres especiales
        let stringValue = String(value);

        // Escapar comillas, delimitadores y saltos de línea
        if (
          stringValue.includes(delimiter) ||
          stringValue.includes('"') ||
          stringValue.includes("\n") ||
          stringValue.includes("\r")
        ) {
          stringValue = `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      };

      // Crear filas
      const rows = data.map((row) => {
        return headers
          .map((header) => {
            const value = row ? row[header] : undefined;
            return formatValue(value);
          })
          .join(delimiter);
      });

      // Construir contenido CSV
      let csvContent = "";
      if (includeHeaders) {
        csvContent += headers.join(delimiter) + "\n";
      }
      csvContent += rows.join("\n");

      // Crear y descargar archivo
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.csv`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        filename: `${filename}.csv`,
        rows: data.length,
        columns: headers.length,
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Exportar datos a Excel
   */
  exportToExcel: async (data, filename, sheetName = "Datos", options = {}) => {
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("No hay datos para exportar");
      }

      // ✅ CORRECCIÓN: Verificar window antes de usar
      if (typeof window === "undefined") {
        throw new Error("No se puede exportar en este entorno");
      }

      // Verificar si la librería xlsx está disponible
      if (window.XLSX) {
        const XLSX = window.XLSX;

        // Opciones de formato
        const {
          dateFormat = "yyyy-mm-dd",
          headerStyle = {},
          cellStyle = {},
        } = options;

        // Convertir datos a worksheet
        const worksheet = XLSX.utils.json_to_sheet(data, {
          dateNF: dateFormat,
          cellDates: true,
        });

        // Aplicar estilos si se proporcionan
        if (
          Object.keys(headerStyle).length > 0 ||
          Object.keys(cellStyle).length > 0
        ) {
          const range = XLSX.utils.decode_range(worksheet["!ref"]);

          // Aplicar estilo a headers (fila 1)
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_cell({ r: 0, c: C });
            if (!worksheet[address]) continue;

            worksheet[address].s = {
              ...worksheet[address].s,
              ...headerStyle,
              font: { bold: true, ...headerStyle.font },
            };
          }

          // Aplicar estilo a celdas de datos
          for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
              const address = XLSX.utils.encode_cell({ r: R, c: C });
              if (!worksheet[address]) continue;

              worksheet[address].s = {
                ...worksheet[address].s,
                ...cellStyle,
              };
            }
          }
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // Generar archivo
        XLSX.writeFile(workbook, `${filename}.xlsx`);
        return {
          success: true,
          filename: `${filename}.xlsx`,
          sheetName,
          rows: data.length,
        };
      } else {
        // Fallback a CSV si no hay soporte para Excel
        notificationService.info("Exportando a CSV en lugar de Excel");
        return await this.exportToCSV(data, filename, options);
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Enviar reporte por email
   */
  sendReportByEmail: async (reportType, params = {}) => {
    try {
      const endpoint = `/reports/${reportType}`;

      // Validar que haya email en params o en usuario actual
      if (!params.email) {
        // Intentar obtener email del usuario actual
        const userStr = localStorage.getItem("inventory_qr_user");
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user.email) {
              params.email = user.email;
            }
          } catch (e) {
            // Ignorar error
          }
        }
      }

      if (!params.email) {
        throw new Error(
          "Se requiere dirección de email para enviar el reporte"
        );
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(params.email)) {
        throw new Error("Dirección de email inválida");
      }

      notificationService.loading("Enviando reporte por email...");

      try {
        const response = await get(endpoint, {
          ...params,
          email: true,
          format: "pdf",
        });

        notificationService.dismissLoading();

        if (response.success) {
          notificationService.success(`Reporte enviado a ${params.email}`);
        }

        return response;
      } catch (error) {
        notificationService.dismissLoading();
        throw error;
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener tendencias de inventario
   */
  getInventoryTrends: async (days = 30, productId = null) => {
    try {
      const params = { days };
      if (productId) params.product_id = productId;

      // Validar parámetros
      const validation = validateReportParams(params, "trends");
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      const cacheKey = `report_trends_${days}_${productId || "all"}`;
      const cached = reportCache.get(cacheKey);

      if (cached) {
        return cached;
      }

      const response = await get("/reports/trends", params);

      if (response.success) {
        reportCache.set(cacheKey, response, 5 * 60 * 1000);
      }

      return response;
    } catch (error) {
      // Si el endpoint no existe, usar el servicio de inventario
      try {
        const inventoryService = await import("./inventoryService");
        return await inventoryService.default.getTrends(days, productId);
      } catch (importError) {
        throw error;
      }
    }
  },

  /**
   * Generar reporte personalizado
   */
  generateCustomReport: async (reportData, format = "json", options = {}) => {
    try {
      if (!reportData || !Array.isArray(reportData)) {
        throw new Error("Datos del reporte no válidos");
      }

      const {
        filename = "reporte-personalizado",
        title = "Reporte Personalizado",
        columns = null,
        ...queryParams
      } = options;

      if (format === "pdf") {
        notificationService.info("Generando reporte personalizado...");

        // Verificar window antes de continuar
        if (typeof globalThis.window === "undefined") {
          throw new Error("No se puede generar PDF en este entorno");
        }

        // Crear PDF simple usando jsPDF si está disponible
        if (globalThis.jspdf) {
          const { jsPDF } = globalThis.jspdf;
          const doc = new jsPDF();

          // Agregar título
          doc.setFontSize(16);
          doc.text(title, 20, 20);

          // Agregar fecha de generación
          doc.setFontSize(10);
          doc.text(`Generado: ${new Date().toLocaleDateString()}`, 20, 30);
          doc.text(`Total de registros: ${reportData.length}`, 20, 40);

          // Agregar tabla (simplificada)
          let yPosition = 60;
          const pageHeight = doc.internal.pageSize.height;

          // Encabezados de tabla
          const headers =
            columns || (reportData[0] ? Object.keys(reportData[0]) : []);
          const colWidth = 180 / Math.max(headers.length, 1);

          doc.setFontSize(12);
          doc.setFont(undefined, "bold");

          headers.forEach((header, index) => {
            doc.text(header.toString(), 20 + index * colWidth, yPosition);
          });

          yPosition += 10;
          doc.setFont(undefined, "normal");
          doc.setFontSize(10);

          // Filas de datos
          reportData.forEach((row, rowIndex) => {
            // Verificar si necesitamos nueva página
            if (yPosition > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
            }

            headers.forEach((header, colIndex) => {
              const value = row?.[header]?.toString() ?? "";
              // Truncar si es muy largo
              const displayValue =
                value.length > 20 ? value.slice(0, 17) + "..." : value;
              doc.text(displayValue, 20 + colIndex * colWidth, yPosition);
            });

            yPosition += 8;
          });

          // Descargar
          doc.save(`${filename}.pdf`);

          notificationService.dismissLoading();
          return {
            success: true,
            message: "Reporte generado exitosamente",
            filename: `${filename}.pdf`,
            format: "pdf",
          };
        } else {
          // Fallback a CSV
          notificationService.dismissLoading();
          return await this.exportToCSV(reportData, filename, {
            customHeaders: columns,
          });
        }
      }

      // Para JSON, simplemente retornar los datos estructurados
      return {
        success: true,
        data: reportData,
        metadata: {
          generated: new Date().toISOString(),
          recordCount: reportData.length,
          format: "json",
          title,
          columns: columns || (reportData[0] ? Object.keys(reportData[0]) : []),
        },
      };
    } catch (error) {
      notificationService.dismissLoading();
      throw error;
    }
  },

  /**
   * Obtener métricas de performance
   */
  getPerformanceMetrics: async (startDate, endDate) => {
    const params = { startDate, endDate };

    // Validar parámetros
    const validation = validateReportParams(params, "trends");
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    const response = await get("/reports/performance", params);
    return response;
  },

  /**
   * ✅ MEJORA: Programar reporte recurrente
   */
  scheduleReport: async (reportType, schedule, params = {}) => {
    if (!schedule?.frequency) {
      throw new Error("Se requiere frecuencia para programar el reporte");
    }

    const validFrequencies = ["daily", "weekly", "monthly"];
    if (!validFrequencies.includes(schedule.frequency)) {
      throw new Error(
        `Frecuencia inválida. Use: ${validFrequencies.join(", ")}`
      );
    }

    if (!params.email) {
      throw new Error("Se requiere email para reportes programados");
    }

    const response = await post("/reports/schedule", {
      report_type: reportType,
      schedule,
      params,
    });

    if (response.success) {
      notificationService.success("Reporte programado exitosamente");
    }

    return response;
  },

  /**
   * ✅ MEJORA: Obtener reportes programados
   */
  getScheduledReports: async () => {
    const response = await get("/reports/scheduled");
    return response;
  },

  /**
   * Limpiar caché de reportes
   */
  clearCache: () => {
    reportCache.clear();
    clearCache("reports");
  },

  /**
   * Validar parámetros de reporte
   */
  validateReportParams: (params, reportType) => {
    return validateReportParams(params, reportType);
  },
};

export default reportService;