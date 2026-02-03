import express from "express";
import {
    getAllFoldersController,
    getFolderByIdController,
    createFolderController,
    updateFolderController,
    deleteFolderController,
} from "../controllers/folder.js";
import {
    createFolderValidator,
    updateFolderValidator,
} from "../validators/folder.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/folders", requireAuth, getAllFoldersController);
router.post(
    "/folder",
    requireAuth,
    createFolderValidator,
    createFolderController,
);
router.get("/folder/:id", requireAuth, getFolderByIdController);
router.put(
    "/folder/:id",
    requireAuth,
    updateFolderValidator,
    updateFolderController,
);
router.delete("/folder/:id", requireAuth, deleteFolderController);

export default router;
