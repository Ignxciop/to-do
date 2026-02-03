import { jest } from "@jest/globals";
import * as authService from "../../src/services/auth.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../src/config/prisma.js";

beforeEach(() => {
    prisma.user.findUnique = jest.fn();
    prisma.user.create = jest.fn();
});

afterEach(() => jest.clearAllMocks());

describe("authService unit", () => {
    afterEach(() => jest.clearAllMocks());

    describe("register", () => {
        it("crea un usuario si el email no existe", async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue({
                id: 1,
                name: "Test",
                lastname: "User",
                email: "test@jest.com",
                createdAt: new Date(),
            });
            const data = {
                name: "Test",
                lastname: "User",
                email: "test@jest.com",
                password: "123456",
            };
            const user = await authService.register(data);
            expect(user.email).toBe(data.email);
        });
        it("lanza error si el email ya existe", async () => {
            prisma.user.findUnique.mockResolvedValue({ id: 1 });
            await expect(
                authService.register({ email: "test@jest.com" }),
            ).rejects.toThrow("El email ya está registrado");
        });
    });

    describe("login", () => {
        it("retorna usuario si credenciales son válidas", async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: 1,
                email: "test@jest.com",
                password: await bcrypt.hash("123456", 10),
            });
            const user = await authService.login({
                email: "test@jest.com",
                password: "123456",
            });
            expect(user).toBeDefined();
            expect(user.email).toBe("test@jest.com");
        });
        it("lanza error si usuario no existe", async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            await expect(
                authService.login({ email: "no@jest.com", password: "123456" }),
            ).rejects.toThrow("Credenciales inválidas");
        });
        it("lanza error si password es incorrecto", async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: 1,
                email: "test@jest.com",
                password: await bcrypt.hash("abcdef", 10),
            });
            await expect(
                authService.login({
                    email: "test@jest.com",
                    password: "123456",
                }),
            ).rejects.toThrow("Credenciales inválidas");
        });
    });

    describe("getUserById", () => {
        it("retorna usuario si existe", async () => {
            const fakeUser = {
                id: 1,
                name: "Test",
                lastname: "User",
                email: "test@jest.com",
                createdAt: new Date(),
            };
            prisma.user.findUnique.mockResolvedValue(fakeUser);
            const user = await authService.getUserById(1);
            expect(user).toBeDefined();
            expect(user.email).toBe(fakeUser.email);
        });
        it("retorna null si usuario no existe", async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            const user = await authService.getUserById(999);
            expect(user).toBeNull();
        });
    });
});
