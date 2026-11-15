import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('🔥 [Server Error]:', err.stack || err.message);
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    ...(process.env.NODE_ENV === 'development' && { message: err.message })
  });
};