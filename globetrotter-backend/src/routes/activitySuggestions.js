// routes/activitySuggestions.js
import express from 'express';
import fetch from 'node-fetch';
import { verifyToken } from '../middleware/authMiddleware.js';
const router = express.Router();

// GET /activity-suggestions/:city
router.get('/:city', verifyToken, async (req, res) => {
  try {
    const { city } = req.params;
    // Example: Use Wikipedia API for demo suggestions
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`;
    const wikiRes = await fetch(url);
    if (!wikiRes.ok) return res.status(404).json({ error: 'No suggestions found' });
    const data = await wikiRes.json();
    // Return a simple suggestion object
    res.json({
      city,
      title: data.title,
      description: data.extract,
      image: data.thumbnail?.source || null,
      wikiUrl: data.content_urls?.desktop?.page || null
    });
  } catch (err) {
    console.error('GET /activity-suggestions/:city', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
