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
