import request from "supertest";
import { prisma } from "../../src/config/prisma.js";
import app from "../../index.js";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const testUser = {
    name: "testjest_name",
    lastname: "testjest_lastname",
    email: `testjest_task_${Date.now()}@gmail.com`,
    password: "testjest_password",
};

let authToken;
let userId;
let testFolderId;

describe("Task endpoints", () => {
    beforeAll(async () => {
        // Crear usuario de prueba verificado
        userId = randomUUID();
        const user = await prisma.user.create({
            data: {
                id: userId,
                name: testUser.name,
                lastname: testUser.lastname,
                email: testUser.email,
                password: testUser.password,
                emailVerified: true,
            },
        });

        // Generar token JWT
        authToken = jwt.sign(
            { id: userId, email: user.email },
            process.env.JWT_SECRET || "access_secret",
            { expiresIn: "15m" },
        );

        // Crear una carpeta de prueba
        const folder = await prisma.folder.create({
            data: {
                name: "Test Folder",
                userId,
            },
        });
        testFolderId = folder.id;
    });

    afterAll(async () => {
        await prisma.task.deleteMany({
            where: { userId },
        });
        await prisma.folder.deleteMany({
            where: { userId },
        });
        await prisma.user.deleteMany({
            where: { email: { contains: "testjest_task_" } },
        });
        await prisma.$disconnect();
    });

    describe("POST /api/task", () => {
        it("crea una tarea sin carpeta", async () => {
            const taskData = {
                title: "Tarea de prueba",
                description: "Descripción de prueba",
                priority: "high",
            };

            const res = await request(app)
                .post("/api/task")
                .set("Authorization", `Bearer ${authToken}`)
                .send(taskData);

            expect(res.statusCode).toBe(201);
            expect(res.body.task).toBeDefined();
            expect(res.body.task.title).toBe(taskData.title);
            expect(res.body.task.status).toBe("pending");
            expect(res.body.task.folderId).toBeNull();
        });

        it("crea una tarea con carpeta", async () => {
            const taskData = {
                title: "Tarea en carpeta",
                folderId: testFolderId,
            };

            const res = await request(app)
                .post("/api/task")
                .set("Authorization", `Bearer ${authToken}`)
                .send(taskData);

            expect(res.statusCode).toBe(201);
            expect(res.body.task.folderId).toBe(testFolderId);
        });

        it("retorna 400 si falta el título", async () => {
            const res = await request(app)
                .post("/api/task")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ description: "Sin título" });

            expect(res.statusCode).toBe(400);
            expect(res.body.errors).toBeDefined();
        });

        it("retorna 401 sin autenticación", async () => {
            const res = await request(app)
                .post("/api/task")
                .send({ title: "Tarea" });

            expect(res.statusCode).toBe(401);
        });

        it("retorna 400 con estado inválido", async () => {
            const res = await request(app)
                .post("/api/task")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ title: "Tarea", status: "invalido" });

            expect(res.statusCode).toBe(400);
        });

        it("retorna 400 con prioridad inválida", async () => {
            const res = await request(app)
                .post("/api/task")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ title: "Tarea", priority: "invalida" });

            expect(res.statusCode).toBe(400);
        });
    });

    describe("GET /api/tasks", () => {
        beforeAll(async () => {
            // Crear algunas tareas de prueba
            await prisma.task.createMany({
                data: [
                    {
                        title: "Tarea 1",
                        status: "pending",
                        priority: "low",
                        userId,
                    },
                    {
                        title: "Tarea 2",
                        status: "completed",
                        priority: "high",
                        userId,
                    },
                    {
                        title: "Tarea en carpeta",
                        status: "in_progress",
                        folderId: testFolderId,
                        userId,
                    },
                ],
            });
        });

        it("obtiene todas las tareas del usuario", async () => {
            const res = await request(app)
                .get("/api/tasks")
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.tasks).toBeDefined();
            expect(Array.isArray(res.body.tasks)).toBe(true);
            expect(res.body.tasks.length).toBeGreaterThan(0);
        });

        it("filtra tareas por estado", async () => {
            const res = await request(app)
                .get("/api/tasks?status=completed")
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.tasks.every((t) => t.status === "completed")).toBe(
                true,
            );
        });

        it("filtra tareas por carpeta", async () => {
            const res = await request(app)
                .get(`/api/tasks?folderId=${testFolderId}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(
                res.body.tasks.every((t) => t.folderId === testFolderId),
            ).toBe(true);
        });

        it("filtra tareas sin carpeta", async () => {
            const res = await request(app)
                .get("/api/tasks?folderId=null")
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.tasks.every((t) => t.folderId === null)).toBe(true);
        });

        it("filtra tareas por prioridad", async () => {
            const res = await request(app)
                .get("/api/tasks?priority=high")
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.tasks.every((t) => t.priority === "high")).toBe(
                true,
            );
        });

        it("busca tareas por texto", async () => {
            const res = await request(app)
                .get("/api/tasks?search=carpeta")
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.tasks.length).toBeGreaterThan(0);
        });

        it("retorna 401 sin autenticación", async () => {
            const res = await request(app).get("/api/tasks");

            expect(res.statusCode).toBe(401);
        });
    });

    describe("GET /api/task/:id", () => {
        let taskId;

        beforeAll(async () => {
            const task = await prisma.task.create({
                data: {
                    title: "Tarea específica",
                    userId,
                },
            });
            taskId = task.id;
        });

        it("obtiene una tarea por ID", async () => {
            const res = await request(app)
                .get(`/api/task/${taskId}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.task).toBeDefined();
            expect(res.body.task.id).toBe(taskId);
        });

        it("retorna 404 si la tarea no existe", async () => {
            const fakeId = "00000000-0000-0000-0000-000000000000";
            const res = await request(app)
                .get(`/api/task/${fakeId}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(404);
        });

        it("retorna 401 sin autenticación", async () => {
            const res = await request(app).get(`/api/task/${taskId}`);

            expect(res.statusCode).toBe(401);
        });
    });

    describe("PUT /api/task/:id", () => {
        let taskId;

        beforeEach(async () => {
            const task = await prisma.task.create({
                data: {
                    title: "Tarea a actualizar",
                    status: "pending",
                    userId,
                },
            });
            taskId = task.id;
        });

        it("actualiza el título de una tarea", async () => {
            const res = await request(app)
                .put(`/api/task/${taskId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ title: "Título actualizado" });

            expect(res.statusCode).toBe(200);
            expect(res.body.task.title).toBe("Título actualizado");
        });

        it("actualiza el estado a completed y establece completedAt", async () => {
            const res = await request(app)
                .put(`/api/task/${taskId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ status: "completed" });

            expect(res.statusCode).toBe(200);
            expect(res.body.task.status).toBe("completed");
            expect(res.body.task.completedAt).not.toBeNull();
        });

        it("cambia la tarea a una carpeta", async () => {
            const res = await request(app)
                .put(`/api/task/${taskId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ folderId: testFolderId });

            expect(res.statusCode).toBe(200);
            expect(res.body.task.folderId).toBe(testFolderId);
        });

        it("quita la tarea de una carpeta", async () => {
            // Primero asignar a carpeta
            await request(app)
                .put(`/api/task/${taskId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ folderId: testFolderId });

            // Luego quitar
            const res = await request(app)
                .put(`/api/task/${taskId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ folderId: null });

            expect(res.statusCode).toBe(200);
            expect(res.body.task.folderId).toBeNull();
        });

        it("retorna 404 si la tarea no existe", async () => {
            const fakeId = "00000000-0000-0000-0000-000000000000";
            const res = await request(app)
                .put(`/api/task/${fakeId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ title: "Nuevo título" });

            expect(res.statusCode).toBe(404);
        });

        it("retorna 401 sin autenticación", async () => {
            const res = await request(app)
                .put(`/api/task/${taskId}`)
                .send({ title: "Nuevo título" });

            expect(res.statusCode).toBe(401);
        });

        it("retorna 400 con estado inválido", async () => {
            const res = await request(app)
                .put(`/api/task/${taskId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ status: "invalido" });

            expect(res.statusCode).toBe(400);
        });
    });

    describe("DELETE /api/task/:id", () => {
        let taskId;

        beforeEach(async () => {
            const task = await prisma.task.create({
                data: {
                    title: "Tarea a eliminar",
                    userId,
                },
            });
            taskId = task.id;
        });

        it("elimina una tarea", async () => {
            const res = await request(app)
                .delete(`/api/task/${taskId}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBeDefined();

            // Verificar que fue eliminada
            const deletedTask = await prisma.task.findUnique({
                where: { id: taskId },
            });
            expect(deletedTask).toBeNull();
        });

        it("retorna 404 si la tarea no existe", async () => {
            const fakeId = "00000000-0000-0000-0000-000000000000";
            const res = await request(app)
                .delete(`/api/task/${fakeId}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(404);
        });

        it("retorna 401 sin autenticación", async () => {
            const res = await request(app).delete(`/api/task/${taskId}`);

            expect(res.statusCode).toBe(401);
        });
    });
});
