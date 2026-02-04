import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import { config } from "./src/config/config.js";
import authRoutes from "./src/routes/auth.js";
import taskRoutes from "./src/routes/task.js";
import folderRoutes from "./src/routes/folder.js";

const app = express();
const PORT = config.port || 3000;

app.use(helmet());
app.use(cookieParser());

const allowedOrigins = [
    process.env.FRONTEND_URL,
    "https://tasks.josenunez.cl",
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Permitir peticiones sin origin (como desde Postman o desde el mismo servidor)
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    }),
);

app.use(express.json());

const router = express.Router();

router.get("/", (req, res) => {
    res.send("Servidor iniciado");
});

router.get("/ping", (req, res) => {
    res.send("pong");
});

app.use("/api", router);
app.use("/api", authRoutes);
app.use("/api", taskRoutes);
app.use("/api", folderRoutes);

if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
        console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
}

export default app;
