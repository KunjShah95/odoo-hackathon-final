// routes/notifications.js
import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const router = express.Router();

// GET /notifications
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // For demo: return recent trip invites and shared trips
    const invites = await prisma.tripCollaborator.findMany({
      where: { user_id: userId },
      include: { trip: true },
      orderBy: { created_at: 'desc' },
      take: 10
    });
    res.json({ invites });
  } catch (err) {
    console.error('GET /notifications', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
