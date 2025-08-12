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
const SERP_API_KEY = process.env.SERP_API_KEY || '';
// Simple in-memory rate limiter: key-> {count, reset}
const rateBuckets = new Map();
const RATE_LIMIT = 30; // requests
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

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

// Image search via SerpAPI (Google Images) - returns first few image URLs
router.get('/images', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'query required' });
    if (!SERP_API_KEY) return res.status(200).json({ warning: 'SERP_API_KEY missing', images: [] });
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.ip || 'anon';
  const now = Date.now();
  const b = rateBuckets.get(ip) || { count: 0, reset: now + RATE_WINDOW_MS };
  if (now > b.reset) { b.count = 0; b.reset = now + RATE_WINDOW_MS; }
  if (b.count >= RATE_LIMIT) return res.status(429).json({ error: 'rate_limited', retry_in_ms: b.reset - now });
  b.count++; rateBuckets.set(ip, b);
    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&tbm=isch&api_key=${SERP_API_KEY}`;
    const r = await fetch(url);
    if (!r.ok) return res.status(r.status).json({ error: 'serp request failed' });
    const data = await r.json();
    const images = (data.images_results || []).slice(0, 5).map((img) => ({
      position: img.position,
      thumbnail: img.thumbnail,
      original: img.original || img.original_image || img.thumbnail,
      source: img.source || img.domain
    }));
    return res.json({ query, images });
  } catch (err) {
    console.error('GET /integrations/images', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Wikipedia search (fallback if exact summary lookup fails)
// Uses MediaWiki API to search and return the top match with thumbnail
router.get('/wiki/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'query required' });
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'pageimages|info',
      inprop: 'url',
      piprop: 'thumbnail',
      pithumbsize: '400',
      generator: 'search',
      gsrsearch: String(query),
      gsrlimit: '1',
      origin: '*'
    });
    const url = `https://en.wikipedia.org/w/api.php?${params.toString()}`;
    const r = await fetch(url);
    if (!r.ok) return res.status(r.status).json({ error: 'search failed' });
    const data = await r.json();
    const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
    if (!pages.length) return res.json({ result: null });
    const p = pages[0];
    return res.json({
      result: {
        pageid: p.pageid,
        title: p.title,
        image: p.thumbnail?.source || null,
        page: p.fullurl || (p.canonicalurl || `https://en.wikipedia.org/?curid=${p.pageid}`)
      }
    });
  } catch (err) {
    console.error('GET /integrations/wiki/search', err);
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
