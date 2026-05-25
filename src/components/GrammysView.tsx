import React, { useState } from 'react';
import { GameState, GrammysState, Release } from '../types';
import { Award, Music, Disc, User, CheckCircle2, AlertCircle, Sparkles, ChevronRight, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ARTIST_IMAGES } from '../artistImages';

interface GrammysViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
}

export function GrammysView({ gameState, setGameState }: GrammysViewProps) {
  const [activeTab, setActiveTab] = useState<'current' | 'profile'>('current');
  const grammys = gameState.grammys || { year: 2024, stage: 'Closed' as const, submissions: [], submittedReleaseIds: [], results: [], history: [] };
  const currentYear = new Date(gameState.time.startDate).getFullYear() + Math.floor(gameState.time.daysPassed / 365);
  
  const handleSubmission = (category: string, workId: string) => {
    setGameState(prev => {
      if (!prev || !prev.grammys) return prev;
      const currentSubs = prev.grammys.submissions || [];
      const newSubmissions = currentSubs.filter(s => s.category !== category);
      if (workId) {
        newSubmissions.push({ category: category as any, workId });
      }
      return {
        ...prev,
        grammys: {
          ...prev.grammys,
          submissions: newSubmissions
        }
      };
    });
  };

  const eligibleReleases = gameState.releases.filter(r => {
    if (r.status !== 'Published' || !r.releaseDate) return false;
    const releaseYear = new Date(r.releaseDate).getFullYear();
    return releaseYear === grammys.year - 1;
  });

  const eligibleSingles = eligibleReleases.filter(r => r.type === 'Single');
  const eligibleAlbums = eligibleReleases.filter(r => r.type === 'Album');

  const submissionCategories = [
    { id: 'Artist of the Year', name: 'Artist of the Year', type: 'Artist' },
    { id: 'Record of the Year', name: 'Record of the Year', type: 'Single' },
    { id: 'Song of the Year', name: 'Song of the Year', type: 'Single' },
    { id: 'Best Pop Duo/Group Performance', name: 'Best Pop Duo/Group Performance', type: 'Collab' },
    { id: 'Album of the Year', name: 'Album of the Year', type: 'Album' },
    { id: 'Best Pop Album', name: 'Best Pop Album', type: 'Album', genre: ['Pop', 'Kpop'] },
    { id: 'Best Rap Album', name: 'Best Rap Album', type: 'Album', genre: ['Rap'] },
    { id: 'Best Country Album', name: 'Best Country Album', type: 'Album', genre: ['Country'] },
  ];

  const totalNoms = grammys.history?.reduce((acc, h) => acc + h.nominations.length, 0) || 0;
  const totalWins = grammys.history?.reduce((acc, h) => acc + h.nominations.filter(n => n.won).length, 0) || 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#f8f8f8] relative font-sans text-black">
      {/* Header Tabs */}
      <div className="flex sticky top-0 z-50 bg-[#f8f8f8] border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('current')}
          className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest text-[#d4af37] border-b-2 transition-colors ${activeTab === 'current' ? 'border-[#d4af37] bg-white' : 'border-transparent hover:bg-white/50 text-gray-500'}`}
        >
          Awards Cycle
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest text-[#d4af37] border-b-2 transition-colors ${activeTab === 'profile' ? 'border-[#d4af37] bg-white' : 'border-transparent hover:bg-white/50 text-gray-500'}`}
        >
          Artist Profile
        </button>
      </div>

      {activeTab === 'profile' && (
         <div className="flex flex-col bg-white min-h-full">
            {/* Cover Image */}
            <div className="w-full h-[300px] sm:h-[400px] bg-gray-200 overflow-hidden shrink-0">
               {gameState.artist?.image ? (
                 <img src={gameState.artist.image || undefined} className="w-full h-full object-cover object-top" />
               ) : (
                 <div className="w-full h-full bg-gradient-to-tr from-gray-300 to-gray-400"></div>
               )}
            </div>

            <div className="px-6 py-8">
               <div className="flex items-center justify-between uppercase tracking-[0.2em] font-bold text-xs sm:text-sm text-gray-800 mb-2">
                  <span>Artist</span>
               </div>
               
               <h1 className="text-5xl sm:text-7xl tracking-tighter mb-8 font-light" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
                 {gameState.artist?.name || 'Player'}
               </h1>

               <div className="grid grid-cols-2 gap-8 mb-12">
                  <div className="flex flex-col">
                     <span className="text-[#a88a2e] uppercase tracking-widest text-sm font-bold mb-1">Wins*</span>
                     <span className="text-6xl sm:text-7xl font-light text-[#a88a2e]" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>{totalWins}</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-gray-500 uppercase tracking-widest text-sm font-bold mb-1">Nominations*</span>
                     <span className="text-6xl sm:text-7xl font-light text-gray-600" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>{totalNoms}</span>
                  </div>
               </div>

               <div className="flex flex-col border border-gray-200">
                  {grammys.history && grammys.history.slice().reverse().map((yearEntry) => (
                     <div key={yearEntry.year} className="flex flex-col border-b border-gray-200 last:border-b-0 bg-white">
                        <div className="px-6 py-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                           <h3 className="text-xl font-bold">{yearEntry.year}th Annual GRAMMY Awards</h3>
                           <ChevronRight className="w-6 h-6 text-gray-400" />
                        </div>
                        
                        <div className="p-6">
                           <div className="text-gray-500 uppercase tracking-widest font-bold text-ss mb-6">Nominations</div>
                           
                           <div className="flex flex-col gap-6">
                              {yearEntry.nominations.map((nom, idx) => (
                                 <div key={idx} className="flex gap-6 items-start">
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 flex-shrink-0 relative overflow-hidden flex items-center justify-center p-2">
                                        <div className="absolute inset-0 bg-gradient-to-b from-[#d4af37] to-[#8a6d17] mix-blend-multiply opacity-20 hidden"></div>
                                        <div className="w-full h-full bg-[#1a1a1a] shadow-inner relative flex flex-col justify-center">
                                            {/* Striped background mock */}
                                            <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(212, 175, 55, 0.3) 10px, rgba(212, 175, 55, 0.3) 12px)' }}></div>
                                            <div className="absolute right-0 bottom-0 w-3/4 h-3/4 flex items-center justify-center filter drop-shadow-lg z-10">
                                              <div className="w-10 h-10 rounded-full bg-[#d4af37] absolute flex items-center justify-center shadow-lg border border-[#ffd700]"></div>
                                              <Trophy className="w-12 h-12 text-[#111] z-20 absolute -right-2 top-0" fill="#d4af37" />
                                              <div className="w-16 h-8 bg-[#d4af37] absolute bottom-2 rounded-t-sm shadow-md border-t border-[#ffd700]"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col pt-1">
                                       <span className={`text-[#a88a2e] uppercase tracking-widest text-sm font-bold mb-1 ${nom.won ? '' : 'text-gray-400'}`}>
                                          {nom.won ? 'Winner' : 'Nomination'}
                                       </span>
                                       <h4 className="text-lg font-bold text-gray-700 leading-tight mb-2">
                                          {nom.category}
                                       </h4>
                                       <h5 className="text-2xl font-bold font-sans tracking-tight">
                                          {nom.nominee.type === 'Artist' ? nom.nominee.artist : nom.nominee.title}
                                       </h5>
                                    </div>
                                 </div>
                              ))}
                           </div>

                           <div className="mt-8 text-[#a88a2e] uppercase tracking-widest font-bold text-sm">
                              More from the {yearEntry.year}th Awards
                           </div>
                        </div>
                     </div>
                  ))}
                  {(!grammys.history || grammys.history.length === 0) && (
                     <div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest">
                        No Grammy history yet.
                     </div>
                  )}
               </div>
            </div>
         </div>
      )}

      {activeTab === 'current' && (
      <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-8 space-y-8 bg-[#0a0a0c] relative">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-yellow-500/5 blur-[120px] pointer-events-none rounded-full"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <Trophy className="w-5 h-5 text-yellow-500" />
             <span className="text-yellow-500 font-bold tracking-[0.2em] text-[10px] uppercase">The Recording Academy</span>
           </div>
           <h2 className="text-4xl font-black tracking-tighter italic text-white uppercase leading-none">
             {grammys.year} <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500">GRAMMY</span> AWARDS
           </h2>
           <p className="text-white/40 mt-2 font-medium text-sm flex items-center gap-2">
              Status: <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${
                grammys.stage === 'Submission' ? 'bg-blue-500 text-white' :
                grammys.stage === 'Nominations' ? 'bg-purple-500 text-white' :
                grammys.stage === 'Ceremony' ? 'bg-yellow-500 text-black' :
                grammys.stage === 'Results' ? 'bg-green-500 text-white' : 'bg-white/10 text-white/40'
              }`}>{grammys.stage}</span>
           </p>
        </div>

        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4">
           <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center border border-yellow-500/30">
              <Award className="w-6 h-6 text-yellow-500" />
           </div>
           <div>
              <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Lifetime Wins</div>
              <div className="text-2xl font-black text-white">{gameState.stats.awards}</div>
           </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {grammys.stage === 'Submission' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-3xl">
               <h3 className="text-lg font-bold text-blue-400 mb-2 flex items-center gap-2">
                 <Sparkles className="w-5 h-5" />
                 Submit Your Work
               </h3>
               <p className="text-white/60 text-sm max-w-2xl">
                 The submission window for the {grammys.year} Grammy Awards is now open. Submit your best work from {grammys.year - 1} for consideration by the Academy.
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submissionCategories.map(cat => {
                const currentSub = (grammys.submissions || []).find(s => s.category === cat.id);
                
                let options: any[] = [];
                if (cat.type === 'Artist') {
                  options = [{ id: 'artist', title: `${gameState.artist?.name || 'Self'} (${cat.name})` }];
                } else if (cat.type === 'Single') {
                  options = eligibleSingles;
                } else if (cat.type === 'Collab') {
                  options = eligibleSingles.filter(s => (s as any).featuredArtistCost);
                } else if (cat.type === 'Album') {
                  options = eligibleAlbums.filter(a => !cat.genre || (a as any).genre && cat.genre.includes((a as any).genre));
                }

                if (options.length === 0) return null; // Cannot submit if no eligible work

                return (
                  <div key={cat.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col gap-3">
                    <h4 className="font-bold text-sm tracking-tight text-yellow-500">{cat.name}</h4>
                    <select 
                      value={currentSub?.workId || ''}
                      onChange={(e) => handleSubmission(cat.id, e.target.value)}
                      className="bg-black border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">-- No Submission --</option>
                      {options.map(opt => (
                        <option key={opt.id} value={opt.id}>
                           {opt.title}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {(grammys.stage === 'Nominations' || grammys.stage === 'Ceremony' || grammys.stage === 'Results') && (
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="grid grid-cols-1 lg:grid-cols-2 gap-8"
           >
              {grammys.results.map((result, idx) => (
                 <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="bg-white/5 p-6 border-b border-white/10 flex justify-between items-center">
                       <h3 className="text-xl font-black italic tracking-tighter text-yellow-500 uppercase">{result.category}</h3>
                       {grammys.stage === 'Results' && result.winnerId && result.nominees.find(n => n?.id === result.winnerId)?.isPlayer && (
                          <div className="bg-yellow-500 text-black px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 animate-pulse">
                             <Trophy className="w-3 h-3" />
                             Artist Won
                          </div>
                       )}
                    </div>
                    <div className="p-4 space-y-2">
                       {result.nominees.map((nominee, nIdx) => {
                          const isWinner = grammys.stage === 'Results' && result.winnerId === nominee?.id;
                          const release = gameState.releases.find(r => r?.id === nominee?.id);
                          const fallbackImage = ARTIST_IMAGES[nominee.artist as string] || `https://i.pravatar.cc/200?u=${encodeURIComponent(nominee.artist)}`;
                          const coverImage = nominee.type === 'Artist' ? (nominee.isPlayer ? gameState.artist?.image : fallbackImage) : (release?.coverImage || nominee.coverImage || fallbackImage);
                          
                          return (
                             <div 
                               key={nIdx} 
                               className={`p-3 rounded-2xl flex items-center gap-4 transition-all ${
                                 isWinner ? 'bg-yellow-500 text-black border border-yellow-400' : 'bg-white/5 border border-white/5'
                               } ${nominee.isPlayer ? 'ring-2 ring-purple-500/50' : ''}`}
                             >
                                <div className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 ${isWinner ? 'bg-black/20' : 'bg-white/10'} flex items-center justify-center shadow-lg border border-white/10`}>
                                   {coverImage ? <img src={coverImage || undefined} className="w-full h-full object-cover" /> : (nominee.type === 'Artist' ? <User className="w-6 h-6" /> : nominee.type === 'Album' ? <Disc className="w-6 h-6" /> : <Music className="w-6 h-6" />)}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <div className={`font-bold text-[15px] truncate ${isWinner ? 'text-black' : 'text-white'}`}>
                                      {nominee.type === 'Artist' ? nominee.artist : nominee.title}
                                   </div>
                                   <div className={`text-[10px] uppercase font-bold tracking-widest ${isWinner ? 'text-black/60' : 'text-white/40'}`}>
                                      {nominee.type === 'Artist' ? 'Nominee' : nominee.artist}
                                   </div>
                                </div>
                                {isWinner && (
                                   <motion.div 
                                     initial={{ scale: 0 }} 
                                     animate={{ scale: 1 }}
                                     className="bg-black text-yellow-500 p-1 rounded-full"
                                   >
                                      <CheckCircle2 className="w-4 h-4" />
                                   </motion.div>
                                )}
                                {nominee.isPlayer && !isWinner && (
                                   <div className="bg-purple-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase">YOU</div>
                                )}
                             </div>
                          );
                       })}
                    </div>
                 </div>
              ))}
           </motion.div>
        )}

        {grammys.stage === 'Closed' && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="py-40 text-center"
           >
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                 <AlertCircle className="w-12 h-12 text-white/20" />
              </div>
              <h3 className="text-2xl font-black text-white/20 uppercase tracking-tighter italic">Academy is currently in recess</h3>
              <p className="text-white/20 text-sm font-medium mt-2">The awards cycle for {grammys.year} will begin in January.</p>
           </motion.div>
        )}
      </AnimatePresence>
      </div>
      )}
    </div>
  );
}
