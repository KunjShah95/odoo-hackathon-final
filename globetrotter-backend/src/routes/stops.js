// routes/stops.js
import express from 'express';
import pool from '../../db.js';
import { verifyToken } from '../middleware/authMiddleware.js';
const router = express.Router();

async function checkTripOwnership(tripId, userId) {
  const r = await pool.query('SELECT id, user_id FROM trips WHERE id=$1', [tripId]);
  if (r.rowCount === 0) return { ok: false, code: 404, msg: 'Trip not found' };
  if (r.rows[0].user_id !== userId) return { ok: false, code: 403, msg: 'Forbidden: not your trip' };
  return { ok: true };
}

// Add stop
router.post('/:tripId', verifyToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    const ok = await checkTripOwnership(tripId, userId);
    if (!ok.ok) return res.status(ok.code).json({ error: ok.msg });

    const { city_name, country_name, start_date, end_date, order_index } = req.body;
    const r = await pool.query(
      `INSERT INTO stops (trip_id, city_name, country_name, start_date, end_date, order_index)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [tripId, city_name, country_name, start_date || null, end_date || null, order_index || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('POST /stops error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get stops by trip
router.get('/:tripId', verifyToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    const ok = await checkTripOwnership(tripId, userId);
    if (!ok.ok) return res.status(ok.code).json({ error: ok.msg });

    const r = await pool.query('SELECT * FROM stops WHERE trip_id=$1 ORDER BY COALESCE(order_index,id) ASC', [tripId]);
    return res.json(r.rows);
  } catch (err) {
    console.error('GET /stops error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update stop
router.put('/:stopId', verifyToken, async (req, res) => {
  try {
    const { stopId } = req.params;
    const userId = req.user.id;
    const stopR = await pool.query('SELECT * FROM stops WHERE id=$1', [stopId]);
    if (stopR.rowCount === 0) return res.status(404).json({ error: 'Stop not found' });
    const tripId = stopR.rows[0].trip_id;
    const ok = await checkTripOwnership(tripId, userId);
    if (!ok.ok) return res.status(ok.code).json({ error: ok.msg });

    const { city_name, country_name, start_date, end_date, order_index } = req.body;
    const r = await pool.query(
      `UPDATE stops SET city_name=$1, country_name=$2, start_date=$3, end_date=$4, order_index=$5 WHERE id=$6 RETURNING *`,
      [
        city_name ?? stopR.rows[0].city_name,
        country_name ?? stopR.rows[0].country_name,
        start_date ?? stopR.rows[0].start_date,
        end_date ?? stopR.rows[0].end_date,
        order_index !== undefined ? order_index : stopR.rows[0].order_index,
        stopId
      ]
    );
    return res.json(r.rows[0]);
  } catch (err) {
    console.error('PUT /stops/:stopId', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete stop
router.delete('/:stopId', verifyToken, async (req, res) => {
  try {
    const { stopId } = req.params;
    const userId = req.user.id;
    const stopR = await pool.query('SELECT * FROM stops WHERE id=$1', [stopId]);
    if (stopR.rowCount === 0) return res.status(404).json({ error: 'Stop not found' });
    const tripId = stopR.rows[0].trip_id;
    const ok = await checkTripOwnership(tripId, userId);
    if (!ok.ok) return res.status(ok.code).json({ error: ok.msg });

    await pool.query('DELETE FROM stops WHERE id=$1', [stopId]);
    return res.json({ message: 'Stop deleted' });
  } catch (err) {
    console.error('DELETE /stops/:stopId', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reorder (same as earlier)
router.patch('/reorder', verifyToken, async (req, res) => {
  const { tripId, order } = req.body;
  const userId = req.user.id;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'Invalid order array' });

  try {
    const ok = await checkTripOwnership(tripId, userId);
    if (!ok.ok) return res.status(ok.code).json({ error: ok.msg });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of order) {
        await client.query('UPDATE stops SET order_index=$1 WHERE id=$2 AND trip_id=$3', [item.order_index, item.stopId, tripId]);
      }
      await client.query('COMMIT');
      res.json({ message: 'Order updated' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('PATCH /stops/reorder', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
