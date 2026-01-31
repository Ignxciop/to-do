import { prisma } from "../config/prisma.js";
import bcrypt from "bcryptjs";

export async function register(data) {
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
}

export async function login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Credenciales inválidas");
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Credenciales inválidas");
    return user;
}

export async function getUserById(id) {
    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
            createdAt: true,
        },
    });
}
