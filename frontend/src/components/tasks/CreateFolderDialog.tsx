import { useState } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

interface CreateFolderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folders: Folder[];
    onCreateFolder: (data: Partial<Folder>) => Promise<any>;
}

const folderColors = [
    { value: "#6366f1", label: "Índigo" },
    { value: "#8b5cf6", label: "Violeta" },
    { value: "#ec4899", label: "Rosa" },
    { value: "#f43f5e", label: "Rojo" },
    { value: "#f97316", label: "Naranja" },
    { value: "#eab308", label: "Amarillo" },
    { value: "#22c55e", label: "Verde" },
    { value: "#14b8a6", label: "Turquesa" },
    { value: "#06b6d4", label: "Cian" },
    { value: "#3b82f6", label: "Azul" },
];

export function CreateFolderDialog({
    open,
    onOpenChange,
    folders,
    onCreateFolder,
}: CreateFolderDialogProps) {
    const [name, setName] = useState("");
    const [color, setColor] = useState("#6366f1");
    const [parentId, setParentId] = useState<string>("none");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            const folderData: Partial<Folder> = {
                name: name.trim(),
                color,
            };
            if (parentId !== "none") {
                folderData.parentId = parentId;
            }
            await onCreateFolder(folderData);
            setName("");
            setColor("#6366f1");
            setParentId("none");
            onOpenChange(false);
        } catch (error) {
            console.error("Error creating folder:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nueva Carpeta</DialogTitle>
                    <DialogDescription>
                        Crea una carpeta para organizar tus tareas
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Trabajo, Personal, Estudios..."
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="color">Color</Label>
                        <Select value={color} onValueChange={setColor}>
                            <SelectTrigger id="color">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: color }}
                                    />
                                    <SelectValue />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {folderColors.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{
                                                    backgroundColor: c.value,
                                                }}
                                            />
                                            <span>{c.label}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="parent">Carpeta padre (opcional)</Label>
                        <Select value={parentId} onValueChange={setParentId}>
                            <SelectTrigger id="parent">
                                <SelectValue placeholder="Ninguna (carpeta raíz)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    Ninguna (carpeta raíz)
                                </SelectItem>
                                {folders
                                    .filter((f) => !f.parentId)
                                    .map((folder) => (
                                        <SelectItem
                                            key={folder.id}
                                            value={folder.id}
                                        >
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
                            {loading ? "Creando..." : "Crear Carpeta"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
