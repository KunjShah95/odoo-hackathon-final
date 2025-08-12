// routes/search.js
import express from 'express';
import pool from '../../db.js';
import fetch from 'node-fetch';
const router = express.Router();

// Search cities (mocked by stops + fallback)
router.get('/cities', async (req, res) => {
  try {
    const { q } = req.query;
    const suggestions = [];
    if (q) {
      const r = await pool.query(
        `SELECT DISTINCT city_name, country_name FROM stops WHERE LOWER(city_name) LIKE LOWER($1) LIMIT 20`,
        [`%${q}%`]
      );
      r.rows.forEach(row => suggestions.push({ city: row.city_name, country: row.country_name }));
    }
    if (suggestions.length === 0) {
      suggestions.push({ city: 'Paris', country: 'France', cost_index: 75, popularity: 95 });
      suggestions.push({ city: 'Bengaluru', country: 'India', cost_index: 40, popularity: 60 });
      suggestions.push({ city: 'Tokyo', country: 'Japan', cost_index: 85, popularity: 90 });
    }
    return res.json(suggestions);
  } catch (err) {
    console.error('GET /search/cities', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search trips (public or owned by user if userId provided)
router.get('/trips', async (req, res) => {
  try {
    const { q, userId } = req.query;
    if (!q || String(q).trim().length < 2) return res.json([]);
    const values = [`%${q}%`];
    let sql = `SELECT id, name, description, is_public, cover_photo FROM trips WHERE LOWER(name) LIKE LOWER($1)`;
    if (userId) {
      values.push(userId);
      sql += ` AND (is_public = true OR user_id = $2)`;
    } else {
      sql += ` AND is_public = true`;
    }
    sql += ' ORDER BY created_at DESC LIMIT 25';
    const r = await pool.query(sql, values);
    return res.json(r.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      cover_photo: row.cover_photo,
      public: row.is_public
    })));
  } catch (err) {
    console.error('GET /search/trips', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search activities by name substring
router.get('/activities', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || String(q).trim().length < 2) return res.json([]);
    const r = await pool.query(
      `SELECT a.id, a.name, a.type, a.image_url, s.city_name, t.name AS trip_name
       FROM activities a
       JOIN stops s ON a.stop_id = s.id
       JOIN trips t ON s.trip_id = t.id
       WHERE LOWER(a.name) LIKE LOWER($1)
       ORDER BY a.id DESC LIMIT 30`,
      [`%${q}%`]
    );
    return res.json(r.rows);
  } catch (err) {
    console.error('GET /search/activities', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users (basic public profile fields)
router.get('/users', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || String(q).trim().length < 2) return res.json([]);
    const r = await pool.query(
      `SELECT id, first_name, last_name, email, photo_url, country FROM users
       WHERE LOWER(first_name) LIKE LOWER($1) OR LOWER(last_name) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1)
       ORDER BY id DESC LIMIT 25`,
      [`%${q}%`]
    );
    return res.json(r.rows.map(u => ({
      id: u.id,
      name: `${u.first_name} ${u.last_name}`.trim(),
      email: u.email,
      photo: u.photo_url,
      country: u.country
    })));
  } catch (err) {
    console.error('GET /search/users', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Lightweight place name search via Overpass (public, rate-limited)
router.get('/places', async (req, res) => {
  try {
    const { q, lat = 51.5074, lon = -0.1278, radius = 15000, limit = 10 } = req.query;
    if (!q || String(q).trim().length < 3) return res.json([]);
    const safeNum = (v, d) => (isNaN(+v) ? d : +v);
    const qRadius = safeNum(radius, 15000);
    const qLat = safeNum(lat, 51.5074);
    const qLon = safeNum(lon, -0.1278);
    const searchStr = String(q).replace(/"/g, '');
    const overpass = `
      [out:json][timeout:25];
      (
        node["name"~"${searchStr}"](around:${qRadius},${qLat},${qLon});
        way["name"~"${searchStr}"](around:${qRadius},${qLat},${qLon});
        relation["name"~"${searchStr}"](around:${qRadius},${qLat},${qLon});
      );
      out center ${safeNum(limit,10)};`;
    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter'
    ];
    let raw = null; let lastErr = null;
    for (const ep of endpoints) {
      try {
        const r = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ data: overpass })
        });
        if (!r.ok) throw new Error('bad status');
        raw = await r.json();
        break;
      } catch (e) { lastErr = e; }
    }
    if (!raw) {
      console.error('Place search Overpass failed', lastErr);
      return res.json([]);
    }
    const elements = Array.isArray(raw.elements) ? raw.elements : [];
    const results = elements.map(el => {
      const tags = el.tags || {};
      return {
        id: el.id,
        type: el.type,
        name: tags.name || tags['name:en'] || '',
        lat: el.lat || el.center?.lat || null,
        lon: el.lon || el.center?.lon || null,
        category: tags.tourism || tags.amenity || tags.shop || null
      };
    }).filter(p => p.name && p.lat && p.lon).slice(0, safeNum(limit,10));
    return res.json(results);
  } catch (err) {
    console.error('GET /search/places', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
