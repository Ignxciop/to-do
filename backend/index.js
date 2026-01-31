import express from "express";
import { config } from "./src/config/config.js";
import authRoutes from "./src/routes/auth.js";
import { errorHandle } from "./src/middlewares/errorHandle.js";
import cors from "cors";
import helmet from "helmet";

const app = express();
const PORT = config.port || 3000;

app.use(helmet());

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
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

if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
        console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
}

export default app;
