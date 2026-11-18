import express from 'express';
import cors from 'cors'
import helmet from 'helmet';
import boxesRoute from './routes/boxes';
import usersRoute from './routes/users';
import shiftsRoute from './routes/shifts';
import programsRoute from './routes/programs';
import inventoryRoute from './routes/inventory';
import transactionsRoute from './routes/transactions';
import authRoute from './routes/auth';
import analyticsRoute from './routes/analytics'
import { authenticateToken, requireRole } from './middlewares/auth';
import { errorHandler } from './middlewares/handleError';


const app = express();

// Security of headers and acceptation of queries from frontend
app.use(helmet())
app.use(cors())
app.use(express.json());

// testing server for hosting
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// open routes
app.use('/auth', authRoute);

// Secured routes (must have header Authorization: Bearer <token>)
app.use('/boxes', authenticateToken, boxesRoute);
app.use('/users',  authenticateToken, requireRole('ADMIN'), usersRoute); // Юзерами управляет только админ
app.use('/analytics', authenticateToken, requireRole('ADMIN'), analyticsRoute); 
app.use('/shifts', authenticateToken, shiftsRoute);
app.use('/programs', authenticateToken, programsRoute);
app.use('/inventory', authenticateToken, inventoryRoute);
app.use('/transactions', authenticateToken, transactionsRoute);

// 2. Глобальный обработчик ошибок (ОБЯЗАТЕЛЬНО ПОСЛЕ ВСЕХ РОУТОВ)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
