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
        confirmPassword: "",
    });
    const [verificationCode, setVerificationCode] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showVerification, setShowVerification] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState("");
    const { register, verifyEmail, resendVerification, loading } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Validar que las contraseñas coincidan
        if (form.password !== form.confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        // Validar longitud mínima de contraseña
        if (form.password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        try {
            await register({
                name: form.name,
                lastname: form.lastname,
                email: form.email,
                password: form.password,
            });
            setRegisteredEmail(form.email);
            setShowVerification(true);
            setSuccess(
                "Cuenta creada exitosamente. Revisa tu correo para obtener el código de verificación.",
            );
        } catch (err: any) {
            // Si el error es por cuenta existente no verificada, mostrar pantalla de verificación
            if (
                err.message.includes("en proceso de verificación") ||
                err.message.includes("verifica tu correo")
            ) {
                setRegisteredEmail(form.email);
                setShowVerification(true);
            } else {
                setError(err.message || "Error al registrarse");
            }
        }
    };

    const handleVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        try {
            await verifyEmail(registeredEmail, verificationCode);
            setSuccess("¡Email verificado exitosamente!");
            setTimeout(() => navigate("/"), 1500);
        } catch (err: any) {
            setError(err.message || "Error al verificar código");
        }
    };

    const handleResend = async () => {
        setError("");
        setSuccess("");
        try {
            await resendVerification(registeredEmail);
            setSuccess("Código de verificación reenviado exitosamente.");
        } catch (err: any) {
            setError(err.message || "Error al reenviar código");
        }
    };

    if (showVerification) {
        return (
            <AuthLayout>
                <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-6 text-center">
                        Verifica tu Email
                    </h2>
                    <p className="mb-4 text-center text-sm text-gray-600">
                        Hemos enviado un código de verificación a{" "}
                        <strong>{registeredEmail}</strong>
                    </p>
                    <form onSubmit={handleVerification} className="space-y-4">
                        <div>
                            <Label htmlFor="code">Código de Verificación</Label>
                            <Input
                                id="code"
                                name="code"
                                type="text"
                                value={verificationCode}
                                onChange={(e) =>
                                    setVerificationCode(e.target.value)
                                }
                                placeholder="123456"
                                maxLength={6}
                                required
                                className="mt-1 text-center text-2xl tracking-widest"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                El código expira en 5 minutos
                            </p>
                        </div>
                        {error && (
                            <Alert variant="destructive">
                                <p className="text-sm">{error}</p>
                            </Alert>
                        )}
                        {success && (
                            <Alert>
                                <p className="text-sm">{success}</p>
                            </Alert>
                        )}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? "Verificando..." : "Verificar Email"}
                        </Button>
                    </form>
                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={handleResend}
                            className="text-sm text-blue-600 hover:underline"
                            disabled={loading}
                        >
                            ¿No recibiste el código? Reenviar
                        </button>
                    </div>
                    <div className="mt-2 text-center">
                        <button
                            type="button"
                            onClick={() => setShowVerification(false)}
                            className="text-sm text-gray-600 hover:underline"
                        >
                            Volver al registro
                        </button>
                    </div>
                </Card>
            </AuthLayout>
        );
    }

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
                            minLength={6}
                            className="mt-1"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Mínimo 6 caracteres
                        </p>
                    </div>
                    <div>
                        <Label htmlFor="confirmPassword">
                            Confirmar Contraseña
                        </Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                            minLength={6}
                            className="mt-1"
                        />
                    </div>
                    {error && (
                        <Alert variant="destructive">
                            <p className="text-sm">{error}</p>
                        </Alert>
                    )}
                    {success && (
                        <Alert>
                            <p className="text-sm">{success}</p>
                        </Alert>
                    )}
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
