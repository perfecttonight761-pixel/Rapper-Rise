import React, { useEffect, useState } from 'react';
import { GameState, ReleaseSchedule } from '../types';
import { CheckCircle2, Share2, MoreHorizontal, Clock, Plus, Timer } from 'lucide-react';
import { ARTIST_IMAGES } from '../artistImages';
import { ARTIST_PICS } from '../artistPics';

interface Props {
  release: ReleaseSchedule;
  onClose: () => void;
  onArtistClick: (artistName: string) => void;
  gameState: GameState;
  setGameState?: React.Dispatch<React.SetStateAction<GameState>>;
}

export function UpcomingReleaseView({ release, onClose, onArtistClick, gameState, setGameState }: Props) {
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number}>({days: 0, hours: 0, minutes: 0, seconds: 0});
  
  const isPreSaved = gameState.userPreSaves?.includes(release.id);

  useEffect(() => {
     const interval = setInterval(() => {
        const gameDate = new Date(gameState.time.startDate);
        gameDate.setDate(gameDate.getDate() + gameState.time.daysPassed);
        const relDate = new Date(release.releaseDate);
        const diffMs = relDate.getTime() - gameDate.getTime();
        
        if (diffMs > 0) {
           const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
           const now = new Date();
           const hours = 23 - now.getHours();
           const minutes = 59 - now.getMinutes();
           const seconds = 59 - now.getSeconds();

           setTimeLeft({ days, hours, minutes, seconds });
        } else {
           setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        }
     }, 1000);
     return () => clearInterval(interval);
  }, [gameState.time.daysPassed, release.releaseDate]);

  const handlePreSave = () => {
     if (!setGameState || isPreSaved) return;
     setGameState(prev => {
        const _id = release.id;
        const currentPresaves = prev.userPreSaves || [];
        if (currentPresaves.includes(_id)) return prev;
        return { ...prev, userPreSaves: [...currentPresaves, _id] };
     });
  };

  const handleUnSave = () => {
    if (!setGameState || !isPreSaved) return;
    setGameState(prev => {
       const _id = release.id;
       const currentPresaves = prev.userPreSaves || [];
       if (!currentPresaves.includes(_id)) return prev;
       return { ...prev, userPreSaves: currentPresaves.filter(id => id !== _id) };
    });
  };

  const artistImage = release.isPlayerRelease 
     ? gameState.artist?.image 
     : (ARTIST_PICS[release.artistId] || ARTIST_IMAGES[release.artistId] || `https://i.pravatar.cc/150?u=${encodeURIComponent(release.artistId)}`);

  const presaveCount = release.totalPreSaves + (isPreSaved ? 1 : 0);

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] overflow-y-auto w-full relative">
       {/* Background Glow */}
       <div className="absolute top-0 left-0 w-full h-[60vh] z-0 overflow-hidden pointer-events-none">
          <img src={release.bannerImage || release.coverImage} className="w-full h-full object-cover blur-[100px] opacity-40 scale-110" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1e1e1e]/60 to-[#1e1e1e]" />
       </div>

       {/* Header */}
       <div className="sticky top-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
          <button onClick={onClose} className="p-2.5 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
       </div>

       <div className="relative z-10 flex flex-col items-center pt-8 pb-10 px-6">
          <div className="relative group perspective">
             <img src={release.coverImage} className="w-56 h-56 sm:w-72 sm:h-72 shadow-[0_20px_50px_rgba(0,0,0,0.5)] mb-8 rounded-xl object-cover" alt="Cover" />
          </div>

          <div className="text-center max-w-2xl mx-auto w-full">
              <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-xs font-bold uppercase tracking-widest mb-4">
                 Upcoming {release.releaseType}
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-4">{release.releaseTitle}</h1>
              
              <div 
                 className="inline-flex items-center gap-3 group cursor-pointer hover:bg-white/5 pr-4 rounded-full transition-colors mb-8" 
                 onClick={() => onArtistClick(release.artistId)}
              >
                 <img src={(artistImage as string)} className="w-8 h-8 rounded-full object-cover shadow-sm" alt="Artist" />
                 <span className="text-white text-lg font-bold group-hover:text-gray-300">{release.artistId}</span>
              </div>
          </div>

          {/* Countdown Timer */}
          <div className="w-full max-w-lg mx-auto bg-black/30 backdrop-blur-md border border-white/5 rounded-2xl p-6 sm:p-8 mb-8 shadow-2xl">
             <div className="flex items-center justify-center gap-2 text-white/50 mb-6 font-medium text-sm tracking-widest uppercase">
                <Timer className="w-4 h-4" />
                Time Until Release
             </div>
             <div className="flex items-center justify-between text-white font-black">
                <div className="flex flex-col items-center w-[20%]">
                   <span className="text-4xl sm:text-5xl tabular-nums">{timeLeft.days}</span>
                   <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-widest mt-1">Days</span>
                </div>
                <span className="text-3xl font-thin text-white/10 mb-4">:</span>
                <div className="flex flex-col items-center w-[20%]">
                   <span className="text-4xl sm:text-5xl tabular-nums">{timeLeft.hours.toString().padStart(2, '0')}</span>
                   <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-widest mt-1">Hrs</span>
                </div>
                <span className="text-3xl font-thin text-white/10 mb-4">:</span>
                <div className="flex flex-col items-center w-[20%]">
                   <span className="text-4xl sm:text-5xl tabular-nums">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                   <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-widest mt-1">Min</span>
                </div>
                <span className="text-3xl font-thin text-white/10 mb-4">:</span>
                <div className="flex flex-col items-center w-[20%]">
                   <span className="text-4xl sm:text-5xl tabular-nums text-indigo-400">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                   <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-widest mt-1">Sec</span>
                </div>
             </div>
          </div>

          {/* Actions */}
          <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6">
             <div className="text-center font-medium text-white/50">
                {Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short", maximumFractionDigits: 1 }).format(presaveCount)} fans have pre-saved
             </div>
             
             {isPreSaved ? (
                <button onClick={handleUnSave} className="w-full flex items-center justify-center gap-2 py-4 rounded-full border border-[#1db954] text-[#1db954] bg-[#1db954]/10 font-black text-lg hover:bg-[#1db954]/20 transition-all">
                   Pre-saved <CheckCircle2 className="w-6 h-6" />
                </button>
             ) : (
                <button onClick={handlePreSave} className="w-full flex items-center justify-center gap-2 py-4 rounded-full text-black bg-white font-black text-lg hover:scale-[1.02] shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all">
                   Pre-save Now
                </button>
             )}
             
             <div className="flex items-center gap-8 text-white/60 mt-4">
                <button className="flex flex-col items-center gap-2 hover:text-white transition-colors">
                   <Share2 className="w-6 h-6" />
                   <span className="text-xs font-bold">Share</span>
                </button>
                <button className="flex flex-col items-center gap-2 hover:text-white transition-colors">
                   <MoreHorizontal className="w-6 h-6" />
                   <span className="text-xs font-bold">More</span>
                </button>
             </div>
          </div>
       </div>

       {/* Tracklist Preview */}
       <div className="relative z-10 w-full max-w-2xl mx-auto px-6 pb-24 text-left">
          <h2 className="text-xl font-black text-white mb-6 border-b border-white/10 pb-4">Tracklist Preview</h2>
          <div className="flex flex-col">
             {release.tracks && release.tracks.map((t, i) => (
                <div key={t.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                   <span className="text-white/30 font-bold w-6 text-right tabular-nums">{i + 1}</span>
                   <div className="flex flex-col min-w-0">
                      <span className={"text-base font-bold truncate " + (t.isHidden || !t.isAnnounced ? "text-white/40 italic" : "text-white")}>
                         {t.title}
                      </span>
                      {(!t.isHidden && t.isAnnounced) && (
                         <span className="text-white/50 text-[13px] truncate">
                            {release.artistId}
                            {t.featuredArtists && t.featuredArtists.length > 0 ? ", " + t.featuredArtists.join(", ") : ""}
                         </span>
                      )}
                   </div>
                </div>
             ))}
             {(!release.tracks || release.tracks.length === 0) && (
                <div className="text-white/40 text-sm p-4 text-center border border-white/10 rounded-xl border-dashed">
                   {release.releaseType === 'Single' ? '1 track' : 'Tracklist has not been revealed yet.'}
                </div>
             )}
          </div>
       </div>
    </div>
  );
}