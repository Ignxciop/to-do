import { useState } from "react";
import { MoreVertical, Calendar, AlertCircle } from "lucide-react";
import type { Task } from "../../hooks/useTasks";
import { useDraggable } from "@dnd-kit/core";
import { Separator } from "../ui/separator";
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

interface TaskItemProps {
    task: Task;
    compact?: boolean;
    onDeleteTask: (id: string) => Promise<void>;
    onEditTask?: (task: Task) => void;
}

const priorityColors = {
    low: "text-blue-500",
    medium: "text-yellow-500",
    high: "text-orange-500",
    urgent: "text-red-500",
};

const priorityLabels = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
    urgent: "Urgente",
};

export function TaskItem({
    task,
    compact = false,
    onDeleteTask,
    onEditTask,
}: TaskItemProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
            id: `task-${task.id}`,
            data: { type: "task", task },
        });

    const style = transform
        ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
              opacity: isDragging ? 0.5 : 1,
          }
        : undefined;

    const handleDelete = async () => {
        try {
            await onDeleteTask(task.id);
            setShowDeleteDialog(false);
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    };

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                className={cn(
                    "group flex items-start gap-3 py-3 hover:bg-accent/30 transition-all select-none",
                    isDragging && "opacity-50 bg-accent/50 cursor-grabbing",
                    !isDragging && "cursor-grab",
                    task.status === "completed" && "opacity-60",
                    compact && "py-2",
                )}
                {...attributes}
                {...listeners}
            >
                {/* Contenido de la tarea */}
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                        <h4
                            className={cn(
                                "font-medium text-sm leading-tight",
                                task.status === "completed" && "line-through",
                            )}
                        >
                            {task.title}
                        </h4>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                >
                                    <MoreVertical className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => onEditTask?.(task)}
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

                        {/* Diálogo de confirmación de eliminación */}
                        <AlertDialog
                            open={showDeleteDialog}
                            onOpenChange={setShowDeleteDialog}
                        >
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        ¿Eliminar tarea?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Se
                                        eliminará la tarea "{task.title}".
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>
                                        Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Eliminar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    {task.description && !compact && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {task.description}
                        </p>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {/* Prioridad */}
                        <div className="flex items-center gap-1">
                            <AlertCircle
                                className={cn(
                                    "h-3 w-3",
                                    priorityColors[task.priority],
                                )}
                            />
                            <span>{priorityLabels[task.priority]}</span>
                        </div>

                        {/* Fecha de vencimiento */}
                        {task.dueDate && (
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                    {(() => {
                                        // Extraer fecha sin conversión de zona horaria
                                        const dateStr =
                                            task.dueDate.split("T")[0];
                                        const [year, month, day] = dateStr
                                            .split("-")
                                            .map(Number);
                                        const date = new Date(
                                            year,
                                            month - 1,
                                            day,
                                        );
                                        return date.toLocaleDateString(
                                            "es-ES",
                                            {
                                                day: "numeric",
                                                month: "short",
                                            },
                                        );
                                    })()}
                                </span>
                            </div>
                        )}

                        {/* Estado */}
                        {task.status !== "pending" &&
                            task.status !== "completed" && (
                                <span
                                    className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-medium",
                                        task.status === "in_progress" &&
                                            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                                        task.status === "cancelled" &&
                                            "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
                                    )}
                                >
                                    {task.status === "in_progress"
                                        ? "En progreso"
                                        : "Cancelada"}
                                </span>
                            )}
                    </div>
                </div>
            </div>
            <Separator />
        </>
    );
}
