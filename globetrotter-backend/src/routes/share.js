// routes/share.js
import express from 'express';
import crypto from 'crypto';
import pool from '../../db.js';
import { verifyToken } from '../middleware/authMiddleware.js';
const router = express.Router();

/**
 * Make trip public and generate a unique public key
 */
router.put('/:tripId/share', verifyToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;

    const tripR = await pool.query('SELECT * FROM trips WHERE id=$1 AND user_id=$2', [tripId, userId]);
    if (tripR.rowCount === 0) return res.status(404).json({ error: 'Trip not found or not yours' });

    const key = crypto.randomBytes(6).toString('hex');
    // upsert into shared_trips
    await pool.query(
      `INSERT INTO shared_trips (trip_id, public_key, created_at)
       VALUES ($1,$2,NOW())
       ON CONFLICT (trip_id) DO UPDATE SET public_key=EXCLUDED.public_key, created_at=EXCLUDED.created_at`,
      [tripId, key]
    );
    await pool.query('UPDATE trips SET is_public=true WHERE id=$1', [tripId]);

    return res.json({ message: 'Trip shared publicly', public_key: key });
  } catch (err) {
    console.error('PUT /share/:tripId/share', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Get public trip by key (no auth)
 */
router.get('/public/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const st = await pool.query('SELECT trip_id FROM shared_trips WHERE public_key=$1', [key]);
    if (st.rowCount === 0) return res.status(404).json({ error: 'Public trip not found' });
    const tripId = st.rows[0].trip_id;

    const tripR = await pool.query('SELECT t.*, u.first_name, u.last_name FROM trips t JOIN users u ON t.user_id=u.id WHERE t.id=$1', [tripId]);
    if (tripR.rowCount === 0) return res.status(404).json({ error: 'Trip not found' });
    const trip = tripR.rows[0];

    const stopsR = await pool.query('SELECT * FROM stops WHERE trip_id=$1 ORDER BY COALESCE(order_index,id) ASC', [tripId]);
    const stops = stopsR.rows;
    for (const s of stops) {
      const acts = await pool.query('SELECT * FROM activities WHERE stop_id=$1 ORDER BY id ASC', [s.id]);
      s.activities = acts.rows;
    }
    return res.json({ trip, stops });
  } catch (err) {
    console.error('GET /share/public/:key', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * (Optional) GET /share  -> list public trips (simple)
 */
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT t.id, t.name, t.description, t.start_date, t.end_date, s.public_key, u.first_name, u.last_name
       FROM trips t
       JOIN shared_trips s ON s.trip_id = t.id
       JOIN users u ON u.id = t.user_id
       ORDER BY t.created_at DESC
       LIMIT 50`
    );
    return res.json(r.rows);
  } catch (err) {
    console.error('GET /share', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
