const PDFDocument = require("pdfkit");
const fs = require("fs").promises;
const path = require("path");
const logger = require("../utils/logger");
const config = require("../config/env");

/**
 * ✅ SERVICIO MEJORADO DE GENERACIÓN DE PDF
 * Correcciones aplicadas:
 * 1. Eliminación de dependencias problemáticas (canvas, hummus-recipe, pdf-merger-js)
 * 2. Implementación de generación de PDF pura
 * 3. Mejora de manejo de memoria y buffers
 * 4. Optimización de rendimiento
 * 5. Validación mejorada de datos de entrada
 */

class PDFService {
  constructor() {
    // ✅ MEJORA: Configuración centralizada
    this.fonts = {
      regular: "Helvetica",
      bold: "Helvetica-Bold",
      italic: "Helvetica-Oblique",
    };

    this.colors = {
      primary: "#1a237e",
      secondary: "#283593",
      success: "#4caf50",
      warning: "#ff9800",
      danger: "#f44336",
      info: "#2196f3",
      light: "#f5f5f5",
      dark: "#212121",
      gray: "#9e9e9e",
    };

    this.margins = {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40,
    };

    // ✅ MEJORA: Directorios de trabajo
    this.reportsDir = path.join(process.cwd(), "reports");
    this.tempDir = path.join(process.cwd(), "temp");
  }

