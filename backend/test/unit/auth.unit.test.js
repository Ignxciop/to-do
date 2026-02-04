import { jest } from "@jest/globals";
import * as authService from "../../src/services/auth.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../src/config/prisma.js";
import * as emailService from "../../src/services/emailService.js";

// Mock del servicio de email
jest.unstable_mockModule("../../src/services/emailService.js", () => ({
    sendVerificationEmail: jest.fn().mockResolvedValue({
        success: true,
        messageId: "test-message-id",
    }),
}));

beforeEach(() => {
    prisma.user.findUnique = jest.fn();
    prisma.user.create = jest.fn();
    prisma.user.update = jest.fn();
    prisma.user.delete = jest.fn();
});

afterEach(() => jest.clearAllMocks());

describe("authService unit", () => {
    afterEach(() => jest.clearAllMocks());

    describe("register", () => {
        it("crea un usuario si el email no existe y envía código de verificación", async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue({
                id: "uuid-test",
                name: "Test",
                lastname: "User",
                email: "test@gmail.com",
                emailVerified: false,
                verificationCode: "123456",
                verificationCodeExpiry: new Date(Date.now() + 5 * 60 * 1000),
                createdAt: new Date(),
            });
            const data = {
                name: "Test",
                lastname: "User",
                email: "test@gmail.com",
                password: "123456",
            };
            const user = await authService.register(data);
            expect(user.email).toBe(data.email);
            expect(user.emailVerified).toBe(false);
        });

        it("lanza error si el email ya existe y está verificado", async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: "uuid-test",
                email: "test@gmail.com",
                emailVerified: true,
            });
            await expect(
                authService.register({ email: "test@gmail.com" }),
            ).rejects.toThrow("El email ya está registrado");
        });

        it("lanza error si el dominio no es confiable", async () => {
            await expect(
                authService.register({
                    name: "Test",
                    lastname: "User",
                    email: "test@tempmail.com",
                    password: "123456",
                }),
            ).rejects.toThrow("No se permiten correos temporales");
        });
    });

    describe("login", () => {
        it("retorna usuario si credenciales son válidas y cuenta está verificada", async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: "uuid-test",
                email: "test@gmail.com",
                password: await bcrypt.hash("123456", 10),
                emailVerified: true,
            });
            const user = await authService.login({
                email: "test@gmail.com",
                password: "123456",
            });
            expect(user).toBeDefined();
            expect(user.email).toBe("test@gmail.com");
        });

        it("lanza error si usuario no existe", async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            await expect(
                authService.login({
                    email: "no@gmail.com",
                    password: "123456",
                }),
            ).rejects.toThrow("Credenciales inválidas");
        });

        it("lanza error si password es incorrecto", async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: "uuid-test",
                email: "test@gmail.com",
                password: await bcrypt.hash("abcdef", 10),
                emailVerified: true,
            });
            await expect(
                authService.login({
                    email: "test@gmail.com",
                    password: "123456",
                }),
            ).rejects.toThrow("Credenciales inválidas");
        });

        it("lanza error si la cuenta no está verificada", async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: "uuid-test",
                email: "test@gmail.com",
                password: await bcrypt.hash("123456", 10),
                emailVerified: false,
            });
            await expect(
                authService.login({
                    email: "test@gmail.com",
                    password: "123456",
                }),
            ).rejects.toThrow("Debes verificar tu correo electrónico");
        });
    });

    describe("getUserById", () => {
        it("retorna usuario si existe", async () => {
            const fakeUser = {
                id: "uuid-test",
                name: "Test",
                lastname: "User",
                email: "test@gmail.com",
                createdAt: new Date(),
            };
            prisma.user.findUnique.mockResolvedValue(fakeUser);
            const user = await authService.getUserById("uuid-test");
            expect(user).toBeDefined();
            expect(user.email).toBe(fakeUser.email);
        });
        it("retorna null si usuario no existe", async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            const user = await authService.getUserById("uuid-999");
            expect(user).toBeNull();
        });
    });

    describe("verifyEmail", () => {
        it("verifica el email si el código es válido", async () => {
            const futureDate = new Date(Date.now() + 5 * 60 * 1000);
            prisma.user.findUnique.mockResolvedValue({
                id: "uuid-test",
                email: "test@gmail.com",
                emailVerified: false,
                verificationCode: "123456",
                verificationCodeExpiry: futureDate,
            });
            prisma.user.update.mockResolvedValue({
                id: "uuid-test",
                name: "Test",
                lastname: "User",
                email: "test@gmail.com",
                emailVerified: true,
                verificationCode: null,
                verificationCodeExpiry: null,
            });
            const result = await authService.verifyEmail({
                email: "test@gmail.com",
                code: "123456",
            });
            expect(result.emailVerified).toBe(true);
        });

        it("lanza error si el código expiró", async () => {
            const pastDate = new Date(Date.now() - 1000);
            prisma.user.findUnique.mockResolvedValue({
                id: "uuid-test",
                email: "test@gmail.com",
                emailVerified: false,
                verificationCode: "123456",
                verificationCodeExpiry: pastDate,
            });
            await expect(
                authService.verifyEmail({
                    email: "test@gmail.com",
                    code: "123456",
                }),
            ).rejects.toThrow("El código de verificación ha expirado");
        });

        it("lanza error si el código es inválido", async () => {
            const futureDate = new Date(Date.now() + 5 * 60 * 1000);
            prisma.user.findUnique.mockResolvedValue({
                id: "uuid-test",
                email: "test@gmail.com",
                emailVerified: false,
                verificationCode: "123456",
                verificationCodeExpiry: futureDate,
            });
            await expect(
                authService.verifyEmail({
                    email: "test@gmail.com",
                    code: "654321",
                }),
            ).rejects.toThrow("Código de verificación inválido");
        });
    });
});
