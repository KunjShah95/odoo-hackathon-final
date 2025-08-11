const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../../db');
require('dotenv').config();

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    const { first_name, last_name, email, password, phone, city, country, additional_info } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    try {
        const result = await pool.query(
            `INSERT INTO users (first_name, last_name, email, password_hash, phone, city, country, additional_info)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, email`,
            [first_name, last_name, email, hashed, phone, city, country, additional_info]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const userResult = await pool.query(`SELECT * FROM users WHERE email=$1`, [email]);

    if (userResult.rowCount === 0) return res.status(400).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, userResult.rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: userResult.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
});

module.exports = router;
