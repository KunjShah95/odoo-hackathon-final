// routes/analytics.js
import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const router = express.Router();

// GET /analytics/trip/:tripId
router.get('/trip/:tripId', verifyToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    // Only trip owner or collaborator can view analytics
    const trip = await prisma.trip.findUnique({ where: { id: Number(tripId) } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    const isOwner = trip.user_id === userId;
    const isCollaborator = await prisma.tripCollaborator.findFirst({ where: { trip_id: trip.id, user_id: userId } });
    if (!isOwner && !isCollaborator) return res.status(403).json({ error: 'Forbidden' });
    // Example analytics: total expenses, number of stops, activities, collaborators
    const [expenseSum, stopCount, activityCount, collabCount] = await Promise.all([
      prisma.expense.aggregate({ where: { trip_id: trip.id }, _sum: { amount: true } }),
      prisma.stop.count({ where: { trip_id: trip.id } }),
      prisma.activity.count({ where: { stop: { trip_id: trip.id } } }),
      prisma.tripCollaborator.count({ where: { trip_id: trip.id } })
    ]);
    res.json({
      totalExpenses: expenseSum._sum.amount || 0,
      stopCount,
      activityCount,
      collaboratorCount: collabCount
    });
  } catch (err) {
    console.error('GET /analytics/trip/:tripId', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
