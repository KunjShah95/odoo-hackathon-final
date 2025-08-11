const express =require('express');
const pool = require('../../db');
const auth=require('../middleware/auth');
const router =express.Router();

//create the trip
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, start_date, end_date } = req.body;
        const result = await pool.query(
            `INSERT INTO trips (user_id,name,description,start_date,end_date)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [req.userId, name, description, start_date, end_date]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get all trips
router.get('/', auth, async (req, res) => {
    const result = await pool.query(`SELECT * FROM trips WHERE user_id=$1`, [req.userId]);
    res.json(result.rows);
});

// Trip details: trip + stops + activities
router.get('/:id/details', auth, async (req, res) => {
    try {
        const tripId = req.params.id;
        // Ensure trip belongs to user
        const tripResult = await pool.query(`SELECT * FROM trips WHERE id=$1 AND user_id=$2`, [tripId, req.userId]);
        if (tripResult.rowCount === 0) return res.status(404).json({ error: 'Trip not found' });

        const stopsResult = await pool.query(
            `SELECT * FROM stops WHERE trip_id = $1 ORDER BY order_index NULLS LAST, id ASC`,
            [tripId]
        );
        const stops = stopsResult.rows;
        const stopIds = stops.map(s => s.id);
        let activitiesByStop = {};
        if (stopIds.length) {
            const actsResult = await pool.query(
                `SELECT * FROM activities WHERE stop_id = ANY($1::int[]) ORDER BY id ASC`,
                [stopIds]
            );
            for (const a of actsResult.rows) {
                if (!activitiesByStop[a.stop_id]) activitiesByStop[a.stop_id] = [];
                activitiesByStop[a.stop_id].push(a);
            }
        }

        const enrichedStops = stops.map(s => ({ ...s, activities: activitiesByStop[s.id] || [] }));
        res.json({ trip: tripResult.rows[0], stops: enrichedStops });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;