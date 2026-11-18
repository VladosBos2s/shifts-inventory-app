import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

function daysAgo(days: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export async function seedDemoData() {
  await prisma.transaction.deleteMany({});
  await prisma.shift.deleteMany({});
  if ((prisma as any).programConsumable) {
    await (prisma as any).programConsumable.deleteMany({});
  }
  await prisma.washProgram.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.box.deleteMany({});

  await prisma.user.deleteMany({
    where: { role: 'OPERATOR' }
  });

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@washsaas.com' },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: 'admin@washsaas.com',
      name: 'System Admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN'
    }
  });

  const operatorHash = await bcrypt.hash('1234', 10);
  const opAlex = await prisma.user.create({
    data: { email: 'alex@washsaas.com', name: 'Alex Nowak', passwordHash: operatorHash, role: 'OPERATOR' }
  });
  const opMaria = await prisma.user.create({
    data: { email: 'maria@washsaas.com', name: 'Maria Kowalska', passwordHash: operatorHash, role: 'OPERATOR' }
  });
  const opDavid = await prisma.user.create({
    data: { email: 'david@washsaas.com', name: 'David Zielinski', passwordHash: operatorHash, role: 'OPERATOR' }
  });
  await prisma.user.create({
    data: { email: 'newbie@washsaas.com', name: 'Kacper Wisniewski', passwordHash: 'PENDING_SETUP', role: 'OPERATOR' }
  });

  const box1 = await prisma.box.create({ data: { name: 'Box #1 (Express Bay)', isActive: true } });
  const box2 = await prisma.box.create({ data: { name: 'Box #2 (Standard Bay)', isActive: true } });
  const box3 = await prisma.box.create({ data: { name: 'Box #3 (Detailing Bay)', isActive: true } });
  await prisma.box.create({ data: { name: 'Box #4 (Maintenance)', isActive: false } });

  const foam = await prisma.inventory.create({ data: { name: 'Active Foam Ultra', quantity: 18500, unit: 'ml', minStockLimit: 5000 } });
  const wax = await prisma.inventory.create({ data: { name: 'Hot Carnauba Wax', quantity: 9200, unit: 'ml', minStockLimit: 3000 } });
  const wheelCleaner = await prisma.inventory.create({ data: { name: 'Wheel & Alloy Acid-Free', quantity: 6400, unit: 'ml', minStockLimit: 2500 } });
  const glassCleaner = await prisma.inventory.create({ data: { name: 'Glass & Interior Mist', quantity: 4800, unit: 'ml', minStockLimit: 1500 } });
  const polymer = await prisma.inventory.create({ data: { name: 'Hydrophobic Ceramic Sealant', quantity: 850, unit: 'ml', minStockLimit: 2000 } });
  const bugRemover = await prisma.inventory.create({ data: { name: 'Bug & Tar Pre-Wash', quantity: 1100, unit: 'ml', minStockLimit: 2500 } });
  const dryingAid = await prisma.inventory.create({ data: { name: 'Osmosis Drying Aid', quantity: 400, unit: 'ml', minStockLimit: 2000 } });

  const progExpress = await prisma.washProgram.create({
    data: {
      name: 'Express Foam Rinse',
      price: 15,
      foamUsage: 100,
      consumables: { create: [{ inventoryId: foam.id, quantity: 100 }, { inventoryId: dryingAid.id, quantity: 30 }] }
    }
  });
  const progStandard = await prisma.washProgram.create({
    data: {
      name: 'Standard Body & Wheels',
      price: 25,
      foamUsage: 150,
      consumables: { create: [{ inventoryId: foam.id, quantity: 150 }, { inventoryId: wheelCleaner.id, quantity: 80 }, { inventoryId: dryingAid.id, quantity: 40 }] }
    }
  });
  const progWax = await prisma.washProgram.create({
    data: {
      name: 'Foam + Hot Carnauba Wax',
      price: 35,
      foamUsage: 180,
      consumables: { create: [{ inventoryId: foam.id, quantity: 180 }, { inventoryId: wheelCleaner.id, quantity: 100 }, { inventoryId: wax.id, quantity: 90 }, { inventoryId: bugRemover.id, quantity: 60 }] }
    }
  });
  const progFull = await prisma.washProgram.create({
    data: {
      name: 'Full Interior & Exterior',
      price: 50,
      foamUsage: 200,
      consumables: { create: [{ inventoryId: foam.id, quantity: 200 }, { inventoryId: wheelCleaner.id, quantity: 120 }, { inventoryId: wax.id, quantity: 100 }, { inventoryId: glassCleaner.id, quantity: 80 }, { inventoryId: bugRemover.id, quantity: 70 }] }
    }
  });
  const progVip = await prisma.washProgram.create({
    data: {
      name: 'VIP Ceramic & Detailing',
      price: 75,
      foamUsage: 250,
      consumables: { create: [{ inventoryId: foam.id, quantity: 250 }, { inventoryId: wheelCleaner.id, quantity: 150 }, { inventoryId: polymer.id, quantity: 120 }, { inventoryId: glassCleaner.id, quantity: 100 }, { inventoryId: bugRemover.id, quantity: 90 }, { inventoryId: dryingAid.id, quantity: 60 }] }
    }
  });

  const allPrograms = [progExpress, progStandard, progWax, progFull, progVip];
  const operators = [opAlex, opMaria, opDavid];
  const activeBoxes = [box1, box2, box3];
  const paymentMethods = ['CARD', 'CARD', 'BLIK', 'CASH', 'CASH'];

  for (let day = 13; day >= 1; day--) {
    const shiftsToday = day % 2 === 0 ? 2 : 3;
    for (let sIdx = 0; sIdx < shiftsToday; sIdx++) {
      const operator = operators[(day + sIdx) % operators.length];
      const box = activeBoxes[sIdx % activeBoxes.length];
      const startHour = sIdx === 0 ? 8 : sIdx === 1 ? 10 : 14;
      const startTime = daysAgo(day, startHour, 0);
      const endTime = daysAgo(day, startHour + 7, 15);
      const startCash = 200;
      const washesCount = 5 + ((day + sIdx) % 5);
      const txPayload = [];
      let cashEarned = 0;

      for (let w = 0; w < washesCount; w++) {
        const chosenProgram = allPrograms[(day + w * 2 + sIdx) % allPrograms.length];
        const method = paymentMethods[(day + w + sIdx) % paymentMethods.length];
        if (method === 'CASH') cashEarned += chosenProgram.price;
        txPayload.push({
          programId: chosenProgram.id,
          amount: chosenProgram.price,
          paymentMethod: method,
          createdAt: new Date(startTime.getTime() + (w + 1) * 42 * 60 * 1000)
        });
      }

      const expectedCash = startCash + cashEarned;
      let discrepancy = 0;
      if (day === 5 && sIdx === 1) discrepancy = -10;
      if (day === 2 && sIdx === 0) discrepancy = 5;

      await prisma.shift.create({
        data: {
          userId: operator.id,
          boxId: box.id,
          startTime,
          endTime,
          startCash,
          expectedCash,
          actualCash: expectedCash + discrepancy,
          isClosed: true,
          transactions: { create: txPayload }
        }
      });
    }
  }

  const todayStart = new Date();
  todayStart.setHours(Math.max(8, todayStart.getHours() - 3), 0, 0, 0);

  await prisma.shift.create({
    data: {
      userId: opAlex.id,
      boxId: box1.id,
      startTime: todayStart,
      startCash: 250,
      isClosed: false,
      transactions: {
        create: [
          { programId: progWax.id, amount: progWax.price, paymentMethod: 'CARD', createdAt: new Date(todayStart.getTime() + 25 * 60 * 1000) },
          { programId: progStandard.id, amount: progStandard.price, paymentMethod: 'CASH', createdAt: new Date(todayStart.getTime() + 65 * 60 * 1000) },
          { programId: progVip.id, amount: progVip.price, paymentMethod: 'BLIK', createdAt: new Date(todayStart.getTime() + 110 * 60 * 1000) },
          { programId: progExpress.id, amount: progExpress.price, paymentMethod: 'CASH', createdAt: new Date(todayStart.getTime() + 145 * 60 * 1000) }
        ]
      }
    }
  });
}