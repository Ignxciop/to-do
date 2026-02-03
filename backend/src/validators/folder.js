import { body, validationResult } from "express-validator";

export const createFolderValidator = [
    body("name").notEmpty().withMessage("El nombre es requerido"),
    body("color").optional(),
    body("icon").optional(),
    body("parentId")
        .optional()
        .isUUID()
        .withMessage("ID de carpeta padre inválido"),
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

export const updateFolderValidator = [
    body("name")
        .optional()
        .notEmpty()
        .withMessage("El nombre no puede estar vacío"),
    body("color").optional(),
    body("icon").optional(),
    body("parentId")
        .optional({ nullable: true })
        .custom((value) => {
            if (value === null) return true;
            // Validar UUID si no es null
            const uuidRegex =
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(value)) {
                throw new Error("ID de carpeta padre inválido");
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
