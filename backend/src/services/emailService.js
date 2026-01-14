const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs").promises;
const path = require("path");
const config = require("../config/env");
const logger = require("../utils/logger");

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = new Map();
    this.isInitialized = false;
    this.initialize();
  }

  // ✅ CORRECCIÓN: Inicialización asíncrona
  async initialize() {
    try {
      await this.initializeTransporter();
      await this.loadTemplates();
      this.isInitialized = true;
      logger.info("✅ Email service initialized successfully");
    } catch (error) {
      logger.error("❌ Error initializing email service:", error);
      this.transporter = this.createMockTransporter();
      this.isInitialized = false;
    }
  }

  async initializeTransporter() {
    // ✅ CORRECCIÓN: Verificar configuración completa
    if (!config.email?.host || !config.email?.user || !config.email?.pass) {
      logger.warn(
        "📧 Email configuration incomplete. Email service will run in mock mode.",
      );
      this.transporter = this.createMockTransporter();
      return;
    }

    const transporterConfig = {
      host: config.email.host,
      port: config.email.port || 587,
      secure: config.email.secure || config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === "production",
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    };

    this.transporter = nodemailer.createTransport(transporterConfig);

    // ✅ CORRECCIÓN: Verificar conexión
    try {
      await this.transporter.verify();
      logger.info("✅ Email transporter verified");
    } catch (error) {
      logger.warn("⚠️ Email transporter verification failed:", error.message);
      this.transporter = this.createMockTransporter();
    }
  }

  createMockTransporter() {
    return {
      sendMail: async (mailOptions) => {
        const emailData = {
          timestamp: new Date().toISOString(),
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject,
          text: mailOptions.text,
          html: mailOptions.html,
          attachments: mailOptions.attachments?.map((a) => ({
            filename: a.filename,
            contentType: a.contentType,
          })),
        };

        logger.info("📧 [MOCK] Email would be sent:", {
          to: mailOptions.to,
          subject: mailOptions.subject,
          attachmentsCount: mailOptions.attachments?.length || 0,
        });

        // Guardar email en archivo para desarrollo
        if (config.server.nodeEnv === "development") {
          await this.saveMockEmail(emailData);
        }

        return {
          messageId: `mock-${Date.now()}`,
          accepted: Array.isArray(mailOptions.to)
            ? mailOptions.to
            : [mailOptions.to],
        };
      },
      verify: async () => true,
      close: () => {},
    };
  }

  async saveMockEmail(emailData) {
    try {
      const mockDir = path.join(__dirname, "../../logs/emails");
      await fs.mkdir(mockDir, { recursive: true });

      const filename = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.json`;
      const filePath = path.join(mockDir, filename);

      await fs.writeFile(filePath, JSON.stringify(emailData, null, 2));
      logger.debug(`📧 Mock email saved: ${filePath}`);
    } catch (error) {
      logger.warn("Could not save mock email:", error);
    }
  }

  async loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, "../templates/emails");

      try {
        await fs.access(templatesDir);
      } catch {
        await this.createDefaultTemplates(templatesDir);
      }

      const templateFiles = await fs.readdir(templatesDir);

      for (const file of templateFiles) {
        if (file.endsWith(".hbs")) {
          const templateName = path.basename(file, ".hbs");
          const templatePath = path.join(templatesDir, file);
          const templateContent = await fs.readFile(templatePath, "utf-8");

          this.templates.set(templateName, handlebars.compile(templateContent));
          logger.debug(`Loaded email template: ${templateName}`);
        }
      }

      logger.info(`✅ Loaded ${this.templates.size} email templates`);
    } catch (error) {
      logger.error("Error loading email templates:", error);
    }
  }

  async createDefaultTemplates(templatesDir) {
    await fs.mkdir(templatesDir, { recursive: true });

    const defaultTemplates = {
      "low-stock-alert": this.getLowStockAlertTemplate(),
      welcome: this.getWelcomeTemplate(),
      "password-reset": this.getPasswordResetTemplate(),
      report: this.getReportTemplate(),
    };

    for (const [name, content] of Object.entries(defaultTemplates)) {
      const filePath = path.join(templatesDir, `${name}.hbs`);
      await fs.writeFile(filePath, content);
    }
  }

  // ✅ CORRECCIÓN: Método principal de envío mejorado
  async sendEmail(options) {
    const {
      to,
      subject,
      template = null,
      templateData = {},
      html = null,
      text = null,
      attachments = [],
      cc = [],
      bcc = [],
      replyTo = null,
      priority = "normal",
    } = options;

    try {
      // Validar destinatarios
      if (!to || (Array.isArray(to) && to.length === 0)) {
        throw new Error("No recipients specified");
      }

      // Preparar destinatarios
      const recipients = Array.isArray(to) ? to.join(", ") : to;
      const ccRecipients = cc.length > 0 ? cc.join(", ") : undefined;
      const bccRecipients = bcc.length > 0 ? bcc.join(", ") : undefined;

      // Preparar contenido
      let finalHtml = html;
      let finalText = text;

      if (template && this.templates.has(template)) {
        const templateFn = this.templates.get(template);
        finalHtml = templateFn(templateData);
        finalText = finalText || this.htmlToText(finalHtml);
      } else if (template) {
        logger.warn(`Template "${template}" not found, using provided HTML`);
      }

      if (!finalHtml && !finalText) {
        throw new Error("No email content provided");
      }

      // Preparar opciones de email
      const mailOptions = {
        from: `"Sistema de Inventario QR" <${config.email.from || config.email.user}>`,
        to: recipients,
        subject,
        html: finalHtml,
        text: finalText,
        attachments: this.prepareAttachments(attachments),
        cc: ccRecipients,
        bcc: bccRecipients,
        replyTo: replyTo || undefined,
        priority: ["low", "normal", "high"].includes(priority)
          ? priority
          : "normal",
      };

      // Enviar email
      const startTime = Date.now();
      const info = await this.transporter.sendMail(mailOptions);
      const duration = Date.now() - startTime;

      logger.info("✅ Email sent successfully", {
        messageId: info.messageId,
        to: Array.isArray(to) ? to : [to],
        subject,
        template: template || "custom",
        duration: `${duration}ms`,
      });

      return {
        success: true,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        duration,
      };
    } catch (error) {
      logger.error("❌ Error sending email:", {
        error: error.message,
        to,
        subject,
        template,
      });

      return {
        success: false,
        error: error.message,
        code: "EMAIL_SEND_ERROR",
      };
    }
  }

  // ✅ CORRECCIÓN: Métodos específicos mejorados
  async sendLowStockAlert(products, recipients, additionalData = {}) {
    try {
      if (!products || products.length === 0) {
        return { success: false, error: "No products specified" };
      }

      const templateData = {
        userName: "Administrador",
        products,
        generatedAt: new Date().toLocaleString("es-MX", {
          dateStyle: "full",
          timeStyle: "medium",
        }),
        totalProducts: products.length,
        threshold: additionalData.threshold,
        ...additionalData,
      };

      return await this.sendEmail({
        to: recipients,
        subject: `⚠️ Alerta: ${products.length} Producto(s) con Stock Bajo`,
        template: "low-stock-alert",
        templateData,
        priority: "high",
      });
    } catch (error) {
      logger.error("Error sending low stock alert:", error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(user, temporaryPassword, recipients) {
    try {
      const templateData = {
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        temporaryPassword,
        loginUrl: config.app.frontendUrl + "/login",
        systemUrl: config.app.url,
        generatedAt: new Date().toLocaleString(),
      };

      return await this.sendEmail({
        to: recipients,
        subject: "👋 ¡Bienvenido al Sistema de Inventario QR!",
        template: "welcome",
        templateData,
        priority: "high",
      });
    } catch (error) {
      logger.error("Error sending welcome email:", error);
      return { success: false, error: error.message };
    }
  }

  // ✅ CORRECCIÓN: Métodos auxiliares mejorados
  prepareAttachments(attachments) {
    if (!attachments || attachments.length === 0) {
      return undefined;
    }

    return attachments.map((attachment) => {
      if (attachment.path) {
        return {
          filename: attachment.filename || path.basename(attachment.path),
          path: attachment.path,
          contentType: attachment.contentType,
        };
      } else if (attachment.content) {
        return {
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType,
          encoding: "base64",
        };
      }
      return attachment;
    });
  }

  htmlToText(html) {
    if (!html) return "";

    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // ✅ CORRECCIÓN: Templates por defecto mejorados
  getLowStockAlertTemplate() {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #4CAF50; color: white; padding: 10px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        .low-stock { color: #f44336; font-weight: bold; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Alerta de Stock Bajo</h1>
        </div>
        <div class="content">
            <p>Hola {{userName}},</p>
            <p>Los siguientes productos tienen stock por debajo del mínimo establecido ({{threshold}}):</p>
            
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>SKU</th>
                        <th>Stock Actual</th>
                        <th>Stock Mínimo</th>
                        <th>Categoría</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each products}}
                    <tr>
                        <td>{{name}}</td>
                        <td>{{sku}}</td>
                        <td class="low-stock">{{current_stock}}</td>
                        <td>{{min_stock}}</td>
                        <td>{{category_name}}</td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
            
            <p><strong>Total de productos con stock bajo:</strong> {{totalProducts}}</p>
            <p><strong>Generado:</strong> {{generatedAt}}</p>
            
            <p>Por favor, realice una nueva orden de compra para estos productos.</p>
        </div>
        <div class="footer">
            <p>Este es un mensaje automático del Sistema de Inventario QR.</p>
            <p>Si recibió este correo por error, por favor contacte al administrador.</p>
        </div>
    </div>
</body>
</html>`;
  }

  getWelcomeTemplate() {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .credentials { background: #fff; border: 2px solid #4CAF50; padding: 15px; margin: 20px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        .btn { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>👋 ¡Bienvenido {{userName}}!</h1>
        </div>
        <div class="content">
            <p>Se ha creado su cuenta en el Sistema de Inventario QR.</p>
            
            <div class="credentials">
                <p><strong>Sus credenciales de acceso:</strong></p>
                <p><strong>Email:</strong> {{userEmail}}</p>
                <p><strong>Contraseña Temporal:</strong> {{temporaryPassword}}</p>
                <p><strong>Rol:</strong> {{userRole}}</p>
            </div>
            
            <p><strong>Importante:</strong> Por seguridad, cambie su contraseña después del primer inicio de sesión.</p>
            
            <p style="text-align: center;">
                <a href="{{loginUrl}}" class="btn">Iniciar Sesión</a>
            </p>
            
            <p><strong>URL del sistema:</strong> {{systemUrl}}</p>
            <p><strong>Cuenta creada:</strong> {{generatedAt}}</p>
        </div>
        <div class="footer">
            <p>Este es un mensaje automático del Sistema de Inventario QR.</p>
        </div>
    </div>
</body>
</html>`;
  }

  getPasswordResetTemplate() {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        .btn { display: inline-block; padding: 10px 20px; background: #2196F3; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔑 Restablecer Contraseña</h1>
        </div>
        <div class="content">
            <p>Hola {{userName}},</p>
            <p>Hemos recibido una solicitud para restablecer su contraseña.</p>
            
            <p style="text-align: center;">
                <a href="{{resetUrl}}" class="btn">Restablecer Contraseña</a>
            </p>
            
            <p>Este enlace expirará en 1 hora.</p>
            <p>Si no solicitó restablecer su contraseña, puede ignorar este mensaje.</p>
        </div>
        <div class="footer">
            <p>Este es un mensaje automático del Sistema de Inventario QR.</p>
        </div>
    </div>
</body>
</html>`;
  }

  getReportTemplate() {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #9C27B0; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Reporte Generado</h1>
        </div>
        <div class="content">
            <p>Hola {{userName}},</p>
            <p>Se ha generado un nuevo reporte del tipo <strong>{{reportType}}</strong>.</p>
            
            <p><strong>Detalles del reporte:</strong></p>
            <ul>
                <li><strong>Tipo:</strong> {{reportType}}</li>
                <li><strong>Generado:</strong> {{generatedAt}}</li>
                <li><strong>Período:</strong> {{period}}</li>
                {{#if summary}}
                <li><strong>Resumen:</strong> {{summary}}</li>
                {{/if}}
            </ul>
            
            <p>Puede descargar el reporte completo desde el sistema.</p>
        </div>
        <div class="footer">
            <p>Este es un mensaje automático del Sistema de Inventario QR.</p>
        </div>
    </div>
</body>
</html>`;
  }

  // ✅ CORRECCIÓN: Cierre de conexiones
  async close() {
    if (this.transporter && this.transporter.close) {
      try {
        await this.transporter.close();
        logger.info("Email transporter closed");
      } catch (error) {
        logger.error("Error closing email transporter:", error);
      }
    }
  }
}

// ✅ CORRECCIÓN: Exportar instancia singleton
module.exports = new EmailService();
