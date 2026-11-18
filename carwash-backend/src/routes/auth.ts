import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Check if this is the user's first login before validating password
  if (user.passwordHash === 'PENDING_SETUP') {
    return res.status(200).json({
      requiresPasswordSetup: true,
      email: user.email,
      name: user.name
    });
  }

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Generate JWT valid for 24 hours
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

// Set personal password on first login
router.post('/setup-password', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || String(password).length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.passwordHash !== 'PENDING_SETUP') {
      return res.status(400).json({ error: 'Password is already set for this account' });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword }
    });

    const token = jwt.sign(
      { userId: updatedUser.id, role: updatedUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to set up password' });
  }
});

export default router;