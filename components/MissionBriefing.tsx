import React, { useEffect, useState } from 'react';
import { BriefingData } from '../types';
import { getMissionBriefing } from '../services/geminiService';
import { Terminal, ShieldAlert } from 'lucide-react';

interface MissionBriefingProps {
  wave: number;
  onReady: () => void;
}

const MissionBriefing: React.FC<MissionBriefingProps> = ({ wave, onReady }) => {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      // Small artificial delay for effect
      await new Promise(r => setTimeout(r, 800));
      const result = await getMissionBriefing(wave);
      if (mounted) {
        setData(result);
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [wave]);

  return (
    <div className="absolute inset-0 bg-black z-40 flex flex-col items-center justify-center p-8 font-mono">
      <div className="w-full max-w-2xl bg-slate-900 border border-green-500/50 p-1 rounded-sm shadow-[0_0_50px_rgba(34,197,94,0.1)]">
        <div className="bg-black border border-green-900/50 p-6 min-h-[300px] relative overflow-hidden">
          
          {/* Scanlines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none z-10 opacity-20"></div>

          <div className="flex items-center gap-2 mb-6 border-b border-green-800 pb-2">
            <Terminal className="w-5 h-5 text-green-500" />
            <h2 className="text-green-500 font-bold tracking-wider">INCOMING TRANSMISSION...</h2>
          </div>

          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-green-900/30 w-3/4"></div>
              <div className="h-4 bg-green-900/30 w-1/2"></div>
              <div className="h-4 bg-green-900/30 w-5/6"></div>
              <div className="mt-8 text-green-500 text-sm blink">DECRYPTING SIGNAL...</div>
            </div>
          ) : (
            <div className="space-y-6 text-green-400">
              <div>
                <span className="text-xs text-green-700 uppercase block mb-1">Operation</span>
                <h1 className="text-2xl font-bold text-white uppercase">{data?.title}</h1>
              </div>
              
              <div>
                <span className="text-xs text-green-700 uppercase block mb-1">Briefing</span>
                <p className="typing-effect leading-relaxed">{data?.description}</p>
              </div>

              <div className="flex items-start gap-3 bg-green-900/10 p-4 border border-green-900/30">
                <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
                <div>
                  <span className="text-xs text-red-900 uppercase block mb-1">Intel</span>
                  <p className="text-red-400 text-sm">{data?.enemyIntel}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && (
             <button 
               onClick={onReady}
               className="mt-8 w-full bg-green-900/20 hover:bg-green-500 hover:text-black border border-green-500 text-green-500 py-4 uppercase font-bold tracking-widest transition-all duration-200"
             >
               ENGAGE THRUSTERS
             </button>
          )}

        </div>
      </div>
    </div>
  );
};

export default MissionBriefing;