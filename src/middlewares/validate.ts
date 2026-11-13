import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AnyZodObject } from 'zod/v3';
export const validate = (schema: AnyZodObject) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Ошибка валидации данных',
          details: error.errors.map(e => ({
            field: e.path.filter(p => p !== 'body').join('.'),
            message: e.message
          }))
        });
      }
      return next(error);
    }
  };