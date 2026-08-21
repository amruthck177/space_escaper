const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Resolve database path from environment variable
const rawDbPath = process.env.DATABASE_PATH || 'database.sqlite';
const dbPath = path.isAbsolute(rawDbPath) ? rawDbPath : path.resolve(__dirname, rawDbPath);

// Ensure target directory folder structure exists recursively
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to the SQLite database at:', dbPath);
  }
});


// Run a query and return a Promise
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

// Get a single row and return a Promise
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Get all rows and return a Promise
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Initialize tables
async function initDatabase() {
  try {
    // Enable foreign keys
    await run('PRAGMA foreign_keys = ON;');

    // Players table
    await run(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Scores table
    await run(`
      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        difficulty TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE
      )
    `);

    // Check if database needs seeding (e.g. no players exist)
    const row = await get('SELECT COUNT(*) as count FROM players');
    if (row && row.count === 0) {
      console.log('Seeding initial arcade scores...');
      const seedPlayers = [
        { username: 'CosmicRanger', scores: [{ score: 2450, diff: 'hard' }, { score: 1800, diff: 'normal' }] },
        { username: 'StarFighter', scores: [{ score: 3200, diff: 'hard' }, { score: 4100, diff: 'hard' }] },
        { username: 'AsteroidDodger', scores: [{ score: 1200, diff: 'easy' }, { score: 1950, diff: 'normal' }] },
        { username: 'GalaxyQuest', scores: [{ score: 850, diff: 'easy' }] },
        { username: 'NebulaNova', scores: [{ score: 2900, diff: 'normal' }] }
      ];

      for (const p of seedPlayers) {
        const result = await run('INSERT INTO players (username) VALUES (?)', [p.username]);
        const playerId = result.id;
        for (const s of p.scores) {
          await run('INSERT INTO scores (player_id, score, difficulty) VALUES (?, ?, ?)', [
            playerId,
            s.score,
            s.diff
          ]);
        }
      }
      console.log('Seeding complete.');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

module.exports = {
  db,
  initDatabase,
  run,
  get,
  all
};