  /**
   * ✅ MEJORA: Inicializar directorios
   */
  async initialize() {
    try {
      const directories = [this.reportsDir, this.tempDir];

      for (const dir of directories) {
        try {
          await fs.access(dir);
        } catch {
          await fs.mkdir(dir, { recursive: true });
          logger.debug(`Created directory: ${dir}`);
        }
      }

      logger.info("PDF service directories initialized");
    } catch (error) {
      logger.error("Failed to initialize PDF service directories:", error);
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Generar reporte de inventario optimizado
   * @param {Object} reportData - Datos del reporte
   * @param {Object} options - Opciones de generación
   * @returns {Promise<Buffer>} Buffer del PDF
   */
  async generateInventoryReport(reportData, options = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        // ✅ MEJORA: Validar datos de entrada
        if (!reportData || typeof reportData !== "object") {
          throw new Error("reportData must be a valid object");
        }

        const doc = new PDFDocument({
          margin: this.margins.top,
          size: "A4",
          bufferPages: true,
          info: {
            Title: options.title || "Reporte de Inventario",
            Author: config.app.name || "Sistema de Inventario QR",
            Subject: "Reporte detallado de inventario",
            Keywords: "inventario, stock, reporte, pdf",
            Creator: "Inventory QR System v2.0",
            CreationDate: new Date(),
          },
        });

        const chunks = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(chunks);
          logger.debug("Inventory PDF generated", { size: pdfBuffer.length });
          resolve(pdfBuffer);
        });
        doc.on("error", reject);

        // ✅ MEJORA: Encabezado del documento
        await this.addHeader(
          doc,
          options.title || "Reporte de Inventario",
          reportData,
        );

        // ✅ MEJORA: Resumen ejecutivo
        if (reportData.summary) {
          this.addExecutiveSummary(doc, reportData.summary);
        }

        // ✅ MEJORA: Productos con stock bajo
        if (
          reportData.lowStockProducts &&
          reportData.lowStockProducts.length > 0
        ) {
          this.addLowStockSection(doc, reportData.lowStockProducts);
        }

        // ✅ MEJORA: Reporte detallado
        if (reportData.detailedReport && reportData.detailedReport.length > 0) {
          this.addDetailedReport(doc, reportData.detailedReport, options);
        }

        // ✅ MEJORA: Conclusiones
        if (options.includeConclusions !== false) {
          this.addConclusions(doc, reportData);
        }

        // ✅ MEJORA: Pie de página
        this.addFooter(doc, reportData.generatedBy || "Sistema Automático");

        doc.end();
      } catch (error) {
        logger.error("Error generating inventory PDF:", {
          error: error.message,
          reportData: !!reportData,
          options,
        });
        reject(error);
      }
    });
  }

  /**
   * ✅ MEJORA: Generar reporte de movimientos
   * @param {Object} reportData - Datos del reporte
   * @param {Object} options - Opciones de generación
   * @returns {Promise<Buffer>} Buffer del PDF
   */
  async generateMovementReport(reportData, options = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!reportData || !reportData.movements) {
          throw new Error("reportData must contain movements array");
        }

        const doc = new PDFDocument({
          margin: this.margins.top,
          size: "A4",
          bufferPages: true,
          info: {
            Title: "Reporte de Movimientos",
            Author: config.app.name || "Sistema de Inventario QR",
            CreationDate: new Date(),
          },
        });

        const chunks = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(chunks);
          logger.debug("Movement PDF generated", {
            size: pdfBuffer.length,
            movementCount: reportData.movements?.length || 0,
          });
          resolve(pdfBuffer);
        });
        doc.on("error", reject);

        await this.addHeader(doc, "Reporte de Movimientos", reportData);

        // ✅ MEJORA: Información del período
        if (reportData.period) {
          this.addPeriodInfo(doc, reportData.period);
        }

        // ✅ MEJORA: Tabla de movimientos
        if (reportData.movements && reportData.movements.length > 0) {
          this.addMovementsTable(doc, reportData.movements, options);
        }

        // ✅ MEJORA: Resumen
        if (reportData.summary) {
          this.addMovementSummary(doc, reportData.summary);
        }

        this.addFooter(doc, reportData.generatedBy || "Sistema Automático");

        doc.end();
      } catch (error) {
        logger.error("Error generating movement PDF:", error);
        reject(error);
      }
    });
  }

  /**
   * ✅ MEJORA: Generar etiquetas para productos
   * @param {Array} products - Array de productos
   * @param {Object} options - Opciones de generación
   * @returns {Promise<Buffer>} Buffer del PDF
   */
  async generateProductLabels(products, options = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        // ✅ MEJORA: Validar productos
        if (!Array.isArray(products) || products.length === 0) {
          throw new Error("products must be a non-empty array");
        }

        const doc = new PDFDocument({
          margin: 20,
          size: options.pageSize || "A4",
          layout: options.orientation || "portrait",
        });

        const chunks = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(chunks);
          logger.debug("Product labels PDF generated", {
            size: pdfBuffer.length,
            labelCount: products.length,
          });
          resolve(pdfBuffer);
        });
        doc.on("error", reject);

        // ✅ MEJORA: Configuración de etiquetas
        const labelsPerRow = options.labelsPerRow || 2;
        const labelWidth = (doc.page.width - 40) / labelsPerRow;
        const labelHeight = options.labelHeight || 100;

        let currentRow = 0;
        let currentCol = 0;

        for (const product of products) {
          const x = 20 + currentCol * labelWidth;
          const y = 20 + currentRow * labelHeight;

          // ✅ MEJORA: Dibujar etiqueta
          this.drawProductLabel(doc, product, x, y, labelWidth, labelHeight);

          // ✅ MEJORA: Avanzar a la siguiente etiqueta
          currentCol++;
          if (currentCol >= labelsPerRow) {
            currentCol = 0;
            currentRow++;

            // ✅ MEJORA: Nueva página si es necesario
            if (y + labelHeight * 2 > doc.page.height - 40) {
              doc.addPage();
              currentRow = 0;
            }
          }
        }

        doc.end();
      } catch (error) {
        logger.error("Error generating product labels:", error);
        reject(error);
      }
    });
  }

  /**
   * ✅ MEJORA: Métodos auxiliares optimizados
   */

  async addHeader(doc, title, reportData) {
    // ✅ MEJORA: Logo si existe
    const logoPath = path.join(__dirname, "../../assets/logo.png");
    try {
      await fs.access(logoPath);
      doc.image(logoPath, this.margins.left, 45, { width: 40, height: 40 });
    } catch {
      // ✅ MEJORA: Logo placeholder si no existe
      doc
        .rect(this.margins.left, 45, 40, 40)
        .fillColor(this.colors.primary)
        .fill();

      doc
        .fillColor("white")
        .fontSize(16)
        .font(this.fonts.bold)
        .text("IQS", this.margins.left + 8, 58);
    }

    // ✅ MEJORA: Título
    doc
      .fillColor(this.colors.primary)
      .fontSize(20)
      .font(this.fonts.bold)
      .text(title, this.margins.left + 50, 50, { width: 400 });

    doc
      .fillColor(this.colors.dark)
      .fontSize(10)
      .font(this.fonts.regular)
      .text(
        config.app.name || "Sistema de Gestión de Inventario QR",
        this.margins.left + 50,
        75,
      );

    // ✅ MEJORA: Información del reporte
    const infoY = 100;
    const now = new Date();

    doc
      .fontSize(9)
      .fillColor(this.colors.gray)
      .text(`Generado: ${now.toLocaleString()}`, this.margins.left, infoY)
      .text(
        `Reporte ID: ${reportData.reportId || "N/A"}`,
        this.margins.left,
        infoY + 12,
      )
      .text(`Página 1`, doc.page.width - this.margins.right - 50, infoY, {
        align: "right",
      });

    // ✅ MEJORA: Línea separadora
    this.addSeparator(doc, infoY + 25);

    doc.y = infoY + 35;
  }

  addExecutiveSummary(doc, summary) {
    doc
      .fillColor(this.colors.primary)
      .fontSize(14)
      .font(this.fonts.bold)
      .text("Resumen Ejecutivo", { underline: true });

    doc.moveDown(0.5);

    if (summary) {
      doc.fontSize(10).fillColor(this.colors.dark);

      // ✅ MEJORA: Métricas en formato de tabla simple
      const metrics = [
        {
          label: "Total Productos",
          value: summary.totalProducts || 0,
          color: this.colors.primary,
        },
        {
          label: "En Stock",
          value: summary.inStock || 0,
          color: this.colors.success,
        },
        {
          label: "Sin Stock",
          value: summary.outOfStock || 0,
          color: this.colors.danger,
        },
        {
          label: "Stock Bajo",
          value: summary.lowStock || 0,
          color: this.colors.warning,
        },
        {
          label: "Valor Total",
          value: `$${(summary.totalValue || 0).toFixed(2)}`,
          color: this.colors.info,
        },
      ];

      let x = this.margins.left;
      const y = doc.y;
      const boxWidth = 100;
      const boxHeight = 50;
      const spacing = 10;

      metrics.forEach((metric, index) => {
        if (x + boxWidth > doc.page.width - this.margins.right) {
          x = this.margins.left;
          doc.y += boxHeight + spacing;
        }

        // ✅ MEJORA: Dibujar caja de métrica
        doc
          .rect(x, doc.y, boxWidth, boxHeight)
          .fillColor(this.hexToRgb(metric.color, 0.1))
          .fill()
          .strokeColor(metric.color)
          .stroke();

        // ✅ MEJORA: Texto de la métrica
        doc
          .fillColor(metric.color)
          .fontSize(8)
          .font(this.fonts.bold)
          .text(metric.label, x + 5, doc.y + 5, {
            width: boxWidth - 10,
            align: "center",
          });

        doc
          .fillColor(this.colors.dark)
          .fontSize(16)
          .font(this.fonts.bold)
          .text(metric.value.toString(), x + 5, doc.y + 20, {
            width: boxWidth - 10,
            align: "center",
          });

        x += boxWidth + spacing;
      });

      doc.y += boxHeight + 20;
    }

    this.addSeparator(doc);
    doc.moveDown();
  }

  addLowStockSection(doc, products) {
    if (!products || products.length === 0) return;

    doc.addPage();

    doc
      .fillColor(this.colors.warning)
      .fontSize(14)
      .font(this.fonts.bold)
      .text("Productos con Stock Bajo - ¡Acción Requerida!", {
        underline: true,
      });

    doc.moveDown(0.5);

    // ✅ MEJORA: Tabla optimizada
    const tableTop = doc.y;
    const headers = ["Producto", "SKU", "Stock", "Mínimo", "Diferencia"];
    const columnWidths = [150, 80, 60, 60, 80];

    // ✅ MEJORA: Encabezados de tabla
    doc.font(this.fonts.bold).fontSize(9).fillColor(this.colors.dark);

    let x = this.margins.left;
    headers.forEach((header, i) => {
      doc.text(header, x, tableTop, { width: columnWidths[i], align: "left" });
      x += columnWidths[i];
    });

    // ✅ MEJORA: Línea separadora
    doc
      .moveTo(this.margins.left, tableTop + 15)
      .lineTo(doc.page.width - this.margins.right, tableTop + 15)
      .strokeColor(this.colors.warning)
      .lineWidth(2)
      .stroke();

    // ✅ MEJORA: Datos de la tabla
    doc.font(this.fonts.regular).fontSize(8);

    let y = tableTop + 25;

    products.forEach((product) => {
      if (y > doc.page.height - 100) {
        doc.addPage();
        y = this.margins.top;
      }

      const diff = (product.current_stock || 0) - (product.min_stock || 0);
      const diffColor =
        diff < 0
          ? this.colors.danger
          : diff === 0
            ? this.colors.warning
            : this.colors.success;

      x = this.margins.left;
      const rowData = [
        product.name || "N/A",
        product.sku || "N/A",
        (product.current_stock || 0).toString(),
        (product.min_stock || 0).toString(),
        diff.toString(),
      ];

      rowData.forEach((cell, i) => {
        if (i === 4) {
          doc.fillColor(diffColor);
        } else {
          doc.fillColor(this.colors.dark);
        }

        doc.text(cell, x, y, { width: columnWidths[i], align: "left" });
        x += columnWidths[i];
      });

      // ✅ MEJORA: Resaltar filas críticas
      if (diff < 0) {
        doc
          .rect(
            this.margins.left,
            y - 2,
            doc.page.width - this.margins.left - this.margins.right,
            16,
          )
          .fillColor(this.hexToRgb(this.colors.danger, 0.1))
          .fill();
      }

      y += 18;
    });

    doc.y = y + 10;

    // ✅ MEJORA: Recomendación
    doc
      .fillColor(this.colors.warning)
      .fontSize(10)
      .font(this.fonts.bold)
      .text("Recomendación:", this.margins.left, doc.y);

    doc
      .fillColor(this.colors.dark)
      .fontSize(9)
      .text(
        `Se recomienda realizar pedidos de compra para los ${products.length} productos listados. ` +
          `Considere ajustar los niveles mínimos de stock según la demanda.`,
        this.margins.left,
        doc.y + 15,
        { width: doc.page.width - this.margins.left - this.margins.right },
      );

    doc.y += 40;
    this.addSeparator(doc);
  }

  addDetailedReport(doc, products, options) {
    if (!products || products.length === 0) return;

    doc.addPage();

    doc
      .fillColor(this.colors.primary)
      .fontSize(14)
      .font(this.fonts.bold)
      .text("Reporte Detallado de Inventario", { underline: true });

    doc.moveDown(0.5);

    const tableTop = doc.y;
    const isCompact = options.compact === true;

    const headers = isCompact
      ? ["Producto", "SKU", "Stock", "Precio", "Valor"]
      : [
          "Producto",
          "SKU",
          "Categoría",
          "Stock",
          "Mín",
          "Precio",
          "Valor",
          "Estado",
        ];

    const columnWidths = isCompact
      ? [150, 80, 60, 70, 80]
      : [120, 70, 80, 50, 50, 60, 70, 60];

    // ✅ MEJORA: Encabezados de tabla
    doc.font(this.fonts.bold).fontSize(9).fillColor(this.colors.dark);

    let x = this.margins.left;
    headers.forEach((header, i) => {
      doc.text(header, x, tableTop, { width: columnWidths[i], align: "left" });
      x += columnWidths[i];
    });

    doc
      .moveTo(this.margins.left, tableTop + 15)
      .lineTo(doc.page.width - this.margins.right, tableTop + 15)
      .strokeColor(this.colors.primary)
      .stroke();

    // ✅ MEJORA: Datos de la tabla
    doc.font(this.fonts.regular).fontSize(8);

    let y = tableTop + 25;
    let totalValue = 0;

    products.forEach((product) => {
      if (y > doc.page.height - 100) {
        doc.addPage();
        y = this.margins.top;
      }

      const price = product.price || 0;
      const currentStock = product.current_stock || 0;
      const productValue = currentStock * price;
      totalValue += productValue;

      x = this.margins.left;
      const rowData = isCompact
        ? [
            product.name || "N/A",
            product.sku || "N/A",
            currentStock.toString(),
            `$${price.toFixed(2)}`,
            `$${productValue.toFixed(2)}`,
          ]
        : [
            product.name || "N/A",
            product.sku || "N/A",
            product.category_name || "N/A",
            currentStock.toString(),
            (product.min_stock || 0).toString(),
            `$${price.toFixed(2)}`,
            `$${productValue.toFixed(2)}`,
            this.getStockStatus(currentStock, product.min_stock || 0),
          ];

      rowData.forEach((cell, i) => {
        // ✅ MEJORA: Colorear según valores importantes
        if (i === 2 && !isCompact) {
          // Stock actual
          if (currentStock <= 0) {
            doc.fillColor(this.colors.danger);
          } else if (currentStock <= (product.min_stock || 0)) {
            doc.fillColor(this.colors.warning);
          } else {
            doc.fillColor(this.colors.success);
          }
        } else if (i === rowData.length - 1 && !isCompact) {
          // Estado
          const status = this.getStockStatus(
            currentStock,
            product.min_stock || 0,
          );
          doc.fillColor(this.getStatusColor(status));
        } else {
          doc.fillColor(this.colors.dark);
        }

        doc.text(cell, x, y, { width: columnWidths[i], align: "left" });
        x += columnWidths[i];
      });

      y += 16;
    });

    doc.y = y + 10;

    // ✅ MEJORA: Total al final
    doc
      .font(this.fonts.bold)
      .fontSize(10)
      .fillColor(this.colors.primary)
      .text(
        `Valor Total del Inventario: $${totalValue.toFixed(2)}`,
        doc.page.width - this.margins.right - 250,
        doc.y,
        { width: 200, align: "right" },
      );

    doc.y += 20;
  }

  addMovementsTable(doc, movements, options) {
    if (!movements || movements.length === 0) return;

    doc.addPage();

    doc
      .fillColor(this.colors.primary)
      .fontSize(14)
      .font(this.fonts.bold)
      .text("Movimientos de Inventario", { underline: true });

    doc.moveDown(0.5);

    const tableTop = doc.y;
    const headers = [
      "Fecha",
      "Producto",
      "Tipo",
      "Cantidad",
      "Usuario",
      "Notas",
    ];
    const columnWidths = [80, 100, 60, 60, 80, 100];

    // ✅ MEJORA: Encabezados
    doc.font(this.fonts.bold).fontSize(9).fillColor(this.colors.dark);

    let x = this.margins.left;
    headers.forEach((header, i) => {
      doc.text(header, x, tableTop, { width: columnWidths[i], align: "left" });
      x += columnWidths[i];
    });

    doc
      .moveTo(this.margins.left, tableTop + 15)
      .lineTo(doc.page.width - this.margins.right, tableTop + 15)
      .strokeColor(this.colors.primary)
      .stroke();

    // ✅ MEJORA: Datos
    doc.font(this.fonts.regular).fontSize(8);

    let y = tableTop + 25;

    movements.forEach((movement) => {
      if (y > doc.page.height - 100) {
        doc.addPage();
        y = this.margins.top;
      }

      x = this.margins.left;
      const rowData = [
        new Date(movement.created_at || movement.date).toLocaleDateString(),
        movement.product_name || "N/A",
        this.getMovementTypeText(movement.movement_type),
        movement.quantity.toString(),
        movement.user_name || "Sistema",
        movement.notes || "",
      ];

      rowData.forEach((cell, i) => {
        // ✅ MEJORA: Colorear según tipo de movimiento
        if (i === 2) {
          doc.fillColor(this.getMovementColor(movement.movement_type));
        } else {
          doc.fillColor(this.colors.dark);
        }

        doc.text(cell, x, y, { width: columnWidths[i], align: "left" });
        x += columnWidths[i];
      });

      y += 16;
    });

    doc.y = y + 10;
  }

  addConclusions(doc, reportData) {
    doc.addPage();

    doc
      .fillColor(this.colors.primary)
      .fontSize(14)
      .font(this.fonts.bold)
      .text("Conclusiones y Recomendaciones", { underline: true });

    doc.moveDown(0.5);

    doc.fontSize(10).fillColor(this.colors.dark);

    const conclusions = [
      "El inventario actual muestra un estado general satisfactorio.",
      "Se identificaron productos con stock bajo que requieren atención inmediata.",
      "Se recomienda revisar los niveles mínimos de stock periódicamente.",
      "Considerar implementar alertas automáticas para reposición.",
      "Mantener un proceso de auditoría física regular.",
    ];

    conclusions.forEach((conclusion, index) => {
      doc.text(`${index + 1}. ${conclusion}`, this.margins.left + 10, doc.y, {
        width: doc.page.width - this.margins.left - this.margins.right - 20,
      });
      doc.y += 15;
    });

    doc.y += 10;
    this.addSeparator(doc);
  }

  addFooter(doc, generatedBy) {
    const pageCount = doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      const footerY = doc.page.height - 30;

      doc
        .fontSize(8)
        .fillColor(this.colors.gray)
        .text(
          `Página ${i + 1} de ${pageCount} • ${generatedBy} • ${new Date().toLocaleDateString()}`,
          this.margins.left,
          footerY,
          {
            width: doc.page.width - this.margins.left - this.margins.right,
            align: "center",
          },
        );
    }
  }

  addSeparator(doc, y = null) {
    const currentY = y || doc.y;
    doc
      .moveTo(this.margins.left, currentY)
      .lineTo(doc.page.width - this.margins.right, currentY)
      .strokeColor("#cccccc")
      .lineWidth(0.5)
      .stroke();

    if (!y) doc.y += 10;
  }

  drawProductLabel(doc, product, x, y, width, height) {
    // ✅ MEJORA: Borde de etiqueta
    doc
      .rect(x, y, width - 10, height - 10)
      .strokeColor("#cccccc")
      .stroke();

    // ✅ MEJORA: Nombre del producto
    doc
      .font(this.fonts.bold)
      .fontSize(10)
      .fillColor(this.colors.dark)
      .text(product.name, x + 5, y + 5, {
        width: width - 20,
        align: "center",
      });

    // ✅ MEJORA: SKU
    doc
      .font(this.fonts.regular)
      .fontSize(8)
      .fillColor(this.colors.secondary)
      .text(`SKU: ${product.sku || "N/A"}`, x + 5, y + 25, {
        width: width - 20,
        align: "center",
      });

    // ✅ MEJORA: Precio si está disponible
    if (product.price) {
      doc
        .font(this.fonts.bold)
        .fontSize(12)
        .fillColor(this.colors.primary)
        .text(`$${product.price.toFixed(2)}`, x + 5, y + 40, {
          width: width - 20,
          align: "center",
        });
    }

    // ✅ MEJORA: Código QR placeholder
    doc
      .rect(x + width / 2 - 20, y + 60, 40, 20)
      .fillColor(this.colors.light)
      .fill()
      .strokeColor("#999999")
      .stroke();

    doc
      .font(this.fonts.regular)
      .fontSize(6)
      .fillColor("#666666")
      .text("Código QR", x + width / 2 - 15, y + 65, {
        width: 30,
        align: "center",
      });
  }

  /**
   * ✅ MEJORA: Métodos de utilidad
   */

  getStockStatus(current, min) {
    if (current <= 0) return "Sin Stock";
    if (current <= min) return "Stock Bajo";
    if (current > min * 2) return "Stock Alto";
    return "Stock Normal";
  }

  getStatusColor(status) {
    switch (status) {
      case "Sin Stock":
        return this.colors.danger;
      case "Stock Bajo":
        return this.colors.warning;
      case "Stock Alto":
        return this.colors.info;
      default:
        return this.colors.success;
    }
  }

  getMovementTypeText(type) {
    const types = {
      IN: "Entrada",
      OUT: "Salida",
      ADJUSTMENT: "Ajuste",
      RETURN: "Devolución",
      DAMAGE: "Daño",
      TRANSFER: "Transferencia",
    };
    return types[type] || type;
  }

  getMovementColor(type) {
    const colors = {
      IN: this.colors.success,
      OUT: this.colors.danger,
      ADJUSTMENT: this.colors.warning,
      RETURN: this.colors.info,
      DAMAGE: this.colors.danger,
      TRANSFER: this.colors.primary,
    };
    return colors[type] || this.colors.dark;
  }

  hexToRgb(hex, alpha = 1) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;

    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
      alpha: alpha,
    };
  }

  addPeriodInfo(doc, period) {
    doc
      .fontSize(10)
      .fillColor(this.colors.dark)
      .text(
        `Período: ${period.startDate} - ${period.endDate}`,
        this.margins.left,
        doc.y,
      );
    doc.y += 15;
  }

  addMovementSummary(doc, summary) {
    doc
      .fontSize(11)
      .fillColor(this.colors.primary)
      .font(this.fonts.bold)
      .text("Resumen de Movimientos:", this.margins.left, doc.y);

    doc.y += 10;

    doc.fontSize(10).fillColor(this.colors.dark).font(this.fonts.regular);

    const summaries = [
      `Total Movimientos: ${summary.total || 0}`,
      `Entradas: ${summary.entries || 0}`,
      `Salidas: ${summary.exits || 0}`,
      `Cambio Neto: ${summary.netChange || 0}`,
    ];

    summaries.forEach((text) => {
      doc.text(text, this.margins.left + 10, doc.y);
      doc.y += 12;
    });

    doc.y += 10;
  }

  /**
   * ✅ MEJORA: Guardar PDF en disco
   * @param {Buffer} pdfBuffer - Buffer del PDF
   * @param {string} filename - Nombre del archivo
   * @param {string} directory - Directorio de destino
   * @returns {Promise<Object>} Información del archivo guardado
   */
  async savePDF(pdfBuffer, filename, directory = null) {
    try {
      const saveDir = directory || this.reportsDir;
      await fs.mkdir(saveDir, { recursive: true });

      // ✅ MEJORA: Validar nombre de archivo
      const safeFilename = filename.replace(/[^a-z0-9._-]/gi, "_");
      const filePath = path.join(saveDir, safeFilename);

      await fs.writeFile(filePath, pdfBuffer);

      logger.info("PDF saved successfully", {
        filePath,
        size: pdfBuffer.length,
        filename: safeFilename,
      });

      return {
        path: filePath,
        url: `${config.app.url}/reports/${safeFilename}`,
        size: pdfBuffer.length,
        filename: safeFilename,
      };
    } catch (error) {
      logger.error("Error saving PDF:", error);
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Limpiar archivos temporales antiguos
   * @param {number} maxAgeHours - Horas máximas de antigüedad
   * @returns {Promise<Object>} Resultado de la limpieza
   */
  async cleanupTempFiles(maxAgeHours = 24) {
    try {
      const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
      let cleaned = 0;
      let totalSize = 0;

      const cleanDirectory = async (dir) => {
        try {
          const files = await fs.readdir(dir);

          for (const file of files) {
            const filePath = path.join(dir, file);

            try {
              const stats = await fs.stat(filePath);

              if (stats.isDirectory()) {
                const subResult = await cleanDirectory(filePath);
                cleaned += subResult.cleaned;
                totalSize += subResult.totalSize;
              } else if (stats.mtimeMs < cutoff && file.endsWith(".pdf")) {
                await fs.unlink(filePath);
                cleaned++;
                totalSize += stats.size;
              }
            } catch (error) {
              logger.warn(`Error processing file ${filePath}:`, error.message);
            }
          }
        } catch (error) {
          if (error.code !== "ENOENT") {
            logger.error(`Error cleaning directory ${dir}:`, error);
          }
        }

        return { cleaned: 0, totalSize: 0 };
      };

      const result = await cleanDirectory(this.tempDir);
      cleaned += result.cleaned;
      totalSize += result.totalSize;

      logger.info(
        `Cleaned ${cleaned} temporary PDF files (${(totalSize / 1024 / 1024).toFixed(2)} MB)`,
      );

      return {
        cleaned,
        totalSize,
        reclaimedMB: totalSize / 1024 / 1024,
      };
    } catch (error) {
      logger.error("Error cleaning temp PDF files:", error);
      return { cleaned: 0, totalSize: 0, error: error.message };
    }
  }
}

// ✅ MEJORA: Crear y exportar instancia inicializada
const pdfService = new PDFService();

// Inicializar el servicio al cargar el módulo
pdfService.initialize().catch((error) => {
  logger.error("Failed to initialize PDF service:", error);
});

module.exports = pdfService;
