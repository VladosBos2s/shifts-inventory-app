import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Проведение новой мойки (оплаты) с автоматическим списанием всей химии по рецепту
router.post('/', async (req, res) => {
  const { shiftId, programId, paymentMethod, inventoryId } = req.body;

  if (!shiftId || !programId) {
    return res.status(400).json({ error: 'Необходимо указать shiftId и programId' });
  }

  try {
    // 1. Находим выбранную программу вместе со списком привязанных химикатов
    const program = await prisma.washProgram.findUnique({
      where: { id: programId },
      include: {
        consumables: {
          include: {
            inventory: true
          }
        }
      }
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

    // 3. Проверяем, хватает ли на складе каждого средства из рецепта программы
    if (program.consumables.length > 0) {
      for (const item of program.consumables) {
        if (item.inventory.quantity < item.quantity) {
          return res.status(400).json({
            error: `Недостаточно средства "${item.inventory.name}" на складе (осталось ${item.inventory.quantity} ${item.inventory.unit}, требуется ${item.quantity} ${item.inventory.unit})`
          });
        }
      }
    }

    // 4. Атомарно создаем транзакцию и списываем все расходники со склада
    const result = await prisma.$transaction(async (tx) => {
      // А) Создаем запись о транзакции (чеке)
      const newTransaction = await tx.transaction.create({
        data: {
          shiftId,
          programId,
          amount: program.price,
          paymentMethod: paymentMethod || 'CASH'
        },
        include: {
          program: true
        }
      });

      // Б) Списываем всю химию, привязанную к программе
      if (program.consumables.length > 0) {
        for (const item of program.consumables) {
          await tx.inventory.update({
            where: { id: item.inventoryId },
            data: {
              quantity: {
                decrement: item.quantity
              }
            }
          });
        }
      } else if (program.foamUsage > 0 && inventoryId) {
        // Фолбэк для старых программ, если использовалось поле foamUsage
        await tx.inventory.update({
          where: { id: inventoryId },
          data: {
            quantity: {
              decrement: program.foamUsage
            }
          }
        });
      }

      return newTransaction;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({ error: 'Ошибка при проведении транзакции' });
  }
});

// Получить все транзакции за конкретную смену (для подсчета кассы и списка чеков)
router.get('/shift/:shiftId', async (req, res, next) => {
  try {
    const { shiftId } = req.params;

    const transactions = await prisma.transaction.findMany({
      where: { shiftId },
      orderBy: { createdAt: 'desc' },
      include: {
        program: true,
        shift: { include: { box: true } }
      }
    });

    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

export default router;