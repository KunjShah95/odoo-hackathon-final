// routes/search.js
import express from 'express';
import pool from '../../db.js';
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

export default router;
