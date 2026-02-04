import type { Folder as FolderType } from "../../hooks/useFolders";
import type { Task } from "../../hooks/useTasks";
import { FolderCard } from "./FolderCard";
import { useDroppable } from "@dnd-kit/core";

interface FolderListProps {
    folders: FolderType[];
    tasks: Task[];
    onFolderClick: (folderId: string | null) => void;
    selectedFolderId: string | null;
    onDeleteFolder: (id: string) => Promise<void>;
    onDeleteTask: (id: string) => Promise<void>;
}

export function FolderList({
    folders,
    tasks,
    onFolderClick,
    selectedFolderId,
    onDeleteFolder,
    onDeleteTask,
}: FolderListProps) {
    // Filtrar solo carpetas raíz (sin parent)
    const rootFolders = folders.filter((f) => !f.parentId);

    const { setNodeRef } = useDroppable({
        id: "root",
    });

    if (rootFolders.length === 0) {
        return (
            <div
                ref={setNodeRef}
                className="text-center py-12 text-muted-foreground"
            >
                No hay carpetas. Crea una para organizar tus tareas.
            </div>
        );
    }

    return (
        <div ref={setNodeRef} className="space-y-4">
            <h2 className="text-lg font-semibold">Carpetas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rootFolders.map((folder) => (
                    <FolderCard
                        key={folder.id}
                        folder={folder}
                        allFolders={folders}
                        tasks={tasks}
                        onFolderClick={onFolderClick}
                        selectedFolderId={selectedFolderId}
                        isSubfolder={false}
                        onDeleteFolder={onDeleteFolder}
                        onDeleteTask={onDeleteTask}
                    />
                ))}
            </div>
        </div>
    );
}
