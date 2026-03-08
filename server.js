const express = require('express');
const cookieSession = require('cookie-session'); // Swapped to cloud-safe sessions
const path = require('path');
const bcrypt = require('bcryptjs'); 
const multer = require('multer'); 
const { createClient } = require("@libsql/client");
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// CLOUDINARY CONFIG
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ddjavs1ty',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { folder: 'sngce_ctf_assets', resource_type: 'auto' },
});
const upload = multer({ storage: storage });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CLOUD-SAFE SESSION CONFIGURATION (Fixes the random logouts/Unauthorized errors)
app.use(cookieSession({
    name: 'ctf_session',
    keys: ['sngce_super_secret_ctf_key_2026'],
    maxAge: 24 * 60 * 60 * 1000 // Logins stay active for 24 hours
}));

const requireLogin = (req, res, next) => { if (req.session.userId) next(); else res.redirect('/login'); };
const requireAdmin = (req, res, next) => { if (req.session.role === 'admin') next(); else res.send('Unauthorized'); };

app.get('/api/competition-status', async (req, res) => {
    try {
        if (req.session.userId && req.session.role !== 'admin') {
            await db.execute({sql: "UPDATE users SET last_active = ? WHERE id = ?", args: [Date.now(), req.session.userId]});
        }
        const conf = await db.execute("SELECT comp_started, scoreboard_visible FROM config WHERE id = 1");
        const questions = await db.execute("SELECT id FROM questions");
        res.json({ compStarted: conf.rows[0]?.comp_started || 0, questionCount: questions.rows.length, scoreboardVisible: conf.rows[0]?.scoreboard_visible || 1 });
    } catch (err) { res.status(500).send(err.message); }
});

app.get('/', async (req, res) => {
    try {
        const conf = await db.execute("SELECT * FROM config WHERE id = 1");
        const content = await db.execute("SELECT * FROM home_content ORDER BY created_at DESC");
        const scores = await db.execute("SELECT u.username, s.total_points FROM users u JOIN scores s ON u.id = s.user_id WHERE LOWER(u.role) != 'admin' ORDER BY s.total_points DESC");
        res.render('home', { scoreboard: scores.rows || [], content: content.rows || [], compStarted: conf.rows[0]?.comp_started || 0, scoreboardVisible: conf.rows[0]?.scoreboard_visible || 1 });
    } catch (err) { res.status(500).send(err.message); }
});

app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));

