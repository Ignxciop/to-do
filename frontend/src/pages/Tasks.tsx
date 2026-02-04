import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { FolderList } from "../components/tasks/FolderList";
import { TaskList } from "../components/tasks/TaskList";
import { CreateFolderDialog } from "../components/tasks/CreateFolderDialog";
import { CreateTaskDialog } from "../components/tasks/CreateTaskDialog";
import { EditFolderDialog } from "../components/tasks/EditFolderDialog";
import { EditTaskDialog } from "../components/tasks/EditTaskDialog";
import { useTasks } from "../hooks/useTasks";
import { useFolders } from "../hooks/useFolders";
import type { Folder } from "../hooks/useFolders";
import type { Task } from "../hooks/useTasks";
import MainLayout from "../layout/MainLayout";
import {
    DndContext,
    type DragEndEvent,
    DragOverlay,
    type DragStartEvent,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";

export default function Tasks() {
    const [openFolderDialog, setOpenFolderDialog] = useState(false);
    const [openTaskDialog, setOpenTaskDialog] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
        null,
    );
    const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const {
        folders,
        loading: foldersLoading,
        updateFolder,
        createFolder,
        deleteFolder,
        error: foldersError,
    } = useFolders();
    const {
        tasks,
        loading: tasksLoading,
        updateTask,
        createTask,
        deleteTask,
        refetch: refetchTasks,
        error: tasksError,
    } = useTasks();

    // Wrapper para deleteFolder que también recarga las tareas
    const handleDeleteFolder = async (id: string) => {
        await deleteFolder(id);
        // Recargar tareas para mostrar las que quedaron sin carpeta
        await refetchTasks();
    };

    // Handlers para edición
    const handleEditFolder = (folder: Folder) => {
        setEditingFolder(folder);
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
    };

    const handleSaveFolder = async (
        id: string,
        data: { name: string; color?: string },
    ) => {
        try {
            await updateFolder(id, data);
            setEditingFolder(null);
        } catch (error) {
            console.error("Error updating folder:", error);
        }
    };

    const handleSaveTask = async (
        id: string,
        data: {
            title: string;
            description?: string;
            priority: "low" | "medium" | "high" | "urgent";
            dueDate?: string;
        },
    ) => {
        try {
            await updateTask(id, data);
            setEditingTask(null);
        } catch (error) {
            console.error("Error updating task:", error);
        }
    };

    // Configurar sensores para drag and drop
    // TouchSensor con delay para long press en móviles
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px de movimiento antes de activar drag
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 300, // 300ms de long press
                tolerance: 5,
            },
        }),
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeId = active.id as string;
        const overId = over.id as string;

        // Determinar si es tarea o carpeta
        const isTask = activeId.startsWith("task-");
        const isFolder = activeId.startsWith("folder-");

        if (isTask) {
            const taskId = activeId.replace("task-", "");

            try {
                // Si se suelta sobre una carpeta o su lista de tareas
                if (
                    overId.startsWith("folder-") ||
                    overId.startsWith("tasklist-")
                ) {
                    const folderId = overId
                        .replace("folder-", "")
                        .replace("tasklist-", "");
                    await updateTask(taskId, { folderId });
                }
                // Si se suelta en el área principal (sin carpeta)
                else if (overId === "root") {
                    await updateTask(taskId, { folderId: null });
                }
            } catch (error) {
                console.error("Error moving task:", error);
            }
        }

        if (isFolder) {
            const folderId = activeId.replace("folder-", "");
            const folder = folders.find((f) => f.id === folderId);

            if (!folder) return;

            // Si se suelta sobre otra carpeta (para hacer subcarpeta)
            if (overId.startsWith("folder-")) {
                const targetFolderId = overId.replace("folder-", "");
                if (
                    folder.parentId !== targetFolderId &&
                    folderId !== targetFolderId
                ) {
                    await updateFolder(folderId, { parentId: targetFolderId });
                }
            }
            // Si se suelta en el área principal (convertir en carpeta raíz)
            else if (overId === "root" && folder.parentId !== null) {
                await updateFolder(folderId, { parentId: null });
            }
        }

        setActiveId(null);
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    // Mostrar error si algo falla
    if (foldersError || tasksError) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center h-96 space-y-4">
                    <p className="text-destructive font-medium">
                        Error al cargar los datos
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {foldersError || tasksError}
                    </p>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                    >
                        Reintentar
                    </Button>
                </div>
            </MainLayout>
        );
    }

    if (foldersLoading || tasksLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-96">
                    <p className="text-muted-foreground">Cargando...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <div className="space-y-6 p-6">
                    {/* Header con acciones */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Tareas
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Organiza tus tareas en carpetas
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setOpenFolderDialog(true)}
                                variant="outline"
                                size="sm"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Nueva Carpeta
                            </Button>
                            <Button
                                onClick={() => setOpenTaskDialog(true)}
                                size="sm"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Nueva Tarea
                            </Button>
                        </div>
                    </div>

                    {/* Lista de carpetas */}
                    <FolderList
                        folders={Array.isArray(folders) ? folders : []}
                        tasks={Array.isArray(tasks) ? tasks : []}
                        onFolderClick={setSelectedFolderId}
                        selectedFolderId={selectedFolderId}
                        onDeleteFolder={handleDeleteFolder}
                        onDeleteTask={deleteTask}
                        onEditFolder={handleEditFolder}
                        onEditTask={handleEditTask}
                    />

                    {/* Tareas sin carpeta */}
                    <TaskList
                        tasks={
                            Array.isArray(tasks)
                                ? tasks.filter((t) => !t.folderId)
                                : []
                        }
                        title="Tareas sin carpeta"
                        folderId={null}
                        onDeleteTask={deleteTask}
                        onEditTask={handleEditTask}
                    />

                    {/* Diálogos */}
                    <CreateFolderDialog
                        open={openFolderDialog}
                        onOpenChange={setOpenFolderDialog}
                        folders={folders}
                        onCreateFolder={createFolder}
                    />
                    <CreateTaskDialog
                        open={openTaskDialog}
                        onOpenChange={setOpenTaskDialog}
                        folders={folders}
                        onCreateTask={createTask}
                    />
                    <EditFolderDialog
                        folder={editingFolder}
                        open={!!editingFolder}
                        onOpenChange={(open) => !open && setEditingFolder(null)}
                        onSave={handleSaveFolder}
                    />
                    <EditTaskDialog
                        task={editingTask}
                        open={!!editingTask}
                        onOpenChange={(open) => !open && setEditingTask(null)}
                        onSave={handleSaveTask}
                    />
                </div>

                {/* Drag overlay */}
                <DragOverlay>
                    {activeId ? (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg opacity-80">
                            {activeId.startsWith("task-")
                                ? "📝 Tarea"
                                : "📁 Carpeta"}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </MainLayout>
    );
}
