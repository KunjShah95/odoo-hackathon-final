// routes/trips.js
import express from 'express';
import pool from '../../db.js';
import { verifyToken } from '../middleware/authMiddleware.js';
const router = express.Router();

// Create Trip
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, start_date, end_date, cover_photo } = req.body;
    const r = await pool.query(
      `INSERT INTO trips (user_id, name, description, start_date, end_date, cover_photo) 
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [userId, name, description, start_date || null, end_date || null, cover_photo || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('POST /trips error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get my trips
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const r = await pool.query('SELECT * FROM trips WHERE user_id=$1 ORDER BY start_date ASC', [userId]);
    res.json(r.rows);
  } catch (err) {
    console.error('GET /trips error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get trip with stops+activities
router.get('/:tripId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;
    const tripR = await pool.query('SELECT * FROM trips WHERE id=$1 AND user_id=$2', [tripId, userId]);
    if (tripR.rowCount === 0) return res.status(404).json({ error: 'Trip not found' });
    const trip = tripR.rows[0];

    const stopsR = await pool.query('SELECT * FROM stops WHERE trip_id=$1 ORDER BY COALESCE(order_index, id) ASC', [tripId]);
    const stops = stopsR.rows;
    for (const s of stops) {
      const acts = await pool.query('SELECT * FROM activities WHERE stop_id=$1 ORDER BY id ASC', [s.id]);
      s.activities = acts.rows;
    }
    // Flatten trip fields to top level, add stops
    return res.json({ ...trip, stops });
  } catch (err) {
    console.error('GET /trips/:tripId', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update trip
router.put('/:tripId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;
    const { name, description, start_date, end_date, cover_photo, is_public } = req.body;

    const r = await pool.query(
      `UPDATE trips SET name=$1, description=$2, start_date=$3, end_date=$4, cover_photo=$5, is_public=$6
       WHERE id=$7 AND user_id=$8 RETURNING *`,
      [name, description, start_date || null, end_date || null, cover_photo || null, is_public ?? false, tripId, userId]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Trip not found or not yours' });
    return res.json(r.rows[0]);
  } catch (err) {
    console.error('PUT /trips/:tripId', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete trip
router.delete('/:tripId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;
    const r = await pool.query('DELETE FROM trips WHERE id=$1 AND user_id=$2 RETURNING *', [tripId, userId]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Trip not found or not yours' });
    return res.json({ message: 'Trip deleted' });
  } catch (err) {
    console.error('DELETE /trips/:tripId', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
