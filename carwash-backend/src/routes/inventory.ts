import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireRole } from '../middlewares/auth';

const router = Router();

// Посмотреть остатки на складе
router.get('/', async (req, res, next) => {
  try {
    const inventory = await prisma.inventory.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(inventory);
  } catch (error) {
    next(error);
  }
});

// Добавить новую позицию на склад (только ADMIN)
router.post('/', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { name, quantity, unit, minStockLimit } = req.body;

    if (!name || quantity === undefined) {
      return res.status(400).json({ error: "Fields 'name' and 'quantity' are required" });
    }

    const newItem = await prisma.inventory.create({
      data: {
        name: String(name).trim(),
        quantity: Math.round(Number(quantity)),
        unit: unit ? String(unit).trim() : 'ml',
        minStockLimit: minStockLimit !== undefined ? Math.round(Number(minStockLimit)) : 2000
      }
    });

    res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
});

// Пополнить остаток на складе (Restock)
router.patch('/:id/restock', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const addAmount = Number(req.body.amount);

    if (!addAmount || addAmount <= 0) {
      return res.status(400).json({ error: 'Amount to add must be greater than 0' });
    }

    const updatedItem = await prisma.inventory.update({
      where: { id },
      data: {
        quantity: { increment: Math.round(addAmount) }
      }
    });

    res.json(updatedItem);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    next(error);
  }
});

// Удалить позицию со склада
router.delete('/:id', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const id = req.params.id as string;

    const itemsCount = await prisma.inventory.count();
      if (itemsCount <= 7) {
  return res.status(403).json({ error: 'Default demo inventory items cannot be deleted.' });
      }

    await prisma.inventory.delete({ where: { id } });
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Cannot delete: chemical is used in wash programs' });
    }
    next(error);
  }
});

export default router;