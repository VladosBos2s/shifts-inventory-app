'use server'

import { PrismaClient } from "@prisma/client/extension"

const prisma = new PrismaClient()

export async function openShift(userId: string, boxId: string, startCash: number) {
  try {
    const shift = await prisma.shift.create({
      data: {
        userId,
        boxId,
        startCash,
      }
    })
    return { success: true, data: shift }
  } catch (error) {
    console.error('Ошибка при открытии смены:', error)
    return { success: false, error: 'Не удалось открыть смену' }
  }
}