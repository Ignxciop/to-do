import type { Task } from "../../hooks/useTasks";
import { TaskItem } from "./TaskItem";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "../../lib/utils";

interface TaskListProps {
    tasks: Task[];
    title?: string;
    folderId?: string | null;
    compact?: boolean;
    depth?: number;
    onDeleteTask: (id: string) => Promise<void>;
}

export function TaskList({
    tasks,
    title,
    folderId,
    compact = false,
    depth = 0,
    onDeleteTask,
}: TaskListProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: folderId ? `tasklist-${folderId}` : "root",
        data: { type: "taskList", folderId },
    });

    if (tasks.length === 0 && !title) {
        return null;
    }

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "space-y-2",
                !compact && "rounded-lg border border-border p-4",
                isOver && "ring-2 ring-primary",
            )}
        >
            {title && (
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                    {title}
                </h3>
            )}
            <div
                className="space-y-1"
                style={{
                    marginLeft: depth > 0 ? `${(depth + 1) * 24}px` : "0",
                }}
            >
                {tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No hay tareas
                    </p>
                ) : (
                    tasks.map((task) => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            compact={compact}
                            onDeleteTask={onDeleteTask}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
