import express from 'express';
import tasksRouter from './api/tasks.js';

const app = express();

app.use(express.json());

// Montar el router de tareas en /tasks
app.use('/tasks', tasksRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});