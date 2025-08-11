// routes/geo.js
// Geocoding using Nominatim (OpenStreetMap) only – no API key required
import express from 'express';
import fetch from 'node-fetch';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Simple in-memory cache
const cache = new Map(); // key -> { data, exp }
const TTL_MS = 1000 * 60 * 30; // 30 min

function getCache(key) {
  const v = cache.get(key);
  if (v && v.exp > Date.now()) return v.data;
  if (v) cache.delete(key);
  return null;
}
function setCache(key, data) {
  cache.set(key, { data, exp: Date.now() + TTL_MS });
}

// GET /geo/forward?city=Paris
router.get('/forward', verifyToken, async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) return res.status(400).json({ error: 'city query required' });
    const key = `f:${city}`.toLowerCase();
    const cached = getCache(key);
    if (cached) return res.json({ source: cached.source, ...cached.payload, cached: true });

  // Nominatim
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(city)}`;
    const nr = await fetch(nomUrl, { headers: { 'User-Agent': 'GlobeTrotterApp/1.0 (demo)' } });
    if (!nr.ok) return res.status(404).json({ error: 'not found' });
    const ndata = await nr.json();
    if (!Array.isArray(ndata) || !ndata.length) return res.status(404).json({ error: 'not found' });
    const n = ndata[0];
    const payload = { lat: +n.lat, lon: +n.lon, name: n.display_name };
  setCache(key, { source: 'nominatim', payload });
  res.json({ source: 'nominatim', ...payload });
  } catch (err) {
    console.error('GET /geo/forward', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
