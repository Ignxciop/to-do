import { body, validationResult } from "express-validator";

export const registerValidator = [
    body("name").notEmpty().withMessage("El nombre es requerido"),
    body("lastname").notEmpty().withMessage("El apellido es requerido"),
    body("email").isEmail().withMessage("Email inválido"),
    body("password")
        .isLength({ min: 6 })
        .withMessage("La contraseña debe tener al menos 6 caracteres"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

export const loginValidator = [
    body("email").isEmail().withMessage("Email inválido"),
    body("password").notEmpty().withMessage("La contraseña es requerida"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

export const verifyEmailValidator = [
    body("email").isEmail().withMessage("Email inválido"),
    body("code")
        .notEmpty()
        .withMessage("El código de verificación es requerido")
        .isLength({ min: 6, max: 6 })
        .withMessage("El código debe tener 6 dígitos")
        .isNumeric()
        .withMessage("El código debe ser numérico"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

export const resendVerificationValidator = [
    body("email").isEmail().withMessage("Email inválido"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
