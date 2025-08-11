// routes/activities.js
import express from 'express';
import pool from '../../db.js';
import { verifyToken } from '../middleware/authMiddleware.js';
const router = express.Router();

// Helper: verify stop->trip->user ownership
async function checkStopOwnership(stopId, userId) {
  const sr = await pool.query('SELECT s.id, s.trip_id, t.user_id FROM stops s JOIN trips t ON s.trip_id=t.id WHERE s.id=$1', [stopId]);
  if (sr.rowCount === 0) return { ok: false, code: 404, msg: 'Stop not found' };
  if (sr.rows[0].user_id !== userId) return { ok: false, code: 403, msg: 'Forbidden' };
  return { ok: true, trip_id: sr.rows[0].trip_id };
}

// Add activity
router.post('/:stopId', verifyToken, async (req, res) => {
  try {
    const { stopId } = req.params;
    const userId = req.user.id;
    const chk = await checkStopOwnership(stopId, userId);
    if (!chk.ok) return res.status(chk.code).json({ error: chk.msg });

    const { name, description, type, cost, duration_minutes, image_url } = req.body;
    const r = await pool.query(
      `INSERT INTO activities (stop_id, name, description, type, cost, duration_minutes, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [stopId, name, description, type || null, cost || 0, duration_minutes || null, image_url || null]
    );
    return res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('POST /activities/:stopId', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get activities for stop
router.get('/stop/:stopId', verifyToken, async (req, res) => {
  try {
    const { stopId } = req.params;
    const userId = req.user.id;
    const chk = await checkStopOwnership(stopId, userId);
    if (!chk.ok) return res.status(chk.code).json({ error: chk.msg });

    const r = await pool.query('SELECT * FROM activities WHERE stop_id=$1 ORDER BY id ASC', [stopId]);
    return res.json(r.rows);
  } catch (err) {
    console.error('GET /activities/stop/:stopId', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update activity
router.put('/:activityId', verifyToken, async (req, res) => {
  try {
    const { activityId } = req.params;
    const userId = req.user.id;

    // find activity joined with stop->trip->user
    const ar = await pool.query(
      `SELECT a.*, s.trip_id, t.user_id 
       FROM activities a 
       JOIN stops s ON a.stop_id = s.id 
       JOIN trips t ON s.trip_id = t.id
       WHERE a.id=$1`,
      [activityId]
    );
    if (ar.rowCount === 0) return res.status(404).json({ error: 'Activity not found' });
    if (ar.rows[0].user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

    const ex = ar.rows[0];
    const { name, description, type, cost, duration_minutes, image_url } = req.body;

    const r = await pool.query(
      `UPDATE activities SET name=$1, description=$2, type=$3, cost=$4, duration_minutes=$5, image_url=$6
       WHERE id=$7 RETURNING *`,
      [
        name ?? ex.name,
        description ?? ex.description,
        type ?? ex.type,
        cost !== undefined ? cost : ex.cost,
        duration_minutes !== undefined ? duration_minutes : ex.duration_minutes,
        image_url ?? ex.image_url,
        activityId
      ]
    );
    return res.json(r.rows[0]);
  } catch (err) {
    console.error('PUT /activities/:activityId', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete activity
router.delete('/:activityId', verifyToken, async (req, res) => {
  try {
    const { activityId } = req.params;
    const userId = req.user.id;

    const ar = await pool.query(
      `SELECT a.id, s.trip_id, t.user_id 
       FROM activities a 
       JOIN stops s ON a.stop_id=s.id 
       JOIN trips t ON s.trip_id=t.id
       WHERE a.id=$1`,
      [activityId]
    );
    if (ar.rowCount === 0) return res.status(404).json({ error: 'Activity not found' });
    if (ar.rows[0].user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

    await pool.query('DELETE FROM activities WHERE id=$1', [activityId]);
    return res.json({ message: 'Activity deleted' });
  } catch (err) {
    console.error('DELETE /activities/:activityId', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search activities (public)
router.get('/search', async (req, res) => {
  try {
    const { query, type, maxCost } = req.query;
    let sql = 'SELECT * FROM activities WHERE 1=1';
    const params = [];
    if (query) {
      params.push(`%${query}%`);
      sql += ` AND LOWER(name) LIKE LOWER($${params.length})`;
    }
    if (type) {
      params.push(type);
      sql += ` AND LOWER(type)=LOWER($${params.length})`;
    }
    if (maxCost) {
      params.push(Number(maxCost));
      sql += ` AND cost <= $${params.length}`;
    }
    const r = await pool.query(sql, params);
    return res.json(r.rows);
  } catch (err) {
    console.error('GET /activities/search', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
