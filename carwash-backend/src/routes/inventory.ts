import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Посмотреть остатки на складе
router.get('/', async (req, res) => {
  const inventory = await prisma.inventory.findMany();
  res.json(inventory);
});

// Добавить новую позицию на склад
router.post('/', async (req, res) => {
  const { name, quantity, unit, minStockLimit } = req.body;
  
  const newItem = await prisma.inventory.create({
    data: { name, quantity, unit, minStockLimit }
  });
  
  res.status(201).json(newItem);
});

export default router;