// Lista de dominios de correo confiables
const TRUSTED_EMAIL_DOMAINS = [
    // Proveedores principales
    "gmail.com",
    "googlemail.com",
    "hotmail.com",
    "outlook.com",
    "live.com",
    "yahoo.com",
    "yahoo.es",
    "icloud.com",
    "me.com",
    "mac.com",

    // Proveedores corporativos comunes
    "protonmail.com",
    "proton.me",
    "aol.com",
    "zoho.com",
    "yandex.com",
    "gmx.com",
    "mail.com",

    // Dominios empresariales latinoamericanos
    "terra.com",
    "bol.com.br",
    "uol.com.br",
];

// Lista de dominios temporales conocidos (blacklist)
const TEMPORARY_EMAIL_DOMAINS = [
    "tempmail.com",
    "10minutemail.com",
    "guerrillamail.com",
    "mailinator.com",
    "maildrop.cc",
    "throwaway.email",
    "temp-mail.org",
    "getnada.com",
    "mohmal.com",
    "sharklasers.com",
    "guerrillamail.info",
    "grr.la",
    "guerrillamail.biz",
    "guerrillamail.de",
    "spam4.me",
    "trashmail.com",
    "yopmail.com",
    "fakeinbox.com",
    "emailondeck.com",
    "dispostable.com",
    "mintemail.com",
    "tempinbox.com",
];

/**
 * Valida que un email sea de un dominio confiable y no temporal
 * @param {string} email - Email a validar
 * @returns {Object} - { valid: boolean, error: string }
 */
export function validateEmailDomain(email) {
    if (!email || typeof email !== "string") {
        return { valid: false, error: "Email inválido" };
    }

    const emailLower = email.toLowerCase().trim();
    const domain = emailLower.split("@")[1];

    if (!domain) {
        return { valid: false, error: "Formato de email inválido" };
    }

    // Verificar si es un dominio temporal
    if (TEMPORARY_EMAIL_DOMAINS.includes(domain)) {
        return {
            valid: false,
            error: "No se permiten correos temporales. Por favor usa un correo permanente.",
        };
    }

    // Verificar si es un dominio confiable
    if (!TRUSTED_EMAIL_DOMAINS.includes(domain)) {
        return {
            valid: false,
            error: `El dominio ${domain} no está en la lista de proveedores confiables. Usa Gmail, Hotmail, Outlook, Yahoo, o iCloud.`,
        };
    }

    return { valid: true };
}

/**
 * Genera un código de verificación de 6 dígitos
 * @returns {string}
 */
export function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Calcula la fecha de expiración del código (5 minutos desde ahora)
 * @returns {Date}
 */
export function getCodeExpiry() {
    const now = new Date();
    return new Date(now.getTime() + 5 * 60 * 1000); // 5 minutos
}
