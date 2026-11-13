import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Получить все программы мойки
router.get('/', async (req, res) => {
  const programs = await prisma.washProgram.findMany();
  res.json(programs);
});

// Создать новую программу
router.post('/', async (req, res) => {
  const { name, price, foamUsage } = req.body;
  
  const newProgram = await prisma.washProgram.create({
    data: { name, price, foamUsage } // price передаем в копейках/центах
  });
  
  res.status(201).json(newProgram);
});

export default router;