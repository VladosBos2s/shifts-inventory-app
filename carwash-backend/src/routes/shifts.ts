import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();


// Start new shift
router.post('/start', async (req, res) => {
  const { userId, boxId, startCash } = req.body;

  // 1. Check of existing Shift
  const existingShift = await prisma.shift.findFirst({
    where: {
      OR: [{ userId }, { boxId }],
      isClosed: false,
    }
  });

  if (existingShift) {
    // Обязательно возвращаем return, чтобы код не пошел дальше
    return res.status(400).json({ error: 'user or this box has an active shift' });
  }

  // 2. Creating shift
  const newShift = await prisma.shift.create({
    data: {
      userId,
      boxId,
      startCash, // cash in cash desk
      isClosed: false,
    }
  });

  res.status(201).json(newShift);
});

// get all active shifts
router.get('/active', async (req, res) => {
  const activeShifts = await prisma.shift.findMany({
    where: { isClosed: false },
    include: { user: true, box: true } // info about worker and box
  });
  res.json(activeShifts);
});

// Закрыть смену и свести кассу
router.post('/:id/close', async (req, res) => {
  const { id } = req.params;
  const { actualCash } = req.body; // Сколько денег мойщик реально насчитал в кассе

  try {
    // 1. Ищем смену
    const shift = await prisma.shift.findUnique({
      where: { id }
    });

    if (!shift || shift.isClosed) {
      return res.status(400).json({ error: 'Смена не найдена или уже закрыта' });
    }

    // 2. Ищем все НАЛИЧНЫЕ транзакции за эту смену
    const cashTransactions = await prisma.transaction.findMany({
      where: {
        shiftId: id,
        paymentMethod: 'CASH'
      }
    });

    // 3. Считаем, на какую сумму намыли за наличку
    const totalCashEarned = cashTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    // 4. Считаем ожидаемую кассу (что было утром + что заработали)
    const expectedCash = shift.startCash + totalCashEarned;

    // 5. Разница (недостача будет с минусом, излишек с плюсом, 0 - всё идеально)
    const difference = actualCash - expectedCash;

    // 6. Обновляем и закрываем смену в базе
    const closedShift = await prisma.shift.update({
      where: {id},
     data: {
  isClosed: true,
  endTime: new Date(),
  expectedCash,
  actualCash,

      }
    });

    res.json({
      message: 'Смена успешно закрыта',
      expectedCash,
      actualCash,
      difference,
      shift: closedShift
    });

  } catch (error) {
    res.status(500).json({ error: 'Ошибка при закрытии смены' });
  }
});

export default router;