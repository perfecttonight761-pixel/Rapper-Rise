import React, { useState } from 'react';
import { GameState, Album, Song } from '../types';
import { X, PlayCircle, BarChart3, TrendingUp, TrendingDown, Minus, Disc } from 'lucide-react';

interface AlbumCardViewProps {
  album: Album;
  gameState: GameState;
  onClose: () => void;
  onReleaseDeluxe?: () => void;
}

type Platform = 'spotify' | 'appleMusic' | 'amazonMusic' | 'youtubeMusic' | 'total';

export function AlbumCardView({ album, gameState, onClose, onReleaseDeluxe }: AlbumCardViewProps) {
  const [platform, setPlatform] = useState<Platform>('spotify');

  // Helper to calculate streams
  const getDaily = (r: Song | Album) => {
     if (platform === 'total') return r.lastDailyStreams?.total || 0;
     const total = r.lastDailyStreams?.total || 0;
     // Replicate splits from App.tsx
     const sp = Math.floor(total * 0.45);
     const ap = Math.floor(total * 0.25);
     const am = Math.floor(total * 0.25);
     const yt = total - sp - ap - am;
     
     if (platform === 'spotify') return sp;
     if (platform === 'appleMusic') return ap;
     if (platform === 'amazonMusic') return am;
     if (platform === 'youtubeMusic') return yt;
     return 0;
  };

  const getTotal = (r: Song | Album) => {
     if (platform === 'total') return r.streams.total;
     return r.streams[platform] || 0;
  };

  // Find all tracks
  const tracks: Song[] = [];
  album.trackIds.forEach(id => {
     const t = gameState.releases.find(rel => rel?.id === id);
     if (t && t.type === 'Single') tracks.push(t as Song);
  });

  const currentDate = new Date(gameState.time.startDate);
  currentDate.setDate(currentDate.getDate() + gameState.time.daysPassed);

  const getDayLabel = () => {
     const daysSinceRelease = album.releaseDate ? Math.max(0, Math.floor((currentDate.getTime() - new Date(album.releaseDate).getTime()) / (1000 * 3600 * 24))) : 0;
     if (daysSinceRelease === 0) return 'DEBUT DAY';
     return `DAY ${daysSinceRelease + 1}`;
  };

  // Compute album daily and total manually by summing tracks to ensure accuracy
  const albumDaily = tracks.reduce((sum, t) => sum + getDaily(t), 0);
  const albumTotal = tracks.reduce((sum, t) => sum + getTotal(t), 0);
  
  // Fake change % based on daily streams for immersive feeling
  // In a real app we'd save historical streams. Here we'll generate a deterministic pseudo-random change based on the date and track ID to keep it stable for the day.
  const getChangeInfo = (id: string, daily: number) => {
     if (daily === 0) return { changeNum: 0, percent: 0 };
     // Simple hash
     let h = 0;
     for (let i = 0; i < id.length; i++) {
        h = Math.imul(31, h) + id.charCodeAt(i) | 0;
     }
     const currentDay = Math.floor(currentDate.getTime() / (1000 * 3600 * 24));
     const seed = Math.abs(h + currentDay);
     // Change generally fluctuates between -15% and +15%
     const changePercent = (seed % 30) - 15;
     
     // Special condition: if it's debut day, change is purely positive or N/A.
     const daysSinceRelease = album.releaseDate ? Math.max(0, Math.floor((currentDate.getTime() - new Date(album.releaseDate).getTime()) / (1000 * 3600 * 24))) : 0;
     if (daysSinceRelease === 0) {
        return { changeNum: daily, percent: null }; // no percentage for day 1
     }
     
     const percentDec = changePercent / 100;
     const previousDayEstimate = daily / (1 + percentDec);
     const changeNum = Math.floor(daily - previousDayEstimate);
     
     return { changeNum, percent: changePercent };
  };

  const albumChangeInfo = getChangeInfo(album.id, albumDaily);

  const formatNumber = (n: number) => n.toLocaleString();

  const PlatformIcon = ({ type }: { type: Platform }) => {
    switch (type) {
      case 'spotify': return <div className="w-4 h-4 bg-[#1db954] rounded-full flex items-center justify-center pt-[1px] pl-[0.5px]"><div className="flex flex-col gap-[2px] items-center"><div className="w-2.5 h-[1.5px] bg-black rounded-full transform -rotate-12"></div><div className="w-2 h-[1px] bg-black rounded-full transform -rotate-12"></div></div></div>;
      case 'appleMusic': return <div className="w-4 h-4 bg-gradient-to-br from-pink-500 to-red-600 rounded-md flex items-center justify-center"><PlayCircle className="w-3 h-3 text-white fill-white" /></div>;
      case 'amazonMusic': return <div className="w-4 h-4 bg-[#00A8E1] rounded-sm flex items-center justify-center overflow-hidden"><span className="text-[10px] font-black text-white italic">a</span></div>;
      case 'youtubeMusic': return <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center"><div className="w-0 h-0 border-t-[2px] border-t-transparent border-l-[4px] border-l-white border-b-[2px] border-b-transparent ml-0.5"></div></div>;
      case 'total': return <BarChart3 className="w-4 h-4 text-white" />;
      default: return null;
    }
  };

  const platformColors: Record<Platform, string> = {
    spotify: '#1db954',
    appleMusic: '#fa243c',
    amazonMusic: '#00a8e1',
    youtubeMusic: '#ff0000',
    total: '#ffffff'
  };

  const currentColor = platformColors[platform];

  return (
    <div className="fixed inset-0 z-[300] bg-[#121212]/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="absolute inset-0 max-w-5xl mx-auto flex flex-col bg-[#121212] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10" style={{ maxHeight: '92vh' }}>
        
        {/* Dynamic Background Glow */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] opacity-20 pointer-events-none transition-all duration-700 blur-[120px]"
          style={{ background: `radial-gradient(circle, ${currentColor} 0%, transparent 70%)` }}
        />

        {/* Header Actions */}
        <div className="flex justify-between items-center p-4 shrink-0 bg-black/40 border-b border-white/5 relative z-10">
           <div className="flex bg-[#2a2a2a]/50 rounded-xl p-1 gap-1 border border-white/5">
             {(['spotify', 'appleMusic', 'amazonMusic', 'youtubeMusic', 'total'] as Platform[]).map(p => (
               <button
                 key={p}
                 onClick={() => setPlatform(p)}
                 className={`flex items-center gap-2 px-3 py-2 text-xs font-bold capitalize rounded-lg transition-all duration-300 ${platform === p ? 'bg-white/10 text-white shadow-lg ring-1 ring-white/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
               >
                 <PlatformIcon type={p} />
                 <span className="hidden lg:inline">{p === 'appleMusic' ? 'Apple' : p === 'youtubeMusic' ? 'YouTube' : p === 'amazonMusic' ? 'Amazon' : p}</span>
               </button>
             ))}
           </div>
           <button onClick={onClose} className="p-2 bg-[#2a2a2a]/50 hover:bg-white/10 border border-white/5 rounded-xl transition-all text-gray-300">
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto hide-scrollbar font-sans text-gray-200 relative z-10">
          
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row gap-8 p-6 sm:p-10 shrink-0">
             <div className="relative group shrink-0 mx-auto sm:mx-0">
               <img src={album.coverImage || undefined} className="w-48 h-48 sm:w-64 sm:h-64 object-cover shadow-2xl rounded-lg" alt="Album Cover" />
               <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] rounded-lg" />
             </div>
             
             <div className="flex flex-col justify-end w-full text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">
                   <BarChart3 className="w-3 h-3" />
                   Analytical Report
                </div>
                <h1 className="text-3xl sm:text-7xl font-black uppercase tracking-tighter text-white leading-[0.9] mb-3 break-words">
                  {album.title}
                </h1>
                <div className="flex items-center gap-4 justify-center sm:justify-start mb-6">
                  <h2 className="text-lg sm:text-2xl font-bold uppercase tracking-widest" style={{ color: currentColor }}>
                    {(() => {
                        const r = album as any;
                        if (r.isNPCCollab) return `${r.collaborator} & ${gameState.artist?.name || 'You'}`;
                        if (r.type === 'Single' && r.collaborator) return `${gameState.artist?.name || 'You'} & ${r.collaborator}`;
                        return gameState.artist?.name || 'You';
                     })()}
                  </h2>
                  {album.trend && (
                     <span className={`text-[10px] sm:text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-full ${
                        album.trend === 'Mega Hit' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        album.trend === 'Hit' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        album.trend === 'Flop' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-white/10 text-white/60 border border-white/20'
                     }`}>
                        {album.trend}
                     </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">
                  <span>{album.releaseDate ? new Date(album.releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Date'}</span>
                  <span className="opacity-30">|</span>
                  <span className="text-white/80">{getDayLabel()}</span>
                  <span className="opacity-30">|</span>
                  <span className="text-white/80">{tracks.length} Tracks</span>

                  {album.type !== 'Deluxe Album' && onReleaseDeluxe && album.status === 'Published' && (
                    <button onClick={onReleaseDeluxe} className="ml-0 sm:ml-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-1.5 rounded-lg transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-purple-400/30 flex items-center gap-2 font-black">
                       <Disc className="w-3 h-3" /> Release Deluxe
                    </button>
                  )}
                </div>
                
                <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 p-4 sm:p-6 rounded-2xl">
                   <div className="text-left">
                     <div className="text-3xl sm:text-7xl font-black text-white tracking-tighter leading-none mb-1">
                       {formatNumber(albumDaily)}
                     </div>
                     <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.15em]">
                       daily {platform === 'total' ? '' : platform} streams
                     </div>
                   </div>
                   <div className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-black text-sm sm:text-2xl flex flex-col items-center justify-center transition-colors duration-500 ${albumChangeInfo.percent !== null ? (albumChangeInfo.percent > 0 ? 'bg-[#1db954] text-black shadow-[0_0_20px_rgba(29,185,84,0.3)]' : albumChangeInfo.percent < 0 ? 'bg-red-500 text-black shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-gray-600 text-white') : 'bg-[#1db954] text-black'}`}>
                      {albumChangeInfo.percent !== null ? (
                        <>
                           <div className="flex items-center gap-1">
                             {albumChangeInfo.percent > 0 ? <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6" /> : albumChangeInfo.percent < 0 ? <TrendingDown className="w-4 h-4 sm:w-6 sm:h-6" /> : <Minus className="w-4 h-4 sm:w-6 sm:h-6" />}
                             <span>{Math.abs(albumChangeInfo.percent).toFixed(1)}%</span>
                           </div>
                        </>
                      ) : (
                        <span className="tracking-tighter">DEBUT</span>
                      )}
                   </div>
                </div>
             </div>
          </div>

          {/* Tracks Table */}
          <div className="px-4 sm:px-10 pb-12 overflow-x-auto">
             <div className="w-full text-left border-collapse min-w-[600px] sm:min-w-0">
                {/* Responsive Header using Grid */}
                <div className="grid grid-cols-12 border-b border-gray-800 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] pb-3 mb-4 sticky top-0 bg-[#121212] z-10 pt-4" style={{ color: currentColor }}>
                   <div className="col-span-1 text-center opacity-50">#</div>
                   <div className="col-span-4 sm:col-span-5 px-2">track</div>
                   <div className="col-span-3 sm:col-span-2 text-right">daily</div>
                   <div className="col-span-2 sm:col-span-2 text-right">trend</div>
                   <div className="col-span-2 sm:col-span-2 text-right">total</div>
                </div>
                
                <div className="flex flex-col gap-1">
                   {tracks.map((track, idx) => {
                      const daily = getDaily(track);
                      const total = getTotal(track);
                      const cInfo = getChangeInfo(track.id, daily);
                      
                      return (
                        <div key={track.id} className="grid grid-cols-12 border-b border-white/[0.02] py-4 text-sm sm:text-base font-medium items-center hover:bg-white/[0.05] transition-all rounded-lg px-1 sm:px-2 group">
                           <div className="col-span-1 text-center text-gray-600 text-[10px] sm:text-xs font-bold group-hover:text-white transition-colors">{idx + 1}</div>
                           <div className="col-span-4 sm:col-span-5 px-2 truncate text-gray-100 font-black tracking-tight sm:text-lg">
                              {track.title}
                           </div>
                           <div className="col-span-3 sm:col-span-2 text-right font-mono font-bold sm:text-lg tabular-nums">
                              {formatNumber(daily)}
                           </div>
                           <div className={`col-span-2 sm:col-span-2 text-right flex flex-col items-end font-mono text-[10px] sm:text-sm font-black tabular-nums ${cInfo.percent !== null ? (cInfo.percent > 0 ? 'text-[#1db954]' : cInfo.percent < 0 ? 'text-red-500' : 'text-gray-500') : 'text-[#1db954]'}`}>
                              {cInfo.percent !== null ? (
                                <div className="flex items-center gap-0.5 sm:gap-1">
                                  {cInfo.percent > 0 ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-300" /> : cInfo.percent < 0 ? <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" /> : <Minus className="w-3 h-3 sm:w-4 sm:h-4" />}
                                  {Math.abs(cInfo.percent).toFixed(1)}%
                                </div>
                              ) : (
                                <span className="text-[8px] sm:text-[10px]">NEW</span>
                              )}
                           </div>
                           <div className="col-span-2 sm:col-span-2 text-right font-mono font-bold text-gray-500 tabular-nums text-xs sm:text-base">
                              {formatNumber(total)}
                           </div>
                        </div>
                      );
                   })}
                </div>
                
                {/* Total Row */}
                <div className="grid grid-cols-12 border-t-2 border-white/10 py-5 mt-4 font-black text-sm sm:text-lg uppercase bg-white/[0.02] rounded-xl px-1 sm:px-2">
                   <div className="col-span-1"></div>
                   <div className="col-span-4 sm:col-span-5 px-2 text-gray-500 tracking-widest leading-tight">
                     <span className="block sm:hidden text-[10px]">{tracks.length} TR</span>
                     <span className="hidden sm:block">{tracks.length} tracks</span>
                   </div>
                   <div className="col-span-3 sm:col-span-2 text-right font-mono tracking-tighter text-white tabular-nums">
                      {formatNumber(albumDaily)}
                   </div>
                   <div className={`col-span-2 sm:col-span-2 text-right flex flex-col items-end font-mono tracking-tighter tabular-nums text-xs sm:text-sm ${albumChangeInfo.percent !== null ? (albumChangeInfo.percent > 0 ? 'text-[#1db954]' : albumChangeInfo.percent < 0 ? 'text-red-500' : 'text-gray-500') : 'text-[#1db954]'}`}>
                      {albumChangeInfo.percent !== null ? (
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          {albumChangeInfo.percent > 0 ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> : albumChangeInfo.percent < 0 ? <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" /> : <Minus className="w-3 h-3 sm:w-4 sm:h-4" />}
                          {Math.abs(albumChangeInfo.percent).toFixed(1)}%
                        </div>
                      ) : (
                        <span className="text-[10px]">NEW</span>
                      )}
                   </div>
                   <div className="col-span-2 sm:col-span-2 text-right font-mono tracking-tighter text-gray-400 tabular-nums text-xs sm:text-base">
                      {formatNumber(albumTotal)}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
