const express = require('express');
const pool = require('../../db');
const auth = require('../middleware/auth');
const router = express.Router();

// Add Stop to a Trip
router.post('/:tripId', auth, async (req, res) => {
    const { city_name, country_name, start_date, end_date, order_index } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO stops (trip_id, city_name, country_name, start_date, end_date, order_index)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [req.params.tripId, city_name, country_name, start_date, end_date, order_index]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get all stops for a trip (ordered)
router.get('/by-trip/:tripId', auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM stops WHERE trip_id = $1 ORDER BY order_index NULLS LAST, id ASC`,
            [req.params.tripId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
