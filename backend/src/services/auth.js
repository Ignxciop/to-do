import { prisma } from "../config/prisma.js";
import bcrypt from "bcryptjs";
import {
    validateEmailDomain,
    generateVerificationCode,
    getCodeExpiry,
} from "../utils/emailValidator.js";
import { sendVerificationEmail } from "./emailService.js";

export async function register(data) {
    const { name, lastname, email, password } = data;

    // Validar dominio de correo
    const emailValidation = validateEmailDomain(email);
    if (!emailValidation.valid) {
        throw new Error(emailValidation.error);
    }

    // Verificar si el email ya existe
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        // Si existe pero no está verificado y el código expiró, permitir re-registro
        if (
            !existing.emailVerified &&
            existing.verificationCodeExpiry &&
            new Date() > existing.verificationCodeExpiry
        ) {
            // Eliminar la cuenta no verificada anterior
            await prisma.user.delete({ where: { email } });
        } else if (existing.emailVerified) {
            throw new Error("El email ya está registrado");
        } else {
            throw new Error(
                "El email ya está en proceso de verificación. Verifica tu correo o espera a que expire el código para volver a intentarlo.",
            );
        }
    }

    const hashed = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();
    const verificationCodeExpiry = getCodeExpiry();

    const user = await prisma.user.create({
        data: {
            name,
            lastname,
            email,
            password: hashed,
            emailVerified: false,
            verificationCode,
            verificationCodeExpiry,
        },
    });

    // Enviar correo de verificación
    try {
        await sendVerificationEmail(email, name, verificationCode);
    } catch (emailError) {
        // Si falla el envío del correo, eliminar el usuario y lanzar error
        await prisma.user.delete({ where: { id: user.id } });
        throw new Error(
            "No se pudo enviar el correo de verificación. Por favor intenta nuevamente.",
        );
    }

    return {
        id: user.id,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
    };
}

export async function login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Credenciales inválidas");

    // Verificar que la cuenta esté verificada
    if (!user.emailVerified) {
        throw new Error(
            "Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.",
        );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Credenciales inválidas");
    return user;
}

export async function verifyEmail({ email, code }) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new Error("Usuario no encontrado");
    }

    if (user.emailVerified) {
        throw new Error("Esta cuenta ya está verificada");
    }

    if (!user.verificationCode || !user.verificationCodeExpiry) {
        throw new Error("No hay código de verificación pendiente");
    }

    // Verificar si el código expiró
    if (new Date() > user.verificationCodeExpiry) {
        throw new Error(
            "El código de verificación ha expirado. Solicita uno nuevo.",
        );
    }

    // Verificar que el código coincida
    if (user.verificationCode !== code) {
        throw new Error("Código de verificación inválido");
    }

    // Marcar como verificado y limpiar el código
    const verifiedUser = await prisma.user.update({
        where: { email },
        data: {
            emailVerified: true,
            verificationCode: null,
            verificationCodeExpiry: null,
        },
    });

    return {
        id: verifiedUser.id,
        name: verifiedUser.name,
        lastname: verifiedUser.lastname,
        email: verifiedUser.email,
        emailVerified: verifiedUser.emailVerified,
    };
}

export async function resendVerificationCode(email) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new Error("Usuario no encontrado");
    }

    if (user.emailVerified) {
        throw new Error("Esta cuenta ya está verificada");
    }

    // Generar nuevo código
    const verificationCode = generateVerificationCode();
    const verificationCodeExpiry = getCodeExpiry();

    await prisma.user.update({
        where: { email },
        data: {
            verificationCode,
            verificationCodeExpiry,
        },
    });

    // Enviar nuevo correo
    try {
        await sendVerificationEmail(email, user.name, verificationCode);
    } catch (emailError) {
        throw new Error(
            "No se pudo enviar el correo de verificación. Por favor intenta nuevamente.",
        );
    }

    return {
        message: "Código de verificación enviado exitosamente",
        email: user.email,
    };
}

export async function getUserById(id) {
    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
            createdAt: true,
        },
    });
}
