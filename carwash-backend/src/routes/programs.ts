import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireRole } from '../middlewares/auth';

const router = Router();

// Get all wash programs
router.get('/', async (req, res, next) => {
  try {
    const programs = await prisma.washProgram.findMany();
    res.json(programs);
  } catch (error) {
    next(error);
  }
});

// Create a new wash program (ADMIN only)
router.post('/', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { name, price, foamUsage } = req.body;

    if (!name || price === undefined || foamUsage === undefined) {
      return res.status(400).json({ error: "Fields 'name', 'price', and 'foamUsage' are required" });
    }

    const newProgram = await prisma.washProgram.create({
      data: {
        name: String(name).trim(),
        price: Math.round(Number(price)),
        foamUsage: Math.round(Number(foamUsage))
      }
    });

    res.status(201).json(newProgram);
  } catch (error) {
    next(error);
  }
});

// Delete a wash program (ADMIN only)
router.delete('/:id', requireRole('ADMIN'), async (req, res, next) => {
  const id = req.params.id as string;

  try {
    // 1. Check if transactions exist for this program (foreign key constraint protection)
    const transactionsCount = await prisma.transaction.count({
      where: { programId: id }
    });

    if (transactionsCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete program: transactions have already been recorded for this program'
      });
    }

    // 2. Delete program from database
    const deletedProgram = await prisma.washProgram.delete({
      where: { id }
    });

    res.json({
      message: 'Program successfully deleted',
      program: deletedProgram
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Program not found' });
    }
    next(error);
  }
});

export default router;
