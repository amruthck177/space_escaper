require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase, run, get, all } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Dynamic CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || '*';
const allowedOrigins = corsOrigin === '*' ? '*' : corsOrigin.split(',').map(o => o.trim());

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request parser middleware
app.use(express.json());

// Handle malformed JSON request payloads gracefully
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload.' });
  }
  next(err);
});

// Log incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Helper validation function
function isValidUsername(username) {
  if (typeof username !== 'string') return false;
  const trimmed = username.trim();
  // Safe alphanumeric callsigns, length 2 to 20
  return trimmed.length >= 2 && trimmed.length <= 20 && /^[a-zA-Z0-9_ -]+$/.test(trimmed);
}

// REST API Endpoints

// 1. POST /api/players — Create/register a player by username
app.post('/api/players', async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username || !isValidUsername(username)) {
      return res.status(400).json({
        error: 'Invalid username callsign. Must be 2-20 alphanumeric characters, spaces, dashes, or underscores.'
      });
    }

    const trimmedUsername = username.trim();

    // Check if player exists
    let player = await get('SELECT id, username, created_at FROM players WHERE username = ?', [trimmedUsername]);
    
    if (!player) {
      // Create new player record safely using parameterized query
      const result = await run('INSERT INTO players (username) VALUES (?)', [trimmedUsername]);
      player = {
        id: result.id,
        username: trimmedUsername,
        created_at: new Date().toISOString()
      };
      return res.status(201).json(player);
    }

    return res.status(200).json(player);
  } catch (error) {
    next(error);
  }
});

// 2. POST /api/scores — Submit a new score { username, score, difficulty }
app.post('/api/scores', async (req, res, next) => {
  try {
    const { username, score, difficulty } = req.body;

    // Validate score parameter
    const parsedScore = parseInt(score, 10);
    if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 10000000) {
      return res.status(400).json({ error: 'Score value must be a non-negative integer below 10,000,000.' });
    }

    // Validate difficulty parameter
    const diff = typeof difficulty === 'string' ? difficulty.toLowerCase().trim() : '';
    if (!['easy', 'normal', 'hard'].includes(diff)) {
      return res.status(400).json({ error: 'Difficulty must be easy, normal, or hard.' });
    }

    // Validate username parameter
    if (!username || !isValidUsername(username)) {
      return res.status(400).json({ error: 'Invalid username callsign.' });
    }

    const trimmedUsername = username.trim();

    // Ensure player exists
    let player = await get('SELECT id FROM players WHERE username = ?', [trimmedUsername]);
    let playerId;

    if (!player) {
      const result = await run('INSERT INTO players (username) VALUES (?)', [trimmedUsername]);
      playerId = result.id;
    } else {
      playerId = player.id;
    }

    // Insert score record using parameterized queries
    const scoreResult = await run(
      'INSERT INTO scores (player_id, score, difficulty) VALUES (?, ?, ?)',
      [playerId, parsedScore, diff]
    );

    return res.status(201).json({
      id: scoreResult.id,
      playerId,
      username: trimmedUsername,
      score: parsedScore,
      difficulty: diff,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// 3. GET /api/leaderboard — Return top 10 scores overall
app.get('/api/leaderboard', async (req, res, next) => {
  try {
    const sql = `
      SELECT s.id, p.username, s.score, s.difficulty, s.created_at
      FROM scores s
      JOIN players p ON s.player_id = p.id
      ORDER BY s.score DESC
      LIMIT 10
    `;
    const rows = await all(sql);
    return res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
});

// 4. GET /api/leaderboard/:difficulty — Return top 10 scores filtered by difficulty
app.get('/api/leaderboard/:difficulty', async (req, res, next) => {
  try {
    const diff = req.params.difficulty.toLowerCase().trim();
    if (!['easy', 'normal', 'hard'].includes(diff)) {
      return res.status(400).json({ error: 'Difficulty must be easy, normal, or hard.' });
    }

    const sql = `
      SELECT s.id, p.username, s.score, s.difficulty, s.created_at
      FROM scores s
      JOIN players p ON s.player_id = p.id
      WHERE s.difficulty = ?
      ORDER BY s.score DESC
      LIMIT 10
    `;
    const rows = await all(sql, [diff]);
    return res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
});

// 5. GET /api/players/:username/scores — Return player's personal history and personal best
app.get('/api/players/:username/scores', async (req, res, next) => {
  try {
    const username = req.params.username.trim();
    
    // Find player first
    const player = await get('SELECT id FROM players WHERE username = ?', [username]);
    if (!player) {
      return res.status(404).json({ error: 'Player callsign not found.' });
    }

    // Get score history
    const historySql = `
      SELECT id, score, difficulty, created_at
      FROM scores
      WHERE player_id = ?
      ORDER BY created_at DESC
    `;
    const history = await all(historySql, [player.id]);

    // Get personal best
    const bestSql = `
      SELECT score, difficulty, created_at
      FROM scores
      WHERE player_id = ?
      ORDER BY score DESC
      LIMIT 1
    `;
    const personalBest = await get(bestSql, [player.id]);

    return res.status(200).json({
      username,
      personalBest: personalBest || null,
      history
    });
  } catch (error) {
    next(error);
  }
});

// Serve frontend static bundles in production mode
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  
  // Non-API routes serve index.html as fallback for React SPA routing
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Centralized error-handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(res.headersSent ? 500 : (err.status || 500)).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message
  });
});

// Initialize database schema and bind server listener
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Space Escaper backend successfully listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database initialization crashed. Server not started.', err);
    process.exit(1);
  });
