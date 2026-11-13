import { z } from 'zod';

export const startShiftSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Некорректный ID пользователя'),
    boxId: z.string().uuid('Некорректный ID бокса'),
    startCash: z.number().nonnegative('Сумма наличных не может быть отрицательной')
  })
});

export const createTransactionSchema = z.object({
  body: z.object({
    shiftId: z.string().uuid('Некорректный ID смены'),
    programId: z.string().min(1, 'ID программы обязателен'),
    inventoryId: z.string().optional(),
    paymentMethod: z.enum(['CASH', 'CARD'], {
      errorMap: () => ({ message: 'Способ оплаты должен быть CASH или CARD' })
    })
  })
});