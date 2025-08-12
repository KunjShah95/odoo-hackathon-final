import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../db.js';

const router = express.Router();
const SALT_ROUNDS = 10;

function signAdminToken(admin) {
  const secret = process.env.JWT_SECRET || 'dev_secret';
  return jwt.sign({ role: 'admin', id: admin.id, email: admin.email }, secret, { expiresIn: '24h' });
}

function verifyAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const data = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    if (data.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    req.admin = { id: data.id, email: data.email };
    next();
  } catch (e) { return res.status(401).json({ error: 'Unauthorized' }); }
}

async function ensureAdminTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}
ensureAdminTable().catch(()=>{});

// POST /admin/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const r = await pool.query('SELECT * FROM admins WHERE email=$1', [email]);
    if (r.rowCount === 0) return res.status(400).json({ error: 'Invalid credentials' });
    const admin = r.rows[0];
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    const token = signAdminToken(admin);
    return res.json({ token, admin: { id: admin.id, email: admin.email } });
  } catch (e) { console.error('POST /admin/login', e); return res.status(500).json({ error: 'Server error' }); }
});

// POST /admin/bootstrap - create a default admin if missing (one-time, unprotected)
router.post('/bootstrap', async (req, res) => {
  try {
    await ensureAdminTable();
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const exists = await pool.query('SELECT id FROM admins WHERE email=$1', [email]);
    if (exists.rowCount > 0) return res.json({ message: 'Admin exists', email });
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const r = await pool.query('INSERT INTO admins (email, password_hash) VALUES ($1,$2) RETURNING id', [email, hash]);
    return res.status(201).json({ message: 'Admin created', id: r.rows[0].id, email, password });
  } catch (e) { console.error('POST /admin/bootstrap', e); return res.status(500).json({ error: 'Server error' }); }
});

// POST /admin/seed - insert dummy users/trips/stops/activities/expenses
router.post('/seed', verifyAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Users
    const demoUsers = [
      { first_name:'Alice', last_name:'Traveler', email:'alice@example.com' },
      { first_name:'Bob', last_name:'Nomad', email:'bob@example.com' },
      { first_name:'Cara', last_name:'Explorer', email:'cara@example.com' }
    ];
    const userIds = [];
    for (const u of demoUsers) {
      const exists = await client.query('SELECT id FROM users WHERE email=$1', [u.email]);
      if (exists.rowCount > 0) { userIds.push(exists.rows[0].id); continue; }
      const hash = await bcrypt.hash('password', SALT_ROUNDS);
      const ir = await client.query(
        `INSERT INTO users (first_name,last_name,email,password_hash,currency_preference)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [u.first_name, u.last_name, u.email, hash, 'USD']
      );
      userIds.push(ir.rows[0].id);
    }

    const ownerId = userIds[0];
    // Trip
    const tr = await client.query(
      `INSERT INTO trips (user_id, name, description, is_public, total_cost)
       VALUES ($1,$2,$3,true,$4)
       ON CONFLICT DO NOTHING RETURNING id`,
      [ownerId, 'Demo Euro Tour', 'Sample seeded trip', 0]
    );
    let tripId;
    if (tr.rowCount === 0) {
      const existing = await client.query('SELECT id FROM trips WHERE user_id=$1 AND name=$2', [ownerId, 'Demo Euro Tour']);
      tripId = existing.rows[0]?.id;
    } else { tripId = tr.rows[0].id; }

    // Collaborators
    for (let i = 1; i < userIds.length; i++) {
      await client.query(
        `INSERT INTO trip_collaborators (trip_id, user_id, role)
         VALUES ($1,$2,'editor') ON CONFLICT DO NOTHING`,
        [tripId, userIds[i]]
      );
    }

    // Stops
    const today = new Date();
    const d1 = new Date(today.getTime() + 3*24*60*60*1000);
    const d2 = new Date(today.getTime() + 6*24*60*60*1000);
    const d3 = new Date(today.getTime() + 9*24*60*60*1000);
    const stops = [
      { city_name:'Paris', country_name:'France', start_date:d1, end_date:new Date(d1.getTime()+2*86400000), order_index:1 },
      { city_name:'Rome', country_name:'Italy', start_date:d2, end_date:new Date(d2.getTime()+2*86400000), order_index:2 },
      { city_name:'Barcelona', country_name:'Spain', start_date:d3, end_date:new Date(d3.getTime()+2*86400000), order_index:3 },
    ];
    const stopIds = [];
    for (const s of stops) {
      const sr = await client.query(
        `INSERT INTO stops (trip_id, city_name, country_name, start_date, end_date, order_index)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id`,
        [tripId, s.city_name, s.country_name, s.start_date, s.end_date, s.order_index]
      );
      stopIds.push(sr.rows[0].id);
    }

    // Activities
    const acts = [
      { stop: 0, name:'Eiffel Tower', type:'sight', cost:35, description:'Visit the iconic tower.' },
      { stop: 1, name:'Colosseum Tour', type:'sight', cost:25, description:'Ancient amphitheatre tour.' },
      { stop: 2, name:'Sagrada Família', type:'sight', cost:20, description:'Famous basilica.' }
    ];
    for (const a of acts) {
      await client.query(
        `INSERT INTO activities (stop_id, name, description, type, cost)
         VALUES ($1,$2,$3,$4,$5)`,
        [stopIds[a.stop], a.name, a.description, a.type, a.cost]
      );
    }

    // Expenses
    const exp = [
      { amount: 120.5, category:'hotel', description:'Paris hotel 1 night' },
      { amount: 60.0, category:'food', description:'Rome dinner' },
      { amount: 30.0, category:'transport', description:'Barcelona metro cards' }
    ];
    for (const e of exp) {
      await client.query(
        `INSERT INTO expenses (trip_id, user_id, amount, currency, category, description)
         VALUES ($1,$2,$3,'USD',$4,$5)`,
        [tripId, ownerId, e.amount, e.category, e.description]
      );
    }

    await client.query('COMMIT');
    return res.json({ message:'Seeded', tripId, users: userIds.length, stops: stopIds.length, activities: acts.length, expenses: exp.length });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('POST /admin/seed', e);
    return res.status(500).json({ error: 'Server error' });
  } finally { client.release(); }
});

// GET /admin/analytics - global numbers for dashboard
router.get('/analytics', verifyAdmin, async (_req, res) => {
  try {
    const [users, trips, stops, activities, expenses] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS c FROM users'),
      pool.query('SELECT COUNT(*)::int AS c FROM trips'),
      pool.query('SELECT COUNT(*)::int AS c FROM stops'),
      pool.query('SELECT COUNT(*)::int AS c FROM activities'),
      pool.query('SELECT COALESCE(SUM(amount),0)::float AS s FROM expenses'),
    ]);
    return res.json({
      users: users.rows[0].c,
      trips: trips.rows[0].c,
      stops: stops.rows[0].c,
      activities: activities.rows[0].c,
      totalExpenses: expenses.rows[0].s,
    });
  } catch (e) { console.error('GET /admin/analytics', e); return res.status(500).json({ error: 'Server error' }); }
});

export default router;
