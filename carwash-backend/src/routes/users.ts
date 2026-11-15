import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma'

const router = Router();

// Получить всех сотрудников
router.get('/', async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  }
  );
  res.json(users);
});

// Создать нового сотрудника
router.post('/', async (req, res) => {
  const { email, name, password, role } = req.body;
   const hashedPassword = await bcrypt.hash(password, 10)
  try {
    const newUser = await prisma.user.create({
      data: { email, name, passwordHash : hashedPassword, role: role || 'OPERATOR' }
    });

    const { passwordHash: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);

  } catch (error) {
    res.status(400).json({ error: 'Не удалось создать пользователя (возможно email уже занят)' });
  }
});

export default router;