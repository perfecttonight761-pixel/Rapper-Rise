import React, { useMemo } from 'react';
import { GameState, Song } from '../types';
import { ChevronLeft, RadioReceiver } from 'lucide-react';
import { ARTIST_IMAGES } from '../artistImages';

export function RadioChart({ gameState, onBack }: { gameState: GameState, onBack: () => void }) {
  const currentDateObj = new Date(gameState.time.startDate);
  currentDateObj.setDate(currentDateObj.getDate() + gameState.time.daysPassed);
  
  const chartData = useMemo(() => {
     const publishedSongs = gameState.releases.filter(r => r.status === 'Published' && r.type === 'Single') as Song[];
     
     const songsWithRadio = publishedSongs.map(r => {
        const isNPC = !!(r as any).isNPCRelease;
        const rArtist = isNPC ? (r as any).artistId : (gameState.artist?.name || 'Player');
        
        let daysSinceRelease = 1;
        if (r.releaseDate) {
           daysSinceRelease = Math.max(1, Math.floor((currentDateObj.getTime() - new Date(r.releaseDate).getTime()) / (1000 * 3600 * 24)));
        }

        // Extrapolate current week's partial data to a full 7 days
        let daysIntoWeek = gameState.time.daysPassed % 7;
        if (daysIntoWeek === 0) daysIntoWeek = 7;
        let weeklySpins = ((r.currentWeekRadio ?? 0) / daysIntoWeek) * 7;
        
        // Use last week spins if better representation (e.g. tracking week just restarted)
        if (daysIntoWeek < 2 && r.lastWeekRadio) {
           weeklySpins = r.lastWeekRadio;
        }

        return {
           ...r,
           isPlayer: !isNPC,
           artist: rArtist,
           weeklySpins: Math.floor(weeklySpins),
           peakSpins: Math.floor(Math.max(weeklySpins, (r.radioPlays || 0) / Math.max(1, daysSinceRelease / 7))), // Estimate
           daysOnChart: Math.max(1, Math.floor(daysSinceRelease / 7)),
           coverImage: r.coverImage || ARTIST_IMAGES[rArtist as string] || `https://i.pravatar.cc/200?u=${encodeURIComponent(rArtist)}`
        };
     });
     
     const top50 = songsWithRadio
        .filter(s => s.weeklySpins > 10)
        .sort((a, b) => b.weeklySpins - a.weeklySpins)
        .slice(0, 50);
        
     return top50;
  }, [gameState]);

  return (
    <div className="flex flex-col h-full bg-[#050505] text-gray-100 font-sans selection:bg-yellow-500/30 overflow-hidden">
      {/* Dynamic Header */}
      <div className="relative p-8 md:p-12 shrink-0 border-b border-white/5 bg-gradient-to-br from-[#111] to-[#050505]">
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <RadioReceiver className="w-48 h-48 rotate-12" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <button onClick={onBack} className="p-2 -ml-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors mr-2">
                <ChevronLeft className="w-6 h-6" />
             </button>
             <div className="px-3 py-1 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest rounded-sm">Official Airplay</div>
             <div className="text-white/40 text-[10px] uppercase font-black tracking-[0.2em]">Updated Weekly • {currentDateObj.toLocaleDateString()}</div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase mb-4 leading-none">
            US RADIO <span className="text-yellow-500">TOP 50</span>
          </h1>
          <p className="text-white/40 max-w-2xl text-sm font-medium leading-relaxed uppercase tracking-wide">
            The week's most-played tracks on US terrestrial and digital radio stations, ranked by total weekly spins and audience impressions.
          </p>
        </div>
      </div>

      {/* Chart Legend */}
      <div className="flex items-center gap-8 px-8 py-4 bg-black/40 border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-white/30 sticky top-0 z-20">
         <div className="w-12 text-center">Rank</div>
         <div className="flex-1">Composition / Artist</div>
         <div className="w-24 text-right">Spins (Wk)</div>
         <div className="w-20 text-center">Peak</div>
         <div className="w-24 text-right hidden sm:block">Total Audience</div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-20">
         <div className="divide-y divide-white/[0.03]">
            {chartData.map((song, idx) => {
              const isPlayer = song.isPlayer;
              const spins = Math.floor(song.weeklySpins);
              const peakSpins = Math.floor(song.peakSpins);

              return (
                <div 
                  key={song?.id || idx} 
                  className={`flex items-center gap-8 px-8 py-6 transition-all group hover:bg-white/[0.02] ${isPlayer ? 'bg-yellow-500/5' : ''}`}
                >
                  <div className="w-12 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-black italic ${idx < 3 ? 'text-yellow-500 scale-125' : 'text-white/20'}`}>
                      {idx + 1}
                    </span>
                    {idx < 3 && <div className="w-1 h-1 bg-yellow-500 rounded-full mt-1 animate-pulse" />}
                  </div>

                  <div className="flex-1 min-w-0 flex items-center gap-6">
                    <div className="w-16 h-16 bg-[#111] border border-white/10 rounded-md shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform duration-500 shadow-xl">
                       {song.coverImage ? (
                         <img src={song.coverImage || undefined} className="w-full h-full object-cover" alt="" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 font-black text-white/20">
                            {song.title.substring(0, 1)}
                         </div>
                       )}
                       {isPlayer && <div className="absolute inset-0 border-2 border-yellow-500 rounded-md" />}
                    </div>
                    
                    <div className="flex flex-col min-w-0 text-left">
                      <h3 className={`text-xl font-black uppercase tracking-tighter truncate ${isPlayer ? 'text-yellow-500' : 'text-white'}`}>
                        {song.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white/40 text-xs font-bold uppercase tracking-widest truncate">{song.artist}</span>
                        {isPlayer && (
                          <div className="px-2 py-0.5 bg-yellow-500 text-black text-[8px] font-black uppercase rounded-[2px] tracking-tighter">YOU</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="w-24 flex flex-col items-end">
                    <span className="text-xl font-mono font-black tabular-nums">{spins.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">SPINS</span>
                  </div>

                  <div className="w-20 flex flex-col items-center">
                    <div className="text-sm font-mono font-black text-white/40 tracking-tighter">
                       <span className="text-[10px] opacity-40">PK PK</span> {peakSpins.toLocaleString()}
                    </div>
                    <div className={`text-[8px] font-black uppercase tracking-widest mt-1 ${isPlayer && spins >= peakSpins ? 'text-green-500' : 'text-white/20'}`}>
                       {isPlayer && spins >= peakSpins ? 'NEW PEAK' : ''}
                    </div>
                  </div>

                  <div className="w-24 hidden sm:flex flex-col items-end">
                    <span className="text-sm font-mono font-bold text-white/40">{(spins * 4500).toLocaleString()}</span>
                    <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest">IMPRESSIONS</span>
                  </div>
                </div>
              );
            })}
         </div>
      </div>
    </div>
  );
}
