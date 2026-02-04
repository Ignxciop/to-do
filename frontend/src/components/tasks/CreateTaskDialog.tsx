import { useState } from "react";
import type { Task } from "../../hooks/useTasks";
import type { Folder } from "../../hooks/useFolders";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

interface CreateTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folders: Folder[];
    onCreateTask: (data: Partial<Task>) => Promise<any>;
}

export function CreateTaskDialog({
    open,
    onOpenChange,
    folders,
    onCreateTask,
}: CreateTaskDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<
        "low" | "medium" | "high" | "urgent"
    >("medium");
    const [folderId, setFolderId] = useState<string>("none");
    const [dueDate, setDueDate] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        try {
            const taskData: Partial<Task> = {
                title: title.trim(),
                priority,
                status: "pending",
            };
            if (description.trim()) {
                taskData.description = description.trim();
            }
            if (folderId !== "none") {
                taskData.folderId = folderId;
            }
            if (dueDate) {
                taskData.dueDate = dueDate;
            }
            await onCreateTask(taskData);
            setTitle("");
            setDescription("");
            setPriority("medium");
            setFolderId("none");
            setDueDate("");
            onOpenChange(false);
        } catch (error) {
            console.error("Error creating task:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Nueva Tarea</DialogTitle>
                    <DialogDescription>
                        Crea una nueva tarea para tu lista de pendientes
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Título</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="¿Qué necesitas hacer?"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Descripción (opcional)
                        </Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Añade más detalles sobre esta tarea..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="priority">Prioridad</Label>
                            <Select
                                value={priority}
                                onValueChange={setPriority as any}
                            >
                                <SelectTrigger id="priority">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Baja</SelectItem>
                                    <SelectItem value="medium">
                                        Media
                                    </SelectItem>
                                    <SelectItem value="high">Alta</SelectItem>
                                    <SelectItem value="urgent">
                                        Urgente
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Fecha límite</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="folder">Carpeta (opcional)</Label>
                        <Select value={folderId} onValueChange={setFolderId}>
                            <SelectTrigger id="folder">
                                <SelectValue placeholder="Sin carpeta" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    Sin carpeta
                                </SelectItem>
                                {folders.map((folder) => (
                                    <SelectItem
                                        key={folder.id}
                                        value={folder.id}
                                    >
                                        {folder.parentId && "↳ "}
                                        {folder.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creando..." : "Crear Tarea"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
