import React, { useState } from 'react';
import { GameState } from '../types';

interface SpotifyWrappedViewProps {
  gameState: GameState;
  onClose: () => void;
}

const formatNumber = (num: number) => {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
};

export const SpotifyWrappedView: React.FC<SpotifyWrappedViewProps> = ({ gameState, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const history = gameState.wrappedHistory || [];
  const latestWrapped = history[history.length - 1];

  if (!latestWrapped) {
    return (
      <div className="w-full h-full p-4 md:p-8 overflow-y-auto pb-48 flex items-center justify-center text-white bg-black">
        <div className="text-center">
            <h2 className="text-3xl font-black mb-4">No Wrapped Data</h2>
            <button onClick={onClose} className="px-6 py-2 bg-white text-black font-bold rounded-full">Close</button>
        </div>
      </div>
    );
  }

  const slides = [
    // Slide 1: Core Stats
    (
      <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center p-6 bg-[#FF6B2C] relative overflow-hidden">
        {/* Geometric Background Shapes */}
        <div className="absolute top-[-20%] right-[-20%] w-80 h-80 bg-[#E0FF00] rounded-full mix-blend-multiply opacity-50 pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-20%] w-96 h-96 bg-[#6700EB] rounded-full mix-blend-screen opacity-50 pointer-events-none" />

        {/* Central Star & Image */}
        <div className="relative w-full max-w-[180px] aspect-square mx-auto mb-8 z-10 flex items-center justify-center">
            {/* Background geometric pattern for avatar */}
            <div className="absolute inset-[-20%] bg-[#E0FF00] z-0 rounded-full blur-md opacity-60" />
            <div className="w-full h-full relative z-10 bg-black overflow-hidden border-[6px] border-black rounded-3xl shadow-2xl">
                <img src={gameState.artist?.image || "https://images.unsplash.com/photo-1516280440502-6c243ebadbe9?w=500&h=500&fit=crop" || undefined} 
                    alt={gameState.artist?.name} 
                    className="w-full h-full object-cover" 
                />
            </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-black z-10 leading-none mb-6 tracking-tighter w-full text-center drop-shadow-md">
            {gameState.artist?.name}
        </h1>

        <div className="grid grid-cols-2 gap-x-4 gap-y-6 z-10 w-full px-4 py-6 max-w-sm mx-auto mb-4 bg-white/80 backdrop-blur-sm rounded-[2rem] border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <div className="flex flex-col items-center bg-white p-3 rounded-2xl border-2 border-black">
                <span className="text-2xl md:text-3xl font-black text-[#6700EB] tabular-nums">{formatNumber(latestWrapped.streams)}</span>
                <span className="text-black font-black text-xs uppercase tracking-widest mt-1">Streams</span>
            </div>
            <div className="flex flex-col items-center bg-white p-3 rounded-2xl border-2 border-black">
                <span className="text-2xl md:text-3xl font-black text-[#FF6B2C] tabular-nums">{formatNumber(latestWrapped.listeners)}</span>
                <span className="text-black font-black text-xs uppercase tracking-widest mt-1">Listeners</span>
            </div>
            <div className="flex flex-col items-center bg-white p-3 rounded-2xl border-2 border-black">
                <span className="text-xl md:text-2xl font-black text-black tabular-nums">{formatNumber(latestWrapped.hours)}</span>
                <span className="text-black font-black text-[10px] uppercase tracking-widest mt-1">Hours</span>
            </div>
            <div className="flex flex-col items-center bg-white p-3 rounded-2xl border-2 border-black">
                <span className="text-xl md:text-2xl font-black text-black tabular-nums">{latestWrapped.countries || 183}</span>
                <span className="text-black font-black text-[10px] uppercase tracking-widest mt-1">Countries</span>
            </div>
        </div>
        
        <div className="mt-6 text-white font-black flex items-center gap-2 bg-black px-4 py-2 rounded-full border-2 border-transparent z-10">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#1ED760]">
               <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Artist Wrapped
        </div>
      </div>
    ),
    // Slide 2: Top Songs
    (
      <div className="flex flex-col h-full animate-fade-in p-6 bg-[#A5D6A7] rounded-3xl relative overflow-hidden" 
           style={{ backgroundImage: 'radial-gradient(rgba(129, 199, 132, 0.5) 20%, transparent 20%), radial-gradient(rgba(129, 199, 132, 0.5) 20%, transparent 20%)', backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' }}>
        
        <h1 className="text-[12rem] font-black text-[#81C784] opacity-50 absolute top-[-60px] left-[-20px] right-0 text-center leading-none pointer-events-none tracking-tighter">
            {latestWrapped.year}
        </h1>

        <div className="relative z-10 bg-white px-6 py-2 self-center rounded-full border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] mt-4 mb-4">
           <h2 className="text-xl font-black text-black tracking-widest uppercase">Top Songs</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-3 z-30 flex-1 overflow-y-auto pb-4 relative pointer-events-auto hide-scrollbar">
           {latestWrapped.topSongs?.slice(0, 5).map((song, idx) => (
               <div key={idx} className={`bg-[#F5F5DC] p-2 flex flex-col relative border-2 border-white shadow-[2px_2px_10px_rgba(0,0,0,0.1)] ${idx === 0 ? 'col-span-2 p-3' : ''}`}>
                  <div className={`relative w-full mb-2 bg-gray-200 shadow-inner ${idx === 0 ? 'aspect-video' : 'aspect-square'}`}>
                     {song.image ? <img src={song.image || undefined} alt={song.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">🎵</div>}
                     <div className="absolute top-2 left-2 bg-white text-black w-6 h-6 flex items-center justify-center font-black text-sm shadow-md z-10 leading-none">
                        {idx + 1}
                     </div>
                  </div>
                  <h4 className={`font-black text-black truncate leading-tight uppercase ${idx === 0 ? 'text-lg mt-1' : 'text-[11px]'}`}>{song.title}</h4>
                  <div className="flex flex-col text-[10px] font-bold text-black border-t-2 border-black/10 pt-1 mt-1">
                     <span>{formatNumber(song.streams)} streams</span>
                     <span>{formatNumber(Math.floor(song.streams * 3.5 / 60 / 60))} hours</span>
                  </div>
                  <div className={`font-black text-gray-500 mt-1 uppercase ${idx === 0 ? 'text-[10px]' : 'text-[8px]'}`}>
                    {(() => {
                        const rel = gameState.releases?.find(r => r.title === song.title);
                        if (rel && (rel as any).isNPCCollab) return `${(rel as any).collaborator} & ${gameState.artist?.name || 'You'}`;
                        if (rel && rel.type === 'Single' && (rel as any).collaborator) return `${gameState.artist?.name || 'You'} & ${(rel as any).collaborator}`;
                        return gameState.artist?.name || 'You';
                    })()}
                  </div>
               </div>
           ))}
           {(!latestWrapped.topSongs || latestWrapped.topSongs.length === 0) && (
               <div className="text-black/50 font-bold text-center mt-12 col-span-2">No songs released this year.</div>
           )}
        </div>
      </div>
    ),
    // Slide 3: Top Albums
    (
      <div className="flex flex-col h-full animate-fade-in p-6 bg-[#D7CCC8] rounded-3xl relative overflow-hidden" 
           style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 20%, transparent 20%), radial-gradient(rgba(255, 255, 255, 0.4) 20%, transparent 20%)', backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' }}>
        
        {/* Dynamic Background elements for slide 3 */}
        <div className="absolute bottom-0 right-[-10%] w-72 h-72 pointer-events-none z-0">
           <div className="absolute bottom-[-10%] right-[-10%] w-full h-full rounded-full border-[30px] border-[#8D6E63] opacity-90 shadow-[0_0_40px_rgba(0,0,0,0.2)]" />
           <div className="absolute bottom-1/4 right-1/4 w-[60%] h-[60%] rounded-full border-[15px] border-white" />
        </div>

        <div className="relative z-10 bg-white px-6 py-2 self-center rounded-full border-[3px] border-[#5D4037] shadow-[4px_4px_0_#5D4037] mt-4 mb-4">
           <h2 className="text-xl font-black text-[#5D4037] tracking-widest uppercase">Top Albums</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-3 z-30 flex-1 overflow-y-auto pb-8 relative pointer-events-auto hide-scrollbar">
           {latestWrapped.topAlbums?.slice(0, 5).map((album, idx) => (
               <div key={idx} className={`bg-[#EFEBE9] p-2 flex flex-col relative border-2 border-white shadow-[2px_2px_10px_rgba(0,0,0,0.1)] rounded-xl ${idx === 0 ? 'col-span-2 p-3' : ''}`}>
                  <div className={`relative w-full mb-2 bg-[#D7CCC8] shadow-inner rounded-lg overflow-hidden border border-[#BCAAA4] ${idx === 0 ? 'aspect-video' : 'aspect-square'}`}>
                     {album.image ? <img src={album.image || undefined} alt={album.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-5xl">💿</div>}
                     <div className="absolute top-2 left-2 bg-white text-[#5D4037] w-6 h-6 flex items-center justify-center font-black text-sm shadow-md rounded-full z-10 leading-none">
                        {idx + 1}
                     </div>
                  </div>
                  <h4 className={`font-black text-[#4E342E] truncate leading-tight uppercase ${idx === 0 ? 'text-lg mt-1' : 'text-[11px]'}`}>{album.title}</h4>
                  <div className="flex flex-col text-[10px] font-bold text-[#5D4037] border-t-2 border-[#D7CCC8] pt-1 mt-1">
                     <span>{formatNumber(album.streams)} streams</span>
                     <span>{formatNumber(Math.floor(album.streams * 12 * 3.5 / 60 / 60))} hours</span>
                  </div>
                  <div className={`font-black text-[#8D6E63] mt-1 uppercase ${idx === 0 ? 'text-[10px]' : 'text-[8px]'}`}>{gameState.artist?.name}</div>
               </div>
           ))}
           {(!latestWrapped.topAlbums || latestWrapped.topAlbums.length === 0) && (
               <div className="text-[#5D4037]/70 font-bold text-center mt-12 col-span-2 bg-white/50 p-4 rounded-xl border-2 border-dashed border-[#8D6E63]">No albums released this year.</div>
           )}
        </div>
        
        {/* The finale wrap up logo */}
        <div className="w-full flex justify-between items-end mt-auto pt-4 z-20 shrink-0 mb-4 pb-2">
           <div className="bg-white px-3 py-1.5 font-bold tracking-widest uppercase text-[9px] text-[#4E342E] border-2 border-[#4E342E] shadow-[2px_2px_0_#4E342E] rounded-md">
              #{gameState.artist?.name.replace(/\s+/g, '').toUpperCase()}WRAPPED
           </div>
           <div className="text-xl font-black text-[#4E342E] uppercase text-right leading-tight bg-white px-2 py-1 shadow-[2px_2px_0_#4E342E] border-2 border-[#4E342E] max-w-[50%] truncate rounded-md">
              {gameState.artist?.name}
           </div>
        </div>
      </div>
    )
  ];

  return (
    <div className="w-full h-full absolute inset-0 z-50 bg-[#121212] flex flex-col p-2 md:p-6 pb-20 md:pb-6 font-sans">
      <div className="flex gap-1.5 mb-3 px-4 w-full max-w-sm mx-auto mt-4 md:mt-2">
        {slides.map((_, idx) => (
           <div 
             key={idx} 
             onClick={() => setCurrentSlide(idx)}
             className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all ${idx === currentSlide ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : idx < currentSlide ? 'bg-white/50' : 'bg-white/20'}`}
           />
        ))}
      </div>

      <div className="flex-1 w-full max-w-sm mx-auto bg-black rounded-[2.5rem] overflow-hidden shadow-2xl relative cursor-pointer border border-white/10" onClick={(e) => {
         const rect = e.currentTarget.getBoundingClientRect();
         const x = e.clientX - rect.left;
         if (x < rect.width / 3) {
            setCurrentSlide(prev => Math.max(0, prev - 1));
         } else if (x > (rect.width * 2) / 3) {
            if (currentSlide < slides.length - 1) {
                setCurrentSlide(currentSlide + 1);
            } else {
                onClose();
            }
         } else {
            if (currentSlide < slides.length - 1) {
                setCurrentSlide(currentSlide + 1);
            }
         }
      }}>
         {slides[currentSlide]}
         
         <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-md text-white rounded-full hover:bg-black/40 transition-colors pointer-events-auto z-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
         </button>
      </div>
    </div>
  );
};
