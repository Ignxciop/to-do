import { jest } from "@jest/globals";
import * as folderService from "../../src/services/folder.js";
import { prisma } from "../../src/config/prisma.js";

beforeEach(() => {
    prisma.folder.findMany = jest.fn();
    prisma.folder.findUnique = jest.fn();
    prisma.folder.findFirst = jest.fn();
    prisma.folder.create = jest.fn();
    prisma.folder.update = jest.fn();
    prisma.folder.delete = jest.fn();
});

afterEach(() => jest.clearAllMocks());

describe("folderService unit", () => {
    const userId = "user-uuid-123";
    const folderId = "folder-uuid-123";
    const parentFolderId = "parent-folder-uuid-123";

    describe("getAllFolders", () => {
        it("retorna todas las carpetas del usuario sin filtros", async () => {
            const mockFolders = [
                {
                    id: folderId,
                    name: "Test Folder",
                    userId,
                    subfolders: [],
                    _count: { tasks: 5 },
                },
            ];
            prisma.folder.findMany.mockResolvedValue(mockFolders);

            const folders = await folderService.getAllFolders(userId);

            expect(folders).toEqual(mockFolders);
            expect(prisma.folder.findMany).toHaveBeenCalledWith({
                where: { userId },
                orderBy: { position: "asc" },
                include: {
                    subfolders: { orderBy: { position: "asc" } },
                    _count: { select: { tasks: true } },
                },
            });
        });

        it("retorna carpetas filtradas por parentId", async () => {
            const mockFolders = [];
            prisma.folder.findMany.mockResolvedValue(mockFolders);

            await folderService.getAllFolders(userId, {
                parentId: parentFolderId,
            });

            expect(prisma.folder.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId, parentId: parentFolderId },
                }),
            );
        });

        it("retorna carpetas de nivel raíz cuando parentId es null", async () => {
            const mockFolders = [];
            prisma.folder.findMany.mockResolvedValue(mockFolders);

            await folderService.getAllFolders(userId, { parentId: null });

            expect(prisma.folder.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId, parentId: null },
                }),
            );
        });

        it("retorna carpetas filtradas por búsqueda de texto", async () => {
            const mockFolders = [];
            prisma.folder.findMany.mockResolvedValue(mockFolders);

            await folderService.getAllFolders(userId, { search: "trabajo" });

            expect(prisma.folder.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userId,
                        name: { contains: "trabajo", mode: "insensitive" },
                    }),
                }),
            );
        });
    });

    describe("getFolderById", () => {
        it("retorna una carpeta si existe y pertenece al usuario", async () => {
            const mockFolder = {
                id: folderId,
                name: "Test Folder",
                userId,
                subfolders: [],
                tasks: [],
                parent: null,
            };
            prisma.folder.findUnique.mockResolvedValue(mockFolder);

            const folder = await folderService.getFolderById(folderId, userId);

            expect(folder).toEqual(mockFolder);
            expect(prisma.folder.findUnique).toHaveBeenCalledWith({
                where: { id: folderId },
                include: {
                    subfolders: { orderBy: { position: "asc" } },
                    tasks: { orderBy: { position: "asc" } },
                    parent: { select: { id: true, name: true } },
                },
            });
        });

        it("lanza error si la carpeta no existe", async () => {
            prisma.folder.findUnique.mockResolvedValue(null);

            await expect(
                folderService.getFolderById(folderId, userId),
            ).rejects.toThrow("Carpeta no encontrada");
        });

        it("lanza error si la carpeta no pertenece al usuario", async () => {
            const mockFolder = {
                id: folderId,
                name: "Test Folder",
                userId: "otro-usuario",
            };
            prisma.folder.findUnique.mockResolvedValue(mockFolder);

            await expect(
                folderService.getFolderById(folderId, userId),
            ).rejects.toThrow("No tienes permiso para ver esta carpeta");
        });
    });

    describe("createFolder", () => {
        it("crea una carpeta exitosamente sin parent", async () => {
            const folderData = {
                name: "Nueva Carpeta",
                color: "#FF0000",
                icon: "folder",
            };
            const mockFolder = { id: folderId, ...folderData, userId };

            prisma.folder.findFirst.mockResolvedValue(null);
            prisma.folder.create.mockResolvedValue(mockFolder);

            const folder = await folderService.createFolder(folderData, userId);

            expect(folder).toEqual(mockFolder);
            expect(prisma.folder.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        name: folderData.name,
                        userId,
                        parentId: null,
                        position: 0,
                    }),
                }),
            );
        });

        it("crea una subcarpeta con parent válido", async () => {
            const folderData = {
                name: "Subcarpeta",
                parentId: parentFolderId,
            };
            const mockParent = { id: parentFolderId, userId };
            const mockFolder = { id: folderId, ...folderData, userId };

            prisma.folder.findUnique.mockResolvedValue(mockParent);
            prisma.folder.findFirst.mockResolvedValue(null);
            prisma.folder.create.mockResolvedValue(mockFolder);

            const folder = await folderService.createFolder(folderData, userId);

            expect(folder).toEqual(mockFolder);
            expect(prisma.folder.findUnique).toHaveBeenCalledWith({
                where: { id: parentFolderId },
            });
        });

        it("lanza error si el parent no existe", async () => {
            const folderData = {
                name: "Subcarpeta",
                parentId: parentFolderId,
            };

            prisma.folder.findUnique.mockResolvedValue(null);

            await expect(
                folderService.createFolder(folderData, userId),
            ).rejects.toThrow("Carpeta padre no encontrada");
        });

        it("lanza error si el parent no pertenece al usuario", async () => {
            const folderData = {
                name: "Subcarpeta",
                parentId: parentFolderId,
            };
            const mockParent = { id: parentFolderId, userId: "otro-usuario" };

            prisma.folder.findUnique.mockResolvedValue(mockParent);

            await expect(
                folderService.createFolder(folderData, userId),
            ).rejects.toThrow("No tienes permiso para usar esta carpeta padre");
        });

        it("asigna position automáticamente basándose en la última carpeta", async () => {
            const folderData = { name: "Nueva Carpeta" };
            const mockLastFolder = { position: 3 };
            const mockFolder = {
                id: folderId,
                ...folderData,
                userId,
                position: 4,
            };

            prisma.folder.findFirst.mockResolvedValue(mockLastFolder);
            prisma.folder.create.mockResolvedValue(mockFolder);

            await folderService.createFolder(folderData, userId);

            expect(prisma.folder.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        position: 4,
                    }),
                }),
            );
        });
    });

    describe("updateFolder", () => {
        it("actualiza una carpeta exitosamente", async () => {
            const existingFolder = {
                id: folderId,
                name: "Carpeta Original",
                userId,
            };
            const updateData = {
                name: "Carpeta Actualizada",
                color: "#00FF00",
            };
            const updatedFolder = { ...existingFolder, ...updateData };

            prisma.folder.findUnique.mockResolvedValue(existingFolder);
            prisma.folder.update.mockResolvedValue(updatedFolder);

            const folder = await folderService.updateFolder(
                folderId,
                updateData,
                userId,
            );

            expect(folder).toEqual(updatedFolder);
            expect(prisma.folder.update).toHaveBeenCalledWith({
                where: { id: folderId },
                data: updateData,
                include: expect.any(Object),
            });
        });

        it("permite cambiar de parent", async () => {
            const existingFolder = {
                id: folderId,
                name: "Carpeta",
                parentId: null,
                userId,
            };
            const newParent = { id: parentFolderId, userId };
            const updateData = { parentId: parentFolderId };

            prisma.folder.findUnique
                .mockResolvedValueOnce(existingFolder)
                .mockResolvedValueOnce(newParent)
                .mockResolvedValueOnce(null); // Para checkIfDescendant

            prisma.folder.update.mockResolvedValue({
                ...existingFolder,
                ...updateData,
            });

            await folderService.updateFolder(folderId, updateData, userId);

            expect(prisma.folder.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        parentId: parentFolderId,
                    }),
                }),
            );
        });

        it("lanza error si intenta ser su propio padre", async () => {
            const existingFolder = {
                id: folderId,
                name: "Carpeta",
                userId,
            };
            const updateData = { parentId: folderId };

            prisma.folder.findUnique.mockResolvedValue(existingFolder);

            await expect(
                folderService.updateFolder(folderId, updateData, userId),
            ).rejects.toThrow("Una carpeta no puede ser su propio padre");
        });

        it("lanza error si el nuevo parent no existe", async () => {
            const existingFolder = {
                id: folderId,
                name: "Carpeta",
                userId,
            };
            const updateData = { parentId: parentFolderId };

            prisma.folder.findUnique
                .mockResolvedValueOnce(existingFolder)
                .mockResolvedValueOnce(null);

            await expect(
                folderService.updateFolder(folderId, updateData, userId),
            ).rejects.toThrow("Carpeta padre no encontrada");
        });

        it("lanza error si crea un ciclo (parent es descendiente)", async () => {
            const existingFolder = {
                id: folderId,
                name: "Carpeta",
                userId,
            };
            const newParent = {
                id: parentFolderId,
                userId,
                parentId: folderId,
            };
            const updateData = { parentId: parentFolderId };

            prisma.folder.findUnique
                .mockResolvedValueOnce(existingFolder)
                .mockResolvedValueOnce(newParent)
                .mockResolvedValueOnce(newParent)
                .mockResolvedValueOnce({ id: folderId, parentId: null });

            await expect(
                folderService.updateFolder(folderId, updateData, userId),
            ).rejects.toThrow(
                "No puedes mover una carpeta dentro de una de sus subcarpetas",
            );
        });

        it("lanza error si la carpeta no existe", async () => {
            prisma.folder.findUnique.mockResolvedValue(null);

            await expect(
                folderService.updateFolder(folderId, {}, userId),
            ).rejects.toThrow("Carpeta no encontrada");
        });

        it("lanza error si la carpeta no pertenece al usuario", async () => {
            const existingFolder = {
                id: folderId,
                name: "Carpeta",
                userId: "otro-usuario",
            };
            prisma.folder.findUnique.mockResolvedValue(existingFolder);

            await expect(
                folderService.updateFolder(folderId, {}, userId),
            ).rejects.toThrow("No tienes permiso para editar esta carpeta");
        });
    });

    describe("deleteFolder", () => {
        it("elimina una carpeta exitosamente", async () => {
            const existingFolder = {
                id: folderId,
                name: "Carpeta",
                userId,
                subfolders: [],
            };

            prisma.folder.findUnique.mockResolvedValue(existingFolder);
            prisma.folder.delete.mockResolvedValue(existingFolder);

            const result = await folderService.deleteFolder(folderId, userId);

            expect(result).toEqual({
                message: "Carpeta eliminada correctamente",
            });
            expect(prisma.folder.delete).toHaveBeenCalledWith({
                where: { id: folderId },
            });
        });

        it("elimina una carpeta con subcarpetas (cascada)", async () => {
            const existingFolder = {
                id: folderId,
                name: "Carpeta",
                userId,
                subfolders: [{ id: "sub-1" }, { id: "sub-2" }],
            };

            prisma.folder.findUnique.mockResolvedValue(existingFolder);
            prisma.folder.delete.mockResolvedValue(existingFolder);

            await folderService.deleteFolder(folderId, userId);

            expect(prisma.folder.delete).toHaveBeenCalledWith({
                where: { id: folderId },
            });
        });

        it("lanza error si la carpeta no existe", async () => {
            prisma.folder.findUnique.mockResolvedValue(null);

            await expect(
                folderService.deleteFolder(folderId, userId),
            ).rejects.toThrow("Carpeta no encontrada");
        });

        it("lanza error si la carpeta no pertenece al usuario", async () => {
            const existingFolder = {
                id: folderId,
                name: "Carpeta",
                userId: "otro-usuario",
                subfolders: [],
            };
            prisma.folder.findUnique.mockResolvedValue(existingFolder);

            await expect(
                folderService.deleteFolder(folderId, userId),
            ).rejects.toThrow("No tienes permiso para eliminar esta carpeta");
        });
    });
});
