const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'timesheet.db');
const db = new DatabaseSync(DB_PATH);
const JWT_SECRET = process.env.JWT_SECRET || 'hoh-timesheet-secret-2026';
const PORT = process.env.PORT || 3001;

// ── CORS ─────────────────────────────────────────────────
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',').map(s => s.trim()).filter(Boolean)
    .concat(['http://localhost:3001', 'http://localhost:3000']);
  if (!origin || allowed.includes(origin) || allowed.includes('*')) {
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (_, res) => res.json({ ok: true }));

// ── DATABASE SETUP ──────────────────────────────────────
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee',
    created_at TEXT DEFAULT (date('now'))
  );
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, date)
  );
`);

// ── SEED DATA ────────────────────────────────────────────
function seedDatabase() {
  const existing = db.prepare('SELECT COUNT(*) as c FROM users').get();
  if (existing.c > 0) return;

  console.log('Seeding database with initial data...');

  const adminHash = bcrypt.hashSync('HoH@Admin2026', 10);
  db.prepare('INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Admin', 'hayajeries10@gmail.com', adminHash, 'admin');

  const empHash = bcrypt.hashSync('habits2026', 10);
  const insertUser = db.prepare('INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
  const insertEntry = db.prepare('INSERT OR IGNORE INTO entries (user_id, date, start_time, end_time, duration) VALUES (?, ?, ?, ?, ?)');

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
  employees.forEach(e => insertUser.run(e.name, e.email, empHash, 'employee'));

  const getUser = name => db.prepare('SELECT id FROM users WHERE name = ?').get(name);

  const seedEntries = () => {
    db.exec('BEGIN');
    // ── HAYA ──
    const haya = getUser('Haya').id;
    [
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
    ].forEach(r => insertEntry.run(haya, ...r));

    // ── CAITILIN ──
    const caitilin = getUser('Caitilin').id;
    [
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
    ].forEach(r => insertEntry.run(caitilin, ...r));

    // ── ELMIRA ──
    const elmira = getUser('Elmira').id;
    [
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
    ].forEach(r => insertEntry.run(elmira, ...r));

    // ── SANNE ──
    const sanne = getUser('Sanne').id;
    [
      ['2026-02-21','08:30','12:30',240], ['2026-02-28','08:30','12:30',240],
      ['2026-03-21','08:30','12:30',240], ['2026-03-28','08:30','12:30',240],
      ['2026-04-11','08:30','12:30',240], ['2026-04-18','08:30','12:30',240],
      ['2026-05-02','08:30','12:30',240],
    ].forEach(r => insertEntry.run(sanne, ...r));

    // ── ALBA ──
    const alba = getUser('Alba').id;
    [
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
    ].forEach(r => insertEntry.run(alba, ...r));

    // ── SUSANA ──
    const susana = getUser('Susana').id;
    [
      ['2026-03-27','11:00','12:00',60],
      ['2026-04-07','09:00','10:00',60],
      ['2026-04-14','09:00','10:00',60],
    ].forEach(r => insertEntry.run(susana, ...r));

    // ── ARTHUR ── (no entries yet)

    // ── DANI ──
    const dani = getUser('Dani').id;
    [
      ['2026-03-25','17:00','21:00',240], ['2026-03-26','18:30','20:30',120],
      ['2026-03-30','18:00','21:00',180], ['2026-03-31','19:00','21:00',120],
      ['2026-04-01','17:00','20:00',180], ['2026-04-06','10:00','14:00',240],
      ['2026-04-08','17:00','21:00',240], ['2026-04-09','19:00','21:00',120],
      ['2026-04-12','08:00','12:00',240], ['2026-04-13','18:00','21:00',180],
      ['2026-04-15','17:00','21:00',240], ['2026-04-19','08:00','12:00',240],
      ['2026-04-22','17:00','21:00',240],
    ].forEach(r => insertEntry.run(dani, ...r));
    db.exec('COMMIT');
  };

  try { seedEntries(); } catch(e) { db.exec('ROLLBACK'); throw e; }
  console.log('Database seeded successfully.');
}

seedDatabase();

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
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'No account found with this email.' });
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Incorrect password.' });
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.put('/api/auth/password', auth, (req, res) => {
  const { current, newPassword } = req.body;
  if (!current || !newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Invalid input' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(current, user.password)) return res.status(401).json({ error: 'Current password is incorrect.' });
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.user.id);
  res.json({ ok: true });
});

// ── ENTRY ROUTES (employee) ──────────────────────────────
app.get('/api/entries', auth, (req, res) => {
  const entries = db.prepare('SELECT * FROM entries WHERE user_id = ? ORDER BY date ASC').all(req.user.id);
  res.json(entries);
});

app.post('/api/entries', auth, (req, res) => {
  const { date, start_time, end_time, duration } = req.body;
  if (!date || !start_time || !end_time || !duration) return res.status(400).json({ error: 'Missing fields' });
  try {
    const r = db.prepare('INSERT INTO entries (user_id, date, start_time, end_time, duration) VALUES (?, ?, ?, ?, ?)').run(req.user.id, date, start_time, end_time, duration);
    res.json(db.prepare('SELECT * FROM entries WHERE id = ?').get(r.lastInsertRowid));
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'An entry already exists for this date.' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/entries/:id', auth, (req, res) => {
  const { date, start_time, end_time, duration } = req.body;
  const entry = db.prepare('SELECT * FROM entries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!entry) return res.status(404).json({ error: 'Not found' });
  try {
    db.prepare('UPDATE entries SET date=?, start_time=?, end_time=?, duration=? WHERE id=?').run(date, start_time, end_time, duration, req.params.id);
    res.json(db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id));
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'An entry already exists for this date.' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/entries/:id', auth, (req, res) => {
  const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Not found' });
  // Admin can delete any entry; employee only their own
  if (req.user.role !== 'admin' && entry.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM entries WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ── ADMIN ROUTES ─────────────────────────────────────────
app.get('/api/admin/users', auth, adminOnly, (req, res) => {
  const users = db.prepare("SELECT id, name, email, role, created_at FROM users WHERE role != 'admin' ORDER BY name").all();
  res.json(users);
});

app.post('/api/admin/users', auth, adminOnly, (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const r = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(name, email.toLowerCase().trim(), hash, role || 'employee');
    res.json({ id: r.lastInsertRowid, name, email, role: role || 'employee' });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists.' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/users/:id', auth, adminOnly, (req, res) => {
  const { name, email, role, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const newEmail = email ? email.toLowerCase().trim() : user.email;
  const newPass = password ? bcrypt.hashSync(password, 10) : user.password;
  db.prepare('UPDATE users SET name=?, email=?, role=?, password=? WHERE id=?').run(name || user.name, newEmail, role || user.role, newPass, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/admin/users/:id', auth, adminOnly, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/admin/entries/:userId', auth, adminOnly, (req, res) => {
  const entries = db.prepare('SELECT * FROM entries WHERE user_id = ? ORDER BY date ASC').all(req.params.userId);
  res.json(entries);
});

app.put('/api/admin/entries/:id', auth, adminOnly, (req, res) => {
  const { date, start_time, end_time, duration } = req.body;
  try {
    db.prepare('UPDATE entries SET date=?, start_time=?, end_time=?, duration=? WHERE id=?').run(date, start_time, end_time, duration, req.params.id);
    res.json(db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id));
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'An entry already exists for this date.' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve the SPA for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🏠 House of Habits Timesheet running at http://localhost:${PORT}\n`);
  console.log(`   Admin login: hayajeries10@gmail.com`);
  console.log(`   Admin password: HoH@Admin2026`);
  console.log(`   Employee default password: habits2026\n`);
});
