import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
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
import type { Task } from "../../hooks/useTasks";

interface EditTaskDialogProps {
    task: Task | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (
        id: string,
        data: {
            title: string;
            description?: string;
            priority: "low" | "medium" | "high" | "urgent";
            dueDate?: string;
        },
    ) => Promise<void>;
}

export function EditTaskDialog({
    task,
    open,
    onOpenChange,
    onSave,
}: EditTaskDialogProps) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        priority: "medium" as "low" | "medium" | "high" | "urgent",
        dueDate: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title,
                description: task.description || "",
                priority: task.priority,
                dueDate: task.dueDate
                    ? new Date(task.dueDate).toISOString().split("T")[0]
                    : "",
            });
        }
    }, [task]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!task) return;

        setIsSubmitting(true);
        try {
            await onSave(task.id, {
                title: formData.title,
                description: formData.description || undefined,
                priority: formData.priority,
                dueDate: formData.dueDate || undefined,
            });
            onOpenChange(false);
        } catch (error) {
            console.error("Error updating task:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Tarea</DialogTitle>
                    <DialogDescription>
                        Modifica los detalles de la tarea
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="title">Título</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    title: e.target.value,
                                }))
                            }
                            required
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                            className="mt-1"
                            rows={3}
                        />
                    </div>
                    <div>
                        <Label htmlFor="priority">Prioridad</Label>
                        <Select
                            value={formData.priority}
                            onValueChange={(value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    priority: value as
                                        | "low"
                                        | "medium"
                                        | "high"
                                        | "urgent",
                                }))
                            }
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Baja</SelectItem>
                                <SelectItem value="medium">Media</SelectItem>
                                <SelectItem value="high">Alta</SelectItem>
                                <SelectItem value="urgent">Urgente</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="dueDate">Fecha de vencimiento</Label>
                        <Input
                            id="dueDate"
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    dueDate: e.target.value,
                                }))
                            }
                            className="mt-1"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
