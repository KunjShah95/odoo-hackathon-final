import express from 'express';
import pool from '../../db.js';

const router = express.Router();

// GET /calendar/trip/:publicKey.ics  (no auth) - export public trip as ICS
router.get('/trip/:publicKey.ics', async (req, res) => {
  try {
    const { publicKey } = req.params;
    const st = await pool.query('SELECT trip_id FROM shared_trips WHERE public_key=$1', [publicKey]);
    if (st.rowCount === 0) return res.status(404).send('Not found');
    const tripId = st.rows[0].trip_id;

    const tripR = await pool.query('SELECT * FROM trips WHERE id=$1', [tripId]);
    if (tripR.rowCount === 0) return res.status(404).send('Not found');
    const trip = tripR.rows[0];

    // stops (dates) & activities for event generation
    const stopsR = await pool.query('SELECT * FROM stops WHERE trip_id=$1 ORDER BY COALESCE(order_index,id)', [tripId]);
    const actsR = await pool.query(
      'SELECT a.*, s.city_name, s.start_date as stop_start, s.end_date as stop_end FROM activities a JOIN stops s ON a.stop_id=s.id WHERE s.trip_id=$1 ORDER BY a.id',
      [tripId]
    );

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//GlobeTrotter//EN',
      `X-WR-CALNAME:${escapeICS(trip.name)}`,
      `X-WR-TIMEZONE:UTC`
    ];

    // Represent each stop as an all-day event
    stopsR.rows.forEach(stop => {
      try {
        const sd = formatDateICS(stop.start_date, true);
        const ed = addOneDay(formatDateICS(stop.end_date, true));
        lines.push('BEGIN:VEVENT');
        lines.push(`UID:stop-${stop.id}@globetrotter`);
        lines.push(`DTSTAMP:${nowICS()}`);
        lines.push(`DTSTART;VALUE=DATE:${sd}`);
        lines.push(`DTEND;VALUE=DATE:${ed}`);
        lines.push(`SUMMARY:${escapeICS(stop.city_name)}`);
        lines.push(`DESCRIPTION:${escapeICS(stop.country_name || '')}`);
        lines.push('END:VEVENT');
      } catch(e) { /* ignore per-stop error */ }
    });

    // Each activity as timed (fallback to stop start date) single event
    actsR.rows.forEach(a => {
      try {
        const base = a.stop_start || trip.start_date;
        const dt = formatDateTimeICS(base);
        lines.push('BEGIN:VEVENT');
        lines.push(`UID:activity-${a.id}@globetrotter`);
        lines.push(`DTSTAMP:${nowICS()}`);
        lines.push(`DTSTART:${dt}`);
        lines.push(`DTEND:${dt}`); // no duration info; could extend with duration_minutes
        lines.push(`SUMMARY:${escapeICS(a.name)}`);
        const descParts = [];
        if (a.description) descParts.push(a.description);
        if (a.type) descParts.push(`Type: ${a.type}`);
        if (a.cost) descParts.push(`Cost: ${a.cost}`);
        lines.push(`DESCRIPTION:${escapeICS(descParts.join('\n'))}`);
        lines.push(`LOCATION:${escapeICS(a.city_name || '')}`);
        lines.push('END:VEVENT');
      } catch(e) { /* ignore per-activity error */ }
    });

    lines.push('END:VCALENDAR');
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="trip-${tripId}.ics"`);
    res.send(lines.join('\r\n'));
  } catch (err) {
    console.error('GET /calendar/trip/:publicKey.ics', err);
    res.status(500).send('Server error');
  }
});

function escapeICS(str='') {
  return String(str).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'').replace(/;/g,'');
}
function nowICS(){
  return new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z');
}
function formatDateTimeICS(d){
  return new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z');
}
function formatDateICS(d){
  const dt = new Date(d); return dt.toISOString().slice(0,10).replace(/-/g,'');
}
function addOneDay(yyyymmdd){
  const y = parseInt(yyyymmdd.slice(0,4));
  const m = parseInt(yyyymmdd.slice(4,6))-1;
  const d = parseInt(yyyymmdd.slice(6,8));
  const nd = new Date(Date.UTC(y,m,d+1));
  return nd.toISOString().slice(0,10).replace(/-/g,'');
}

export default router;
