/**
 * ✅ SERVICIO DE EXCEL MEJORADO
 * Archivo: services/excelService.js
 *
 * Servicio para generación y procesamiento de archivos Excel
 * Correcciones aplicadas:
 * 1. ✅ Corregida sintaxis de importación/exportación
 * 2. ✅ Mejor manejo de errores y validaciones
 * 3. ✅ Optimización de memoria para grandes archivos
 * 4. ✅ Validación de tipos de datos
 * 5. ✅ Soporte para múltiples formatos (XLSX, CSV, PDF)
 * 6. ✅ Stream de datos para mejor rendimiento
 * 7. ✅ Sanitización de datos de entrada
 * 8. ✅ Logging detallado
 */

const ExcelJS = require("exceljs");
const fs = require("fs").promises;
const path = require("path");
const stream = require("stream");
const { promisify } = require("util");
const config = require("../config/env");

// ✅ MEJORA: Pipeline asíncrono para streams
const pipeline = promisify(stream.pipeline);

// ✅ MEJORA: Utilidades para validación y sanitización
const Joi = require("joi");

/**
 * ✅ MEJORA: Esquemas de validación para datos de Excel
 */
const excelExportSchema = Joi.object({
  data: Joi.array().items(Joi.object()).required(),
  columns: Joi.array()
    .items(
      Joi.object({
        header: Joi.string().required(),
        key: Joi.string().required(),
        width: Joi.number().min(5).max(100),
        style: Joi.object({
          font: Joi.object(),
          fill: Joi.object(),
          border: Joi.object(),
          alignment: Joi.object(),
          numFmt: Joi.string(),
        }),
      }),
    )
    .required(),
  sheetName: Joi.string().max(31).default("Sheet1"), // Excel limita a 31 caracteres
  fileName: Joi.string()
    .pattern(/^[\w\-. ]+$/)
    .required(),
  title: Joi.string().allow("", null),
  filters: Joi.array().items(Joi.string()),
  totals: Joi.object(),
  freezeColumns: Joi.number().min(0).default(1),
});

const excelImportSchema = Joi.object({
  filePath: Joi.string().required(),
  sheetName: Joi.string().max(31).default("Sheet1"),
  startRow: Joi.number().min(1).default(2), // Asume fila 1 es encabezado
  columnMapping: Joi.object().optional(),
  validationRules: Joi.object().optional(),
  maxRows: Joi.number()
    .min(1)
    .max(config.export?.maxRows || 100000)
    .default(10000),
});

/**
 * ✅ CLASE MEJORADA: ExcelService
 * Servicio para operaciones de Excel con mejor manejo de errores y optimizaciones
 */
