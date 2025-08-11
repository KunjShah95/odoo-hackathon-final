// routes/weather.js
import express from 'express';
import fetch from 'node-fetch';
import { verifyToken } from '../middleware/authMiddleware.js';
const router = express.Router();

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// GET /weather?city=CityName
router.get('/', verifyToken, async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) return res.status(400).json({ error: 'City required' });
    if (!OPENWEATHER_API_KEY) return res.status(500).json({ error: 'Weather API key not set' });
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const weatherRes = await fetch(url);
    if (!weatherRes.ok) return res.status(404).json({ error: 'Weather not found' });
    const data = await weatherRes.json();
    res.json({
      city: data.name,
      country: data.sys.country,
      temp: data.main.temp,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      wind: data.wind.speed
    });
  } catch (err) {
    console.error('GET /weather', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
