import React, { useMemo } from 'react';
import { GameState, Release } from '../types';
import { Award } from 'lucide-react';

interface PlaquesViewProps {
  gameState: GameState;
}

export const PlaquesView = ({ gameState }: PlaquesViewProps) => {
  const plaques = useMemo(() => {
    const list: { release: Release; platform: string; streams: number }[] = [];
    const target = 1_000_000_000;

    gameState.releases.forEach(release => {
      if (release.status !== 'Published') return;

      if (release.streams?.spotify >= target) list.push({ release, platform: 'Spotify', streams: release.streams.spotify });
      if (release.streams?.appleMusic >= target) list.push({ release, platform: 'Apple Music', streams: release.streams.appleMusic });
      if (release.streams?.amazonMusic >= target) list.push({ release, platform: 'Amazon Music', streams: release.streams.amazonMusic });
      if (release.streams?.youtubeMusic >= target) list.push({ release, platform: 'YouTube Music', streams: release.streams.youtubeMusic });
    });
    
    return list.sort((a,b) => b.streams - a.streams);
  }, [gameState.releases]);

  const getPlatformIcon = (platform: string) => {
    if (platform === 'Spotify') {
      return (
        <svg viewBox="0 0 24 24" className="w-12 h-12 fill-white opacity-90 mx-auto drop-shadow-md">
           <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.56.3z" />
        </svg>
      );
    }
    if (platform === 'Apple Music') {
      return (
         <svg viewBox="0 0 24 24" className="w-12 h-12 fill-[#FA243C] opacity-90 mx-auto drop-shadow-md">
            <path d="M14.93,13.56c0,2.15-1.54,3.75-3.8,4.12l-1.03-3.56l-1.42,0.41l1.19,4.12C5.97,18.06,3,14.62,3,10.63 C3,5.87,6.86,2,11.63,2s8.63,3.87,8.63,8.63C20.25,12.55,17.72,13.56,14.93,13.56z M16.32,15.65c0.41-0.2,0.8-0.45,1.15-0.74 c0.87-0.72,1.38-1.8,1.38-2.98C18.86,8.74,15.93,6.2,12.44,6.2S6.03,8.74,6.03,11.93c0,1.96,1.17,3.64,2.85,4.38l0.98,3.37 l1.29-0.38L10.37,16.5c0.64,0.1,1.3,0.1,1.96-0.01l0.93,3.22l1.29-0.38L13.78,16.5c0.83-0.23,1.57-0.65,2.18-1.2l-0.54-0.65 C14.97,15.02,15.66,15.34,16.32,15.65z M12.8,10.74c1.17,0,2.13-0.96,2.13-2.13S13.97,6.48,12.8,6.48S10.67,7.44,10.67,8.61 S11.64,10.74,12.8,10.74z M12.8,7.31c0.72,0,1.31,0.58,1.31,1.31s-0.58,1.31-1.31,1.31S11.5,9.33,11.5,8.61S12.09,7.31,12.8,7.31z"/>
         </svg>
      );
    }
    if (platform === 'Amazon Music') {
      return (
         <svg viewBox="0 0 24 24" className="w-[50px] h-[50px] fill-[#00A8E1] opacity-90 mx-auto drop-shadow-md">
            <path d="M17.44 2.1c-.81.65-1.4 1.57-1.4 2.5 0 2.2 1.8 3.99 4.01 3.99 1.13 0 2.12-.46 2.84-1.19v1.93c-1.15.8-2.52 1.25-3.95 1.25-3.86 0-6.99-3.13-6.99-6.99 0-.48.05-.95.14-1.4h5.35zm-5.7 6.47c-1.13 0-2.12-.46-2.84-1.19V9.32c1.15.8 2.52 1.25 3.96 1.25 3.86 0 6.99-3.13 6.99-6.99 0-.48-.05-.95-.14-1.4h-5.36c.81.65 1.4 1.57 1.4 2.5 0 2.2-1.79 3.99-4.01 3.99zm-4.49-14.4c1.1 0 2-.9 2-2 0-1.1-.9-2-2-2-1.1 0-2 .9-2 2 0 1.1.9 2 2 2zM3.48 20.31c1.82 2.05 4.34 3.19 7.04 3.19 2.02 0 4.01-.65 5.67-1.74l-2.02-3.03C12.8 19.64 11.23 20 9.8 20c-3.12 0-6.19-1.92-7.8-4.83l-2.6 1.55c1.13 2 2.68 3.53 4.08 3.59z"/>
         </svg>
      )
    }
    if (platform === 'YouTube Music') {
      return (
         <svg viewBox="0 0 24 24" className="w-[50px] h-[50px] fill-[#FF0000] opacity-90 mx-auto drop-shadow-md">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
         </svg>
      )
    }
    return <Award className="w-12 h-12 text-gray-500 mx-auto" />;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-gray-900/50 p-6 rounded-2xl border border-gray-800/50 backdrop-blur-sm">
         <div>
            <h2 className="text-2xl font-bold font-sans text-white flex items-center gap-2">
               <Award className="w-6 h-6 text-yellow-500" />
               Billion Stream Plaques
            </h2>
            <p className="text-gray-400 mt-1">Earned for reaching 1,000,000,000+ streams on a single platform.</p>
         </div>
      </div>

      {plaques.length === 0 ? (
        <div className="bg-gray-900/40 border border-dashed border-gray-800 rounded-3xl p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
                <Award className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-400 mb-2">No Plaques Yet</h3>
            <p className="text-gray-500 max-w-sm">Reach 1 Billion streams on Spotify, Apple Music, Amazon Music, or YouTube Music for a release to earn a plaque!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plaques.map((plaque, i) => (
             <div key={`${plaque.release.id}-${plaque.platform}-${i}`} className="aspect-[3/4] bg-[#0A0A0A] rounded-[2px] shadow-2xl relative overflow-hidden group border-2 border-black">
                {/* Plaque Base */}
                <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-900 opacity-50" />
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-1000 rotate-12 scale-150 pointer-events-none" />

                {/* Content */}
                <div className="relative w-full h-full p-6 flex flex-col items-center justify-between">
                   
                   <div className="text-center mt-4">
                      {/* Logo Text/Icon Area */}
                      <div className="text-[10px] font-bold tracking-[0.2em] text-white/50 mb-4 uppercase">
                         {plaque.platform}
                      </div>

                      <div className="text-[9px] font-bold tracking-[0.1em] text-white/60 mb-2 uppercase">
                         IN RECOGNITION OF
                      </div>
                      
                      <div className="text-2xl font-black tracking-tighter text-white mb-2">
                         1,000,000,000
                      </div>

                      <div className="text-[10px] font-bold tracking-[0.2em] text-white/60 uppercase">
                         STREAMS
                      </div>
                   </div>

                   {/* Giant Disk representation */}
                   <div className="relative w-48 h-48 my-auto flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-gray-700 via-gray-900 to-black shadow-[0_0_30px_rgba(0,0,0,0.8)] border-[3px] border-gray-600/30 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -rotate-45" />
                          {/* Inner Grooves */}
                          <div className="absolute inset-2 rounded-full border border-gray-500/20" />
                          <div className="absolute inset-4 rounded-full border border-gray-500/10" />
                          <div className="absolute inset-6 rounded-full border border-gray-500/20" />
                          
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 z-20">
                             {getPlatformIcon(plaque.platform)}
                          </div>
                      </div>
                      <div className="absolute bottom-[-10px] right-[-10px] w-6 h-6 bg-white rounded-full blur-[10px] opacity-40 mix-blend-overlay" />
                   </div>

                   {/* Song / Artist details */}
                   <div className="text-center w-full mt-auto mb-4 border-t border-gray-800/50 pt-4">
                      <h4 className="text-sm font-bold text-white mb-1 truncate px-2">{plaque.release.title}</h4>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest truncate">{gameState.artist?.name || 'Artist'}</p>
                   </div>
                   
                   {/* Plaque bottom plate */}
                   <div className="w-[80px] h-[10px] bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-sm mb-2 shadow-inner" />
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
};
