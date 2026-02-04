import { useState, useMemo } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    AlertTriangle,
    TrendingUp,
    CheckCircle,
    Search,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { useTasks } from "../hooks/useTasks";
import type { Task } from "../hooks/useTasks";
import MainLayout from "../layout/MainLayout";
import { cn } from "../lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import {
    DndContext,
    type DragEndEvent,
    type DragStartEvent,
    DragOverlay,
    useDraggable,
    useDroppable,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
];

const priorityColors = {
    low: "bg-blue-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
};

const priorityLabels = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
    urgent: "Urgente",
};

// Componente para día del calendario con droppable
interface CalendarDayProps {
    date: Date;
    isToday: boolean;
    isSelected: boolean;
    hasTasks: boolean;
    totalTasks: number;
    highestPriority: "urgent" | "high" | "medium" | "low" | null;
    taskCounts: Record<string, number>;
    onClick: () => void;
}

function CalendarDay({
    date,
    isToday,
    isSelected,
    hasTasks,
    totalTasks,
    highestPriority,
    taskCounts,
    onClick,
}: CalendarDayProps) {
    const dayId = `calendar-day-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const { setNodeRef, isOver } = useDroppable({
        id: dayId,
    });

    return (
        <button
            ref={setNodeRef}
            onClick={onClick}
            className={cn(
                "aspect-square rounded-lg border transition-all hover:border-primary hover:shadow-sm relative p-2",
                isToday && "border-primary border-2 font-bold",
                isSelected && "bg-primary text-primary-foreground",
                !isSelected && "bg-background hover:bg-accent",
                isOver && "ring-2 ring-primary bg-accent",
            )}
        >
            <div className="flex flex-col h-full">
                <div className="flex items-start justify-between">
                    <span className="text-sm">{date.getDate()}</span>
                    {/* Badge mobile con total de tareas */}
                    {hasTasks && (
                        <span
                            className={cn(
                                "md:hidden text-[7px] font-bold min-w-[12px] h-[12px] px-0.5 rounded-full flex items-center justify-center",
                                highestPriority === "urgent" &&
                                    "bg-red-500 text-white",
                                highestPriority === "high" &&
                                    "bg-orange-500 text-white",
                                highestPriority === "medium" &&
                                    "bg-yellow-500 text-white",
                                highestPriority === "low" &&
                                    "bg-blue-500 text-white",
                            )}
                        >
                            {totalTasks}
                        </span>
                    )}
                </div>
                {/* Indicadores desktop con prioridades detalladas */}
                {hasTasks && (
                    <div className="hidden md:flex flex-wrap gap-0.5 mt-auto">
                        {Object.entries(taskCounts).map(([priority, count]) => (
                            <div
                                key={priority}
                                className="flex items-center gap-0.5"
                            >
                                <div
                                    className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        priorityColors[
                                            priority as keyof typeof priorityColors
                                        ],
                                    )}
                                />
                                <span className="text-[10px]">{count}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </button>
    );
}

// Componente para tarea draggable
interface DraggableTaskProps {
    task: Task;
    onClick: () => void;
}

function DraggableTask({ task, onClick }: DraggableTaskProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
            id: `calendar-task-${task.id}`,
            data: { task },
        });

    const style = transform
        ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
              opacity: isDragging ? 0.5 : 1,
          }
        : undefined;

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: "pan-y",
            }}
            {...attributes}
            {...listeners}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={cn(
                "w-full text-left p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors",
                isDragging && "opacity-50 cursor-grabbing",
                !isDragging && "cursor-grab",
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                        {task.title}
                    </h4>
                    {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {task.description}
                        </p>
                    )}
                </div>
                <div
                    className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0 mt-1",
                        priorityColors[task.priority],
                    )}
                />
            </div>
            <div className="flex items-center gap-2 mt-2">
                <span
                    className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-medium",
                        task.priority === "low" &&
                            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                        task.priority === "medium" &&
                            "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
                        task.priority === "high" &&
                            "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
                        task.priority === "urgent" &&
                            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                    )}
                >
                    {priorityLabels[task.priority]}
                </span>
                {task.status !== "pending" && (
                    <span
                        className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-medium",
                            task.status === "completed" &&
                                "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                            task.status === "in_progress" &&
                                "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                            task.status === "cancelled" &&
                                "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
                        )}
                    >
                        {task.status === "completed" && "Completada"}
                        {task.status === "in_progress" && "En progreso"}
                        {task.status === "cancelled" && "Cancelada"}
                    </span>
                )}
            </div>
        </div>
    );
}

export default function Calendario() {
    const { tasks, loading, updateTask } = useTasks();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showTaskDialog, setShowTaskDialog] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);

    // Filtros para tareas sin fecha
    const [searchQuery, setSearchQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Obtener el primer y último día del mes actual
    const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
    );
    const lastDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
    );

    // Calcular días a mostrar (incluyendo días del mes anterior y siguiente)
    // Ajustar para que la semana empiece en lunes (0 = Lunes)
    const startDayRaw = firstDayOfMonth.getDay(); // 0 = Domingo
    const startDay = startDayRaw === 0 ? 6 : startDayRaw - 1; // Convertir a 0 = Lunes
    const daysInMonth = lastDayOfMonth.getDate();

    const calendarDays = useMemo(() => {
        const days: (Date | null)[] = [];

        // Días del mes anterior
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }

        // Días del mes actual
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(
                new Date(currentDate.getFullYear(), currentDate.getMonth(), i),
            );
        }

        return days;
    }, [currentDate, startDay, daysInMonth]);

    // Función para obtener tareas de un día específico (con dueDate)
    const getTasksForDay = (date: Date): Task[] => {
        if (!date) return [];
        return tasks.filter((task) => {
            if (!task.dueDate) return false;
            // Extraer solo la fecha sin considerar zona horaria
            // Si dueDate viene como "2026-02-04T00:00:00.000Z", extraemos "2026-02-04"
            const dueDateStr = task.dueDate.split("T")[0];
            const [year, month, day] = dueDateStr.split("-").map(Number);

            // Comparar con la fecha del calendario
            return (
                year === date.getFullYear() &&
                month === date.getMonth() + 1 && // getMonth() es 0-indexed
                day === date.getDate()
            );
        });
    };

    // Obtener tareas sin fecha de vencimiento
    const tasksWithoutDueDate = tasks.filter((task) => !task.dueDate);

    // Filtrar tareas sin fecha según criterios
    const filteredTasksWithoutDueDate = useMemo(() => {
        return tasksWithoutDueDate.filter((task) => {
            // Filtro de búsqueda
            const matchesSearch =
                searchQuery === "" ||
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (task.description
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()) ??
                    false);

            // Filtro de prioridad
            const matchesPriority =
                priorityFilter === "all" || task.priority === priorityFilter;

            // Filtro de estado
            const matchesStatus =
                statusFilter === "all" || task.status === statusFilter;

            return matchesSearch && matchesPriority && matchesStatus;
        });
    }, [tasksWithoutDueDate, searchQuery, priorityFilter, statusFilter]);

    // Función para contar tareas por prioridad en un día
    const getTaskCountsByPriority = (date: Date): Record<string, number> => {
        const dayTasks = getTasksForDay(date);
        return dayTasks.reduce(
            (acc, task) => {
                acc[task.priority] = (acc[task.priority] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>,
        );
    };

    // Función para obtener la prioridad más alta de un día
    const getHighestPriority = (
        date: Date,
    ): "urgent" | "high" | "medium" | "low" | null => {
        const dayTasks = getTasksForDay(date);
        if (dayTasks.length === 0) return null;

        const priorityOrder = ["urgent", "high", "medium", "low"];
        for (const priority of priorityOrder) {
            if (dayTasks.some((task) => task.priority === priority)) {
                return priority as "urgent" | "high" | "medium" | "low";
            }
        }
        return null;
    };

    // Navegar entre meses
    const previousMonth = () => {
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
        );
    };

    const nextMonth = () => {
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
        );
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    // Verificar si una fecha es hoy
    const isToday = (date: Date | null): boolean => {
        if (!date) return false;
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    // Verificar si una fecha está seleccionada
    const isSelected = (date: Date | null): boolean => {
        if (!date || !selectedDate) return false;
        return (
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear()
        );
    };

    const selectedDayTasks = selectedDate ? getTasksForDay(selectedDate) : [];

    // Funciones para vista rápida
    // Obtener tareas atrasadas
    const getOverdueTasks = (): Task[] => {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

        return tasks.filter((task) => {
            if (
                !task.dueDate ||
                task.status === "completed" ||
                task.status === "cancelled"
            )
                return false;

            // Extraer solo la fecha sin zona horaria
            const dueDateStr = task.dueDate.split("T")[0];
            return dueDateStr < todayStr;
        });
    };

    // Calcular carga del día de hoy
    const getTodayLoad = (): {
        level: "low" | "medium" | "high";
        count: number;
    } => {
        const today = new Date();
        const todayTasks = getTasksForDay(today).filter(
            (task) =>
                task.status !== "completed" && task.status !== "cancelled",
        );
        const count = todayTasks.length;

        // Calcular peso de prioridades
        const weight = todayTasks.reduce((acc, task) => {
            const weights = { low: 1, medium: 2, high: 3, urgent: 4 };
            return acc + weights[task.priority];
        }, 0);

        if (count === 0) return { level: "low", count: 0 };
        if (count <= 2 || weight <= 4) return { level: "low", count };
        if (count <= 5 || weight <= 10) return { level: "medium", count };
        return { level: "high", count };
    };

    // Obtener estado del día
    const getTodayStatus = (): {
        status: "completed" | "pending" | "in_progress";
        count: number;
    } => {
        const today = new Date();
        const todayTasks = getTasksForDay(today);
        const pendingTasks = todayTasks.filter(
            (task) =>
                task.status === "pending" || task.status === "in_progress",
        );

        if (todayTasks.length === 0) return { status: "completed", count: 0 };
        if (pendingTasks.length === 0)
            return { status: "completed", count: todayTasks.length };
        if (todayTasks.some((task) => task.status === "in_progress")) {
            return { status: "in_progress", count: pendingTasks.length };
        }
        return { status: "pending", count: pendingTasks.length };
    };

    const overdueTasks = getOverdueTasks();
    const todayLoad = getTodayLoad();
    const todayStatus = getTodayStatus();

    // Configurar sensores para drag and drop
    // MouseSensor para desktop, TouchSensor con delay para móviles
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 750, // 750ms de long press
                tolerance: 10, // 10px de tolerancia
            },
        }),
    );

    // Handlers para drag and drop
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const taskId = (active.id as string).replace("calendar-task-", "");
        const targetDateStr = over.id as string;

        // Verificar que se está soltando sobre un día válido
        if (!targetDateStr.startsWith("calendar-day-")) return;

        // Extraer la fecha del id del día
        const [year, month, day] = targetDateStr
            .replace("calendar-day-", "")
            .split("-")
            .map(Number);

        // Crear la fecha en formato ISO (YYYY-MM-DD)
        const newDueDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        try {
            await updateTask(taskId, { dueDate: newDueDate });
        } catch (error) {
            console.error("Error actualizando fecha de tarea:", error);
        }
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    // Abrir dialog de tarea
    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setShowTaskDialog(true);
    };

    // Actualizar estado de tarea
    const handleStatusChange = async (status: Task["status"]) => {
        if (!selectedTask) return;
        try {
            await updateTask(selectedTask.id, { status });
            setShowTaskDialog(false);
            setSelectedTask(null);
        } catch (error) {
            console.error("Error actualizando tarea:", error);
        }
    };

    if (loading) {
        return (
            <MainLayout title="Calendario">
                <div className="flex items-center justify-center h-96">
                    <p className="text-muted-foreground">Cargando...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="Calendario">
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <div className="space-y-6 p-6 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Calendario
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Visualiza tus tareas por fecha
                            </p>
                        </div>
                        <Button onClick={goToToday} variant="outline" size="sm">
                            Hoy
                        </Button>
                    </div>

                    {/* Vista rápida */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Tareas atrasadas */}
                        <div
                            className={cn(
                                "bg-card rounded-lg border p-4",
                                overdueTasks.length > 0
                                    ? "border-red-500/50 bg-red-50/50 dark:bg-red-950/20"
                                    : "border-border",
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={cn(
                                        "p-2 rounded-full",
                                        overdueTasks.length > 0
                                            ? "bg-red-500/10"
                                            : "bg-muted",
                                    )}
                                >
                                    <AlertTriangle
                                        className={cn(
                                            "h-5 w-5",
                                            overdueTasks.length > 0
                                                ? "text-red-500"
                                                : "text-muted-foreground",
                                        )}
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Tareas atrasadas
                                    </p>
                                    <p
                                        className={cn(
                                            "text-2xl font-bold",
                                            overdueTasks.length > 0
                                                ? "text-red-500"
                                                : "text-foreground",
                                        )}
                                    >
                                        {overdueTasks.length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Carga del día */}
                        <div
                            className={cn(
                                "bg-card rounded-lg border p-4",
                                todayLoad.level === "high" &&
                                    "border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20",
                                todayLoad.level === "medium" &&
                                    "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20",
                                todayLoad.level === "low" && "border-border",
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={cn(
                                        "p-2 rounded-full",
                                        todayLoad.level === "high" &&
                                            "bg-orange-500/10",
                                        todayLoad.level === "medium" &&
                                            "bg-yellow-500/10",
                                        todayLoad.level === "low" && "bg-muted",
                                    )}
                                >
                                    <TrendingUp
                                        className={cn(
                                            "h-5 w-5",
                                            todayLoad.level === "high" &&
                                                "text-orange-500",
                                            todayLoad.level === "medium" &&
                                                "text-yellow-500",
                                            todayLoad.level === "low" &&
                                                "text-muted-foreground",
                                        )}
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Carga de hoy
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {todayLoad.level === "high" && "Alta"}
                                        {todayLoad.level === "medium" &&
                                            "Media"}
                                        {todayLoad.level === "low" &&
                                            (todayLoad.count > 0
                                                ? "Baja"
                                                : "Sin tareas")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Estado del día */}
                        <div
                            className={cn(
                                "bg-card rounded-lg border p-4",
                                todayStatus.status === "completed" &&
                                    "border-green-500/50 bg-green-50/50 dark:bg-green-950/20",
                                todayStatus.status === "in_progress" &&
                                    "border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20",
                                todayStatus.status === "pending" &&
                                    "border-border",
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={cn(
                                        "p-2 rounded-full",
                                        todayStatus.status === "completed" &&
                                            "bg-green-500/10",
                                        todayStatus.status === "in_progress" &&
                                            "bg-blue-500/10",
                                        todayStatus.status === "pending" &&
                                            "bg-muted",
                                    )}
                                >
                                    <CheckCircle
                                        className={cn(
                                            "h-5 w-5",
                                            todayStatus.status ===
                                                "completed" && "text-green-500",
                                            todayStatus.status ===
                                                "in_progress" &&
                                                "text-blue-500",
                                            todayStatus.status === "pending" &&
                                                "text-muted-foreground",
                                        )}
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Estado de hoy
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {todayStatus.status === "completed" &&
                                            "Completado"}
                                        {todayStatus.status === "in_progress" &&
                                            `${todayStatus.count} en curso`}
                                        {todayStatus.status === "pending" &&
                                            `${todayStatus.count} pendiente${todayStatus.count !== 1 ? "s" : ""}`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contenedor principal */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Calendario */}
                        <div className="bg-card rounded-lg border border-border p-6 lg:col-span-2">
                            {/* Controles de navegación */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-semibold">
                                    {MONTHS[currentDate.getMonth()]}{" "}
                                    {currentDate.getFullYear()}
                                </h2>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={previousMonth}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={nextMonth}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Días de la semana */}
                            <div className="grid grid-cols-7 gap-2 mb-2">
                                {DAYS.map((day) => (
                                    <div
                                        key={day}
                                        className="text-center text-sm font-medium text-muted-foreground py-2"
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Días del mes */}
                            <div className="grid grid-cols-7 gap-2">
                                {calendarDays.map((date, index) => {
                                    if (!date) {
                                        return (
                                            <div
                                                key={`empty-${index}`}
                                                className="aspect-square"
                                            />
                                        );
                                    }

                                    const taskCounts =
                                        getTaskCountsByPriority(date);
                                    const hasTasks =
                                        Object.keys(taskCounts).length > 0;
                                    const totalTasks = Object.values(
                                        taskCounts,
                                    ).reduce((sum, count) => sum + count, 0);
                                    const highestPriority =
                                        getHighestPriority(date);

                                    return (
                                        <CalendarDay
                                            key={date.toISOString()}
                                            date={date}
                                            isToday={isToday(date)}
                                            isSelected={isSelected(date)}
                                            hasTasks={hasTasks}
                                            totalTasks={totalTasks}
                                            highestPriority={highestPriority}
                                            taskCounts={taskCounts}
                                            onClick={() =>
                                                setSelectedDate(date)
                                            }
                                        />
                                    );
                                })}
                            </div>
                        </div>
                        {/* Panel de tareas del día seleccionado */}
                        <div className="bg-card rounded-lg border border-border p-6">
                            {selectedDate ? (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-semibold">
                                            Tareas - {selectedDate.getDate()} de{" "}
                                            {MONTHS[selectedDate.getMonth()]}
                                        </h3>
                                    </div>

                                    {selectedDayTasks.length === 0 && (
                                        <p className="text-muted-foreground text-sm text-center py-8">
                                            No hay tareas para este día
                                        </p>
                                    )}

                                    {selectedDayTasks.length > 0 && (
                                        <div className="space-y-3">
                                            {selectedDayTasks.map((task) => (
                                                <DraggableTask
                                                    key={task.id}
                                                    task={task}
                                                    onClick={() =>
                                                        handleTaskClick(task)
                                                    }
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center text-muted-foreground py-8">
                                    <p>Selecciona un día para ver las tareas</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tareas sin fecha de vencimiento */}
                    {tasksWithoutDueDate.length > 0 && (
                        <div className="bg-card rounded-lg border border-border p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                    Tareas sin fecha de vencimiento
                                    <span className="text-sm font-normal text-muted-foreground">
                                        ({filteredTasksWithoutDueDate.length}/
                                        {tasksWithoutDueDate.length})
                                    </span>
                                </h2>
                            </div>

                            {/* Filtros */}
                            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                {/* Búsqueda */}
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por título o descripción..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className="pl-9"
                                    />
                                </div>

                                {/* Filtro de prioridad */}
                                <Select
                                    value={priorityFilter}
                                    onValueChange={setPriorityFilter}
                                >
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Prioridad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Todas las prioridades
                                        </SelectItem>
                                        <SelectItem value="low">
                                            Baja
                                        </SelectItem>
                                        <SelectItem value="medium">
                                            Media
                                        </SelectItem>
                                        <SelectItem value="high">
                                            Alta
                                        </SelectItem>
                                        <SelectItem value="urgent">
                                            Urgente
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Filtro de estado */}
                                <Select
                                    value={statusFilter}
                                    onValueChange={setStatusFilter}
                                >
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Todos los estados
                                        </SelectItem>
                                        <SelectItem value="pending">
                                            Pendiente
                                        </SelectItem>
                                        <SelectItem value="in_progress">
                                            En progreso
                                        </SelectItem>
                                        <SelectItem value="completed">
                                            Completada
                                        </SelectItem>
                                        <SelectItem value="cancelled">
                                            Cancelada
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Lista de tareas filtradas */}
                            {filteredTasksWithoutDueDate.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    <p>
                                        No se encontraron tareas con los filtros
                                        aplicados
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {filteredTasksWithoutDueDate.map((task) => (
                                        <button
                                            key={task.id}
                                            onClick={() =>
                                                handleTaskClick(task)
                                            }
                                            className="text-left p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h4 className="font-medium text-sm truncate flex-1">
                                                    {task.title}
                                                </h4>
                                                <div
                                                    className={cn(
                                                        "w-2 h-2 rounded-full flex-shrink-0 mt-1",
                                                        priorityColors[
                                                            task.priority
                                                        ],
                                                    )}
                                                />
                                            </div>
                                            {task.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                                    {task.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span
                                                    className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded-full font-medium",
                                                        task.priority ===
                                                            "low" &&
                                                            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                                                        task.priority ===
                                                            "medium" &&
                                                            "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
                                                        task.priority ===
                                                            "high" &&
                                                            "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
                                                        task.priority ===
                                                            "urgent" &&
                                                            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                                                    )}
                                                >
                                                    {
                                                        priorityLabels[
                                                            task.priority
                                                        ]
                                                    }
                                                </span>
                                                {task.status !== "pending" && (
                                                    <span
                                                        className={cn(
                                                            "text-[10px] px-2 py-0.5 rounded-full font-medium",
                                                            task.status ===
                                                                "completed" &&
                                                                "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                                                            task.status ===
                                                                "in_progress" &&
                                                                "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                                                            task.status ===
                                                                "cancelled" &&
                                                                "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
                                                        )}
                                                    >
                                                        {task.status ===
                                                            "completed" &&
                                                            "Completada"}
                                                        {task.status ===
                                                            "in_progress" &&
                                                            "En progreso"}
                                                        {task.status ===
                                                            "cancelled" &&
                                                            "Cancelada"}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Dialog de detalles de tarea */}
                <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Detalles de la tarea</DialogTitle>
                            <DialogDescription>
                                Ver información y cambiar el estado de la tarea
                            </DialogDescription>
                        </DialogHeader>

                        {selectedTask && (
                            <div className="space-y-6">
                                {/* Título */}
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Título
                                    </label>
                                    <p className="mt-1 text-base font-semibold">
                                        {selectedTask.title}
                                    </p>
                                </div>

                                {/* Descripción */}
                                {selectedTask.description && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Descripción
                                        </label>
                                        <p className="mt-1 text-sm">
                                            {selectedTask.description}
                                        </p>
                                    </div>
                                )}

                                {/* Prioridad */}
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Prioridad
                                    </label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <div
                                            className={cn(
                                                "w-3 h-3 rounded-full",
                                                priorityColors[
                                                    selectedTask.priority
                                                ],
                                            )}
                                        />
                                        <span className="text-sm font-medium">
                                            {
                                                priorityLabels[
                                                    selectedTask.priority
                                                ]
                                            }
                                        </span>
                                    </div>
                                </div>

                                {/* Fecha de vencimiento */}
                                {selectedTask.dueDate && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            Fecha de vencimiento
                                        </label>
                                        <p className="mt-1 text-sm">
                                            {new Date(
                                                selectedTask.dueDate,
                                            ).toLocaleDateString("es-ES", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                )}

                                {/* Estado actual */}
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Estado actual
                                    </label>
                                    <span
                                        className={cn(
                                            "mt-1 inline-block text-xs px-3 py-1 rounded-full font-medium",
                                            selectedTask.status === "pending" &&
                                                "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
                                            selectedTask.status ===
                                                "completed" &&
                                                "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                                            selectedTask.status ===
                                                "in_progress" &&
                                                "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                                            selectedTask.status ===
                                                "cancelled" &&
                                                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                                        )}
                                    >
                                        {selectedTask.status === "pending" &&
                                            "Pendiente"}
                                        {selectedTask.status === "completed" &&
                                            "Completada"}
                                        {selectedTask.status ===
                                            "in_progress" && "En progreso"}
                                        {selectedTask.status === "cancelled" &&
                                            "Cancelada"}
                                    </span>
                                </div>

                                {/* Cambiar estado */}
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                        Cambiar estado
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant={
                                                selectedTask.status ===
                                                "pending"
                                                    ? "default"
                                                    : "outline"
                                            }
                                            size="sm"
                                            onClick={() =>
                                                handleStatusChange("pending")
                                            }
                                            className="w-full"
                                        >
                                            Pendiente
                                        </Button>
                                        <Button
                                            variant={
                                                selectedTask.status ===
                                                "in_progress"
                                                    ? "default"
                                                    : "outline"
                                            }
                                            size="sm"
                                            onClick={() =>
                                                handleStatusChange(
                                                    "in_progress",
                                                )
                                            }
                                            className="w-full"
                                        >
                                            En progreso
                                        </Button>
                                        <Button
                                            variant={
                                                selectedTask.status ===
                                                "completed"
                                                    ? "default"
                                                    : "outline"
                                            }
                                            size="sm"
                                            onClick={() =>
                                                handleStatusChange("completed")
                                            }
                                            className="w-full"
                                        >
                                            Completada
                                        </Button>
                                        <Button
                                            variant={
                                                selectedTask.status ===
                                                "cancelled"
                                                    ? "default"
                                                    : "outline"
                                            }
                                            size="sm"
                                            onClick={() =>
                                                handleStatusChange("cancelled")
                                            }
                                            className="w-full"
                                        >
                                            Cancelada
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* DragOverlay para mostrar la tarea mientras se arrastra */}
                <DragOverlay dropAnimation={null}>
                    {activeId &&
                        (() => {
                            const task = tasks?.find(
                                (t) => `calendar-task-${t.id}` === activeId,
                            );
                            if (!task) return null;
                            return (
                                <div className="p-3 rounded-lg border border-border bg-card shadow-lg cursor-grabbing opacity-90">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm truncate">
                                                {task.title}
                                            </h4>
                                        </div>
                                        <div
                                            className={cn(
                                                "w-2 h-2 rounded-full flex-shrink-0 mt-1",
                                                priorityColors[task.priority],
                                            )}
                                        />
                                    </div>
                                </div>
                            );
                        })()}
                </DragOverlay>
            </DndContext>
        </MainLayout>
    );
}
