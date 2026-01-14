const logger = require("./logger");

/**
 * ✅ HELPER DE RESPUESTAS HTTP MEJORADO
 * Correcciones aplicadas:
 * 1. Corregido error en validationError (faltaba el parámetro 'errors')
 * 2. Mejorada estructura de funciones helper
 * 3. Agregado soporte para metadata adicional
 */

const responseHelper = {
  // ✅ Respuesta exitosa estándar con mejor manejo de datos
  success: (
    res,
    data = null,
    message = "Operación exitosa",
    statusCode = 200,
    meta = {},
  ) => {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      ...meta,
    };

    // ✅ CORRECCIÓN: Manejo mejorado de paginación
    if (data && data.pagination) {
      response.pagination = data.pagination;
      response.data = data.data || data;

      // ✅ MEJORA: Headers para paginación con validación
      if (res && typeof res.setHeader === "function") {
        const pagination = data.pagination;

        if (pagination.total !== undefined) {
          res.setHeader("X-Total-Count", pagination.total);
        }
        if (pagination.totalPages !== undefined) {
          res.setHeader("X-Total-Pages", pagination.totalPages);
        }
        if (pagination.page !== undefined) {
          res.setHeader("X-Current-Page", pagination.page);
        }
        if (pagination.limit !== undefined) {
          res.setHeader("X-Per-Page", pagination.limit);
        }
        if (pagination.hasNext !== undefined) {
          res.setHeader("X-Has-Next", pagination.hasNext);
        }
        if (pagination.hasPrev !== undefined) {
          res.setHeader("X-Has-Prev", pagination.hasPrev);
        }
      }
    }

    return res.status(statusCode).json(response);
  },

  // ✅ Respuesta de creación exitosa
  created: (res, data = null, message = "Registro creado exitosamente") => {
    return responseHelper.success(res, data, message, 201);
  },

  // ✅ Respuesta de actualización exitosa
  updated: (
    res,
    data = null,
    message = "Registro actualizado exitosamente",
  ) => {
    return responseHelper.success(res, data, message, 200);
  },

  // ✅ Respuesta de eliminación exitosa
  deleted: (res, message = "Registro eliminado exitosamente", data = null) => {
    return responseHelper.success(res, data, message, 200);
  },

  // ✅ Respuesta de error mejorada
  error: (
    res,
    message = "Error en la operación",
    statusCode = 400,
    error = null,
    code = null,
    errors = null,
  ) => {
    const response = {
      success: false,
      message,
      code: code || "ERROR",
      timestamp: new Date().toISOString(),
    };

    // ✅ CORRECCIÓN: Agregar errores de validación si existen
    if (errors) {
      response.errors = errors;
    }

    // ✅ MEJORA: Log del error con más contexto
    if (error) {
      const logData = {
        statusCode,
        code,
        message: error.message,
      };

      // Clasificar nivel de log según status code
      if (statusCode >= 500) {
        logger.error(message, { ...logData, stack: error.stack });
      } else if (statusCode >= 400) {
        logger.warn(message, logData);
      }

      // ✅ MEJORA: Mostrar detalles del error según entorno
      const isDevelopment = process.env.NODE_ENV === "development";
      const isStaging = process.env.NODE_ENV === "staging";

      if (isDevelopment || isStaging) {
        response.error = {
          message: error.message,
          ...(isDevelopment && { stack: error.stack }),
          ...(error.code && { code: error.code }),
        };
      }
    } else if (statusCode >= 400) {
      // Log de errores sin objeto error
      logger.warn(message, { statusCode, code });
    }

    return res.status(statusCode).json(response);
  },

  // ✅ CORRECCIÓN: Respuesta de validación (error de parámetros corregido)
  validationError: (res, errors, message = "Error de validación") => {
    return responseHelper.error(
      res,
      message,
      400,
      null,
      "VALIDATION_ERROR",
      errors,
    );
  },

  // ✅ Respuesta no autorizada
  unauthorized: (res, message = "No autorizado") => {
    return responseHelper.error(res, message, 401, null, "UNAUTHORIZED");
  },

  // ✅ Respuesta prohibida
  forbidden: (res, message = "Acceso prohibido") => {
    return responseHelper.error(res, message, 403, null, "FORBIDDEN");
  },

  // ✅ Respuesta no encontrada
  notFound: (res, message = "Recurso no encontrado") => {
    return responseHelper.error(res, message, 404, null, "NOT_FOUND");
  },

  // ✅ Respuesta de conflicto
  conflict: (res, message = "Conflicto en la operación") => {
    return responseHelper.error(res, message, 409, null, "CONFLICT");
  },

  // ✅ Respuesta de error interno
  internalError: (
    res,
    error = null,
    message = "Error interno del servidor",
  ) => {
    return responseHelper.error(res, message, 500, error, "INTERNAL_ERROR");
  },

  // ✅ Respuesta de servicio no disponible
  serviceUnavailable: (
    res,
    message = "Servicio temporalmente no disponible",
  ) => {
    return responseHelper.error(res, message, 503, null, "SERVICE_UNAVAILABLE");
  },

  // ✅ Respuesta con paginación mejorada
  paginated: (
    res,
    data,
    pagination,
    message = "Datos obtenidos exitosamente",
  ) => {
    return responseHelper.success(
      res,
      {
        data,
        pagination,
      },
      message,
      200,
    );
  },

  // ✅ Respuesta con archivo mejorada
  file: (res, filePath, filename, contentType = "application/octet-stream") => {
    try {
      // ✅ MEJORA: Setear headers de archivo
      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(filename)}"`,
      );
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      return res.download(filePath, filename, (err) => {
        if (err) {
          logger.error("Error enviando archivo", {
            filePath,
            filename,
            error: err.message,
          });

          // Si el cliente canceló la descarga, no es un error real
          if (err.code !== "ECONNABORTED" && err.code !== "ECONNRESET") {
            responseHelper.internalError(
              res,
              err,
              "Error al descargar el archivo",
            );
          }
        } else {
          logger.debug("Archivo enviado exitosamente", { filename, filePath });
        }
      });
    } catch (error) {
      logger.error("Error preparando descarga de archivo", error);
      return responseHelper.internalError(
        res,
        error,
        "Error procesando archivo",
      );
    }
  },

  // ✅ Respuesta JSON directa
  json: (res, data, statusCode = 200) => {
    return res.status(statusCode).json(data);
  },

  // ✅ Respuesta sin contenido
  noContent: (res) => {
    return res.status(204).send();
  },

  // ✅ Helper para construir respuesta de paginación
  buildPagination: (data, page, limit, total) => {
    const currentPage = parseInt(page) || 1;
    const pageLimit = parseInt(limit) || 10;
    const totalItems = parseInt(total) || 0;
    const totalPages = Math.ceil(totalItems / pageLimit);

    return {
      data,
      pagination: {
        page: currentPage,
        limit: pageLimit,
        total: totalItems,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
        prevPage: currentPage > 1 ? currentPage - 1 : null,
      },
    };
  },

  // ✅ NUEVO: Respuesta para operaciones en lote
  batchOperation: (res, results, message = "Operación en lote completada") => {
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return responseHelper.success(
      res,
      {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        results,
      },
      message,
      200,
    );
  },

  // ✅ NUEVO: Respuesta con metadata
  withMetadata: (
    res,
    data,
    metadata,
    message = "Operación exitosa",
    statusCode = 200,
  ) => {
    return responseHelper.success(res, data, message, statusCode, metadata);
  },
};

module.exports = responseHelper;
