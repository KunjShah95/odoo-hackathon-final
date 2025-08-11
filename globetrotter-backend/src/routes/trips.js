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

module.exports = router;