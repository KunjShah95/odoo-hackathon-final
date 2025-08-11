// routes/collaborators.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/authMiddleware.js';
const prisma = new PrismaClient();
const router = express.Router();

// Invite a collaborator to a trip
router.post('/:tripId/invite', verifyToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { email, role = 'editor' } = req.body;
    const userId = req.user.id;
    // Only trip owner can invite
    const trip = await prisma.trip.findUnique({ where: { id: Number(tripId) } });
    if (!trip || trip.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
    const invitee = await prisma.user.findUnique({ where: { email } });
    if (!invitee) return res.status(404).json({ error: 'User not found' });
    if (invitee.id === userId) return res.status(400).json({ error: 'Cannot invite yourself' });
    await prisma.tripCollaborator.upsert({
      where: { trip_id_user_id: { trip_id: trip.id, user_id: invitee.id } },
      update: { role },
      create: { trip_id: trip.id, user_id: invitee.id, role, invited_by: userId },
    });
    res.json({ message: 'User invited as collaborator' });
  } catch (err) {
    console.error('POST /collaborators/:tripId/invite', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List collaborators for a trip
router.get('/:tripId', verifyToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    // Only trip owner or collaborator can view
    const trip = await prisma.trip.findUnique({ where: { id: Number(tripId) } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    const isOwner = trip.user_id === userId;
    const isCollaborator = await prisma.tripCollaborator.findFirst({ where: { trip_id: trip.id, user_id: userId } });
    if (!isOwner && !isCollaborator) return res.status(403).json({ error: 'Forbidden' });
    const collaborators = await prisma.tripCollaborator.findMany({
      where: { trip_id: trip.id },
      include: { user: { select: { id: true, first_name: true, last_name: true, email: true } } },
    });
    res.json(collaborators);
  } catch (err) {
    console.error('GET /collaborators/:tripId', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove a collaborator
router.delete('/:tripId/:userId', verifyToken, async (req, res) => {
  try {
    const { tripId, userId } = req.params;
    const requesterId = req.user.id;
    // Only trip owner can remove
    const trip = await prisma.trip.findUnique({ where: { id: Number(tripId) } });
    if (!trip || trip.user_id !== requesterId) return res.status(403).json({ error: 'Forbidden' });
    await prisma.tripCollaborator.deleteMany({ where: { trip_id: Number(tripId), user_id: Number(userId) } });
    res.json({ message: 'Collaborator removed' });
  } catch (err) {
    console.error('DELETE /collaborators/:tripId/:userId', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
