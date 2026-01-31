import { prisma } from "../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (data) => {
    const { name, lastname, email, password } = data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error("El email ya está registrado");
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: { name, lastname, email, password: hashed },
    });
    return {
        id: user.id,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        createdAt: user.createdAt,
    };
};

export const login = async (data) => {
    const { email, password } = data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Credenciales inválidas");
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Credenciales inválidas");
    const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "1d" },
    );
    return token;
};

export const me = async (req) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) throw new Error("No autenticado");
    const token = auth.split(" ")[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || "secret");
        const user = await prisma.user.findUnique({
            where: { id: payload.id },
        });
        if (!user) throw new Error("No autenticado");
        return {
            id: user.id,
            name: user.name,
            lastname: user.lastname,
            email: user.email,
            createdAt: user.createdAt,
        };
    } catch {
        throw new Error("Token inválido");
    }
};
