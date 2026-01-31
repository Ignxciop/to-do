import { useState } from "react";

function App() {
    const [count, setCount] = useState(0);

    return (
        <>
            <h1>Frontend activo en puerto 4003</h1>
            <p>
                Para probar el backend, haz una petición a{" "}
                <code>/api/ping</code> y deberías recibir "pong".
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
