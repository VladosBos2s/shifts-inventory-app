import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireRole } from '../middlewares/auth';

const router = Router();


// get all posts
router.get('/', async (req, res, next) => {
  try {
    const allBoxes = await prisma.box.findMany({
      orderBy: { name: 'asc' },
      include: {
        shifts: {
          orderBy: { startTime: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            transactions: {
              include: {
                program: {
                  select: { name: true }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });
    res.json(allBoxes);
  } catch (error) {
    next(error);
  }
});

// create new post
router.post('/', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Box name is required' });
    }

    const newBox = await prisma.box.create({
      data: { name: String(name).trim() },
      include: { shifts: true }
    });

    res.status(201).json(newBox);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/toggle', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const box = await prisma.box.findUnique({ where: { id } });

    if (!box) {
      return res.status(404).json({ error: 'Box not found' });
    }

    const updated = await prisma.box.update({
      where: { id },
      data: { isActive: !box.isActive }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const id = req.params.id as string;

    const boxesCount = await prisma.box.count();
    if (boxesCount <= 4) {
  return res.status(403).json({ error: 'Default demo boxes cannot be deleted. Create a new box to test deletion.' });
  }

    await prisma.box.delete({ where: { id } });
    res.json({ message: 'Box deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Box not found' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({
        error: 'Cannot delete box with existing shifts. Deactivate it instead.'
      });
    }
    next(error);
  }
});
export default router;