import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "../components/ui/button";
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

export default function Calendario() {
    const { tasks, loading, updateTask } = useTasks();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showTaskDialog, setShowTaskDialog] = useState(false);

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

    // Función para obtener tareas de un día específico
    const getTasksForDay = (date: Date): Task[] => {
        if (!date) return [];
        return tasks.filter((task) => {
            // Usar createdAt para mostrar tareas en el calendario
            const taskDate = new Date(task.createdAt);
            // Normalizar ambas fechas a medianoche para comparación
            const normalizedTaskDate = new Date(
                taskDate.getFullYear(),
                taskDate.getMonth(),
                taskDate.getDate(),
            );
            const normalizedDate = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
            );
            return normalizedTaskDate.getTime() === normalizedDate.getTime();
        });
    };

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
                                    <button
                                        key={date.toISOString()}
                                        onClick={() => setSelectedDate(date)}
                                        className={cn(
                                            "aspect-square rounded-lg border transition-all hover:border-primary hover:shadow-sm relative p-2",
                                            isToday(date) &&
                                                "border-primary border-2 font-bold",
                                            isSelected(date) &&
                                                "bg-primary text-primary-foreground",
                                            !isSelected(date) &&
                                                "bg-background hover:bg-accent",
                                            // Borde con color de prioridad más alta en mobile
                                            hasTasks &&
                                                highestPriority &&
                                                !isSelected(date) &&
                                                !isToday(date) &&
                                                "md:border md:border-border border-l-4",
                                            hasTasks &&
                                                highestPriority === "urgent" &&
                                                !isSelected(date) &&
                                                !isToday(date) &&
                                                "border-l-red-500",
                                            hasTasks &&
                                                highestPriority === "high" &&
                                                !isSelected(date) &&
                                                !isToday(date) &&
                                                "border-l-orange-500",
                                            hasTasks &&
                                                highestPriority === "medium" &&
                                                !isSelected(date) &&
                                                !isToday(date) &&
                                                "border-l-yellow-500",
                                            hasTasks &&
                                                highestPriority === "low" &&
                                                !isSelected(date) &&
                                                !isToday(date) &&
                                                "border-l-blue-500",
                                        )}
                                    >
                                        <div className="flex flex-col h-full">
                                            <div className="flex items-start justify-between">
                                                <span className="text-sm">
                                                    {date.getDate()}
                                                </span>
                                                {/* Badge mobile con total de tareas */}
                                                {hasTasks && (
                                                    <span
                                                        className={cn(
                                                            "md:hidden text-[7px] font-bold min-w-[12px] h-[12px] px-0.5 rounded-full flex items-center justify-center",
                                                            highestPriority ===
                                                                "urgent" &&
                                                                "bg-red-500 text-white",
                                                            highestPriority ===
                                                                "high" &&
                                                                "bg-orange-500 text-white",
                                                            highestPriority ===
                                                                "medium" &&
                                                                "bg-yellow-500 text-white",
                                                            highestPriority ===
                                                                "low" &&
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
                                                    {Object.entries(
                                                        taskCounts,
                                                    ).map(
                                                        ([priority, count]) => (
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
                                                                <span className="text-[10px]">
                                                                    {count}
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </button>
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
                                            <button
                                                key={task.id}
                                                onClick={() =>
                                                    handleTaskClick(task)
                                                }
                                                className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-sm truncate">
                                                            {task.title}
                                                        </h4>
                                                        {task.description && (
                                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                                {
                                                                    task.description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div
                                                        className={cn(
                                                            "w-2 h-2 rounded-full flex-shrink-0 mt-1",
                                                            priorityColors[
                                                                task.priority
                                                            ],
                                                        )}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
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
                                                    {task.status !==
                                                        "pending" && (
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
                            </>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                <p>Selecciona un día para ver las tareas</p>
                            </div>
                        )}
                    </div>
                </div>
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
                                        {priorityLabels[selectedTask.priority]}
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
                                        selectedTask.status === "completed" &&
                                            "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                                        selectedTask.status === "in_progress" &&
                                            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                                        selectedTask.status === "cancelled" &&
                                            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                                    )}
                                >
                                    {selectedTask.status === "pending" &&
                                        "Pendiente"}
                                    {selectedTask.status === "completed" &&
                                        "Completada"}
                                    {selectedTask.status === "in_progress" &&
                                        "En progreso"}
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
                                            selectedTask.status === "pending"
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
                                            handleStatusChange("in_progress")
                                        }
                                        className="w-full"
                                    >
                                        En progreso
                                    </Button>
                                    <Button
                                        variant={
                                            selectedTask.status === "completed"
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
                                            selectedTask.status === "cancelled"
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
        </MainLayout>
    );
}
