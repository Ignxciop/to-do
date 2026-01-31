import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_SECRET || "access_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";
const ACCESS_EXPIRES = "15m";
const REFRESH_EXPIRES = "7d";

export function generateAccessToken(user) {
    return jwt.sign({ id: user.id, email: user.email }, ACCESS_SECRET, {
        expiresIn: ACCESS_EXPIRES,
    });
}

export function generateRefreshToken(user) {
    return jwt.sign({ id: user.id, email: user.email }, REFRESH_SECRET, {
        expiresIn: REFRESH_EXPIRES,
    });
}

export function verifyAccessToken(token) {
    return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
    return jwt.verify(token, REFRESH_SECRET);
}
