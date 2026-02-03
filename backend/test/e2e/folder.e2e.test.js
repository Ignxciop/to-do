import request from "supertest";
import { prisma } from "../../src/config/prisma.js";
import app from "../../index.js";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const testUser = {
    name: "testjest_name",
    lastname: "testjest_lastname",
    email: `testjest_folder_${Date.now()}@mail.com`,
    password: "testjest_password",
};

let authToken;
let userId;

describe("Folder endpoints", () => {
    beforeAll(async () => {
        // Crear usuario de prueba
        userId = randomUUID();
        const user = await prisma.user.create({
            data: {
                id: userId,
                name: testUser.name,
                lastname: testUser.lastname,
                email: testUser.email,
                password: testUser.password,
            },
        });

        // Generar token JWT
        authToken = jwt.sign(
            { id: userId, email: user.email },
            process.env.JWT_SECRET || "access_secret",
            { expiresIn: "15m" },
        );
    });

    afterAll(async () => {
        await prisma.task.deleteMany({
            where: { userId },
        });
        await prisma.folder.deleteMany({
            where: { userId },
        });
        await prisma.user.deleteMany({
            where: { email: { contains: "testjest_folder_" } },
        });
        await prisma.$disconnect();
    });

    describe("POST /api/folder", () => {
        it("crea una carpeta sin parent", async () => {
            const folderData = {
                name: "Carpeta de prueba",
                color: "#FF0000",
                icon: "folder",
            };

            const res = await request(app)
                .post("/api/folder")
                .set("Authorization", `Bearer ${authToken}`)
                .send(folderData);

            expect(res.statusCode).toBe(201);
            expect(res.body.folder).toBeDefined();
            expect(res.body.folder.name).toBe(folderData.name);
            expect(res.body.folder.parentId).toBeNull();
        });

        it("crea una subcarpeta con parent válido", async () => {
            // Crear carpeta padre primero
            const parent = await prisma.folder.create({
                data: {
                    name: "Carpeta Padre",
                    userId,
                },
            });

            const folderData = {
                name: "Subcarpeta",
                parentId: parent.id,
            };

            const res = await request(app)
                .post("/api/folder")
                .set("Authorization", `Bearer ${authToken}`)
                .send(folderData);

            expect(res.statusCode).toBe(201);
            expect(res.body.folder.parentId).toBe(parent.id);
        });

        it("retorna 400 si falta el nombre", async () => {
            const res = await request(app)
                .post("/api/folder")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ color: "#00FF00" });

            expect(res.statusCode).toBe(400);
            expect(res.body.errors).toBeDefined();
        });

        it("retorna 401 sin autenticación", async () => {
            const res = await request(app)
                .post("/api/folder")
                .send({ name: "Carpeta" });

            expect(res.statusCode).toBe(401);
        });

        it("retorna 400 con parentId inválido (UUID malformado)", async () => {
            const res = await request(app)
                .post("/api/folder")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ name: "Carpeta", parentId: "invalid-uuid" });

            expect(res.statusCode).toBe(400);
        });
    });

    describe("GET /api/folders", () => {
        beforeAll(async () => {
            // Crear carpetas de prueba
            const parent = await prisma.folder.create({
                data: {
                    name: "Carpeta Raíz",
                    userId,
                },
            });

            await prisma.folder.createMany({
                data: [
                    {
                        name: "Carpeta 1",
                        userId,
                    },
                    {
                        name: "Subcarpeta 1",
                        parentId: parent.id,
                        userId,
                    },
                ],
            });
        });

        it("obtiene todas las carpetas del usuario", async () => {
            const res = await request(app)
                .get("/api/folders")
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.folders).toBeDefined();
            expect(Array.isArray(res.body.folders)).toBe(true);
            expect(res.body.folders.length).toBeGreaterThan(0);
        });

        it("filtra carpetas por parentId", async () => {
            const parent = await prisma.folder.findFirst({
                where: { name: "Carpeta Raíz", userId },
            });

            const res = await request(app)
                .get(`/api/folders?parentId=${parent.id}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(
                res.body.folders.every((f) => f.parentId === parent.id),
            ).toBe(true);
        });

        it("filtra carpetas de nivel raíz (sin parent)", async () => {
            const res = await request(app)
                .get("/api/folders?parentId=null")
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.folders.every((f) => f.parentId === null)).toBe(
                true,
            );
        });

        it("busca carpetas por texto", async () => {
            const res = await request(app)
                .get("/api/folders?search=Raíz")
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.folders.length).toBeGreaterThan(0);
        });

        it("retorna 401 sin autenticación", async () => {
            const res = await request(app).get("/api/folders");

            expect(res.statusCode).toBe(401);
        });
    });

    describe("GET /api/folder/:id", () => {
        let folderId;

        beforeAll(async () => {
            const folder = await prisma.folder.create({
                data: {
                    name: "Carpeta específica",
                    userId,
                },
            });
            folderId = folder.id;
        });

        it("obtiene una carpeta por ID", async () => {
            const res = await request(app)
                .get(`/api/folder/${folderId}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.folder).toBeDefined();
            expect(res.body.folder.id).toBe(folderId);
        });

        it("incluye subcarpetas y tareas en la respuesta", async () => {
            const res = await request(app)
                .get(`/api/folder/${folderId}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.folder.subfolders).toBeDefined();
            expect(res.body.folder.tasks).toBeDefined();
        });

        it("retorna 404 si la carpeta no existe", async () => {
            const fakeId = "00000000-0000-0000-0000-000000000000";
            const res = await request(app)
                .get(`/api/folder/${fakeId}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(404);
        });

        it("retorna 401 sin autenticación", async () => {
            const res = await request(app).get(`/api/folder/${folderId}`);

            expect(res.statusCode).toBe(401);
        });
    });

    describe("PUT /api/folder/:id", () => {
        let folderId;

        beforeEach(async () => {
            const folder = await prisma.folder.create({
                data: {
                    name: "Carpeta a actualizar",
                    userId,
                },
            });
            folderId = folder.id;
        });

        it("actualiza el nombre de una carpeta", async () => {
            const res = await request(app)
                .put(`/api/folder/${folderId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ name: "Nombre actualizado" });

            expect(res.statusCode).toBe(200);
            expect(res.body.folder.name).toBe("Nombre actualizado");
        });

        it("actualiza el color e icono", async () => {
            const res = await request(app)
                .put(`/api/folder/${folderId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ color: "#00FF00", icon: "star" });

            expect(res.statusCode).toBe(200);
            expect(res.body.folder.color).toBe("#00FF00");
            expect(res.body.folder.icon).toBe("star");
        });

        it("mueve una carpeta a otra como subcarpeta", async () => {
            const parent = await prisma.folder.create({
                data: {
                    name: "Nueva Carpeta Padre",
                    userId,
                },
            });

            const res = await request(app)
                .put(`/api/folder/${folderId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ parentId: parent.id });

            expect(res.statusCode).toBe(200);
            expect(res.body.folder.parentId).toBe(parent.id);
        });

        it("mueve una subcarpeta al nivel raíz", async () => {
            // Primero crear una subcarpeta
            const parent = await prisma.folder.create({
                data: {
                    name: "Padre Temporal",
                    userId,
                },
            });

            const subfolder = await prisma.folder.create({
                data: {
                    name: "Subcarpeta",
                    parentId: parent.id,
                    userId,
                },
            });

            // Luego moverla al nivel raíz
            const res = await request(app)
                .put(`/api/folder/${subfolder.id}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ parentId: null });

            expect(res.statusCode).toBe(200);
            expect(res.body.folder.parentId).toBeNull();
        });

        it("retorna 400 si intenta ser su propio padre", async () => {
            const res = await request(app)
                .put(`/api/folder/${folderId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ parentId: folderId });

            expect(res.statusCode).toBe(400);
        });

        it("retorna 400 si crea un ciclo (parent es descendiente)", async () => {
            // Crear estructura: A -> B -> C
            const folderA = await prisma.folder.create({
                data: { name: "Carpeta A", userId },
            });
            const folderB = await prisma.folder.create({
                data: { name: "Carpeta B", parentId: folderA.id, userId },
            });
            const folderC = await prisma.folder.create({
                data: { name: "Carpeta C", parentId: folderB.id, userId },
            });

            // Intentar hacer: A -> C (esto crearía un ciclo porque C es descendiente de A)
            const res = await request(app)
                .put(`/api/folder/${folderA.id}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ parentId: folderC.id });

            expect(res.statusCode).toBe(400);
        });

        it("retorna 404 si la carpeta no existe", async () => {
            const fakeId = "00000000-0000-0000-0000-000000000000";
            const res = await request(app)
                .put(`/api/folder/${fakeId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ name: "Nuevo nombre" });

            expect(res.statusCode).toBe(404);
        });

        it("retorna 401 sin autenticación", async () => {
            const res = await request(app)
                .put(`/api/folder/${folderId}`)
                .send({ name: "Nuevo nombre" });

            expect(res.statusCode).toBe(401);
        });
    });

    describe("DELETE /api/folder/:id", () => {
        let folderId;

        beforeEach(async () => {
            const folder = await prisma.folder.create({
                data: {
                    name: "Carpeta a eliminar",
                    userId,
                },
            });
            folderId = folder.id;
        });

        it("elimina una carpeta sin tareas ni subcarpetas", async () => {
            const res = await request(app)
                .delete(`/api/folder/${folderId}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBeDefined();

            // Verificar que fue eliminada
            const deletedFolder = await prisma.folder.findUnique({
                where: { id: folderId },
            });
            expect(deletedFolder).toBeNull();
        });

        it("elimina una carpeta con tareas (tareas pasan a folderId null)", async () => {
            // Crear tarea en la carpeta
            const task = await prisma.task.create({
                data: {
                    title: "Tarea en carpeta",
                    folderId,
                    userId,
                },
            });

            const res = await request(app)
                .delete(`/api/folder/${folderId}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);

            // Verificar que la tarea existe pero sin carpeta
            const updatedTask = await prisma.task.findUnique({
                where: { id: task.id },
            });
            expect(updatedTask).not.toBeNull();
            expect(updatedTask.folderId).toBeNull();
        });

        it("elimina una carpeta con subcarpetas (cascada)", async () => {
            // Crear subcarpetas
            const subfolder1 = await prisma.folder.create({
                data: {
                    name: "Subcarpeta 1",
                    parentId: folderId,
                    userId,
                },
            });

            const subfolder2 = await prisma.folder.create({
                data: {
                    name: "Subcarpeta 2",
                    parentId: folderId,
                    userId,
                },
            });

            const res = await request(app)
                .delete(`/api/folder/${folderId}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);

            // Verificar que las subcarpetas también fueron eliminadas
            const deletedSubfolder1 = await prisma.folder.findUnique({
                where: { id: subfolder1.id },
            });
            const deletedSubfolder2 = await prisma.folder.findUnique({
                where: { id: subfolder2.id },
            });

            expect(deletedSubfolder1).toBeNull();
            expect(deletedSubfolder2).toBeNull();
        });

        it("retorna 404 si la carpeta no existe", async () => {
            const fakeId = "00000000-0000-0000-0000-000000000000";
            const res = await request(app)
                .delete(`/api/folder/${fakeId}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(404);
        });

        it("retorna 401 sin autenticación", async () => {
            const res = await request(app).delete(`/api/folder/${folderId}`);

            expect(res.statusCode).toBe(401);
        });
    });
});
