import React, { useRef, useEffect, useState } from 'react';
import { GameEngine } from '../utils/gameEngine';
import HUD from './HUD';
import audio from '../utils/audio';

export default function GameCanvas({ 
  username, 
  difficulty, 
  colorblind, 
  onGameOver, 
  onPauseToggle, 
  isPaused,
  isMuted,
  onMuteToggle,
  onHapticTrigger
}) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  
  // Game states for HUD
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [boostCooldown, setBoostCooldown] = useState(0);
  const [activePowerups, setActivePowerups] = useState([]);
  
  // Detect touch device to show mobile UI
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(hasTouch);
    };
    checkTouch();
  }, []);

  // Initialize Game Engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, {
      username,
      difficulty,
      colorblind,
      onGameOver: (finalScore) => {
        onGameOver(finalScore);
      },
      onScoreUpdate: (newScore) => setScore(newScore),
      onComboUpdate: (newCombo) => setCombo(newCombo),
      onLivesUpdate: (newLives) => setLives(newLives),
      onBoostCooldownUpdate: (cd) => setBoostCooldown(cd),
      onActivePowerupsUpdate: (powerups) => setActivePowerups(powerups),
      onHapticTrigger: onHapticTrigger || (() => {})
    });

    engineRef.current = engine;
    engine.start();

    // Resume AudioContext on any screen touch/gesture
    const resumeAudio = () => {
      if (audio && audio.ctx && audio.ctx.state === 'suspended') {
        audio.ctx.resume();
      }
    };
    window.addEventListener('pointerdown', resumeAudio);
    window.addEventListener('touchstart', resumeAudio);

    // Cleanup
    return () => {
      window.removeEventListener('pointerdown', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, [username, difficulty, colorblind]);

  // Canvas direct touch-drag handlers to move spaceship
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleCanvasTouchStart = (e) => {
      if (!engineRef.current || e.touches.length === 0) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches[0].clientX;
      engineRef.current.setTouchPosition(clientX, rect);
    };

    const handleCanvasTouchMove = (e) => {
      if (!engineRef.current || e.touches.length === 0) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches[0].clientX;
      engineRef.current.setTouchPosition(clientX, rect);
    };

    const handleCanvasTouchEnd = (e) => {
      if (!engineRef.current) return;
      engineRef.current.stopTouch();
    };

    canvas.addEventListener('touchstart', handleCanvasTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleCanvasTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleCanvasTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleCanvasTouchStart);
      canvas.removeEventListener('touchmove', handleCanvasTouchMove);
      canvas.removeEventListener('touchend', handleCanvasTouchEnd);
    };
  }, []);

  // Handle outside pauses (e.g. from parent overlay)
  useEffect(() => {
    if (!engineRef.current) return;
    
    if (isPaused && !engineRef.current.isPaused) {
      engineRef.current.togglePause();
    } else if (!isPaused && engineRef.current.isPaused) {
      engineRef.current.togglePause();
    }
  }, [isPaused]);

  // Touch handlers for screen DPAD
  const handleTouchStart = (dir) => {
    if (!engineRef.current) return;
    engineRef.current.keys[dir] = true;
  };

  const handleTouchEnd = (dir) => {
    if (!engineRef.current) return;
    engineRef.current.keys[dir] = false;
  };

  const handleMobileFireStart = () => {
    if (!engineRef.current) return;
    engineRef.current.keys['Space'] = true;
  };

  const handleMobileFireEnd = () => {
    if (!engineRef.current) return;
    engineRef.current.keys['Space'] = false;
  };

  const handleMobileBoost = () => {
    if (!engineRef.current) return;
    engineRef.current.triggerBoost();
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Canvas */}
      <canvas 
        ref={canvasRef} 
        style={{ 
          display: 'block', 
          width: '100%', 
          height: '100%',
          backgroundColor: '#000',
          touchAction: 'none' 
        }} 
      />

      {/* HUD overlay */}
      <HUD
        score={score}
        lives={lives}
        combo={combo}
        boostCooldown={boostCooldown}
        activePowerups={activePowerups}
        difficulty={difficulty}
        onPauseToggle={onPauseToggle}
        isMuted={isMuted}
        onMuteToggle={onMuteToggle}
      />

      {/* Mobile controls (Only shown on touch devices) */}
      {isTouchDevice && (
        <div className="mobile-controls">
          {/* Left / Right Buttons */}
          <div className="mobile-dpad">
            <button 
              className="mobile-btn" 
              onPointerDown={(e) => { e.preventDefault(); handleTouchStart('ArrowLeft'); }}
              onPointerUp={(e) => { e.preventDefault(); handleTouchEnd('ArrowLeft'); }}
              onPointerLeave={(e) => { e.preventDefault(); handleTouchEnd('ArrowLeft'); }}
              style={{ userSelect: 'none', touchAction: 'none' }}
            >
              ◀️
            </button>
            <button 
              className="mobile-btn" 
              onPointerDown={(e) => { e.preventDefault(); handleTouchStart('ArrowRight'); }}
              onPointerUp={(e) => { e.preventDefault(); handleTouchEnd('ArrowRight'); }}
              onPointerLeave={(e) => { e.preventDefault(); handleTouchEnd('ArrowRight'); }}
              style={{ userSelect: 'none', touchAction: 'none' }}
            >
              ▶️
            </button>
          </div>

          {/* Action Buttons: Boost & Fire */}
          <div className="mobile-actions">
            <button 
              className="mobile-btn boost" 
              onPointerDown={(e) => { e.preventDefault(); handleMobileBoost(); }}
              disabled={boostCooldown > 0}
              style={{ 
                userSelect: 'none',
                touchAction: 'none',
                opacity: boostCooldown > 0 ? 0.4 : 1
              }}
            >
              ⚡
            </button>
            <button 
              className="mobile-btn fire" 
              onPointerDown={(e) => { e.preventDefault(); handleMobileFireStart(); }}
              onPointerUp={(e) => { e.preventDefault(); handleMobileFireEnd(); }}
              onPointerLeave={(e) => { e.preventDefault(); handleMobileFireEnd(); }}
              style={{ userSelect: 'none', touchAction: 'none' }}
            >
              🔥
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

