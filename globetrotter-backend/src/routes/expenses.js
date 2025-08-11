// routes/expenses.js
import express from 'express';
import pool from '../../db.js';
import { verifyToken } from '../middleware/authMiddleware.js';
const router = express.Router();

// Add an expense to a trip
router.post('/:tripId', verifyToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    const { category, amount, currency = 'USD', description, date } = req.body;
    if (!category || !amount) return res.status(400).json({ error: 'Category and amount required' });
    // Check trip ownership
    const tripR = await pool.query('SELECT user_id FROM trips WHERE id=$1', [tripId]);
    if (tripR.rowCount === 0) return res.status(404).json({ error: 'Trip not found' });
    if (tripR.rows[0].user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
    const r = await pool.query(
      `INSERT INTO expenses (trip_id, user_id, category, amount, currency, description, date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [tripId, userId, category, amount, currency, description || null, date || new Date()]
    );
    return res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('POST /expenses/:tripId', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all expenses for a trip
router.get('/:tripId', verifyToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    // Check trip ownership
    const tripR = await pool.query('SELECT user_id FROM trips WHERE id=$1', [tripId]);
    if (tripR.rowCount === 0) return res.status(404).json({ error: 'Trip not found' });
    if (tripR.rows[0].user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
    const r = await pool.query('SELECT * FROM expenses WHERE trip_id=$1 AND user_id=$2 ORDER BY date DESC', [tripId, userId]);
    return res.json(r.rows);
  } catch (err) {
    console.error('GET /expenses/:tripId', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete an expense
router.delete('/:expenseId', verifyToken, async (req, res) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user.id;
    // Check expense ownership
    const r = await pool.query('SELECT * FROM expenses WHERE id=$1', [expenseId]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Expense not found' });
    if (r.rows[0].user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
    await pool.query('DELETE FROM expenses WHERE id=$1', [expenseId]);
    return res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error('DELETE /expenses/:expenseId', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
