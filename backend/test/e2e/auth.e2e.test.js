import request from "supertest";
import { prisma } from "../../src/config/prisma.js";
import app from "../../index.js";

const testUser = {
    name: "testjest_name",
    lastname: "testjest_lastname",
    email: `testjest_${Date.now()}@mail.com`,
    password: "testjest_password",
};

describe("Auth endpoints", () => {
    afterAll(async () => {
        await prisma.user.deleteMany({
            where: { email: { contains: "testjest_" } },
        });
        await prisma.$disconnect();
    });

    it("/api/register crea un usuario", async () => {
        const res = await request(app).post("/api/register").send(testUser);
        expect(res.statusCode).toBe(201);
        expect(res.body.email).toBe(testUser.email);
    });

    it("/api/login loguea un usuario", async () => {
        // Asegurarse de que el usuario existe
        await request(app).post("/api/register").send(testUser);
        const res = await request(app)
            .post("/api/login")
            .send({ email: testUser.email, password: testUser.password });
        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
    });
});
