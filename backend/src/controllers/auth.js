import * as authService from "../services/auth.js";

export const registerController = async (req, res) => {
    try {
        const user = await authService.register(req.body);
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const loginController = async (req, res) => {
    try {
        const token = await authService.login(req.body);
        res.json({ token });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
};

export const meController = async (req, res) => {
    try {
        const user = await authService.me(req);
        res.json(user);
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
};
