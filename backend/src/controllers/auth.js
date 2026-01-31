import * as authService from "../services/auth.js";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from "../services/token.js";

export const registerController = async (req, res) => {
    try {
        const user = await authService.register(req.body);
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/api/auth/refresh",
        });
        res.status(201).json({
            user: {
                id: user.id,
                name: user.name,
                lastname: user.lastname,
                email: user.email,
            },
            accessToken,
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const loginController = async (req, res) => {
    try {
        const user = await authService.login(req.body);
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/api/auth/refresh",
        });
        res.json({
            user: {
                id: user.id,
                name: user.name,
                lastname: user.lastname,
                email: user.email,
            },
            accessToken,
        });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
};

export const refreshController = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) throw new Error("No refresh token");
        const payload = verifyRefreshToken(refreshToken);
        const user = await authService.getUserById(payload.id);
        if (!user) throw new Error("Usuario no encontrado");
        const accessToken = generateAccessToken(user);
        res.json({ accessToken });
    } catch (err) {
        res.status(401).json({ error: "Refresh token inválido" });
    }
};

export const logoutController = (req, res) => {
    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
    res.status(204).end();
};
