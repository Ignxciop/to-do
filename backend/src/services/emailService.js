import nodemailer from "nodemailer";

/**
 * Configura el transportador de correo
 * En producción, debes configurar variables de entorno con tu servicio SMTP
 */
function createTransporter() {
    // Para desarrollo: usa Ethereal Email (servicio de prueba)
    // Para producción: configura tu servicio SMTP real

    if (process.env.NODE_ENV === "production") {
        // Configuración de producción con tu servicio SMTP real
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        // Para desarrollo y testing: transporte de prueba
        return nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: process.env.ETHEREAL_USER || "test@ethereal.email",
                pass: process.env.ETHEREAL_PASS || "test123",
            },
        });
    }
}

/**
 * Envía un correo con el código de verificación
 * @param {string} email - Email del destinatario
 * @param {string} name - Nombre del usuario
 * @param {string} code - Código de verificación
 * @returns {Promise<Object>} - Información del envío
 */
export async function sendVerificationEmail(email, name, code) {
    // En modo test, no enviar correos reales
    if (process.env.NODE_ENV === "test") {
        console.log(
            `📧 [TEST MODE] Código de verificación para ${email}: ${code}`,
        );
        return {
            success: true,
            messageId: "test-message-id",
            previewUrl: "https://test.com/preview",
        };
    }

    const transporter = createTransporter();

    const mailOptions = {
        from: '"To-Do App" <noreply@todoapp.com>',
        to: email,
        subject: "Verifica tu cuenta - To-Do App",
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .container {
                        background-color: #f9f9f9;
                        border-radius: 8px;
                        padding: 30px;
                        border: 1px solid #e0e0e0;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .code-box {
                        background-color: #4f46e5;
                        color: white;
                        font-size: 32px;
                        font-weight: bold;
                        text-align: center;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 30px 0;
                        letter-spacing: 8px;
                    }
                    .warning {
                        background-color: #fff3cd;
                        border-left: 4px solid #ffc107;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        font-size: 14px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>¡Bienvenido a To-Do App, ${name}!</h1>
                        <p>Gracias por registrarte. Estás a un paso de comenzar.</p>
                    </div>
                    
                    <p>Para activar tu cuenta, usa el siguiente código de verificación:</p>
                    
                    <div class="code-box">${code}</div>
                    
                    <div class="warning">
                        <strong>⏱️ Importante:</strong> Este código expirará en <strong>5 minutos</strong>.
                    </div>
                    
                    <p>Si no solicitaste esta cuenta, puedes ignorar este correo de forma segura.</p>
                    
                    <div class="footer">
                        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                        <p>&copy; ${new Date().getFullYear()} To-Do App. Todos los derechos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            ¡Bienvenido a To-Do App, ${name}!
            
            Para activar tu cuenta, usa el siguiente código de verificación:
            
            ${code}
            
            IMPORTANTE: Este código expirará en 5 minutos.
            
            Si no solicitaste esta cuenta, puedes ignorar este correo.
            
            © ${new Date().getFullYear()} To-Do App
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);

        // En desarrollo, muestra el preview URL
        if (process.env.NODE_ENV !== "production") {
            console.log("📧 Preview URL:", nodemailer.getTestMessageUrl(info));
        }

        return {
            success: true,
            messageId: info.messageId,
            previewUrl: nodemailer.getTestMessageUrl(info),
        };
    } catch (error) {
        console.error("Error enviando correo:", error);
        throw new Error("No se pudo enviar el correo de verificación");
    }
}
