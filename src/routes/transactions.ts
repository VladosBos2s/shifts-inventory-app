import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Проведение новой мойки (оплаты)
router.post('/', async (req, res) => {
  const { shiftId, programId, paymentMethod, inventoryId } = req.body;

  try {
    // 1. Находим выбранную программу, чтобы узнать цену и расход пены
    const program = await prisma.washProgram.findUnique({
      where: { id: programId }
    });

    if (!program) {
      return res.status(404).json({ error: 'Программа мойки не найдена' });
    }

    // 2. Проверяем, открыта ли смена
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId }
    });

    if (!shift || shift.isClosed) {
      return res.status(400).json({ error: 'Смена закрыта или не существует' });
    }

    // 3. record transaction and updating foam amount
    const result = await prisma.$transaction(async (tx) => {
      
      // А) Создаем запись о транзакции (чеке)
      const newTransaction = await tx.transaction.create({
        data: {
          shiftId,
          programId,
      
          amount: program.price, // price from database
          paymentMethod, // 'CASH'  или 'CARD' / BLIK
        }
      });

      // Б) Минусуем потраченную химию со склада
      if (program.foamUsage > 0 && inventoryId) {
        await tx.inventory.update({
          where: { id: inventoryId },
          data: {
            quantity: {
              decrement: program.foamUsage // Prisma сама отнимет нужное количество
            }
          }
        });
      }

      return newTransaction;
    });

    res.status(201).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при проведении транзакции' });
  }
});

// Получить все транзакции за конкретную смену (для подсчета кассы)
router.get('/shift/:shiftId', async (req, res) => {
  const { shiftId } = req.params;
  
  const transactions = await prisma.transaction.findMany({
    where: { shiftId },
    include: { program: true, box: true } // Подтягиваем детали программы и бокса для чека
  });
  
  res.json(transactions);
});

export default router;