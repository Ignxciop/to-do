import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Folder, MoreVertical } from "lucide-react";
import type { Folder as FolderType } from "../../hooks/useFolders";
import type { Task } from "../../hooks/useTasks";
import { TaskList } from "./TaskList";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

// Utility functions para localStorage
const STORAGE_KEY = "enfok-folder-expanded-state";

const getFolderExpandedState = (folderId: string): boolean => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return true; // Por defecto expandido
        const state = JSON.parse(stored);
        return state[folderId] !== undefined ? state[folderId] : true;
    } catch {
        return true;
    }
};

const setFolderExpandedState = (folderId: string, expanded: boolean) => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const state = stored ? JSON.parse(stored) : {};
        state[folderId] = expanded;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error("Error saving folder state:", error);
    }
};

interface FolderCardProps {
    folder: FolderType;
    allFolders: FolderType[];
    tasks: Task[];
    onFolderClick: (folderId: string | null) => void;
    selectedFolderId: string | null;
    isSubfolder: boolean;
    depth?: number;
    onDeleteFolder: (id: string) => Promise<void>;
    onDeleteTask: (id: string) => Promise<void>;
    onEditFolder?: (folder: FolderType) => void;
    onEditTask?: (task: Task) => void;
}

export function FolderCard({
    folder,
    allFolders,
    tasks,
    onFolderClick,
    selectedFolderId,
    isSubfolder,
    depth = 0,
    onDeleteFolder,
    onDeleteTask,
    onEditFolder,
    onEditTask,
}: FolderCardProps) {
    const [isExpanded, setIsExpanded] = useState(() =>
        getFolderExpandedState(folder.id),
    );
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Guardar el estado en localStorage cuando cambie
    useEffect(() => {
        setFolderExpandedState(folder.id, isExpanded);
    }, [isExpanded, folder.id]);

    const handleDelete = async () => {
        try {
            await onDeleteFolder(folder.id);
            setShowDeleteDialog(false);
        } catch (error) {
            console.error("Error deleting folder:", error);
        }
    };

    // Obtener subcarpetas
    const subfolders = allFolders.filter((f) => f.parentId === folder.id);

    // Obtener tareas de esta carpeta
    const folderTasks = tasks.filter((t) => t.folderId === folder.id);

    // Configurar draggable
    const {
        attributes,
        listeners,
        setNodeRef: setDragRef,
        transform,
        isDragging,
    } = useDraggable({
        id: `folder-${folder.id}`,
        data: { type: "folder", folder },
    });

    // Configurar droppable
    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: `folder-${folder.id}`,
        data: { type: "folder", folder },
    });

    const style = transform
        ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
              opacity: isDragging ? 0.5 : 1,
          }
        : undefined;

    // Combinar refs
    const setRefs = (element: HTMLDivElement | null) => {
        setDragRef(element);
        setDropRef(element);
    };

    return (
        <div
            ref={setRefs}
            style={style}
            className={cn(
                "transition-all select-none",
                isSubfolder
                    ? "ml-6 mb-2"
                    : "bg-card rounded-lg border border-border shadow-sm hover:shadow-md",
                isOver && "ring-2 ring-primary",
                isDragging && "opacity-50 cursor-grabbing",
                !isDragging && !isSubfolder && "cursor-grab",
            )}
            {...attributes}
            {...listeners}
        >
            {/* Header de la carpeta */}
            <div className={cn("flex items-center justify-between p-4")}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        onPointerDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="hover:bg-muted rounded p-1 transition-colors flex-shrink-0"
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>
                    <Folder
                        className="h-5 w-5 flex-shrink-0"
                        style={{ color: folder.color || "#6366f1" }}
                    />
                    <span className="font-medium truncate">{folder.name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                        ({folderTasks.length})
                    </span>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onPointerDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                        >
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() => onEditFolder?.(folder)}
                        >
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setShowDeleteDialog(true)}
                            className="text-destructive"
                        >
                            Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Diálogo de confirmación de eliminación */}
            <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar carpeta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará la
                            carpeta "{folder.name}" y todo su contenido.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Contenido expandible */}
            {isExpanded && (
                <div className={cn(!isSubfolder && "px-4 pb-4", "space-y-2")}>
                    {/* Subcarpetas */}
                    {subfolders.length > 0 && (
                        <div className="space-y-1">
                            {subfolders.map((subfolder) => (
                                <FolderCard
                                    key={subfolder.id}
                                    folder={subfolder}
                                    allFolders={allFolders}
                                    tasks={tasks}
                                    onFolderClick={onFolderClick}
                                    selectedFolderId={selectedFolderId}
                                    isSubfolder={true}
                                    depth={depth + 1}
                                    onDeleteFolder={onDeleteFolder}
                                    onDeleteTask={onDeleteTask}
                                    onEditFolder={onEditFolder}
                                    onEditTask={onEditTask}
                                />
                            ))}
                        </div>
                    )}

                    {/* Tareas */}
                    {folderTasks.length > 0 && (
                        <TaskList
                            tasks={folderTasks}
                            folderId={folder.id}
                            compact
                            depth={depth}
                            onDeleteTask={onDeleteTask}
                            onEditTask={onEditTask}
                        />
                    )}

                    {folderTasks.length === 0 && subfolders.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Carpeta vacía
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
