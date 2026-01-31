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
        it("retorna token si credenciales son válidas", async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: 1,
                email: "test@jest.com",
                password: await bcrypt.hash("123456", 10),
            });
            const token = await authService.login({
                email: "test@jest.com",
                password: "123456",
            });
            expect(typeof token).toBe("string");
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

    describe("me", () => {
        it("retorna usuario si token es válido", async () => {
            const fakeUser = {
                id: 1,
                name: "Test",
                lastname: "User",
                email: "test@jest.com",
                createdAt: new Date(),
            };
            prisma.user.findUnique.mockResolvedValue(fakeUser);
            const token = jwt.sign(
                { id: 1, email: "test@jest.com" },
                "testsecret",
            );
            const req = { headers: { authorization: `Bearer ${token}` } };
            process.env.JWT_SECRET = "testsecret";
            const user = await authService.me(req);
            expect(user.email).toBe(fakeUser.email);
        });
        it("lanza error si token es inválido", async () => {
            const req = { headers: { authorization: "Bearer invalidtoken" } };
            process.env.JWT_SECRET = "testsecret";
            await expect(authService.me(req)).rejects.toThrow("Token inválido");
        });
    });
});
