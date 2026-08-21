import React, { useState, useEffect } from 'react';

export default function StartScreen({ 
  onStartGame, 
  onViewLeaderboard, 
  onViewSettings,
  defaultUsername,
  onUsernameChange
}) {
  const [username, setUsername] = useState(defaultUsername || '');
  const [difficulty, setDifficulty] = useState('normal');

  useEffect(() => {
    setUsername(defaultUsername || '');
  }, [defaultUsername]);

  const handleStart = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    onUsernameChange(username.trim());
    onStartGame(difficulty);
  };

  return (
    <div className="overlay-screen">
      <div className="glass-card">
        <h1 className="neon-title">SPACE ESCAPER</h1>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>
          Dodge asteroids. Destroy bosses. Escape the deep void.
        </p>

        <form onSubmit={handleStart} className="flex-col">
          <div>
            <label 
              htmlFor="usernameInput"
              style={{ 
                display: 'block', 
                fontSize: '0.85rem', 
                fontWeight: 'bold', 
                textAlign: 'left',
                marginBottom: '0.4rem',
                color: 'var(--color-normal)' 
              }}
            >
              PILOT CALLSIGN
            </label>
            <input
              id="usernameInput"
              type="text"
              className="neon-input"
              placeholder="ENTER CALLSIGN..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label 
              style={{ 
                display: 'block', 
                fontSize: '0.85rem', 
                fontWeight: 'bold', 
                textAlign: 'left',
                marginBottom: '0.5rem',
                color: 'var(--color-normal)'
              }}
            >
              SECTOR DIFFICULTY
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                className={`neon-button easy ${difficulty === 'easy' ? 'active' : ''}`}
                style={{
                  background: difficulty === 'easy' ? 'var(--color-easy)' : 'transparent',
                  boxShadow: difficulty === 'easy' ? '0 0 15px var(--color-easy)' : 'none',
                  textShadow: difficulty === 'easy' ? '0 0 5px #fff' : 'none',
                  color: difficulty === 'easy' ? '#000' : '#fff'
                }}
                onClick={() => setDifficulty('easy')}
              >
                EASY
              </button>
              <button
                type="button"
                className={`neon-button normal ${difficulty === 'normal' ? 'active' : ''}`}
                style={{
                  background: difficulty === 'normal' ? 'var(--color-normal)' : 'transparent',
                  boxShadow: difficulty === 'normal' ? '0 0 15px var(--color-normal)' : 'none',
                  textShadow: difficulty === 'normal' ? '0 0 5px #fff' : 'none',
                  color: difficulty === 'normal' ? '#000' : '#fff'
                }}
                onClick={() => setDifficulty('normal')}
              >
                NORMAL
              </button>
              <button
                type="button"
                className={`neon-button hard ${difficulty === 'hard' ? 'active' : ''}`}
                style={{
                  background: difficulty === 'hard' ? 'var(--color-hard)' : 'transparent',
                  boxShadow: difficulty === 'hard' ? '0 0 15px var(--color-hard)' : 'none',
                  textShadow: difficulty === 'hard' ? '0 0 5px #fff' : 'none',
                  color: difficulty === 'hard' ? '#000' : '#fff'
                }}
                onClick={() => setDifficulty('hard')}
              >
                HARD
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="neon-button"
            disabled={!username.trim()}
            style={{
              padding: '1.2rem',
              fontSize: '1.3rem',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              borderColor: 'var(--accent-cyan)',
              color: '#fff',
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)',
              marginTop: '0.5rem'
            }}
          >
            LAUNCH MISSION 🚀
          </button>
        </form>

        <div 
          className="flex-row" 
          style={{ 
            marginTop: '2rem', 
            justifyContent: 'center', 
            gap: '1.5rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '1.2rem'
          }}
        >
          <button 
            onClick={onViewLeaderboard}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontSize: '0.85rem'
            }}
          >
            🏆 Leaderboards
          </button>
          <button 
            onClick={onViewSettings}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontSize: '0.85rem'
            }}
          >
            ⚙️ Settings
          </button>
        </div>
      </div>
    </div>
  );
}
