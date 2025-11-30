import React, { useState, useEffect } from 'react';
import GameEngine from './components/GameEngine';
import MainMenu from './components/MainMenu';
import MissionBriefing from './components/MissionBriefing';
import { Users, User, Target, Zap } from 'lucide-react';
import { GameMode, WeaponType } from './types';
import { CAMPAIGN_WAVES, ENEMIES_TO_CLEAR_WAVE } from './constants';
import { audioService } from './services/audioService';

enum AppState {
  MENU,
  BRIEFING,
  PLAYING,
  LEVEL_COMPLETE,
  GAME_OVER,
  VICTORY
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.MENU);
  const [playerCount, setPlayerCount] = useState<1 | 2>(1);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.CAMPAIGN);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('neon_thunder_hs');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const handleStartGame = (players: 1 | 2, mode: GameMode) => {
    setPlayerCount(players);
    setGameMode(mode);
    setWave(1);
    setScore(0);
    setAppState(AppState.BRIEFING);
    audioService.startBGM(); // Start music on user interaction
  };

  const handleBriefingComplete = () => {
    setAppState(AppState.PLAYING);
  };

  const handleLevelComplete = (finalScore: number) => {
    setScore(finalScore);
    
    if (gameMode === GameMode.CAMPAIGN) {
        if (wave >= CAMPAIGN_WAVES) {
            // Campaign Won
            if (finalScore > highScore) {
                setHighScore(finalScore);
                localStorage.setItem('neon_thunder_hs', finalScore.toString());
            }
            setAppState(AppState.VICTORY);
            audioService.stopBGM();
        } else {
            // Next Level
            setAppState(AppState.LEVEL_COMPLETE);
            setTimeout(() => {
                setWave(w => w + 1);
                setAppState(AppState.BRIEFING);
            }, 2000);
        }
    } else {
        // Endless Mode
        setWave(w => w + 1);
        setAppState(AppState.BRIEFING);
    }
  };

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('neon_thunder_hs', finalScore.toString());
    }
    setAppState(AppState.GAME_OVER);
    audioService.stopBGM();
  };

  const handleRestart = () => {
    setAppState(AppState.MENU);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 font-sans select-none">
      
      {/* Game Layer */}
      {appState === AppState.PLAYING && (
        <>
          <GameEngine 
            mode={gameMode}
            playerCount={playerCount} 
            onGameOver={handleGameOver}
            onLevelComplete={handleLevelComplete}
            wave={wave}
          />
          
          {/* HUD Overlay */}
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
               <div className="flex items-center gap-2 text-cyan-400 font-bold text-xl drop-shadow-md">
                 <User className="w-5 h-5" />
                 <span>P1</span>
               </div>
               {playerCount === 2 && (
                 <div className="flex items-center gap-2 text-fuchsia-400 font-bold text-xl drop-shadow-md">
                   <Users className="w-5 h-5" />
                   <span>P2</span>
                 </div>
               )}
            </div>

            <div className="flex flex-col items-center">
              <div className="text-white font-mono text-3xl font-bold tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                {score.toLocaleString().padStart(6, '0')}
              </div>
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-xs text-slate-400 uppercase tracking-widest">
                     {gameMode === GameMode.CAMPAIGN ? `LEVEL ${wave}/${CAMPAIGN_WAVES}` : `WAVE ${wave}`}
                 </span>
                 {gameMode === GameMode.CAMPAIGN && (
                     <span className="text-xs text-slate-500 border px-1 rounded border-slate-700">TARGET: {ENEMIES_TO_CLEAR_WAVE} KILLS</span>
                 )}
              </div>
            </div>
            
            <div className="w-20"></div> {/* Spacer for balance */}
          </div>
        </>
      )}

      {/* Menu Layer */}
      {appState === AppState.MENU && (
        <MainMenu onStart={handleStartGame} highScore={highScore} />
      )}

      {/* Briefing Layer */}
      {appState === AppState.BRIEFING && (
        <MissionBriefing wave={wave} onReady={handleBriefingComplete} />
      )}
      
      {/* Level Complete Transition */}
      {appState === AppState.LEVEL_COMPLETE && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-in fade-in zoom-in duration-300">
             <h2 className="text-6xl font-black text-green-500 mb-4 tracking-tighter italic">SECTOR CLEARED</h2>
             <div className="text-cyan-400 text-xl font-mono">Preparing Hyperspace Jump...</div>
        </div>
      )}

      {/* Victory */}
      {appState === AppState.VICTORY && (
        <div className="absolute inset-0 bg-cyan-900/90 flex flex-col items-center justify-center z-50 animate-in fade-in duration-1000">
             <Target className="w-24 h-24 text-yellow-400 mb-6 animate-bounce" />
             <h2 className="text-6xl font-black text-white mb-4 tracking-tighter">CAMPAIGN COMPLETE</h2>
             <div className="text-cyan-200 text-2xl font-mono mb-8">GALAXY SECURE. FINAL SCORE: {score.toLocaleString()}</div>
             <button 
               onClick={handleRestart}
               className="px-8 py-3 bg-white text-black font-bold text-xl hover:bg-slate-200 rounded-full transition-colors"
             >
               MAIN MENU
             </button>
        </div>
      )}

      {/* Game Over Layer */}
      {appState === AppState.GAME_OVER && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-in fade-in duration-500">
           <h2 className="text-6xl font-black text-red-500 mb-4 tracking-tighter">MISSION FAILED</h2>
           <div className="text-white text-2xl font-mono mb-8">FINAL SCORE: {score.toLocaleString()}</div>
           <button 
             onClick={handleRestart}
             className="px-8 py-3 bg-white text-black font-bold text-xl hover:bg-slate-200 rounded-full transition-colors"
           >
             RETURN TO BASE
           </button>
        </div>
      )}
    </div>
  );
};

export default App;