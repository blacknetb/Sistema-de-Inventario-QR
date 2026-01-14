const ExcelJS = require("exceljs");
const csv = require("csv-stringify");
const { promisify } = require("util");
const fs = require("fs").promises;
const path = require("path");
const logger = require("../utils/logger");
const config = require("../config/env");

// ✅ CORRECCIÓN: Convertir csv-stringify a promesa
const csvStringify = promisify(csv);

class ExportService {
  constructor() {
    this.exportsDir = config.uploads?.exportsDir || "./exports";
    this.tempDir = config.uploads?.tempDir || "./exports/temp";
    this.maxFileAgeDays = config.exports?.maxFileAgeDays || 7;
    this.initialize();
  }

  // ✅ CORRECCIÓN: Inicialización asíncrona
  async initialize() {
    try {
      await this.ensureDirectories();
      logger.info("Export service initialized");
    } catch (error) {
      logger.error("Error initializing export service:", error);
      throw error;
    }
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.exportsDir, { recursive: true });
      await fs.mkdir(this.tempDir, { recursive: true });
      await fs.mkdir(path.join(this.exportsDir, "reports"), {
        recursive: true,
      });
      await fs.mkdir(path.join(this.exportsDir, "backups"), {
        recursive: true,
      });
    } catch (error) {
      logger.error("Error creating export directories:", error);
      throw error;
    }
  }

  // ✅ CORRECCIÓN: Método de exportación de productos mejorado
  async exportProducts(products, options = {}) {
    try {
      const {
        format = "excel",
        includeImages = false,
        includeAllFields = false,
        groupByCategory = false,
        language = "es",
      } = options;

      const timestamp = Date.now();
      let filename, filePath, result;

      switch (format.toLowerCase()) {
        case "excel":
          result = await this.exportProductsToExcel(products, {
            includeAllFields,
            groupByCategory,
            language,
            timestamp,
          });
          break;

        case "csv":
          result = await this.exportProductsToCSV(products, {
            includeAllFields,
            language,
            timestamp,
          });
          break;

        case "json":
          result = await this.exportProductsToJSON(products, {
            includeAllFields,
            timestamp,
          });
          break;

        default:
          throw new Error(`Formato no soportado: ${format}`);
      }

      logger.info("Products exported successfully", {
        filePath: result.path,
        productCount: products.length,
        format,
        size: result.size,
      });

      return result;
    } catch (error) {
      logger.error("Error exporting products:", error);
      throw error;
    }
  }

  // ✅ CORRECCIÓN: Exportar a Excel con manejo mejorado
  async exportProductsToExcel(products, options = {}) {
    const {
      includeAllFields = false,
      groupByCategory = false,
      language = "es",
      timestamp,
    } = options;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Inventory QR System";
    workbook.lastModifiedBy = "System";
    workbook.created = new Date();
    workbook.modified = new Date();

    if (groupByCategory && products.length > 0) {
      // Agrupar por categoría
      const categories = {};
      products.forEach((product) => {
        const category = product.category_name || "Sin Categoría";
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(product);
      });

      // Crear hoja por categoría
      Object.keys(categories).forEach((category) => {
        const worksheet = workbook.addWorksheet(
          this.sanitizeSheetName(category),
        );
        this.addProductsToWorksheet(
          worksheet,
          categories[category],
          includeAllFields,
          language,
        );
        this.applyWorksheetStyles(worksheet);
      });
    } else {
      const worksheet = workbook.addWorksheet("Productos");
      this.addProductsToWorksheet(
        worksheet,
        products,
        includeAllFields,
        language,
      );
      this.applyWorksheetStyles(worksheet);
    }

    const filename = `productos_${timestamp}.xlsx`;
    const filePath = path.join(this.exportsDir, filename);

    await workbook.xlsx.writeFile(filePath);
    const stats = await fs.stat(filePath);

    return {
      path: filePath,
      url: `${config.app.url}/exports/${filename}`,
      filename,
      size: stats.size,
      productCount: products.length,
    };
  }

  // ✅ CORRECCIÓN: Exportar a CSV con formato correcto
  async exportProductsToCSV(products, options = {}) {
    const { includeAllFields = false, language = "es", timestamp } = options;

    const headers = this.getProductHeaders(language, includeAllFields);
    const rows = [];

    // Agregar datos
    products.forEach((product) => {
      const row = headers.map((header) => {
        const value = this.getProductValue(product, header.key, language);
        return this.formatCSVValue(value);
      });
      rows.push(row);
    });

    // Agregar encabezados
    const headerRow = headers.map((h) => h.title);
    rows.unshift(headerRow);

    const csvData = await csvStringify(rows, {
      delimiter: ",",
      quoted: true,
      quoted_empty: true,
    });

    const filename = `productos_${timestamp}.csv`;
    const filePath = path.join(this.exportsDir, filename);
    await fs.writeFile(filePath, csvData, "utf8");
    const stats = await fs.stat(filePath);

    return {
      path: filePath,
      url: `${config.app.url}/exports/${filename}`,
      filename,
      size: stats.size,
      productCount: products.length,
    };
  }

  // ✅ CORRECCIÓN: Exportar a JSON
  async exportProductsToJSON(products, options = {}) {
    const { includeAllFields = false, timestamp } = options;

    // Filtrar campos si no se incluyen todos
    const exportProducts = includeAllFields
      ? products
      : products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          category_name: p.category_name,
          current_stock: p.current_stock,
          min_stock: p.min_stock,
          price: p.price,
          cost: p.cost,
          status: p.status,
        }));

    const jsonData = JSON.stringify(exportProducts, null, 2);
    const filename = `productos_${timestamp}.json`;
    const filePath = path.join(this.exportsDir, filename);

    await fs.writeFile(filePath, jsonData, "utf8");
    const stats = await fs.stat(filePath);

    return {
      path: filePath,
      url: `${config.app.url}/exports/${filename}`,
      filename,
      size: stats.size,
      productCount: products.length,
    };
  }

  // ✅ CORRECCIÓN: Métodos auxiliares mejorados
  addProductsToWorksheet(worksheet, products, includeAllFields, language) {
    const headers = this.getProductHeaders(language, includeAllFields);

    // ✅ CORRECCIÓN: Agregar encabezados correctamente
    worksheet.addRow(headers.map((h) => h.title));

    // ✅ CORRECCIÓN: Agregar datos
    products.forEach((product) => {
      const row = headers.map((header) => {
        const value = this.getProductValue(product, header.key, language);
        return this.formatExcelValue(value, header.type);
      });
      worksheet.addRow(row);
    });

    // ✅ CORRECCIÓN: Ajustar ancho de columnas
    worksheet.columns = headers.map((header) => ({
      width: header.width || 15,
      alignment: header.alignment || { vertical: "middle", horizontal: "left" },
    }));
  }

  getProductHeaders(language, includeAll) {
    const baseHeaders = [
      {
        key: "name",
        title: language === "es" ? "Nombre" : "Name",
        width: 30,
        type: "string",
      },
      { key: "sku", title: "SKU", width: 15, type: "string" },
      {
        key: "category_name",
        title: language === "es" ? "Categoría" : "Category",
        width: 20,
        type: "string",
      },
      {
        key: "current_stock",
        title: language === "es" ? "Stock Actual" : "Current Stock",
        width: 12,
        type: "number",
      },
      {
        key: "min_stock",
        title: language === "es" ? "Stock Mínimo" : "Minimum Stock",
        width: 12,
        type: "number",
      },
      {
        key: "price",
        title: language === "es" ? "Precio" : "Price",
        width: 12,
        type: "currency",
      },
      {
        key: "cost",
        title: language === "es" ? "Costo" : "Cost",
        width: 12,
        type: "currency",
      },
      {
        key: "status",
        title: language === "es" ? "Estado" : "Status",
        width: 12,
        type: "string",
      },
    ];

    if (includeAll) {
      baseHeaders.push(
        {
          key: "description",
          title: language === "es" ? "Descripción" : "Description",
          width: 40,
          type: "string",
        },
        {
          key: "barcode",
          title: "Código de Barras",
          width: 20,
          type: "string",
        },
        {
          key: "weight",
          title: language === "es" ? "Peso" : "Weight",
          width: 10,
          type: "number",
        },
        {
          key: "dimensions",
          title: language === "es" ? "Dimensiones" : "Dimensions",
          width: 15,
          type: "string",
        },
        {
          key: "created_at",
          title: language === "es" ? "Creado" : "Created",
          width: 15,
          type: "date",
        },
        {
          key: "updated_at",
          title: language === "es" ? "Actualizado" : "Updated",
          width: 15,
          type: "date",
        },
      );
    }

    return baseHeaders;
  }

  getProductValue(product, key, language) {
    const value = product[key];

    switch (key) {
      case "status":
        return this.getProductStatusText(value, language);
      case "price":
      case "cost":
        return value ? parseFloat(value) : 0;
      case "current_stock":
      case "min_stock":
        return value ? parseInt(value, 10) : 0;
      case "created_at":
      case "updated_at":
        return value ? new Date(value) : null;
      default:
        return value || "";
    }
  }

  getProductStatusText(status, language) {
    const statusMap = {
      active: language === "es" ? "Activo" : "Active",
      inactive: language === "es" ? "Inactivo" : "Inactive",
      discontinued: language === "es" ? "Descontinuado" : "Discontinued",
    };

    return statusMap[status] || status;
  }

  formatExcelValue(value, type) {
    switch (type) {
      case "currency":
      case "number":
        return value ? parseFloat(value) : 0;
      case "date":
        return value instanceof Date ? value : value ? new Date(value) : null;
      case "boolean":
        return value ? "Sí" : "No";
      default:
        return value !== null && value !== undefined ? String(value) : "";
    }
  }

  formatCSVValue(value) {
    if (value === null || value === undefined) {
      return "";
    }

    const stringValue = String(value);

    // Escapar comas y comillas
    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  applyWorksheetStyles(worksheet) {
    // Estilo para encabezados
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F81BD" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 25;

    // Estilo para datos
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        // Alternar colores de fila
        if (rowNumber % 2 === 0) {
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF2F2F2" },
          };
        }

        // ✅ CORRECCIÓN: Resaltar stock bajo
        const stockCell = row.getCell(4);
        const minStockCell = row.getCell(5);

        if (stockCell.value !== undefined && minStockCell.value !== undefined) {
          if (stockCell.value <= minStockCell.value) {
            row.getCell(4).font = { bold: true, color: { argb: "FFFF0000" } };
          }
        }
      }
    });

    // ✅ CORRECCIÓN: Formato de moneda con verificación de columnas
    if (worksheet.columnCount >= 6) {
      const priceColumn = worksheet.getColumn(6);
      const costColumn = worksheet.getColumn(7);

      [priceColumn, costColumn].forEach((column) => {
        column.numFmt = '"$"#,##0.00';
        column.alignment = { horizontal: "right" };
      });
    }

    // ✅ CORRECCIÓN: Formato de números
    if (worksheet.columnCount >= 4) {
      const stockColumns = [worksheet.getColumn(4), worksheet.getColumn(5)];
      stockColumns.forEach((column) => {
        column.numFmt = "#,##0";
        column.alignment = { horizontal: "right" };
      });
    }
  }

  sanitizeSheetName(name) {
    return name
      .substring(0, 31)
      .replace(/[\\/*?:[\]]/g, "")
      .trim();
  }

  // ✅ CORRECCIÓN: Método de limpieza mejorado
  async cleanupOldExports(maxAgeDays = null) {
    try {
      const ageDays = maxAgeDays || this.maxFileAgeDays;
      const files = await fs.readdir(this.exportsDir);
      let cleaned = 0;
      const cutoff = Date.now() - ageDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.exportsDir, file);

        try {
          const stats = await fs.stat(filePath);

          if (stats.isFile() && stats.mtimeMs < cutoff) {
            await fs.unlink(filePath);
            cleaned++;
            logger.debug(`Cleaned old export: ${file}`);
          }
        } catch (error) {
          logger.warn(`Could not process file ${file}:`, error.message);
        }
      }

      logger.info(`Cleaned ${cleaned} old export files`);
      return { cleaned };
    } catch (error) {
      logger.error("Error cleaning old exports:", error);
      return { cleaned: 0, error: error.message };
    }
  }
}

// ✅ CORRECCIÓN: Exportar instancia singleton
module.exports = new ExportService();
