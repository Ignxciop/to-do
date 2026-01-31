import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import AuthLayout from "../../layout/AuthLayout";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Alert } from "../../components/ui/alert";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await login(email, password);
            navigate("/");
        } catch (err: any) {
            setError(err.message || "Error al iniciar sesión");
        }
    };

    return (
        <AuthLayout>
            <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6 text-center">
                    Iniciar sesión
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) => setEmail(e.target.value)}
                            required
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) => setPassword(e.target.value)}
                            required
                            className="mt-1"
                        />
                    </div>
                    {error && <Alert variant="destructive">{error}</Alert>}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Cargando..." : "Entrar"}
                    </Button>
                </form>
                <p className="mt-4 text-center text-sm">
                    ¿No tienes cuenta?{" "}
                    <Link
                        to="/auth/register"
                        className="text-blue-600 hover:underline"
                    >
                        Regístrate
                    </Link>
                </p>
            </Card>
        </AuthLayout>
    );
}
