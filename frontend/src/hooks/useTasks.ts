import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4004";

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: "pending" | "in_progress" | "completed" | "cancelled";
    priority: "low" | "medium" | "high" | "urgent";
    dueDate?: string;
    completedAt?: string;
    position: number;
    folderId?: string | null;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export function useTasks(filters?: {
    status?: string;
    folderId?: string;
    priority?: string;
    search?: string;
}) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            if (filters?.status) params.append("status", filters.status);
            if (filters?.folderId) params.append("folderId", filters.folderId);
            if (filters?.priority) params.append("priority", filters.priority);
            if (filters?.search) params.append("search", filters.search);

            const response = await axios.get(
                `${API_URL}/api/tasks?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                },
            );

            // Validar que response.data.tasks sea un array
            if (Array.isArray(response.data.tasks)) {
                setTasks(response.data.tasks);
            } else {
                console.error(
                    "Response data.tasks is not an array:",
                    response.data,
                );
                setTasks([]);
                setError("Respuesta inválida del servidor");
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Error al cargar tareas");
            console.error("Error fetching tasks:", err);
            setTasks([]); // Asegurar que tasks sea siempre un array
        } finally {
            setLoading(false);
        }
    }, [
        filters?.status,
        filters?.folderId,
        filters?.priority,
        filters?.search,
    ]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const createTask = async (data: Partial<Task>) => {
        try {
            const response = await axios.post(`${API_URL}/api/task`, data, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            setTasks((prev) => [...prev, response.data.task]);
            return response.data.task;
        } catch (err: any) {
            console.error("Error creating task:", err.response?.data || err);
            const errorMsg =
                err.response?.data?.errors?.[0]?.message ||
                err.response?.data?.error ||
                "Error al crear tarea";
            throw new Error(errorMsg);
        }
    };

    const updateTask = async (id: string, data: Partial<Task>) => {
        try {
            const response = await axios.put(
                `${API_URL}/api/task/${id}`,
                data,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                },
            );
            setTasks((prev) =>
                prev.map((task) =>
                    task.id === id ? response.data.task : task,
                ),
            );
            return response.data.task;
        } catch (err: any) {
            throw new Error(
                err.response?.data?.error || "Error al actualizar tarea",
            );
        }
    };

    const deleteTask = async (id: string) => {
        try {
            await axios.delete(`${API_URL}/api/task/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            setTasks((prev) => prev.filter((task) => task.id !== id));
        } catch (err: any) {
            throw new Error(
                err.response?.data?.error || "Error al eliminar tarea",
            );
        }
    };

    return {
        tasks,
        loading,
        error,
        createTask,
        updateTask,
        deleteTask,
        refetch: fetchTasks,
    };
}
