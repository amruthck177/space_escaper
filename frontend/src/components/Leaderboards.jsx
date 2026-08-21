import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function Leaderboards({ onBack, currentUsername }) {
  const [activeTab, setActiveTab] = useState('overall');
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchName, setSearchName] = useState(currentUsername || '');
  const [personalStats, setPersonalStats] = useState(null);
  const [personalLoading, setPersonalLoading] = useState(false);

  // Fetch global leaderboard when tab changes
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await api.getLeaderboard(activeTab === 'overall' ? null : activeTab);
        setLeaderboard(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [activeTab]);

  // Fetch player stats
  useEffect(() => {
    if (searchName.trim()) {
      handleSearchPersonal();
    }
  }, []);

  const handleSearchPersonal = async (e) => {
    if (e) e.preventDefault();
    if (!searchName.trim()) return;

    setPersonalLoading(true);
    try {
      const stats = await api.getPlayerScores(searchName.trim());
      setPersonalStats(stats);
    } catch (err) {
      console.error(err);
      setPersonalStats(null);
    } finally {
      setPersonalLoading(false);
    }
  };

  return (
    <div className="overlay-screen">
      <div className="glass-card" style={{ maxWidth: '560px', width: '100%' }}>
        <h1 className="neon-title">🏆 GALACTIC LEADERBOARDS</h1>
        
        {/* Tab Selection */}
        <div className="leaderboard-tabs" style={{ marginBottom: '1.2rem' }}>
          <button 
            className={`tab-btn ${activeTab === 'overall' ? 'active' : ''}`}
            onClick={() => setActiveTab('overall')}
          >
            Overall
          </button>
          <button 
            className={`tab-btn ${activeTab === 'easy' ? 'active' : ''}`}
            onClick={() => setActiveTab('easy')}
          >
            Easy
          </button>
          <button 
            className={`tab-btn ${activeTab === 'normal' ? 'active' : ''}`}
            onClick={() => setActiveTab('normal')}
          >
            Normal
          </button>
          <button 
            className={`tab-btn ${activeTab === 'hard' ? 'active' : ''}`}
            onClick={() => setActiveTab('hard')}
          >
            Hard
          </button>
        </div>

        {/* Global Rankings List */}
        <div style={{ minHeight: '180px', maxHeight: '250px', overflowY: 'auto', marginBottom: '1.5rem' }}>
          {isLoading ? (
            <div className="text-muted" style={{ padding: '2rem' }}>LOADING RANKINGS...</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-muted" style={{ padding: '2rem' }}>NO RECORDS ON THIS SECTOR</div>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>Rank</th>
                  <th>Pilot</th>
                  <th style={{ textAlign: 'right' }}>Score</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Diff</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, idx) => (
                  <tr key={row.id || idx}>
                    <td>
                      <span className={`rank-badge ${idx < 3 ? `rank-${idx + 1}` : 'rank-other'}`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: 'bold' }}>{row.username}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                      {row.score}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`diff-badge ${row.difficulty}`}>{row.difficulty}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Personal Pilot Lookup */}
        <div 
          style={{ 
            borderTop: '1px solid rgba(255, 255, 255, 0.08)', 
            paddingTop: '1.2rem',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}
        >
          <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-normal)', marginBottom: '0.6rem' }}>
            SEARCH PILOT STATS
          </h3>
          <form onSubmit={handleSearchPersonal} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
            <input 
              type="text" 
              className="neon-input" 
              value={searchName} 
              onChange={(e) => setSearchName(e.target.value)} 
              placeholder="Enter pilot username..."
              style={{ marginBottom: 0, padding: '0.5rem 0.8rem', fontSize: '0.95rem', flex: 1, textAlign: 'left' }}
            />
            <button type="submit" className="neon-button" style={{ padding: '0.5rem 1rem', fontSize: '0.95rem' }}>
              Search
            </button>
          </form>

          {personalLoading ? (
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>Accessing pilot records...</div>
          ) : personalStats ? (
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}>
              <div className="flex-row" style={{ marginBottom: '0.4rem' }}>
                <strong>{personalStats.username}</strong>
                <span>
                  Best: <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                    {personalStats.personalBest ? personalStats.personalBest.score : 'N/A'}
                  </strong>
                  {personalStats.personalBest && (
                    <span style={{ marginLeft: '4px' }} className={`diff-badge ${personalStats.personalBest.difficulty}`}>
                      {personalStats.personalBest.difficulty}
                    </span>
                  )}
                </span>
              </div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                Total games recorded: {personalStats.history.length}
              </div>
            </div>
          ) : searchName.trim() ? (
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>No data found for this callsign.</div>
          ) : null}
        </div>

        <button 
          className="neon-button" 
          onClick={onBack}
          style={{ width: '100%', borderColor: 'rgba(255,255,255,0.2)' }}
        >
          RETURN TO MAIN MENU
        </button>
      </div>
    </div>
  );
}
