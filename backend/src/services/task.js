import { prisma } from "../config/prisma.js";

export async function getAllTasks(userId, filters = {}) {
    const {
        status,
        folderId,
        priority,
        search,
        sortBy = "position",
        order = "asc",
    } = filters;

    const where = { userId };

    if (status) {
        where.status = status;
    }

    if (folderId !== undefined) {
        // Si folderId es null o "null", buscar tareas sin carpeta
        where.folderId =
            folderId === "null" || folderId === null ? null : folderId;
    }

    if (priority) {
        where.priority = priority;
    }

    if (search) {
        where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ];
    }

    const orderBy = {};
    orderBy[sortBy] = order;

    return prisma.task.findMany({
        where,
        orderBy,
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
}

export async function getTaskById(taskId, userId) {
    const task = await prisma.task.findUnique({
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

    if (!task) {
        throw new Error("Tarea no encontrada");
    }

    if (task.userId !== userId) {
        throw new Error("No tienes permiso para ver esta tarea");
    }

    return task;
}

export async function createTask(data, userId) {
    const {
        title,
        description,
        status,
        priority,
        dueDate,
        folderId,
        position,
    } = data;

    // Verificar que la carpeta existe y pertenece al usuario si se proporciona
    if (folderId) {
        const folder = await prisma.folder.findUnique({
            where: { id: folderId },
        });

        if (!folder) {
            throw new Error("Carpeta no encontrada");
        }

        if (folder.userId !== userId) {
            throw new Error("No tienes permiso para usar esta carpeta");
        }
    }

    // Si no se proporciona position, obtener el último + 1
    let finalPosition = position;
    if (finalPosition === undefined) {
        const lastTask = await prisma.task.findFirst({
            where: { userId, folderId: folderId || null },
            orderBy: { position: "desc" },
        });
        finalPosition = lastTask ? lastTask.position + 1 : 0;
    }

    const task = await prisma.task.create({
        data: {
            title,
            description,
            status: status || "pending",
            priority: priority || "medium",
            dueDate: dueDate ? new Date(dueDate) : null,
            position: finalPosition,
            folderId: folderId || null,
            userId,
        },
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

    return task;
}

export async function updateTask(taskId, data, userId) {
    // Verificar que la tarea existe y pertenece al usuario
    const existingTask = await prisma.task.findUnique({
        where: { id: taskId },
    });

    if (!existingTask) {
        throw new Error("Tarea no encontrada");
    }

    if (existingTask.userId !== userId) {
        throw new Error("No tienes permiso para editar esta tarea");
    }

    const {
        title,
        description,
        status,
        priority,
        dueDate,
        folderId,
        position,
    } = data;

    // Verificar que la carpeta existe y pertenece al usuario si se proporciona
    if (folderId !== undefined && folderId !== null) {
        const folder = await prisma.folder.findUnique({
            where: { id: folderId },
        });

        if (!folder) {
            throw new Error("Carpeta no encontrada");
        }

        if (folder.userId !== userId) {
            throw new Error("No tienes permiso para usar esta carpeta");
        }
    }

    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined)
        updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (position !== undefined) updateData.position = position;

    // Manejar cambio de carpeta
    if (folderId !== undefined) {
        updateData.folderId = folderId || null;
    }

    // Manejar cambio de estado y completedAt
    if (status !== undefined) {
        updateData.status = status;
        if (status === "completed" && existingTask.status !== "completed") {
            updateData.completedAt = new Date();
        } else if (status !== "completed") {
            updateData.completedAt = null;
        }
    }

    const task = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
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

    return task;
}

export async function deleteTask(taskId, userId) {
    // Verificar que la tarea existe y pertenece al usuario
    const existingTask = await prisma.task.findUnique({
        where: { id: taskId },
    });

    if (!existingTask) {
        throw new Error("Tarea no encontrada");
    }

    if (existingTask.userId !== userId) {
        throw new Error("No tienes permiso para eliminar esta tarea");
    }

    await prisma.task.delete({
        where: { id: taskId },
    });

    return { message: "Tarea eliminada correctamente" };
}
