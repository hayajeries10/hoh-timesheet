const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/hoh_timesheet',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});
const JWT_SECRET = process.env.JWT_SECRET || 'hoh-timesheet-secret-2026';
const PORT = process.env.PORT || 3001;

// ── CORS ─────────────────────────────────────────────────
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (_, res) => res.json({ ok: true }));

// ── DATABASE SETUP ──────────────────────────────────────
async function setupDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'employee',
      created_at DATE DEFAULT CURRENT_DATE
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name  TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS birthdate  TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS picture    TEXT DEFAULT '';
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      event_date TEXT NOT NULL,
      event_type TEXT NOT NULL DEFAULT 'special',
      color TEXT DEFAULT '',
      description TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS entries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (user_id, date)
    );
  `);
}

// ── SEED DATA ────────────────────────────────────────────
async function seedDatabase() {
  const { rows } = await pool.query('SELECT COUNT(*) as c FROM users');
  if (parseInt(rows[0].c) > 0) return;

  console.log('Seeding database with initial data...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const adminHash = bcrypt.hashSync('HoH@Admin2026', 10);
    await client.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
      ['Admin', 'hayajeries10@gmail.com', adminHash, 'admin']
    );

    const empHash = bcrypt.hashSync('habits2026', 10);
    const employees = [
      { name: 'Haya',     email: 'haya@houseofhabits.nl' },
      { name: 'Caitilin', email: 'caitilin@houseofhabits.nl' },
      { name: 'Elmira',   email: 'elmira@houseofhabits.nl' },
      { name: 'Sanne',    email: 'sanne@houseofhabits.nl' },
      { name: 'Alba',     email: 'alba@houseofhabits.nl' },
      { name: 'Susana',   email: 'susana@houseofhabits.nl' },
      { name: 'Arthur',   email: 'arthur@houseofhabits.nl' },
      { name: 'Dani',     email: 'dani@houseofhabits.nl' },
    ];
    for (const e of employees) {
      await client.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
        [e.name, e.email, empHash, 'employee']
      );
    }

    const getUser = async (name) => {
      const r = await client.query('SELECT id FROM users WHERE name = $1', [name]);
      return r.rows[0];
    };

    const insertEntry = async (userId, date, start, end, duration) => {
      await client.query(
        'INSERT INTO entries (user_id, date, start_time, end_time, duration) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id, date) DO NOTHING',
        [userId, date, start, end, duration]
      );
    };

    // ── HAYA ──
    const haya = (await getUser('Haya')).id;
    for (const r of [
      ['2026-02-07','09:00','10:56',116], ['2026-02-10','08:45','12:20',215],
      ['2026-02-11','15:00','17:15',135], ['2026-02-12','07:50','11:40',230],
      ['2026-02-13','07:45','12:30',285], ['2026-02-17','07:45','12:00',255],
      ['2026-02-18','07:45','10:45',180], ['2026-02-19','07:45','12:00',255],
      ['2026-02-20','07:45','12:00',255], ['2026-02-23','07:45','13:10',325],
      ['2026-02-24','07:45','11:35',230], ['2026-02-26','07:45','11:10',205],
      ['2026-02-27','07:45','12:10',265], ['2026-03-02','07:45','13:10',325],
      ['2026-03-03','07:45','12:15',270], ['2026-03-04','07:45','11:00',195],
      ['2026-03-05','07:45','11:10',205], ['2026-03-06','07:45','12:00',255],
      ['2026-03-07','07:45','12:30',285], ['2026-03-09','07:45','12:30',285],
      ['2026-03-10','07:45','12:10',265], ['2026-03-11','07:45','12:50',305],
      ['2026-03-12','07:45','11:20',215], ['2026-03-13','07:45','12:25',280],
      ['2026-03-14','07:45','12:35',290], ['2026-03-16','07:45','13:10',325],
      ['2026-03-17','07:45','12:10',265], ['2026-03-18','07:45','11:50',245],
      ['2026-03-19','07:45','11:40',235], ['2026-03-20','07:45','12:30',285],
      ['2026-03-23','07:45','12:40',295], ['2026-03-24','07:45','12:10',265],
      ['2026-03-25','07:45','11:50',245], ['2026-03-26','07:45','12:00',255],
      ['2026-03-27','07:45','12:30',285], ['2026-03-30','07:45','13:10',325],
      ['2026-03-31','07:45','11:40',235], ['2026-04-01','07:45','11:15',210],
      ['2026-04-02','07:45','12:30',285],
    ]) await insertEntry(haya, ...r);

    // ── CAITILIN ──
    const caitilin = (await getUser('Caitilin')).id;
    for (const r of [
      ['2026-02-02','17:45','20:45',180], ['2026-02-04','16:00','20:35',275],
      ['2026-02-05','17:00','21:15',255], ['2026-02-06','07:40','12:40',300],
      ['2026-02-10','16:45','21:10',265], ['2026-02-11','15:00','20:30',330],
      ['2026-02-12','17:00','21:15',255], ['2026-02-17','16:45','21:15',270],
      ['2026-02-18','16:00','20:15',255], ['2026-02-19','17:00','21:22',262],
      ['2026-02-20','16:30','19:30',180], ['2026-02-22','08:00','12:05',245],
      ['2026-02-24','16:30','19:30',180], ['2026-02-25','16:30','20:37',247],
      ['2026-02-26','16:30','21:00',270], ['2026-03-03','16:30','21:15',285],
      ['2026-03-04','16:30','20:15',225], ['2026-03-05','16:30','21:15',285],
      ['2026-03-10','16:30','21:15',285], ['2026-03-11','16:30','20:20',230],
      ['2026-03-12','16:30','21:15',285], ['2026-03-13','16:30','19:30',180],
      ['2026-03-15','07:45','11:51',246], ['2026-03-18','16:30','20:15',225],
      ['2026-03-19','16:30','19:15',165], ['2026-03-24','16:35','21:15',280],
      ['2026-03-25','16:30','20:15',225], ['2026-03-26','16:30','21:15',285],
      ['2026-03-31','16:30','21:12',282], ['2026-04-01','16:30','21:20',290],
      ['2026-04-02','16:30','21:15',285], ['2026-04-07','16:30','21:15',285],
      ['2026-04-09','16:30','21:10',280], ['2026-04-10','16:30','19:30',180],
      ['2026-04-12','07:45','11:35',230], ['2026-04-14','16:30','20:56',266],
      ['2026-04-16','16:30','21:15',285], ['2026-04-17','16:30','19:10',160],
      ['2026-04-21','16:30','20:50',260],
    ]) await insertEntry(caitilin, ...r);

    // ── ELMIRA ──
    const elmira = (await getUser('Elmira')).id;
    for (const r of [
      ['2026-02-22','07:45','12:00',255], ['2026-02-23','16:30','21:00',270],
      ['2026-02-27','16:30','19:30',180], ['2026-03-01','07:45','11:30',225],
      ['2026-03-02','16:30','20:30',240], ['2026-03-06','16:30','19:30',180],
      ['2026-03-08','07:45','11:30',225], ['2026-03-09','16:30','20:30',240],
      ['2026-03-16','16:30','21:00',270], ['2026-03-17','16:30','21:15',285],
      ['2026-03-20','16:30','19:30',180], ['2026-03-22','07:45','11:30',225],
      ['2026-03-23','16:30','21:00',270], ['2026-03-27','16:30','19:30',180],
      ['2026-03-29','07:45','11:30',225], ['2026-03-30','16:30','20:30',240],
      ['2026-04-03','16:30','19:30',180], ['2026-04-08','16:30','20:30',240],
      ['2026-04-13','16:30','20:45',255], ['2026-04-15','16:30','21:00',270],
      ['2026-04-19','07:45','12:00',255], ['2026-04-20','16:30','20:00',210],
      ['2026-04-22','16:30','20:30',240],
    ]) await insertEntry(elmira, ...r);

    // ── SANNE ──
    const sanne = (await getUser('Sanne')).id;
    for (const r of [
      ['2026-02-21','08:30','12:30',240], ['2026-02-28','08:30','12:30',240],
      ['2026-03-21','08:30','12:30',240], ['2026-03-28','08:30','12:30',240],
      ['2026-04-11','08:30','12:30',240], ['2026-04-18','08:30','12:30',240],
      ['2026-05-02','08:30','12:30',240],
    ]) await insertEntry(sanne, ...r);

    // ── ALBA ──
    const alba = (await getUser('Alba')).id;
    for (const r of [
      ['2026-02-21','09:00','12:00',180], ['2026-02-22','09:00','11:00',120],
      ['2026-02-25','18:00','20:00',120], ['2026-02-27','17:00','19:00',120],
      ['2026-03-06','17:00','18:00', 60], ['2026-03-07','09:00','12:00',180],
      ['2026-03-13','17:00','19:00',120], ['2026-03-14','09:00','12:00',180],
      ['2026-03-20','18:00','19:00', 60], ['2026-03-21','09:00','12:00',180],
      ['2026-03-22','09:00','11:00',120], ['2026-03-27','18:00','19:00', 60],
      ['2026-03-28','09:00','12:00',180], ['2026-03-29','09:00','11:00',120],
      ['2026-04-04','09:00','12:00',180], ['2026-04-08','18:00','20:00',120],
      ['2026-04-10','17:00','18:00', 60], ['2026-04-11','09:00','12:00',180],
      ['2026-04-15','18:00','20:00',120], ['2026-04-17','17:00','18:00', 60],
      ['2026-04-18','09:00','12:00',180], ['2026-04-19','09:00','12:00',180],
      ['2026-04-22','18:00','20:00',120], ['2026-04-24','17:00','18:00', 60],
      ['2026-04-25','09:00','12:00',180],
    ]) await insertEntry(alba, ...r);

    // ── SUSANA ──
    const susana = (await getUser('Susana')).id;
    for (const r of [
      ['2026-03-27','11:00','12:00',60],
      ['2026-04-07','09:00','10:00',60],
      ['2026-04-14','09:00','10:00',60],
    ]) await insertEntry(susana, ...r);

    // ── ARTHUR ── (no entries yet)

    // ── DANI ──
    const dani = (await getUser('Dani')).id;
    for (const r of [
      ['2026-03-25','17:00','21:00',240], ['2026-03-26','18:30','20:30',120],
      ['2026-03-30','18:00','21:00',180], ['2026-03-31','19:00','21:00',120],
      ['2026-04-01','17:00','20:00',180], ['2026-04-06','10:00','14:00',240],
      ['2026-04-08','17:00','21:00',240], ['2026-04-09','19:00','21:00',120],
      ['2026-04-12','08:00','12:00',240], ['2026-04-13','18:00','21:00',180],
      ['2026-04-15','17:00','21:00',240], ['2026-04-19','08:00','12:00',240],
      ['2026-04-22','17:00','21:00',240],
    ]) await insertEntry(dani, ...r);

    await client.query('COMMIT');
    console.log('Database seeded successfully.');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// ── AUTH MIDDLEWARE ──────────────────────────────────────
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

// ── AUTH ROUTES ──────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'No account found with this email.' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Incorrect password.' });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role, birthdate: user.birthdate, picture: user.picture } });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.put('/api/auth/password', auth, async (req, res) => {
  try {
    const { current, newPassword } = req.body;
    if (!current || !newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Invalid input' });
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!bcrypt.compareSync(current, rows[0].password)) return res.status(401).json({ error: 'Current password is incorrect.' });
    const hash = bcrypt.hashSync(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/profile', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, first_name, last_name, email, role, birthdate, picture FROM users WHERE id = $1', [req.user.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.put('/api/profile', auth, async (req, res) => {
  try {
    const { first_name, last_name, birthdate, picture } = req.body;
    const name = [first_name, last_name].filter(Boolean).join(' ') || req.user.name;
    await pool.query(
      'UPDATE users SET first_name=$1, last_name=$2, name=$3, birthdate=$4, picture=$5 WHERE id=$6',
      [first_name || '', last_name || '', name, birthdate || '', picture || '', req.user.id]
    );
    res.json({ ok: true, name });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ── ENTRY ROUTES ─────────────────────────────────────────
app.get('/api/entries', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM entries WHERE user_id = $1 ORDER BY date ASC', [req.user.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/entries', auth, async (req, res) => {
  try {
    const { date, start_time, end_time, duration } = req.body;
    if (!date || !start_time || !end_time || !duration) return res.status(400).json({ error: 'Missing fields' });
    const { rows } = await pool.query(
      'INSERT INTO entries (user_id, date, start_time, end_time, duration) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, date, start_time, end_time, duration]
    );
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'An entry already exists for this date.' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/entries/:id', auth, async (req, res) => {
  try {
    const { date, start_time, end_time, duration } = req.body;
    const check = await pool.query('SELECT * FROM entries WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!check.rows[0]) return res.status(404).json({ error: 'Not found' });
    const { rows } = await pool.query(
      'UPDATE entries SET date=$1, start_time=$2, end_time=$3, duration=$4 WHERE id=$5 RETURNING *',
      [date, start_time, end_time, duration, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'An entry already exists for this date.' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/entries/:id', auth, async (req, res) => {
  try {
    const check = await pool.query('SELECT * FROM entries WHERE id = $1', [req.params.id]);
    if (!check.rows[0]) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'admin' && check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await pool.query('DELETE FROM entries WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ── ADMIN ROUTES ─────────────────────────────────────────
app.get('/api/admin/users', auth, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, first_name, last_name, email, role, birthdate, picture, TO_CHAR(created_at, 'YYYY-MM-DD') as created_at FROM users WHERE role != 'admin' ORDER BY name"
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/admin/users', auth, adminOnly, async (req, res) => {
  try {
    const { first_name, last_name, email, password, role, birthdate, picture } = req.body;
    if (!first_name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    const name = [first_name, last_name].filter(Boolean).join(' ');
    const hash = bcrypt.hashSync(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (name, first_name, last_name, email, password, role, birthdate, picture) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, name, first_name, last_name, email, role',
      [name, first_name, last_name || '', email.toLowerCase().trim(), hash, role || 'employee', birthdate || '', picture || '']
    );
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Email already exists.' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const { first_name, last_name, email, role, password, birthdate, picture } = req.body;
    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Not found' });
    const u = existing.rows[0];
    const fn = first_name !== undefined ? first_name : u.first_name;
    const ln = last_name  !== undefined ? last_name  : u.last_name;
    const name = [fn, ln].filter(Boolean).join(' ') || u.name;
    const newPass = password ? bcrypt.hashSync(password, 10) : u.password;
    await pool.query(
      'UPDATE users SET name=$1, first_name=$2, last_name=$3, email=$4, role=$5, password=$6, birthdate=$7, picture=$8 WHERE id=$9',
      [name, fn, ln, email ? email.toLowerCase().trim() : u.email, role || u.role, newPass, birthdate !== undefined ? birthdate : u.birthdate, picture !== undefined ? picture : u.picture, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Email already exists.' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/admin/entries/:userId', auth, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM entries WHERE user_id = $1 ORDER BY date ASC', [req.params.userId]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.put('/api/admin/entries/:id', auth, adminOnly, async (req, res) => {
  try {
    const { date, start_time, end_time, duration } = req.body;
    const { rows } = await pool.query(
      'UPDATE entries SET date=$1, start_time=$2, end_time=$3, duration=$4 WHERE id=$5 RETURNING *',
      [date, start_time, end_time, duration, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'An entry already exists for this date.' });
    res.status(500).json({ error: 'Server error' });
  }
});

// ── EVENTS ───────────────────────────────────────────────
app.get('/api/events', auth, async (req, res) => {
  try {
    const from = req.query.from || '2020-01-01';
    const to   = req.query.to   || '2030-12-31';
    const { rows: events } = await pool.query(
      'SELECT * FROM events WHERE event_date >= $1 AND event_date <= $2 ORDER BY event_date',
      [from, to]
    );
    // Attach birthday events from users
    const { rows: users } = await pool.query(
      "SELECT name, first_name, birthdate FROM users WHERE birthdate IS NOT NULL AND birthdate != '' AND role != 'admin'"
    );
    const fromYear = parseInt(from.split('-')[0]);
    const toYear   = parseInt(to.split('-')[0]);
    const bdays = [];
    for (const u of users) {
      if (!u.birthdate) continue;
      const [, mm, dd] = u.birthdate.split('-');
      const displayName = u.first_name || u.name;
      for (let y = fromYear; y <= toYear + 1; y++) {
        const d = `${y}-${mm}-${dd}`;
        if (d >= from && d <= to) bdays.push({ id: `bday-${u.name}-${y}`, title: `${displayName}'s Birthday`, event_date: d, event_type: 'birthday', color: '#7c3aed', description: '' });
      }
    }
    const all = [...events, ...bdays].sort((a, b) => a.event_date.localeCompare(b.event_date));
    res.json(all);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/events', auth, adminOnly, async (req, res) => {
  try {
    const { title, event_date, event_type, color, description } = req.body;
    if (!title || !event_date) return res.status(400).json({ error: 'Title and date required' });
    const { rows } = await pool.query(
      'INSERT INTO events (title, event_date, event_type, color, description) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [title, event_date, event_type || 'special', color || '', description || '']
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.put('/api/events/:id', auth, adminOnly, async (req, res) => {
  try {
    const { title, event_date, event_type, color, description } = req.body;
    const { rows } = await pool.query(
      'UPDATE events SET title=$1, event_date=$2, event_type=$3, color=$4, description=$5 WHERE id=$6 RETURNING *',
      [title, event_date, event_type || 'special', color || '', description || '', req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.delete('/api/events/:id', auth, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Serve SPA for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── START ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏠 House of Habits Timesheet running at http://localhost:${PORT}\n`);
  setupDatabase()
    .then(() => seedDatabase())
    .then(() => {
      console.log('   Admin:    hayajeries10@gmail.com / HoH@Admin2026');
      console.log('   Employees default password: habits2026\n');
    })
    .catch(e => console.error('DB setup error:', e.message));
});
