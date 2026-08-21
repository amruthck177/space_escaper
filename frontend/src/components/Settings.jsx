import React from 'react';

export default function Settings({ 
  volume, 
  onVolumeChange, 
  isMuted, 
  onMuteToggle, 
  colorblind, 
  onColorblindToggle, 
  onBack 
}) {
  return (
    <div className="overlay-screen">
      <div className="glass-card" style={{ maxWidth: '440px' }}>
        <h1 className="neon-title">⚙️ SETTINGS</h1>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>
          Configure ship instruments and audio feedback.
        </p>

        <div className="flex-col" style={{ gap: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
          {/* Volume Control */}
          <div>
            <div className="flex-row" style={{ marginBottom: '0.4rem' }}>
              <span style={{ fontWeight: 'bold' }}>MASTER VOLUME</span>
              <span className="text-muted" style={{ fontFamily: 'var(--font-mono)' }}>
                {isMuted ? 'MUTED' : `${Math.round(volume * 100)}%`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                disabled={isMuted}
                style={{
                  flex: 1,
                  accentColor: 'var(--color-normal)',
                  cursor: 'pointer'
                }}
              />
              <button
                onClick={onMuteToggle}
                style={{
                  background: isMuted ? 'var(--color-hard)' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  padding: '0.3rem 0.8rem',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  width: '80px'
                }}
              >
                {isMuted ? 'UNMUTE' : 'MUTE'}
              </button>
            </div>
          </div>

          {/* Colorblind Toggle */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.2rem' }}>
            <div className="flex-row">
              <div>
                <span style={{ fontWeight: 'bold', display: 'block' }}>ACCESSIBILITY PALETTE</span>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                  Enable colorblind-friendly high-contrast layout.
                </span>
              </div>
              <button
                onClick={onColorblindToggle}
                style={{
                  background: colorblind ? 'var(--color-easy)' : 'transparent',
                  color: colorblind ? '#000' : '#fff',
                  border: '2px solid var(--color-easy)',
                  borderRadius: '6px',
                  padding: '0.4rem 1rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  boxShadow: colorblind ? '0 0 10px var(--color-easy)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {colorblind ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>

          {/* Gameplay Instructions */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.2rem' }}>
            <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>CONTROLS DIAGRAM</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.4rem', fontSize: '0.85rem' }}>
              <strong className="text-muted">A / D or ◀️ / ▶️</strong>
              <span>Move Left / Right</span>
              
              <strong className="text-muted">SPACEBAR</strong>
              <span>Fire Laser</span>
              
              <strong className="text-muted">SHIFT or Double-tap</strong>
              <span>Dash Boost (3s CD)</span>
              
              <strong className="text-muted">ESCAPE</strong>
              <span>Pause / Resume</span>
            </div>
          </div>
        </div>

        <button 
          className="neon-button" 
          onClick={onBack}
          style={{ width: '100%', borderColor: 'rgba(255,255,255,0.2)' }}
        >
          SAVE & RETURN
        </button>
      </div>
    </div>
  );
}
