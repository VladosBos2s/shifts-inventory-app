import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma'

const router = Router();
const PENDING_MARKER = 'PENDING_SETUP';

// Получить всех сотрудников
router.get('/', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
        createdAt: true,
        _count: {
          select: { shifts: true }
        }
      }
    });

    // Не отдаем сам хеш на фронтенд, отдаем только флаг активности
    const formatted = users.map(({ passwordHash, ...rest }) => ({
      ...rest,
      isActivated: passwordHash !== PENDING_MARKER
    }));

    res.json(formatted);
  } catch (error) {
    next(error);
  }
});

// Создать нового сотрудника (без пароля — задаст при первом входе)
router.post('/', async (req, res, next) => {
  try {
    const { email, name, role } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const validRole = role === 'ADMIN' ? 'ADMIN' : 'OPERATOR';

    const newUser = await prisma.user.create({
      data: {
        email: String(email).trim().toLowerCase(),
        name: String(name).trim(),
        passwordHash: PENDING_MARKER,
        role: validRole
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: { shifts: true }
        }
      }
    });

    res.status(201).json({
      ...newUser,
      isActivated: false
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }
    next(error);
  }
});

// Сбросить пароль сотрудника (если забыл — снова сможет задать при входе)
router.patch('/:id/reset-password', async (req, res, next) => {
  try {
    const id = req.params.id as string;
    await prisma.user.update({
      where: { id },
      data: { passwordHash: PENDING_MARKER }
    });
    res.json({ message: 'Password reset. User will set a new password on next login.' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    next(error);
  }
});
router.delete('/:id', async (req: any, res, next) => {
  try {
    const id = req.params.id as string;

    // Не даем админу удалить свой собственный аккаунт
    if (req.user?.userId === id) {
      return res.status(400).json({ error: 'You cannot delete your own active admin account' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({
        error: 'Cannot delete user because they have recorded shifts in history'
      });
    }
    next(error);
  }
});

export default router;