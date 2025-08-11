// routes/pdfExport.js
import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
const prisma = new PrismaClient();
const router = express.Router();

// GET /pdf-export/:tripId
router.get('/:tripId', verifyToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    // Only trip owner or collaborator can export
    const trip = await prisma.trip.findUnique({ where: { id: Number(tripId) } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    const isOwner = trip.user_id === userId;
    const isCollaborator = await prisma.tripCollaborator.findFirst({ where: { trip_id: trip.id, user_id: userId } });
    if (!isOwner && !isCollaborator) return res.status(403).json({ error: 'Forbidden' });
    // Fetch stops and activities
    const stops = await prisma.stop.findMany({ where: { trip_id: trip.id }, include: { activities: true } });
    // Generate PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=trip_${tripId}.pdf`);
    doc.pipe(res);
    doc.fontSize(20).text(trip.name, { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Description: ${trip.description || ''}`);
    doc.text(`Dates: ${trip.start_date.toDateString()} - ${trip.end_date.toDateString()}`);
    doc.moveDown();
    stops.forEach((stop, i) => {
      doc.fontSize(16).text(`Stop ${i + 1}: ${stop.city_name}, ${stop.country_name}`);
      doc.fontSize(12).text(`Dates: ${stop.start_date.toDateString()} - ${stop.end_date.toDateString()}`);
      if (stop.activities.length) {
        doc.text('Activities:');
        stop.activities.forEach(act => {
          doc.text(`- ${act.name}: ${act.description || ''}`);
        });
      }
      doc.moveDown();
    });
    doc.end();
  } catch (err) {
    console.error('GET /pdf-export/:tripId', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
