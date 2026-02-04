import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_URL =
    import.meta.env.VITE_API_URL !== undefined
        ? import.meta.env.VITE_API_URL
        : "http://localhost:4004";

export interface Folder {
    id: string;
    name: string;
    color?: string;
    icon?: string;
    position: number;
    parentId?: string | null;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export function useFolders(parentId?: string | null) {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFolders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            if (parentId !== undefined) {
                params.append("parentId", parentId || "");
            }

            const response = await axios.get(
                `${API_URL}/api/folders?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                },
            );

            // Validar que response.data.folders sea un array
            if (Array.isArray(response.data.folders)) {
                setFolders(response.data.folders);
            } else {
                console.error(
                    "Response data.folders is not an array:",
                    response.data,
                );
                setFolders([]);
                setError("Respuesta inválida del servidor");
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Error al cargar carpetas");
            console.error("Error fetching folders:", err);
            setFolders([]); // Asegurar que folders sea siempre un array
        } finally {
            setLoading(false);
        }
    }, [parentId]);

    useEffect(() => {
        fetchFolders();
    }, [fetchFolders]);

    const createFolder = async (data: Partial<Folder>) => {
        try {
            const response = await axios.post(`${API_URL}/api/folder`, data, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            setFolders((prev) => [...prev, response.data.folder]);
            return response.data.folder;
        } catch (err: any) {
            console.error("Error creating folder:", err.response?.data || err);
            const errorMsg =
                err.response?.data?.errors?.[0]?.message ||
                err.response?.data?.error ||
                "Error al crear carpeta";
            throw new Error(errorMsg);
        }
    };

    const updateFolder = async (id: string, data: Partial<Folder>) => {
        try {
            const response = await axios.put(
                `${API_URL}/api/folder/${id}`,
                data,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                },
            );
            setFolders((prev) =>
                prev.map((folder) =>
                    folder.id === id ? response.data.folder : folder,
                ),
            );
            return response.data.folder;
        } catch (err: any) {
            throw new Error(
                err.response?.data?.error || "Error al actualizar carpeta",
            );
        }
    };

    const deleteFolder = async (id: string) => {
        try {
            await axios.delete(`${API_URL}/api/folder/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            setFolders((prev) => prev.filter((folder) => folder.id !== id));
        } catch (err: any) {
            throw new Error(
                err.response?.data?.error || "Error al eliminar carpeta",
            );
        }
    };

    return {
        folders,
        loading,
        error,
        createFolder,
        updateFolder,
        deleteFolder,
        refetch: fetchFolders,
    };
}
