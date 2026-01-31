import { verifyAccessToken } from "../services/token.js";

export function requireAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No autenticado" });
    }
    const token = auth.split(" ")[1];
    try {
        const payload = verifyAccessToken(token);
        req.user = payload;
        next();
    } catch {
        return res.status(401).json({ error: "Token inválido" });
    }
}
