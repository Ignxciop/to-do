import MainLayout from "../layout/MainLayout";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    useEffect(() => {
        if (!loading && !user) {
            navigate("/login");
        }
    }, [user, loading, navigate]);
    if (loading) return null;
    if (!user) return null;
    return (
        <MainLayout>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">
                    Bienvenido, {user?.name || "Usuario"}
                </h1>
                <p className="text-muted-foreground mb-6">
                    Aquí podrás ver el resumen de tus tareas y actividad
                    reciente.
                </p>
                <div className="mb-6 p-4 bg-card rounded-lg shadow-sm">
                    <div className="font-medium">Tu perfil:</div>
                    <div className="text-sm mt-1">
                        Nombre: {user?.name} {user?.lastname}
                    </div>
                    <div className="text-sm">Email: {user?.email}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card rounded-lg p-4 shadow-sm">
                        <h2 className="font-semibold text-lg mb-2">
                            Tus tareas
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            No tienes tareas pendientes.
                        </p>
                    </div>
                    <div className="bg-card rounded-lg p-4 shadow-sm">
                        <h2 className="font-semibold text-lg mb-2">
                            Actividad reciente
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Sin actividad reciente.
                        </p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Dashboard;
