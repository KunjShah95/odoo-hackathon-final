// routes/budgets.js
import express from 'express';
import pool from '../../db.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { convertToCurrencies } from '../utils/currency.js';
const router = express.Router();

// Create or update budget for trip (upsert style)
router.post('/:tripId', verifyToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    const { transport_cost = 0, stay_cost = 0, activity_cost = 0, meal_cost = 0 } = req.body;

    const tripR = await pool.query('SELECT user_id FROM trips WHERE id=$1', [tripId]);
    if (tripR.rowCount === 0) return res.status(404).json({ error: 'Trip not found' });
    if (tripR.rows[0].user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

    const total = Number(transport_cost) + Number(stay_cost) + Number(activity_cost) + Number(meal_cost);

    // upsert: delete old and insert new (simple)
    await pool.query('DELETE FROM budgets WHERE trip_id=$1', [tripId]);
    const r = await pool.query(
      `INSERT INTO budgets (trip_id, transport_cost, stay_cost, activity_cost, meal_cost, total_cost)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [tripId, transport_cost, stay_cost, activity_cost, meal_cost, total]
    );
    return res.json(r.rows[0]);
  } catch (err) {
    console.error('POST /budgets/:tripId', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get budget
router.get('/:tripId', verifyToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    // Get trip info for user and dates
    const tripR = await pool.query('SELECT * FROM trips WHERE id=$1 AND user_id=$2', [tripId, userId]);
    if (tripR.rowCount === 0) return res.status(404).json({ error: 'Trip not found' });
    const trip = tripR.rows[0];

    const b = await pool.query('SELECT * FROM budgets WHERE trip_id=$1', [tripId]);
    if (b.rowCount === 0) return res.json({ message: 'No budget set' });
    const budget = b.rows[0];

    // Calculate trip duration in days (inclusive)
    let avgPerDay = null;
    if (trip.start_date && trip.end_date) {
      const start = new Date(trip.start_date);
      const end = new Date(trip.end_date);
      const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
      avgPerDay = +(budget.total_cost / days).toFixed(2);
    }

    // Calculate average per activity if needed (optional, not implemented here)

    // Convert average per day to multiple currencies
    let avgPerDayCurrencies = null;
    if (avgPerDay !== null) {
      try {
        avgPerDayCurrencies = await convertToCurrencies(avgPerDay, 'USD', ['USD', 'EUR', 'INR']);
      } catch (e) {
        avgPerDayCurrencies = { error: 'Currency conversion failed' };
      }
    }

    return res.json({
      ...budget,
      average_per_day_usd: avgPerDay,
      average_per_day_currencies: avgPerDayCurrencies,
    });
  } catch (err) {
    console.error('GET /budgets/:tripId', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
