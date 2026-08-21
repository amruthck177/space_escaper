import React from 'react';

const POWERUP_LIMITS = {
  shield: 8000,
  slowMo: 5000,
  multiplier: 8000,
  magnet: 6000
};

const POWERUP_NAMES = {
  shield: '🛡️ Shield',
  slowMo: '⏱️ Slow-Mo',
  multiplier: '2x Points',
  magnet: '🧲 Magnet'
};

const POWERUP_COLORS = {
  shield: '#10B981', // green
  slowMo: '#00F0FF', // sky blue
  multiplier: '#FFD700', // gold
  magnet: '#D946EF' // magenta
};

export default function HUD({ 
  score, 
  lives, 
  combo, 
  boostCooldown, 
  activePowerups,
  difficulty,
  onPauseToggle,
  isMuted,
  onMuteToggle
}) {
  
  // Render Hearts for Lives
  const renderLives = () => {
    const hearts = [];
    for (let i = 0; i < 3; i++) {
      hearts.push(
        <span 
          key={i} 
          style={{ 
            opacity: i < lives ? 1 : 0.25,
            color: i < lives ? 'var(--color-hard)' : 'var(--text-muted)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
            transform: i < lives ? 'scale(1)' : 'scale(0.8)',
            display: 'inline-block'
          }}
        >
          ❤️
        </span>
      );
    }
    return hearts;
  };

  return (
    <div className="hud-container">
      {/* Top Metrics Row */}
      <div className="hud-top">
        {/* Score & Combo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div className="hud-metric" style={{ color: `var(--color-${difficulty})` }}>
            SCORE: {score.toString().padStart(6, '0')}
          </div>
          {combo > 1 && (
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <span className="combo-badge">
                x{combo} COMBO
              </span>
            </div>
          )}
        </div>

        {/* Lives & Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
          <div className="lives-container">
            {renderLives()}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              className="mute-btn" 
              onClick={onMuteToggle}
              title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>

            <button 
              onClick={onPauseToggle}
              style={{
                pointerEvents: 'auto',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                borderRadius: '4px',
                padding: '0.2rem 0.6rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}
            >
              PAUSE (ESC)
            </button>
          </div>
        </div>
      </div>

      {/* Active Powerups (bottom left HUD overlay) */}
      <div className="powerups-bars">
        {activePowerups.map((pu) => {
          const limit = POWERUP_LIMITS[pu.type] || 5000;
          const percentage = Math.max(0, Math.min(100, (pu.time / limit) * 100));
          return (
            <div key={pu.type} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div className="flex-row" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                <span style={{ color: POWERUP_COLORS[pu.type] }}>{POWERUP_NAMES[pu.type]}</span>
                <span className="text-muted">{(pu.time / 1000).toFixed(1)}s</span>
              </div>
              <div className="powerup-progress-bar">
                <div 
                  className="powerup-progress-fill" 
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: POWERUP_COLORS[pu.type],
                    boxShadow: `0 0 8px ${POWERUP_COLORS[pu.type]}`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
