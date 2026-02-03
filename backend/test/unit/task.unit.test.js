import { jest } from "@jest/globals";
import * as taskService from "../../src/services/task.js";
import { prisma } from "../../src/config/prisma.js";

beforeEach(() => {
    prisma.task.findMany = jest.fn();
    prisma.task.findUnique = jest.fn();
    prisma.task.findFirst = jest.fn();
    prisma.task.create = jest.fn();
    prisma.task.update = jest.fn();
    prisma.task.delete = jest.fn();
    prisma.folder.findUnique = jest.fn();
});

afterEach(() => jest.clearAllMocks());

describe("taskService unit", () => {
    const userId = "user-uuid-123";
    const folderId = "folder-uuid-123";
    const taskId = "task-uuid-123";

    describe("getAllTasks", () => {
        it("retorna todas las tareas del usuario sin filtros", async () => {
            const mockTasks = [
                {
                    id: taskId,
                    title: "Test Task",
                    status: "pending",
                    userId,
                    folder: null,
                },
            ];
            prisma.task.findMany.mockResolvedValue(mockTasks);

            const tasks = await taskService.getAllTasks(userId);

            expect(tasks).toEqual(mockTasks);
            expect(prisma.task.findMany).toHaveBeenCalledWith({
                where: { userId },
                orderBy: { position: "asc" },
                include: {
                    folder: {
                        select: {
                            id: true,
                            name: true,
                            color: true,
                            icon: true,
                        },
                    },
                },
            });
        });

        it("retorna tareas filtradas por estado", async () => {
            const mockTasks = [
                {
                    id: taskId,
                    title: "Completed Task",
                    status: "completed",
                    userId,
                },
            ];
            prisma.task.findMany.mockResolvedValue(mockTasks);

            const tasks = await taskService.getAllTasks(userId, {
                status: "completed",
            });

            expect(tasks).toEqual(mockTasks);
            expect(prisma.task.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId, status: "completed" },
                }),
            );
        });

        it("retorna tareas filtradas por carpeta", async () => {
            const mockTasks = [];
            prisma.task.findMany.mockResolvedValue(mockTasks);

            await taskService.getAllTasks(userId, { folderId });

            expect(prisma.task.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId, folderId },
                }),
            );
        });

        it("retorna tareas sin carpeta cuando folderId es null", async () => {
            const mockTasks = [];
            prisma.task.findMany.mockResolvedValue(mockTasks);

            await taskService.getAllTasks(userId, { folderId: null });

            expect(prisma.task.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId, folderId: null },
                }),
            );
        });

        it("retorna tareas filtradas por búsqueda de texto", async () => {
            const mockTasks = [];
            prisma.task.findMany.mockResolvedValue(mockTasks);

            await taskService.getAllTasks(userId, { search: "importante" });

            expect(prisma.task.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userId,
                        OR: [
                            {
                                title: {
                                    contains: "importante",
                                    mode: "insensitive",
                                },
                            },
                            {
                                description: {
                                    contains: "importante",
                                    mode: "insensitive",
                                },
                            },
                        ],
                    }),
                }),
            );
        });
    });

    describe("getTaskById", () => {
        it("retorna una tarea si existe y pertenece al usuario", async () => {
            const mockTask = {
                id: taskId,
                title: "Test Task",
                userId,
                folder: null,
            };
            prisma.task.findUnique.mockResolvedValue(mockTask);

            const task = await taskService.getTaskById(taskId, userId);

            expect(task).toEqual(mockTask);
            expect(prisma.task.findUnique).toHaveBeenCalledWith({
                where: { id: taskId },
                include: {
                    folder: {
                        select: {
                            id: true,
                            name: true,
                            color: true,
                            icon: true,
                        },
                    },
                },
            });
        });

        it("lanza error si la tarea no existe", async () => {
            prisma.task.findUnique.mockResolvedValue(null);

            await expect(
                taskService.getTaskById(taskId, userId),
            ).rejects.toThrow("Tarea no encontrada");
        });

        it("lanza error si la tarea no pertenece al usuario", async () => {
            const mockTask = {
                id: taskId,
                title: "Test Task",
                userId: "otro-usuario",
            };
            prisma.task.findUnique.mockResolvedValue(mockTask);

            await expect(
                taskService.getTaskById(taskId, userId),
            ).rejects.toThrow("No tienes permiso para ver esta tarea");
        });
    });

    describe("createTask", () => {
        it("crea una tarea exitosamente sin carpeta", async () => {
            const taskData = {
                title: "Nueva Tarea",
                description: "Descripción",
                status: "pending",
                priority: "medium",
            };
            const mockTask = { id: taskId, ...taskData, userId };

            prisma.task.findFirst.mockResolvedValue(null);
            prisma.task.create.mockResolvedValue(mockTask);

            const task = await taskService.createTask(taskData, userId);

            expect(task).toEqual(mockTask);
            expect(prisma.task.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        title: taskData.title,
                        userId,
                        folderId: null,
                        position: 0,
                    }),
                }),
            );
        });

        it("crea una tarea con carpeta válida", async () => {
            const taskData = {
                title: "Nueva Tarea",
                folderId,
            };
            const mockFolder = { id: folderId, userId };
            const mockTask = { id: taskId, ...taskData, userId };

            prisma.folder.findUnique.mockResolvedValue(mockFolder);
            prisma.task.findFirst.mockResolvedValue(null);
            prisma.task.create.mockResolvedValue(mockTask);

            const task = await taskService.createTask(taskData, userId);

            expect(task).toEqual(mockTask);
            expect(prisma.folder.findUnique).toHaveBeenCalledWith({
                where: { id: folderId },
            });
        });

        it("lanza error si la carpeta no existe", async () => {
            const taskData = {
                title: "Nueva Tarea",
                folderId,
            };

            prisma.folder.findUnique.mockResolvedValue(null);

            await expect(
                taskService.createTask(taskData, userId),
            ).rejects.toThrow("Carpeta no encontrada");
        });

        it("lanza error si la carpeta no pertenece al usuario", async () => {
            const taskData = {
                title: "Nueva Tarea",
                folderId,
            };
            const mockFolder = { id: folderId, userId: "otro-usuario" };

            prisma.folder.findUnique.mockResolvedValue(mockFolder);

            await expect(
                taskService.createTask(taskData, userId),
            ).rejects.toThrow("No tienes permiso para usar esta carpeta");
        });

        it("asigna position automáticamente basándose en la última tarea", async () => {
            const taskData = { title: "Nueva Tarea" };
            const mockLastTask = { position: 5 };
            const mockTask = { id: taskId, ...taskData, userId, position: 6 };

            prisma.task.findFirst.mockResolvedValue(mockLastTask);
            prisma.task.create.mockResolvedValue(mockTask);

            await taskService.createTask(taskData, userId);

            expect(prisma.task.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        position: 6,
                    }),
                }),
            );
        });
    });

    describe("updateTask", () => {
        it("actualiza una tarea exitosamente", async () => {
            const existingTask = {
                id: taskId,
                title: "Tarea Original",
                status: "pending",
                userId,
            };
            const updateData = {
                title: "Tarea Actualizada",
                description: "Nueva descripción",
            };
            const updatedTask = { ...existingTask, ...updateData };

            prisma.task.findUnique.mockResolvedValue(existingTask);
            prisma.task.update.mockResolvedValue(updatedTask);

            const task = await taskService.updateTask(
                taskId,
                updateData,
                userId,
            );

            expect(task).toEqual(updatedTask);
            expect(prisma.task.update).toHaveBeenCalledWith({
                where: { id: taskId },
                data: updateData,
                include: expect.any(Object),
            });
        });

        it("establece completedAt cuando el estado cambia a completed", async () => {
            const existingTask = {
                id: taskId,
                title: "Tarea",
                status: "pending",
                userId,
            };
            const updateData = { status: "completed" };

            prisma.task.findUnique.mockResolvedValue(existingTask);
            prisma.task.update.mockResolvedValue({
                ...existingTask,
                ...updateData,
            });

            await taskService.updateTask(taskId, updateData, userId);

            expect(prisma.task.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        status: "completed",
                        completedAt: expect.any(Date),
                    }),
                }),
            );
        });

        it("limpia completedAt cuando el estado cambia de completed a otro", async () => {
            const existingTask = {
                id: taskId,
                title: "Tarea",
                status: "completed",
                userId,
            };
            const updateData = { status: "pending" };

            prisma.task.findUnique.mockResolvedValue(existingTask);
            prisma.task.update.mockResolvedValue({
                ...existingTask,
                ...updateData,
            });

            await taskService.updateTask(taskId, updateData, userId);

            expect(prisma.task.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        status: "pending",
                        completedAt: null,
                    }),
                }),
            );
        });

        it("permite cambiar de carpeta", async () => {
            const existingTask = {
                id: taskId,
                title: "Tarea",
                folderId: null,
                userId,
            };
            const newFolder = { id: folderId, userId };
            const updateData = { folderId };

            prisma.task.findUnique.mockResolvedValue(existingTask);
            prisma.folder.findUnique.mockResolvedValue(newFolder);
            prisma.task.update.mockResolvedValue({ ...existingTask, folderId });

            await taskService.updateTask(taskId, updateData, userId);

            expect(prisma.folder.findUnique).toHaveBeenCalled();
            expect(prisma.task.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        folderId,
                    }),
                }),
            );
        });

        it("permite eliminar la carpeta (folderId null)", async () => {
            const existingTask = {
                id: taskId,
                title: "Tarea",
                folderId: "old-folder-id",
                userId,
            };
            const updateData = { folderId: null };

            prisma.task.findUnique.mockResolvedValue(existingTask);
            prisma.task.update.mockResolvedValue({
                ...existingTask,
                folderId: null,
            });

            await taskService.updateTask(taskId, updateData, userId);

            expect(prisma.task.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        folderId: null,
                    }),
                }),
            );
        });

        it("lanza error si la tarea no existe", async () => {
            prisma.task.findUnique.mockResolvedValue(null);

            await expect(
                taskService.updateTask(taskId, {}, userId),
            ).rejects.toThrow("Tarea no encontrada");
        });

        it("lanza error si la tarea no pertenece al usuario", async () => {
            const existingTask = {
                id: taskId,
                title: "Tarea",
                userId: "otro-usuario",
            };
            prisma.task.findUnique.mockResolvedValue(existingTask);

            await expect(
                taskService.updateTask(taskId, {}, userId),
            ).rejects.toThrow("No tienes permiso para editar esta tarea");
        });

        it("lanza error si la nueva carpeta no existe", async () => {
            const existingTask = { id: taskId, title: "Tarea", userId };
            const updateData = { folderId };

            prisma.task.findUnique.mockResolvedValue(existingTask);
            prisma.folder.findUnique.mockResolvedValue(null);

            await expect(
                taskService.updateTask(taskId, updateData, userId),
            ).rejects.toThrow("Carpeta no encontrada");
        });
    });

    describe("deleteTask", () => {
        it("elimina una tarea exitosamente", async () => {
            const existingTask = { id: taskId, title: "Tarea", userId };

            prisma.task.findUnique.mockResolvedValue(existingTask);
            prisma.task.delete.mockResolvedValue(existingTask);

            const result = await taskService.deleteTask(taskId, userId);

            expect(result).toEqual({
                message: "Tarea eliminada correctamente",
            });
            expect(prisma.task.delete).toHaveBeenCalledWith({
                where: { id: taskId },
            });
        });

        it("lanza error si la tarea no existe", async () => {
            prisma.task.findUnique.mockResolvedValue(null);

            await expect(
                taskService.deleteTask(taskId, userId),
            ).rejects.toThrow("Tarea no encontrada");
        });

        it("lanza error si la tarea no pertenece al usuario", async () => {
            const existingTask = {
                id: taskId,
                title: "Tarea",
                userId: "otro-usuario",
            };
            prisma.task.findUnique.mockResolvedValue(existingTask);

            await expect(
                taskService.deleteTask(taskId, userId),
            ).rejects.toThrow("No tienes permiso para eliminar esta tarea");
        });
    });
});
