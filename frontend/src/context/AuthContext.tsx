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
            setUser(result.user);
            setAccessToken(result.accessToken);
            localStorage.setItem("accessToken", result.accessToken);
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
