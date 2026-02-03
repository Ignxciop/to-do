import * as folderService from "../services/folder.js";

export const getAllFoldersController = async (req, res) => {
    try {
        const userId = req.user.id;
        const filters = {
            parentId: req.query.parentId,
            search: req.query.search,
            sortBy: req.query.sortBy,
            order: req.query.order,
        };

        const folders = await folderService.getAllFolders(userId, filters);
        res.json({ folders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getFolderByIdController = async (req, res) => {
    try {
        const userId = req.user.id;
        const folderId = req.params.id;

        const folder = await folderService.getFolderById(folderId, userId);
        res.json({ folder });
    } catch (err) {
        const status = err.message.includes("permiso")
            ? 403
            : err.message.includes("no encontrada")
              ? 404
              : 500;
        res.status(status).json({ error: err.message });
    }
};

export const createFolderController = async (req, res) => {
    try {
        const userId = req.user.id;
        const folder = await folderService.createFolder(req.body, userId);
        res.status(201).json({ folder });
    } catch (err) {
        const status =
            err.message.includes("permiso") ||
            err.message.includes("no encontrada")
                ? 400
                : 500;
        res.status(status).json({ error: err.message });
    }
};

export const updateFolderController = async (req, res) => {
    try {
        const userId = req.user.id;
        const folderId = req.params.id;

        const folder = await folderService.updateFolder(
            folderId,
            req.body,
            userId,
        );
        res.json({ folder });
    } catch (err) {
        const status = err.message.includes("permiso")
            ? 403
            : err.message.includes("no encontrada")
              ? 404
              : err.message.includes("ciclo") ||
                  err.message.includes("subcarpetas") ||
                  err.message.includes("propio padre")
                ? 400
                : 500;
        res.status(status).json({ error: err.message });
    }
};

export const deleteFolderController = async (req, res) => {
    try {
        const userId = req.user.id;
        const folderId = req.params.id;

        const result = await folderService.deleteFolder(folderId, userId);
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
