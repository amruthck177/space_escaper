const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Fallback LocalStorage scoring helpers
const LOCAL_STORAGE_KEY = 'space_escaper_local_scores';

function getLocalScores(difficulty = null) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const scores = raw ? JSON.parse(raw) : [];
    
    // Sort scores descending
    const sorted = scores.sort((a, b) => b.score - a.score);
    
    if (difficulty) {
      return sorted.filter(s => s.difficulty === difficulty).slice(0, 10);
    }
    return sorted.slice(0, 10);
  } catch (err) {
    console.error('Error loading local scores:', err);
    return [];
  }
}

function saveLocalScore(username, score, difficulty) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const scores = raw ? JSON.parse(raw) : [];
    
    const newScore = {
      id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      username: username.trim(),
      score: parseInt(score, 10),
      difficulty: difficulty.toLowerCase(),
      created_at: new Date().toISOString()
    };
    
    scores.push(newScore);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scores));
    return newScore;
  } catch (err) {
    console.error('Error saving local score:', err);
    return null;
  }
}

function getLocalPlayerStats(username) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const scores = raw ? JSON.parse(raw) : [];
    
    const playerScores = scores.filter(s => s.username.toLowerCase() === username.toLowerCase());
    const sorted = playerScores.sort((a, b) => b.score - a.score);
    
    return {
      username,
      personalBest: sorted[0] || null,
      history: playerScores.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    };
  } catch (err) {
    console.error('Error loading local player stats:', err);
    return { username, personalBest: null, history: [] };
  }
}

// REST API and fallback logic
export const api = {
  /**
   * Registers a player username.
   */
  async registerPlayer(username) {
    try {
      const response = await fetch(`${API_BASE_URL}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to register player');
      }
      return await response.json();
    } catch (error) {
      console.warn('Backend registerPlayer failed. Playing in offline mode.', error.message);
      // For offline mode, just return player structure
      return { username: username.trim(), isOffline: true };
    }
  },

  /**
   * Submits a score.
   */
  async submitScore(username, score, difficulty) {
    try {
      const response = await fetch(`${API_BASE_URL}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, score, difficulty })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to submit score');
      }
      return await response.json();
    } catch (error) {
      console.warn('Backend submitScore failed. Saving score locally.', error.message);
      const saved = saveLocalScore(username, score, difficulty);
      return { ...saved, isOffline: true };
    }
  },

  /**
   * Gets the top 10 leaderboard scores.
   */
  async getLeaderboard(difficulty = null) {
    try {
      const url = difficulty 
        ? `${API_BASE_URL}/leaderboard/${difficulty}` 
        : `${API_BASE_URL}/leaderboard`;
        
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Leaderboard response was not ok');
      }
      return await response.json();
    } catch (error) {
      console.warn('Backend getLeaderboard failed. Fetching local leaderboard.', error.message);
      return getLocalScores(difficulty);
    }
  },

  /**
   * Gets a player's history and personal best.
   */
  async getPlayerScores(username) {
    try {
      const response = await fetch(`${API_BASE_URL}/players/${encodeURIComponent(username.trim())}/scores`);
      if (!response.ok) {
        throw new Error('Failed to fetch player scores');
      }
      return await response.json();
    } catch (error) {
      console.warn('Backend getPlayerScores failed. Loading local player stats.', error.message);
      return getLocalPlayerStats(username);
    }
  }
};
