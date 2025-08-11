// routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../db.js';
import dotenv from 'dotenv';
import { verifyToken } from '../middleware/authMiddleware.js';
dotenv.config();

const router = express.Router();
const SALT_ROUNDS = 10;

/**
 * Register
 */
router.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, email, password, phone, city, country, additional_info, photo_url, currency_preference } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rowCount > 0) return res.status(400).json({ error: 'User already exists' });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const r = await pool.query(
      `INSERT INTO users (first_name,last_name,email,password_hash,phone,city,country,additional_info,photo_url,currency_preference)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, email, first_name, last_name, currency_preference`,
      [first_name, last_name, email, hashed, phone, city, country, additional_info, photo_url, currency_preference || 'USD']
    );
    return res.status(201).json({ message: 'User registered', user: r.rows[0] });
  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const r = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (r.rowCount === 0) return res.status(400).json({ error: 'Invalid credentials' });

    const user = r.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
    // Return user info along with token for frontend
    const userInfo = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      country: user.country,
      photo_url: user.photo_url,
      additional_info: user.additional_info,
      currency_preference: user.currency_preference || 'USD'
    };
    return res.json({ token, user: userInfo });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /auth/me
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const uid = req.user.id;
    const r = await pool.query(
      'SELECT id, first_name, last_name, email, phone, city, country, photo_url, additional_info, currency_preference, created_at FROM users WHERE id=$1',
      [uid]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    return res.json(r.rows[0]);
  } catch (err) {
    console.error('/auth/me error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PUT /auth/profile
 * Update current user's profile
 */
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const uid = req.user.id;
    const { first_name, last_name, phone, city, country, additional_info, photo_url, password, currency_preference } = req.body;

    // If password provided, hash it
    let password_hash = null;
    if (password) {
      password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    // Build update with fallback to existing values
    const existing = await pool.query('SELECT * FROM users WHERE id=$1', [uid]);
    if (existing.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    const ex = existing.rows[0];

    const result = await pool.query(
      `UPDATE users SET first_name=$1, last_name=$2, phone=$3, city=$4, country=$5, additional_info=$6, photo_url=$7, password_hash=$8, currency_preference=$9
       WHERE id=$10 RETURNING id, first_name, last_name, email, phone, city, country, photo_url, additional_info, currency_preference`,
      [
        first_name ?? ex.first_name,
        last_name ?? ex.last_name,
        phone ?? ex.phone,
        city ?? ex.city,
        country ?? ex.country,
        additional_info ?? ex.additional_info,
        photo_url ?? ex.photo_url,
        password_hash ?? ex.password_hash,
  (currency_preference ?? ex.currency_preference) || 'USD',
        uid
      ]
    );
    return res.json({ message: 'Profile updated', user: result.rows[0] });
  } catch (err) {
    console.error('PUT /auth/profile error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


router.delete('/delete', verifyToken, async (req, res) => {
  try {
    const uid = req.user.id;
    await pool.query('DELETE FROM users WHERE id=$1', [uid]);
    return res.json({ message: 'Account deleted' });
  } catch (err) {
    console.error('DELETE /auth/delete error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
