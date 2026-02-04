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
import type { Folder } from "../../hooks/useFolders";

const COLORS = [
    "#6366f1", // indigo
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#f43f5e", // rose
    "#ef4444", // red
    "#f97316", // orange
    "#f59e0b", // amber
    "#eab308", // yellow
    "#84cc16", // lime
    "#22c55e", // green
    "#10b981", // emerald
    "#14b8a6", // teal
    "#06b6d4", // cyan
    "#0ea5e9", // sky
    "#3b82f6", // blue
];

interface EditFolderDialogProps {
    folder: Folder | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (
        id: string,
        data: { name: string; color?: string },
    ) => Promise<void>;
}

export function EditFolderDialog({
    folder,
    open,
    onOpenChange,
    onSave,
}: EditFolderDialogProps) {
    const [formData, setFormData] = useState({
        name: "",
        color: "#6366f1",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (folder) {
            setFormData({
                name: folder.name,
                color: folder.color || "#6366f1",
            });
        }
    }, [folder]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!folder) return;

        setIsSubmitting(true);
        try {
            await onSave(folder.id, {
                name: formData.name,
                color: formData.color,
            });
            onOpenChange(false);
        } catch (error) {
            console.error("Error updating folder:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Carpeta</DialogTitle>
                    <DialogDescription>
                        Modifica el nombre y color de la carpeta
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            required
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label>Color</Label>
                        <div className="grid grid-cols-8 gap-2 mt-2">
                            {COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            color,
                                        }))
                                    }
                                    className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                                    style={{
                                        backgroundColor: color,
                                        borderColor:
                                            formData.color === color
                                                ? color
                                                : "transparent",
                                        boxShadow:
                                            formData.color === color
                                                ? `0 0 0 2px white, 0 0 0 4px ${color}`
                                                : "none",
                                    }}
                                    aria-label={`Seleccionar color ${color}`}
                                />
                            ))}
                        </div>
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
