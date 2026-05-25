import React from 'react';
import { GameState } from '../types';
import { Zap, BookOpen, Star, TrendingUp } from 'lucide-react';

interface SkillsViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
}

export function SkillsView({ gameState, setGameState }: SkillsViewProps) {
  
  const handleUpgrade = (skillKey: keyof GameState['skills'], spCost: number, moneyCost: number) => {
    if (gameState.stats.skillPoints < spCost) {
      alert(`Not enough Skill Points. Need ${spCost} SP.`);
      return;
    }
    if (gameState.stats.money < moneyCost) {
      alert(`Not enough Money. Need $${moneyCost.toLocaleString()}.`);
      return;
    }
    
    // Prevent level > 100
    if (gameState.skills[skillKey] >= 100) {
      alert("Skill is already Maxed out at 100!");
      return;
    }

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        skills: {
          ...prev.skills,
          [skillKey]: prev.skills[skillKey] + 1
        },
        stats: {
          ...prev.stats,
          skillPoints: prev.stats.skillPoints - spCost,
          money: prev.stats.money - moneyCost
        }
      };
    });
  };

  const getTierName = (v: number) => {
    if (v < 25) return "Novice";
    if (v < 50) return "Amateur";
    if (v < 75) return "Pro";
    if (v < 100) return "Elite";
    return "Legend";
  };

  const SkillRow = ({ name, skillKey, val }: { name: string, skillKey: keyof GameState['skills'], val: number }) => (
    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden group">
      <div className="flex justify-between items-center">
        <h3 className="font-bold tracking-widest uppercase text-sm">{name} <span className="text-white/40 font-mono ml-2">LVL {val}</span></h3>
        <span className="text-xs font-mono text-purple-400">{getTierName(val)}</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-purple-600 to-blue-500" style={{ width: `${val}%` }}></div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2">
        <button 
          onClick={() => handleUpgrade(skillKey, 10, 0)}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          <span className="text-[10px] uppercase font-bold text-white/50 mb-1">Basic Training</span>
          <span className="text-xs font-mono text-blue-400">10 SP</span>
          <span className="text-[10px] font-mono text-white/40">Free</span>
        </button>
        <button 
          onClick={() => handleUpgrade(skillKey, 7, 1000)}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 transition-colors"
        >
          <span className="text-[10px] uppercase font-bold text-purple-300 mb-1">Pro Coaching</span>
          <span className="text-xs font-mono text-blue-400">7 SP</span>
          <span className="text-[10px] font-mono text-red-300">-$1k</span>
        </button>
        <button 
          onClick={() => handleUpgrade(skillKey, 5, 5000)}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 transition-colors"
        >
          <span className="text-[10px] uppercase font-bold text-yellow-300 mb-1">Elite Mentor</span>
          <span className="text-xs font-mono text-blue-400">5 SP</span>
          <span className="text-[10px] font-mono text-red-300">-$5k</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
         <div>
           <h2 className="text-2xl font-bold tracking-tighter italic text-purple-400 uppercase">Skill Tree</h2>
           <p className="text-white/40 text-sm mt-1">Upgrade your talents to craft better songs.</p>
         </div>
         <div className="bg-blue-600/20 border border-blue-500/30 px-6 py-3 rounded-2xl flex items-center gap-4">
            <Zap className="w-5 h-5 text-blue-400" />
            <div className="flex flex-col">
               <span className="text-[10px] uppercase tracking-widest text-blue-300/60 font-bold">Available SP</span>
               <span className="text-xl font-mono text-blue-400 font-bold">{gameState.stats.skillPoints}</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {/* Artist Core Skills */}
         <div className="space-y-6">
           <h3 className="text-xs tracking-widest font-bold uppercase text-white/60 mb-2 flex items-center gap-2">
             <Star className="w-4 h-4" /> Core Talents
           </h3>
           <SkillRow name="Performance" skillKey="performance" val={gameState.skills.performance} />
           <SkillRow name="Production" skillKey="production" val={gameState.skills.production} />
           <SkillRow name="Songwriting" skillKey="songwriting" val={gameState.skills.songwriting} />
           <SkillRow name="Vocals" skillKey="vocals" val={gameState.skills.vocals} />
         </div>

         {/* Genre Mastery */}
         <div className="space-y-6 lg:col-span-2">
           <h3 className="text-xs tracking-widest font-bold uppercase text-white/60 mb-2 flex items-center gap-2">
             <TrendingUp className="w-4 h-4" /> Genre Mastery
           </h3>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SkillRow name="Pop" skillKey="pop" val={gameState.skills.pop} />
              <SkillRow name="K-Pop" skillKey="kpop" val={gameState.skills.kpop} />
              <SkillRow name="Rap" skillKey="rap" val={gameState.skills.rap} />
              <SkillRow name="Country" skillKey="country" val={gameState.skills.country} />
           </div>
         </div>
      </div>
    </div>
  );
}
