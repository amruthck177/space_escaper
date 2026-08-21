import React, { useState, useEffect } from 'react';
import StartScreen from './components/StartScreen';
import GameCanvas from './components/GameCanvas';
import GameOverScreen from './components/GameOverScreen';
import Leaderboards from './components/Leaderboards';
import Settings from './components/Settings';
import audio from './utils/audio';
import { api } from './services/api';

export default function App() {
  const [screen, setScreen] = useState('START'); // START, GAME, GAMEOVER, LEADERBOARD, SETTINGS
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('space_escaper_username') || 'Pilot';
  });
  const [difficulty, setDifficulty] = useState('normal');
  const [finalScore, setFinalScore] = useState(0);

  // Settings states
  const [colorblind, setColorblind] = useState(() => {
    return localStorage.getItem('space_escaper_colorblind') === 'true';
  });
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('space_escaper_volume');
    return saved !== null ? parseFloat(saved) : 0.5;
  });
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('space_escaper_muted') === 'true';
  });
  const [isPaused, setIsPaused] = useState(false);

  // Synchronize audio engine with react states on initial mount
  useEffect(() => {
    audio.setVolume(volume);
    audio.setMute(isMuted);
    
    // Attempt registration to backend on startup if pilot exists
    if (username && username !== 'Pilot') {
      api.registerPlayer(username).catch(() => {});
    }
  }, []);

  // Save values to localStorage on change
  useEffect(() => {
    localStorage.setItem('space_escaper_colorblind', colorblind);
  }, [colorblind]);

  const handleVolumeChange = (vol) => {
    setVolume(vol);
    localStorage.setItem('space_escaper_volume', vol);
    audio.setVolume(vol);
  };

  const handleMuteToggle = () => {
    const newVal = !isMuted;
    setIsMuted(newVal);
    localStorage.setItem('space_escaper_muted', newVal);
    audio.setMute(newVal);
  };

  const handleColorblindToggle = () => {
    setColorblind(!colorblind);
  };

  const handleUsernameChange = (newName) => {
    setUsername(newName);
    localStorage.setItem('space_escaper_username', newName);
    api.registerPlayer(newName).catch(() => {});
  };

  const handleStartGame = (selectedDiff) => {
    setDifficulty(selectedDiff);
    setIsPaused(false);
    setScreen('GAME');
  };

  const handleGameOver = (score) => {
    setFinalScore(score);
    setScreen('GAMEOVER');
  };

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
  };

  const triggerNativeHaptic = (effect) => {
    if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'HAPTIC', effect }));
    }
  };

  return (
    <div className={`app-container ${colorblind ? 'colorblind-theme' : ''}`}>
      <div className="game-wrapper">
        {/* Game Canvas Screen */}
        {screen === 'GAME' && (
          <GameCanvas
            username={username}
            difficulty={difficulty}
            colorblind={colorblind}
            isPaused={isPaused}
            onPauseToggle={handlePauseToggle}
            onGameOver={handleGameOver}
            isMuted={isMuted}
            onMuteToggle={handleMuteToggle}
            onHapticTrigger={triggerNativeHaptic}
          />
        )}


        {/* Start Screen */}
        {screen === 'START' && (
          <StartScreen
            defaultUsername={username}
            onUsernameChange={handleUsernameChange}
            onStartGame={handleStartGame}
            onViewLeaderboard={() => setScreen('LEADERBOARD')}
            onViewSettings={() => setScreen('SETTINGS')}
          />
        )}

        {/* Game Over Screen */}
        {screen === 'GAMEOVER' && (
          <GameOverScreen
            score={finalScore}
            difficulty={difficulty}
            username={username}
            onRestart={() => handleStartGame(difficulty)}
            onMainMenu={() => setScreen('START')}
          />
        )}

        {/* Leaderboards Screen */}
        {screen === 'LEADERBOARD' && (
          <Leaderboards
            currentUsername={username}
            onBack={() => setScreen('START')}
          />
        )}

        {/* Settings Screen */}
        {screen === 'SETTINGS' && (
          <Settings
            volume={volume}
            onVolumeChange={handleVolumeChange}
            isMuted={isMuted}
            onMuteToggle={handleMuteToggle}
            colorblind={colorblind}
            onColorblindToggle={handleColorblindToggle}
            onBack={() => setScreen('START')}
          />
        )}

        {/* Pause Overlay (Only visible when active in game) */}
        {screen === 'GAME' && isPaused && (
          <div className="overlay-screen" style={{ background: 'rgba(4, 1, 10, 0.75)' }}>
            <div className="glass-card" style={{ maxWidth: '340px' }}>
              <h2 className="neon-title" style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--accent-cyan)' }}>
                GAME PAUSED
              </h2>
              
              <div className="flex-col" style={{ gap: '1rem' }}>
                <button 
                  className="neon-button" 
                  onClick={handlePauseToggle}
                  style={{ borderColor: 'var(--accent-cyan)' }}
                >
                  RESUME GAME
                </button>
                <button 
                  className="neon-button" 
                  onClick={() => {
                    audio.stopMusic();
                    setScreen('START');
                  }}
                  style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                >
                  QUIT TO MENU
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
