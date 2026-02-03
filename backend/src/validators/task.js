import { body, validationResult } from "express-validator";

export const createTaskValidator = [
    body("title").notEmpty().withMessage("El título es requerido"),
    body("description").optional(),
    body("status")
        .optional()
        .isIn(["pending", "in_progress", "completed", "cancelled"])
        .withMessage("Estado inválido"),
    body("priority")
        .optional()
        .isIn(["low", "medium", "high", "urgent"])
        .withMessage("Prioridad inválida"),
    body("dueDate").optional().isISO8601().withMessage("Fecha límite inválida"),
    body("folderId").optional().isUUID().withMessage("ID de carpeta inválido"),
    body("position")
        .optional()
        .isInt({ min: 0 })
        .withMessage("La posición debe ser un número entero positivo"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

export const updateTaskValidator = [
    body("title")
        .optional()
        .notEmpty()
        .withMessage("El título no puede estar vacío"),
    body("description").optional(),
    body("status")
        .optional()
        .isIn(["pending", "in_progress", "completed", "cancelled"])
        .withMessage("Estado inválido"),
    body("priority")
        .optional()
        .isIn(["low", "medium", "high", "urgent"])
        .withMessage("Prioridad inválida"),
    body("dueDate").optional().isISO8601().withMessage("Fecha límite inválida"),
    body("folderId")
        .optional({ nullable: true })
        .custom((value) => {
            if (value === null) return true;
            // Validar UUID si no es null
            const uuidRegex =
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(value)) {
                throw new Error("ID de carpeta inválido");
            }
            return true;
        }),
    body("position")
        .optional()
        .isInt({ min: 0 })
        .withMessage("La posición debe ser un número entero positivo"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
