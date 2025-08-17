import express from 'express';
import prisma from '../db/db.js';

const router = express.Router();

// Obtener todas las tareas
router.get('/', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});

// Crear una tarea
router.post('/', async (req, res) => {
  const { title } = req.body;
  try {
    const newTask = await prisma.task.create({
      data: { title },
    });
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear tarea' });
  }
});

// Obtener una tarea específica
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
    });
    if (task) {
      res.json(task);
    } else {
      res.status(404).json({ error: 'Tarea no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tarea' });
  }
});

// Editar una tarea
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;
  try {
    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: { title, completed },
    });
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Error al editar tarea' });
  }
});

// Eliminar una tarea
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.task.delete({
      where: { id: Number(id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
});

export default router;