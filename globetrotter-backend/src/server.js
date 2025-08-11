// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import pool from '../db.js';
import authRoutes from './routes/auth.js';
import tripsRoutes from './routes/trips.js';
import stopsRoutes from './routes/stops.js';
import activitiesRoutes from './routes/activities.js';
import budgetsRoutes from './routes/budgets.js';
import searchRoutes from './routes/search.js';
import shareRoutes from './routes/share.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('GlobeTrotter backend is up'));

// mount routes
app.use('/auth', authRoutes);
app.use('/trips', tripsRoutes);
app.use('/stops', stopsRoutes);
app.use('/activities', activitiesRoutes);
app.use('/budgets', budgetsRoutes);
app.use('/search', searchRoutes);
app.use('/share', shareRoutes);

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
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
