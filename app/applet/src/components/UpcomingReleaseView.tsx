import React, { useEffect, useState } from 'react';
import { GameState, ReleaseSchedule } from '../types';
import { CheckCircle2, Share2, MoreHorizontal, Clock } from 'lucide-react';
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
     // For game context, releaseDate is fixed, we can just compute remaining days from gameState.time.
     // To make it feel real, we'll do real-time countdown for the small bits
     const interval = setInterval(() => {
        const gameDate = new Date(gameState.time.startDate);
        gameDate.setDate(gameDate.getDate() + gameState.time.daysPassed);
        const relDate = new Date(release.releaseDate);
        const diffMs = relDate.getTime() - gameDate.getTime();
        
        if (diffMs > 0) {
           const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
           
           // For realistic countdown effect, use real current time for hours/mins/secs
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

        const updatedReleases = prev.scheduledReleases.map(r => {
           if (r.id === _id) {
              return { ...r, totalPreSaves: r.totalPreSaves + 1 };
           }
           return r;
        });

        return {
           ...prev,
           userPreSaves: [...currentPresaves, _id],
           scheduledReleases: updatedReleases
        };
     });
  };

  const handleUnSave = () => {
    if (!setGameState || !isPreSaved) return;

    setGameState(prev => {
       const _id = release.id;
       const currentPresaves = prev.userPreSaves || [];
       if (!currentPresaves.includes(_id)) return prev;

       const updatedReleases = prev.scheduledReleases.map(r => {
          if (r.id === _id) {
             return { ...r, totalPreSaves: Math.max(0, r.totalPreSaves - 1) };
          }
          return r;
       });

       return {
          ...prev,
          userPreSaves: currentPresaves.filter(id => id !== _id),
          scheduledReleases: updatedReleases
       };
    });
  };

  const artistImage = release.isPlayerRelease 
     ? gameState.artist?.image 
     : (ARTIST_PICS[release.artistId] || ARTIST_IMAGES[release.artistId] || `https://i.pravatar.cc/150?u=${encodeURIComponent(release.artistId)}`);

  return (
    <div className="flex flex-col h-full bg-[#121212] overflow-y-auto">
       <div className="relative w-full h-[45vh] min-h-[300px]">
          <div className="absolute inset-0 bg-black/40 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent z-10" />
          <img src={release.bannerImage || release.coverImage} className="w-full h-full object-cover blur-sm opacity-80" />
          
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 pb-2">
             <div className="flex flex-col items-center justify-center h-full pt-12">
                 <img src={release.coverImage} className="w-40 h-40 md:w-56 md:h-56 shadow-2xl mb-6 relative z-30" />
                 
                 <div className="flex items-center gap-4 text-white">
                    <div className="flex flex-col items-center">
                       <span className="text-3xl md:text-5xl font-black tabular-nums">{timeLeft.days}</span>
                       <span className="text-xs text-white/60 lowercase tracking-wider">Days</span>
                    </div>
                    <span className="text-3xl md:text-5xl font-thin text-white/20 mb-4">|</span>
                    <div className="flex flex-col items-center">
                       <span className="text-3xl md:text-5xl font-black tabular-nums">{timeLeft.hours.toString().padStart(2, '0')}</span>
                       <span className="text-xs text-white/60 lowercase tracking-wider">Hours</span>
                    </div>
                    <span className="text-3xl md:text-5xl font-thin text-white/20 mb-4">|</span>
                    <div className="flex flex-col items-center">
                       <span className="text-3xl md:text-5xl font-black tabular-nums">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                       <span className="text-xs text-white/60 lowercase tracking-wider">Minutes</span>
                    </div>
                    <span className="text-3xl md:text-5xl font-thin text-white/20 mb-4">|</span>
                    <div className="flex flex-col items-center">
                       <span className="text-3xl md:text-5xl font-black tabular-nums">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                       <span className="text-xs text-white/60 lowercase tracking-wider">Seconds</span>
                    </div>
                 </div>
             </div>
          </div>
       </div>

       <div className="px-5 pb-6">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">{release.releaseTitle}</h1>
          <div className="flex items-center gap-2 group cursor-pointer w-max" onClick={() => onArtistClick(release.artistId)}>
             <img src={artistImage} className="w-6 h-6 rounded-full object-cover" />
             <span className="text-white text-sm font-bold group-hover:underline">{release.artistId}</span>
          </div>
          <p className="text-white/60 text-sm mt-1">
             {release.releaseType} • Releases on {new Date(release.releaseDate).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'})}
          </p>

          <div className="mt-6 flex items-center justify-between">
             <div className="flex items-center gap-5 text-white/60">
                <Share2 className="w-6 h-6 hover:text-white cursor-pointer transition-colors" />
                <MoreHorizontal className="w-6 h-6 hover:text-white cursor-pointer transition-colors" />
             </div>
             <div>
                {isPreSaved ? (
                   <button onClick={handleUnSave} className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/30 text-white font-bold text-sm bg-transparent hover:scale-105 transition-transform">
                      Pre-saved <CheckCircle2 className="w-4 h-4 fill-[#1db954] text-black" />
                   </button>
                ) : (
                   <button onClick={handlePreSave} className="px-5 py-2 rounded-full border border-white/30 text-white font-bold text-sm bg-transparent hover:scale-105 hover:bg-white/10 transition-all">
                      Pre-save
                   </button>
                )}
             </div>
          </div>
       </div>

       <div className="mt-2 px-5 pb-20">
          <h2 className="text-lg font-bold text-white mb-4">Tracklist preview</h2>
          <div className="flex flex-col gap-1">
             {release.tracks.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-md hover:bg-white/5 group transition-colors">
                   <div className="flex flex-col w-full">
                      <span className={\`text-base font-medium \${t.isHidden || !t.isAnnounced ? 'text-white/40' : 'text-white'}\`}>
                         {t.title}
                      </span>
                      {(!t.isHidden && t.isAnnounced) && (
                         <span className="text-white/50 text-sm">
                            {release.artistId} 
                            {t.featuredArtists?.length > 0 && \`, \${t.featuredArtists.join(', ')}\`}
                         </span>
                      )}
                   </div>
                   {t.isReleased && <div className="text-white/40 text-xs px-2">Released</div>}
                </div>
             ))}
          </div>
       </div>
    </div>
  );
}
