// routes/places.js
// Popular nearby places via OpenStreetMap Overpass API (no API key required)
import express from 'express';
import fetch from 'node-fetch';
import { verifyToken } from '../middleware/authMiddleware.js';
const router = express.Router();

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.openstreetmap.ru/cgi/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

const cache = new Map();
const TTL = 1000 * 60 * 15; // 15 min
const safeNum = (v, def) => (isNaN(+v) ? def : +v);

router.get('/nearby', verifyToken, async (req, res) => {
  try {
    const { lat = 51.5074, lon = -0.1278, radius = 10000, limit = 5 } = req.query;
    const key = `nearby:${lat}:${lon}:${radius}:${limit}`;
    const cached = cache.get(key);
    if (cached && cached.exp > Date.now()) return res.json({ cached: true, items: cached.data });
    const qRadius = safeNum(radius, 10000);
    const qLat = safeNum(lat, 51.5074);
    const qLon = safeNum(lon, -0.1278);
    // Overpass query for common tourist POIs
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["tourism"~"attraction|museum|viewpoint|zoo|theme_park|artwork|gallery"](around:${qRadius},${qLat},${qLon});
        way["tourism"~"attraction|museum|viewpoint|zoo|theme_park|artwork|gallery"](around:${qRadius},${qLat},${qLon});
        relation["tourism"~"attraction|museum|viewpoint|zoo|theme_park|artwork|gallery"](around:${qRadius},${qLat},${qLon});
        node["amenity"~"park|theatre|arts_centre"](around:${qRadius},${qLat},${qLon});
      );
      out center 50;`;
    // Try each endpoint until one succeeds
    let raw = null;
    let lastErr = null;
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const r = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ data: overpassQuery })
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        raw = await r.json();
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!raw) {
      console.error('All Overpass endpoints failed', lastErr);
      const fallback = [
        { id: 'fallback-tower-bridge', osmType: 'node', name: 'Tower Bridge', lat: 51.5055, lon: -0.0754, kinds: 'attraction', url: 'https://en.wikipedia.org/wiki/Tower_Bridge' },
        { id: 'fallback-british-museum', osmType: 'node', name: 'British Museum', lat: 51.5194, lon: -0.1269, kinds: 'museum', url: 'https://en.wikipedia.org/wiki/British_Museum' },
        { id: 'fallback-hyde-park', osmType: 'node', name: 'Hyde Park', lat: 51.5073, lon: -0.1657, kinds: 'park', url: 'https://en.wikipedia.org/wiki/Hyde_Park,_London' }
      ].slice(0, safeNum(limit, 5));
      return res.json({ cached: false, items: fallback, fallback: true });
    }
    const elements = Array.isArray(raw.elements) ? raw.elements : [];
    // Normalize and sort by presence of name, then by type preference
    const normalized = elements
      .map((el) => {
        const type = el.type; // node|way|relation
        const id = el.id;
        const tags = el.tags || {};
        const name = tags.name || tags["name:en"] || '';
        const lat = el.lat || el.center?.lat || null;
        const lon = el.lon || el.center?.lon || null;
        const tourism = tags.tourism || '';
        const amenity = tags.amenity || '';
        const kinds = [tourism, amenity].filter(Boolean).join(',');
        const url = `https://www.openstreetmap.org/${type}/${id}`;
        const wikidata = tags.wikidata || null;
        const wikipedia = tags.wikipedia || null;
        return { id: String(id), osmType: type, name, lat, lon, kinds, url, wikidata, wikipedia };
      })
      .filter((p) => p.lat && p.lon && p.name)
      .slice(0, safeNum(limit, 5));
    cache.set(key, { data: normalized, exp: Date.now() + TTL });
    res.json({ cached: false, items: normalized });
  } catch (err) {
    console.error('GET /places/nearby', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Public (no-auth) nearby endpoint with tighter limits for SmartSuggestions fallback
router.get('/public-nearby', async (req, res) => {
  try {
    const { lat = 51.5074, lon = -0.1278, radius = 8000, limit = 3 } = req.query;
    const key = `publicNearby:${lat}:${lon}:${radius}:${limit}`;
    const cached = cache.get(key);
    if (cached && cached.exp > Date.now()) return res.json({ cached: true, items: cached.data, public: true });
    const qRadius = safeNum(radius, 8000);
    const qLat = safeNum(lat, 51.5074);
    const qLon = safeNum(lon, -0.1278);
    const overpassQuery = `
      [out:json][timeout:20];
      (
        node["tourism"~"attraction|museum|viewpoint|artwork|gallery"](around:${qRadius},${qLat},${qLon});
        node["amenity"~"park|theatre"](around:${qRadius},${qLat},${qLon});
      );
      out center 30;`;
    let raw = null; let lastErr = null;
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const r = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ data: overpassQuery })
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        raw = await r.json();
        break;
      } catch (e) { lastErr = e; }
    }
    if (!raw) {
      console.error('Public nearby Overpass failed', lastErr);
      const fallback = [
        { id: 'fallback-london-eye', osmType: 'node', name: 'London Eye', lat: 51.5033, lon: -0.1195, kinds: 'attraction', url: 'https://en.wikipedia.org/wiki/London_Eye' },
        { id: 'fallback-national-gallery', osmType: 'node', name: 'National Gallery', lat: 51.5089, lon: -0.1283, kinds: 'museum', url: 'https://en.wikipedia.org/wiki/National_Gallery' },
        { id: 'fallback-regents-park', osmType: 'node', name: "Regent's Park", lat: 51.5313, lon: -0.1569, kinds: 'park', url: "https://en.wikipedia.org/wiki/Regent's_Park" }
      ].slice(0, safeNum(limit, 3));
      return res.json({ cached: false, items: fallback, fallback: true, public: true });
    }
    const elements = Array.isArray(raw.elements) ? raw.elements : [];
    const normalized = elements
      .map(el => {
        const tags = el.tags || {};
        const name = tags.name || tags['name:en'] || '';
        const latc = el.lat || el.center?.lat || null;
        const lonc = el.lon || el.center?.lon || null;
        const kinds = [tags.tourism || '', tags.amenity || ''].filter(Boolean).join(',');
        const url = `https://www.openstreetmap.org/${el.type}/${el.id}`;
        return { id: String(el.id), osmType: el.type, name, lat: latc, lon: lonc, kinds, url };
      })
      .filter(p => p.name && p.lat && p.lon)
      .slice(0, safeNum(limit, 3));
    cache.set(key, { data: normalized, exp: Date.now() + TTL });
    res.json({ cached: false, items: normalized, public: true });
  } catch (err) {
    console.error('GET /places/public-nearby', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Details endpoint: returns a single element by type and id using Overpass
router.get('/details/:type/:id', verifyToken, async (req, res) => {
  try {
    const { type, id } = req.params; // node|way|relation and numeric id
    const key = `detail:${type}:${id}`;
    const cached = cache.get(key);
    if (cached && cached.exp > Date.now()) return res.json({ cached: true, ...cached.data });
    const selector = `${type}(${Number(id)});`;
    const query = `[
      out:json
    ];
    ${selector}
    out center;`;
    const r = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ data: query })
    });
    if (!r.ok) return res.status(404).json({ error: 'Not found' });
    const data = await r.json();
    const el = (data.elements && data.elements[0]) || null;
    if (!el) return res.status(404).json({ error: 'Not found' });
    const tags = el.tags || {};
    const detail = {
      id: String(el.id),
      osmType: el.type,
      name: tags.name || tags['name:en'] || '',
      lat: el.lat || el.center?.lat || null,
      lon: el.lon || el.center?.lon || null,
      kinds: [tags.tourism || '', tags.amenity || ''].filter(Boolean).join(','),
      url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
      tags,
    };
    cache.set(key, { data: detail, exp: Date.now() + TTL });
    res.json({ cached: false, ...detail });
  } catch (err) {
    console.error('GET /places/details/:type/:id', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
