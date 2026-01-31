import express from "express";
import { config } from "./src/config/config.js";

const app = express();
const PORT = config.port || 3000;

app.get("/", (req, res) => {
    res.send("Servidor iniciado");
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
