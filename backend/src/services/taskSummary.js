import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getTasksSummary(userId) {
    const now = new Date();

    // Inicio de la semana (lunes)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(
        now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1),
    );
    startOfWeek.setHours(0, 0, 0, 0);

    // Fin de la semana (domingo)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Obtener todas las tareas del usuario
    const tasks = await prisma.task.findMany({
        where: { userId },
        select: {
            id: true,
            status: true,
            priority: true,
            dueDate: true,
            completedAt: true,
        },
    });

    // Total de tareas
    const total = tasks.length;

    // Tareas por estado
    const byStatus = {
        pending: tasks.filter((t) => t.status === "pending").length,
        in_progress: tasks.filter((t) => t.status === "in_progress").length,
        completed: tasks.filter((t) => t.status === "completed").length,
        cancelled: tasks.filter((t) => t.status === "cancelled").length,
    };

    // Tareas por prioridad
    const byPriority = {
        low: tasks.filter((t) => t.priority === "low").length,
        medium: tasks.filter((t) => t.priority === "medium").length,
        high: tasks.filter((t) => t.priority === "high").length,
        urgent: tasks.filter((t) => t.priority === "urgent").length,
    };

    // Tareas completadas esta semana
    const completedThisWeek = tasks.filter((t) => {
        if (!t.completedAt) return false;
        const completedDate = new Date(t.completedAt);
        return completedDate >= startOfWeek && completedDate <= endOfWeek;
    }).length;

    // Tareas vencidas (pending o in_progress con dueDate en el pasado)
    const overdue = tasks.filter((t) => {
        if (t.status === "completed" || t.status === "cancelled") return false;
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < now;
    }).length;

    // Tareas que vencen hoy
    const dueToday = tasks.filter((t) => {
        if (t.status === "completed" || t.status === "cancelled") return false;
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        return (
            dueDate.getDate() === now.getDate() &&
            dueDate.getMonth() === now.getMonth() &&
            dueDate.getFullYear() === now.getFullYear()
        );
    }).length;

    // Tareas que vencen esta semana
    const dueThisWeek = tasks.filter((t) => {
        if (t.status === "completed" || t.status === "cancelled") return false;
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= now && dueDate <= endOfWeek;
    }).length;

    return {
        total,
        byStatus,
        byPriority,
        completedThisWeek,
        overdue,
        dueToday,
        dueThisWeek,
    };
}
