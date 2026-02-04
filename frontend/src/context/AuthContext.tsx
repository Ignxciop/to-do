import { createContext, useContext, useState, useEffect } from "react";

export interface User {
    id: string;
    name: string;
    lastname: string;
    email: string;
}

interface AuthContextProps {
    user: User | null;
    setUser: (user: User | null) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    accessToken: string | null;
    setAccessToken: (token: string | null) => void;
    login: (email: string, password: string) => Promise<void>;
    register: (data: {
        name: string;
        lastname: string;
        email: string;
        password: string;
    }) => Promise<void>;
    verifyEmail: (email: string, code: string) => Promise<void>;
    resendVerification: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(
    undefined,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true); // loading inicia en true

    useEffect(() => {
        refresh();
    }, []);

    async function login(email: string, password: string) {
        setLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || "Error al iniciar sesión");
            setUser(data.user);
            setAccessToken(data.accessToken);
            localStorage.setItem("accessToken", data.accessToken);
        } finally {
            setLoading(false);
        }
    }

    async function register(data: {
        name: string;
        lastname: string;
        email: string;
        password: string;
    }) {
        setLoading(true);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(data),
            });
            const result = await res.json();
            if (!res.ok)
                throw new Error(result.error || "Error al registrarse");
            // NO establecer usuario ni token aquí - esperar verificación
            // El usuario debe verificar su email primero
        } finally {
            setLoading(false);
        }
    }

    async function refresh() {
        setLoading(true);
        try {
            const res = await fetch("/api/auth/refresh", {
                method: "POST",
                credentials: "include",
            });
            const data = await res.json();
            if (res.ok && data.accessToken) {
                setAccessToken(data.accessToken);
                localStorage.setItem("accessToken", data.accessToken);
                const meRes = await fetch("/api/me", {
                    headers: { Authorization: `Bearer ${data.accessToken}` },
                });
                if (meRes.ok) {
                    const meData = await meRes.json();
                    setUser(meData.user);
                }
            } else {
                setUser(null);
                setAccessToken(null);
                localStorage.removeItem("accessToken");
            }
        } finally {
            setLoading(false);
        }
    }

    async function logout() {
        setLoading(true);
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });
        } finally {
            setUser(null);
            setAccessToken(null);
            localStorage.removeItem("accessToken");
            setLoading(false);
        }
    }

    async function verifyEmail(email: string, code: string) {
        setLoading(true);
        try {
            const res = await fetch("/api/auth/verify-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, code }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || "Error al verificar email");
            setUser(data.user);
            setAccessToken(data.accessToken);
            localStorage.setItem("accessToken", data.accessToken);
        } finally {
            setLoading(false);
        }
    }

    async function resendVerification(email: string) {
        const res = await fetch("/api/auth/resend-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok)
            throw new Error(
                data.error || "Error al reenviar código de verificación",
            );
        return data;
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                loading,
                setLoading,
                accessToken,
                setAccessToken,
                login,
                register,
                verifyEmail,
                resendVerification,
                logout,
                refresh,
            }}
        >
            {loading ? null : children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
