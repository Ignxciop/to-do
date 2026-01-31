import express from "express";
import {
    registerController,
    loginController,
    meController,
} from "../controllers/auth.js";
import { registerValidator, loginValidator } from "../validators/auth.js";

const router = express.Router();

router.post("/register", registerValidator, registerController);
router.post("/login", loginValidator, loginController);
router.get("/me", meController);

export default router;
