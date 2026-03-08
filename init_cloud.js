const { createClient } = require("@libsql/client");

const db = createClient({
  url: "libsql://sngce-ctf-db-jagath-krishna1070.aws-ap-south-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzI5NDYzMjcsImlkIjoiMDE5Y2M4YWUtYTUwMS03YzA4LWIwOGEtYzE5NDI0N2VlYzA3IiwicmlkIjoiYjBkMzY1Y2YtZWZhMS00Zjc0LTkzMjYtNzU4MDIxNmUzZTAwIn0.pixAnDbc-sx3As30QjUvXPESKMEX7Az1v6YNgud9tIFZZPRce98Vl86uhZ5QG9WQoO-8VTr2z7kn_rqOAhBvAw",
});

async function run() {
  console.log("Building Turso Cloud Database Tables...");
  try {
    await db.batch([
      `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password TEXT, role TEXT, last_active INTEGER)`,
      `CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, total_points INTEGER)`,
      `CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY AUTOINCREMENT, level TEXT, topic TEXT, question_text TEXT, flag TEXT, base_points INTEGER, file_url TEXT)`,
      `CREATE TABLE IF NOT EXISTS solved (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, question_id INTEGER, points_earned INTEGER, solved_at TEXT)`,
      `CREATE TABLE IF NOT EXISTS level_starts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, level TEXT, start_time TEXT)`,
      `CREATE TABLE IF NOT EXISTS home_content (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, image_url TEXT, text_position TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS config (id INTEGER PRIMARY KEY, comp_started INTEGER DEFAULT 0, start_time TEXT, scoreboard_visible INTEGER DEFAULT 1)`,
      `INSERT OR IGNORE INTO config (id, comp_started, scoreboard_visible) VALUES (1, 0, 1)`
    ], "write");
    console.log("Success! Your cloud database is ready.");
  } catch (e) {
    console.error("Error building tables:", e);
  }
}
run();