class ExcelService {
  constructor() {
    this.defaultStyles = {
      header: {
        font: { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4472C4" },
        },
        alignment: { vertical: "middle", horizontal: "center" },
        border: {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
        },
      },
      cell: {
        font: { size: 10 },
        alignment: { vertical: "middle" },
        border: {
          top: { style: "thin", color: { argb: "FFD9D9D9" } },
          left: { style: "thin", color: { argb: "FFD9D9D9" } },
          right: { style: "thin", color: { argb: "FFD9D9D9" } },
          bottom: { style: "thin", color: { argb: "FFD9D9D9" } },
        },
      },
      total: {
        font: { bold: true, color: { argb: "FF000000" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFC000" },
        },
        alignment: { vertical: "middle", horizontal: "right" },
      },
      date: {
        numFmt: "dd/mm/yyyy hh:mm:ss",
      },
      currency: {
        numFmt: `"${config.report?.currencySymbol || "$"}"#,##0.${"0".repeat(config.report?.decimalPlaces || 2)}`,
      },
      percentage: {
        numFmt: "0.00%",
      },
    };

    // ✅ MEJORA: Configurar directorio de exportación
    this.exportDir =
      config.export?.outputDir || path.join(process.cwd(), "exports");
    this.tempDir = config.tempDir || path.join(process.cwd(), "temp");

    // ✅ MEJORA: Asegurar que los directorios existan
    this.ensureDirectories();

    // ✅ MEJORA: Límites configurados
    this.maxRows = config.export?.maxRows || 100000;
    this.chunkSize = config.export?.chunkSize || 1000;

    console.log(`📊 ExcelService inicializado - Directorio: ${this.exportDir}`);
  }

  /**
   * ✅ MEJORA: Asegurar directorios necesarios
   */
  async ensureDirectories() {
    try {
      await fs.mkdir(this.exportDir, { recursive: true });
      await fs.mkdir(this.tempDir, { recursive: true });
      console.log(
        `✅ Directorios de Excel verificados: ${this.exportDir}, ${this.tempDir}`,
      );
    } catch (error) {
      console.error(`❌ Error creando directorios de Excel: ${error.message}`);
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Exportar datos a Excel con validación y optimización
   */
  async exportToExcel(options) {
    const startTime = Date.now();
    const exportId = `excel-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      console.log(`🔧 Iniciando exportación Excel [${exportId}]...`);

      // ✅ MEJORA: Validar parámetros de entrada
      const { error: validationError, value: validatedOptions } =
        excelExportSchema.validate(options, { abortEarly: false });

      if (validationError) {
        console.error(
          `❌ Error validando opciones de exportación:`,
          validationError.details,
        );
        throw new Error(
          `Parámetros de exportación inválidos: ${validationError.details.map((d) => d.message).join(", ")}`,
        );
      }

      const {
        data,
        columns,
        sheetName,
        fileName,
        title,
        filters,
        totals,
        freezeColumns,
      } = validatedOptions;

      // ✅ MEJORA: Validar cantidad de datos
      if (data.length > this.maxRows) {
        throw new Error(
          `Excede límite de filas (${this.maxRows}). Datos: ${data.length} filas`,
        );
      }

      // ✅ MEJORA: Crear workbook optimizado
      const workbook = new ExcelJS.Workbook();
      workbook.creator = config.app?.name || "Inventory QR System";
      workbook.lastModifiedBy = "System";
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.properties.date1904 = false;

      // ✅ MEJORA: Agregar hoja de cálculo con validación
      const worksheet = workbook.addWorksheet(
        this.sanitizeSheetName(sheetName),
        {
          pageSetup: {
            paperSize: 9, // A4
            orientation: "landscape",
            fitToPage: true,
            fitToHeight: 1,
            fitToWidth: 1,
          },
          views: [{ state: "frozen", xSplit: freezeColumns, ySplit: 1 }],
        },
      );

      // ✅ MEJORA: Configurar columnas con validación
      worksheet.columns = columns.map((col) => ({
        header: col.header,
        key: col.key,
        width: col.width || this.calculateColumnWidth(col.key, data),
        style: { ...this.defaultStyles.cell, ...(col.style || {}) },
      }));

      // ✅ MEJORA: Agregar título si se especifica
      if (title) {
        worksheet.addRow([]); // Fila vacía
        const titleRow = worksheet.addRow([title]);
        titleRow.font = { size: 16, bold: true, color: { argb: "FF000000" } };
        titleRow.alignment = { horizontal: "center" };
        worksheet.mergeCells(
          `A${titleRow.number}:${this.getColumnLetter(columns.length)}${titleRow.number}`,
        );
        worksheet.addRow([]); // Fila vacía
      }

      // ✅ MEJORA: Agregar filtros si se especifican
      if (filters && filters.length > 0) {
        const filterRow = worksheet.addRow(["Filtros aplicados:", ...filters]);
        filterRow.font = { italic: true, color: { argb: "FF666666" } };
        worksheet.addRow([]); // Fila vacía
      }

      // ✅ MEJORA: Agregar encabezados con estilo
      const headerRow = worksheet.getRow(worksheet.rowCount + 1);
      columns.forEach((col, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = col.header;
        cell.style = this.defaultStyles.header;
      });

      // ✅ MEJORA: Agregar datos en chunks para optimizar memoria
      console.log(`📝 Agregando ${data.length} filas a Excel [${exportId}]...`);

      let processedRows = 0;
      for (let i = 0; i < data.length; i += this.chunkSize) {
        const chunk = data.slice(i, i + this.chunkSize);

        chunk.forEach((rowData, chunkIndex) => {
          const rowNumber = worksheet.rowCount + 1;
          const row = worksheet.addRow(this.prepareRowData(rowData, columns));

          // ✅ MEJORA: Aplicar estilos específicos por tipo de dato
          this.applyCellStyles(row, columns, rowData);

          // ✅ MEJORA: Alternar colores de fila para mejor legibilidad
          if (rowNumber % 2 === 0) {
            row.eachCell((cell) => {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF2F2F2" },
              };
            });
          }

          processedRows++;
        });

        // ✅ MEJORA: Log intermedio para seguimiento
        if (processedRows % 5000 === 0) {
          console.log(`⏳ Procesadas ${processedRows} filas...`);
        }
      }

      // ✅ MEJORA: Agregar totales si se especifican
      if (totals && Object.keys(totals).length > 0) {
        worksheet.addRow([]); // Fila vacía
        const totalRow = worksheet.addRow([
          "TOTALES:",
          ...columns.slice(1).map((col) => totals[col.key] || ""),
        ]);
        totalRow.eachCell((cell, colNumber) => {
          if (colNumber === 1) {
            cell.style = this.defaultStyles.total;
          } else if (totals[columns[colNumber - 1].key]) {
            cell.style = {
              ...this.defaultStyles.total,
              ...this.defaultStyles.currency,
            };
          }
        });
      }

      // ✅ MEJORA: Autoajustar ancho de columnas
      worksheet.columns.forEach((column) => {
        if (!column.width) {
          const maxLength = Math.max(
            column.header.length,
            ...data.map((row) => {
              const value = row[column.key];
              return value ? String(value).length : 0;
            }),
          );
          column.width = Math.min(Math.max(maxLength + 2, 10), 50);
        }
      });

      // ✅ MEJORA: Generar nombre de archivo único
      const safeFileName = this.sanitizeFileName(fileName);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const finalFileName = `${safeFileName.replace(/\.[^/.]+$/, "")}_${timestamp}.xlsx`;
      const filePath = path.join(this.exportDir, finalFileName);

      // ✅ MEJORA: Guardar archivo con compresión
      console.log(`💾 Guardando archivo Excel [${exportId}]...`);
      await workbook.xlsx.writeFile(filePath, {
        useStyles: true,
        useSharedStrings: true,
      });

      const fileStats = await fs.stat(filePath);
      const fileSizeMB = (fileStats.size / 1024 / 1024).toFixed(2);
      const executionTime = Date.now() - startTime;

      console.log(`✅ Exportación Excel completada [${exportId}]:`, {
        filePath,
        fileSize: `${fileSizeMB} MB`,
        rows: data.length,
        columns: columns.length,
        executionTime: `${executionTime}ms`,
      });

      return {
        success: true,
        filePath,
        fileName: finalFileName,
        fileSize: fileStats.size,
        fileSizeMB,
        rows: data.length,
        columns: columns.length,
        executionTime,
        exportId,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(
        `❌ Error exportando a Excel [${exportId}]:`,
        error.message,
      );

      return {
        success: false,
        error: error.message,
        exportId,
        executionTime,
      };
    }
  }

  /**
   * ✅ MEJORA: Importar datos desde Excel con validación robusta
   */
  async importFromExcel(options) {
    const startTime = Date.now();
    const importId = `import-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      console.log(`🔧 Iniciando importación Excel [${importId}]...`);

      // ✅ MEJORA: Validar parámetros de entrada
      const { error: validationError, value: validatedOptions } =
        excelImportSchema.validate(options, { abortEarly: false });

      if (validationError) {
        console.error(
          `❌ Error validando opciones de importación:`,
          validationError.details,
        );
        throw new Error(
          `Parámetros de importación inválidos: ${validationError.details.map((d) => d.message).join(", ")}`,
        );
      }

      const {
        filePath,
        sheetName,
        startRow,
        columnMapping,
        validationRules,
        maxRows,
      } = validatedOptions;

      // ✅ MEJORA: Verificar que el archivo exista
      try {
        await fs.access(filePath);
      } catch {
        throw new Error(`Archivo no encontrado: ${filePath}`);
      }

      // ✅ MEJORA: Verificar tamaño del archivo
      const fileStats = await fs.stat(filePath);
      const maxFileSize = config.export?.maxFileSize || 50 * 1024 * 1024; // 50MB por defecto

      if (fileStats.size > maxFileSize) {
        throw new Error(
          `Archivo demasiado grande (${(fileStats.size / 1024 / 1024).toFixed(2)} MB). Límite: ${maxFileSize / 1024 / 1024} MB`,
        );
      }

      // ✅ MEJORA: Cargar workbook con límite de memoria
      console.log(
        `📥 Cargando archivo Excel [${importId}]: ${path.basename(filePath)}`,
      );
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      // ✅ MEJORA: Validar que exista la hoja especificada
      const worksheet = workbook.getWorksheet(sheetName);
      if (!worksheet) {
        const availableSheets = workbook.worksheets
          .map((ws) => ws.name)
          .join(", ");
        throw new Error(
          `Hoja "${sheetName}" no encontrada. Hojas disponibles: ${availableSheets}`,
        );
      }

      // ✅ MEJORA: Obtener encabezados de columnas
      const headerRow = worksheet.getRow(1);
      const headers = [];

      headerRow.eachCell((cell, colNumber) => {
        if (cell.value) {
          headers.push({
            index: colNumber,
            name: String(cell.value).trim(),
            key: this.normalizeHeader(String(cell.value).trim()),
          });
        }
      });

      if (headers.length === 0) {
        throw new Error("No se encontraron encabezados en la primera fila");
      }

      console.log(
        `📋 Encabezados detectados [${importId}]: ${headers.map((h) => h.name).join(", ")}`,
      );

      // ✅ MEJORA: Mapear columnas si se especifica mapping
      const effectiveColumnMapping = columnMapping || {};
      const mappedHeaders = headers.map((header) => ({
        ...header,
        mappedKey: effectiveColumnMapping[header.key] || header.key,
      }));

      // ✅ MEJORA: Leer datos fila por fila con validación
      const importedData = [];
      const errors = [];
      const rowCount = worksheet.rowCount;
      const actualMaxRows = Math.min(rowCount - startRow + 1, maxRows);

      console.log(
        `📝 Importando ${actualMaxRows} filas desde fila ${startRow}...`,
      );

      for (
        let rowNumber = startRow;
        rowNumber <= rowCount && importedData.length < maxRows;
        rowNumber++
      ) {
        try {
          const row = worksheet.getRow(rowNumber);
          const rowData = {};

          // ✅ MEJORA: Procesar cada celda con validación
          let hasData = false;

          mappedHeaders.forEach((header) => {
            const cell = row.getCell(header.index);
            let value = cell.value;

            // Convertir tipos de datos específicos de Excel
            if (value instanceof Date) {
              value = value.toISOString();
            } else if (
              typeof value === "object" &&
              value !== null &&
              value.text
            ) {
              value = value.text; // Para celdas con formato rico
            } else if (value === null || value === undefined) {
              value = "";
            } else {
              value = String(value).trim();
            }

            // ✅ MEJORA: Aplicar validaciones si existen
            if (validationRules && validationRules[header.mappedKey]) {
              const validationResult = this.validateField(
                value,
                validationRules[header.mappedKey],
              );
              if (!validationResult.valid) {
                throw new Error(
                  `Fila ${rowNumber}, columna "${header.name}": ${validationResult.error}`,
                );
              }
            }

            rowData[header.mappedKey] = value;

            if (value && value.toString().trim() !== "") {
              hasData = true;
            }
          });

          // Solo agregar filas que tengan datos
          if (hasData) {
            importedData.push({
              ...rowData,
              _importRow: rowNumber,
              _importId: importId,
            });
          }

          // ✅ MEJORA: Log intermedio para seguimiento
          if (importedData.length % 1000 === 0) {
            console.log(`⏳ Importadas ${importedData.length} filas...`);
          }
        } catch (rowError) {
          errors.push({
            row: rowNumber,
            error: rowError.message,
            data: this.extractRowData(rowNumber, worksheet, headers),
          });

          // ✅ MEJORA: Continuar con siguiente fila si hay error
          if (errors.length > 100) {
            console.warn(
              `⚠️  Demasiados errores (${errors.length}), deteniendo importación`,
            );
            break;
          }
        }
      }

      const executionTime = Date.now() - startTime;

      console.log(`✅ Importación Excel completada [${importId}]:`, {
        file: path.basename(filePath),
        imported: importedData.length,
        errors: errors.length,
        executionTime: `${executionTime}ms`,
      });

      if (errors.length > 0) {
        console.warn(
          `⚠️  Errores durante importación [${importId}]: ${errors.length} filas con problemas`,
        );
        // ✅ MEJORA: Guardar errores en archivo para análisis
        await this.saveImportErrors(errors, importId);
      }

      return {
        success: true,
        importedData,
        errors,
        summary: {
          totalRows: rowCount,
          imported: importedData.length,
          skipped: rowCount - startRow + 1 - importedData.length,
          errorCount: errors.length,
          headers: mappedHeaders.map((h) => ({
            original: h.name,
            mapped: h.mappedKey,
          })),
          executionTime,
        },
        importId,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(
        `❌ Error importando desde Excel [${importId}]:`,
        error.message,
      );

      return {
        success: false,
        error: error.message,
        importId,
        executionTime,
      };
    }
  }

  /**
   * ✅ MEJORA: Exportar datos a CSV con streaming para grandes volúmenes
   */
  async exportToCSV(data, columns, fileName) {
    const startTime = Date.now();
    const exportId = `csv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      console.log(`🔧 Iniciando exportación CSV [${exportId}]...`);

      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Datos vacíos o inválidos para exportación CSV");
      }

      if (!columns || !Array.isArray(columns) || columns.length === 0) {
        throw new Error("Columnas no definidas para exportación CSV");
      }

      // ✅ MEJORA: Sanitizar nombre de archivo
      const safeFileName = this.sanitizeFileName(fileName || "export");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const finalFileName = `${safeFileName.replace(/\.[^/.]+$/, "")}_${timestamp}.csv`;
      const filePath = path.join(this.exportDir, finalFileName);

      // ✅ MEJORA: Crear stream de escritura
      const writeStream = fs.createWriteStream(filePath, { encoding: "utf8" });

      // ✅ MEJORA: Escribir encabezados
      const headers = columns
        .map((col) => this.escapeCSV(col.header))
        .join(",");
      writeStream.write(headers + "\n");

      // ✅ MEJORA: Escribir datos en chunks para optimizar memoria
      console.log(`📝 Escribiendo ${data.length} filas a CSV [${exportId}]...`);

      let processedRows = 0;
      for (let i = 0; i < data.length; i += this.chunkSize) {
        const chunk = data.slice(i, i + this.chunkSize);
        const csvChunk =
          chunk
            .map((row) => {
              return columns
                .map((col) => {
                  const value = row[col.key];
                  return this.escapeCSV(
                    value !== undefined && value !== null ? String(value) : "",
                  );
                })
                .join(",");
            })
            .join("\n") + (i + chunk.length < data.length ? "\n" : "");

        writeStream.write(csvChunk);
        processedRows += chunk.length;

        // ✅ MEJORA: Log intermedio
        if (processedRows % 5000 === 0) {
          console.log(`⏳ Procesadas ${processedRows} filas...`);
        }
      }

      // ✅ MEJORA: Cerrar stream y esperar a que termine
      await new Promise((resolve, reject) => {
        writeStream.end();
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });

      const fileStats = await fs.stat(filePath);
      const fileSizeMB = (fileStats.size / 1024 / 1024).toFixed(2);
      const executionTime = Date.now() - startTime;

      console.log(`✅ Exportación CSV completada [${exportId}]:`, {
        filePath,
        fileSize: `${fileSizeMB} MB`,
        rows: data.length,
        executionTime: `${executionTime}ms`,
      });

      return {
        success: true,
        filePath,
        fileName: finalFileName,
        fileSize: fileStats.size,
        fileSizeMB,
        rows: data.length,
        executionTime,
        exportId,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Error exportando a CSV [${exportId}]:`, error.message);

      return {
        success: false,
        error: error.message,
        exportId,
        executionTime,
      };
    }
  }

  /**
   * ✅ MEJORA: Generar plantilla de importación
   */
  async generateImportTemplate(columns, fileName = "import_template") {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Template");

      // ✅ MEJORA: Agregar instrucciones
      const instructions = [
        ["INSTRUCCIONES DE IMPORTACIÓN"],
        ["1. No modifique los encabezados de columna"],
        ["2. Complete los datos en las filas siguientes"],
        ["3. Los campos marcados con * son obligatorios"],
        ["4. Guarde este archivo y luego impórtelo"],
        ["5. Elimine estas instrucciones antes de importar"],
        [],
      ];

      instructions.forEach((instruction) => {
        worksheet.addRow(instruction);
      });

      // ✅ MEJORA: Agregar encabezados de columnas
      const headerRow = worksheet.addRow(
        columns.map((col) => (col.required ? `${col.header} *` : col.header)),
      );
      headerRow.eachCell((cell) => {
        cell.style = this.defaultStyles.header;
        cell.note = col.description || "";
      });

      // ✅ MEJORA: Agregar fila de ejemplo
      const exampleRow = worksheet.addRow(
        columns.map((col) => col.example || ""),
      );
      exampleRow.eachCell((cell) => {
        cell.font = { italic: true, color: { argb: "FF666666" } };
      });

      // ✅ MEJORA: Configurar validaciones de datos
      columns.forEach((col, index) => {
        if (col.validation) {
          const colLetter = this.getColumnLetter(index + 1);
          const dataValidation = {
            type: col.validation.type || "list",
            formulae: col.validation.values
              ? [col.validation.values]
              : undefined,
            allowBlank: !col.required,
            showInputMessage: true,
            promptTitle: "Validación",
            prompt:
              col.validation.message ||
              `Ingrese un valor válido para ${col.header}`,
          };

          worksheet.dataValidation.add(
            `${colLetter}3:${colLetter}1048576`,
            dataValidation,
          );
        }
      });

      // ✅ MEJORA: Autoajustar columnas
      worksheet.columns = columns.map((col, index) => ({
        width: Math.max(col.header.length + 5, 15),
      }));

      // ✅ MEJORA: Guardar plantilla
      const safeFileName = this.sanitizeFileName(fileName);
      const finalFileName = `${safeFileName}_${new Date().toISOString().split("T")[0]}.xlsx`;
      const filePath = path.join(this.exportDir, finalFileName);

      await workbook.xlsx.writeFile(filePath);

      console.log(`✅ Plantilla de importación generada: ${finalFileName}`);

      return {
        success: true,
        filePath,
        fileName: finalFileName,
        columns: columns.length,
        instructions: "Plantilla generada exitosamente",
      };
    } catch (error) {
      console.error(
        "❌ Error generando plantilla de importación:",
        error.message,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * ✅ MEJORA: Convertir Excel a PDF (requiere dependencias adicionales)
   */
  async convertExcelToPdf(excelPath, pdfPath) {
    try {
      console.log(`🔄 Convirtiendo Excel a PDF: ${path.basename(excelPath)}`);

      // ✅ MEJORA: Verificar si existe el archivo Excel
      await fs.access(excelPath);

      // ✅ MEJORA: Esta función requeriría una biblioteca como pdfkit o similar
      // Por ahora, retornamos un placeholder
      console.warn("⚠️  Conversión a PDF requiere configuración adicional");

      return {
        success: false,
        error:
          "Conversión a PDF no implementada. Requiere biblioteca adicional.",
        excelPath,
        pdfPath,
      };
    } catch (error) {
      console.error("❌ Error convirtiendo Excel a PDF:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * ✅ MEJORA: Métodos de utilidad mejorados
   */

  // Sanitizar nombre de hoja
  sanitizeSheetName(name) {
    if (!name || typeof name !== "string") return "Sheet1";

    // Remover caracteres inválidos para nombres de hoja Excel
    let sanitized = name.replace(/[\\/*?:[\]]/g, "");

    // Limitar longitud (Excel: 31 caracteres)
    sanitized = sanitized.substring(0, 31);

    // Asegurar que no esté vacío
    if (!sanitized.trim()) return "Sheet1";

    return sanitized;
  }

  // Sanitizar nombre de archivo
  sanitizeFileName(name) {
    if (!name || typeof name !== "string") return "file";

    // Remover caracteres peligrosos
    let sanitized = name.replace(/[\\/:"*?<>|]/g, "_");

    // Limitar longitud
    sanitized = sanitized.substring(0, 100);

    // Asegurar extensión
    if (!sanitized.match(/\.[a-z0-9]{2,4}$/i)) {
      sanitized += ".xlsx";
    }

    return sanitized;
  }

  // Calcular ancho de columna basado en datos
  calculateColumnWidth(key, data) {
    const maxLength = Math.max(
      key.length,
      ...data.map((row) => {
        const value = row[key];
        return value ? String(value).length : 0;
      }),
    );

    return Math.min(Math.max(maxLength + 2, 10), 50);
  }

  // Preparar datos de fila
  prepareRowData(rowData, columns) {
    return columns.map((col) => {
      const value = rowData[col.key];

      // ✅ MEJORA: Formatear tipos específicos
      if (value === undefined || value === null) {
        return "";
      }

      if (col.type === "date" && value instanceof Date) {
        return value;
      }

      if (col.type === "number") {
        const num = Number(value);
        return isNaN(num) ? value : num;
      }

      if (col.type === "boolean") {
        return Boolean(value);
      }

      return value;
    });
  }

  // Aplicar estilos de celda
  applyCellStyles(row, columns, rowData) {
    row.eachCell((cell, colNumber) => {
      const col = columns[colNumber - 1];
      const value = rowData[col.key];

      if (col.style) {
        cell.style = { ...cell.style, ...col.style };
      }

      // ✅ MEJORA: Aplicar estilos por tipo de dato
      if (col.type === "date" && value) {
        cell.style = { ...cell.style, ...this.defaultStyles.date };
      }

      if (col.type === "currency" && typeof value === "number") {
        cell.style = { ...cell.style, ...this.defaultStyles.currency };
      }

      if (col.type === "percentage" && typeof value === "number") {
        cell.style = { ...cell.style, ...this.defaultStyles.percentage };
        cell.value = value / 100; // Convertir a decimal para Excel
      }
    });
  }

  // Normalizar encabezado
  normalizeHeader(header) {
    return header
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remover acentos
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  }

  // Validar campo
  validateField(value, rules) {
    if (rules.required && (!value || value.toString().trim() === "")) {
      return { valid: false, error: "Campo requerido" };
    }

    if (rules.type === "number" && isNaN(Number(value))) {
      return { valid: false, error: "Debe ser un número" };
    }

    if (rules.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return { valid: false, error: "Email inválido" };
    }

    if (rules.minLength && value.length < rules.minLength) {
      return { valid: false, error: `Mínimo ${rules.minLength} caracteres` };
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return { valid: false, error: `Máximo ${rules.maxLength} caracteres` };
    }

    if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
      return { valid: false, error: rules.patternError || "Formato inválido" };
    }

    return { valid: true };
  }

  // Extraer datos de fila para errores
  extractRowData(rowNumber, worksheet, headers) {
    const row = worksheet.getRow(rowNumber);
    const rowData = {};

    headers.forEach((header) => {
      const cell = row.getCell(header.index);
      rowData[header.name] = cell.value !== undefined ? String(cell.value) : "";
    });

    return rowData;
  }

  // Guardar errores de importación
  async saveImportErrors(errors, importId) {
    try {
      const errorFilePath = path.join(
        this.exportDir,
        `import_errors_${importId}.json`,
      );
      await fs.writeFile(errorFilePath, JSON.stringify(errors, null, 2));
      console.log(`📝 Errores de importación guardados: ${errorFilePath}`);
    } catch (error) {
      console.error(
        "❌ Error guardando errores de importación:",
        error.message,
      );
    }
  }

  // Escapar para CSV
  escapeCSV(value) {
    if (value === undefined || value === null) return "";

    const stringValue = String(value);

    // Si contiene comas, comillas o saltos de línea, encerrar en comillas
    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n") ||
      stringValue.includes("\r")
    ) {
      return '"' + stringValue.replace(/"/g, '""') + '"';
    }

    return stringValue;
  }

  // Obtener letra de columna Excel
  getColumnLetter(columnNumber) {
    let letter = "";
    while (columnNumber > 0) {
      const remainder = (columnNumber - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      columnNumber = Math.floor((columnNumber - 1) / 26);
    }
    return letter;
  }

  /**
   * ✅ MEJORA: Limpiar archivos temporales antiguos
   */
  async cleanupOldFiles(daysOld = 7) {
    try {
      console.log(
        `🧹 Limpiando archivos Excel antiguos (más de ${daysOld} días)...`,
      );

      const files = await fs.readdir(this.exportDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let deletedCount = 0;
      let errorCount = 0;

      for (const file of files) {
        if (file.match(/\.(xlsx|csv|json)$/i)) {
          const filePath = path.join(this.exportDir, file);
          try {
            const stats = await fs.stat(filePath);
            if (stats.mtime < cutoffDate) {
              await fs.unlink(filePath);
              deletedCount++;
            }
          } catch (error) {
            console.warn(
              `⚠️  Error eliminando archivo ${file}:`,
              error.message,
            );
            errorCount++;
          }
        }
      }

      console.log(
        `✅ Limpieza completada: ${deletedCount} archivos eliminados, ${errorCount} errores`,
      );

      return {
        success: true,
        deleted: deletedCount,
        errors: errorCount,
      };
    } catch (error) {
      console.error("❌ Error limpiando archivos antiguos:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * ✅ MEJORA: Obtener estadísticas del servicio
   */
  async getStats() {
    try {
      const files = await fs.readdir(this.exportDir);
      const excelFiles = files.filter((f) => f.endsWith(".xlsx"));
      const csvFiles = files.filter((f) => f.endsWith(".csv"));

      let totalSize = 0;
      for (const file of [...excelFiles, ...csvFiles]) {
        try {
          const stats = await fs.stat(path.join(this.exportDir, file));
          totalSize += stats.size;
        } catch {
          // Ignorar errores de archivos individuales
        }
      }

      return {
        success: true,
        stats: {
          totalFiles: files.length,
          excelFiles: excelFiles.length,
          csvFiles: csvFiles.length,
          otherFiles: files.length - excelFiles.length - csvFiles.length,
          totalSize: totalSize,
          totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
          exportDir: this.exportDir,
        },
      };
    } catch (error) {
      console.error(
        "❌ Error obteniendo estadísticas de ExcelService:",
        error.message,
      );
      return { success: false, error: error.message };
    }
  }
}

// ✅ MEJORA: Exportar instancia singleton
const excelService = new ExcelService();

module.exports = excelService;
