import express from "express";
import { config } from "./src/config/config.js";

const app = express();
const PORT = config.port || 3000;

const router = express.Router();

router.get("/", (req, res) => {
    res.send("Servidor iniciado");
});

router.get("/ping", (req, res) => {
    res.send("pong");
});

app.use("/api", router);

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
