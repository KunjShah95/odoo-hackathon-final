// routes/places.js
// Popular nearby places via OpenTripMap
import express from 'express';
import fetch from 'node-fetch';
import { verifyToken } from '../middleware/authMiddleware.js';
const router = express.Router();

const OTM_KEY = process.env.OPENTRIPMAP_API_KEY;
const OTM_BASE = 'https://api.opentripmap.com/0.1/en/places';

const cache = new Map();
const TTL = 1000 * 60 * 15; // 15 min
const safeNum = (v, def) => (isNaN(+v) ? def : +v);

router.get('/nearby', verifyToken, async (req, res) => {
  try {
    if (!OTM_KEY) return res.status(500).json({ error: 'OPENTRIPMAP_API_KEY not set' });
    const { lat = 51.5074, lon = -0.1278, radius = 10000, limit = 5 } = req.query;
    const key = `nearby:${lat}:${lon}:${radius}:${limit}`;
    const cached = cache.get(key);
    if (cached && cached.exp > Date.now()) return res.json({ cached: true, items: cached.data });
    const url = `${OTM_BASE}/radius?radius=${safeNum(radius, 10000)}&lon=${safeNum(lon, -0.1278)}&lat=${safeNum(lat, 51.5074)}&rate=3&format=json&limit=${safeNum(limit,5)}&apikey=${OTM_KEY}`;
    const r = await fetch(url);
    if (!r.ok) return res.status(400).json({ error: 'Failed to fetch places' });
    const raw = await r.json();
    cache.set(key, { data: raw, exp: Date.now() + TTL });
    res.json({ cached: false, items: raw });
  } catch (err) {
    console.error('GET /places/nearby', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/details/:xid', verifyToken, async (req, res) => {
  try {
    if (!OTM_KEY) return res.status(500).json({ error: 'OPENTRIPMAP_API_KEY not set' });
    const { xid } = req.params;
    const key = `detail:${xid}`;
    const cached = cache.get(key);
    if (cached && cached.exp > Date.now()) return res.json({ cached: true, ...cached.data });
    const url = `${OTM_BASE}/xid/${xid}?apikey=${OTM_KEY}`;
    const r = await fetch(url);
    if (!r.ok) return res.status(404).json({ error: 'Not found' });
    const data = await r.json();
    cache.set(key, { data, exp: Date.now() + TTL });
    res.json({ cached: false, ...data });
  } catch (err) {
    console.error('GET /places/details/:xid', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
