import { prisma } from "../config/prisma.js";

export async function getAllFolders(userId, filters = {}) {
    const { parentId, search, sortBy = "position", order = "asc" } = filters;

    const where = { userId };

    // Si parentId está presente, filtrar por carpetas con ese parent
    // Si parentId es null o "null", buscar carpetas de nivel raíz
    if (parentId !== undefined) {
        where.parentId =
            parentId === "null" || parentId === null ? null : parentId;
    }

    if (search) {
        where.name = { contains: search, mode: "insensitive" };
    }

    const orderBy = {};
    orderBy[sortBy] = order;

    return prisma.folder.findMany({
        where,
        orderBy,
        include: {
            subfolders: {
                orderBy: { position: "asc" },
            },
            _count: {
                select: {
                    tasks: true,
                },
            },
        },
    });
}

export async function getFolderById(folderId, userId) {
    const folder = await prisma.folder.findUnique({
        where: { id: folderId },
        include: {
            subfolders: {
                orderBy: { position: "asc" },
            },
            tasks: {
                orderBy: { position: "asc" },
            },
            parent: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    if (!folder) {
        throw new Error("Carpeta no encontrada");
    }

    if (folder.userId !== userId) {
        throw new Error("No tienes permiso para ver esta carpeta");
    }

    return folder;
}

export async function createFolder(data, userId) {
    const { name, color, icon, parentId, position } = data;

    // Verificar que el parent existe y pertenece al usuario si se proporciona
    if (parentId) {
        const parentFolder = await prisma.folder.findUnique({
            where: { id: parentId },
        });

        if (!parentFolder) {
            throw new Error("Carpeta padre no encontrada");
        }

        if (parentFolder.userId !== userId) {
            throw new Error("No tienes permiso para usar esta carpeta padre");
        }
    }

    // Si no se proporciona position, obtener el último + 1
    let finalPosition = position;
    if (finalPosition === undefined) {
        const lastFolder = await prisma.folder.findFirst({
            where: { userId, parentId: parentId || null },
            orderBy: { position: "desc" },
        });
        finalPosition = lastFolder ? lastFolder.position + 1 : 0;
    }

    const folder = await prisma.folder.create({
        data: {
            name,
            color,
            icon,
            position: finalPosition,
            parentId: parentId || null,
            userId,
        },
        include: {
            subfolders: {
                orderBy: { position: "asc" },
            },
            _count: {
                select: {
                    tasks: true,
                },
            },
        },
    });

    return folder;
}

export async function updateFolder(folderId, data, userId) {
    // Verificar que la carpeta existe y pertenece al usuario
    const existingFolder = await prisma.folder.findUnique({
        where: { id: folderId },
    });

    if (!existingFolder) {
        throw new Error("Carpeta no encontrada");
    }

    if (existingFolder.userId !== userId) {
        throw new Error("No tienes permiso para editar esta carpeta");
    }

    const { name, color, icon, parentId, position } = data;

    // Verificar que el parent existe y pertenece al usuario si se proporciona
    if (parentId !== undefined && parentId !== null) {
        // No permitir que una carpeta sea su propio padre
        if (parentId === folderId) {
            throw new Error("Una carpeta no puede ser su propio padre");
        }

        const parentFolder = await prisma.folder.findUnique({
            where: { id: parentId },
        });

        if (!parentFolder) {
            throw new Error("Carpeta padre no encontrada");
        }

        if (parentFolder.userId !== userId) {
            throw new Error("No tienes permiso para usar esta carpeta padre");
        }

        // Verificar que no se crea un ciclo (el parent no puede ser una subcarpeta de esta carpeta)
        const isDescendant = await checkIfDescendant(folderId, parentId);
        if (isDescendant) {
            throw new Error(
                "No puedes mover una carpeta dentro de una de sus subcarpetas",
            );
        }
    }

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (position !== undefined) updateData.position = position;
    if (parentId !== undefined) updateData.parentId = parentId || null;

    const folder = await prisma.folder.update({
        where: { id: folderId },
        data: updateData,
        include: {
            subfolders: {
                orderBy: { position: "asc" },
            },
            _count: {
                select: {
                    tasks: true,
                },
            },
        },
    });

    return folder;
}

export async function deleteFolder(folderId, userId) {
    // Verificar que la carpeta existe y pertenece al usuario
    const existingFolder = await prisma.folder.findUnique({
        where: { id: folderId },
        include: {
            subfolders: true,
        },
    });

    if (!existingFolder) {
        throw new Error("Carpeta no encontrada");
    }

    if (existingFolder.userId !== userId) {
        throw new Error("No tienes permiso para eliminar esta carpeta");
    }

    // Las tareas asociadas pasarán a folderId null automáticamente por el onDelete: SetNull
    // Las subcarpetas se eliminarán en cascada por el onDelete: Cascade
    await prisma.folder.delete({
        where: { id: folderId },
    });

    return { message: "Carpeta eliminada correctamente" };
}

// Función auxiliar para verificar si targetId es descendiente de folderId
async function checkIfDescendant(folderId, targetId) {
    let currentId = targetId;

    while (currentId) {
        if (currentId === folderId) {
            return true;
        }

        const folder = await prisma.folder.findUnique({
            where: { id: currentId },
            select: { parentId: true },
        });

        if (!folder) break;
        currentId = folder.parentId;
    }

    return false;
}
