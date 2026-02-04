import express from "express";
import {
    getAllTasksController,
    getTaskByIdController,
    createTaskController,
    updateTaskController,
    deleteTaskController,
} from "../controllers/task.js";
import { getTasksSummaryController } from "../controllers/taskSummary.js";
import {
    createTaskValidator,
    updateTaskValidator,
} from "../validators/task.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/tasks", requireAuth, getAllTasksController);
router.get("/tasks/summary", requireAuth, getTasksSummaryController);
router.post("/task", requireAuth, createTaskValidator, createTaskController);
router.get("/task/:id", requireAuth, getTaskByIdController);
router.put("/task/:id", requireAuth, updateTaskValidator, updateTaskController);
router.delete("/task/:id", requireAuth, deleteTaskController);

export default router;
