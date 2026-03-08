// // // const sqlite3 = require('sqlite3').verbose();
// // // const path = require('path');

// // // const dbPath = path.join(__dirname, 'ctf_database.sqlite');
// // // const db = new sqlite3.Database(dbPath, (err) => {
// // //     if (err) console.error('Error opening database:', err.message);
// // //     else {
// // //         console.log('Connected to the SQLite database.');
// // //         db.serialize(() => {
// // //             db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT DEFAULT 'player', status TEXT DEFAULT 'offline')`);
// // //             db.run(`CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, total_points INTEGER DEFAULT 0, FOREIGN KEY(user_id) REFERENCES users(id))`);
// // //             db.run(`CREATE TABLE IF NOT EXISTS config (id INTEGER PRIMARY KEY, comp_started INTEGER DEFAULT 0, start_time TEXT)`);
// // //             db.run("INSERT OR IGNORE INTO config (id, comp_started) VALUES (1, 0)");
// // //             db.run(`CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY AUTOINCREMENT, level TEXT NOT NULL, topic TEXT, question_text TEXT NOT NULL, flag TEXT NOT NULL, base_points INTEGER NOT NULL, file_url TEXT)`);
// // //             db.run(`CREATE TABLE IF NOT EXISTS level_starts (user_id INTEGER, level TEXT, start_time TEXT, PRIMARY KEY(user_id, level))`);
// // //             db.run(`CREATE TABLE IF NOT EXISTS solved (user_id INTEGER, question_id INTEGER, points_earned INTEGER, solved_at TEXT, PRIMARY KEY(user_id, question_id))`);
// // //             db.run(`CREATE TABLE IF NOT EXISTS home_content (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, image_url TEXT, text_position TEXT DEFAULT 'after', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
// // //         });
// // //     }
// // // });
// // // module.exports = db;


// // const sqlite3 = require('sqlite3').verbose();
// // const path = require('path');
// // const fs = require('fs');

// // // Glitch Protection: Ensure the hidden .data directory exists
// // const dataDir = path.join(__dirname, '.data');
// // if (!fs.existsSync(dataDir)) {
// //     fs.mkdirSync(dataDir);
// // }

// // // Point the database to the protected folder
// // const dbPath = path.join(dataDir, 'ctf_database.sqlite');
// // const db = new sqlite3.Database(dbPath, (err) => {
// //     if (err) console.error('Error opening database:', err.message);
// //     else {
// //         console.log('Connected to the protected SQLite database.');
// //         db.serialize(() => {
// //             db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT DEFAULT 'player', status TEXT DEFAULT 'offline')`);
// //             db.run(`CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, total_points INTEGER DEFAULT 0, FOREIGN KEY(user_id) REFERENCES users(id))`);
// //             db.run(`CREATE TABLE IF NOT EXISTS config (id INTEGER PRIMARY KEY, comp_started INTEGER DEFAULT 0, start_time TEXT)`);
// //             db.run("INSERT OR IGNORE INTO config (id, comp_started) VALUES (1, 0)");
// //             db.run(`CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY AUTOINCREMENT, level TEXT NOT NULL, topic TEXT, question_text TEXT NOT NULL, flag TEXT NOT NULL, base_points INTEGER NOT NULL, file_url TEXT)`);
// //             db.run(`CREATE TABLE IF NOT EXISTS level_starts (user_id INTEGER, level TEXT, start_time TEXT, PRIMARY KEY(user_id, level))`);
// //             db.run(`CREATE TABLE IF NOT EXISTS solved (user_id INTEGER, question_id INTEGER, points_earned INTEGER, solved_at TEXT, PRIMARY KEY(user_id, question_id))`);
// //             db.run(`CREATE TABLE IF NOT EXISTS home_content (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, image_url TEXT, text_position TEXT DEFAULT 'after', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
// //         });
// //     }
// // });
// // module.exports = db;

// const sqlite3 = require('sqlite3').verbose();
// const path = require('path');
// const fs = require('fs');

// const dataDir = path.join(__dirname, '.data');
// if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

// const dbPath = path.join(dataDir, 'ctf_database.sqlite');
// const db = new sqlite3.Database(dbPath, (err) => {
//     if (err) console.error('Error opening database:', err.message);
//     else {
//         console.log('Connected to the SQLite database.');
//         db.serialize(() => {
//             // Added last_active for accurate Online/Offline tracking
//             db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT DEFAULT 'player', last_active INTEGER DEFAULT 0)`);
//             db.run(`CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, total_points INTEGER DEFAULT 0, FOREIGN KEY(user_id) REFERENCES users(id))`);
//             // Added scoreboard_visible toggle
//             db.run(`CREATE TABLE IF NOT EXISTS config (id INTEGER PRIMARY KEY, comp_started INTEGER DEFAULT 0, start_time TEXT, scoreboard_visible INTEGER DEFAULT 1)`);
//             db.run("INSERT OR IGNORE INTO config (id, comp_started, scoreboard_visible) VALUES (1, 0, 1)");
//             db.run(`CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY AUTOINCREMENT, level TEXT NOT NULL, topic TEXT, question_text TEXT NOT NULL, flag TEXT NOT NULL, base_points INTEGER NOT NULL, file_url TEXT)`);
//             db.run(`CREATE TABLE IF NOT EXISTS level_starts (user_id INTEGER, level TEXT, start_time TEXT, PRIMARY KEY(user_id, level))`);
//             db.run(`CREATE TABLE IF NOT EXISTS solved (user_id INTEGER, question_id INTEGER, points_earned INTEGER, solved_at TEXT, PRIMARY KEY(user_id, question_id))`);
//             db.run(`CREATE TABLE IF NOT EXISTS home_content (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, image_url TEXT, text_position TEXT DEFAULT 'after', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
//         });
//     }
// });
// module.exports = db;


const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Normal database path directly in your project folder
const dbPath = path.join(__dirname, 'ctf_database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error opening database:', err.message);
    else {
        console.log('Connected to the SQLite database.');
        db.serialize(() => {
            // Includes last_active for accurate Online/Offline tracking
            db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT DEFAULT 'player', last_active INTEGER DEFAULT 0)`);
            db.run(`CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, total_points INTEGER DEFAULT 0, FOREIGN KEY(user_id) REFERENCES users(id))`);
            // Includes scoreboard_visible toggle
            db.run(`CREATE TABLE IF NOT EXISTS config (id INTEGER PRIMARY KEY, comp_started INTEGER DEFAULT 0, start_time TEXT, scoreboard_visible INTEGER DEFAULT 1)`);
            db.run("INSERT OR IGNORE INTO config (id, comp_started, scoreboard_visible) VALUES (1, 0, 1)");
            db.run(`CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY AUTOINCREMENT, level TEXT NOT NULL, topic TEXT, question_text TEXT NOT NULL, flag TEXT NOT NULL, base_points INTEGER NOT NULL, file_url TEXT)`);
            db.run(`CREATE TABLE IF NOT EXISTS level_starts (user_id INTEGER, level TEXT, start_time TEXT, PRIMARY KEY(user_id, level))`);
            db.run(`CREATE TABLE IF NOT EXISTS solved (user_id INTEGER, question_id INTEGER, points_earned INTEGER, solved_at TEXT, PRIMARY KEY(user_id, question_id))`);
            db.run(`CREATE TABLE IF NOT EXISTS home_content (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, image_url TEXT, text_position TEXT DEFAULT 'after', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        });
    }
});

module.exports = db;