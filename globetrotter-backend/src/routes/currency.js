// routes/currency.js
// Currency conversion using exchangerate.host (free, no key)
import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import fetch from 'node-fetch';
const router = express.Router();

router.get('/convert', verifyToken, async (req, res) => {
  try {
    const { amount = '1', base = 'USD', targets = 'USD,EUR,INR' } = req.query;
    const am = parseFloat(amount);
    if (isNaN(am)) return res.status(400).json({ error: 'Invalid amount' });
    const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(targets)}`;
    const r = await fetch(url);
    if (!r.ok) return res.status(400).json({ error: 'Failed to fetch rates' });
    const data = await r.json();
    const out = {};
    Object.entries(data.rates || {}).forEach(([cur, rate]) => {
      out[cur] = +(am * rate).toFixed(2);
    });
    res.json({ base, amount: am, conversions: out });
  } catch (err) {
    console.error('GET /currency/convert', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
