import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// 1. Revenue summary (today, all-time cash/card breakdown, and last 7 days chart)
router.get('/revenue', async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // Start of 6 days ago (7 days total including today)
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    // Fetch all transactions to compute accurate totals & 7-day breakdown
    const allTransactions = await prisma.transaction.findMany({
      select: {
        amount: true,
        paymentMethod: true,
        createdAt: true
      }
    });

    let todayTotal = 0;
    let todayCash = 0;
    let todayCard = 0;
    let todayCount = 0;

    let allTimeTotal = 0;
    let allTimeCash = 0;
    let allTimeCard = 0;

    // Prepare 7-day map
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyMap = new Map<string, { name: string; revenue: number }>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(startOfToday);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = i === 0 ? 'Today' : `${dayLabels[d.getDay()]} ${d.getDate()}`;
      dailyMap.set(key, { name: label, revenue: 0 });
    }

    for (const tx of allTransactions) {
      allTimeTotal += tx.amount;
      if (tx.paymentMethod === 'CASH') {
        allTimeCash += tx.amount;
      } else {
        // CARD and BLIK grouped as electronic/card payments
        allTimeCard += tx.amount;
      }

      if (tx.createdAt >= startOfToday) {
        todayTotal += tx.amount;
        todayCount += 1;
        if (tx.paymentMethod === 'CASH') todayCash += tx.amount;
        else todayCard += tx.amount;
      }

      if (tx.createdAt >= sevenDaysAgo) {
        const txDate = new Date(tx.createdAt);
        txDate.setHours(0, 0, 0, 0);
        const key = txDate.toISOString().slice(0, 10);
        const entry = dailyMap.get(key);
        if (entry) {
          entry.revenue += tx.amount;
        }
      }
    }

    res.json({
      today: {
        total: todayTotal,
        cash: todayCash,
        card: todayCard,
        transactionsCount: todayCount
      },
      allTime: {
        total: allTimeTotal,
        cash: allTimeCash,
        card: allTimeCard,
        transactionsCount: allTransactions.length
      },
      dailyChart: Array.from(dailyMap.values())
    });
  } catch (error) {
    next(error);
  }
});

// 2. Low-stock inventory items (quantity <= minStockLimit)
router.get('/low-stock', async (req, res, next) => {
  try {
    const allItems = await prisma.inventory.findMany();
    const lowStockItems = allItems.filter((item) => item.quantity <= item.minStockLimit);

    res.json({
      count: lowStockItems.length,
      items: lowStockItems
    });
  } catch (error) {
    next(error);
  }
});

// 3. Top wash programs by sales count and revenue
router.get('/top-programs', async (req, res, next) => {
  try {
    const grouped = await prisma.transaction.groupBy({
      by: ['programId'],
      _count: { id: true },
      _sum: { amount: true },
      orderBy: {
        _count: { id: 'desc' }
      }
    });

    const programs = await prisma.washProgram.findMany();
    const programMap = new Map(programs.map((p) => [p.id, p.name]));

    const result = grouped.map((item) => ({
      programId: item.programId,
      name: programMap.get(item.programId) || 'Deleted Program',
      salesCount: item._count.id,
      totalRevenue: item._sum.amount || 0
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;