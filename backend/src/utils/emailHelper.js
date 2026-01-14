const nodemailer = require("nodemailer");
const { logger } = require("./logger");
const config = require("../config/env");
const constants = require("./constants");

/**
 * ✅ EMAIL HELPER MEJORADO CON CORRECCIONES
 * Correcciones aplicadas:
 * 1. Manejo robusto de errores en inicialización
 * 2. Plantillas mejoradas y configurables
 * 3. Sistema de reintentos y colas
 */

class EmailHelper {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.initializationAttempts = 0;
    this.maxInitializationAttempts = 3;
    this.emailQueue = [];
    this.isProcessingQueue = false;

    this.initialize();
  }

  // ✅ MEJORA: Inicializar transporter con reintentos
  async initialize() {
    try {
      this.initializationAttempts++;

      // Verificar configuración
      if (!this.validateConfig()) {
        logger.warn(
          "Email configuration incomplete. Email service will be disabled.",
        );
        this.initialized = false;
        return;
      }

      // Configurar transporter
      const transporterConfig = {
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure || false,
        auth: {
          user: config.email.user,
          pass: config.email.pass,
        },
        tls: {
          rejectUnauthorized: config.server.nodeEnv === "production",
          ciphers: "SSLv3",
        },
        pool: true, // Usar pool de conexiones
        maxConnections: 5,
        maxMessages: 100,
      };

      // Configuraciones adicionales para producción
      if (config.server.nodeEnv === "production") {
        Object.assign(transporterConfig, {
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000,
        });
      }

      this.transporter = nodemailer.createTransport(transporterConfig);

      // Verificar conexión
      await this.verifyConnection();

      this.initialized = true;
      this.initializationAttempts = 0;
      logger.info("Email transporter initialized successfully", {
        host: config.email.host,
        port: config.email.port,
        user: config.email.user,
      });

      // Procesar cola pendiente
      this.processQueue();
    } catch (error) {
      logger.error("Error initializing email transporter:", {
        error: error.message,
        stack: error.stack,
        attempt: this.initializationAttempts,
      });

      this.initialized = false;

      // Reintentar si no excedió el máximo
      if (this.initializationAttempts < this.maxInitializationAttempts) {
        const delay = Math.pow(2, this.initializationAttempts) * 1000; // Exponential backoff
        logger.info(`Retrying email initialization in ${delay}ms...`);

        setTimeout(() => this.initialize(), delay);
      } else {
        logger.error(
          "Max email initialization attempts reached. Email service disabled.",
        );
      }
    }
  }

  // ✅ MEJORA: Validar configuración de email
  validateConfig() {
    const requiredFields = ["host", "user", "pass"];
    const missingFields = [];

    requiredFields.forEach((field) => {
      if (!config.email[field]) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      logger.warn(
        `Missing email configuration fields: ${missingFields.join(", ")}`,
      );
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(config.email.user)) {
      logger.warn(`Invalid email format for user: ${config.email.user}`);
      return false;
    }

    return true;
  }

  // ✅ MEJORA: Verificar conexión con timeout
  async verifyConnection() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Email verification timeout"));
      }, 10000);

      this.transporter.verify((error) => {
        clearTimeout(timeout);
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  // ✅ MEJORA: Enviar email con manejo de cola y reintentos
  async sendEmail(options, priority = "normal", retryCount = 0) {
    // Validar opciones
    const validationError = this.validateEmailOptions(options);
    if (validationError) {
      throw new Error(`Invalid email options: ${validationError}`);
    }

    // Si el servicio no está inicializado, encolar
    if (!this.initialized || !this.transporter) {
      return this.enqueueEmail(options, priority);
    }

    try {
      const mailOptions = this.buildMailOptions(options);
      const info = await this.transporter.sendMail(mailOptions);

      logger.info("Email sent successfully", {
        messageId: info.messageId,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        response: info.response?.substring(0, 100), // Log parcial de respuesta
      });

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
      };
    } catch (error) {
      logger.error("Error sending email:", {
        error: error.message,
        to: options.to,
        subject: options.subject,
        retryCount,
      });

      // Reintentar si es apropiado
      if (this.shouldRetry(error, retryCount)) {
        const delay = this.calculateRetryDelay(retryCount);
        logger.info(`Retrying email send in ${delay}ms...`);

        return new Promise((resolve) => {
          setTimeout(async () => {
            const result = await this.sendEmail(
              options,
              priority,
              retryCount + 1,
            );
            resolve(result);
          }, delay);
        });
      }

      throw error;
    }
  }

  // ✅ MEJORA: Validar opciones de email
  validateEmailOptions(options) {
    if (!options.to) {
      return "Recipient (to) is required";
    }

    if (!options.subject) {
      return "Subject is required";
    }

    if (!options.text && !options.html) {
      return "Either text or html content is required";
    }

    // Validar formato de destinatarios
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    for (const recipient of recipients) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipient)) {
        return `Invalid email format: ${recipient}`;
      }
    }

    return null;
  }

  // ✅ MEJORA: Construir opciones de email
  buildMailOptions(options) {
    const from = options.from || config.email.from || config.email.user;

    return {
      from: {
        name: config.email.fromName || "Inventory QR System",
        address: from,
      },
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo || config.email.replyTo || from,
      attachments: options.attachments,
      priority: options.priority || "normal",
      headers: {
        "X-Priority": options.priority === "high" ? "1" : "3",
        "X-Mailer": "Inventory QR System",
        ...options.headers,
      },
    };
  }

  // ✅ MEJORA: Decidir si reintentar
  shouldRetry(error, retryCount) {
    const maxRetries = 3;

    if (retryCount >= maxRetries) {
      return false;
    }

    // Reintentar errores temporales
    const retryableErrors = ["ECONNECTION", "ETIMEDOUT", "ESOCKET", "EAUTH"];

    return retryableErrors.some(
      (retryableError) =>
        error.message.includes(retryableError) || error.code === retryableError,
    );
  }

  // ✅ MEJORA: Calcular delay de reintento (exponential backoff)
  calculateRetryDelay(retryCount) {
    const baseDelay = 1000; // 1 segundo
    const maxDelay = 30000; // 30 segundos
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);

    // Agregar jitter aleatorio
    const jitter = delay * 0.1 * (Math.random() - 0.5);
    return delay + jitter;
  }

  // ✅ MEJORA: Sistema de cola de emails
  enqueueEmail(options, priority) {
    const emailJob = {
      options,
      priority,
      timestamp: new Date(),
      attempts: 0,
    };

    this.emailQueue.push(emailJob);

    // Ordenar por prioridad y timestamp
    this.emailQueue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.timestamp - b.timestamp;
    });

    logger.info("Email queued for later sending", {
      to: options.to,
      subject: options.subject,
      queueSize: this.emailQueue.length,
    });

    // Iniciar procesamiento si no está en curso
    if (!this.isProcessingQueue) {
      this.processQueue();
    }

    return {
      success: false,
      queued: true,
      queuePosition: this.emailQueue.length,
      message: "Email queued for sending when service becomes available",
    };
  }

  // ✅ MEJORA: Procesar cola de emails
  async processQueue() {
    if (
      this.isProcessingQueue ||
      !this.initialized ||
      this.emailQueue.length === 0
    ) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.emailQueue.length > 0 && this.initialized) {
        const emailJob = this.emailQueue.shift();

        try {
          emailJob.attempts++;
          await this.sendEmail(emailJob.options, emailJob.priority);

          logger.info("Queued email sent successfully", {
            to: emailJob.options.to,
            subject: emailJob.options.subject,
            attempts: emailJob.attempts,
          });
        } catch (error) {
          logger.error("Failed to send queued email", {
            to: emailJob.options.to,
            subject: emailJob.options.subject,
            attempts: emailJob.attempts,
            error: error.message,
          });

          // Reencolar si aún tiene intentos
          if (emailJob.attempts < 3) {
            this.emailQueue.push(emailJob);
          }

          // Pequeña pausa entre emails fallidos
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // ✅ CORRECCIÓN: Plantilla de bienvenida mejorada
  async sendWelcomeEmail(user, token = null, options = {}) {
    const template = constants.EMAIL_TEMPLATES?.WELCOME || {
      subject: "¡Bienvenido a nuestro sistema de inventario!",
    };

    const subject = options.subject || template.subject;
    const activationLink = token
      ? `${config.app.frontendUrl}/activate?token=${encodeURIComponent(token)}`
      : config.app.frontendUrl;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          /* Estilos responsivos y compatibles */
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
          }
          .highlight {
            background-color: #f8fafc;
            border-left: 4px solid #4F46E5;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 4px 4px 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            margin: 20px 0;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(79, 70, 229, 0.3);
          }
          .credentials {
            background: #f1f5f9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .credentials li {
            margin: 8px 0;
            padding-left: 20px;
            position: relative;
          }
          .credentials li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #10B981;
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #64748B;
            font-size: 12px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }
          .warning {
            background-color: #FEF3C7;
            border: 1px solid #F59E0B;
            color: #92400E;
            padding: 12px;
            border-radius: 6px;
            margin: 15px 0;
            font-size: 14px;
          }
          @media (max-width: 600px) {
            .container {
              margin: 10px;
              border-radius: 8px;
            }
            .header, .content {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${subject}</h1>
          </div>
          <div class="content">
            <p class="greeting">Hola <strong>${user.name}</strong>,</p>
            <p>¡Nos complace darte la bienvenida a nuestro sistema de gestión de inventario con códigos QR!</p>
            
            ${
              token
                ? `
            <div class="highlight">
              <p><strong>📋 Activa tu cuenta</strong></p>
              <p>Para comenzar a usar el sistema, necesitas activar tu cuenta haciendo clic en el siguiente botón:</p>
              <div style="text-align: center;">
                <a href="${activationLink}" class="button">Activar Mi Cuenta</a>
              </div>
              <p class="warning">
                <strong>⚠️ Importante:</strong> Este enlace es válido por 24 horas. 
                Si no funciona, copia y pega esta URL en tu navegador:<br>
                <small>${activationLink}</small>
              </p>
            </div>
            `
                : ""
            }
            
            <div class="credentials">
              <p><strong>📝 Tus credenciales de acceso:</strong></p>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Rol:</strong> ${user.role || "Usuario"}</li>
                ${user.company ? `<li><strong>Empresa:</strong> ${user.company}</li>` : ""}
              </ul>
            </div>
            
            <p>Con tu cuenta podrás:</p>
            <ul>
              <li>Gestionar productos y categorías</li>
              <li>Controlar inventario en tiempo real</li>
              <li>Generar y escanear códigos QR</li>
              <li>Generar reportes y estadísticas</li>
            </ul>
            
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar a nuestro equipo de soporte.</p>
            
            <p>¡Que tengas un excelente día!<br>
            <strong>El equipo de Inventory QR System</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Inventory QR System. Todos los derechos reservados.</p>
            <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
            <p><small>Si no solicitaste esta cuenta, por favor ignora este mensaje.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
¡Bienvenido a Inventory QR System!

Hola ${user.name},

Nos complace darte la bienvenida a nuestro sistema de gestión de inventario.

${
  token
    ? `
📋 ACTIVA TU CUENTA
Para activar tu cuenta, visita el siguiente enlace:
${activationLink}

Este enlace es válido por 24 horas.
`
    : ""
}

📝 TUS CREDENCIALES:
- Email: ${user.email}
- Rol: ${user.role || "Usuario"}
${user.company ? `- Empresa: ${user.company}` : ""}

Con tu cuenta podrás:
• Gestionar productos y categorías
• Controlar inventario en tiempo real
• Generar y escanear códigos QR
• Generar reportes y estadísticas

Si tienes alguna pregunta, contacta a nuestro equipo de soporte.

¡Que tengas un excelente día!
El equipo de Inventory QR System

---
© ${new Date().getFullYear()} Inventory QR System.
Este es un mensaje automático, no responder.
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      text: text.trim(),
      html,
      priority: "high",
      ...options,
    });
  }

  // ✅ NUEVO: Obtener estado del servicio de email
  getStatus() {
    return {
      initialized: this.initialized,
      queueSize: this.emailQueue.length,
      isProcessingQueue: this.isProcessingQueue,
      config: {
        host: config.email.host,
        port: config.email.port,
        user: config.email.user ? "Configured" : "Not configured",
        from: config.email.from,
        secure: config.email.secure,
      },
      stats: {
        initializationAttempts: this.initializationAttempts,
        maxInitializationAttempts: this.maxInitializationAttempts,
      },
    };
  }

  // ✅ NUEVO: Forzar reintento de inicialización
  retryInitialization() {
    logger.info("Forcing email service reinitialization...");
    this.initializationAttempts = 0;
    return this.initialize();
  }

  // ✅ NUEVO: Limpiar cola de emails
  clearQueue() {
    const clearedCount = this.emailQueue.length;
    this.emailQueue = [];
    logger.info(`Cleared ${clearedCount} emails from queue`);
    return clearedCount;
  }
}

// ✅ Exportar instancia única con manejo de errores
let emailHelperInstance = null;

function getEmailHelper() {
  if (!emailHelperInstance) {
    emailHelperInstance = new EmailHelper();
  }
  return emailHelperInstance;
}

module.exports = getEmailHelper();
