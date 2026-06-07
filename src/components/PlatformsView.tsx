import React, { useState } from 'react';
import { GameState, Song, Album, Release } from '../types';
import { Play, Heart, MoreHorizontal, CheckCircle2, ChevronRight, Music2, Disc, User, ChevronLeft, Share2, Plus, Home, Search, Library, X } from 'lucide-react';
import { NPC_ARTISTS } from '../constants';
import { ARTIST_IMAGES } from '../artistImages';
import { ARTIST_PICS } from '../artistPics';
import { ARTIST_DISCOGRAPHY } from '../artistDiscography';

interface PlatformsViewProps {
  gameState: GameState;
  setGameState?: React.Dispatch<React.SetStateAction<GameState>>;
}

import { YouTubeMusicView } from './YouTubeMusicView';
import { UpcomingReleaseView } from './UpcomingReleaseView';

export function PlatformsView({ gameState, setGameState }: PlatformsViewProps) {
  const [platform, setPlatform] = useState<'spotify' | 'apple' | 'youtube' | 'amazon' | null>(null);
  const [spotifyTab, setSpotifyTab] = useState<'home' | 'explore' | 'profile'>('home');
  const [spotifyViewArtist, setSpotifyViewArtist] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [selectedSpotifyUpcoming, setSelectedSpotifyUpcoming] = useState<any>(null);
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
  const [exploreCategory, setExploreCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedAppleRelease, setSelectedAppleRelease] = useState<Release | null>(null);
  const [showAllAppleDiscography, setShowAllAppleDiscography] = useState(false);
  const [appleMusicTab, setAppleMusicTab] = useState<'home' | 'profile' | 'charts' | 'search'>('home');
  const [appleViewArtist, setAppleViewArtist] = useState<string | null>(null);
  const [appleSelectedPlaylist, setAppleSelectedPlaylist] = useState<any | null>(null);
  const [appleMusicChart, setAppleMusicChart] = useState<'global_song' | 'global_album' | 'america' | 'europe' | 'latin_america' | null>(null);
  
  const [selectedAmazonRelease, setSelectedAmazonRelease] = useState<Release | null>(null);
  const [showAllAmazonDiscography, setShowAllAmazonDiscography] = useState(false);
  const [amazonHighlightId, setAmazonHighlightId] = useState<string | null>(null);
  const [isSelectingAmazonHighlight, setIsSelectingAmazonHighlight] = useState(false);
  const [amazonMusicTab, setAmazonMusicTab] = useState<'home' | 'profile' | 'charts' | 'search'>('home');
  const [amazonViewArtist, setAmazonViewArtist] = useState<string | null>(null);
  const [amazonSelectedPlaylist, setAmazonSelectedPlaylist] = useState<any | null>(null);
  const [amazonSeeAll, setAmazonSeeAll] = useState<{title: string, type: 'songs'|'artists'|'albums'|'playlists'|'releases', items: any[]} | null>(null);
  const [amazonMusicChart, setAmazonMusicChart] = useState<'global_song' | 'global_album' | 'america' | 'europe' | 'latin_america' | null>(null);

  const publishedReleases = gameState.releases.filter(r => !(r as any).isNPCRelease && r.status === 'Published');

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

  const getArtistStr = (r: any) => {
      if (!r) return gameState.artist?.name || 'You';
      const mainArtist = r.isNPCRelease ? r.artistId : gameState.artist?.name || 'You';
      if (r.collaborator) {
          return `${mainArtist} feat. ${r.collaborator}`;
      }
      return mainArtist;
  };

  const allPublishedSongs = gameState.releases.filter(r => r.type === 'Single' && r.status === 'Published') as Song[];
  
  const calculateListeners = (plat: 'spotify' | 'appleMusic' | 'youtubeMusic' | 'amazonMusic', targetArtistName?: string) => {
    const platMux = { spotify: 0.4, appleMusic: 0.25, amazonMusic: 0.25, youtubeMusic: 0.1 };
    
    let totalDailyPlatStreams = 0;
    
    const targetSongs = targetArtistName ? allPublishedSongs.filter(r => r.artistId === targetArtistName) : songs;
    
    targetSongs.forEach(r => {
       const dailyTotal = r.lastDailyStreams?.total || 0;
       totalDailyPlatStreams += (dailyTotal * platMux[plat]);
    });

    // Realistically, an active monthly listener streams an artist's songs about 4.5 times a month on average.
    // Total monthly streams = daily * 28. Monthly listeners = (daily * 28) / 4.5 ≈ daily * 6.2
    const activeListeners = totalDailyPlatStreams * 6.2;

    const totalPlatStreams = targetSongs.reduce((sum, r) => sum + getPlatformStreams(r, plat), 0);
    // Logarithmic scale for legacy catalog to prevent massive accumulation over years from giving bloated ML
    const legacyListeners = totalPlatStreams > 0 ? (Math.pow(totalPlatStreams, 0.65) * 0.8) : 0; 
    
    // Add real-world variance based on total listeners (not everyone listens actively)
    let rawListeners = Math.floor((activeListeners + legacyListeners) * (Math.random() * 0.05 + 0.95)) || 0;
    
    if (targetArtistName && gameState.npcStats?.[targetArtistName]) {
       rawListeners += (gameState.npcStats[targetArtistName].listeners * (platMux[plat] / 0.4));
    }
    
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

  const allArtistsListeners = [
      { name: gameState.artist.name, image: gameState.artist.image, listeners: calculateListeners('spotify'), isPlayer: true },
      ...NPC_ARTISTS.map(npc => ({
         name: npc.name,
         image: ARTIST_PICS[npc.name] || ARTIST_IMAGES[npc.name] || null,
         listeners: calculateListeners('spotify', npc.name),
         isPlayer: false
      }))
  ].sort((a,b) => b.listeners - a.listeners).map((x, i) => ({...x, rank: i+1}));

  const top10 = allArtistsListeners.slice(0, 10);
  const randNpc = () => NPC_ARTISTS[Math.floor(Math.random() * Math.min(NPC_ARTISTS.length, 10))];
  const getImg = (name: string) => name === gameState.artist.name ? (gameState.artist.image || undefined) : (ARTIST_PICS[name] || ARTIST_IMAGES[name] || undefined);
  
  const COVER_IMAGES = [
      'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f924?w=200&q=80',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&q=80',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&q=80',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80',
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&q=80',
      'https://images.unsplash.com/photo-1502516422967-df5086e9e51f?w=200&q=80',
      'https://images.unsplash.com/photo-1488582239616-5c589d36329c?w=200&q=80',
      'https://images.unsplash.com/photo-1512903332029-4cc1bb0435ce?w=200&q=80',
      'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200&q=80',
      'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=200&q=80',
      'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=200&q=80',
      'https://images.unsplash.com/photo-1557683304-673a23048d34?w=200&q=80',
  ];
  const getCover = (i: number) => COVER_IMAGES[i % COVER_IMAGES.length];

  const getPlaylistTracks = (pl: any) => {
      let pool: any[] = [];
      
      let allNpcSongs = gameState.releases.filter(r => r.status === 'Published' && (r as any).isNPCRelease && r.type === 'Single');
      if (allNpcSongs.length === 0) {
          allNpcSongs = NPC_ARTISTS.map(a => ({ title: `${a.name} Hit`, artistId: a.name, type: 'Single', status: 'Published', isNPCRelease: true } as any));
      }

      const npcHits = allNpcSongs.map((r, idx) => ({
          id: 'npc-'+idx, 
          title: r.title, 
          artist: (r as any).artistId, 
          img: getImg((r as any).artistId) || undefined, 
          duration: "3:"+(10 + (idx % 40))
      }));
      
      const myHits = publishedReleases.map((r, idx) => ({
          id: r.id, title: r.title, artist: gameState.artist.name, img: gameState.artist.image || undefined, duration: "3:"+(10 + (idx % 40))
      }));

      if (pl.type === 'This Is' || pl.type === 'Best Of') {
          if (pl.artist === gameState.artist.name) {
              pool = [...myHits];
          } else {
              const artistSongs = npcHits.filter(n => n.artist === pl.artist);
              if (artistSongs.length > 0) {
                  pool = [...artistSongs];
              } else {
                   pool = Array.from({length: 10}).map((_, i) => ({
                      id: 'npc-'+pl.artist+'-'+i, title: `${pl.artist} Smash Hit ${i+1}`, artist: pl.artist, img: getImg(pl.artist) || undefined, duration: "3:20"
                  }));
              }
          }
      } else if (pl.type === 'Mix' || pl.type === 'Radio' || pl?.id?.startsWith('m') || pl?.id?.startsWith('r') || pl?.id?.startsWith('ap') || pl?.id?.startsWith('ec')) {
          pool = [...myHits.slice(0, 3), ...npcHits].sort(() => 0.5 - Math.random());
      } else if (pl?.id?.startsWith('c') || pl?.id?.startsWith('am')) {
          pool = [...myHits, ...npcHits].sort(() => 0.5 - Math.random());
      } else {
          pool = [...npcHits, ...myHits].sort(() => 0.5 - Math.random());
      }
      
      let result: any[] = [];
      if (pool.length === 0) pool = npcHits;
      while(result.length < 20 && pool.length > 0) {
          const item = pool[Math.floor(Math.random() * pool.length)];
          if(!result.find(r => r.title === item.title)) {
              result.push(item);
          }
      }
      return result.length > 0 ? result : pool;
  };

  const renderSpotify = () => {
    const isNPC = !!spotifyViewArtist;
    const currentArtistData = isNPC ? NPC_ARTISTS.find(a => a.name === spotifyViewArtist) : null;
    const artistName = isNPC ? currentArtistData?.name || "NPC" : gameState.artist.name;
    const artistImage = isNPC ? (ARTIST_PICS[artistName] || ARTIST_IMAGES[artistName] || undefined) : (gameState.artist.image || undefined);
    const listenersCount = isNPC ? calculateListeners('spotify', artistName) : calculateListeners('spotify');

    const viewArtistReleases = isNPC ? gameState.releases.filter(r => (r.artistId === spotifyViewArtist || (r.collaborator === spotifyViewArtist)) && r.status === 'Published') : [];

    const artistStandalone = isNPC 
        ? viewArtistReleases.filter(r => (['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(r.type) || (r.type === 'Single' && !(r as any).isBSide))).sort((a,b) => new Date(b.releaseDate!).getTime() - new Date(a.releaseDate!).getTime())
        : standaloneReleases.sort((a,b) => new Date(b.releaseDate!).getTime() - new Date(a.releaseDate!).getTime());
        
    const artistSongs = isNPC 
        ? viewArtistReleases.filter(r => r.type === 'Single')
        : songs;

    const currentWeekNumber = Math.max(1, Math.floor(gameState.time.daysPassed / 7)); 
    const currentWeekFluctuation = 1 + (Math.sin(currentWeekNumber / 10) * 0.05);

    const topSongs = isNPC 
        ? [...artistSongs].sort((a,b) => getPlatformStreams(b, 'spotify') - getPlatformStreams(a, 'spotify')).slice(0, 10)
        : getTopSongs('spotify', 10);
        
    const popRel = artistStandalone.length > 0 ? [...artistStandalone].sort((a,b) => getPlatformStreams(b, 'spotify') - getPlatformStreams(a, 'spotify'))[0] : null;

    const popularRelease = (!isNPC && artistPickId)
        ? standaloneReleases.find(r => r?.id === artistPickId) 
        : (!isNPC ? getPopularRelease('spotify') : popRel);

    const npcReleases = artistStandalone;
    

    const playerListeners = calculateListeners('spotify');
    const playerQualified = publishedReleases.length >= 3 && playerListeners > 15000;
    const heroArtist = playerQualified ? gameState.artist.name : top10[0]?.name || randNpc().name;
    const heroImg = getImg(heroArtist);

    const renderSpotifyContent = () => {
        if (selectedPlaylist) {
           return (
              <div className="pt-24 px-6 md:px-12 flex flex-col gap-6 pb-32">
                 <button onClick={() => setSelectedPlaylist(null)} className="absolute top-6 left-6 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white z-[100] transition-colors flex items-center justify-center">
                    <ChevronLeft className="w-5 h-5 ml-[-2px]" />
                 </button>
                 <div className="flex flex-col md:flex-row gap-6 mt-8">
                     <div className="w-48 h-48 md:w-64 md:h-64 shrink-0 rounded bg-[#282828] relative overflow-hidden shadow-2xl">
                         {selectedPlaylist.imgs ? (
                            <>
                                <div className="w-full h-full grid grid-cols-2 grid-rows-2 opacity-80 mix-blend-luminosity">
                                   {selectedPlaylist.imgs.map((img: string, idx: number) => (
                                      <div key={idx} className="w-full h-full bg-[#333] border border-[#121212]">
                                         {img ? <img src={img} className="w-full h-full object-cover" /> : null}
                                      </div>
                                   ))}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-black/40 to-black/10" style={{ mixBlendMode: 'multiply', backgroundColor: selectedPlaylist.bg }} />
                            </>
                         ) : selectedPlaylist.banner || selectedPlaylist.img ? (
                            <img src={selectedPlaylist.banner || selectedPlaylist.img} className="w-full h-full object-cover" />
                         ) : (
                            <div className="w-full h-full flex flex-col justify-center items-center p-4 text-center" style={{ backgroundColor: selectedPlaylist.bg || '#282828' }}>
                               {selectedPlaylist.type && <span className="font-black text-2xl uppercase mix-blend-multiply opacity-50">{selectedPlaylist.type}</span>}
                               <span className="font-black text-3xl mix-blend-multiply flex-1 flex flex-col justify-center">{selectedPlaylist.artist}</span>
                            </div>
                         )}
                     </div>
                     <div className="flex flex-col justify-end">
                         <span className="text-xs font-bold uppercase tracking-widest">Playlist</span>
                         <h1 className="text-4xl md:text-6xl font-black mt-2 mb-4 leading-tight tracking-tighter">{selectedPlaylist.title || (selectedPlaylist.type ? (selectedPlaylist.type === 'Radio' ? selectedPlaylist.artist + ' Radio' : selectedPlaylist.type + ' ' + selectedPlaylist.artist) : selectedPlaylist.artist + ' Radio')}</h1>
                         <p className="text-white/60 text-sm md:text-base font-medium max-w-lg mb-2">{selectedPlaylist.desc || selectedPlaylist.text || selectedPlaylist.artists || selectedPlaylist.related}</p>
                         <div className="flex items-center gap-2 text-sm text-white/50">
                             <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png" className="h-4 brightness-200" />
                             <span>• 50 songs, about 2 hr 30 min</span>
                         </div>
                     </div>
                 </div>
                 
                 <div className="mt-6 flex items-center gap-4">
                     <button className="w-14 h-14 bg-[#1db954] text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                         <Play className="w-6 h-6 fill-current ml-1" />
                     </button>
                     <button className="w-10 h-10 border border-white/30 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:border-white transition-all">
                         <Heart className="w-5 h-5" />
                     </button>
                     <button className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all">
                         <MoreHorizontal className="w-6 h-6" />
                     </button>
                 </div>

                 <div className="mt-8 border-t border-white/10 pt-4">
                     <div className="flex flex-col gap-2">
                         {getPlaylistTracks(selectedPlaylist).map((t: any, i: number) => (
                             <div key={t.id + '-' + i} className="flex items-center gap-4 hover:bg-white/10 p-2 rounded-md group cursor-pointer">
                                 <span className="w-4 text-center text-white/50 group-hover:text-white group-hover:hidden">{i + 1}</span>
                                 <Play className="w-4 h-4 hidden group-hover:block text-white" fill="white" />
                                 <div className="w-10 h-10 bg-[#282828] shrink-0 rounded overflow-hidden">
                                     {t.img ? (
                                        <img src={t.img} className="w-full h-full object-cover" />
                                     ) : (selectedPlaylist.imgs ? (
                                        <img src={selectedPlaylist.imgs[i % 4]} className="w-full h-full object-cover" />
                                     ) : (selectedPlaylist.img || selectedPlaylist.banner ? (
                                        <img src={selectedPlaylist.img || selectedPlaylist.banner} className="w-full h-full object-cover" />
                                     ) : null))}
                                 </div>
                                 <div className="flex flex-col flex-1">
                                     <span className="text-white font-medium group-hover:underline line-clamp-1">{t.title}</span>
                                     <span className="text-white/50 text-sm hover:underline line-clamp-1">{t.artist}</span>
                                 </div>
                                 <span className="text-white/50 text-sm">{t.duration}</span>
                             </div>
                         ))}
                     </div>
                 </div>
              </div>
           );
        }

        if (selectedSpotifyUpcoming) {
           return <UpcomingReleaseView 
             release={selectedSpotifyUpcoming} 
             onClose={() => setSelectedSpotifyUpcoming(null)}
             onArtistClick={(name) => {
                setSelectedSpotifyUpcoming(null);
                setSpotifyTab('profile');
                setSpotifyViewArtist(name === gameState.artist.name ? null : name);
             }}
             gameState={gameState}
             setGameState={setGameState}
           />;
        }
        if (spotifyTab === 'home') {
            return (
                <div className="pt-12 px-4 md:px-12 flex flex-col gap-10">
                    <div className="flex gap-3 px-2">
                        <button className="px-4 py-1.5 rounded-full text-[13px] font-bold bg-[#1db954] text-black">All</button>
                        <button className="px-4 py-1.5 rounded-full text-[13px] font-bold bg-[#282828] text-white hover:bg-[#333]">Music</button>
                        <button className="px-4 py-1.5 rounded-full text-[13px] font-bold bg-[#282828] text-white hover:bg-[#333]">Podcasts</button>
                    </div>

                    <div>
                        <h2 className="text-[22px] font-black mb-4 px-2">Top Monthly Listeners</h2>
                        <div className="flex overflow-x-auto gap-4 pb-4 px-2 hide-scrollbar">
                           {top10.map((a, i) => (
                              <div key={a.name} className="flex flex-col items-center gap-2 cursor-pointer w-[120px] shrink-0" onClick={() => {
                                 if(a.isPlayer) {
                                    setSpotifyViewArtist(null);
                                    setSpotifyTab('profile');
                                 } else {
                                    setSpotifyViewArtist(a.name);
                                    setSpotifyTab('profile');
                                 }
                              }}>
                                 <div className="w-[110px] h-[110px] rounded-full overflow-hidden bg-[#282828] relative shadow-xl">
                                    {a.image ? <img src={a.image} className="w-full h-full object-cover"/> : <User className="w-10 h-10 text-white/20 m-auto mt-7"/>}
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur text-white text-[10px] font-black px-2 py-0.5 rounded flex items-center justify-center border border-white/10 w-8">
                                       {a.rank}
                                    </div>
                                 </div>
                                 <div className="flex flex-col items-center w-full mt-1">
                                     <span className="text-white text-[13.5px] font-bold text-center truncate w-full hover:underline">{a.name}</span>
                                     <span className="text-white/60 text-[12px] truncate w-full text-center">{(a.listeners / 1000000).toFixed(1)}M listeners</span>
                                 </div>
                              </div>
                           ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-[22px] font-black mb-4 px-2">Recommended Stations</h2>
                        <div className="flex overflow-x-auto gap-4 pb-4 px-2 hide-scrollbar">
                            {[
                               { id: 'r1', type: 'Radio', artist: heroArtist, related: 'Olivia Rodrigo, Sabrina Carpenter, ' + randNpc().name, bg: '#FDE047' },
                               { id: 'r2', type: 'Radio', artist: top10[1]?.name || randNpc().name, related: 'LE SSERAFIM, aespa, NewJeans', bg: '#86EFAC' },
                               { id: 'r3', type: 'Radio', artist: top10[2]?.name || randNpc().name, related: 'The Weeknd, Bruno Mars', bg: '#F9A8D4' },
                               { id: 'r4', type: 'Radio', artist: top10[3]?.name || randNpc().name, related: 'Billie Eilish, Conan Gray', bg: '#93C5FD' }
                           ].map(r => {
                              const img1 = getImg(r.artist);
                              const img2 = getImg(r.artist !== heroArtist ? heroArtist : top10[1]?.name || randNpc().name);
                              const img3 = getImg(top10[2]?.name || randNpc().name);
                              return (
                              <div key={r.id} onClick={() => setSelectedPlaylist({ ...r, imgs: [img1, img2, img3, img2] })} className="min-w-[160px] max-w-[160px] cursor-pointer group">
                                 <div className="aspect-square rounded-md p-4 flex flex-col justify-between relative overflow-hidden" style={{ backgroundColor: r.bg }}>
                                     <h3 className="font-black text-black z-20 text-[10px] tracking-widest text-right absolute top-3 right-3 opacity-80">RADIO</h3>
                                     
                                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] flex items-center justify-center w-[120%]">
                                        {/* Collage of circles */}
                                        <div className="w-[50px] h-[50px] rounded-full overflow-hidden absolute left-2 top-2 shadow-2xl z-20 border-2 border-[color:var(--bg)]" style={{ borderColor: r.bg }}>
                                            {(img2) ? <img src={img2} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black/20" />}
                                        </div>
                                        <div className="w-[85px] h-[85px] rounded-full overflow-hidden absolute left-1/2 -translate-x-1/2 z-30 shadow-2xl border-2 border-[color:var(--bg)]" style={{ borderColor: r.bg }}>
                                            {(img1) ? <img src={img1} className="w-full h-full object-cover scale-110" /> : <div className="w-full h-full bg-black/20" />}
                                        </div>
                                        <div className="w-[50px] h-[50px] rounded-full overflow-hidden absolute right-2 top-2 shadow-2xl z-10 border-2 border-[color:var(--bg)]" style={{ borderColor: r.bg }}>
                                            {(img3) ? <img src={img3} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black/20" />}
                                        </div>
                                     </div>

                                     <h3 className="font-black text-[22px] tracking-tight leading-tight text-black mt-auto z-20 relative mix-blend-multiply">{r.artist}</h3>
                                     <div className="absolute bottom-2 right-2 w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-xl z-30">
                                         <Play className="w-5 h-5 text-black fill-current ml-1" />
                                     </div>
                                 </div>
                                 <p className="text-white/50 text-[13px] font-medium mt-3 line-clamp-2 leading-snug hover:text-white/80">{r.artist}, {r.related}</p>
                              </div>
                           )})}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-[22px] font-black mb-4 px-2">Your Top Mixes</h2>
                        <div className="flex overflow-x-auto gap-4 pb-4 px-2 hide-scrollbar">
                           {[
                             { id: 'm1', type: 'Mix', title: 'Happy Mix', artists: 'Taylor Swift, Kesha, Sabrina Carpenter and more', bg: '#D8B4E2', img: getCover(0), imgs: [getCover(0), getCover(1), getCover(2), getCover(3)] },
                             { id: 'm2', type: 'Mix', title: heroArtist + ' Mix', artists: `LISA, BLACKPINK and ROSÉ`, bg: '#FDE047', img: heroImg, imgs: [heroImg, getCover(4), getCover(5), getCover(6)] },
                             { id: 'm3', type: 'Mix', title: 'Pop Mix', artists: 'Ariana Grande, Justin Bieber and more', bg: '#71A0B6', img: getCover(1), imgs: [getCover(1), getCover(7), getCover(8), getCover(9)] },
                             { id: 'm4', type: 'Mix', title: 'Chill Mix', artists: 'Billie Eilish, Joji, Labrinth', bg: '#8B5CF6', img: getCover(2), imgs: [getCover(2), getCover(10), getCover(11), getCover(0)] }
                           ].map(r => (
                             <div key={r.id} onClick={() => setSelectedPlaylist(r)} className="min-w-[150px] max-w-[150px] cursor-pointer group">
                                <div className="aspect-square rounded-md flex flex-col justify-end relative overflow-hidden bg-[#282828]">
                                    {r.img ? <img src={r.img} className="absolute inset-0 w-full h-full object-cover" /> : null}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    
                                    <div className="relative z-20 flex px-2 mb-3">
                                       <div className="w-1.5 h-[22px] shrink-0 mr-1.5 bg-white" style={{ backgroundColor: r.bg }} />
                                       <span className="bg-white/90 px-1 text-[13px] font-black text-black leading-tight tracking-tight shadow-md py-0.5">{r.title}</span>
                                    </div>

                                    <div className="absolute bottom-2 right-2 w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-xl z-30">
                                        <Play className="w-5 h-5 text-black fill-current ml-1" />
                                    </div>
                                </div>
                                <p className="text-white/50 text-[13px] font-medium mt-3 line-clamp-2 leading-snug hover:text-white/80">{r.artists}</p>
                             </div>
                           ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-3 px-2 mb-4">
                           <div className="w-10 h-10 rounded-full overflow-hidden">
                               {heroImg ? <img src={heroImg} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#282828]" />}
                           </div>
                           <div className="flex flex-col">
                               <span className="text-white/50 text-[12px] uppercase tracking-widest font-bold">For fans of</span>
                               <span className="text-[22px] font-black leading-none">{heroArtist}</span>
                           </div>
                        </div>
                        <div className="flex overflow-x-auto gap-4 pb-4 px-2 hide-scrollbar">
                           {[
                             { id: 'f1', type: 'This Is', artist: heroArtist, text: `Listen to ${heroArtist}'s greatest hits, all in one place.`, bg: '#06B6D4', img: heroImg },
                             { id: 'f2', type: 'Best Of', artist: top10[1]?.name || randNpc().name, text: 'Essential tracks.', bg: '#F59E0B', img: getImg(top10[1]?.name || randNpc().name) },
                             { id: 'f3', type: 'This Is', artist: top10[2]?.name || randNpc().name, text: 'This is their best work.', bg: '#3B82F6', img: getImg(top10[2]?.name || randNpc().name) },
                             { id: 'f4', type: 'Radio', artist: heroArtist, text: 'Catch similar vibes.', bg: '#A3E635', img: heroImg }
                           ].map((r, i) => (
                             <div key={r.id} onClick={() => setSelectedPlaylist(r)} className="min-w-[150px] max-w-[150px] cursor-pointer group">
                                <div className="aspect-square rounded-md flex flex-col justify-between relative overflow-hidden bg-white/10" style={r.type === 'This Is' ? {} : { backgroundColor: r.bg }}>
                                    {r.type === 'This Is' && (
                                       <>
                                       <div className="absolute inset-0 bg-white" />
                                       <div className="absolute inset-x-0 bottom-0 top-[60%]" style={{ backgroundColor: r.bg }} />
                                       <h3 className="font-black text-black text-center text-xl mt-3 relative z-20">THIS IS</h3>
                                       <div className="flex-1 w-full relative z-20 flex items-center justify-center">
                                          {r.img ? <img src={r.img} className="h-full object-cover rounded shadow-[0_8px_20px_rgba(0,0,0,0.4)] relative mt-2" /> : <div className="h-[80%] aspect-square bg-[#282828] rounded" />}
                                       </div>
                                       <h3 className="font-black text-black text-center text-[19px] mb-2 leading-tight relative z-20 tracking-tighter" style={{ color: r.bg === '#06B6D4' ? '#000' : '#fff' }}>{r.artist}</h3>
                                       </>
                                    )}
                                    {r.type !== 'This Is' && (
                                       <>
                                         <h3 className="font-black text-black text-2xl p-3 z-20 relative mix-blend-multiply">{r.type}<br/>{r.artist}</h3>
                                         {r.img ? <img src={r.img} className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] object-cover rounded shadow-2xl rotate-12" /> : null}
                                       </>
                                    )}
                                    <div className="absolute bottom-2 right-2 w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-xl z-30">
                                        <Play className="w-5 h-5 text-black fill-current ml-1" />
                                    </div>
                                </div>
                                <p className="text-white/50 text-[13px] font-medium mt-3 line-clamp-2 leading-snug hover:text-white/80">{r.text}</p>
                             </div>
                           ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-[22px] font-black mb-4 px-2">Mood & Activities</h2>
                        <div className="flex overflow-x-auto gap-4 pb-4 px-2 hide-scrollbar">
                           {[
                             { id: 'mo1', title: 'Sad Hour', desc: 'Heartbreak anthems and emotional ballads.', bg: '#3b82f6', imgs: [getCover(3), getCover(4), getCover(5), getCover(6)] },
                             { id: 'mo2', title: 'Late Night Drive', desc: 'Chill beats for empty roads.', bg: '#6366f1', imgs: [getCover(7), getCover(8), getCover(9), getCover(10)] },
                             { id: 'mo3', title: 'Feelin\' Good', desc: 'Positive vibes only.', bg: '#f59e0b', imgs: [getCover(11), getCover(0), getCover(1), getCover(2)] },
                             { id: 'mo4', title: 'Workout Power', desc: 'Upbeat tracks to get you moving.', bg: '#ef4444', imgs: [getCover(3), getCover(7), getCover(2), getCover(5)] },
                             { id: 'mo5', title: 'Study Session', desc: 'Focus and chill.', bg: '#8b5cf6', imgs: [getCover(8), getCover(6), getCover(1), getCover(4)] }
                           ].map(r => (
                             <div key={r.id} onClick={() => setSelectedPlaylist(r)} className="min-w-[150px] max-w-[150px] cursor-pointer group">
                                <div className="aspect-square rounded-md relative overflow-hidden bg-[#282828]">
                                    <div className="w-full h-full grid grid-cols-2 grid-rows-2 opacity-80 mix-blend-luminosity group-hover:scale-105 transition-transform duration-500">
                                       {r.imgs.map((img, idx) => (
                                          <div key={idx} className="w-full h-full bg-[#333] border border-[#121212]">
                                             {img ? <img src={img} className="w-full h-full object-cover" /> : null}
                                          </div>
                                       ))}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-black/40 to-black/10" style={{ mixBlendMode: 'multiply', backgroundColor: r.bg }} />
                                    <h3 className="absolute bottom-2 left-2 right-2 font-black text-white text-[17px] leading-tight z-20 text-center tracking-tight">{r.title}</h3>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all shadow-xl z-30">
                                        <Play className="w-6 h-6 text-black fill-current ml-1" />
                                    </div>
                                </div>
                                <p className="text-white/50 text-[13px] font-medium mt-3 line-clamp-2 leading-snug hover:text-white/80">{r.desc}</p>
                             </div>
                           ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-[22px] font-black mb-4 px-2">Popular Genres</h2>
                        <div className="flex overflow-x-auto gap-4 pb-4 px-2 hide-scrollbar">
                           {[
                             { id: 'g1', title: 'Pop', bg: '#8d67ab', img: getImg(randNpc().name) || `https://i.pravatar.cc/150?u=12` },
                             { id: 'g2', title: 'Hip-Hop', bg: '#ba5d07', img: getImg(randNpc().name) || `https://i.pravatar.cc/150?u=13` },
                             { id: 'g3', title: 'Indie', bg: '#608108', img: getImg(randNpc().name) || `https://i.pravatar.cc/150?u=14` },
                             { id: 'g4', title: 'K-Pop', bg: '#8400e7', img: getImg(randNpc().name) || `https://i.pravatar.cc/150?u=15` },
                             { id: 'g5', title: 'R&B', bg: '#e1118c', img: getImg(randNpc().name) || `https://i.pravatar.cc/150?u=16` }
                           ].map(r => (
                             <div key={r.id} className="min-w-[130px] max-w-[130px] cursor-pointer group">
                                <div className="aspect-[3/2] rounded-md relative overflow-hidden" style={{ backgroundColor: r.bg }}>
                                    <h3 className="absolute top-2 left-3 font-black text-white text-[18px] leading-tight z-20 relative mix-blend-overlay">{r.title}</h3>
                                    <div className="absolute -bottom-4 right-[-10px] w-[75px] h-[75px] rotate-[25deg] shadow-xl rounded overflow-hidden bg-black/20">
                                        {r.img ? <img src={r.img} className="w-full h-full object-cover" /> : null}
                                    </div>
                                </div>
                             </div>
                           ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-[22px] font-black mb-4 px-2">Discovery & Charts</h2>
                        <div className="flex overflow-x-auto gap-4 pb-4 px-2 hide-scrollbar">
                           {[
                             { id: 'c1', title: 'Global Top 50', desc: 'The most played tracks right now.', bg: '#10b981', imgs: [getCover(2), getCover(6), getCover(10), getCover(0)] },
                             { id: 'c2', title: 'Viral 50', desc: 'The most viral tracks right now.', bg: '#3b82f6', imgs: [getCover(4), getCover(8), getCover(1), getCover(3)] },
                             { id: 'c3', title: 'Release Radar', desc: 'Catch up on the latest releases.', bg: '#a3e635', imgs: [getCover(7), getCover(11), getCover(5), getCover(9)] },
                             { id: 'c4', title: 'Fresh Finds', desc: 'New music from independent artists.', bg: '#8b5cf6', imgs: [getCover(0), getCover(4), getCover(7), getCover(2)] }
                           ].map(r => (
                             <div key={r.id} onClick={() => setSelectedPlaylist(r)} className="min-w-[150px] max-w-[150px] cursor-pointer group">
                                <div className="aspect-square rounded-md relative overflow-hidden bg-[#282828]">
                                    <div className="w-full h-full grid grid-cols-2 grid-rows-2 opacity-80 mix-blend-luminosity group-hover:scale-105 transition-transform duration-500">
                                       {r.imgs.map((img, idx) => (
                                          <div key={idx} className="w-full h-full bg-[#333] border border-[#121212]">
                                             {img ? <img src={img} className="w-full h-full object-cover" /> : null}
                                          </div>
                                       ))}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-black/40 to-black/10" style={{ mixBlendMode: 'multiply', backgroundColor: r.bg }} />
                                    <h3 className="absolute bottom-2 left-2 right-2 font-black text-white text-[17px] leading-tight z-20 text-center tracking-tight">{r.title}</h3>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all shadow-xl z-30">
                                        <Play className="w-6 h-6 text-black fill-current ml-1" />
                                    </div>
                                </div>
                                <p className="text-white/50 text-[13px] font-medium mt-3 line-clamp-2 leading-snug hover:text-white/80">{r.desc}</p>
                             </div>
                           ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-[22px] font-black mb-4 px-2">Featured Playlists</h2>
                        <div className="flex overflow-x-auto gap-4 pb-4 px-2 hide-scrollbar">
                           {[
                             { id: 'p1', title: "Today's Top Hits", desc: 'Drake, Justin Bieber, Bruno Mars', bg: '#f43f5e', imgs: [getCover(8), getCover(1), getCover(2), getCover(3)] },
                             { id: 'p2', title: 'Dance Party', desc: 'David Guetta, Calvin Harris', bg: '#0ea5e9', imgs: [getCover(5), getCover(11), getCover(0), getCover(9)] },
                             { id: 'p3', title: 'Global 50', desc: 'Trending globally right now.', bg: '#eab308', imgs: [getCover(6), getCover(4), getCover(10), getCover(7)] },
                             { id: 'p4', title: 'Discover Weekly', desc: 'New music for you.', bg: '#d946ef', imgs: [getCover(9), getCover(2), getCover(8), getCover(1)] }
                           ].map(r => (
                             <div key={r.id} onClick={() => setSelectedPlaylist(r)} className="min-w-[150px] max-w-[150px] cursor-pointer group">
                                <div className="aspect-square rounded-md relative overflow-hidden bg-[#282828]">
                                    <div className="w-full h-full grid grid-cols-2 grid-rows-2 opacity-80 mix-blend-luminosity group-hover:scale-105 transition-transform duration-500">
                                       {r.imgs.map((img, idx) => (
                                          <div key={idx} className="w-full h-full bg-[#333] border border-[#121212]">
                                             {img ? <img src={img} className="w-full h-full object-cover" /> : null}
                                          </div>
                                       ))}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-black/40 to-black/10" style={{ mixBlendMode: 'multiply', backgroundColor: r.bg }} />
                                    <h3 className="absolute bottom-2 left-2 right-2 font-black text-white text-[15px] leading-tight z-20 text-center">{r.title}</h3>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all shadow-xl z-30">
                                        <Play className="w-6 h-6 text-black fill-current ml-1" />
                                    </div>
                                </div>
                                <p className="text-white/50 text-[13px] font-medium mt-3 line-clamp-2 leading-snug hover:text-white/80">{r.desc}</p>
                             </div>
                           ))}
                        </div>
                    </div>
                </div>
            );
        }

        if (spotifyTab === 'explore') {
        const currentDateStr = new Date(gameState.time.startDate);
        currentDateStr.setDate(currentDateStr.getDate() + gameState.time.daysPassed);
        
        const allSchedules = (gameState.releases || []).filter(r => r.status === 'Scheduled' && (['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(r.type) || (r.type === 'Single' && !(r as any).isBSide))).map(r => {
           const isAlb = ['Album', 'EP', 'Deluxe Album'].includes(r.type);
           const isNPC = !!(r as any).isNPCRelease;
           return {
             id: r.id,
             artistId: isNPC ? (r as any).artistId : gameState.artist.name,
             releaseTitle: r.title,
             releaseType: r.type,
             coverImage: r.coverImage || undefined,
             bannerImage: r.coverImage || undefined,
             releaseDate: r.releaseDate || new Date().toISOString(),
             announcementDate: r.releaseDate || new Date().toISOString(),
             status: 'upcoming',
             totalPreSaves: r.totalPreSaves || 0,
             dailyPreSaves: 0,
             preSaveGrowth: 1,
             hypeScore: 100,
             popularityScore: 100,
             isPlayerRelease: !isNPC,
             isNPCRelease: isNPC,
             tracks: isAlb ? (() => {
                 if (!isNPC) {
                     return (r as any).trackIds?.map((tid:string, idx:number) => {
                         const song = gameState.releases.find(x => x.id === tid);
                         return { id: tid, title: song?.title || 'Track ' + (idx+1), isReleased: false, isAnnounced: false, isHidden: true };
                     }) || [];
                 } else {
                     const numTracks = r.type === 'EP' ? 5 : 10;
                     const artistName = (r as any).artistId;
                     const discoTracks = ((ARTIST_DISCOGRAPHY as any)[artistName]?.tracks || []);
                     let hash = 0;
                     for (let i = 0; i < r.title.length; i++) hash = r.title.charCodeAt(i) + ((hash << 5) - hash);
                     const startIndex = Math.abs(hash) % Math.max(1, discoTracks.length);
                     return Array.from({ length: numTracks }).map((_, i) => {
                         const trackObj = discoTracks[(startIndex + i) % discoTracks.length];
                         return { id: 'sim-sched-' + i, title: trackObj ? trackObj.title : ('Track ' + (i + 1)), isReleased: false, isAnnounced: false, isHidden: true };
                     });
                 }
             })() : []
           };
        }).sort((a,b) => b.totalPreSaves - a.totalPreSaves);

        
        return (
                <div className="pt-12 px-4 md:px-12 flex flex-col gap-6">
                    <div className="flex items-center gap-4 px-2">
                        {gameState.artist.image ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#282828] shrink-0 border border-white/20 shadow">
                               <img src={gameState.artist.image} className="w-full h-full object-cover"/>
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-[#282828] flex items-center justify-center shrink-0 border border-white/20 shadow">
                               <User className="w-5 h-5 text-white/40" />
                            </div>
                        )}
                        <h1 className="text-[32px] font-black tracking-tight">Search</h1>
                    </div>
                    
                    <div className="bg-white rounded flex items-center px-4 py-2 gap-3 mx-2 sticky top-4 z-30 shadow-lg text-black focus-within:ring-2 focus-within:ring-black">
                        <Search className="w-6 h-6 text-black/80 shrink-0" />
                        <input 
                           type="text" 
                           className="w-full bg-transparent outline-none text-black font-medium text-[15.5px] py-1.5"
                           placeholder="What do you want to listen to?" 
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                           <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-black/10 rounded-full">
                              <X className="w-5 h-5 text-black/60" />
                           </button>
                        )}
                    </div>

                    <div className="px-2 mt-2">
                        {searchQuery ? (
                            <div>
                                <h3 className="font-bold text-[22px] tracking-tight mb-4">Top Artists</h3>
                                <div className="flex flex-col gap-2">
                                  {NPC_ARTISTS.concat([{ name: gameState.artist?.name || 'You', type: 'Player', basePoints: 0, profilePic: gameState.artist?.image } as any]).filter(a => (a.name || '').toLowerCase().includes(searchQuery.toLowerCase())).map(a => (
                                    <div key={a.name} onClick={() => { setSpotifyViewArtist(a.name === (gameState.artist?.name || 'You') ? null : a.name); setSpotifyTab('profile'); setSearchQuery(''); }} className="flex items-center gap-4 p-2 hover:bg-white/10 rounded-md cursor-pointer transition-colors">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#282828] shrink-0">
                                            <img src={a.profilePic || (a.name === gameState.artist?.name ? gameState.artist.image : ARTIST_IMAGES[a.name] || `https://i.pravatar.cc/150?u=${encodeURIComponent(a.name)}`)} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white tracking-tight text-base">{a.name}</span>
                                            <span className="text-white/60 text-sm">Artist</span>
                                        </div>
                                    </div>
                                  ))}
                                </div>
                            </div>
                        ) : exploreCategory === 'Upcoming Release' ? (
                            <div className="pb-8">
                                <div className="flex items-center gap-4 mb-6 sticky top-0 bg-[#121212] z-10 py-4">
                                    <button onClick={() => setExploreCategory(null)} className="p-2 bg-black/40 rounded-full hover:bg-white/20">
                                        <ChevronLeft className="w-6 h-6 text-white" />
                                    </button>
                                    <h3 className="font-bold text-[28px] tracking-tight">Upcoming Releases</h3>
                                </div>
                                
                                <div className="mb-10">
                                    <h3 className="font-bold text-[22px] tracking-tight mb-4">For You</h3>
                                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x pr-8">
                                       {[...allSchedules].sort(() => Math.random() - 0.5).slice(0, 8).map((sched) => (
                                           <div key={sched.id} onClick={() => setSelectedSpotifyUpcoming(sched)} className="min-w-[150px] max-w-[150px] snap-start group cursor-pointer">
                                               <div className="w-full aspect-square bg-[#282828] mb-3 shadow-[0_8px_24px_rgba(0,0,0,0.5)] relative overflow-hidden rounded-md">
                                                  <img src={sched.coverImage} className="w-full h-full object-cover" />
                                                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold text-white backdrop-blur-md">
                                                     RECOMMENDED
                                                  </div>
                                               </div>
                                               <h3 className="font-bold text-white text-[13px] truncate group-hover:underline">{sched.releaseTitle}</h3>
                                               <p className="text-white/60 text-[12px] truncate mt-0.5 group-hover:underline">{sched.artistId}</p>
                                               <p className="text-white/40 text-[11px] truncate mt-0.5">{new Date(sched.releaseDate).toLocaleDateString()}</p>
                                           </div>
                                       ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-[22px] tracking-tight mb-4">Top 10 Upcoming</h3>
                                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x pr-8">
                                       {[...allSchedules].filter(s => ['Album', 'EP', 'Deluxe Album', 'Single Pack'].includes(s.releaseType)).sort((a,b) => b.totalPreSaves - a.totalPreSaves).slice(0, 10).map((sched, idx) => (
                                           <div key={sched.id} onClick={() => setSelectedSpotifyUpcoming(sched)} className="min-w-[150px] max-w-[150px] snap-start group cursor-pointer">
                                               <div className="w-full aspect-square bg-[#282828] mb-3 shadow-[0_8px_24px_rgba(0,0,0,0.5)] relative overflow-hidden rounded-md">
                                                  <img src={sched.coverImage} className="w-full h-full object-cover" />
                                                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold text-white backdrop-blur-md">
                                                     #{idx+1} TRENDING
                                                  </div>
                                                  <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold text-white backdrop-blur-md">
                                                     {Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short", maximumFractionDigits: 1 }).format(sched.totalPreSaves)} Pre-saves
                                                  </div>
                                               </div>
                                               <h3 className="font-bold text-white text-[13px] truncate group-hover:underline">{sched.releaseTitle}</h3>
                                               <p className="text-white/60 text-[12px] truncate mt-0.5 group-hover:underline">{sched.artistId}</p>
                                               <p className="text-white/40 text-[11px] truncate mt-0.5">{new Date(sched.releaseDate).toLocaleDateString()}</p>
                                           </div>
                                       ))}
                                    </div>
                                </div>
                            </div>
                        ) : exploreCategory ? (
                            <div className="pb-8">
                                <div className="flex items-center gap-4 mb-6 sticky top-0 bg-[#121212] z-10 py-4">
                                    <button onClick={() => setExploreCategory(null)} className="p-2 bg-black/40 rounded-full hover:bg-white/20">
                                        <ChevronLeft className="w-6 h-6 text-white" />
                                    </button>
                                    <h3 className="font-bold text-[28px] tracking-tight">{exploreCategory}</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {[
                                        { id: `ec1_${exploreCategory}`, type: 'Mix', title: `${exploreCategory} Mix`, artists: `${randNpc().name}, ${randNpc().name}`, bg: '#D8B4E2', img: getCover((exploreCategory.length) % 12), imgs: [getCover(0), getCover(1), getCover(2), getCover(3)] },
                                        { id: `ec2_${exploreCategory}`, type: 'Mix', title: `Essential ${exploreCategory}`, artists: `Top tracks you need.`, bg: '#8B5CF6', img: getCover((exploreCategory.length + 1) % 12), imgs: [getCover(4), getCover(5), getCover(6), getCover(7)] },
                                        { id: `ec3_${exploreCategory}`, type: 'Mix', title: `${exploreCategory} Hits`, artists: `Trending right now.`, bg: '#FDE047', img: getCover((exploreCategory.length + 2) % 12), imgs: [getCover(8), getCover(9), getCover(10), getCover(11)] },
                                        { id: `ec4_${exploreCategory}`, type: 'Mix', title: `Fresh ${exploreCategory}`, artists: `New releases.`, bg: '#71A0B6', img: getCover((exploreCategory.length + 3) % 12), imgs: [getCover(2), getCover(4), getCover(6), getCover(8)] },
                                        { id: `ec5_${exploreCategory}`, type: 'Mix', title: `Classic ${exploreCategory}`, artists: `Timeless hits.`, bg: '#f59e0b', img: getCover((exploreCategory.length + 4) % 12), imgs: [getCover(1), getCover(3), getCover(5), getCover(7)] },
                                        { id: `ec6_${exploreCategory}`, type: 'Mix', title: `Underground ${exploreCategory}`, artists: `Hidden gems.`, bg: '#10b981', img: getCover((exploreCategory.length + 5) % 12), imgs: [getCover(9), getCover(10), getCover(11), getCover(0)] },
                                    ].map(r => (
                                        <div key={r.id} onClick={() => setSelectedPlaylist(r)} className="cursor-pointer group">
                                           <div className="aspect-square rounded-md relative overflow-hidden bg-[#282828] mb-3">
                                              <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                                                {r.imgs?.map((img, idx) => <img key={idx} src={img} className="w-full h-full object-cover" />)}
                                              </div>
                                              <div className="absolute bottom-2 right-2 w-10 h-10 bg-[#1ed760] rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-xl z-20">
                                                  <Play className="w-5 h-5 text-black ml-1 fill-current" />
                                              </div>
                                           </div>
                                           <h3 className="font-bold text-white text-[13px] truncate group-hover:underline">{r.title}</h3>
                                           <p className="text-white/60 text-[12px] truncate mt-0.5">{r.artists}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                          <>
                            <h3 className="font-bold text-base mb-4">Browse all</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[
                                { title: 'Upcoming Release', bg: '#0f766e', isClock: true },
                                { title: 'New Releases', bg: '#477d24', img: getCover(2) },
                                { title: 'Pop', bg: '#8d67ab', img: getCover(1) },
                                { title: 'Indie', bg: '#608108', img: getCover(0) },
                                { title: 'Global', bg: '#27856a', img: getCover(10) },
                                { title: 'K-pop', bg: '#8400e7', img: getCover(9) },
                                { title: 'R&B', bg: '#e1118c', img: getCover(8) },
                                { title: 'Hip Hop', bg: '#1e3264', img: getCover(7) }
                            ].map(cat => (
                                <div key={cat.title} onClick={() => setExploreCategory(cat.title)} className="aspect-[1.5/1] rounded-lg overflow-hidden relative p-4 cursor-pointer shadow-md hover:scale-[1.02] transition-transform" style={{ backgroundColor: cat.bg }}>
                                    <span className="font-black text-white text-[17px] max-w-[80%] break-words leading-tight relative z-10">{cat.title}</span>
                                    
                                    {cat.isClock ? (
                                        <div className="absolute -bottom-8 -right-8 w-32 h-32 rotate-[15deg] shadow-lg rounded-xl overflow-hidden bg-[#84cc16] flex items-center justify-center relative border border-white/20">
                                            {/* Timer visual inspired by the image */}
                                            <div className="w-[110%] h-[110%] absolute rounded-full border-4 border-dashed border-[#4d7c0f]/40 animate-[spin_60s_linear_infinite]" />
                                            <div className="absolute inset-0 bg-gradient-to-tr from-[#65a30d] to-[#bef264] mix-blend-overlay" />
                                            <div className="bg-[#1a2e05]/60 block whitespace-nowrap rounded-lg px-2 py-1 text-white font-mono font-bold text-[10px] tracking-wider z-10 shadow-inner flex items-center gap-1">
                                                <span>15</span>
                                                <span className="text-white/50 animate-pulse">:</span>
                                                <span>04</span>
                                                <span className="text-white/50 animate-pulse">:</span>
                                                <span className="text-white/70">59</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="absolute -bottom-2 -right-4 w-[85px] h-[85px] rotate-[25deg] shadow-lg rounded-md overflow-hidden bg-black/20">
                                            {cat.img ? <img src={cat.img} className="w-full h-full object-cover" /> : null}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                          </>
                        )}
                    </div>
                </div>
            )
        }

        return (
            <div>
                {/* Header Hero */}
                <div className="h-[40vh] md:h-[50vh] relative flex flex-col justify-end p-6 md:p-12 overflow-hidden shrink-0">
                {artistImage ? (
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${artistImage})` }}></div>
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
                        <span className="text-white text-sm font-medium">Verified Artist</span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black mb-2 tracking-tighter">{artistName}</h1>
                    <p className="text-white/70 text-sm md:text-base font-medium">{(listenersCount || 0).toLocaleString('en-US')} monthly listeners</p>
                </div>
                </div>

                {/* Actions */}
                <div className="p-6 md:px-12 flex items-center gap-4 shrink-0">
                <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden shrink-0 hidden md:block" onClick={() => setShowAllDiscography(true)}>
                    {artistImage ? <img src={artistImage || undefined} className="w-full h-full object-cover"/> : <User className="w-full h-full text-white/20" />}
                </div>
                {isNPC ? (
                    <button className="border border-white hover:border-transparent hover:bg-white hover:text-black rounded-full px-4 py-1.5 text-xs font-bold transition-all text-white border-white/50">Follow</button>
                ) : (
                    <button className="border border-white/50 rounded-full px-4 py-1.5 text-xs font-bold text-white">Following</button>
                )}
                
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
                        <div key={song.id} className="flex items-center gap-4 hover:bg-white/10 p-2 rounded-lg group cursor-pointer" onClick={() => !isNPC ? handleSelectRelease(song as Release) : setSelectedSpotifyRelease(song as Release)}>
                            <div className="w-6 text-center text-white/60 font-medium text-sm group-hover:hidden">{i + 1}</div>
                            <div className="w-6 text-center text-white hidden group-hover:block"><Play className="w-4 h-4 fill-current m-auto"/></div>
                            <div className="w-10 h-10 bg-[#282828] shrink-0 rounded overflow-hidden">
                                {song.coverImage ? <img src={song.coverImage || undefined} className="w-full h-full object-cover" /> : <Disc className="w-5 h-5 text-white/20 m-auto mt-2.5" />}
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                <span className="text-white text-[15px] group-hover:underline">{song.title}</span>
                            </div>
                            <span className="text-white/60 text-[13px] font-mono mr-4">{
                                getPlatformStreams(song as Song, 'spotify').toLocaleString('en-US')
                            }</span>
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
                {popularRelease && (
                    <div className="px-6 md:px-12 mt-10 shrink-0">
                    <div className="flex justify-between items-end mb-4 max-w-sm">
                        <h2 className="text-xl font-bold">Artist Pick</h2>
                        {!isNPC && standaloneReleases.length > 0 && (
                            <button className="text-white/60 text-[13px] font-bold hover:underline mb-[2px]" onClick={() => setIsSelectingPick(true)}>Edit</button>
                        )}
                    </div>
                    <div className="flex gap-4 items-start max-w-sm cursor-pointer group" onClick={() => !isNPC ? handleSelectRelease(popularRelease as Release) : setSelectedSpotifyRelease(popularRelease as Release)}>
                        <div className="w-[84px] h-[84px] bg-[#282828] shrink-0 rounded-md overflow-hidden relative">
                            {popularRelease.coverImage ? <img src={popularRelease.coverImage || undefined} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <Disc className="w-8 h-8 text-white/20 m-auto mt-6" />}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                            <div className="w-5 h-5 rounded-full overflow-hidden bg-white/20 shrink-0">
                                {artistImage && <img src={artistImage || undefined} className="w-full h-full object-cover" />}
                            </div>
                            <span className="text-white/60 text-xs font-bold">Posted by {artistName}</span>
                            </div>
                            <span className="text-white text-[15px] font-medium leading-tight group-hover:underline">{popularRelease.title}</span>
                            <span className="text-white/60 text-[13px] capitalize mt-1">{popularRelease.type}</span>
                        </div>
                    </div>
                    </div>
                )}

                {/* Upcoming Release Section */}
                {(() => {
                    const dt = new Date(gameState.time.startDate);
                    dt.setDate(dt.getDate() + gameState.time.daysPassed);
                    const isNPCNow = !!spotifyViewArtist;
                    const cArtist = isNPCNow ? spotifyViewArtist : gameState.artist.name;
                    
                    const npcSc = isNPCNow ? gameState.releases.filter(r => r.status === 'Scheduled' && (r as any).isNPCRelease && (r as any).artistId === spotifyViewArtist && (['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(r.type) || (r.type === 'Single' && !(r as any).isBSide))).map(r => {
                       const isAlb = ['Album', 'EP', 'Deluxe Album'].includes(r.type);
                       return {
                         id: r.id,
                         artistId: (r as any).artistId,
                         releaseTitle: r.title,
                         coverImage: r.coverImage || undefined,
                         type: r.type,
                         releaseDate: r.releaseDate || dt.toISOString(),
                         totalPreSaves: r.totalPreSaves || 0,
                         isPlayerRelease: false,
                         isNPCRelease: true
                       };
                    }) : [];
                    const pSc = isNPCNow ? [] : gameState.releases.filter(r => r.status === 'Scheduled' && !(r as any).isNPCRelease && (['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(r.type) || (r.type === 'Single' && !(r as any).isBSide))).map(r => {
                       const isAlb = ['Album', 'EP', 'Deluxe Album'].includes(r.type);
                       return {
                         id: r.id,
                         artistId: gameState.artist.name,
                         releaseTitle: r.title,
                         releaseType: r.type,
                         coverImage: r.coverImage || undefined,
                         bannerImage: r.coverImage || undefined,
                         releaseDate: r.releaseDate || new Date().toISOString(),
                         announcementDate: r.releaseDate || new Date().toISOString(),
                         status: 'upcoming',
                         totalPreSaves: r.totalPreSaves || 0,
                         dailyPreSaves: 0,
                         preSaveGrowth: 1,
                         hypeScore: 100,
                         popularityScore: 100,
                         isPlayerRelease: true,
                         isNPCRelease: false,
                         tracks: isAlb ? (r as any).trackIds?.map((tid:string, idx:number) => {
                             const song = gameState.releases.find(x => x.id === tid);
                             return {
                                 id: tid, title: song?.title || 'Track ' + (idx+1), isReleased: false, isAnnounced: false, isHidden: true 
                             }
                         }) || [] : []
                       };
                    });

                    const mySc = [...npcSc, ...pSc].sort((a,b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
                    
                    if (mySc.length === 0) return null;
                    return (
                        <div className="px-6 md:px-12 mt-12 shrink-0">
                            <h2 className="text-xl font-bold mb-4">Upcoming Release</h2>
                            <div className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar">
                                {mySc.map(sc => (
                                   <div key={sc.id} onClick={() => setSelectedSpotifyUpcoming(sc)} className="min-w-[140px] max-w-[140px] flex flex-col gap-3 group cursor-pointer">
                                       <div className="w-[140px] h-[140px] overflow-hidden rounded bg-[#282828] relative shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                                          <img src={sc.coverImage} className="w-full h-full object-cover" />
                                          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-[10px] font-bold text-white px-2 py-0.5 rounded">
                                             Upcoming
                                          </div>
                                       </div>
                                       <div className="flex flex-col">
                                          <span className="text-white text-[14px] font-medium leading-tight truncate group-hover:underline">{sc.releaseTitle}</span>
                                          <span className="text-white/60 text-[13px] capitalize truncate mt-1">{sc.releaseType} • {new Date(sc.releaseDate).toLocaleDateString()}</span>
                                       </div>
                                   </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                {/* Popular Releases */}
                {(isNPC ? npcReleases : standaloneReleases).length > 0 && (
                    <div className="px-6 md:px-12 mt-12 shrink-0">
                    <div className="flex justify-between items-end mb-4">
                        <h2 className="text-xl font-bold">Popular releases</h2>
                        <span className="text-white/60 text-[13px] font-bold hover:underline cursor-pointer" onClick={() => setShowAllDiscography(true)}>Show all</span>
                    </div>
                    
                    <div className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar">
                        {(isNPC ? npcReleases.slice(0, 8) : [...standaloneReleases].sort((a, b) => getPlatformStreams(b, 'spotify') - getPlatformStreams(a, 'spotify')).slice(0, 5)).map((rel, i) => (
                            <div key={rel.id} className="min-w-[140px] max-w-[140px] flex flex-col gap-3 group cursor-pointer" onClick={() => !isNPC ? handleSelectRelease(rel) : setSelectedSpotifyRelease(rel as Release)}>
                            <div className="w-full aspect-square bg-[#282828] rounded-md overflow-hidden relative">
                                {rel.coverImage ? <img src={rel.coverImage || undefined} className="w-full h-full object-cover" /> : <Disc className="w-12 h-12 text-white/20 m-auto mt-10" />}
                                <div className="absolute bottom-2 right-2 w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-xl">
                                    <Play className="w-5 h-5 text-black fill-current ml-1" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white font-bold text-[15px] truncate mt-1 group-hover:underline">{rel.title}</span>
                                <span className="text-white/60 text-[13px] capitalize truncate">{rel.type || 'Single'}</span>
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
                )}

                {/* Artist Playlists */}
                {(isNPC || publishedReleases.length >= 1) && (
                <div className="px-6 md:px-12 mt-12 shrink-0">
                    <h2 className="text-xl font-bold mb-4">Featuring {artistName}</h2>
                    <div className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar">
                        {[
                            { id: 'ap1', type: 'This Is', artist: artistName, text: `This is ${artistName}. The essential tracks, all in one playlist.`, bg: '#0ea5e9', img: artistImage },
                            { id: 'ap2', type: 'Mix', artist: artistName, text: `${artistName}, ${NPC_ARTISTS[0].name}, and more`, bg: '#FDE047', img: artistImage, imgs: [artistImage, getImg(top10[1]?.name || randNpc().name), getImg(top10[2]?.name || randNpc().name), getImg(top10[3]?.name || randNpc().name)] },
                            { id: 'ap3', type: 'Radio', artist: artistName, text: `Catch similar vibes.`, bg: '#8b5cf6', img: artistImage, imgs: [artistImage, getImg(randNpc().name), getImg(randNpc().name), getImg(randNpc().name)] }
                        ].map((r, i) => (
                            <div key={r.id} onClick={() => setSelectedPlaylist(r)} className="min-w-[150px] max-w-[150px] cursor-pointer group">
                                <div className="aspect-square rounded-md flex flex-col justify-between relative overflow-hidden bg-white/10" style={(r.type === 'This Is' || r.type === 'Mix') ? {} : { backgroundColor: r.bg }}>
                                    {r.type === 'This Is' && (
                                       <>
                                       <div className="absolute inset-0 bg-white" />
                                       <div className="absolute inset-x-0 bottom-0 top-[60%]" style={{ backgroundColor: r.bg }} />
                                       <h3 className="font-black text-black text-center text-xl mt-3 relative z-20">THIS IS</h3>
                                       <div className="flex-1 w-full relative z-20 flex items-center justify-center">
                                          {r.img ? <img src={r.img} className="h-full object-cover rounded shadow-[0_8px_20px_rgba(0,0,0,0.4)] relative mt-2" /> : <div className="h-[80%] aspect-square bg-[#282828] rounded" />}
                                       </div>
                                       <h3 className="font-black text-black text-center text-[19px] mb-2 leading-tight relative z-20 tracking-tighter" style={{ color: r.bg === '#06B6D4' ? '#000' : '#fff' }}>{r.artist}</h3>
                                       </>
                                    )}
                                    {r.type === 'Mix' && (
                                       <>
                                        <div className="absolute inset-0 bg-[#282828]" />
                                        {r.img && <img src={r.img} className="absolute inset-0 w-full h-full object-cover" />}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                        <div className="relative z-20 flex px-2 mb-3 mt-auto">
                                           <div className="w-1.5 h-[22px] shrink-0 mr-1.5 bg-white" style={{ backgroundColor: r.bg }} />
                                           <span className="bg-white/90 px-1 text-[13px] font-black text-black leading-tight tracking-tight shadow-md py-0.5">{r.artist} Mix</span>
                                        </div>
                                       </>
                                    )}
                                    {r.type === 'Radio' && (
                                       <>
                                         <h3 className="font-black text-black text-2xl p-3 z-20 relative mix-blend-multiply">{r.artist}<br/>Radio</h3>
                                         {r.img ? <img src={r.img} className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] object-cover rounded shadow-2xl rotate-12" /> : null}
                                       </>
                                    )}
                                    <div className="absolute bottom-2 right-2 w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-xl z-30">
                                        <Play className="w-5 h-5 text-black fill-current ml-1" />
                                    </div>
                                </div>
                                <p className="text-white/50 text-[13px] font-medium mt-3 line-clamp-2 leading-snug hover:text-white/80">{r.text}</p>
                             </div>
                        ))}
                    </div>
                </div>
                )}

                {/* About */}
                <div className="px-6 md:px-12 mt-12 shrink-0 max-w-4xl pb-12">
                <h2 className="text-xl font-bold mb-4">About</h2>
                <div className="relative rounded-xl overflow-hidden cursor-pointer group aspect-[4/3] md:aspect-[21/9]">
                    {artistImage ? (
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${artistImage})` }}></div>
                    ) : (
                        <div className="absolute inset-0 bg-[#282828]"></div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-8 pt-24 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                        {!isNPC && <p className="text-white text-[13px] font-bold mb-2 uppercase tracking-wide">#{Math.max(1, 1000 - gameState.artist.level * 10)} in the world</p>}
                        <h3 className="text-4xl font-black mb-3">{artistName}</h3>
                        <p className="text-white text-base mb-4">{(listenersCount || 0).toLocaleString('en-US')} monthly listeners</p>
                        <p className="text-white/80 text-sm line-clamp-3 leading-snug">
                            {isNPC ? `${artistName} continues to dominate charts across the globe, accumulating billions of streams.` : (gameState.artist.socialProfile?.bio || `Following the release of their recent projects, ${artistName} connects with fans worldwide and continues to dominate the global charts.`)}
                            <span className="text-white font-bold ml-1 hover:underline"> see all</span>
                        </p>
                    </div>
                </div>
                </div>
            </div>
        );
    }

    return (
      <div className="bg-[#121212] text-white overflow-hidden relative min-h-screen flex flex-col font-sans selection:bg-[#1db954]/30">
         <div className="flex-1 overflow-y-auto pb-24 hide-scrollbar min-h-screen">
            {renderSpotifyContent()}
         </div>

         {/* Bottom Nav */}
         <div className="fixed bottom-0 left-0 right-0 py-3 bg-[#121212] border-t border-white/10 z-[200] flex justify-center items-end px-6 gap-12 md:gap-24 block">
             <button onClick={() => { setSpotifyTab('home'); setSelectedPlaylist(null); }} className={`flex flex-col items-center gap-1 transition-colors ${spotifyTab === 'home' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}>
                <Home className={`w-6 h-6 ${spotifyTab==='home'?'fill-current':''}`} />
                <span className="text-[10px] font-medium tracking-wide">Home</span>
             </button>
             <button onClick={() => { setSpotifyTab('explore'); setExploreCategory(null); setSelectedPlaylist(null); }} className={`flex flex-col items-center gap-1 transition-colors ${spotifyTab === 'explore' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}>
                <Search className={`w-6 h-6 ${spotifyTab==='explore'?'text-white font-black':''}`} strokeWidth={spotifyTab==='explore'?3:2} />
                <span className="text-[10px] font-medium tracking-wide">Search</span>
             </button>
             <button onClick={() => { setSpotifyTab('profile'); setSpotifyViewArtist(null); setSelectedPlaylist(null); }} className={`flex flex-col items-center gap-1 transition-colors ${spotifyTab === 'profile' && !spotifyViewArtist ? 'text-white' : 'text-white/50 hover:text-white/80'}`}>
                {gameState.artist.image ? (
                   <img src={gameState.artist.image} className={`w-6 h-6 rounded-full object-cover border-2 ${spotifyTab==='profile' && !spotifyViewArtist ? 'border-white' : 'border-transparent'}`} />
                ) : (
                   <Library className={`w-6 h-6 ${spotifyTab==='profile' && !spotifyViewArtist ?'fill-current':''}`} />
                )}
                <span className="text-[10px] font-medium tracking-wide">Your Library</span>
             </button>
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
                  {(isNPC ? npcReleases : standaloneReleases.slice().reverse()).filter(rel => {
                     if (discoFilter === 'Albums') return ['Album', 'Deluxe Album'].includes(rel.type);
                     if (discoFilter === 'Singles') return ['EP', 'Single Pack', 'Single'].includes(rel.type);
                     return true;
                  }).map((rel, i) => (
                     <div key={rel.id} className="flex gap-4 items-center group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-lg" onClick={() => { if(!isNPC) { handleSelectRelease(rel); } else { setSelectedSpotifyRelease(rel as Release); }}}>
                        <div className="w-20 h-20 bg-[#282828] rounded-md overflow-hidden relative shrink-0 shadow-lg">
                           {rel.coverImage ? <img src={rel.coverImage || undefined} className="w-full h-full object-cover" /> : <Disc className="w-10 h-10 text-white/20 m-auto mt-5" />}
                        </div>
                        <div className="flex flex-col flex-1">
                            <span className="text-white font-bold text-lg leading-tight group-hover:underline">{rel.title}</span>
                            <span className="text-white/60 text-sm capitalize mt-1 border-b border-transparent">{rel.type || 'Single'}</span>
                        </div>
                     </div>
                  ))}
                  {(isNPC ? npcReleases : standaloneReleases).length === 0 && <p className="text-white/50">No releases yet.</p>}
               </div>
            </div>
         )}

         {/* Select Artist Pick Popup */}
         {isSelectingPick && !isNPC && (
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
            <div className="fixed inset-0 z-[400] bg-[#121212] overflow-y-auto shadow-2xl">
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
                        {(isNPC ? artistImage : gameState.artist.image) && <img src={(isNPC ? artistImage : gameState.artist.image) || undefined} className="w-full h-full object-cover" />}
                     </div>
                     <span className="hover:underline cursor-pointer">{isNPC ? (selectedSpotifyRelease as any).artist : getArtistStr(selectedSpotifyRelease)}</span>
                     <span className="text-white/40">•</span>
                     <span className="text-white/60 capitalize">{selectedSpotifyRelease.type || 'Single'}</span>
                     <span className="text-white/40">•</span>
                     <span className="text-white/60">{new Date(selectedSpotifyRelease.releaseDate || new Date().toISOString()).getFullYear()}</span>
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
                     {(() => {
                        let tracksToList: any[] = [];
                        if (['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(selectedSpotifyRelease.type)) {
                            tracksToList = ((selectedSpotifyRelease as Album).trackIds || []).map(tid => gameState.releases.find(r => r?.id === tid)).filter(Boolean);
                        } else {
                            tracksToList = [selectedSpotifyRelease];
                        }

                        return tracksToList.map((t, i) => (
                           <div key={t?.id || i} className="flex items-center justify-between py-2 px-2 hover:bg-white/10 rounded-md group cursor-pointer transition-colors">
                              <div className="flex items-center gap-4">
                                 <div className="flex flex-col">
                                    <span className="text-white text-base group-hover:underline">{t?.title}</span>
                                    <div className="flex items-center gap-2 text-white/60 text-sm mt-0.5 font-bold">
                                        {t && (t as Song).isBSide === false && <span className="bg-white/30 text-black text-[9px] px-1 rounded-sm uppercase tracking-widest font-black inline-block -mt-0.5 pb-px">E</span>}
                                        <span className="font-mono">{getPlatformStreams(t as Song, 'spotify').toLocaleString('en-US')}</span>
                                    </div>
                                 </div>
                              </div>
                              <span className="text-white/40 text-sm font-medium mr-2">
                                  3:27
                              </span>
                           </div>
                        ));
                     })()}
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

    const allPublishedRels = gameState.releases.filter(r => r.status === 'Published');
    const allSortedRels = [...allPublishedRels].sort((a,b) => new Date(b.releaseDate!).getTime() - new Date(a.releaseDate!).getTime());
    
    const newThisWeekRels = allSortedRels.slice(0, 10);
    const recentRels = allSortedRels.slice(10, 25);
    const trendingList = allPublishedRels.filter(r => r.type === 'Single' && !isProject(r.type)).sort((a,b) => getPlatformStreams(b, 'appleMusic') - getPlatformStreams(a, 'appleMusic')).slice(0, 10);
    const comingSoonRels = gameState.schedules && gameState.schedules.length > 0 ? gameState.schedules : [];

    const SectionHeader = ({ title }: { title: string }) => (
        <h2 className="text-[22px] md:text-2xl font-bold mb-4 flex items-center gap-1 cursor-pointer hover:opacity-80 group">
            {title} <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
        </h2>
    );

    const isNPC = !!appleViewArtist;
    const currentArtistData = isNPC ? NPC_ARTISTS.find(a => a.name === appleViewArtist) : null;
    const artistName = isNPC ? currentArtistData?.name || "NPC" : gameState.artist.name;
    const artistImage = isNPC ? (ARTIST_PICS[artistName] || ARTIST_IMAGES[artistName] || undefined) : (gameState.artist.image || undefined);

    const viewArtistRels = appleViewArtist ? gameState.releases.filter(r => (r as any).artistId === appleViewArtist && r.status === 'Published') : publishedReleases;
    const viewArtistSongs = viewArtistRels.filter(r => r.type === 'Single' && !isProject(r.type));
    const topSongs = viewArtistSongs.slice().sort((a,b) => getPlatformStreams(b, 'appleMusic') - getPlatformStreams(a, 'appleMusic')).slice(0, 5);
    const appleAlbums = viewArtistRels.filter(r => isProject(r.type)).slice().reverse();
    const appleSingles = viewArtistRels.filter(r => !isProject(r.type)).slice().reverse();


    const currentWeekNumber = Math.max(1, Math.floor(gameState.time.daysPassed / 7)); 
    const currentWeekFluctuation = 1 + (Math.sin(currentWeekNumber / 10) * 0.05);
    const pName = gameState.artist?.name || '';
    const npcSingles = gameState.releases.filter(r => r.type === 'Single' && r.status === 'Published' && (r as any).isNPCRelease).map(s => ({
        ...s,
        artist: (s as any).artistId,
        points: (s.lastDailyStreams?.appleMusic || 0) + (Math.random() * 10) // Map stream to points dynamically for Amazon/Apple charts
    }));
    const npcAlbums = gameState.releases.filter(r => ['Album', 'EP', 'Deluxe Album', 'Single Pack'].includes(r.type) && r.status === 'Published' && (r as any).isNPCRelease).map(a => ({
        ...a,
        artist: (a as any).artistId,
        points: (a.lastDailyStreams?.appleMusic || 0) + (Math.random() * 10)
    }));

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
            let streams = npc.points; 
            
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
        let streams = npc.points; 
        return { album: npc, streams, artist: npc.artist, isPlayer: false };
    });

    const combinedAlbumsList = [...globalAlbumsList, ...npcAlbumsList].sort((a,b) => b.streams - a.streams).slice(0, 200);

    const renderApplePlaylistContent = () => {
        if (!appleSelectedPlaylist) return null;
        return (
            <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-12 text-left">
                 <button onClick={() => setAppleSelectedPlaylist(null)} className="mb-8 flex items-center text-[#fa243c] font-bold text-sm tracking-wide uppercase hover:opacity-80">
                     <ChevronLeft className="w-5 h-5 mr-1" /> Back
                 </button>
                 <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
                     <div className="w-56 h-56 md:w-72 md:h-72 shrink-0 rounded-2xl relative overflow-hidden shadow-2xl bg-zinc-900 border border-zinc-800">
                           {appleSelectedPlaylist.imgs ? (
                               <div className="w-full h-full grid grid-cols-2 grid-rows-2">
                                  {appleSelectedPlaylist.imgs.map((img: string, idx: number) => (
                                     <img key={idx} src={img} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                                  ))}
                               </div>
                           ) : (
                               <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-zinc-800 to-black">
                                   {appleSelectedPlaylist.img && <img src={appleSelectedPlaylist.img} className="w-full h-full object-cover rounded-xl shadow-lg" />}
                               </div>
                           )}
                           <div className="absolute inset-0 opacity-40 mix-blend-color" style={{ backgroundColor: appleSelectedPlaylist.bg }} />
                     </div>
                     <div className="flex flex-col justify-end pt-4 md:pt-12">
                         <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">{appleSelectedPlaylist.type || 'Playlist'}</span>
                         <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-none">{appleSelectedPlaylist.title || appleSelectedPlaylist.artist + ' Essentials'}</h1>
                         <p className="text-zinc-400 text-base max-w-xl mb-4">{appleSelectedPlaylist.desc || appleSelectedPlaylist.text || 'Apple Music'}</p>
                         <div className="flex items-center gap-4 text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                             <span className="text-[#fa243c]">Apple Music</span>
                             <span>•</span>
                             <span>20 Songs</span>
                         </div>
                         <div className="mt-8 flex gap-4">
                             <button className="bg-[#fa243c] text-white px-8 py-3.5 rounded-full font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-red-500/20"><Play className="w-5 h-5 fill-current" /> Play</button>
                             <button className="bg-zinc-800 text-[#fa243c] p-3.5 rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors"><Plus className="w-5 h-5" /></button>
                             <button className="bg-zinc-800 text-[#fa243c] p-3.5 rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors"><MoreHorizontal className="w-5 h-5" /></button>
                         </div>
                     </div>
                 </div>
                 
                 <div className="w-full text-left">
                      <div className="flex text-zinc-500 text-[11px] font-bold uppercase tracking-widest mb-4 px-4 border-b border-zinc-800 pb-3">
                          <div className="w-8">#</div>
                          <div className="flex-1">Title</div>
                          <div className="hidden md:block w-32 text-right pr-4">Time</div>
                      </div>
                      {getPlaylistTracks(appleSelectedPlaylist).map((t: any, i: number) => (
                          <div key={t.id} onClick={() => {}} className="flex items-center group hover:bg-zinc-900/50 p-3 -mx-3 rounded-xl transition-colors cursor-pointer border-b border-zinc-800/50">
                              <div className="w-8 text-zinc-500 font-medium text-sm text-center group-hover:text-white px-2">{i + 1}</div>
                              <div className="flex-1 flex items-center gap-4">
                                   <div className="relative w-12 h-12 rounded-md overflow-hidden bg-zinc-800 shrink-0">
                                       <img src={t.img} className="w-full h-full object-cover" />
                                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                           <Play className="w-5 h-5 text-white fill-current" />
                                       </div>
                                   </div>
                                   <div className="flex flex-col">
                                       <span className="font-semibold text-white text-[15px] group-hover:text-[#fa243c] transition-colors line-clamp-1">{t.title}</span>
                                       <span className="text-zinc-400 text-sm hover:underline line-clamp-1">{t.artist}</span>
                                   </div>
                              </div>
                              <div className="hidden md:block w-32 text-zinc-500 font-medium text-sm text-right pr-4">{t.duration}</div>
                          </div>
                      ))}
                 </div>
            </div>
        );
    };

    return (
      <div className="bg-[#000000] text-white min-h-screen flex flex-col font-sans selection:bg-[#fa243c]/10 pb-32 relative">
        {appleSelectedPlaylist ? renderApplePlaylistContent() : appleMusicTab === 'home' ? (
            <div className="w-full max-w-7xl mx-auto px-6 md:px-12 pt-16 text-left pb-16">
                <h1 className="text-4xl md:text-5xl font-black mb-12 tracking-tight line-clamp-1">Browse</h1>

                {/* New This Week */}
                <div className="mb-14">
                    <SectionHeader title="New This Week" />
                    <div className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-6 snap-x">
                        {newThisWeekRels.map(rel => (
                            <div key={rel.id} className="min-w-[160px] max-w-[160px] md:min-w-[200px] md:max-w-[200px] cursor-pointer group flex flex-col gap-2 snap-start" onClick={() => handleSelectAppleRelease(rel as Release)}>
                                <div className="w-full aspect-square rounded-xl overflow-hidden shadow-lg relative bg-zinc-900 border border-zinc-800">
                                    <img src={rel.coverImage || getCover(1)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play className="w-3.5 h-3.5 text-white fill-current ml-0.5" />
                                    </div>
                                </div>
                                <div className="flex flex-col mt-1">
                                    <span className="font-semibold text-white text-[15px] leading-tight line-clamp-1">{rel.title}</span>
                                    <span className="text-zinc-400 text-[13px] hover:underline line-clamp-1">{rel.artistId || gameState.artist.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Releases */}
                <div className="mb-14">
                    <SectionHeader title="Recent Releases" />
                    <div className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-6 snap-x">
                        {recentRels.map(rel => (
                            <div key={rel.id} className="min-w-[160px] max-w-[160px] md:min-w-[200px] md:max-w-[200px] cursor-pointer group flex flex-col gap-2 snap-start" onClick={() => handleSelectAppleRelease(rel as Release)}>
                                <div className="w-full aspect-square rounded-xl overflow-hidden shadow-lg relative bg-zinc-900 border border-zinc-800">
                                    <img src={rel.coverImage || getCover(2)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex flex-col mt-1">
                                    <span className="font-semibold text-white text-[15px] leading-tight line-clamp-1">{rel.title}</span>
                                    <span className="text-zinc-400 text-[13px] hover:underline line-clamp-1">{rel.artistId || gameState.artist.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Updated Playlists */}
                <div className="mb-14">
                    <SectionHeader title="Updated Playlists" />
                    <div className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-6 snap-x">
                        {[
                            { id: 'ap_1', type: 'Playlist', title: 'New Music Daily', desc: 'Apple Music', bg: '#fa243c', imgs: [getCover(2), getCover(6), getCover(10), getCover(1)] },
                            { id: 'ap_2', type: 'Playlist', title: 'Pop Essentials', desc: 'Apple Music Pop', bg: '#3b82f6', imgs: [getCover(4), getCover(8), getCover(0), getCover(7)] },
                            { id: 'ap_3', type: 'Playlist', title: 'Disney Essentials', desc: 'Apple Music Kids', bg: '#10b981', img: getCover(5) },
                            { id: 'ap_4', type: 'Playlist', title: 'Rap Life', desc: 'Apple Music Hip-Hop', bg: '#fbbf24', imgs: [getCover(7), getCover(11), getCover(3), getCover(6)] },
                            { id: 'ap_5', type: 'Playlist', title: 'Today\'s Hits', desc: 'Apple Music Hits', bg: '#c026d3', imgs: [getCover(1), getCover(9), getCover(5), getCover(8)] },
                        ].map(pl => (
                            <div key={pl.id} onClick={() => setAppleSelectedPlaylist(pl)} className="min-w-[160px] max-w-[160px] md:min-w-[200px] md:max-w-[200px] cursor-pointer group flex flex-col gap-2 snap-start">
                                <div className="w-full aspect-square rounded-xl overflow-hidden shadow-lg mb-1 relative bg-zinc-900 border border-zinc-800">
                                    {pl.imgs ? (
                                       <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                                          {pl.imgs.map((img, idx) => <img key={idx} src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />)}
                                       </div>
                                    ) : (
                                       <img src={pl.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    )}
                                    <div className="absolute inset-0 opacity-40 mix-blend-color" style={{ backgroundColor: pl.bg }} />
                                    <div className="absolute top-2 right-2 text-white text-[10px] md:text-xs font-bold flex items-center justify-center p-1 px-1.5 md:px-2 rounded-md bg-black/40 backdrop-blur-md">
                                        <svg width="10" height="10" viewBox="0 0 100 100" className="mr-1 fill-current"><path d="M50 0 A50 50 0 1 0 50 100 A50 50 0 1 0 50 0 Z M50 20 A30 30 0 1 1 50 80 A30 30 0 1 1 50 20 Z" /></svg>
                                        Music
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-white text-[15px] leading-tight line-clamp-1">{pl.title}</span>
                                    <span className="text-zinc-400 text-[13px] line-clamp-1">{pl.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Essentials */}
                <div className="mb-14">
                    <SectionHeader title="Essentials" />
                    <div className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-6 snap-x">
                        {[
                            { id: 'ess_1', type: 'Essentials', title: `${top10[0]?.name || randNpc().name} Essentials`, desc: 'Apple Music', bg: '#0ea5e9', img: getImg(top10[0]?.name || randNpc().name) },
                            { id: 'ess_2', type: 'Essentials', title: `${top10[1]?.name || randNpc().name} Essentials`, desc: 'Apple Music', bg: '#8b5cf6', img: getImg(top10[1]?.name || randNpc().name) },
                            { id: 'ess_3', type: 'The Warm-Up', title: `${top10[2]?.name || randNpc().name}: The Warm-Up`, desc: 'Apple Music', bg: '#10b981', img: getImg(top10[2]?.name || randNpc().name) },
                            { id: 'ess_4', type: 'Deep Cuts', title: `${gameState.artist.name} Deep Cuts`, desc: 'Apple Music', bg: '#f43f5e', img: gameState.artist.image },
                        ].map(pl => (
                            <div key={pl.id} onClick={() => setAppleSelectedPlaylist(pl)} className="min-w-[160px] max-w-[160px] md:min-w-[200px] md:max-w-[200px] cursor-pointer group flex flex-col gap-2 snap-start">
                                <div className="w-full aspect-square rounded-xl overflow-hidden shadow-lg relative bg-zinc-900 border border-zinc-800">
                                    {pl.img && <img src={pl.img} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />}
                                    <div className="absolute inset-0 opacity-40 mix-blend-color" style={{ backgroundColor: pl.bg }} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-3 md:p-4">
                                         <div className="self-end text-white text-[10px] font-bold flex items-center justify-center p-1 px-1.5 rounded-md bg-black/40 backdrop-blur-md">
                                             <svg width="10" height="10" viewBox="0 0 100 100" className="mr-1 fill-current"><path d="M50 0 A50 50 0 1 0 50 100 A50 50 0 1 0 50 0 Z M50 20 A30 30 0 1 1 50 80 A30 30 0 1 1 50 20 Z" /></svg>
                                             Music
                                         </div>
                                         <h3 className="font-black text-white text-lg md:text-xl leading-tight line-clamp-2">{pl.title}</h3>
                                    </div>
                                </div>
                                <div className="flex flex-col mt-0.5">
                                    <span className="font-semibold text-white text-[15px] leading-tight line-clamp-1">{pl.title}</span>
                                    <span className="text-zinc-400 text-[13px] line-clamp-1">{pl.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* DJ Mixes */}
                <div className="mb-14">
                    <SectionHeader title="Pride DJ Mixes" />
                    <div className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-6 snap-x">
                        {[
                            { id: 'dj_1', type: 'DJ Mix', title: 'Pride 2026 (DJ Mix)', desc: 'Scissor Sisters', bg: '#ec4899', img: getCover(9) },
                            { id: 'dj_2', type: 'DJ Mix', title: 'Pride 2026 (DJ Mix)', desc: 'Shea Couleé', bg: '#ec4899', img: getCover(10) },
                            { id: 'dj_3', type: 'DJ Mix', title: 'Pride 2026 (DJ Mix)', desc: 'Juliana Huxtable', bg: '#ec4899', img: getCover(11) },
                            { id: 'dj_4', type: 'DJ Mix', title: 'Pride 2026 (DJ Mix)', desc: 'KAYTRANADA', bg: '#ec4899', img: getCover(5) },
                        ].map(pl => (
                            <div key={pl.id} onClick={() => setAppleSelectedPlaylist(pl)} className="min-w-[160px] max-w-[160px] md:min-w-[200px] md:max-w-[200px] cursor-pointer group flex flex-col gap-2 snap-start">
                                <div className="w-full aspect-square rounded-xl overflow-hidden shadow-lg relative bg-pink-600/20 border border-pink-500/20">
                                    <img src={pl.img} className="w-full h-full object-cover mix-blend-overlay opacity-80 group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                                    <span className="absolute top-3 left-3 text-white font-bold text-xs uppercase tracking-widest">DJ Mix</span>
                                    <div className="absolute top-3 right-3 text-white text-[10px] font-bold flex items-center justify-center p-1 px-1.5 rounded-md bg-black/40 backdrop-blur-md">
                                        <svg width="10" height="10" viewBox="0 0 100 100" className="mr-1 fill-current"><path d="M50 0 A50 50 0 1 0 50 100 A50 50 0 1 0 50 0 Z M50 20 A30 30 0 1 1 50 80 A30 30 0 1 1 50 20 Z" /></svg>
                                        Music
                                    </div>
                                    <h3 className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-black text-pink-300 text-3xl opacity-40 uppercase scale-x-125">Pride</h3>
                                </div>
                                <div className="flex flex-col mt-1 relative">
                                    <span className="font-semibold text-white text-[15px] leading-tight line-clamp-1">{pl.title}</span>
                                    <span className="text-zinc-400 text-[13px] hover:underline line-clamp-1">{pl.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Trending Songs */}
                <div className="mb-14">
                    <SectionHeader title="Trending Songs" />
                    <div className="grid grid-rows-4 grid-flow-col gap-x-8 gap-y-3 overflow-x-auto hide-scrollbar pb-6 snap-x">
                        {trendingList.map((rel, i) => (
                            <div key={rel.id} className="w-[300px] md:w-[350px] flex items-center gap-4 group cursor-pointer hover:bg-zinc-900 p-2 -ml-2 rounded-xl border-b border-zinc-800/50 snap-start" onClick={() => handleSelectAppleRelease(rel as Release)}>
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-md overflow-hidden bg-zinc-800 shrink-0 relative">
                                    <img src={rel.coverImage || getCover(i)} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                                    </div>
                                </div>
                                <div className="flex flex-col flex-1 min-w-0 justify-center">
                                    <span className="font-semibold text-white text-[15px] group-hover:text-zinc-300 transition-colors line-clamp-1">{rel.title}</span>
                                    <span className="text-zinc-400 text-sm hover:underline line-clamp-1">{rel.artistId || gameState.artist.name}</span>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white transition-colors p-2 shrink-0">
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Coming Soon */}
                {comingSoonRels.length > 0 && (
                <div className="mb-14">
                    <SectionHeader title="Coming Soon" />
                    <div className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-6 snap-x">
                        {comingSoonRels.map(rel => (
                            <div key={rel.id} className="min-w-[160px] max-w-[160px] md:min-w-[200px] md:max-w-[200px] cursor-pointer group flex flex-col gap-2 snap-start">
                                <div className="w-full aspect-square rounded-xl overflow-hidden shadow-lg relative bg-zinc-900 border border-zinc-800">
                                    {rel.coverImage && <img src={rel.coverImage} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" />}
                                    <div className="absolute inset-0 bg-black/30" />
                                    <div className="absolute bottom-3 right-3 bg-white/10 backdrop-blur-md px-2 py-1 rounded-md border border-white/20">
                                        <span className="text-xs font-bold text-white uppercase tracking-widest">{rel.type || 'Album'}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col mt-1">
                                    <span className="font-semibold text-white text-[15px] leading-tight line-clamp-1">{rel.title}</span>
                                    <span className="text-zinc-400 text-[13px] hover:underline line-clamp-1">{gameState.artist.name}</span>
                                    <span className="text-[#fa243c] text-xs font-semibold mt-1">Releases {rel.releaseDate}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                )}
            </div>
        ) : appleMusicTab === 'profile' ? (
        <>
            <div className="h-[35rem] relative flex flex-col justify-end p-8 md:p-24 overflow-hidden shrink-0">
               {artistImage ? <img src={artistImage || undefined} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 bg-zinc-900" />}
               <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/60 to-transparent z-10" />
               <div className="relative z-20 w-full max-w-7xl mx-auto text-left">
                  <span className="text-red-500 font-bold uppercase text-xs tracking-widest mb-4 block">Artist Profile</span>
                  <h1 className="text-7xl md:text-[8rem] font-black tracking-tighter leading-none mb-8 line-clamp-1">{artistName}</h1>
                  <div className="flex gap-4">
                     <button className="bg-[#fa243c] text-white px-10 py-4 rounded-xl font-bold text-sm uppercase flex items-center gap-3 hover:scale-105 transition-transform"><Play className="w-5 h-5 fill-current" /> Play</button>
                     <button className="bg-zinc-800 text-white px-10 py-4 rounded-xl font-bold text-sm uppercase flex items-center gap-3 hover:bg-zinc-700 transition-colors"><Heart className="w-5 h-5" /> Library</button>
                  </div>
               </div>
            </div>

            <div className="max-w-7xl mx-auto w-full p-8 md:p-24 text-left pt-0 md:pt-0 pb-12">
               <div className="flex justify-between items-end border-b border-zinc-800 pb-4 mb-8">
                  <h2 className="text-3xl font-black">Top Songs</h2>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                  {topSongs.map((song, i) => (
                     <div key={song.id} className="flex items-center gap-4 py-3 group cursor-pointer border-b border-zinc-800 hover:bg-zinc-900 px-4 rounded-lg transition-colors" onClick={() => handleSelectAppleRelease(song)}>
                        <span className="w-4 text-zinc-500 font-bold">{i+1}</span>
                        <div className="w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden shrink-0">{song.coverImage ? <img src={song.coverImage || undefined} className="w-full h-full object-cover" /> : <Disc className="m-auto mt-3 text-zinc-500" />}</div>
                        <div className="flex-1 flex flex-col">
                           <span className="font-bold text-base leading-tight group-hover:text-[#fa243c] transition-colors">{song.title}</span>
                        </div>
                        <MoreHorizontal className="text-zinc-500 group-hover:text-red-500 transition-colors" />
                     </div>
                  ))}
               </div>
            </div>

            {appleAlbums.length > 0 && (
               <div className="max-w-7xl mx-auto w-full px-8 md:px-24 text-left pb-12">
                  <div className="flex justify-between items-end border-b border-zinc-800 pb-4 mb-8">
                     <h2 className="text-3xl font-black">Albums</h2>
                     <button className="text-[#fa243c] font-bold text-sm tracking-wide uppercase group flex items-center hover:opacity-80 transition-opacity" onClick={() => setShowAllAppleDiscography(true)}>
                        See All <ChevronRight className="w-4 h-4 ml-1" />
                     </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                     {appleAlbums.slice(0, 5).map(album => (
                        <div key={album.id} className="flex flex-col group cursor-pointer" onClick={() => handleSelectAppleRelease(album)}>
                           <div className="w-full aspect-square bg-zinc-900 rounded-xl overflow-hidden mb-3 border border-zinc-800">
                              {album.coverImage ? <img src={album.coverImage || undefined} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <Disc className="w-16 h-16 text-zinc-500 m-auto mt-12" />}
                           </div>
                           <span className="font-bold text-[15px] leading-tight truncate">{album.title}</span>
                           <span className="text-zinc-400 text-[13px] mt-0.5">{new Date(album.releaseDate!).getFullYear()}</span>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {appleSingles.length > 0 && (
               <div className="max-w-7xl mx-auto w-full px-8 md:px-24 text-left pb-12">
                  <div className="flex justify-between items-end border-b border-zinc-800 pb-4 mb-8">
                     <h2 className="text-3xl font-black">Singles & EPs</h2>
                     <button className="text-[#fa243c] font-bold text-sm tracking-wide uppercase group flex items-center hover:opacity-80 transition-opacity" onClick={() => setShowAllAppleDiscography(true)}>
                        See All <ChevronRight className="w-4 h-4 ml-1" />
                     </button>
                  </div>
                  <div className="flex overflow-x-auto pb-6 gap-6 hide-scrollbar -mx-8 px-8 md:-mx-24 md:px-24">
                     {appleSingles.map(single => (
                        <div key={single.id} className="flex flex-col min-w-[150px] max-w-[150px] group cursor-pointer" onClick={() => handleSelectAppleRelease(single)}>
                           <div className="w-full aspect-square bg-zinc-900 rounded-xl overflow-hidden mb-3 border border-zinc-800">
                              {single.coverImage ? <img src={single.coverImage || undefined} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <Disc className="w-12 h-12 text-zinc-500 m-auto mt-10" />}
                           </div>
                           <span className="font-bold text-[15px] leading-tight truncate">{single.title}</span>
                           <span className="text-zinc-400 text-[13px] mt-0.5">{new Date(single.releaseDate!).getFullYear()}</span>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* About Section */}
            <div className="max-w-7xl mx-auto w-full px-8 md:px-24 text-left pb-12">
               <h2 className="text-3xl font-black mb-8 border-b border-zinc-100 pb-4">About</h2>
               <div className="bg-zinc-50 rounded-2xl p-8 md:p-12 relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-10 bg-cover bg-center mix-blend-multiply blur-xl scale-110 transition-transform duration-1000 group-hover:scale-125" style={{ backgroundImage: artistImage ? `url(${artistImage})` : 'none' }}></div>
                  <div className="relative z-10">
                     <h3 className="text-4xl font-black mb-4 tracking-tighter">{artistName}</h3>
                     <p className="text-zinc-600 text-lg leading-relaxed max-w-3xl">
                         {isNPC ? `A popular artist known worldwide, ${artistName} has captured the attention of listeners around the world. With multiple chart-topping hits and an ever-growing fanbase, their unique sound continues to evolve and inspire.` : (gameState.artist.socialProfile?.bio || `A trailblazing artist from ${gameState.artist.country}, ${gameState.artist.name} has captured the attention of listeners around the world. With multiple chart-topping hits and an ever-growing fanbase, their unique sound continues to evolve and inspire.`)}
                     </p>
                     <div className="mt-8 flex gap-8">
                         <div>
                             <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Hometown</p>
                             <p className="font-bold">{isNPC ? currentArtistData?.label : gameState.artist.country}</p>
                         </div>
                     </div>
                  </div>
               </div>
            </div>
        </>
        ) : appleMusicTab === 'charts' ? (
        <>
           <div className="max-w-7xl mx-auto w-full p-8 md:p-24 text-left pb-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4 mt-8">
                  <h1 className="text-5xl font-black tracking-tighter">Charts</h1>
                  <div className="relative">
                      <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                      <input 
                          type="text" 
                          placeholder="Search artists, songs..." 
                          className="bg-zinc-900 text-white px-12 py-3 rounded-xl focus:outline-none border border-zinc-800 focus:border-[#fa243c] w-full md:w-64 font-medium"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                      />
                  </div>
              </div>
              <p className="text-xl text-zinc-400 font-medium mb-12 border-b border-zinc-800 pb-6">See what's popular locally and globally on Apple Music.</p>

              {searchQuery ? (
                  <div className="mb-16">
                      <h2 className="text-2xl font-black mb-6">Search Results</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                          {[...NPC_ARTISTS.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())).map(a => ({ id: 'artist-'+a.name, title: a.name, type: 'artist' as const })),
                            ...publishedReleases.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase())).map(r => ({ ...r, type: 'release' as const }))
                          ].map((res, i) => (
                              <div key={res.id} onClick={() => res.type === 'artist' ? (setAppleViewArtist(res.title), setSearchQuery(''), setAppleMusicTab('profile')) : handleSelectAppleRelease(res as Release)} className="flex items-center gap-4 py-3 group cursor-pointer border-b border-zinc-800 hover:bg-zinc-900 px-4 rounded-lg transition-colors">
                                  <div className="w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                                      {res.type === 'artist' ? <User className="w-6 h-6 text-zinc-500" /> : <Disc className="w-6 h-6 text-zinc-500" />}
                                  </div>
                                  <div className="flex-1 flex flex-col">
                                      <span className="font-bold text-base leading-tight group-hover:text-[#fa243c] transition-colors">{res.title}</span>
                                      <span className="text-sm text-zinc-500 tracking-wider font-semibold uppercase text-[10px]">{res.type}</span>
                                  </div>
                                  <ChevronRight className="text-zinc-300 group-hover:text-[#fa243c] transition-colors" />
                              </div>
                          ))}
                      </div>
                  </div>
              ) : (
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
              )}
           </div>
        </>
        ) : null}

        {/* View Chart Overlay */}
        {appleMusicChart && (
           <div className="fixed inset-0 z-[500] bg-[#000000] overflow-y-auto">
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
           <div className="fixed inset-0 z-[500] bg-[#000000]/95 backdrop-blur-xl overflow-y-auto">
              <div className="sticky top-0 z-20 flex items-center justify-between p-4 px-6 border-b border-zinc-800 bg-[#000000]/80 backdrop-blur-md">
                 <button onClick={() => setSelectedAppleRelease(null)} className="flex items-center text-[#fa243c] font-bold text-lg hover:opacity-70 transition-opacity">
                    <ChevronLeft className="w-6 h-6 mr-1" />
                    Back
                 </button>
              </div>
              <div className="w-full max-w-5xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12 items-start text-white">
                 <div className="w-full max-w-xs mx-auto md:max-w-none md:mx-0 md:w-80 shrink-0 md:sticky md:top-32 flex flex-col pt-4 md:pt-0">
                    <div className="w-full aspect-square bg-zinc-900 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] mb-6 border border-zinc-800">
                       {selectedAppleRelease.coverImage ? <img src={selectedAppleRelease.coverImage || undefined} className="w-full h-full object-cover" /> : <Disc className="w-24 h-24 text-zinc-500 m-auto mt-20 md:mt-28" />}
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
                    <h3 className="text-xl font-bold border-b border-zinc-800 pb-4 mb-4 text-white">Tracks</h3>
                    <div className="flex flex-col">
                       {(['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(selectedAppleRelease.type) 
                         ? (selectedAppleRelease as Album).trackIds.map(tid => gameState.releases.find(r => r?.id === tid)) 
                         : [selectedAppleRelease]).map((t, i) => t && (
                          <div key={t.id || i} className="flex items-center justify-between py-3.5 border-b border-zinc-800 group">
                             <div className="flex items-center gap-4">
                                <span className="w-6 text-right text-zinc-500 font-bold group-hover:hidden">{i + 1}</span>
                                <span className="w-6 hidden group-hover:flex items-center justify-end"><Play className="w-4 h-4 fill-zinc-500 text-zinc-500"/></span>
                                <div className="flex flex-col">
                                   <span className="font-semibold text-white leading-tight">{t.title}</span>
                                   {(t as Song).isBSide === false && <span className="text-zinc-400 text-[10px] uppercase font-black tracking-widest mt-0.5"><span className="bg-zinc-800 text-zinc-400 px-1 rounded-sm mr-1.5">E</span>Explicit</span>}
                                </div>
                             </div>
                             <MoreHorizontal className="text-zinc-500 group-hover:text-[#fa243c] cursor-pointer transition-colors" />
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* All Discography Popup */}
        {showAllAppleDiscography && (
           <div className="fixed inset-0 z-[400] bg-[#000000] overflow-y-auto">
              <div className="sticky top-0 z-20 flex items-center justify-between p-4 px-6 border-b border-zinc-800 bg-[#000000]/90 backdrop-blur-md">
                 <div className="flex flex-col">
                    <button onClick={() => setShowAllAppleDiscography(false)} className="flex items-center text-[#fa243c] font-bold text-lg hover:opacity-70 transition-opacity mb-2">
                       <ChevronLeft className="w-6 h-6 mr-1" />
                       Back
                    </button>
                    <h1 className="text-3xl font-black text-white">All Releases</h1>
                 </div>
                 <div className="flex gap-2">
                    {['All', 'Albums', 'Singles'].map(filter => (
                       <button
                          key={filter}
                          onClick={() => setDiscoFilter(filter as any)}
                          className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${discoFilter === filter ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}
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
                          <div className="w-full aspect-square bg-zinc-900 rounded-xl overflow-hidden mb-3 border border-zinc-800">
                             {rel.coverImage ? <img src={rel.coverImage || undefined} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <Disc className="w-16 h-16 text-zinc-500 m-auto mt-12" />}
                          </div>
                          <span className="font-bold text-[15px] leading-tight truncate text-white">{rel.title}</span>
                          <span className="text-zinc-400 text-[13px] capitalize mt-0.5">{rel.type} • {new Date(rel.releaseDate!).getFullYear()}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#1c1c1e]/90 backdrop-blur-md border-t border-zinc-800 z-[400] flex justify-around items-center px-4 md:px-24">
           <button 
              onClick={() => { setAppleMusicTab('home'); setAppleSelectedPlaylist(null); }} 
              className={`flex flex-col items-center justify-center w-24 gap-1 ${appleMusicTab === 'home' ? 'text-[#fa243c]' : 'text-zinc-400 hover:text-zinc-600'}`}
           >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L4 9v12h16V9l-8-6zm6 16h-3v-6H9v6H6v-9l6-4.5 6 4.5v9z"/></svg>
              <span className="text-[10px] font-semibold">Browse</span>
           </button>
           <button 
              onClick={() => { setAppleMusicTab('profile'); setAppleViewArtist(null); }} 
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
    const isNPC = !!amazonViewArtist;
    const currentArtistData = isNPC ? NPC_ARTISTS.find(a => a.name === amazonViewArtist) : null;
    const artistName = isNPC ? currentArtistData?.name || "NPC" : gameState.artist.name;
    const artistImage = isNPC ? (ARTIST_PICS[artistName] || ARTIST_IMAGES[artistName] || undefined) : (gameState.artist.image || undefined);

    const viewArtistRels = amazonViewArtist ? gameState.releases.filter(r => (r as any).artistId === amazonViewArtist && r.status === 'Published') : publishedReleases;
    const viewArtistSongs = viewArtistRels.filter(r => r.type === 'Single' && !isProject(r.type));
    
    const topSongs = viewArtistSongs.slice().sort((a,b) => getPlatformStreams(b, 'amazonMusic') - getPlatformStreams(a, 'amazonMusic')).slice(0, 10);
    const amazonAlbums = viewArtistRels.filter(r => isProject(r.type)).sort((a, b) => getPlatformStreams(b, 'amazonMusic') - getPlatformStreams(a, 'amazonMusic'));
    const amazonSingles = viewArtistRels.filter(r => !isProject(r.type)).sort((a, b) => new Date(b.releaseDate!).getTime() - new Date(a.releaseDate!).getTime()).reverse();
    const highlightRelease = amazonHighlightId ? publishedReleases.find(r => r?.id === amazonHighlightId) : viewArtistRels.sort((a, b) => getPlatformStreams(b, 'amazonMusic') - getPlatformStreams(a, 'amazonMusic'))[0];
    const followersText = Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short", maximumFractionDigits: 1 }).format(isNPC ? calculateListeners('amazonMusic', artistName) : calculateListeners('amazonMusic'));

    const rawAm = 0.50 * (1 + ((gameState.popularity.america || 0) / 100));
    const rawEu = 0.35 * (1 + ((gameState.popularity.europe || 0) / 100));
    const rawLa = 0.15 * (1 + ((gameState.popularity.latinAmerica || 0) / 100));
    const totalRaw = rawAm + rawEu + rawLa;
    const amPerc = rawAm / totalRaw;
    const euPerc = rawEu / totalRaw;
    const laPerc = rawLa / totalRaw;

    const allPublishedRels = gameState.releases.filter(r => r.status === 'Published');
    const allSortedRels = [...allPublishedRels].sort((a,b) => new Date(b.releaseDate!).getTime() - new Date(a.releaseDate!).getTime());
    
    // Sort logic for platform
    const topAmazonSongs = allPublishedRels.filter(r => r.type === 'Single' && !isProject(r.type)).sort((a,b) => getPlatformStreams(b, 'amazonMusic') - getPlatformStreams(a, 'amazonMusic'));
    const topAmazonAlbums = allPublishedRels.filter(r => isProject(r.type)).sort((a,b) => getPlatformStreams(b, 'amazonMusic') - getPlatformStreams(a, 'amazonMusic'));

    const newAlbums = allSortedRels.filter(r => isProject(r.type)).slice(0, 10);
    const newSingles = allSortedRels.filter(r => r.type === 'Single' && !isProject(r.type)).slice(0, 10);
    const newReleasePlaylistsRels = allSortedRels.slice(0, 20);

    const SectionHeader = ({ title, onSeeAll }: { title: string, onSeeAll?: () => void }) => (
        <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold">{title}</h2>
            {onSeeAll && <button onClick={onSeeAll} className="text-white/60 text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 hover:text-white hover:border-white transition-colors">SEE ALL</button>}
        </div>
    );

    const currentWeekNumber = Math.max(1, Math.floor(gameState.time.daysPassed / 7)); 
    const currentWeekFluctuation = 1 + (Math.sin(currentWeekNumber / 10) * 0.05);
    const pName = gameState.artist?.name || '';
    const npcSingles = gameState.releases.filter(r => r.type === 'Single' && r.status === 'Published' && (r as any).isNPCRelease).map(s => ({
        ...s,
        artist: (s as any).artistId,
        points: (s.lastDailyStreams?.amazonMusic || 0) + (Math.random() * 5)
    }));
    const npcAlbums = gameState.releases.filter(r => ['Album', 'EP', 'Deluxe Album', 'Single Pack'].includes(r.type) && r.status === 'Published' && (r as any).isNPCRelease).map(a => ({
        ...a,
        artist: (a as any).artistId,
        points: (a.lastDailyStreams?.amazonMusic || 0) + (Math.random() * 5)
    }));

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
            let streams = npc.points; 
            
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

    const renderAmazonPlaylistContent = () => {
        if (!amazonSelectedPlaylist) return null;
        return (
            <div className="pt-24 px-6 md:px-12 flex flex-col gap-6 pb-32 text-left">
               <button onClick={() => setAmazonSelectedPlaylist(null)} className="absolute top-6 left-6 flex items-center text-[#00e0ff] font-bold text-sm hover:underline z-[100]">
                  <ChevronLeft className="w-5 h-5 mr-1" /> Back
               </button>
               <div className="flex flex-col md:flex-row gap-8 mt-4 items-center md:items-end">
                   <div className="w-56 h-56 md:w-64 md:h-64 shrink-0 rounded-xl relative overflow-hidden shadow-2xl">
                       {amazonSelectedPlaylist.imgs ? (
                          <div className="w-full h-full grid grid-cols-2 grid-rows-2">
                             {amazonSelectedPlaylist.imgs.map((img: string, idx: number) => (
                                <img key={idx} src={img} className="w-full h-full object-cover" />
                             ))}
                          </div>
                       ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: amazonSelectedPlaylist.bg }}>
                             {amazonSelectedPlaylist.img && <img src={amazonSelectedPlaylist.img} className="w-full h-full object-cover mix-blend-luminosity opacity-80" />}
                          </div>
                       )}
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                   </div>
                   <div className="flex flex-col justify-end items-center md:items-start space-y-2">
                       <span className="text-[#00e0ff] text-xs font-bold uppercase tracking-widest">{amazonSelectedPlaylist.type || 'Playlist'}</span>
                       <h1 className="text-4xl md:text-5xl font-black text-center md:text-left">{amazonSelectedPlaylist.title || amazonSelectedPlaylist.artist}</h1>
                       <p className="text-white/60 text-sm max-w-lg text-center md:text-left mb-2">{amazonSelectedPlaylist.desc}</p>
                       <div className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase">
                           <span className="text-[#00e0ff]">Amazon Music</span>
                           <span>•</span>
                           <span>20 Tracks</span>
                       </div>
                   </div>
               </div>
               
               <div className="mt-8 flex items-center justify-center md:justify-start gap-4">
                   <button className="w-16 h-16 bg-[#00e0ff] text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shrink-0">
                       <Play className="w-8 h-8 fill-current ml-1" />
                   </button>
                   <button className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                       <Plus className="w-6 h-6" />
                   </button>
                   <button className="w-12 h-12 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors">
                       <MoreHorizontal className="w-6 h-6" />
                   </button>
               </div>

               <div className="mt-8 flex flex-col gap-2">
                   <div className="flex text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2 px-2 border-b border-white/10 pb-2">
                       <div className="w-8">#</div>
                       <div className="flex-1">Song</div>
                       <div className="hidden md:block w-24">Length</div>
                   </div>
                   {getPlaylistTracks(amazonSelectedPlaylist).map((t: any, i: number) => (
                       <div key={t.id + '-' + i} className="flex items-center gap-4 hover:bg-white/10 p-2 rounded-lg group cursor-pointer border-b border-white/5">
                           <span className="w-4 text-center text-white/40 text-xs">{i + 1}</span>
                           <div className="w-12 h-12 bg-zinc-800 shrink-0 rounded overflow-hidden relative">
                               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Play className="w-4 h-4 text-white fill-current" />
                               </div>
                               {t.img ? <img src={t.img} className="w-full h-full object-cover" /> : null}
                           </div>
                           <div className="flex flex-col flex-1">
                               <span className="text-white font-bold group-hover:text-[#00e0ff] transition-colors">{t.title}</span>
                               <span className="text-white/60 text-sm hover:underline">{t.artist}</span>
                           </div>
                           <span className="hidden md:block w-24 text-white/40 text-sm font-medium">{t.duration}</span>
                       </div>
                   ))}
               </div>
            </div>
        );
    };

    return (
      <div className="bg-[#000000] text-white min-h-screen font-sans pb-32 relative">
         {amazonSelectedPlaylist ? renderAmazonPlaylistContent() : amazonMusicTab === 'home' ? (
            <div className="pt-16 pb-20 px-6 md:px-12 text-left">
                
                {/* Top Header (mock) */}
                <div className="flex items-center gap-4 mb-10">
                   <h1 className="text-3xl font-black text-white shrink-0">amazon<span className="font-light">music</span></h1>
                   <div className="flex-1" />
                   <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                   </div>
                   <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center shrink-0">
                      <Search className="w-4 h-4" />
                   </div>
                   <button className="bg-[#00e0ff] text-black font-bold text-xs px-3 py-1.5 rounded shrink-0 leading-none">UPGRADE</button>
                   <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0 border border-white/20 flex items-center justify-center">
                      <User className="w-4 h-4" />
                   </div>
                </div>

                {/* Hot Artists */}
                <div className="mb-14">
                    <SectionHeader title="Hot Artists" onSeeAll={() => setAmazonSeeAll({ title: 'Hot Artists', type: 'artists', items: [gameState.artist.name, ...top10.slice(0, 10).map(t => t.name)] })} />
                    <div className="flex overflow-x-auto pb-6 gap-6 hide-scrollbar snap-x">
                        {[gameState.artist.name, ...top10.slice(0, 8).map(t => t.name)].map((aName, i) => (
                            <div key={aName + i} onClick={() => setAmazonViewArtist(aName === gameState.artist.name ? null : aName)} className="min-w-[160px] max-w-[160px] md:min-w-[200px] md:max-w-[200px] flex flex-col gap-4 group cursor-pointer snap-start">
                                <div className="w-full aspect-square rounded-full overflow-hidden bg-zinc-800 relative shadow-xl">
                                    <img src={getImg(aName)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="text-center">
                                    <span className="font-semibold text-[17px] block truncate">{aName}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* New Release Playlists */}
                <div className="mb-14">
                    <SectionHeader title="New Release Playlists" onSeeAll={() => setAmazonSeeAll({ title: 'New Release Playlists', type: 'playlists', items: [
                            { id: 'nrp_1', title: 'All Hits', desc: `${gameState.artist.name}, ${top10[0]?.name || 'Taylor Swift'}`, bg: '#ef4444', img: getCover(2) },
                            { id: 'nrp_2', title: 'Pop Rotation', desc: `${top10[1]?.name || 'Ariana Grande'}`, bg: '#06b6d4', img: getCover(6) },
                            { id: 'nrp_3', title: 'Rap Rotation', desc: `${top10[2]?.name || 'Drake'}`, bg: '#22c55e', img: getCover(10) },
                            { id: 'nrp_4', title: 'Country Heat', desc: `${top10[3]?.name || 'Morgan Wallen'}`, bg: '#eab308', img: getCover(3) },
                            { id: 'nrp_5', title: 'New Music Now', desc: 'The hottest new tracks.', bg: '#6b7280', img: getCover(11) }
                    ]})} />
                    <div className="flex overflow-x-auto pb-6 gap-6 hide-scrollbar snap-x">
                        {[
                            { id: 'nrp_1', title: 'All Hits', desc: `${gameState.artist.name}, ${top10[0]?.name || 'Taylor Swift'}`, bg: '#ef4444', img: getCover(2) },
                            { id: 'nrp_2', title: 'Pop Rotation', desc: `${top10[1]?.name || 'Ariana Grande'}`, bg: '#06b6d4', img: getCover(6) },
                            { id: 'nrp_3', title: 'Rap Rotation', desc: `${top10[2]?.name || 'Drake'}`, bg: '#22c55e', img: getCover(10) },
                            { id: 'nrp_4', title: 'Country Heat', desc: `${top10[3]?.name || 'Morgan Wallen'}`, bg: '#eab308', img: getCover(3) },
                            { id: 'nrp_5', title: 'New Music Now', desc: 'The hottest new tracks.', bg: '#6b7280', img: getCover(11) },
                        ].map(pl => (
                            <div key={pl.id} onClick={() => setAmazonSelectedPlaylist({ type: 'Playlist', title: pl.title, artist: pl.title, desc: pl.desc, img: pl.img, bg: pl.bg })} className="min-w-[180px] max-w-[180px] md:min-w-[240px] md:max-w-[240px] flex flex-col gap-3 group cursor-pointer snap-start">
                                <div className="w-full aspect-square rounded-2xl overflow-hidden relative shadow-lg">
                                    <img src={pl.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 opacity-40 mix-blend-multiply" style={{ backgroundColor: pl.bg }} />
                                    <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                                       <span className="text-white font-black text-3xl leading-none w-min uppercase" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{pl.title.replace(' ', '\n')}</span>
                                       <div className="font-bold text-white text-[10px] uppercase">music</div>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-[15px] truncate">{pl.title}</span>
                                    <span className="text-white/50 text-[13px] truncate">{pl.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hot Songs */}
                <div className="mb-14">
                    <SectionHeader title="Hot Songs" onSeeAll={() => setAmazonSeeAll({ title: 'Hot Songs', type: 'songs', items: topAmazonSongs })} />
                    <div className="flex flex-col gap-2">
                        {topAmazonSongs.slice(0, 5).map((song, i) => (
                            <div key={song.id} className="flex items-center gap-4 hover:bg-white/5 p-2 -mx-2 rounded-xl group cursor-pointer transition-colors" onClick={() => handleSelectAmazonRelease(song)}>
                                <div className="w-14 h-14 bg-zinc-800 rounded-lg overflow-hidden shrink-0 shadow-md">
                                    {song.coverImage ? <img src={song.coverImage} className="w-full h-full object-cover" /> : <Disc className="m-auto mt-4 text-white/20" />}
                                </div>
                                <div className="flex flex-col flex-1 min-w-0 justify-center">
                                    <span className="font-semibold text-white text-[16px] truncate">{song.title}</span>
                                    <span className="text-white/60 text-[14px] truncate">{song.artistId || gameState.artist.name}</span>
                                </div>
                                <button className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white shrink-0">
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hot Playlists */}
                <div className="mb-14">
                    <SectionHeader title="Hot Playlists" onSeeAll={() => setAmazonSeeAll({ title: 'Hot Playlists', type: 'playlists', items: [
                            { id: 'hp_1', title: 'Mellow \'70s Gold', desc: 'Paul McCartney, Elton John...', bg: '#f59e0b', img: getCover(1) },
                            { id: 'hp_2', title: 'Relaxing Piano', desc: 'Robert Gromotka...', bg: '#0ea5e9', img: getCover(5) },
                            { id: 'hp_3', title: 'Classic Rock', desc: 'The Rolling Stones...', bg: '#db2777', img: getCover(9) },
                            { id: 'hp_4', title: 'Viral Hits', desc: 'Today\'s brightest.', bg: '#8b5cf6', img: getCover(4) },
                    ]})} />
                    <div className="flex overflow-x-auto pb-6 gap-6 hide-scrollbar snap-x">
                        {[
                            { id: 'hp_1', title: 'Mellow \'70s Gold', desc: 'Paul McCartney, Elton John...', bg: '#f59e0b', img: getCover(1) },
                            { id: 'hp_2', title: 'Relaxing Piano', desc: 'Robert Gromotka...', bg: '#0ea5e9', img: getCover(5) },
                            { id: 'hp_3', title: 'Classic Rock', desc: 'The Rolling Stones...', bg: '#db2777', img: getCover(9) },
                            { id: 'hp_4', title: 'Viral Hits', desc: 'Today\'s brightest.', bg: '#8b5cf6', img: getCover(4) },
                        ].map(pl => (
                            <div key={pl.id} onClick={() => setAmazonSelectedPlaylist({ type: 'Playlist', title: pl.title, artist: pl.title, desc: pl.desc, img: pl.img, bg: pl.bg })} className="min-w-[180px] max-w-[180px] md:min-w-[240px] md:max-w-[240px] flex flex-col gap-3 group cursor-pointer snap-start">
                                <div className="w-full aspect-square rounded-2xl overflow-hidden relative shadow-lg">
                                    <img src={pl.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                                    <div className="absolute bottom-4 left-4 right-4">
                                       <span className="text-white font-black text-2xl leading-none line-clamp-2">{pl.title}</span>
                                    </div>
                                    <div className="absolute top-4 right-4 font-bold text-white text-[10px] uppercase">music</div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-[15px] truncate">{pl.title}</span>
                                    <span className="text-white/50 text-[13px] truncate">{pl.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hot Albums */}
                <div className="mb-14">
                    <SectionHeader title="Hot Albums" onSeeAll={() => setAmazonSeeAll({ title: 'Hot Albums', type: 'albums', items: topAmazonAlbums })} />
                    <div className="flex overflow-x-auto pb-6 gap-6 hide-scrollbar snap-x">
                        {topAmazonAlbums.slice(0, 10).map((album, i) => (
                            <div key={album.id} className="min-w-[180px] max-w-[180px] md:min-w-[240px] md:max-w-[240px] flex flex-col gap-3 group cursor-pointer snap-start" onClick={() => handleSelectAmazonRelease(album)}>
                                <div className="w-full aspect-square rounded-2xl overflow-hidden relative shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-white/5 bg-zinc-900">
                                    {album.coverImage ? <img src={album.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center bg-zinc-800"><Disc className="w-16 h-16 text-white/20" /></div>}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-[15px] truncate">{album.title}</span>
                                    <span className="text-white/50 text-[13px] truncate">{album.artistId || gameState.artist.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Genre Rotation */}
                <div className="mb-14">
                    <SectionHeader title="Genre Rotation" onSeeAll={() => setAmazonSeeAll({ title: 'Genre Rotation', type: 'playlists', items: [
                            { id: 'gr_1', title: 'Pop Rotation', desc: 'Amazon Music Pop', bg: '#06b6d4', img: getCover(0) },
                            { id: 'gr_2', title: 'Rap Rotation', desc: 'Amazon Music Hip-Hop', bg: '#22c55e', img: getCover(4) },
                            { id: 'gr_3', title: 'R&B Rotation', desc: 'Amazon Music R&B', bg: '#d946ef', img: getCover(8) },
                            { id: 'gr_4', title: 'Afro Rotation', desc: 'Amazon Music Afrobeats', bg: '#eab308', img: getCover(1) },
                            { id: 'gr_5', title: 'K-Pop Rotation', desc: 'Amazon Music K-Pop', bg: '#f43f5e', img: getCover(3) },
                    ]})} />
                    <div className="flex overflow-x-auto pb-6 gap-6 hide-scrollbar snap-x">
                        {[
                            { id: 'gr_1', title: 'Pop Rotation', desc: 'Amazon Music Pop', bg: '#06b6d4', img: getCover(0) },
                            { id: 'gr_2', title: 'Rap Rotation', desc: 'Amazon Music Hip-Hop', bg: '#22c55e', img: getCover(4) },
                            { id: 'gr_3', title: 'R&B Rotation', desc: 'Amazon Music R&B', bg: '#d946ef', img: getCover(8) },
                            { id: 'gr_4', title: 'Afro Rotation', desc: 'Amazon Music Afrobeats', bg: '#eab308', img: getCover(1) },
                            { id: 'gr_5', title: 'K-Pop Rotation', desc: 'Amazon Music K-Pop', bg: '#f43f5e', img: getCover(3) },
                        ].map(pl => (
                            <div key={pl.id} onClick={() => setAmazonSelectedPlaylist({ type: 'Playlist', title: pl.title, artist: pl.title, desc: pl.desc, img: pl.img, bg: pl.bg })} className="min-w-[180px] max-w-[180px] md:min-w-[240px] md:max-w-[240px] flex flex-col gap-3 group cursor-pointer snap-start">
                                <div className="w-full aspect-square rounded-2xl overflow-hidden relative shadow-lg">
                                    <img src={pl.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 opacity-40 mix-blend-multiply" style={{ backgroundColor: pl.bg }} />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                       <span className="text-white font-black text-4xl mb-1 uppercase tracking-tighter" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{pl.title.split(' ')[0]}</span>
                                       <span className="text-white/90 font-bold text-sm tracking-[0.3em] uppercase">{pl.title.split(' ')[1]}</span>
                                    </div>
                                    <div className="absolute top-4 right-4 font-bold text-white text-[10px] uppercase">music</div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-[15px] truncate">{pl.title}</span>
                                    <span className="text-white/50 text-[13px] truncate">{pl.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mood & Activity */}
                <div className="mb-14">
                    <SectionHeader title="Mood & Activity" onSeeAll={() => setAmazonSeeAll({ title: 'Mood & Activity', type: 'playlists', items: [
                            { id: 'ma_1', title: 'Chill Hits', desc: 'Relax and unwind.', bg: '#60a5fa', img: getCover(6) },
                            { id: 'ma_2', title: 'Workout Hits', desc: 'Break a sweat.', bg: '#ef4444', img: getCover(2) },
                            { id: 'ma_3', title: 'Sleep Sounds', desc: 'Drift away into dreamland.', bg: '#10b981', img: getCover(5) },
                            { id: 'ma_4', title: 'Party Hits', desc: 'Get the party started.', bg: '#f59e0b', img: getCover(11) },
                    ]})} />
                    <div className="flex overflow-x-auto pb-6 gap-6 hide-scrollbar snap-x">
                        {[
                            { id: 'ma_1', title: 'Chill Hits', desc: 'Relax and unwind.', bg: '#60a5fa', img: getCover(6) },
                            { id: 'ma_2', title: 'Workout Hits', desc: 'Break a sweat.', bg: '#ef4444', img: getCover(2) },
                            { id: 'ma_3', title: 'Sleep Sounds', desc: 'Drift away into dreamland.', bg: '#10b981', img: getCover(5) },
                            { id: 'ma_4', title: 'Party Hits', desc: 'Get the party started.', bg: '#f59e0b', img: getCover(11) },
                        ].map(pl => (
                            <div key={pl.id} onClick={() => setAmazonSelectedPlaylist({ type: 'Playlist', title: pl.title, artist: pl.title, desc: pl.desc, img: pl.img, bg: pl.bg })} className="min-w-[180px] max-w-[180px] md:min-w-[240px] md:max-w-[240px] flex flex-col gap-3 group cursor-pointer snap-start">
                                <div className="w-full aspect-square rounded-2xl overflow-hidden relative shadow-lg">
                                    <img src={pl.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                                    <div className="absolute top-4 left-4 right-4">
                                       <span className="text-white font-black text-2xl leading-none">{pl.title}</span>
                                    </div>
                                    <div className="absolute top-4 right-4 font-bold text-white text-[10px] uppercase">music</div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-[15px] truncate">{pl.title}</span>
                                    <span className="text-white/50 text-[13px] truncate">{pl.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* New Albums */}
                {newAlbums.length > 0 && (
                <div className="mb-14">
                    <SectionHeader title="New Albums" onSeeAll={() => setAmazonSeeAll({ title: 'New Albums', type: 'albums', items: newAlbums })} />
                    <div className="flex overflow-x-auto pb-6 gap-6 hide-scrollbar snap-x">
                        {newAlbums.map((album, i) => (
                            <div key={album.id} className="min-w-[180px] max-w-[180px] md:min-w-[240px] md:max-w-[240px] flex flex-col gap-3 group cursor-pointer snap-start" onClick={() => handleSelectAmazonRelease(album)}>
                                <div className="w-full aspect-square rounded-2xl overflow-hidden relative shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-white/5 bg-zinc-900">
                                    {album.coverImage ? <img src={album.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center bg-zinc-800"><Disc className="w-16 h-16 text-white/20" /></div>}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-[15px] truncate">{album.title}</span>
                                    <span className="text-white/50 text-[13px] truncate">{album.artistId || gameState.artist.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                )}

                {/* New Singles */}
                {newSingles.length > 0 && (
                <div className="mb-14">
                    <SectionHeader title="New Singles" onSeeAll={() => setAmazonSeeAll({ title: 'New Singles', type: 'releases', items: newSingles })} />
                    <div className="flex overflow-x-auto pb-6 gap-6 hide-scrollbar snap-x">
                        {newSingles.map((single, i) => (
                            <div key={single.id} className="min-w-[180px] max-w-[180px] md:min-w-[240px] md:max-w-[240px] flex flex-col gap-3 group cursor-pointer snap-start" onClick={() => handleSelectAmazonRelease(single)}>
                                <div className="w-full aspect-square rounded-2xl overflow-hidden relative shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-white/5 bg-zinc-900">
                                    {single.coverImage ? <img src={single.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center bg-zinc-800"><Disc className="w-16 h-16 text-white/20" /></div>}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-[15px] truncate">{single.title}</span>
                                    <span className="text-white/50 text-[13px] truncate">{single.artistId || gameState.artist.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                )}
                
                {amazonSeeAll && (
                  <div className="fixed inset-0 z-[500] bg-[#000000] overflow-y-auto">
                     <div className="sticky top-0 z-20 flex items-center justify-between p-4 px-6 border-b border-zinc-800 bg-[#000000]/90 backdrop-blur-xl">
                        <button onClick={() => setAmazonSeeAll(null)} className="flex items-center text-[#00e0ff] font-bold text-lg hover:opacity-70 transition-opacity">
                           <ChevronLeft className="w-6 h-6 mr-1" />
                           Back
                        </button>
                        <h1 className="text-xl font-bold">{amazonSeeAll.title}</h1>
                        <div className="w-16" />
                     </div>
                     <div className="p-6 md:p-12 pb-32">
                        {amazonSeeAll.type === 'artists' && (
                           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                              {amazonSeeAll.items.map((aName, i) => (
                                 <div key={aName + i} onClick={() => { setAmazonSeeAll(null); setAmazonViewArtist(aName === gameState.artist.name ? null : aName); }} className="flex flex-col gap-4 group cursor-pointer">
                                    <div className="w-full aspect-square rounded-full overflow-hidden bg-zinc-800 relative shadow-xl">
                                       <img src={getImg(aName)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                       <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="text-center">
                                       <span className="font-semibold text-[17px] block truncate">{aName}</span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                        {amazonSeeAll.type === 'playlists' && (
                           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                              {amazonSeeAll.items.map(pl => (
                                 <div key={pl.id} onClick={() => { setAmazonSeeAll(null); setAmazonSelectedPlaylist({ type: 'Playlist', title: pl.title, artist: pl.title, desc: pl.desc, img: pl.img, bg: pl.bg }); }} className="flex flex-col gap-3 group cursor-pointer">
                                    <div className="w-full aspect-square rounded-2xl overflow-hidden relative shadow-lg">
                                       <img src={pl.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                                       <div className="absolute bottom-4 left-4 right-4">
                                          <span className="text-white font-black text-2xl leading-none">{pl.title}</span>
                                       </div>
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="font-semibold text-[15px] truncate">{pl.title}</span>
                                       <span className="text-white/50 text-[13px] truncate">{pl.desc}</span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                        {amazonSeeAll.type === 'albums' && (
                           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                              {amazonSeeAll.items.map(album => (
                                 <div key={album.id} onClick={() => { setAmazonSeeAll(null); handleSelectAmazonRelease(album); }} className="flex flex-col gap-3 group cursor-pointer">
                                    <div className="w-full aspect-square rounded-2xl overflow-hidden relative shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-white/5 bg-zinc-900">
                                       {album.coverImage ? <img src={album.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center bg-zinc-800"><Disc className="w-16 h-16 text-white/20" /></div>}
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="font-semibold text-[15px] truncate">{album.title}</span>
                                       <span className="text-white/50 text-[13px] truncate">{album.artistId || gameState.artist.name}</span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                        {(amazonSeeAll.type === 'songs' || amazonSeeAll.type === 'releases') && (
                           <div className="flex flex-col gap-2">
                              {amazonSeeAll.items.map((song, i) => (
                                 <div key={song.id} className="flex items-center gap-4 hover:bg-white/5 p-2 rounded-xl group cursor-pointer transition-colors" onClick={() => { setAmazonSeeAll(null); handleSelectAmazonRelease(song); }}>
                                    <span className="w-6 text-white/40 text-sm font-bold text-center">{i + 1}</span>
                                    <div className="w-14 h-14 bg-zinc-800 rounded-lg overflow-hidden shrink-0 shadow-md">
                                       {song.coverImage ? <img src={song.coverImage} className="w-full h-full object-cover" /> : <Disc className="m-auto mt-4 text-white/20" />}
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0 justify-center">
                                       <span className="font-semibold text-white text-[16px] truncate">{song.title}</span>
                                       <span className="text-white/60 text-[14px] truncate">{song.artistId || gameState.artist.name}</span>
                                    </div>
                                    <button className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white shrink-0">
                                       <Plus className="w-6 h-6" />
                                    </button>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>
                )}
                
            </div>
         ) : amazonMusicTab === 'profile' ? (
         <>
            {/* Hero Background */}
            <div className="relative h-[28rem] md:h-[32rem]">
            {artistImage ? (
               <div className="absolute inset-0 bg-cover bg-top" style={{ backgroundImage: `url(${artistImage})` }}></div>
            ) : (
               <div className="absolute inset-0 bg-zinc-800"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#004751]/80 via-transparent to-transparent opacity-80"></div>
            
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-left z-10">
               <p className="text-[#00e0ff] font-bold uppercase text-xs tracking-widest mb-2">Artist</p>
               <h1 className="text-5xl md:text-7xl font-black mb-2">{artistName}</h1>
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
                  {publishedReleases.length > 0 && !isNPC && (
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
               <h3 className="text-xl font-bold mb-3">{artistName}</h3>
               <p className="text-white/70 text-sm md:text-base leading-relaxed">
                  {isNPC ? `A popular artist known worldwide, ${artistName} has captured the attention of listeners around the world.` : (gameState.artist.socialProfile?.bio || `Following the release of their recent projects, ${gameState.artist.name} continues to connect with audiences and reach new heights.`)}
               </p>
               <div className="mt-4 pt-4 border-t border-white/10 text-white/50 text-xs">
                  Hometown: {isNPC ? currentArtistData?.label : gameState.artist.country}
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
                              const song = gameState.releases.find(s => s?.id === id);
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
         ) : amazonMusicTab === 'charts' ? (
            <div className="flex flex-col min-h-screen pt-12 pb-24 text-left">
                <div className="px-4 md:px-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
                     <h1 className="text-4xl font-black text-[#00e0ff]">Charts</h1>
                     <div className="relative w-full md:w-auto">
                         <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                         <input 
                             type="text" 
                             placeholder="Search artists, songs..." 
                             className="bg-zinc-900 border border-white/10 text-white px-12 py-3 rounded-full focus:outline-none focus:border-[#00e0ff] w-full md:w-72 font-medium"
                             value={searchQuery}
                             onChange={(e) => setSearchQuery(e.target.value)}
                         />
                     </div>
                 </div>

                 {searchQuery ? (
                     <div className="px-4 md:px-8 mb-16 mt-8">
                         <h2 className="text-2xl font-black mb-6">Search Results</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                             {[...NPC_ARTISTS.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())).map(a => ({ id: 'artist-'+a.name, title: a.name, type: 'artist' as const })),
                               ...publishedReleases.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase())).map(r => ({ ...r, type: 'release' as const }))
                             ].map((res, i) => (
                                 <div key={res.id} onClick={() => res.type === 'artist' ? (setAmazonViewArtist(res.title), setSearchQuery(''), setAmazonMusicTab('profile')) : handleSelectAmazonRelease(res as Release)} className="flex items-center gap-4 py-3 group cursor-pointer border-b border-white/5 hover:bg-white/5 px-4 rounded-lg transition-colors">
                                     <div className="w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                                         {res.type === 'artist' ? <User className="w-6 h-6 text-white/30" /> : <Disc className="w-6 h-6 text-white/30" />}
                                     </div>
                                     <div className="flex-1 flex flex-col">
                                         <span className="font-bold text-base leading-tight group-hover:text-[#00e0ff] transition-colors">{res.title}</span>
                                         <span className="text-sm text-white/50 tracking-wider font-semibold uppercase text-[10px]">{res.type}</span>
                                     </div>
                                     <ChevronRight className="text-white/30 group-hover:text-[#00e0ff] transition-colors" />
                                 </div>
                             ))}
                         </div>
                     </div>
                 ) : (
                     <>
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
               </>
            )}
            </div>
         ) : null}
         {/* Bottom Navigation */}
         <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#000000]/90 backdrop-blur-md border-t border-white/10 z-[400] flex justify-around items-center px-4 md:px-24">
            <button 
               onClick={() => { setAmazonMusicTab('home'); setAmazonSelectedPlaylist(null); setAmazonHighlightId(null); }} 
               className={`flex flex-col items-center justify-center w-24 gap-1 ${amazonMusicTab === 'home' ? 'text-[#00e0ff]' : 'text-white/40 hover:text-white/60'}`}
            >
               <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L4 9v12h16V9l-8-6zm6 16h-3v-6H9v6H6v-9l6-4.5 6 4.5v9z"/></svg>
               <span className="text-[10px] font-semibold">Home</span>
            </button>
            <button 
               onClick={() => { setAmazonMusicChart(null); setAmazonMusicTab('profile'); setAmazonViewArtist(null); }} 
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
