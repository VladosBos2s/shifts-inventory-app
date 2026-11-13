import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();


// get all posts
router.get('/', async (req, res) => {
  const allBoxes = await prisma.box.findMany();
  res.json(allBoxes);
});

// create new post
router.post('/', async (req, res) => {
  const { name } = req.body;
  
  const newBox = await prisma.box.create({
    data: { name }
  });
  
  res.status(201).json(newBox);
});

export default router;