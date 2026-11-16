import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireRole } from '../middlewares/auth';

const router = Router();

// Get all wash programs
// GET /programs — отдаем программы сразу с привязанной химией
router.get('/', async (req, res, next) => {
  try {
    const programs = await prisma.washProgram.findMany({
      include: {
        consumables: {
          include: {
            inventory: true // Подтягиваем название и единицу измерения (ml/g)
          }
        }
      }
    });
    res.json(programs);
  } catch (error) {
    next(error);
  }
});

// POST /programs — принимаем массив consumables: [{ inventoryId, quantity }]
router.post('/', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { name, price, consumables } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: "Fields 'name' and 'price' are required" });
    }

    const newProgram = await prisma.washProgram.create({
      data: {
        name: String(name).trim(),
        price: Math.round(Number(price)),
        consumables: {
          create: Array.isArray(consumables)
            ? consumables.map((item: { inventoryId: string; quantity: number }) => ({
                inventoryId: item.inventoryId,
                quantity: Math.round(Number(item.quantity))
              }))
            : []
        }
      },
      include: {
        consumables: {
          include: {
            inventory: true
          }
        }
      }
    });

    res.status(201).json(newProgram);
  } catch (error) {
    next(error);
  }
});

export default router;
