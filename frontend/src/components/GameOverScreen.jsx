import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function GameOverScreen({ 
  score, 
  difficulty, 
  username, 
  onRestart, 
  onMainMenu 
}) {
  const [submissionStatus, setSubmissionStatus] = useState('submitting'); // 'submitting', 'submitted', 'error'
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState(difficulty); // default to current difficulty
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);

  // Submit score on mount
  useEffect(() => {
    let active = true;
    
    async function submitAndFetch() {
      setSubmissionStatus('submitting');
      try {
        const result = await api.submitScore(username, score, difficulty);
        if (active) {
          setSubmissionStatus(result.isOffline ? 'offline' : 'submitted');
        }
      } catch (err) {
        console.error('Error submitting score:', err);
        if (active) {
          setSubmissionStatus('error');
        }
      }
      
      // Fetch leaderboard
      fetchLeaderboard(activeTab);
    }

    submitAndFetch();
    return () => { active = false; };
  }, [score, difficulty, username]);

  // Fetch leaderboard when tab changes
  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab]);

  const fetchLeaderboard = async (tab) => {
    setIsLoadingLeaderboard(true);
    try {
      // tab === 'overall' calls getLeaderboard(null)
      const data = await api.getLeaderboard(tab === 'overall' ? null : tab);
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to load leaderboard', err);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  return (
    <div className="overlay-screen">
      <div className="glass-card" style={{ maxWidth: '520px' }}>
        <h1 className="neon-title" style={{ color: 'var(--color-hard)', textShadow: '0 0 15px var(--color-hard)' }}>
          GAME OVER
        </h1>
        
        <p className="text-muted" style={{ marginBottom: '1.2rem' }}>
          Pilot <strong>{username}</strong>, your mission has ended.
        </p>

        {/* Player stats box */}
        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '1.5rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem'
          }}
        >
          <div>
            <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>FINAL SCORE</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 'bold', color: `var(--color-${difficulty})` }}>
              {score}
            </div>
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>SECTOR</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', marginTop: '4px', textTransform: 'uppercase' }}>
              <span className={`diff-badge ${difficulty}`}>{difficulty}</span>
            </div>
          </div>
        </div>

        {/* Submission notification status */}
        <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          {submissionStatus === 'submitting' && (
            <span style={{ color: 'var(--accent-cyan)' }}>📡 UPLOADING SCORE DATA...</span>
          )}
          {submissionStatus === 'submitted' && (
            <span style={{ color: 'var(--color-easy)' }}>✅ SCORE SYNCED TO GALACTIC LEADERBOARD</span>
          )}
          {submissionStatus === 'offline' && (
            <span style={{ color: 'var(--color-normal)' }}>💾 SCORE SECURED LOCALLY (OFFLINE MODE)</span>
          )}
          {submissionStatus === 'error' && (
            <span style={{ color: 'var(--color-hard)' }}>⚠️ TRANSMISSION FAILURE. SAVED LOCALLY.</span>
          )}
        </div>

        {/* Leaderboards Tabbed View */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.2rem' }}>
          <div className="leaderboard-tabs">
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

          {/* Table container */}
          <div style={{ minHeight: '200px', maxHeight: '280px', overflowY: 'auto' }}>
            {isLoadingLeaderboard ? (
              <div className="text-muted" style={{ padding: '2rem' }}>LOADING LEADERBOARD...</div>
            ) : leaderboard.length === 0 ? (
              <div className="text-muted" style={{ padding: '2rem' }}>NO SCORES REGISTERED YET</div>
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
                    <tr 
                      key={row.id || idx}
                      style={{
                        backgroundColor: row.username.toLowerCase() === username.toLowerCase() && row.score === score
                          ? 'rgba(0, 240, 255, 0.1)' 
                          : 'transparent'
                      }}
                    >
                      <td>
                        <span className={`rank-badge ${idx < 3 ? `rank-${idx + 1}` : 'rank-other'}`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td style={{ fontWeight: 'bold' }}>
                        {row.username}
                        {row.username.toLowerCase() === username.toLowerCase() && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', marginLeft: '4px' }}>(YOU)</span>
                        )}
                      </td>
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
        </div>

        {/* Actions Button */}
        <div className="flex-row" style={{ marginTop: '1.5rem', gap: '1rem' }}>
          <button 
            className="neon-button" 
            onClick={onMainMenu}
            style={{ flex: 1, borderColor: 'rgba(255,255,255,0.2)' }}
          >
            MAIN MENU
          </button>
          <button 
            className="neon-button" 
            onClick={onRestart}
            style={{ flex: 1, borderColor: 'var(--accent-cyan)', color: '#fff', boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)' }}
          >
            RESTART
          </button>
        </div>
      </div>
    </div>
  );
}
