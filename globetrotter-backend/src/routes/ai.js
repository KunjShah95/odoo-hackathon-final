// routes/ai.js
// HuggingFace text generation proxy
import express from 'express';
import fetch from 'node-fetch';
import { verifyToken } from '../middleware/authMiddleware.js';
const router = express.Router();

const HF_KEY = process.env.HUGGINGFACE_API_KEY; // create at https://huggingface.co/settings/tokens
const MODEL = process.env.HUGGINGFACE_MODEL || 'gpt2';

router.post('/suggest', verifyToken, async (req, res) => {
  try {
    if (!HF_KEY) return res.status(500).json({ error: 'HUGGINGFACE_API_KEY not set' });
    const { prompt = 'Suggest a unique travel experience:' } = req.body || {};
    const r = await fetch(`https://api-inference.huggingface.co/models/${MODEL}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HF_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 40, temperature: 0.9 } })
    });
    if (!r.ok) {
      const txt = await r.text();
      return res.status(400).json({ error: 'HF request failed', detail: txt.slice(0,200) });
    }
    const data = await r.json();
    let text = '';
    if (Array.isArray(data) && data[0]?.generated_text) text = data[0].generated_text;
    res.json({ prompt, result: text.trim() });
  } catch (err) {
    console.error('POST /ai/suggest', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
