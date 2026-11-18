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
import { seedDemoData } from './lib/seedDemo';


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

app.post('/reset-demo', async (req, res) => {
  const secret = process.env.DEMO_RESET_KEY || 'my-secret-reset-2026';
  if (req.headers['x-reset-key'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    await seedDemoData();
    res.json({ message: 'Demo database reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset demo data' });
  }
});


const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
setInterval(() => {
  seedDemoData()
    .then(() => console.log('🔄 Auto-reset demo database completed'))
    .catch((err) => console.error('❌ Auto-reset failed:', err));
}, TWENTY_FOUR_HOURS);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