app.post('/register', async (req, res) => {
    try {
        const hash = await bcrypt.hash(req.body.password, 10);
        const userCount = await db.execute("SELECT COUNT(*) as count FROM users");
        const role = (userCount.rows[0].count === 0) ? 'admin' : 'player';
        const result = await db.execute({ sql: "INSERT INTO users (username, email, password, role, last_active) VALUES (?, ?, ?, ?, ?)", args: [req.body.username, req.body.email, hash, role, Date.now()] });
        await db.execute({ sql: "INSERT INTO scores (user_id, total_points) VALUES (?, 0)", args: [result.lastInsertRowid] });
        res.redirect('/login');
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/login', async (req, res) => {
    try {
        const result = await db.execute({sql: "SELECT * FROM users WHERE username = ?", args: [req.body.username]});
        const user = result.rows[0];
        if (user && await bcrypt.compare(req.body.password, user.password)) {
            req.session.userId = user.id; req.session.username = user.username; req.session.role = user.role;
            await db.execute({sql: "UPDATE users SET last_active = ? WHERE id = ?", args: [Date.now(), user.id]});
            res.redirect(user.role === 'admin' ? '/admin' : '/arena');
        } else res.send('Invalid login');
    } catch (err) { res.status(500).send(err.message); }
});

app.get('/logout', async (req, res) => {
    if(req.session.userId) await db.execute({sql: "UPDATE users SET last_active = 0 WHERE id = ?", args: [req.session.userId]});
    req.session = null; // Changed to match cookie-session format
    res.redirect('/');
});

app.get('/arena', requireLogin, async (req, res) => {
    if (req.session.role === 'admin') return res.redirect('/admin');
    try {
        const conf = await db.execute("SELECT * FROM config WHERE id = 1");
        const questions = await db.execute("SELECT * FROM questions");
        const solvedList = await db.execute({sql: "SELECT * FROM solved WHERE user_id = ?", args: [req.session.userId]});
        const starts = await db.execute({sql: "SELECT * FROM level_starts WHERE user_id = ?", args: [req.session.userId]});
        const myScore = await db.execute({sql: "SELECT * FROM scores WHERE user_id = ?", args: [req.session.userId]});
        const globalScores = await db.execute("SELECT u.username, s.total_points FROM users u JOIN scores s ON u.id = s.user_id WHERE LOWER(u.role) != 'admin' ORDER BY s.total_points DESC");
        const solvedIds = solvedList.rows.map(s => s.question_id);
        res.render('arena', { 
            username: req.session.username, compStarted: conf.rows[0]?.comp_started || 0, scoreboardVisible: conf.rows[0]?.scoreboard_visible || 1,
            questions: questions.rows || [], solved: solvedIds, easySolved: questions.rows.filter(q => q.level === 'easy' && solvedIds.includes(q.id)).length, 
            interSolved: questions.rows.filter(q => q.level === 'intermediate' && solvedIds.includes(q.id)).length, starts: starts.rows, score: myScore.rows[0] || { total_points: 0 }, scoreboard: globalScores.rows
        });
    } catch (err) { res.status(500).send(err.message); }
});

app.get('/admin', requireAdmin, async (req, res) => {
    try {
        const conf = await db.execute("SELECT * FROM config WHERE id = 1");
        const users = await db.execute("SELECT * FROM users ORDER BY role, username");
        const content = await db.execute("SELECT * FROM home_content ORDER BY created_at DESC");
        const questions = await db.execute("SELECT * FROM questions ORDER BY level ASC");
        res.render('admin', { users: users.rows, homeContent: content.rows, questions: questions.rows, compStarted: conf.rows[0]?.comp_started || 0, scoreboardVisible: conf.rows[0]?.scoreboard_visible || 1, currentTime: Date.now() });
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/admin/start-comp', requireAdmin, async (req, res) => { 
    await db.execute({sql: "INSERT INTO config (id, comp_started, scoreboard_visible) VALUES (1, 1, 1) ON CONFLICT(id) DO UPDATE SET comp_started = 1, start_time = ?", args: [new Date().toISOString()]});
    res.redirect('/admin'); 
});

app.post('/admin/stop-comp', requireAdmin, async (req, res) => { 
    await db.execute("INSERT INTO config (id, comp_started, scoreboard_visible) VALUES (1, 0, 1) ON CONFLICT(id) DO UPDATE SET comp_started = 0");
    res.redirect('/admin'); 
});

app.post('/admin/toggle-scoreboard', requireAdmin, async (req, res) => { 
    await db.execute("INSERT INTO config (id, comp_started, scoreboard_visible) VALUES (1, 0, 0) ON CONFLICT(id) DO UPDATE SET scoreboard_visible = CASE WHEN scoreboard_visible = 1 THEN 0 ELSE 1 END");
    res.redirect('/admin'); 
});

app.post('/admin/reset-comp', requireAdmin, async (req, res) => {
    await db.batch(["DELETE FROM solved", "DELETE FROM level_starts", "UPDATE scores SET total_points = 0", "UPDATE config SET comp_started = 0, start_time = NULL WHERE id = 1"], "write");
    res.redirect('/admin');
});

app.post('/admin/add-question', requireAdmin, upload.single('challenge_file'), async (req, res) => {
    const { level, topic, question_text, flag, base_points } = req.body;
    const fileUrl = req.file ? req.file.path : null;
    try {
        await db.execute({ sql: "INSERT INTO questions (level, topic, question_text, flag, base_points, file_url) VALUES (?, ?, ?, ?, ?, ?)", args: [level, topic, question_text, flag, base_points, fileUrl] });
        res.redirect('/admin');
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/admin/add-home-content', requireAdmin, upload.single('content_image'), async (req, res) => {
    const { title, description, text_position } = req.body;
    const imageUrl = req.file ? req.file.path : null;
    try {
        await db.execute({ sql: "INSERT INTO home_content (title, description, image_url, text_position) VALUES (?, ?, ?, ?)", args: [title, description, imageUrl, text_position] });
        res.redirect('/admin');
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/admin/delete-home-content', requireAdmin, async (req, res) => { await db.execute({sql: "DELETE FROM home_content WHERE id = ?", args: [req.body.content_id]}); res.redirect('/admin'); });
app.post('/admin/delete-question', requireAdmin, async (req, res) => { await db.batch([{sql: "DELETE FROM solved WHERE question_id = ?", args: [req.body.q_id]}, {sql: "DELETE FROM questions WHERE id = ?", args: [req.body.q_id]}], "write"); res.redirect('/admin'); });
app.post('/admin/delete-all-questions', requireAdmin, async (req, res) => { await db.batch(["DELETE FROM solved", "DELETE FROM questions"], "write"); res.redirect('/admin'); });
app.post('/admin/delete-user', requireAdmin, async (req, res) => { await db.batch([{sql: "DELETE FROM solved WHERE user_id = ?", args: [req.body.user_id]}, {sql: "DELETE FROM scores WHERE user_id = ?", args: [req.body.user_id]}, {sql: "DELETE FROM users WHERE id = ?", args: [req.body.user_id]}], "write"); res.redirect('/admin'); });

app.get('/admin/download-report', requireAdmin, async (req, res) => {
    const users = await db.execute("SELECT u.username, s.total_points, u.id FROM users u JOIN scores s ON u.id = s.user_id WHERE LOWER(u.role) != 'admin' ORDER BY s.total_points DESC");
    let csv = "Rank,Player Name,Total Score,Easy Level Start Time,Medium Level Start Time,Hard Level Start Time,Solved Challenges & Points\n";
    for (let i = 0; i < users.rows.length; i++) {
        const u = users.rows[i];
        const solves = await db.execute({sql: "SELECT q.topic, sol.points_earned FROM solved sol JOIN questions q ON sol.question_id = q.id WHERE sol.user_id = ?", args: [u.id]});
        const starts = await db.execute({sql: "SELECT level, start_time FROM level_starts WHERE user_id = ?", args: [u.id]});
        const getStart = (lvl) => { const row = starts.rows.find(s => s.level === lvl); return row ? new Date(row.start_time).toLocaleString() : 'Not Started'; };
        csv += `${i + 1},${u.username},${u.total_points || 0},"${getStart('easy')}","${getStart('intermediate')}","${getStart('hard')}","${solves.rows.map(r => `${r.topic} (${r.points_earned}pts)`).join(' | ')}"\n`;
    }
    res.header('Content-Type', 'text/csv').attachment('CTF_Professional_Report.csv').send(csv);
});

app.post('/start-level', requireLogin, async (req, res) => {
    const row = await db.execute({sql: "SELECT * FROM level_starts WHERE user_id = ? AND level = ?", args: [req.session.userId, req.body.level]});
    if (row.rows.length === 0) {
        const now = new Date().toISOString();
        await db.execute({sql: "INSERT INTO level_starts (user_id, level, start_time) VALUES (?, ?, ?)", args: [req.session.userId, req.body.level, now]});
        res.json({ success: true, firstTime: true, start_time: now });
    } else res.json({ success: true, firstTime: false, start_time: row.rows[0].start_time });
});

app.post('/check-flag', requireLogin, async (req, res) => {
    const { questionId, flag } = req.body;
    const qResult = await db.execute({sql: "SELECT * FROM questions WHERE id = ?", args: [questionId]});
    const q = qResult.rows[0];
    if (q && q.flag === flag) {
        const startResult = await db.execute({sql: "SELECT start_time FROM level_starts WHERE user_id = ? AND level = ?", args: [req.session.userId, q.level]});
        const startTime = startResult.rows[0] ? new Date(startResult.rows[0].start_time) : new Date();
        const points = Math.max(10, q.base_points - Math.floor((new Date() - startTime) / 300000));
        const solveResult = await db.execute({ sql: "INSERT OR IGNORE INTO solved (user_id, question_id, points_earned, solved_at) VALUES (?, ?, ?, ?)", args: [req.session.userId, questionId, points, new Date().toISOString()] });
        if (solveResult.rowsAffected > 0) {
            await db.execute({sql: "UPDATE scores SET total_points = total_points + ? WHERE user_id = ?", args: [points, req.session.userId]});
            res.json({ correct: true, points });
        } else res.json({ correct: true, alreadySolved: true });
    } else res.json({ correct: false });
});

app.listen(PORT, () => console.log(`Server at http://localhost:${PORT}`));