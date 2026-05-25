import React, { useState } from 'react';
import { Settings, ShieldAlert, Award, Zap, DollarSign, Music, Globe } from 'lucide-react';
import { GameState } from '../types';

interface SettingsViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
}

export function SettingsView({ gameState, setGameState }: SettingsViewProps) {
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState('');

  // God Mode inputs
  const [moneyInput, setMoneyInput] = useState('');
  const [levelInput, setLevelInput] = useState('');

  const handleRedeem = () => {
    setRedeemError('');
    setRedeemSuccess('');
    if (redeemCode.toLowerCase() === 'pinky') {
      setGameState({ ...gameState, isGodMode: true });
      setRedeemSuccess('God Mode Unlocked!');
      setRedeemCode('');
    } else {
      setRedeemError('Invalid code.');
    }
  };

  const handleGodAddMoney = (amount: number) => {
    setGameState({
      ...gameState,
      stats: { ...gameState.stats, money: gameState.stats.money + amount }
    });
  };

  const handleGodSetMoney = () => {
    const amt = parseInt(moneyInput);
    if (!isNaN(amt)) {
      setGameState({
        ...gameState,
        stats: { ...gameState.stats, money: amt }
      });
      setMoneyInput('');
    }
  };

  const handleGodSetLevel = () => {
    const lvl = parseInt(levelInput);
    if (!isNaN(lvl) && gameState.artist) {
      setGameState({
        ...gameState,
        artist: { ...gameState.artist, level: lvl }
      });
      setLevelInput('');
    }
  };

  const handleGodMaxSkills = () => {
    setGameState({
      ...gameState,
      skills: {
        performance: 99,
        production: 99,
        songwriting: 99,
        vocals: 99,
        pop: 99,
        kpop: 99,
        rap: 99,
        country: 99
      }
    });
  };

  const handleGodMaxPopularity = () => {
    setGameState({
      ...gameState,
      popularity: {
        america: 100,
        latinAmerica: 100,
        europe: 100
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] overflow-y-auto w-full p-4 md:p-12 font-sans selection:bg-purple-500/30">
      <div className="max-w-5xl mx-auto w-full">
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-xl">
                <Settings className="w-6 h-6 text-white" />
             </div>
             <div>
                <h1 className="text-3xl font-black text-white tracking-tight uppercase">System Settings</h1>
                <p className="text-white/40 text-sm font-medium tracking-wide">Manage your career parameters and unlock premium tools.</p>
             </div>
          </div>
          <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Card */}
          <div className="lg:col-span-12 space-y-8">
            <div className="bg-[#111] border border-white/5 rounded-[2rem] p-8 md:p-10 relative overflow-hidden group shadow-2xl">
               <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[80px] -mr-32 -mt-32 pointer-events-none group-hover:bg-purple-600/20 transition-all duration-500" />
               
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                     <Award className="w-6 h-6 text-purple-400" />
                     <h2 className="text-2xl font-black text-white uppercase tracking-tight">Redeem Code</h2>
                  </div>
                  <p className="text-base text-white/50 mb-8 max-w-lg leading-relaxed">Enter a special access key to unlock verified features, legacy content, or developer privileges.</p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 group">
                       <input 
                         type="text" 
                         value={redeemCode}
                         onChange={(e) => setRedeemCode(e.target.value)}
                         placeholder="XXXX-XXXX-XXXX" 
                         className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-lg font-mono text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all"
                       />
                    </div>
                    <button 
                      onClick={handleRedeem}
                      className="bg-white text-black hover:bg-gray-200 px-10 py-4 font-black rounded-2xl transition-all active:scale-95 shadow-xl uppercase tracking-tighter"
                    >
                      Verify Code
                    </button>
                  </div>
                  {redeemError && <div className="mt-4 flex items-center gap-2 text-red-500 bg-red-500/10 px-4 py-2 rounded-xl text-sm font-bold border border-red-500/20">{redeemError}</div>}
                  {redeemSuccess && <div className="mt-4 flex items-center gap-2 text-green-400 bg-green-500/10 px-4 py-2 rounded-xl text-sm font-bold border border-green-500/20">{redeemSuccess}</div>}
               </div>
            </div>

            {gameState.isGodMode && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-4">
                   <ShieldAlert className="w-6 h-6 text-fuchsia-500 animate-pulse" />
                   <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400 uppercase tracking-tight">Superuser Privileges</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Financial Console */}
                  <div className="bg-[#111] border border-fuchsia-500/10 rounded-[2rem] p-6 hover:border-fuchsia-500/30 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-inner">
                          <DollarSign className="w-5 h-5 text-green-400" />
                       </div>
                       <h3 className="text-lg font-black text-white/90 uppercase tracking-tighter">Finance</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <button onClick={() => handleGodAddMoney(10000000)} className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-400 font-bold py-3 rounded-xl transition-all text-xs border border-green-500/10 active:scale-[0.98]">
                        INJECT $10M
                      </button>
                      <div className="flex gap-2">
                        <input type="number" value={moneyInput} onChange={(e) => setMoneyInput(e.target.value)} placeholder="0.00" className="flex-1 bg-black/60 border border-white/5 rounded-xl px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-green-500/30" />
                        <button onClick={handleGodSetMoney} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-black uppercase border border-white/10 transition-all">Set</button>
                      </div>
                    </div>
                  </div>

                  {/* Operational Controls */}
                  <div className="bg-[#111] border border-fuchsia-500/10 rounded-[2rem] p-6 hover:border-fuchsia-500/30 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                          <Zap className="w-5 h-5 text-yellow-400" />
                       </div>
                       <h3 className="text-lg font-black text-white/90 uppercase tracking-tighter">Growth</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <input type="number" value={levelInput} onChange={(e) => setLevelInput(e.target.value)} placeholder="Level 1" className="flex-1 bg-black/60 border border-white/5 rounded-xl px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-yellow-500/30" />
                        <button onClick={handleGodSetLevel} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-black uppercase border border-white/10 transition-all whitespace-nowrap">Apply Level</button>
                      </div>
                      <p className="text-[10px] text-white/30 uppercase font-black tracking-widest text-center px-4">Level affects charting potential and radio curve reach.</p>
                    </div>
                  </div>

                  {/* Capability Suite */}
                  <div className="bg-[#111] border border-fuchsia-500/10 rounded-[2rem] p-6 hover:border-fuchsia-500/30 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                          <Music className="w-5 h-5 text-pink-400" />
                       </div>
                       <h3 className="text-lg font-black text-white/90 uppercase tracking-tighter">Stats</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <button onClick={handleGodMaxSkills} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-3 rounded-xl transition-all text-[10px] uppercase tracking-widest active:scale-[0.98]">
                        MAX ALL SKILLS (99)
                      </button>
                      <button onClick={handleGodMaxPopularity} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-3 rounded-xl transition-all text-[10px] uppercase tracking-widest active:scale-[0.98]">
                        MAX POPULARITY (100%)
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
        
        <footer className="mt-20 opacity-30 text-center pb-12">
           <div className="flex items-center justify-center gap-2 mb-4">
              <Globe className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Global Network • Ver 1.4.2</span>
           </div>
        </footer>
      </div>
    </div>
  );
}
