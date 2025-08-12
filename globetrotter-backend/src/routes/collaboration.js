import express from 'express';
import pool from '../../db.js';
import { verifyToken } from '../middleware/authMiddleware.js';
const router = express.Router();

// Ensure tables (idempotent)
async function ensureTables() {
  await pool.query(`CREATE TABLE IF NOT EXISTS trip_chat_messages (
    id SERIAL PRIMARY KEY,
    trip_id INT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_trip_chat_trip_id ON trip_chat_messages(trip_id);`);
}
ensureTables().catch(e=>console.error('ensureTables chat', e));

// Post message
router.post('/:tripId/messages', verifyToken, async (req, res) => {
  try {
    const { tripId } = req.params; const { text } = req.body; const userId = req.user.id;
    if (!text || !text.trim()) return res.status(400).json({ error: 'text required' });
    const tripR = await pool.query('SELECT id,user_id FROM trips WHERE id=$1', [tripId]);
    if (tripR.rowCount===0) return res.status(404).json({ error: 'trip not found'});
    // allow owner or collaborator
    const collab = await pool.query('SELECT 1 FROM trip_collaborators WHERE trip_id=$1 AND user_id=$2',[tripId,userId]);
    if (tripR.rows[0].user_id!==userId && collab.rowCount===0) return res.status(403).json({ error: 'forbidden'});
    const r = await pool.query('INSERT INTO trip_chat_messages (trip_id,user_id,text) VALUES ($1,$2,$3) RETURNING *',[tripId,userId,text.trim()]);
    return res.status(201).json(r.rows[0]);
  } catch(err){
    console.error('POST /collab/:tripId/messages', err); res.status(500).json({ error:'Server error' });
  }
});

// Get messages (latest first or paginate)
router.get('/:tripId/messages', verifyToken, async (req,res)=>{
  try {
    const { tripId } = req.params; const { limit=100, before } = req.query; const userId = req.user.id;
    const tripR = await pool.query('SELECT id,user_id FROM trips WHERE id=$1',[tripId]);
    if (tripR.rowCount===0) return res.status(404).json({ error: 'trip not found'});
    const collab = await pool.query('SELECT 1 FROM trip_collaborators WHERE trip_id=$1 AND user_id=$2',[tripId,userId]);
    if (tripR.rows[0].user_id!==userId && collab.rowCount===0) return res.status(403).json({ error: 'forbidden'});
    const params=[tripId];
    let sql='SELECT m.*, u.first_name, u.last_name FROM trip_chat_messages m JOIN users u ON u.id=m.user_id WHERE trip_id=$1';
    if (before) { params.push(before); sql+=' AND m.id < $2'; }
    params.push(limit);
    sql += ` ORDER BY m.id DESC LIMIT $${params.length}`;
    const r = await pool.query(sql, params);
    return res.json(r.rows.reverse());
  } catch(err){ console.error('GET /collab/:tripId/messages', err); res.status(500).json({ error:'Server error'}); }
});

export default router;
