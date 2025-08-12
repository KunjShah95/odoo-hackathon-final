import express from 'express';
import pool from '../../db.js';
import { verifyToken } from '../middleware/authMiddleware.js';
const router = express.Router();

async function ensureTables(){
  await pool.query(`CREATE TABLE IF NOT EXISTS expense_shares (
    id SERIAL PRIMARY KEY,
    expense_id INT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_amount NUMERIC NOT NULL
  );`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_expense_shares_expense_id ON expense_shares(expense_id);`);
}
ensureTables().catch(e=>console.error('ensureTables expense_shares', e));

// Set shares for an expense (replace all)
router.post('/:expenseId/shares', verifyToken, async (req,res)=>{
  try {
    const { expenseId } = req.params; const { shares } = req.body; // [{user_id, share_amount}]
    if (!Array.isArray(shares) || !shares.length) return res.status(400).json({ error:'shares required'});
    const expR = await pool.query('SELECT e.*, t.user_id AS trip_owner FROM expenses e JOIN trips t ON e.trip_id=t.id WHERE e.id=$1',[expenseId]);
    if (expR.rowCount===0) return res.status(404).json({ error:'expense not found'});
    const exp = expR.rows[0];
    if (exp.trip_owner !== req.user.id) return res.status(403).json({ error:'forbidden'});
    await pool.query('DELETE FROM expense_shares WHERE expense_id=$1',[expenseId]);
    for (const s of shares) {
      if (!s.user_id || !s.share_amount) continue;
      await pool.query('INSERT INTO expense_shares (expense_id,user_id,share_amount) VALUES ($1,$2,$3)', [expenseId, s.user_id, s.share_amount]);
    }
    const all = await pool.query('SELECT * FROM expense_shares WHERE expense_id=$1',[expenseId]);
    return res.json(all.rows);
  } catch(err){ console.error('POST /expense-sharing/:expenseId/shares',err); res.status(500).json({ error:'Server error'}); }
});

// Get settlement summary for a trip
router.get('/trip/:tripId/settlement', verifyToken, async (req,res)=>{
  try {
    const { tripId } = req.params; const userId = req.user.id;
    const tripR = await pool.query('SELECT user_id FROM trips WHERE id=$1',[tripId]);
    if (tripR.rowCount===0) return res.status(404).json({ error:'trip not found'});
    if (tripR.rows[0].user_id !== userId) return res.status(403).json({ error:'forbidden'});
    const expR = await pool.query('SELECT e.id, e.amount, e.user_id FROM expenses e WHERE e.trip_id=$1',[tripId]);
    const shareR = await pool.query('SELECT es.expense_id, es.user_id, es.share_amount FROM expense_shares es JOIN expenses e ON es.expense_id=e.id WHERE e.trip_id=$1',[tripId]);
    const paid = {}; const owed = {};
    expR.rows.forEach(e=>{ paid[e.user_id] = (paid[e.user_id]||0)+ Number(e.amount); });
    shareR.rows.forEach(s=>{ owed[s.user_id] = (owed[s.user_id]||0)+ Number(s.share_amount); });
    const userIds = Array.from(new Set([...Object.keys(paid), ...Object.keys(owed)]));
    const net = userIds.map(uid => ({ user_id: Number(uid), net: (paid[uid]||0) - (owed[uid]||0) }));
    return res.json({ settlements: net });
  } catch(err){ console.error('GET /expense-sharing/trip/:tripId/settlement',err); res.status(500).json({ error:'Server error'}); }
});

export default router;
