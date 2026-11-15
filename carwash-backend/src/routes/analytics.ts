import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// 1. Сводка по выручке (за сегодня и за всё время + разбивка нал/безнал)
router.get('/revenue', async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Все транзакции за сегодня
    const todayTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: startOfToday }
      }
    });

    // Общая выручка за всё время (через агрегацию БД)
    const allTimeStats = await prisma.transaction.aggregate({
      _sum: { amount: true },
      _count: { id: true }
    });

    // Считаем сегодняшние показатели
    let todayTotal = 0;
    let todayCash = 0;
    let todayCard = 0;

    for (const tx of todayTransactions) {
      todayTotal += tx.amount;
      if (tx.paymentMethod === 'CASH') todayCash += tx.amount;
      if (tx.paymentMethod === 'CARD') todayCard += tx.amount;
    }

    res.json({
      today: {
        total: todayTotal,
        cash: todayCash,
        card: todayCard,
        transactionsCount: todayTransactions.length
      },
      allTime: {
        total: allTimeStats._sum.amount || 0,
        transactionsCount: allTimeStats._count.id
      }
    });
  } catch (error) {
    next(error);
  }
});

// 2. Критические остатки на складе (где quantity <= minStockLimit)
router.get('/low-stock', async (req, res, next) => {
  try {
    const allItems = await prisma.inventory.findMany();
    
    // Фильтруем позиции, которые пора докупать
    const lowStockItems = allItems.filter(item => item.quantity <= item.minStockLimit);

    res.json({
      count: lowStockItems.length,
      items: lowStockItems
    });
  } catch (error) {
    next(error);
  }
});

// 3. Топ популярных программ мойки (по количеству заказов и выручке)
router.get('/top-programs', async (req, res, next) => {
  try {
    // Группируем транзакции по programId
    const grouped = await prisma.transaction.groupBy({
      by: ['programId'],
      _count: { id: true },
      _sum: { amount: true },
      orderBy: {
        _count: { id: 'desc' }
      }
    });

    // Подтягиваем названия программ из таблицы WashProgram
    const programs = await prisma.washProgram.findMany();
    const programMap = new Map(programs.map(p => [p.id, p.name]));

    const result = grouped.map(item => ({
      programId: item.programId,
      name: programMap.get(item.programId) || 'Удаленная программа',
      salesCount: item._count.id,
      totalRevenue: item._sum.amount || 0
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;