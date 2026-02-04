import express from "express";
import {
    registerController,
    loginController,
    refreshController,
    logoutController,
    verifyEmailController,
    resendVerificationController,
} from "../controllers/auth.js";
import {
    registerValidator,
    loginValidator,
    verifyEmailValidator,
    resendVerificationValidator,
} from "../validators/auth.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { getUserById } from "../services/auth.js";

const router = express.Router();

router.post("/auth/register", registerValidator, registerController);
router.post("/auth/verify-email", verifyEmailValidator, verifyEmailController);
router.post(
    "/auth/resend-verification",
    resendVerificationValidator,
    resendVerificationController,
);
router.post("/auth/login", loginValidator, loginController);
router.post("/auth/refresh", refreshController);
router.post("/auth/logout", logoutController);

router.get("/me", requireAuth, async (req, res) => {
    try {
        const user = await getUserById(req.user.id);
        if (!user)
            return res.status(404).json({ error: "Usuario no encontrado" });
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: "Error al obtener usuario" });
    }
});

export default router;
