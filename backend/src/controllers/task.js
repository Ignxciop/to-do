import * as taskService from "../services/task.js";

export const getAllTasksController = async (req, res) => {
    try {
        const userId = req.user.id;
        const filters = {
            status: req.query.status,
            folderId: req.query.folderId,
            priority: req.query.priority,
            search: req.query.search,
            sortBy: req.query.sortBy,
            order: req.query.order,
        };

        const tasks = await taskService.getAllTasks(userId, filters);
        res.json({ tasks });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getTaskByIdController = async (req, res) => {
    try {
        const userId = req.user.id;
        const taskId = req.params.id;

        const task = await taskService.getTaskById(taskId, userId);
        res.json({ task });
    } catch (err) {
        const status = err.message.includes("permiso")
            ? 403
            : err.message.includes("no encontrada")
              ? 404
              : 500;
        res.status(status).json({ error: err.message });
    }
};

export const createTaskController = async (req, res) => {
    try {
        const userId = req.user.id;
        const task = await taskService.createTask(req.body, userId);
        res.status(201).json({ task });
    } catch (err) {
        const status =
            err.message.includes("permiso") ||
            err.message.includes("no encontrada")
                ? 400
                : 500;
        res.status(status).json({ error: err.message });
    }
};

export const updateTaskController = async (req, res) => {
    try {
        const userId = req.user.id;
        const taskId = req.params.id;

        const task = await taskService.updateTask(taskId, req.body, userId);
        res.json({ task });
    } catch (err) {
        const status = err.message.includes("permiso")
            ? 403
            : err.message.includes("no encontrada")
              ? 404
              : 500;
        res.status(status).json({ error: err.message });
    }
};

export const deleteTaskController = async (req, res) => {
    try {
        const userId = req.user.id;
        const taskId = req.params.id;

        const result = await taskService.deleteTask(taskId, userId);
        res.json(result);
    } catch (err) {
        const status = err.message.includes("permiso")
            ? 403
            : err.message.includes("no encontrada")
              ? 404
              : 500;
        res.status(status).json({ error: err.message });
    }
};
