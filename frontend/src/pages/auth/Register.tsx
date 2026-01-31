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

export default function Register() {
    const [form, setForm] = useState({
        name: "",
        lastname: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const { register, loading } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await register(form);
            navigate("/");
        } catch (err: any) {
            setError(err.message || "Error al registrarse");
        }
    };

    return (
        <AuthLayout>
            <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6 text-center">
                    Registro
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="lastname">Apellido</Label>
                        <Input
                            id="lastname"
                            name="lastname"
                            type="text"
                            value={form.lastname}
                            onChange={handleChange}
                            required
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            className="mt-1"
                        />
                    </div>
                    {error && <Alert variant="destructive">{error}</Alert>}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Cargando..." : "Registrarse"}
                    </Button>
                </form>
                <p className="mt-4 text-center text-sm">
                    ¿Ya tienes cuenta?{" "}
                    <Link
                        to="/auth/login"
                        className="text-blue-600 hover:underline"
                    >
                        Inicia sesión
                    </Link>
                </p>
            </Card>
        </AuthLayout>
    );
}
