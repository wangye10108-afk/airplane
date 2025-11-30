import React, { useState } from 'react';
import { Rocket, Users, Trophy, Crosshair, Infinity } from 'lucide-react';
import { GameMode } from '../types';

interface MainMenuProps {
  onStart: (players: 1 | 2, mode: GameMode) => void;
  highScore: number;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart, highScore }) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.CAMPAIGN);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-50 text-white p-6">
      <div className="text-center mb-10">
        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
          NEON<br />THUNDER
        </h1>
        <p className="mt-4 text-slate-400 tracking-widest text-sm md:text-base">HYPER SPACE SUPERIORITY</p>
      </div>

      {/* Mode Selection */}
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setSelectedMode(GameMode.CAMPAIGN)}
          className={`px-6 py-3 rounded-lg border flex items-center gap-2 transition-all ${selectedMode === GameMode.CAMPAIGN ? 'bg-cyan-900/50 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
        >
          <Crosshair className="w-5 h-5" />
          <span className="font-bold">CAMPAIGN</span>
        </button>
        <button 
          onClick={() => setSelectedMode(GameMode.ENDLESS)}
          className={`px-6 py-3 rounded-lg border flex items-center gap-2 transition-all ${selectedMode === GameMode.ENDLESS ? 'bg-purple-900/50 border-purple-500 text-purple-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
        >
          <Infinity className="w-5 h-5" />
          <span className="font-bold">ENDLESS</span>
        </button>
      </div>

      <div className="grid gap-4 w-full max-w-md">
        <button
          onClick={() => onStart(1, selectedMode)}
          className="group relative flex items-center justify-center gap-4 bg-slate-800 hover:bg-cyan-900/50 border border-slate-700 hover:border-cyan-500 p-6 rounded-xl transition-all duration-300 transform hover:scale-105"
        >
          <div className="absolute inset-0 bg-cyan-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <Rocket className="w-8 h-8 text-cyan-400" />
          <div className="text-left">
            <div className="text-xl font-bold text-white">SOLO MISSION</div>
            <div className="text-xs text-slate-400">Deploy single fighter</div>
          </div>
        </button>

        <button
          onClick={() => onStart(2, selectedMode)}
          className="group relative flex items-center justify-center gap-4 bg-slate-800 hover:bg-purple-900/50 border border-slate-700 hover:border-purple-500 p-6 rounded-xl transition-all duration-300 transform hover:scale-105"
        >
          <div className="absolute inset-0 bg-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <Users className="w-8 h-8 text-purple-400" />
          <div className="text-left">
            <div className="text-xl font-bold text-white">CO-OP SQUADRON</div>
            <div className="text-xs text-slate-400">Local multiplayer</div>
          </div>
        </button>
      </div>

      <div className="mt-12 flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-6 py-3 rounded-full border border-yellow-400/20">
        <Trophy className="w-5 h-5" />
        <span className="font-mono font-bold">HIGH SCORE: {highScore.toLocaleString()}</span>
      </div>

      <div className="absolute bottom-8 text-slate-600 text-xs text-center max-w-xs">
        <p>Pick up S (Scatter) and L (Laser) powerups!</p>
      </div>
    </div>
  );
};

export default MainMenu;