import React from 'react';
import { GameState, Release } from '../types';
import { X, Music, Disc, Globe2, Music2, Apple, PlaySquare, Headphones } from 'lucide-react';

interface ReleaseStatsPopupProps {
  release: Release;
  gameState: GameState;
  onClose: () => void;
}

export function ReleaseStatsPopup({ release, gameState, onClose }: ReleaseStatsPopupProps) {
  // Streams Breakdown
  const streams = typeof release.streams === 'number' 
     ? { total: release.streams, spotify: release.streams * 0.4, appleMusic: release.streams * 0.25, amazonMusic: release.streams * 0.25, youtubeMusic: release.streams * 0.1 }
     : release.streams;

  // Base Market Sizes (Audience distribution)
  const BASE_MARKET = {
    america: 0.50,
    europe: 0.35,
    latinAmerica: 0.15
  };

  // Combine Player Popularity with Base Market
  const rawAm = BASE_MARKET.america * (1 + ((gameState.popularity.america || 0) / 100));
  const rawEu = BASE_MARKET.europe * (1 + ((gameState.popularity.europe || 0) / 100));
  const rawLa = BASE_MARKET.latinAmerica * (1 + ((gameState.popularity.latinAmerica || 0) / 100));

  const totalRaw = rawAm + rawEu + rawLa;
  
  const amPerc = rawAm / totalRaw;
  const euPerc = rawEu / totalRaw;
  const laPerc = rawLa / totalRaw;

  const totalSales = release.sales?.total || 0;
  const amSales = Math.floor(totalSales * amPerc);
  const euSales = Math.floor(totalSales * euPerc);
  const laSales = Math.floor(totalSales * laPerc);

  const totalStreams = streams.total || 0;
  const amStreams = Math.floor(totalStreams * amPerc);
  const euStreams = Math.floor(totalStreams * euPerc);
  const laStreams = Math.floor(totalStreams * laPerc);

  // Peak Chart Estimator (Using debut streams to estimate peak week)
  const peakWeeklyStreams = (release.debutStreams || release.lastDailyStreams?.total || 0) * 7;
  // Let's estimate peak week's sales (about 25% of total, since most sales are in 1st week)
  const peakSales = (release.sales?.total || 0) * 0.25; 
  const peakRadio = (release.radioPlays || 0) * 0.15; 
  
  // Predict points matching the ChartsView formula
  const estPoints = release.type === 'Single' 
      ? (peakWeeklyStreams / 250) + (peakSales * 1.5) + (peakRadio / 500)
      : (peakWeeklyStreams / 350) + (peakSales * 2) + (peakRadio / 1000);

  const amPoints = estPoints * amPerc * 1.2;
  const laPoints = estPoints * laPerc * 1.1;
  const euPoints = estPoints * euPerc * 1.1;
  const globalPoints = estPoints;

  // Determine Peak placement roughly based on NPC generation ranges
  let hot100Peak = '>100';
  if (amPoints > 350000) hot100Peak = '1';
  else if (amPoints > 250000) hot100Peak = 'Top 5';
  else if (amPoints > 180000) hot100Peak = 'Top 10';
  else if (amPoints > 70000) hot100Peak = 'Top 40';
  else if (amPoints > 20000) hot100Peak = 'Top 100';

  let globalPeak = '>200';
  if (globalPoints > 550000) globalPeak = '1';
  else if (globalPoints > 400000) globalPeak = 'Top 5';
  else if (globalPoints > 250000) globalPeak = 'Top 10';
  else if (globalPoints > 100000) globalPeak = 'Top 40';
  else if (globalPoints > 30000) globalPeak = 'Top 200';

  let latinPeak = '>100';
  if (laPoints > 250000) latinPeak = '1';
  else if (laPoints > 150000) latinPeak = 'Top 5';
  else if (laPoints > 80000) latinPeak = 'Top 10';
  else if (laPoints > 20000) latinPeak = 'Top 100';

  let euroPeak = '>100';
  if (euPoints > 280000) euroPeak = '1';
  else if (euPoints > 180000) euroPeak = 'Top 5';
  else if (euPoints > 90000) euroPeak = 'Top 10';
  else if (euPoints > 20000) euroPeak = 'Top 100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                {release.coverImage ? <img src={release.coverImage || undefined} className="w-full h-full object-cover" /> : <Music className="w-8 h-8 text-white/40" />}
             </div>
             <div>
               <h2 className="text-xl font-black">{release.title}</h2>
               <div className="flex items-center gap-2 mt-0.5">
                   <p className="text-sm font-mono text-white/50 uppercase tracking-widest">{release.type}</p>
                   {release.trend && (
                     <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${
                        release.trend === 'Mega Hit' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        release.trend === 'Hit' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        release.trend === 'Flop' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-white/10 text-white/60 border border-white/20'
                     }`}>
                        {release.trend}
                     </span>
                   )}
               </div>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
           {/* Platforms */}
           <section>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-4 pb-2 border-b border-white/10">Streams By Platform</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-[#1db954]/10 border border-[#1db954]/20 p-4 rounded-xl flex flex-col items-center text-center">
                    <Headphones className="w-6 h-6 text-[#1db954] mb-2" />
                    <span className="text-lg font-black text-[#1db954]">{Math.floor(streams.spotify).toLocaleString()}</span>
                    <span className="text-[10px] uppercase tracking-widest text-[#1db954]/60">Spotify</span>
                 </div>
                 <div className="bg-[#fa243c]/10 border border-[#fa243c]/20 p-4 rounded-xl flex flex-col items-center text-center">
                    <Music2 className="w-6 h-6 text-[#fa243c] mb-2" />
                    <span className="text-lg font-black text-[#fa243c]">{Math.floor(streams.appleMusic || 0).toLocaleString()}</span>
                    <span className="text-[10px] uppercase tracking-widest text-[#fa243c]/60">Apple Music</span>
                 </div>
                 <div className="bg-[#00a8e1]/10 border border-[#00a8e1]/20 p-4 rounded-xl flex flex-col items-center text-center">
                    <Disc className="w-6 h-6 text-[#00a8e1] mb-2" />
                    <span className="text-lg font-black text-[#00a8e1]">{Math.floor(streams.amazonMusic || 0).toLocaleString()}</span>
                    <span className="text-[10px] uppercase tracking-widest text-[#00a8e1]/60">Amazon Music</span>
                 </div>
                 <div className="bg-[#ff0000]/10 border border-[#ff0000]/20 p-4 rounded-xl flex flex-col items-center text-center">
                    <PlaySquare className="w-6 h-6 text-[#ff0000] mb-2" />
                    <span className="text-lg font-black text-[#ff0000]">{Math.floor((streams as any).youtubeMusic || 0).toLocaleString()}</span>
                    <span className="text-[10px] uppercase tracking-widest text-[#ff0000]/60">YouTube</span>
                 </div>
              </div>
           </section>

           {/* Regional Breakdown */}
           <section>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-4 pb-2 border-b border-white/10">Regional Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-white/5 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                       <Globe2 className="w-4 h-4 text-blue-400" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 block">America</span>
                    </div>
                    <div>
                       <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-0.5">Audience Share</span>
                       <span className="font-mono text-sm text-white/80">{(amPerc * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-0.5">Streams</span>
                         <span className="font-mono text-lg text-white">{amStreams.toLocaleString()}</span>
                    </div>
                    <div>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-0.5">Pure Sales</span>
                         <span className="font-mono text-lg text-blue-400">{amSales.toLocaleString()}</span>
                    </div>
                 </div>

                 <div className="bg-white/5 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                       <Globe2 className="w-4 h-4 text-green-400" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 block">Europe</span>
                    </div>
                    <div>
                       <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-0.5">Audience Share</span>
                       <span className="font-mono text-sm text-white/80">{(euPerc * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-0.5">Streams</span>
                         <span className="font-mono text-lg text-white">{euStreams.toLocaleString()}</span>
                    </div>
                    <div>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-0.5">Pure Sales</span>
                         <span className="font-mono text-lg text-green-400">{euSales.toLocaleString()}</span>
                    </div>
                 </div>

                 <div className="bg-white/5 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                       <Globe2 className="w-4 h-4 text-orange-400" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 block">Latin America</span>
                    </div>
                    <div>
                       <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-0.5">Audience Share</span>
                       <span className="font-mono text-sm text-white/80">{(laPerc * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-0.5">Streams</span>
                         <span className="font-mono text-lg text-white">{laStreams.toLocaleString()}</span>
                    </div>
                    <div>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-0.5">Pure Sales</span>
                         <span className="font-mono text-lg text-orange-400">{laSales.toLocaleString()}</span>
                    </div>
                 </div>
              </div>
           </section>

           {/* Estimated Peak Charts */}
           <section>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-4 pb-2 border-b border-white/10">Highest Est. Chart Peaks</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-xl text-center">
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-400/60 block mb-2">BB Hot 100</span>
                    <span className="font-black text-2xl text-blue-400">#{hot100Peak}</span>
                 </div>
                 <div className="bg-purple-900/20 border border-purple-500/20 p-4 rounded-xl text-center">
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-purple-400/60 block mb-2">BB Global 200</span>
                    <span className="font-black text-2xl text-purple-400">#{globalPeak}</span>
                 </div>
                 <div className="bg-orange-900/20 border border-orange-500/20 p-4 rounded-xl text-center">
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-orange-400/60 block mb-2">Latin Chart</span>
                    <span className="font-black text-2xl text-orange-400">#{hot100Peak === '1' ? '1' : 'Top 10'}</span>
                 </div>
                 <div className="bg-green-900/20 border border-green-500/20 p-4 rounded-xl text-center">
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-green-400/60 block mb-2">Europe Chart</span>
                    <span className="font-black text-2xl text-green-400">#{hot100Peak === '1' ? '1' : 'Top 10'}</span>
                 </div>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}
