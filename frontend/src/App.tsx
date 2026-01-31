import { useState } from "react";
import { useEffect } from "react";

function App() {
    const [count, setCount] = useState(0);
    const [ping, setPing] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/ping")
            .then((res) => res.text())
            .then((data) => setPing(data))
            .catch(() => setPing("Error al conectar con backend"));
    }, []);

    return (
        <>
            <h1>Frontend activo en puerto 4003</h1>
            <p>
                Para probar el backend, haz una petición a{" "}
                <code>/api/ping</code> y deberías recibir "pong".
            </p>
            <p>
                <strong>Respuesta del backend:</strong>{" "}
                {ping === null ? "Cargando..." : ping}
            </p>
            <div className="card">
                <button onClick={() => setCount((count) => count + 1)}>
                    count is {count}
                </button>
            </div>
        </>
    );
}

export default App;
