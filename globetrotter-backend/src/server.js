// server.js
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import pool from '../db.js';
import authRoutes from './routes/auth.js';
import tripsRoutes from './routes/trips.js';
import stopsRoutes from './routes/stops.js';
import activitiesRoutes from './routes/activities.js';
import budgetsRoutes from './routes/budgets.js';
import expensesRoutes from './routes/expenses.js';
import collaboratorsRoutes from './routes/collaborators.js';
import activitySuggestionsRoutes from './routes/activitySuggestions.js';
import weatherRoutes from './routes/weather.js';
import pdfExportRoutes from './routes/pdfExport.js';
import notificationsRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import searchRoutes from './routes/search.js';
import shareRoutes from './routes/share.js';
import integrationsRoutes from './routes/integrations.js';
import geoRoutes from './routes/geo.js';
import placesRoutes from './routes/places.js';
import currencyRoutes from './routes/currency.js';
import aiRoutes from './routes/ai.js';
import collaborationRoutes from './routes/collaboration.js';
import expenseSharingRoutes from './routes/expenseSharing.js';
import calendarRoutes from './routes/calendar.js';
import adminRoutes from './routes/admin.js';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { verifyToken } from './middleware/authMiddleware.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*'} });
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('GlobeTrotter backend is up'));
// Health check
app.get('/health', async (req, res) => {
  try {
    const r = await pool.query('SELECT 1 as ok');
    res.json({
      status: 'ok',
      db: r.rows[0]?.ok === 1,
      env: {
        OPENWEATHER_API_KEY: !!process.env.OPENWEATHER_API_KEY,
        HUGGINGFACE_API_KEY: !!process.env.HUGGINGFACE_API_KEY,
      },
    });
  } catch (e) {
    res.status(500).json({ status: 'error', error: e?.message || 'unknown' });
  }
});

// mount routes
app.use('/auth', authRoutes);
app.use('/trips', tripsRoutes);
app.use('/stops', stopsRoutes);
app.use('/activities', activitiesRoutes);
app.use('/budgets', budgetsRoutes);
app.use('/expenses', expensesRoutes);
app.use('/collaborators', collaboratorsRoutes);
app.use('/activity-suggestions', activitySuggestionsRoutes);
app.use('/weather', weatherRoutes);
app.use('/pdf-export', pdfExportRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/search', searchRoutes);
app.use('/share', shareRoutes);
app.use('/integrations', integrationsRoutes);
app.use('/geo', geoRoutes);
app.use('/places', placesRoutes);
app.use('/currency', currencyRoutes);
app.use('/ai', aiRoutes);
app.use('/collab', collaborationRoutes);
app.use('/expense-sharing', expenseSharingRoutes);
app.use('/calendar', calendarRoutes);
app.use('/admin', adminRoutes);

// File uploads (simple local storage)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads');
import fs from 'fs';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random()*1e6);
    const ext = path.extname(file.originalname || '') || '.bin';
    cb(null, unique + ext);
  }
});
const upload = multer({ storage });
app.use('/uploads', express.static(uploadDir));
app.post('/media/upload', verifyToken, upload.single('file'), (req,res)=>{
  if (!req.file) return res.status(400).json({ error:'No file' });
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.originalname });
});

// quick DB test route (optional)
app.get('/_dbtest', async (req, res) => {
  try {
    const r = await pool.query('SELECT 1 as ok');
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});


const PORT = process.env.PORT || 5000;
io.on('connection', (socket) => {
  socket.on('join_trip', (tripId) => {
    if (tripId) socket.join(`trip:${tripId}`);
  });
  socket.on('collab_message', (payload) => {
    if (payload?.tripId) io.to(`trip:${payload.tripId}`).emit('collab_message', { ...payload, ts: Date.now() });
  });
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
