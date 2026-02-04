import request from "supertest";
import { prisma } from "../../src/config/prisma.js";
import app from "../../index.js";

const testUser = {
    name: "testjest_name",
    lastname: "testjest_lastname",
    email: `testjest_${Date.now()}@gmail.com`, // Usar dominio confiable
    password: "testjest_password",
};

describe("Auth endpoints", () => {
    afterAll(async () => {
        await prisma.user.deleteMany({
            where: { email: { contains: "testjest_" } },
        });
        await prisma.$disconnect();
    });

    it("/api/auth/register crea un usuario sin verificar", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send(testUser);
        expect(res.statusCode).toBe(201);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.email).toBe(testUser.email);
        expect(res.body.user.emailVerified).toBe(false);
        expect(res.body.accessToken).toBeUndefined(); // No debe haber token hasta verificar
    });

    it("/api/auth/verify-email verifica un usuario", async () => {
        // Primero registrar el usuario
        await request(app).post("/api/auth/register").send(testUser);

        // Obtener el código de la base de datos (en producción vendría del email)
        const user = await prisma.user.findUnique({
            where: { email: testUser.email },
        });

        const res = await request(app)
            .post("/api/auth/verify-email")
            .send({ email: testUser.email, code: user.verificationCode });

        expect(res.statusCode).toBe(200);
        expect(res.body.user.emailVerified).toBe(true);
        expect(res.body.accessToken).toBeDefined();
    });

    it("/api/auth/login loguea un usuario verificado", async () => {
        // Asegurarse de que el usuario existe y está verificado
        await request(app).post("/api/auth/register").send(testUser);
        const user = await prisma.user.findUnique({
            where: { email: testUser.email },
        });
        await request(app)
            .post("/api/auth/verify-email")
            .send({ email: testUser.email, code: user.verificationCode });

        // Ahora intentar login
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: testUser.email, password: testUser.password });
        expect(res.statusCode).toBe(200);
        expect(res.body.accessToken).toBeDefined();
    });

    it("/api/auth/login falla si el usuario no está verificado", async () => {
        const unverifiedUser = {
            ...testUser,
            email: `unverified_${Date.now()}@gmail.com`,
        };
        await request(app).post("/api/auth/register").send(unverifiedUser);

        const res = await request(app).post("/api/auth/login").send({
            email: unverifiedUser.email,
            password: unverifiedUser.password,
        });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toContain("verificar tu correo");
    });

    it("/api/auth/resend-verification reenvía el código", async () => {
        const resendUser = {
            ...testUser,
            email: `resend_${Date.now()}@gmail.com`,
        };
        await request(app).post("/api/auth/register").send(resendUser);

        const res = await request(app)
            .post("/api/auth/resend-verification")
            .send({ email: resendUser.email });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toContain("Código de verificación enviado");
    });
});
