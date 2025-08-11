// routes/integrations.js
// Consolidated proxy + helper endpoints for free external APIs
// Free API references:
// - Wikipedia Summary: https://en.wikipedia.org/api/rest_v1/#/Page%20content/get_page_summary__title_
// - Exchange Rates: https://exchangerate.host/#/
// - REST Countries: https://restcountries.com/
// - World Time: http://worldtimeapi.org/
// - OpenWeather (already in /weather)
// - HuggingFace Inference (optional, token via env)

import express from 'express';
import fetch from 'node-fetch';
import { verifyToken } from '../middleware/authMiddleware.js';
import { convertToCurrencies } from '../utils/currency.js';
const router = express.Router();

const HUGGINGFACE_MODEL = process.env.HF_MODEL || 'gpt2';
const HUGGINGFACE_TOKEN = process.env.HF_API_TOKEN || '';

router.get('/', (_req, res) => res.json({ message: 'Integrations root ok' }));

// Note: Geocoding and Places are handled in dedicated routes /geo and /places

// Wikipedia summary
router.get('/wiki/summary', async (req, res) => {
  try {
    const { title } = req.query;
    if (!title) return res.status(400).json({ error: 'title required' });
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const r = await fetch(url);
    if (!r.ok) return res.status(r.status).json({ error: 'not found' });
    const data = await r.json();
    return res.json({
      title: data.title,
      extract: data.extract,
      image: data.thumbnail?.source || null,
      page: data.content_urls?.desktop?.page || null
    });
  } catch (err) {
    console.error('GET /integrations/wiki/summary', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Countries info (basic projection)
router.get('/countries', async (_req, res) => {
  try {
    const url = 'https://restcountries.com/v3.1/all';
    const r = await fetch(url);
    if (!r.ok) return res.status(r.status).json({ error: 'fetch failed' });
    const data = await r.json();
    const mapped = data.map(c => ({
      name: c.name?.common,
      cca2: c.cca2,
      region: c.region,
      capital: c.capital?.[0] || null,
      population: c.population,
      currencies: c.currencies ? Object.keys(c.currencies) : [],
      flag: c.flags?.svg || c.flags?.png
    }));
    return res.json(mapped);
  } catch (err) {
    console.error('GET /integrations/countries', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Timezone
router.get('/timezone', async (req, res) => {
  try {
    const { area } = req.query; // e.g. Europe/Paris
    if (!area) return res.status(400).json({ error: 'area required (Region/City)' });
    const url = `http://worldtimeapi.org/api/timezone/${area}`;
    const r = await fetch(url);
    if (!r.ok) return res.status(r.status).json({ error: 'fetch failed' });
    const data = await r.json();
    return res.json({ datetime: data.datetime, utc_offset: data.utc_offset, day_of_week: data.day_of_week });
  } catch (err) {
    console.error('GET /integrations/timezone', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Currency conversion
router.get('/currency/convert', async (req, res) => {
  try {
    const { amount, base = 'USD', targets = 'USD,EUR,INR' } = req.query;
    if (!amount) return res.status(400).json({ error: 'amount required' });
    const targetList = String(targets).split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const numAmount = Number(amount);
    if (Number.isNaN(numAmount)) return res.status(400).json({ error: 'invalid amount' });
    const converted = await convertToCurrencies(numAmount, String(base).toUpperCase(), targetList);
    return res.json({ base: base.toUpperCase(), amount: numAmount, converted });
  } catch (err) {
    console.error('GET /integrations/currency/convert', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// AI generation (auth since potentially rate-limited)
router.post('/ai/generate', verifyToken, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });
    const url = `https://api-inference.huggingface.co/models/${HUGGINGFACE_MODEL}`;
    const hfRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(HUGGINGFACE_TOKEN ? { Authorization: `Bearer ${HUGGINGFACE_TOKEN}` } : {})
      },
      body: JSON.stringify({ inputs: prompt })
    });
    if (!hfRes.ok) return res.status(hfRes.status).json({ error: 'generation failed' });
    const data = await hfRes.json();
    const text = Array.isArray(data) ? (data[0]?.generated_text || '') : JSON.stringify(data);
    return res.json({ prompt, text });
  } catch (err) {
    console.error('POST /integrations/ai/generate', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
