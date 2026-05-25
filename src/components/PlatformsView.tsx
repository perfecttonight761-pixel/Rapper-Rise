import React, { useState } from 'react';
import { GameState, Song, Album, Release } from '../types';
import { Play, Heart, MoreHorizontal, CheckCircle2, ChevronRight, Music2, Disc, User, ChevronLeft, Share2, Plus } from 'lucide-react';
import { generateNPCSongs, generateNPCAlbums } from '../constants';

interface PlatformsViewProps {
  gameState: GameState;
  setGameState?: React.Dispatch<React.SetStateAction<GameState>>;
}

import { YouTubeMusicView } from './YouTubeMusicView';

export function PlatformsView({ gameState, setGameState }: PlatformsViewProps) {
  const [platform, setPlatform] = useState<'spotify' | 'apple' | 'youtube' | 'amazon' | null>(null);
  const [selectedSpotifyRelease, setSelectedSpotifyRelease] = useState<Release | null>(null);
  const [showAllDiscography, setShowAllDiscography] = useState(false);
  const [showAllTopSongs, setShowAllTopSongs] = useState(false);
  const artistPickId = gameState.artist?.spotifyArtistPickId || null;
  const setArtistPickId = (id: string | null) => {
     if (setGameState) {
        setGameState(prev => {
           if (!prev.artist) return prev;
           return { ...prev, artist: { ...prev.artist, spotifyArtistPickId: id || undefined } };
        });
     }
  };
  const [isSelectingPick, setIsSelectingPick] = useState(false);
  const [discoFilter, setDiscoFilter] = useState<'All' | 'Albums' | 'Singles'>('All');
  
  const [selectedAppleRelease, setSelectedAppleRelease] = useState<Release | null>(null);
  const [showAllAppleDiscography, setShowAllAppleDiscography] = useState(false);
  const [appleMusicTab, setAppleMusicTab] = useState<'profile' | 'charts'>('profile');
  const [appleMusicChart, setAppleMusicChart] = useState<'global_song' | 'global_album' | 'america' | 'europe' | 'latin_america' | null>(null);
  
  const [selectedAmazonRelease, setSelectedAmazonRelease] = useState<Release | null>(null);
  const [showAllAmazonDiscography, setShowAllAmazonDiscography] = useState(false);
  const [amazonHighlightId, setAmazonHighlightId] = useState<string | null>(null);
  const [isSelectingAmazonHighlight, setIsSelectingAmazonHighlight] = useState(false);
  const [amazonMusicTab, setAmazonMusicTab] = useState<'profile' | 'charts'>('profile');
  const [amazonMusicChart, setAmazonMusicChart] = useState<'global_song' | 'global_album' | 'america' | 'europe' | 'latin_america' | null>(null);

  const publishedReleases = gameState.releases.filter(r => r.status === 'Published');

  const isProject = (type: string) => ['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(type);
  const projects = publishedReleases.filter(r => isProject(r.type));
  const allProjectTrackIds = new Set(projects.flatMap(p => (p as Album).trackIds || []));

  const albums = publishedReleases.filter(r => ['Album', 'Deluxe Album'].includes(r.type)) as Album[];
  const epsAndSinglePacks = publishedReleases.filter(r => ['EP', 'Single Pack'].includes(r.type)) as Album[];
  
  const standaloneSingles = publishedReleases.filter(r => r.type === 'Single' && !(r as Song).isBSide);
  const singlesAndEPs = [...epsAndSinglePacks, ...standaloneSingles];
  
  const standaloneReleases = [...albums, ...singlesAndEPs];
  const songs = publishedReleases.filter(r => r.type === 'Single') as Song[];

  const handleSelectAmazonRelease = (rel: Release) => {
     if (rel.type === 'Single' && (rel as Song).isBSide) {
        const album = projects.find(a => (a as Album).trackIds.includes(rel.id));
        if (album) {
           setSelectedAmazonRelease(album);
           return;
        }
     }
     setSelectedAmazonRelease(rel);
  };

  const handleSelectRelease = (rel: Release) => {
     if (rel.type === 'Single' && (rel as Song).isBSide) {
        const album = projects.find(a => (a as Album).trackIds.includes(rel.id));
        if (album) {
           setSelectedSpotifyRelease(album);
           return;
        }
     }
     setSelectedSpotifyRelease(rel);
  };

  const getPlatformStreams = (release: any, plat: 'spotify' | 'appleMusic' | 'youtubeMusic' | 'amazonMusic') => {
    if (!release.streams) return 0;
    if (typeof release.streams === 'number') {
      if (plat === 'spotify') return Math.floor(release.streams * 0.4);
      if (plat === 'appleMusic') return Math.floor(release.streams * 0.25);
      if (plat === 'amazonMusic') return Math.floor(release.streams * 0.25);
      if (plat === 'youtubeMusic') return Math.floor(release.streams * 0.1);
      return 0;
    }
    return release.streams[plat] || 0;
  };

  const getArtistStr = (r: any) => r ? (r.isNPCCollab ? `${r.collaborator} & ${gameState.artist?.name || 'You'}` : (r.type === 'Single' && r.collaborator ? `${gameState.artist?.name || 'You'} & ${r.collaborator}` : gameState.artist?.name || 'You')) : gameState.artist?.name || 'You';

  const calculateListeners = (plat: 'spotify' | 'appleMusic' | 'youtubeMusic' | 'amazonMusic') => {
    const platMux = { spotify: 0.4, appleMusic: 0.25, amazonMusic: 0.25, youtubeMusic: 0.1 };
    
    let totalDailyPlatStreams = 0;
    
    songs.forEach(r => {
       const dailyTotal = r.lastDailyStreams?.total || 0;
       totalDailyPlatStreams += (dailyTotal * platMux[plat]);
    });

    // Realistically, an active monthly listener streams an artist's songs about 4.5 times a month on average.
    // Total monthly streams = daily * 28. Monthly listeners = (daily * 28) / 4.5 ≈ daily * 6.2
    const activeListeners = totalDailyPlatStreams * 6.2;

    const totalPlatStreams = songs.reduce((sum, r) => sum + getPlatformStreams(r, plat), 0);
    // Logarithmic scale for legacy catalog to prevent massive accumulation over years from giving bloated ML
    const legacyListeners = totalPlatStreams > 0 ? (Math.pow(totalPlatStreams, 0.65) * 0.8) : 0; 
    
    // Add real-world variance based on total listeners (not everyone listens actively)
    const rawListeners = Math.floor((activeListeners + legacyListeners) * (Math.random() * 0.05 + 0.95)) || 0;
    
    // Smooth cap to prevent unrealistic monthly listeners in endgame (e.g. 250M - 1B listeners)
    let ceiling = 115000000;
    if (plat === 'appleMusic') ceiling = 75000000;
    if (plat === 'amazonMusic') ceiling = 60000000;
    if (plat === 'youtubeMusic') ceiling = 85000000;

    if (rawListeners > ceiling) {
       return Math.floor(ceiling + Math.pow(rawListeners - ceiling, 0.45) * 1500);
    }
    
    return rawListeners;
  };

  const getTopSongs = (plat: 'spotify' | 'appleMusic' | 'youtubeMusic' | 'amazonMusic', limit: number = 5) => {
    const today = new Date(gameState.time.startDate);
    today.setDate(today.getDate() + gameState.time.daysPassed);
    const currentDateStr = today.toISOString();
    const getDailyPerf = (song: typeof songs[0]) => {
      const relDate = new Date(song.releaseDate || currentDateStr);
      const age = Math.max(1, (today.getTime() - relDate.getTime()) / (1000 * 3600 * 24));
      return song.lastDailyStreams?.[plat] || ((getPlatformStreams(song, plat) / age) || 0);
    };
    return [...songs].sort((a, b) => getDailyPerf(b) - getDailyPerf(a)).slice(0, limit);
  };

  const getLatestRelease = () => standaloneReleases.length > 0 ? standaloneReleases[standaloneReleases.length - 1] : null;
  const getPopularRelease = (plat: 'spotify' | 'appleMusic' | 'youtubeMusic' | 'amazonMusic') => 
    standaloneReleases.length > 0 ? [...standaloneReleases].sort((a, b) => getPlatformStreams(b, plat) - getPlatformStreams(a, plat))[0] : null;

  const renderSpotify = () => {
    const listeners = calculateListeners('spotify');
    const topSongs = getTopSongs('spotify', 10);
    const popularRelease = artistPickId 
        ? standaloneReleases.find(r => r?.id === artistPickId) 
        : getPopularRelease('spotify');

    return (
      <div className="bg-[#121212] text-white overflow-hidden relative min-h-screen flex flex-col font-sans selection:bg-[#1db954]/30 pb-20">
        
        {/* Header Hero */}
        <div className="h-[40vh] md:h-[50vh] relative flex flex-col justify-end p-6 md:p-12 overflow-hidden shrink-0">
           {gameState.artist.image ? (
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${gameState.artist.image})` }}></div>
           ) : (
              <div className="absolute inset-0 bg-[#282828] flex items-center justify-center">
                 <User className="w-32 h-32 text-white/10" />
              </div>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/50 to-transparent"></div>
           <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                  <div className="relative flex items-center justify-center w-[22px] h-[22px]">
                     <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] flex-shrink-0" fill="#4CB3FF">
                        <path d="M12 1L14.75 3.33L18.25 3.03L19.46 6.31L22.5 8.16L21.46 11.5L22.5 14.84L19.46 16.69L18.25 19.97L14.75 19.67L12 22L9.25 19.67L5.75 19.97L4.54 16.69L1.5 14.84L2.54 11.5L1.5 8.16L4.54 6.31L5.75 3.03L9.25 3.33L12 1Z"/>
                     </svg>
                     <svg viewBox="0 0 24 24" className="w-[14px] h-[14px] absolute text-[#121212] ml-[1px] mt-[1px]" strokeWidth="4" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                     </svg>
                  </div>
                  <span className="text-white text-sm">Verified Artist</span>
              </div>
              <h1 className="text-5xl md:text-8xl font-black mb-2 tracking-tighter">{gameState.artist.name}</h1>
              <p className="text-white/70 text-sm md:text-base font-medium">{listeners.toLocaleString('en-US')} monthly listeners</p>
           </div>
        </div>

        {/* Actions */}
        <div className="p-6 md:px-12 flex items-center gap-4 shrink-0">
           <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden shrink-0 hidden md:block">
              {gameState.artist.image ? <img src={gameState.artist.image || undefined} className="w-full h-full object-cover"/> : <User className="w-full h-full text-white/20" />}
           </div>
           <button className="border border-white/50 hover:border-white rounded-full px-4 py-1.5 text-xs font-bold transition-all text-white">Following</button>
           <MoreHorizontal className="text-white/60 w-6 h-6 shrink-0" />
           <div className="ml-auto flex items-center gap-6">
              <button className="w-14 h-14 bg-[#1db954] hover:scale-105 transition-transform rounded-full flex items-center justify-center shrink-0">
                 <Play className="w-6 h-6 text-black fill-current ml-1" />
              </button>
           </div>
        </div>

        {/* Popular Songs */}
        <div className="px-6 md:px-12 mt-4 shrink-0">
           <h2 className="text-xl font-bold mb-4">Popular</h2>
           <div className="flex flex-col gap-1 max-w-4xl">
              {(showAllTopSongs ? topSongs : topSongs.slice(0, 5)).map((song, i) => (
                 <div key={song.id} className="flex items-center gap-4 hover:bg-white/10 p-2 rounded-lg group cursor-pointer" onClick={() => handleSelectRelease(song)}>
                    <div className="w-6 text-center text-white/60 font-medium text-sm group-hover:hidden">{i + 1}</div>
                    <div className="w-6 text-center text-white hidden group-hover:block"><Play className="w-4 h-4 fill-current m-auto"/></div>
                    <div className="w-10 h-10 bg-[#282828] shrink-0">
                       {song.coverImage ? <img src={song.coverImage || undefined} className="w-full h-full object-cover" /> : <Disc className="w-5 h-5 text-white/20 m-auto mt-2.5" />}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                       <span className="text-white text-[15px]">{song.title}</span>
                    </div>
                    <span className="text-white/60 text-[13px] font-mono mr-4">{getPlatformStreams(song, 'spotify').toLocaleString('en-US')}</span>
                 </div>
              ))}
              {topSongs.length > 5 && (
                 <button className="text-white/60 text-[13px] font-bold hover:text-white mt-2 mb-2 pl-2 w-max" onClick={() => setShowAllTopSongs(!showAllTopSongs)}>
                    {showAllTopSongs ? "Show less" : "See more"}
                 </button>
              )}
           </div>
        </div>

        {/* Artist Pick */}
        <div className="px-6 md:px-12 mt-10 shrink-0">
           <div className="flex justify-between items-end mb-4 max-w-sm">
              <h2 className="text-xl font-bold">Artist Pick</h2>
              {standaloneReleases.length > 0 && (
                 <button className="text-white/60 text-[13px] font-bold hover:underline mb-[2px]" onClick={() => setIsSelectingPick(true)}>Edit</button>
              )}
           </div>
           {popularRelease && (
              <div className="flex gap-4 items-start max-w-sm cursor-pointer group" onClick={() => handleSelectRelease(popularRelease)}>
                 <div className="w-[84px] h-[84px] bg-[#282828] shrink-0 rounded-md overflow-hidden relative">
                    {popularRelease.coverImage ? <img src={popularRelease.coverImage || undefined} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <Disc className="w-8 h-8 text-white/20 m-auto mt-6" />}
                 </div>
                 <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                       <div className="w-5 h-5 rounded-full overflow-hidden bg-white/20 shrink-0">
                          {gameState.artist.image && <img src={gameState.artist.image || undefined} className="w-full h-full object-cover" />}
                       </div>
                       <span className="text-white/60 text-xs font-bold">Posted by {gameState.artist.name}</span>
                    </div>
                    <span className="text-white text-[15px] font-medium leading-tight group-hover:underline">{popularRelease.title}</span>
                    <span className="text-white/60 text-[13px] capitalize mt-1">{popularRelease.type}</span>
                 </div>
              </div>
           )}
        </div>

        {/* Popular Releases */}
        <div className="px-6 md:px-12 mt-12 shrink-0">
           <div className="flex justify-between items-end mb-4">
              <h2 className="text-xl font-bold">Popular releases</h2>
              <span className="text-white/60 text-[13px] font-bold hover:underline cursor-pointer" onClick={() => setShowAllDiscography(true)}>Show all</span>
           </div>
           
           <div className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar">
              {[...standaloneReleases].sort((a, b) => getPlatformStreams(b, 'spotify') - getPlatformStreams(a, 'spotify')).slice(0, 5).map((rel, i) => (
                <div key={rel.id} className="min-w-[140px] max-w-[140px] flex flex-col gap-3 group cursor-pointer" onClick={() => handleSelectRelease(rel)}>
                   <div className="w-full aspect-square bg-[#282828] rounded-md overflow-hidden relative">
                      {rel.coverImage ? <img src={rel.coverImage || undefined} className="w-full h-full object-cover" /> : <Disc className="w-12 h-12 text-white/20 m-auto mt-10" />}
                      <div className="absolute bottom-2 right-2 w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-xl">
                         <Play className="w-5 h-5 text-black fill-current ml-1" />
                      </div>
                   </div>
                   <div className="flex flex-col">
                       <span className="text-white font-bold text-[15px] truncate mt-1">{rel.title}</span>
                       <span className="text-white/60 text-[13px] capitalize truncate">{rel.type} • {new Date(rel.releaseDate!).getFullYear()}</span>
                   </div>
                </div>
              ))}
           </div>
           
           <div className="mt-8">
               <button onClick={() => setShowAllDiscography(true)} className="border border-white/30 hover:border-white hover:bg-white/5 rounded-full px-8 py-[10px] text-[13px] font-bold transition-all w-full md:w-auto min-w-[200px]">
                  See discography
               </button>
           </div>
        </div>

        {/* About */}
        <div className="px-6 md:px-12 mt-12 shrink-0 max-w-4xl">
           <h2 className="text-xl font-bold mb-4">About</h2>
           <div className="relative rounded-xl overflow-hidden cursor-pointer group aspect-[4/3] md:aspect-[21/9]">
               {gameState.artist.image ? (
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${gameState.artist.image})` }}></div>
               ) : (
                  <div className="absolute inset-0 bg-[#282828]"></div>
               )}
               <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
               <div className="absolute bottom-0 left-0 right-0 p-8 pt-24 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                   <p className="text-white text-[13px] font-bold mb-2 uppercase tracking-wide">#{Math.max(1, 1000 - gameState.artist.level * 10)} in the world</p>
                   <h3 className="text-4xl font-black mb-3">{gameState.artist.name}</h3>
                   <p className="text-white text-base mb-4">{listeners.toLocaleString('en-US')} monthly listeners</p>
                   <p className="text-white/80 text-sm line-clamp-3 leading-snug">
                     {gameState.artist.socialProfile?.bio || `Following the release of their recent projects, ${gameState.artist.name} connects with fans worldwide and continues to dominate the global charts.`}
                     <span className="text-white font-bold ml-1 hover:underline"> see all</span>
                   </p>
               </div>
           </div>
        </div>

        {/* All Discography Popup */}
        {showAllDiscography && (
           <div className="fixed inset-0 z-[350] bg-[#121212] overflow-y-auto">
              <div className="sticky top-0 bg-[#121212]/90 backdrop-blur z-20 flex flex-col p-4 border-b border-white/10">
                 <div className="flex items-center mb-4">
                    <button onClick={() => setShowAllDiscography(false)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                       <ChevronLeft className="w-8 h-8 text-white" />
                    </button>
                    <h1 className="text-xl font-bold ml-2">All discography</h1>
                 </div>
                 <div className="flex gap-3 px-2">
                    {['All', 'Albums', 'Singles'].map(filter => (
                       <button
                          key={filter}
                          onClick={() => setDiscoFilter(filter as any)}
                          className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${discoFilter === filter ? 'bg-white text-black' : 'bg-[#282828] text-white hover:bg-[#333]'}`}
                       >
                          {filter}
                       </button>
                    ))}
                 </div>
              </div>
              <div className="p-6 md:px-12 flex flex-col gap-6">
                 {standaloneReleases.slice().reverse().filter(rel => {
                    if (discoFilter === 'Albums') return ['Album', 'Deluxe Album'].includes(rel.type);
                    if (discoFilter === 'Singles') return ['EP', 'Single Pack', 'Single'].includes(rel.type);
                    return true;
                 }).map((rel, i) => (
                    <div key={rel.id} className="flex gap-4 items-center group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-lg" onClick={() => handleSelectRelease(rel)}>
                       <div className="w-20 h-20 bg-[#282828] rounded-md overflow-hidden relative shrink-0 shadow-lg">
                          {rel.coverImage ? <img src={rel.coverImage || undefined} className="w-full h-full object-cover" /> : <Disc className="w-10 h-10 text-white/20 m-auto mt-5" />}
                       </div>
                       <div className="flex flex-col flex-1">
                           <span className="text-white font-bold text-lg leading-tight">{rel.title}</span>
                           <span className="text-white/60 text-sm capitalize mt-1 border-b border-transparent">{rel.type} • {new Date(rel.releaseDate!).getFullYear()}</span>
                       </div>
                    </div>
                 ))}
                 {standaloneReleases.length === 0 && <p className="text-white/50">No releases yet.</p>}
              </div>
           </div>
        )}

        {/* Select Artist Pick Popup */}
        {isSelectingPick && (
           <div className="fixed inset-0 z-[360] bg-[#121212] overflow-y-auto">
              <div className="sticky top-0 bg-[#121212]/90 backdrop-blur z-20 flex items-center p-4 border-b border-white/10">
                 <button onClick={() => setIsSelectingPick(false)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                    <ChevronLeft className="w-8 h-8 text-white" />
                 </button>
                 <h1 className="text-xl font-bold ml-2">Select Artist Pick</h1>
              </div>
              <div className="p-6 md:px-12 flex flex-col gap-6">
                 {standaloneReleases.slice().reverse().map((rel) => (
                    <div key={rel.id} className="flex gap-4 items-center group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-lg" onClick={() => { setArtistPickId(rel.id); setIsSelectingPick(false); }}>
                       <div className="w-16 h-16 bg-[#282828] rounded-md overflow-hidden relative shrink-0 shadow-lg">
                          {rel.coverImage ? <img src={rel.coverImage || undefined} className="w-full h-full object-cover" /> : <Disc className="w-8 h-8 text-white/20 m-auto mt-4" />}
                       </div>
                       <div className="flex flex-col flex-1">
                           <span className="text-white font-bold text-base leading-tight">{rel.title}</span>
                           <span className="text-white/60 text-[13px] capitalize mt-1 border-b border-transparent">{rel.type}</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* Release Detail Popup (Spotify specific style) */}
        {selectedSpotifyRelease && (
           <div className="fixed inset-0 z-[400] bg-[#121212] overflow-y-auto">
              <div className="sticky top-0 bg-[#121212]/80 backdrop-blur z-20 flex items-center p-4">
                 <button onClick={() => setSelectedSpotifyRelease(null)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                    <ChevronLeft className="w-8 h-8 text-white" />
                 </button>
              </div>
              <div className="flex flex-col items-center pt-4 px-6 pb-24 md:max-w-2xl mx-auto">
                 <div className="w-56 h-56 md:w-64 md:h-64 shadow-[0_16px_40px_rgba(0,0,0,0.5)] mb-6 bg-[#282828] rounded overflow-hidden shadow-2xl">
                    {selectedSpotifyRelease.coverImage ? <img src={selectedSpotifyRelease.coverImage || undefined} className="w-full h-full object-cover" /> : <Disc className="w-20 h-20 text-white/20 m-auto mt-16 md:mt-20" />}
                 </div>
                 <h1 className="text-3xl font-black text-center mb-4">{selectedSpotifyRelease.title}</h1>
                 <div className="flex items-center gap-2 text-[13px] font-bold text-white/80 mb-6 w-full justify-center">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-white/20">
                       {gameState.artist.image && <img src={gameState.artist.image || undefined} className="w-full h-full object-cover" />}
                    </div>
                    <span className="hover:underline cursor-pointer">{getArtistStr(selectedSpotifyRelease)}</span>
                    <span className="text-white/40">•</span>
                    <span className="text-white/60 capitalize">{selectedSpotifyRelease.type}</span>
                    <span className="text-white/40">•</span>
                    <span className="text-white/60">{new Date(selectedSpotifyRelease.releaseDate!).getFullYear()}</span>
                 </div>
                 
                 <div className="flex justify-between items-center w-full mb-8">
                    <div className="flex gap-4">
                       <button className="w-14 h-14 bg-[#1db954] hover:scale-105 transition-transform rounded-full flex items-center justify-center shrink-0 shadow-xl">
                          <Play className="w-6 h-6 text-black fill-current ml-1" />
                       </button>
                    </div>
                 </div>

                 {/* Tracklist */}
                 <div className="w-full flex flex-col gap-1">
                    {(['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(selectedSpotifyRelease.type) 
                      ? (selectedSpotifyRelease as Album).trackIds.map(tid => gameState.releases.find(r => r?.id === tid)) 
                      : [selectedSpotifyRelease]).map((t, i) => t && (
                       <div key={t.id || i} className="flex items-center justify-between py-2 px-2 hover:bg-white/10 rounded-md group cursor-pointer transition-colors">
                          <div className="flex items-center gap-4">
                             <div className="flex flex-col">
                                <span className="text-white text-base group-hover:underline">{t.title}</span>
                                <div className="flex items-center gap-2 text-white/60 text-sm mt-0.5 font-bold">
                                    {(t as Song).isBSide === false && <span className="bg-white/30 text-black text-[9px] px-1 rounded-sm uppercase tracking-widest font-black inline-block -mt-0.5 pb-px">E</span>}
                                    <span className="font-mono">{getPlatformStreams(t, 'spotify').toLocaleString('en-US')}</span>
                                </div>
                             </div>
                          </div>
                          <span className="text-white/40 text-sm font-medium mr-2">3:{(Math.floor(Math.random() * 40) + 10)}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}
      </div>
    );
  };

  const handleSelectAppleRelease = (rel: Release) => {
     if (rel.type === 'Single' && (rel as Song).isBSide) {
        const album = projects.find(a => (a as Album).trackIds.includes(rel.id));
        if (album) {
           setSelectedAppleRelease(album);
           return;
        }
     }
     setSelectedAppleRelease(rel);
  };

  const renderAppleMusic = () => {
    const rawAm = 0.50 * (1 + ((gameState.popularity.america || 0) / 100));
    const rawEu = 0.35 * (1 + ((gameState.popularity.europe || 0) / 100));
    const rawLa = 0.15 * (1 + ((gameState.popularity.latinAmerica || 0) / 100));
    const totalRaw = rawAm + rawEu + rawLa;
    const amPerc = rawAm / totalRaw;
    const euPerc = rawEu / totalRaw;
    const laPerc = rawLa / totalRaw;

    const topSongs = getTopSongs('appleMusic', 5);
    const appleAlbums = albums.slice().reverse();
    const appleSingles = singlesAndEPs.slice().reverse();

    const currentWeekNumber = Math.max(1, Math.floor(gameState.time.daysPassed / 7)); 
    const currentWeekFluctuation = 1 + (Math.sin(currentWeekNumber / 10) * 0.05);
    const pName = gameState.artist?.name || '';
    const npcSingles = generateNPCSongs(currentWeekFluctuation, currentWeekNumber, pName);
    const npcAlbums = generateNPCAlbums(currentWeekFluctuation, currentWeekNumber, pName);

    const currentDateObj = new Date(gameState.time.startDate);
    currentDateObj.setDate(currentDateObj.getDate() + gameState.time.daysPassed);
    const currentDateStr = currentDateObj.toISOString();

    const getAppleSongsChart = (region: 'global' | 'america' | 'europe' | 'latin_america') => {
        const playerItems = songs.map(s => {
            const age = Math.max(1, Math.floor((currentDateObj.getTime() - new Date(s.releaseDate || currentDateStr).getTime()) / (1000 * 3600 * 24)));
            let streams = s.lastDailyStreams?.appleMusic || ((getPlatformStreams(s, 'appleMusic') / age) || 0);
            let val = streams;
            if (region === 'america') val = Math.floor(streams * amPerc) || 0;
            if (region === 'europe') val = Math.floor(streams * euPerc) || 0;
            if (region === 'latin_america') val = Math.floor(streams * laPerc) || 0;
            return { song: s, streams: val, artist: getArtistStr(s), isPlayer: true };
        });

        const npcItems = npcSingles.map(npc => {
            const hash = (npc.title.charCodeAt(0) || 0) + (npc.artist.charCodeAt(0) || 0);
            const platformMulti = 0.5 + (((hash * 3) % 13) / 10);
            let streams = Math.floor(npc.points * 6 * platformMulti); 
            
            const amFactor = 0.5 + ((hash % 11) / 10);
            const euFactor = 0.5 + (((hash + 3) % 11) / 10);
            const laFactor = 0.5 + (((hash + 7) % 11) / 10);
            const totalFactor = (amFactor * 0.5) + (euFactor * 0.35) + (laFactor * 0.15);

            let val = streams;
            if (region === 'america') val = Math.floor(streams * (amFactor * 0.5 / totalFactor));
            if (region === 'europe') val = Math.floor(streams * (euFactor * 0.35 / totalFactor));
            if (region === 'latin_america') val = Math.floor(streams * (laFactor * 0.15 / totalFactor));
            return { song: npc, streams: val, artist: npc.artist, isPlayer: false };
        });

        return [...playerItems, ...npcItems].sort((a,b) => b.streams - a.streams).slice(0, 100);
    };

    const globalAlbumsList = projects.map(p => {
        const age = Math.max(1, Math.floor((currentDateObj.getTime() - new Date(p.releaseDate || currentDateStr).getTime()) / (1000 * 3600 * 24)));
        let streams = p.lastDailyStreams?.appleMusic || ((getPlatformStreams(p, 'appleMusic') / Math.max(1, age * 0.8)) || 0);
        return { album: p, streams, artist: getArtistStr(p), isPlayer: true };
    });
    
    const npcAlbumsList = npcAlbums.map(npc => {
        const hash = (npc.title.charCodeAt(0) || 0) + (npc.artist.charCodeAt(0) || 0);
        const platformMulti = 0.5 + (((hash * 3) % 13) / 10);
        let streams = Math.floor(npc.points * 4 * platformMulti); 
        return { album: npc, streams, artist: npc.artist, isPlayer: false };
    });

    const combinedAlbumsList = [...globalAlbumsList, ...npcAlbumsList].sort((a,b) => b.streams - a.streams).slice(0, 200);

    return (
      <div className="bg-white text-black min-h-screen flex flex-col font-sans selection:bg-[#fa243c]/10 pb-32 relative">
        {appleMusicTab === 'profile' ? (
        <>
            <div className="h-[35rem] relative flex flex-col justify-end p-8 md:p-24 overflow-hidden shrink-0">
               {gameState.artist.image ? <img src={gameState.artist.image || undefined} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 bg-zinc-100" />}
               <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent z-10" />
               <div className="relative z-20 w-full max-w-7xl mx-auto text-left">
                  <span className="text-red-500 font-black uppercase text-[10px] tracking-[0.2em] mb-4 block">Artist Profile</span>
                  <h1 className="text-7xl md:text-[8rem] font-black tracking-tighter leading-none mb-8">{gameState.artist.name}</h1>
                  <div className="flex gap-4">
                     <button className="bg-[#fa243c] text-white px-10 py-4 rounded-xl font-black text-sm uppercase flex items-center gap-3 hover:scale-105 transition-transform"><Play className="w-5 h-5 fill-current" /> Play</button>
                     <button className="bg-zinc-100 px-10 py-4 rounded-xl font-black text-sm uppercase flex items-center gap-3 hover:bg-zinc-200 transition-colors"><Heart className="w-5 h-5" /> Library</button>
                  </div>
               </div>
            </div>

            <div className="max-w-7xl mx-auto w-full p-8 md:p-24 text-left pt-0 md:pt-0 pb-12">
               <div className="flex justify-between items-end border-b border-zinc-100 pb-4 mb-8">
                  <h2 className="text-3xl font-black">Top Songs</h2>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                  {topSongs.map((song, i) => (
                     <div key={song.id} className="flex items-center gap-4 py-3 group cursor-pointer border-b border-zinc-50 hover:bg-zinc-50 px-4 rounded-lg transition-colors" onClick={() => handleSelectAppleRelease(song)}>
                        <span className="w-4 text-zinc-300 font-bold">{i+1}</span>
                        <div className="w-12 h-12 bg-zinc-100 rounded-lg overflow-hidden shrink-0">{song.coverImage ? <img src={song.coverImage || undefined} className="w-full h-full object-cover" /> : <Disc className="m-auto mt-3 text-zinc-300" />}</div>
                        <div className="flex-1 flex flex-col">
                           <span className="font-bold text-base leading-tight group-hover:text-[#fa243c] transition-colors">{song.title}</span>
                        </div>
                        <MoreHorizontal className="text-zinc-300 group-hover:text-red-500 transition-colors" />
                     </div>
                  ))}
               </div>
            </div>

            {appleAlbums.length > 0 && (
               <div className="max-w-7xl mx-auto w-full px-8 md:px-24 text-left pb-12">
                  <div className="flex justify-between items-end border-b border-zinc-100 pb-4 mb-8">
                     <h2 className="text-3xl font-black">Albums</h2>
                     <button className="text-[#fa243c] font-bold text-sm tracking-wide uppercase group flex items-center hover:opacity-80 transition-opacity" onClick={() => setShowAllAppleDiscography(true)}>
                        See All <ChevronRight className="w-4 h-4 ml-1" />
                     </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                     {appleAlbums.slice(0, 5).map(album => (
                        <div key={album.id} className="flex flex-col group cursor-pointer" onClick={() => handleSelectAppleRelease(album)}>
                           <div className="w-full aspect-square bg-zinc-100 rounded-xl overflow-hidden mb-3 shadow-[0_4px_12px_rgba(0,0,0,0.05)] shadow-zinc-200">
                              {album.coverImage ? <img src={album.coverImage || undefined} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <Disc className="w-16 h-16 text-zinc-300 m-auto mt-12" />}
                           </div>
                           <span className="font-bold text-[15px] leading-tight truncate">{album.title}</span>
                           <span className="text-zinc-500 text-[13px] mt-0.5">{new Date(album.releaseDate!).getFullYear()}</span>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {appleSingles.length > 0 && (
               <div className="max-w-7xl mx-auto w-full px-8 md:px-24 text-left pb-12">
                  <div className="flex justify-between items-end border-b border-zinc-100 pb-4 mb-8">
                     <h2 className="text-3xl font-black">Singles & EPs</h2>
                     <button className="text-[#fa243c] font-bold text-sm tracking-wide uppercase group flex items-center hover:opacity-80 transition-opacity" onClick={() => setShowAllAppleDiscography(true)}>
                        See All <ChevronRight className="w-4 h-4 ml-1" />
                     </button>
                  </div>
                  <div className="flex overflow-x-auto pb-6 gap-6 hide-scrollbar -mx-8 px-8 md:-mx-24 md:px-24">
                     {appleSingles.map(single => (
                        <div key={single.id} className="flex flex-col min-w-[150px] max-w-[150px] group cursor-pointer" onClick={() => handleSelectAppleRelease(single)}>
                           <div className="w-full aspect-square bg-zinc-100 rounded-xl overflow-hidden mb-3 shadow-[0_4px_12px_rgba(0,0,0,0.05)] shadow-zinc-200">
                              {single.coverImage ? <img src={single.coverImage || undefined} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <Disc className="w-12 h-12 text-zinc-300 m-auto mt-10" />}
                           </div>
                           <span className="font-bold text-[15px] leading-tight truncate">{single.title}</span>
                           <span className="text-zinc-500 text-[13px] mt-0.5">{new Date(single.releaseDate!).getFullYear()}</span>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* About Section */}
            <div className="max-w-7xl mx-auto w-full px-8 md:px-24 text-left pb-12">
               <h2 className="text-3xl font-black mb-8 border-b border-zinc-100 pb-4">About</h2>
               <div className="bg-zinc-50 rounded-2xl p-8 md:p-12 relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-10 bg-cover bg-center mix-blend-multiply blur-xl scale-110 transition-transform duration-1000 group-hover:scale-125" style={{ backgroundImage: gameState.artist.image ? `url(${gameState.artist.image})` : 'none' }}></div>
                  <div className="relative z-10">
                     <h3 className="text-4xl font-black mb-4 tracking-tighter">{gameState.artist.name}</h3>
                     <p className="text-zinc-600 text-lg leading-relaxed max-w-3xl">
                         {gameState.artist.socialProfile?.bio || `A trailblazing artist from ${gameState.artist.country}, ${gameState.artist.name} has captured the attention of listeners around the world. With multiple chart-topping hits and an ever-growing fanbase, their unique sound continues to evolve and inspire.`}
                     </p>
                     <div className="mt-8 flex gap-8">
                         <div>
                             <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Hometown</p>
                             <p className="font-bold">{gameState.artist.country}</p>
                         </div>
                     </div>
                  </div>
               </div>
            </div>
        </>
        ) : (
        <>
           <div className="max-w-7xl mx-auto w-full p-8 md:p-24 text-left pb-12">
              <h1 className="text-5xl font-black tracking-tighter mb-4 mt-8">Charts</h1>
              <p className="text-xl text-zinc-500 font-medium mb-12 border-b border-zinc-100 pb-6">See what's popular locally and globally on Apple Music.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                 {[
                    { id: 'global_song', name: 'Top 100: Global', desc: 'The most-played songs around the world', color: 'from-[#fa243c] to-[#d81e32]' },
                    { id: 'global_album', name: 'Top 200: Albums', desc: 'The most popular albums globally', color: 'from-orange-500 to-red-600' },
                    { id: 'america', name: 'Top 100: America', desc: 'The most-played songs in America', color: 'from-blue-500 to-indigo-600' },
                    { id: 'europe', name: 'Top 100: Europe', desc: 'The most-played songs in Europe', color: 'from-emerald-400 to-teal-500' },
                    { id: 'latin_america', name: 'Top 100: Latin America', desc: 'The most-played songs in Latin America', color: 'from-yellow-400 to-orange-500' }
                 ].map(chart => (
                    <div 
                       key={chart.id} 
                       onClick={() => setAppleMusicChart(chart.id as any)}
                       className={`rounded-2xl p-6 text-white cursor-pointer hover:scale-105 transition-transform bg-gradient-to-br ${chart.color} shadow-lg shadow-zinc-200 flex flex-col justify-between min-h-[160px]`}
                    >
                       <div>
                          <span className="uppercase text-[10px] font-black tracking-[0.2em] opacity-80 mb-2 block">Apple Music</span>
                          <h3 className="text-2xl font-black leading-tight mb-2">{chart.name}</h3>
                       </div>
                       <p className="text-sm font-medium opacity-90">{chart.desc}, updated every day.</p>
                    </div>
                 ))}
              </div>
           </div>
        </>
        )}

        {/* View Chart Overlay */}
        {appleMusicChart && (
           <div className="fixed inset-0 z-[500] bg-white overflow-y-auto">
              <div dangerouslySetInnerHTML={{__html:`<style>.am-bg-gradient { background: linear-gradient(to bottom, #d81e32 0%, #a81c2f 30%, #7b1222 100%); }</style>`}} />
              <div className="min-h-full flex flex-col am-bg-gradient text-white">
                 <div className="sticky top-0 z-20 flex items-center justify-between p-4 px-6">
                    <button onClick={() => setAppleMusicChart(null)} className="flex items-center text-white font-bold hover:opacity-70 transition-opacity bg-white/20 p-2 rounded-full backdrop-blur-md">
                       <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button className="flex items-center text-white hover:opacity-70 transition-opacity bg-white/20 p-2 rounded-full backdrop-blur-md">
                       <MoreHorizontal className="w-6 h-6" />
                    </button>
                 </div>
                 
                 <div className="flex flex-col items-center text-center px-6 pt-8 pb-12">
                    <h1 className="text-4xl font-black mb-2">{
                       appleMusicChart === 'global_song' ? 'Top 100: Global' :
                       appleMusicChart === 'global_album' ? 'Top 200: Albums' :
                       appleMusicChart === 'america' ? 'Top 100: America' :
                       appleMusicChart === 'europe' ? 'Top 100: Europe' :
                       'Top 100: Latin America'
                    }</h1>
                    <p className="text-white/80 font-medium text-xl mb-2">Apple Music</p>
                    <p className="text-white/60 text-sm mb-8">Updated today</p>
                    <button className="bg-white text-[#d81e32] px-16 py-4 rounded-full font-black text-lg uppercase flex items-center gap-3 hover:scale-105 transition-transform shadow-xl">
                       <Play className="w-5 h-5 fill-current" /> Play
                    </button>
                    <p className="text-white/80 text-sm mt-8 max-w-sm">
                       The {appleMusicChart === 'global_album' ? 'most popular albums' : 'most-played songs'} {['global_song', 'global_album'].includes(appleMusicChart) ? 'around the world' : `in ${appleMusicChart === 'america' ? 'America' : appleMusicChart === 'europe' ? 'Europe' : 'Latin America'}`}, updated every day.
                    </p>
                 </div>

                 <div className="w-full max-w-4xl mx-auto px-4 md:px-8 pb-24">
                    {appleMusicChart === 'global_album' ? (
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                           {combinedAlbumsList.map((item, i) => (
                              <div key={item.album.id} className="flex flex-col group cursor-pointer" onClick={() => { setAppleMusicChart(null); if(item.isPlayer) setSelectedAppleRelease(item.album); }}>
                                 <div className="w-full aspect-square bg-white/5 rounded-xl overflow-hidden mb-3 relative border border-white/10">
                                    {item.album.coverImage ? <img src={item.album.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <Disc className="w-16 h-16 text-white/30 m-auto mt-12" />}
                                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-xs font-bold">{i+1}</div>
                                 </div>
                                 <span className="font-bold text-[15px] leading-tight truncate">{item.album.title}</span>
                                 <span className="text-white/60 text-[13px]">{item.artist}</span>
                              </div>
                           ))}
                       </div>
                    ) : (
                       <div className="flex flex-col border-t border-white/10">
                           {getAppleSongsChart(appleMusicChart as any).map((item, i) => (
                              <div key={item.song.id} className="flex items-center gap-4 py-3 border-b border-white/10 hover:bg-white/5 px-2 -mx-2 rounded-lg transition-colors cursor-pointer" onClick={() => { setAppleMusicChart(null); if(item.isPlayer) handleSelectAppleRelease(item.song); }}>
                                 <div className="w-12 h-12 bg-white/5 rounded object-cover shrink-0 overflow-hidden relative">
                                    {item.song.coverImage ? <img src={item.song.coverImage} className="w-full h-full object-cover" /> : <Disc className="m-auto mt-3 text-white/30" />}
                                 </div>
                                 <span className="w-6 font-bold text-lg text-white/60 shrink-0 text-center">{i+1}</span>
                                 <div className="flex-1 flex flex-col overflow-hidden">
                                    <span className="font-bold text-lg leading-tight truncate">{item.song.title}</span>
                                    <span className="text-white/60 text-sm truncate">{item.artist}</span>
                                 </div>
                                 <MoreHorizontal className="text-white/40 group-hover:text-white shrink-0" />
                              </div>
                           ))}
                       </div>
                    )}
                 </div>
              </div>
           </div>
        )}

        {/* Detail Popup Form */}
        {selectedAppleRelease && (
           <div className="fixed inset-0 z-[500] bg-white/95 backdrop-blur-xl overflow-y-auto">
              <div className="sticky top-0 z-20 flex items-center justify-between p-4 px-6 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
                 <button onClick={() => setSelectedAppleRelease(null)} className="flex items-center text-[#fa243c] font-bold text-lg hover:opacity-70 transition-opacity">
                    <ChevronLeft className="w-6 h-6 mr-1" />
                    Back
                 </button>
              </div>
              <div className="w-full max-w-5xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12 items-start">
                 <div className="w-full max-w-xs mx-auto md:max-w-none md:mx-0 md:w-80 shrink-0 md:sticky md:top-32 flex flex-col pt-4 md:pt-0">
                    <div className="w-full aspect-square bg-zinc-100 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] mb-6 border border-zinc-200/50">
                       {selectedAppleRelease.coverImage ? <img src={selectedAppleRelease.coverImage || undefined} className="w-full h-full object-cover" /> : <Disc className="w-24 h-24 text-zinc-300 m-auto mt-20 md:mt-28" />}
                    </div>
                    <h1 className="text-2xl font-black leading-tight mb-2">{selectedAppleRelease.title}</h1>
                    <p className="text-[#fa243c] text-xl font-semibold mb-1 cursor-pointer hover:underline">{getArtistStr(selectedAppleRelease)}</p>
                    <p className="text-zinc-500 font-medium text-sm mb-6 uppercase tracking-wider">{selectedAppleRelease.type} • {new Date(selectedAppleRelease.releaseDate!).getFullYear()}</p>
                    
                    <button className="w-full bg-[#fa243c] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#d81e32] transition-colors shadow-lg shadow-red-500/20">
                       <Play className="w-5 h-5 fill-current" />
                       Play
                    </button>
                 </div>
                 
                 <div className="flex-1 w-full pt-2">
                    <h3 className="text-xl font-bold border-b border-zinc-200 pb-4 mb-4">Tracks</h3>
                    <div className="flex flex-col">
                       {(['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(selectedAppleRelease.type) 
                         ? (selectedAppleRelease as Album).trackIds.map(tid => gameState.releases.find(r => r?.id === tid)) 
                         : [selectedAppleRelease]).map((t, i) => t && (
                          <div key={t.id || i} className="flex items-center justify-between py-3.5 border-b border-zinc-100 group">
                             <div className="flex items-center gap-4">
                                <span className="w-6 text-right text-zinc-400 font-bold group-hover:hidden">{i + 1}</span>
                                <span className="w-6 hidden group-hover:flex items-center justify-end"><Play className="w-4 h-4 fill-zinc-400 text-zinc-400"/></span>
                                <div className="flex flex-col">
                                   <span className="font-semibold text-zinc-900 leading-tight">{t.title}</span>
                                   {(t as Song).isBSide === false && <span className="text-zinc-400 text-[10px] uppercase font-black tracking-widest mt-0.5"><span className="bg-zinc-200 text-zinc-600 px-1 rounded-sm mr-1.5">E</span>Explicit</span>}
                                </div>
                             </div>
                             <MoreHorizontal className="text-zinc-300 group-hover:text-[#fa243c] cursor-pointer transition-colors" />
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* All Discography Popup */}
        {showAllAppleDiscography && (
           <div className="fixed inset-0 z-[400] bg-white overflow-y-auto">
              <div className="sticky top-0 z-20 flex items-center justify-between p-4 px-6 border-b border-zinc-200 bg-white/90 backdrop-blur-md">
                 <div className="flex flex-col">
                    <button onClick={() => setShowAllAppleDiscography(false)} className="flex items-center text-[#fa243c] font-bold text-lg hover:opacity-70 transition-opacity mb-2">
                       <ChevronLeft className="w-6 h-6 mr-1" />
                       Back
                    </button>
                    <h1 className="text-3xl font-black">All Releases</h1>
                 </div>
                 <div className="flex gap-2">
                    {['All', 'Albums', 'Singles'].map(filter => (
                       <button
                          key={filter}
                          onClick={() => setDiscoFilter(filter as any)}
                          className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${discoFilter === filter ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                       >
                          {filter}
                       </button>
                    ))}
                 </div>
              </div>
              <div className="w-full max-w-7xl mx-auto p-8 md:p-12">
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-12">
                    {standaloneReleases.slice().reverse().filter(rel => {
                       if (discoFilter === 'Albums') return rel.type === 'Album';
                       if (discoFilter === 'Singles') return rel.type === 'Single';
                       return true;
                    }).map(rel => (
                       <div key={rel.id} className="flex flex-col group cursor-pointer" onClick={() => handleSelectAppleRelease(rel)}>
                          <div className="w-full aspect-square bg-zinc-100 rounded-xl overflow-hidden mb-3 shadow-[0_4px_12px_rgba(0,0,0,0.05)] shadow-zinc-200 border border-zinc-100">
                             {rel.coverImage ? <img src={rel.coverImage || undefined} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <Disc className="w-16 h-16 text-zinc-300 m-auto mt-12" />}
                          </div>
                          <span className="font-bold text-[15px] leading-tight truncate">{rel.title}</span>
                          <span className="text-zinc-500 text-[13px] capitalize mt-0.5">{rel.type} • {new Date(rel.releaseDate!).getFullYear()}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-md border-t border-zinc-200 z-[300] flex justify-around items-center px-4 md:px-24">
           <button 
              onClick={() => setAppleMusicTab('profile')} 
              className={`flex flex-col items-center justify-center w-24 gap-1 ${appleMusicTab === 'profile' ? 'text-[#fa243c]' : 'text-zinc-400 hover:text-zinc-600'}`}
           >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              <span className="text-[10px] font-semibold">Profile</span>
           </button>
           <button 
              onClick={() => setAppleMusicTab('charts')} 
              className={`flex flex-col items-center justify-center w-24 gap-1 ${appleMusicTab === 'charts' ? 'text-[#fa243c]' : 'text-zinc-400 hover:text-zinc-600'}`}
           >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11V3H8v6H2v12h20V11h-6zm-6-6h4v14h-4V5zm-6 6h4v8H4v-8zm16 8h-4v-6h4v6z"/></svg>
              <span className="text-[10px] font-semibold">Charts</span>
           </button>
        </div>
      </div>
    );
  };

  const renderAmazonMusic = () => {
    const topSongs = getTopSongs('amazonMusic', 10);
    const amazonAlbums = [...albums].sort((a, b) => getPlatformStreams(b, 'amazonMusic') - getPlatformStreams(a, 'amazonMusic'));
    const amazonSingles = [...singlesAndEPs].sort((a, b) => new Date(b.releaseDate!).getTime() - new Date(a.releaseDate!).getTime()).reverse();
    const highlightRelease = amazonHighlightId ? publishedReleases.find(r => r?.id === amazonHighlightId) : getPopularRelease('amazonMusic');
    const followersText = Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short", maximumFractionDigits: 1 }).format(calculateListeners('amazonMusic'));

    const rawAm = 0.50 * (1 + ((gameState.popularity.america || 0) / 100));
    const rawEu = 0.35 * (1 + ((gameState.popularity.europe || 0) / 100));
    const rawLa = 0.15 * (1 + ((gameState.popularity.latinAmerica || 0) / 100));
    const totalRaw = rawAm + rawEu + rawLa;
    const amPerc = rawAm / totalRaw;
    const euPerc = rawEu / totalRaw;
    const laPerc = rawLa / totalRaw;

    const currentWeekNumber = Math.max(1, Math.floor(gameState.time.daysPassed / 7)); 
    const currentWeekFluctuation = 1 + (Math.sin(currentWeekNumber / 10) * 0.05);
    const pName = gameState.artist?.name || '';
    const npcSingles = generateNPCSongs(currentWeekFluctuation, currentWeekNumber, pName);
    const npcAlbums = generateNPCAlbums(currentWeekFluctuation, currentWeekNumber, pName);

    const currentDateObj = new Date(gameState.time.startDate);
    currentDateObj.setDate(currentDateObj.getDate() + gameState.time.daysPassed);
    const currentDateStr = currentDateObj.toISOString();

    const getAmazonSongsChart = (region: 'global' | 'america' | 'europe' | 'latin_america') => {
        const playerItems = songs.map(s => {
            const age = Math.max(1, Math.floor((currentDateObj.getTime() - new Date(s.releaseDate || currentDateStr).getTime()) / (1000 * 3600 * 24)));
            let streams = s.lastDailyStreams?.amazonMusic || ((getPlatformStreams(s, 'amazonMusic') / age) || 0);
            let val = streams;
            if (region === 'america') val = Math.floor(streams * amPerc) || 0;
            if (region === 'europe') val = Math.floor(streams * euPerc) || 0;
            if (region === 'latin_america') val = Math.floor(streams * laPerc) || 0;
            return { song: s, streams: val, artist: getArtistStr(s), isPlayer: true };
        });

        const npcItems = npcSingles.map(npc => {
            const hash = (npc.title.charCodeAt(0) || 0) + (npc.artist.charCodeAt(0) || 0);
            const platformMulti = 0.5 + (((hash * 7) % 13) / 10);
            let streams = Math.floor(npc.points * 5 * platformMulti); 
            
            const amFactor = 0.5 + ((hash % 11) / 10);
            const euFactor = 0.5 + (((hash + 3) % 11) / 10);
            const laFactor = 0.5 + (((hash + 7) % 11) / 10);
            const totalFactor = (amFactor * 0.5) + (euFactor * 0.35) + (laFactor * 0.15);

            let val = streams;
            if (region === 'america') val = Math.floor(streams * (amFactor * 0.5 / totalFactor));
            if (region === 'europe') val = Math.floor(streams * (euFactor * 0.35 / totalFactor));
            if (region === 'latin_america') val = Math.floor(streams * (laFactor * 0.15 / totalFactor));
            return { song: npc, streams: val, artist: npc.artist, isPlayer: false };
        });

        return [...playerItems, ...npcItems].sort((a,b) => b.streams - a.streams).slice(0, 100);
    };

    const globalAlbumsList = projects.map(p => {
        const age = Math.max(1, Math.floor((currentDateObj.getTime() - new Date(p.releaseDate || currentDateStr).getTime()) / (1000 * 3600 * 24)));
        let streams = p.lastDailyStreams?.amazonMusic || ((getPlatformStreams(p, 'amazonMusic') / Math.max(1, age * 0.8)) || 0);
        return { album: p, streams, artist: getArtistStr(p), isPlayer: true };
    });
    
    const npcAlbumsList = npcAlbums.map(npc => {
        const hash = (npc.title.charCodeAt(0) || 0) + (npc.artist.charCodeAt(0) || 0);
        const platformMulti = 0.5 + (((hash * 7) % 13) / 10);
        let streams = Math.floor(npc.points * 3.5 * platformMulti); 
        return { album: npc, streams, artist: npc.artist, isPlayer: false };
    });

    const combinedAlbumsList = [...globalAlbumsList, ...npcAlbumsList].sort((a,b) => b.streams - a.streams).slice(0, 200);

    return (
      <div className="bg-[#000000] text-white min-h-screen font-sans pb-32 relative">
         {amazonMusicTab === 'profile' ? (
         <>
            {/* Hero Background */}
            <div className="relative h-[28rem] md:h-[32rem]">
            {gameState.artist.image ? (
               <div className="absolute inset-0 bg-cover bg-top" style={{ backgroundImage: `url(${gameState.artist.image})` }}></div>
            ) : (
               <div className="absolute inset-0 bg-zinc-800"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#004751]/80 via-transparent to-transparent opacity-80"></div>
            
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-left z-10">
               <p className="text-[#00e0ff] font-bold uppercase text-xs tracking-widest mb-2">Artist</p>
               <h1 className="text-5xl md:text-7xl font-black mb-2">{gameState.artist.name}</h1>
               <p className="text-white/70 font-medium text-sm mb-6">{followersText} Followers</p>
               
               <div className="flex items-center gap-4">
                  <button className="w-14 h-14 bg-[#00e0ff] hover:scale-105 transition-transform rounded-full flex items-center justify-center shrink-0">
                     <Play className="w-6 h-6 text-black fill-current ml-1" />
                  </button>
                  <button className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                     <Share2 className="w-5 h-5" />
                  </button>
               </div>
            </div>
         </div>

         {/* Highlights Section */}
         {highlightRelease && (
            <div className="px-6 md:px-12 mt-8 text-left">
               <div className="flex justify-between items-end mb-4">
                  <h2 className="text-2xl font-black">Highlights</h2>
                  {publishedReleases.length > 0 && (
                     <button className="text-white/60 text-[13px] font-bold hover:underline mb-1" onClick={() => setIsSelectingAmazonHighlight(true)}>Edit</button>
                  )}
               </div>
               <div className="flex items-center gap-4 bg-transparent group cursor-pointer w-max max-w-full pr-4" onClick={() => handleSelectAmazonRelease(highlightRelease)}>
                  <div className="w-24 h-24 bg-zinc-800 rounded-md overflow-hidden shrink-0 shadow-lg">
                     {highlightRelease.coverImage ? <img src={highlightRelease.coverImage || undefined} className="w-full h-full object-cover" /> : <Disc className="w-10 h-10 text-white/20 m-auto mt-7" />}
                  </div>
                  <div className="flex flex-col truncate">
                     <span className="font-bold text-lg mb-1 truncate">{highlightRelease.title}</span>
                     <span className="text-white/60 text-sm truncate">{getArtistStr(highlightRelease)}, {new Date(highlightRelease.releaseDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <button className="ml-4 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white shrink-0">
                     <Plus className="w-6 h-6" />
                  </button>
               </div>
            </div>
         )}
         
         {/* Releases (Singles) Section */}
         {amazonSingles.length > 0 && (
            <div className="pl-6 md:pl-12 mt-10 text-left">
               <div className="flex justify-between items-center pr-6 md:pr-12 mb-4">
                  <h2 className="text-2xl font-black">Singles & EPs</h2>
                  <button className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold uppercase transition-colors" onClick={() => setShowAllAmazonDiscography(true)}>See All</button>
               </div>
               <div className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar">
                  {amazonSingles.slice(0, 10).map((single, i) => (
                     <div key={single.id} className="min-w-[140px] max-w-[140px] flex flex-col gap-2 group cursor-pointer" onClick={() => handleSelectAmazonRelease(single)}>
                        <div className="w-full aspect-square bg-zinc-800 rounded-md overflow-hidden">
                           {single.coverImage ? <img src={single.coverImage || undefined} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <Disc className="w-12 h-12 text-white/20 m-auto mt-10" />}
                        </div>
                        <div className="flex flex-col mt-1">
                           <span className="font-bold text-[15px] truncate">{single.title}</span>
                           <span className="text-white/60 text-[13px] truncate">{single.type} • {new Date(single.releaseDate!).getFullYear()}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* Top Songs Section */}
         {topSongs.length > 0 && (
            <div className="pl-6 md:pl-12 mt-10 text-left">
               <div className="flex justify-between items-center pr-6 md:pr-12 mb-4">
                  <h2 className="text-2xl font-black">Top Songs</h2>
                  <button className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold uppercase transition-colors" onClick={() => setShowAllAmazonDiscography(true)}>See All</button>
               </div>
               <div className="flex flex-col md:flex-row overflow-x-auto pb-6 gap-x-4 gap-y-0 hide-scrollbar" style={{ display: 'grid', gridTemplateRows: 'repeat(3, auto)', gridAutoFlow: 'column', gridAutoColumns: '300px' }}>
                  {topSongs.map((song, i) => (
                     <div key={song.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-md cursor-pointer group" onClick={() => handleSelectAmazonRelease(song)}>
                        <div className="w-14 h-14 bg-zinc-800 rounded-md overflow-hidden shrink-0">
                           {song.coverImage ? <img src={song.coverImage || undefined} className="w-full h-full object-cover" /> : <Disc className="w-6 h-6 text-white/20 m-auto mt-4" />}
                        </div>
                        <div className="flex flex-col flex-1 truncate">
                           <span className="font-bold text-[15px] truncate">{i + 1}. {song.title}</span>
                           <span className="text-white/60 text-[13px] truncate">{getArtistStr(song)}</span>
                        </div>
                        <button className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white shrink-0 group-hover:opacity-100 opacity-60">
                           <Plus className="w-5 h-5" />
                        </button>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* Top Albums Section */}
         {amazonAlbums.length > 0 && (
            <div className="pl-6 md:pl-12 mt-6 text-left">
               <div className="flex justify-between items-center pr-6 md:pr-12 mb-4">
                  <h2 className="text-2xl font-black">Top Albums</h2>
                  <button className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold uppercase transition-colors" onClick={() => setShowAllAmazonDiscography(true)}>See All</button>
               </div>
               <div className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar">
                  {amazonAlbums.slice(0, 5).map((album, i) => (
                     <div key={album.id} className="min-w-[140px] max-w-[140px] flex flex-col gap-2 group cursor-pointer" onClick={() => handleSelectAmazonRelease(album)}>
                        <div className="w-full aspect-square bg-zinc-800 rounded-md overflow-hidden relative">
                           {album.coverImage ? <img src={album.coverImage || undefined} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <Disc className="w-12 h-12 text-white/20 m-auto mt-10" />}
                        </div>
                        <div className="flex flex-col mt-1">
                           <span className="font-bold text-[15px] truncate">{i + 1}. {album.title}</span>
                           <span className="text-white/60 text-[13px] truncate">Album • {new Date(album.releaseDate!).getFullYear()}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* About Section */}
         <div className="px-6 md:px-12 mt-12 text-left">
            <h2 className="text-2xl font-black mb-4">About</h2>
            <div className="bg-zinc-900 rounded-xl p-6 md:p-8 border border-white/10">
               <h3 className="text-xl font-bold mb-3">{gameState.artist.name}</h3>
               <p className="text-white/70 text-sm md:text-base leading-relaxed">
                  {gameState.artist.socialProfile?.bio || `Following the release of their recent projects, ${gameState.artist.name} continues to connect with audiences and reach new heights across digital streaming platforms globally.`}
               </p>
               <div className="mt-4 pt-4 border-t border-white/10 text-white/50 text-xs">
                  Hometown: {gameState.artist.country}
               </div>
            </div>
         </div>

         {/* All Discography Popup */}
         {showAllAmazonDiscography && (
            <div className="fixed inset-0 z-[400] bg-[#000000] overflow-y-auto">
               <div className="sticky top-0 z-20 flex flex-col p-4 px-6 border-b border-white/10 bg-[#000000]/90 backdrop-blur-md text-left">
                  <div className="flex items-center mb-4">
                     <button onClick={() => setShowAllAmazonDiscography(false)} className="flex items-center text-[#00e0ff] font-bold text-[15px] hover:opacity-70 transition-opacity">
                        <ChevronLeft className="w-6 h-6 mr-1" />
                        Back
                     </button>
                  </div>
                  <div className="flex flex-col">
                     <h1 className="text-3xl font-black mb-4">All Releases</h1>
                     <div className="flex gap-2">
                        {['All', 'Albums', 'Singles'].map(filter => (
                           <button
                              key={filter}
                              onClick={() => setDiscoFilter(filter as any)}
                              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${discoFilter === filter ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                           >
                              {filter}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
               <div className="w-full max-w-7xl mx-auto p-6 md:p-12 text-left">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-8">
                     {standaloneReleases.slice().reverse().filter(rel => {
                        if (discoFilter === 'Albums') return ['Album', 'Deluxe Album'].includes(rel.type);
                        if (discoFilter === 'Singles') return ['EP', 'Single Pack', 'Single'].includes(rel.type);
                        return true;
                     }).map(rel => (
                        <div key={rel.id} className="flex flex-col group cursor-pointer" onClick={() => handleSelectAmazonRelease(rel)}>
                           <div className="w-full aspect-square bg-zinc-800 rounded-lg overflow-hidden mb-3 relative">
                              {rel.coverImage ? <img src={rel.coverImage || undefined} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <Disc className="w-16 h-16 text-white/20 m-auto mt-12" />}
                           </div>
                           <span className="font-bold text-[15px] leading-tight truncate">{rel.title}</span>
                           <span className="text-white/60 text-[13px] capitalize mt-0.5">{rel.type} • {new Date(rel.releaseDate!).getFullYear()}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}
         
         {/* Selected Amazon Release Popup */}
         {selectedAmazonRelease && (
            <div className="fixed inset-0 z-[500] bg-[#000000] overflow-y-auto w-full">
               <div className="sticky top-0 z-20 flex bg-[#000000]/90 backdrop-blur-md p-4 border-b border-white/5 text-left mb-8">
                  <button onClick={() => setSelectedAmazonRelease(null)} className="flex items-center text-[#00e0ff] font-bold">
                     <ChevronLeft className="w-8 h-8 -ml-2" />
                  </button>
               </div>
               <div className="max-w-4xl mx-auto px-6 md:px-12 flex flex-col md:flex-row gap-8 items-start pb-24 text-left">
                  <div className="w-full md:w-80 shrink-0 md:sticky md:top-24">
                     <div className="w-full aspect-square bg-zinc-800 rounded-lg overflow-hidden shadow-2xl mb-6 border border-white/10">
                        {selectedAmazonRelease.coverImage ? <img src={selectedAmazonRelease.coverImage || undefined} className="w-full h-full object-cover" /> : <Disc className="w-24 h-24 text-zinc-300 m-auto mt-24" />}
                     </div>
                     <h1 className="text-3xl md:text-5xl font-black mb-2 leading-tight">{selectedAmazonRelease.title}</h1>
                     <p className="text-[#00e0ff] font-bold text-lg mb-1">{getArtistStr(selectedAmazonRelease)}</p>
                     <p className="text-white/50 text-sm">{selectedAmazonRelease.type} • {new Date(selectedAmazonRelease.releaseDate!).getFullYear()} • {(selectedAmazonRelease as any).trackIds ? (selectedAmazonRelease as any).trackIds.length : 1} Songs</p>
                     <div className="flex items-center gap-4 mt-6">
                        <button className="flex-1 bg-[#00e0ff] hover:bg-cyan-400 text-black py-4 rounded-full font-black text-lg flex items-center justify-center gap-2 transition-colors">
                           <Play className="w-6 h-6 fill-current" /> Play
                        </button>
                        <button className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10">
                           <Heart className="w-6 h-6" />
                        </button>
                     </div>
                  </div>
                  <div className="flex-1 w-full">
                     <div className="flex flex-col mb-12">
                        {(['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(selectedAmazonRelease.type)) ? (
                           ((selectedAmazonRelease as any).trackIds as string[]).map((id, index) => {
                              const song = songs.find(s => s?.id === id);
                              if (!song) return null;
                              return (
                                 <div key={id} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-lg group cursor-pointer border-b border-white/5 last:border-0">
                                    <span className="w-6 text-center text-white/40 font-bold group-hover:hidden">{index + 1}</span>
                                    <Play className="w-6 h-6 text-white hidden group-hover:block shrink-0" />
                                    <div className="flex flex-col flex-1 truncate">
                                       <span className="font-bold text-base truncate">{song.title}</span>
                                       <span className="text-white/60 text-sm truncate">{getArtistStr(song)}</span>
                                    </div>
                                    <span className="text-white/30 text-sm">{getPlatformStreams(song, 'amazonMusic').toLocaleString()}</span>
                                    <button className="w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-white text-white/60">
                                       <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                 </div>
                              )
                           })
                        ) : (
                           <div className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-lg group cursor-pointer border-b border-white/5">
                              <span className="w-6 text-center text-white/40 font-bold group-hover:hidden">1</span>
                              <Play className="w-6 h-6 text-white hidden group-hover:block shrink-0" />
                              <div className="flex flex-col flex-1 truncate">
                                 <span className="font-bold text-base truncate">{selectedAmazonRelease.title}</span>
                                 <span className="text-white/60 text-sm truncate">{getArtistStr(selectedAmazonRelease)}</span>
                              </div>
                              <span className="text-white/30 text-sm">{getPlatformStreams(selectedAmazonRelease as Song, 'amazonMusic').toLocaleString()}</span>
                              <button className="w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-white text-white/60">
                                 <MoreHorizontal className="w-5 h-5" />
                              </button>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         )}
         
         {/* isSelectingAmazonHighlight Popup */}
         {isSelectingAmazonHighlight && (
            <div className="fixed inset-0 z-[500] bg-[#000000] overflow-y-auto">
               <div className="sticky top-0 bg-[#000000]/90 backdrop-blur z-20 flex p-4 px-6 border-b border-white/10 text-left items-center">
                  <button onClick={() => setIsSelectingAmazonHighlight(false)} className="text-[#00e0ff] font-bold flex items-center hover:opacity-70 transition-opacity">
                     <ChevronLeft className="w-6 h-6 mr-1" /> Back
                  </button>
                  <h1 className="text-xl font-bold ml-4">Set Highlight</h1>
               </div>
               <div className="p-6 md:p-12 text-left">
                  <p className="text-white/60 mb-6">Select a release to feature as your Highlight</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                     {standaloneReleases.slice().reverse().map(rel => (
                        <div key={rel.id} className="flex flex-col group cursor-pointer" onClick={() => { setAmazonHighlightId(rel.id); setIsSelectingAmazonHighlight(false); }}>
                           <div className={`w-full aspect-square bg-zinc-800 rounded-lg overflow-hidden mb-3 relative border-4 ${amazonHighlightId === rel.id || (!amazonHighlightId && highlightRelease?.id === rel.id) ? 'border-[#00e0ff]' : 'border-transparent'}`}>
                              {rel.coverImage ? <img src={rel.coverImage || undefined} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <Disc className="w-16 h-16 text-white/20 m-auto mt-12" />}
                              {(amazonHighlightId === rel.id || (!amazonHighlightId && highlightRelease?.id === rel.id)) && (
                                 <div className="absolute top-2 right-2 bg-[#00e0ff] text-black w-6 h-6 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4" />
                                 </div>
                              )}
                           </div>
                           <span className="font-bold text-[15px] leading-tight truncate">{rel.title}</span>
                           <span className="text-white/60 text-[13px] capitalize mt-0.5">{rel.type} • {new Date(rel.releaseDate!).getFullYear()}</span>
                        </div>
                     ))}
                  </div>
               </div>
             </div>
          )}
          </>
         ) : (
            <div className="flex flex-col min-h-screen pt-12 pb-24 text-left">
               <div className="px-4 md:px-8 flex gap-4 md:gap-8 flex-wrap border-b border-white/10 mb-8 sticky top-0 bg-[#000000]/80 backdrop-blur z-20 pt-4">
                  {(['global_song', 'global_album', 'america', 'europe', 'latin_america'] as const).map(tab => (
                     <button
                        key={tab}
                        onClick={() => setAmazonMusicChart(tab)}
                        className={`pb-4 font-bold text-sm md:text-base capitalize transition-colors relative ${amazonMusicChart === tab ? 'text-[#00e0ff]' : 'text-white/60 hover:text-white'}`}
                     >
                        {tab.replace('_', ' ')}
                        {amazonMusicChart === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#00e0ff] rounded-t" />}
                     </button>
                  ))}
               </div>

               <div className="w-full max-w-4xl mx-auto px-4 md:px-8 pb-24">
                  {amazonMusicChart === 'global_album' ? (
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                         {combinedAlbumsList.map((item, i) => (
                            <div key={item.album.id} className="flex flex-col group cursor-pointer" onClick={() => { setAmazonMusicChart(null); if(item.isPlayer) setSelectedAmazonRelease(item.album); }}>
                               <div className="w-full aspect-square bg-white/5 rounded-xl overflow-hidden mb-3 relative border border-white/10">
                                  {item.album.coverImage ? <img src={item.album.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <Disc className="w-16 h-16 text-white/30 m-auto mt-12" />}
                                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-xs font-bold">{i+1}</div>
                               </div>
                               <span className="font-bold text-[15px] leading-tight truncate">{item.album.title}</span>
                               <span className="text-white/60 text-[13px]">{item.artist}</span>
                            </div>
                         ))}
                     </div>
                  ) : (
                     <div className="flex flex-col border-t border-white/10">
                         {getAmazonSongsChart(amazonMusicChart as any).map((item, i) => (
                            <div key={item.song.id} className="flex items-center gap-4 py-3 border-b border-white/10 hover:bg-white/5 px-2 -mx-2 rounded-lg transition-colors cursor-pointer" onClick={() => { setAmazonMusicChart(null); if(item.isPlayer) handleSelectAmazonRelease(item.song); }}>
                               <div className="w-12 h-12 bg-white/5 rounded object-cover shrink-0 overflow-hidden relative">
                                  {item.song.coverImage ? <img src={item.song.coverImage} className="w-full h-full object-cover" /> : <Disc className="m-auto mt-3 text-white/30" />}
                               </div>
                               <span className="w-6 font-bold text-lg text-white/60 shrink-0 text-center">{i+1}</span>
                               <div className="flex-1 flex flex-col overflow-hidden">
                                  <span className="font-bold text-lg leading-tight truncate">{item.song.title}</span>
                                  <span className="text-white/60 text-sm truncate">{item.artist}</span>
                               </div>
                               <MoreHorizontal className="text-white/40 group-hover:text-white shrink-0" />
                            </div>
                         ))}
                     </div>
                  )}
               </div>
            </div>
         )}
         {/* Bottom Navigation */}
         <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#000000]/90 backdrop-blur-md border-t border-white/10 z-[300] flex justify-around items-center px-4 md:px-24">
            <button 
               onClick={() => { setAmazonMusicChart(null); setAmazonMusicTab('profile'); }} 
               className={`flex flex-col items-center justify-center w-24 gap-1 ${amazonMusicTab === 'profile' ? 'text-[#00e0ff]' : 'text-white/40 hover:text-white/60'}`}
            >
               <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
               <span className="text-[10px] font-semibold">Profile</span>
            </button>
            <button 
               onClick={() => { setAmazonMusicChart('global_song'); setAmazonMusicTab('charts'); }} 
               className={`flex flex-col items-center justify-center w-24 gap-1 ${amazonMusicTab === 'charts' ? 'text-[#00e0ff]' : 'text-white/40 hover:text-white/60'}`}
            >
               <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11V3H8v6H2v12h20V11h-6zm-6-6h4v14h-4V5zm-6 6h4v8H4v-8zm16 8h-4v-6h4v6z"/></svg>
               <span className="text-[10px] font-semibold">Charts</span>
            </button>
         </div>
      </div>
    );
  };

  if (!platform) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 h-full relative">
         <h2 className="text-2xl font-black italic text-purple-400 uppercase mb-8 tracking-widest">My Smartphone</h2>
         <div className="w-full max-w-sm aspect-[9/19] bg-[#0c0c0e] border-[8px] border-[#1a1a1c] rounded-[3.5rem] p-6 relative shadow-[0_0_100px_rgba(168,85,247,0.15)] overflow-hidden flex flex-col backdrop-blur-3xl">
            <div className="w-1/3 h-7 bg-[#1a1a1c] absolute top-0 left-1/2 -translate-x-1/2 rounded-b-[1.25rem] z-20 flex items-center justify-center">
               <div className="w-10 h-1 bg-white/5 rounded-full" />
            </div>
            <div className="flex justify-between items-center text-white/60 text-xs font-black px-4 pt-3 mb-12 z-10 tabular-nums">
               <span>10:42</span>
               <div className="flex gap-1.5 items-center">
                 <div className="w-3 h-3 rounded-full border border-white/20" />
                 <div className="w-5 h-2.5 bg-white/60 rounded-[2px]" />
               </div>
            </div>
            <div className="grid grid-cols-4 gap-6 z-10 px-2 mt-4">
               {[
                 { id: 'spotify', bg: '#1DB954', name: 'Spotify' },
                 { id: 'apple', bg: '#fa243c', name: 'Music' },
                 { id: 'amazon', bg: '#00A8E1', name: 'Amazon' },
                 { id: 'youtube', bg: '#FF0000', name: 'YouTube' }
               ].map(p => (
                 <button key={p.id} onClick={() => setPlatform(p.id as any)} className="flex flex-col items-center gap-2 group">
                   <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-all duration-300 relative overflow-hidden" style={{ backgroundColor: p.bg }}>
                      <Music2 className={`w-8 h-8 ${p.id === 'spotify' ? 'text-black' : 'text-white'}`} />
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                   <span className="text-[10px] text-white/60 font-black uppercase tracking-widest">{p.name}</span>
                 </button>
               ))}
            </div>
            <div className="mt-auto mb-4 flex justify-center z-10">
               <div className="w-32 h-1 bg-white/10 rounded-full" />
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black overflow-y-auto hide-scrollbar">
      <div className="sticky top-0 left-0 right-0 h-20 bg-black/40 backdrop-blur-2xl border-b border-white/5 z-[300] flex items-center px-4 md:px-12">
         <button onClick={() => setPlatform(null)} className="px-6 py-2.5 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 active:scale-95 shadow-lg">
            <ChevronRight className="w-4 h-4 rotate-180" /> EXIT APP
         </button>
         <span className="ml-auto text-white/20 font-black text-[10px] tracking-[0.4em] uppercase">Smartphone OS v4.1</span>
      </div>
      <div>
        {platform === 'spotify' && renderSpotify()}
        {platform === 'apple' && renderAppleMusic()}
        {platform === 'amazon' && renderAmazonMusic()}
        {platform === 'youtube' && <YouTubeMusicView gameState={gameState} />}
      </div>
    </div>
  );
}
