import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useLocation,
} from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import { AuthProvider, useAuth } from "./context/AuthContext";

function CatchAllRoute() {
    const { user } = useAuth();
    const location = useLocation();
    if (user) {
        return <Navigate to="/" replace state={{ from: location }} />;
    } else {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/auth/login"
                        element={<Navigate to="/login" replace />}
                    />
                    <Route path="/auth/register" element={<Register />} />
                    <Route
                        path="/register"
                        element={<Navigate to="/auth/register" replace />}
                    />
                    <Route path="*" element={<CatchAllRoute />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
