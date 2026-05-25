import React, { useState } from 'react';
import { GameState, Release, Song, Album, Video } from '../types';
import { ChevronRight, Play, MoreVertical, Disc, User, ChevronLeft } from 'lucide-react';
import { generateNPCSongs, generateNPCAlbums } from '../constants';

interface YouTubeMusicViewProps {
   gameState: GameState;
}

export function YouTubeMusicView({ gameState }: YouTubeMusicViewProps) {
    const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
    const [youtubeMusicTab, setYoutubeMusicTab] = useState<'profile' | 'charts'>('profile');
    const [youtubeMusicChart, setYoutubeMusicChart] = useState<'global_song' | 'global_album' | 'america' | 'europe' | 'latin_america' | null>(null);

    const publishedReleases = gameState.releases.filter(r => r.status === 'Published');
    
    const isProject = (type: string) => ['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(type);
    const projects = publishedReleases.filter(r => isProject(r.type));
    const allProjectTrackIds = new Set(projects.flatMap(p => (p as Album).trackIds || []));

    const songs = publishedReleases.filter(r => r.type === 'Single' && !(r as Song).isBSide) as Song[];
    const albums = publishedReleases.filter(r => ['Album', 'Deluxe Album'].includes(r.type)) as Album[];
    const epsAndSinglePacks = publishedReleases.filter(r => ['EP', 'Single Pack'].includes(r.type)) as Album[];
    
    // Create an array for all tracks so we can map them
    const allTracks = publishedReleases.filter(r => r.type === 'Single') as Song[];
    const videos = gameState.videos || [];

    const handleSelectRelease = (rel: Release) => {
        if (rel.type === 'Single' && (rel as Song).isBSide) {
            const parentAlbum = projects.find(a => (a as Album).trackIds.includes(rel.id));
            if (parentAlbum) {
                setSelectedRelease(parentAlbum);
                return;
            }
        }
        setSelectedRelease(rel);
    };

    const getSongYTMusicStreams = (song: Song) => {
        const audioStreams = song.streams.youtubeMusic || 0;
        const mvViews = videos.filter(v => v.songId === song.id).reduce((acc, v) => acc + v.views, 0);
        return audioStreams + mvViews;
    };

    const getPlatformStreams = (release: Release): number => {
        if (release.type === 'Single') {
            return getSongYTMusicStreams(release as Song);
        } else if (['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(release.type)) {
            const albumData = release as Album;
            return albumData.trackIds.reduce((sum, tid) => {
                const track = allTracks.find(s => s?.id === tid);
                return sum + (track ? getSongYTMusicStreams(track) : 0);
            }, 0);
        }
        return 0;
    };

    const topSongs = [...allTracks].sort((a, b) => getSongYTMusicStreams(b) - getSongYTMusicStreams(a)).slice(0, 20);
    
    // Chunk top songs into columns of 4 for horizontal scrolling
    const topSongsChunks: Song[][] = [];
    for (let i = 0; i < topSongs.length; i += 4) {
        topSongsChunks.push(topSongs.slice(i, i + 4));
    }

    const formatViews = (views: number) => {
        if (views >= 1000000000) {
           return (views / 1000000000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' B';
        } else if (views >= 1000000) {
           return (views / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' M';
        } else if (views >= 1000) {
           return (views / 1000).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' K';
        }
        return views.toLocaleString('en-US');
    };

    // calculate monthly listeners based on Daily Youtube Streams + Daily Audio Streams
    const calculateListeners = () => {
        let totalDailyYTStreams = 0;
        publishedReleases.forEach(r => {
           const dailyTotal = r.lastDailyStreams?.total || 0;
           totalDailyYTStreams += (dailyTotal * 0.1); // approx for youtubeMusic audio
        });
        
        let dailyYTViews = 0;
        videos.forEach(v => {
           // We can approximate their daily views. The game loop calculates daily views and adds them. 
           // Since we don't store 'lastDailyViews' for videos, we can guess based on its age.
           const ageDays = Math.max(1, Math.floor((new Date(gameState.time.startDate).getTime() + (gameState.time.daysPassed * 24*60*60*1000) - new Date(v.publishDate).getTime()) / (1000*3600*24)));
           dailyYTViews += (v.views / ageDays) * 0.5; // heuristic
        });

        const activeListeners = (totalDailyYTStreams + dailyYTViews) * 6.2;
        const totalPlatStreams = publishedReleases.reduce((sum, r) => sum + getPlatformStreams(r), 0);
        const legacyListeners = totalPlatStreams > 0 ? (Math.pow(totalPlatStreams, 0.65) * 0.8) : 0; 
        
        const rawListeners = Math.floor((activeListeners + legacyListeners) * (Math.random() * 0.05 + 0.95)) || 0;
        
        let ceiling = 85000000;
        if (rawListeners > ceiling) {
           return Math.floor(ceiling + Math.pow(rawListeners - ceiling, 0.45) * 1500);
        }
        return rawListeners;
    };

    const getSubscribers = () => {
        if (gameState.stats.youtubeSubscribers !== undefined) {
           return gameState.stats.youtubeSubscribers;
        }
        const totalPop = (gameState.popularity.america + gameState.popularity.europe + gameState.popularity.latinAmerica) / 3;
        return Math.floor(gameState.stats.streams * 0.05 + totalPop * 10000);
    };

    const singlesAndEPs = [...epsAndSinglePacks, ...songs];

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
    const getArtistStr = (r: any) => r ? (r.isNPCCollab ? `${r.collaborator} & ${pName}` : (r.type === 'Single' && r.collaborator ? `${pName} & ${r.collaborator}` : pName)) : pName;
    const npcSingles = generateNPCSongs(currentWeekFluctuation, currentWeekNumber, pName);
    const npcAlbums = generateNPCAlbums(currentWeekFluctuation, currentWeekNumber, pName);

    const currentDateObj = new Date(gameState.time.startDate);
    currentDateObj.setDate(currentDateObj.getDate() + gameState.time.daysPassed);
    const currentDateStr = currentDateObj.toISOString();

    const getYoutubeSongsChart = (region: 'global' | 'america' | 'europe' | 'latin_america') => {
        const playerItems = allTracks.map(s => {
            const age = Math.max(1, Math.floor((currentDateObj.getTime() - new Date(s.releaseDate || currentDateStr).getTime()) / (1000 * 3600 * 24)));
            let streams = s.lastDailyStreams?.youtubeMusic || ((getSongYTMusicStreams(s) / age) || 0);
            let val = streams;
            if (region === 'america') val = Math.floor(streams * amPerc) || 0;
            if (region === 'europe') val = Math.floor(streams * euPerc) || 0;
            if (region === 'latin_america') val = Math.floor(streams * laPerc) || 0;
            return { song: s, streams: val, artist: getArtistStr(s), isPlayer: true };
        });

        const npcItems = npcSingles.map(npc => {
            const hash = (npc.title.charCodeAt(0) || 0) + (npc.artist.charCodeAt(0) || 0);
            const platformMulti = 0.5 + (((hash * 11) % 13) / 10);
            let streams = Math.floor(npc.points * 3 * platformMulti); 
            
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
        let streams = p.lastDailyStreams?.youtubeMusic || ((getPlatformStreams(p) / Math.max(1, age * 0.8)) || 0);
        return { album: p, streams, artist: getArtistStr(p), isPlayer: true };
    });
    
    const npcAlbumsList = npcAlbums.map(npc => {
        const hash = (npc.title.charCodeAt(0) || 0) + (npc.artist.charCodeAt(0) || 0);
        const platformMulti = 0.5 + (((hash * 11) % 13) / 10);
        let streams = Math.floor(npc.points * 2 * platformMulti); 
        return { album: npc, streams, artist: npc.artist, isPlayer: false };
    });

    const combinedAlbumsList = [...globalAlbumsList, ...npcAlbumsList].sort((a,b) => b.streams - a.streams).slice(0, 200);

    return (
        <div className="bg-[#030303] text-white min-h-screen font-sans pb-32 overflow-x-hidden relative">
            {youtubeMusicTab === 'profile' ? (
            <>
            {/* Header Hero */}
            <div className="relative h-[24rem] md:h-[28rem] flex flex-col justify-end p-6 md:p-12 overflow-hidden shrink-0">
               {gameState.artist.image ? (
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${gameState.artist.image})` }}></div>
               ) : (
                  <div className="absolute inset-0 bg-[#121212] flex items-center justify-center">
                     <User className="w-32 h-32 text-white/10" />
                  </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/60 to-transparent"></div>
               <div className="relative z-10 flex flex-col items-start pt-[50%]">
                  <h1 className="text-4xl md:text-6xl font-black mb-1">{gameState.artist.name}</h1>
                  <p className="text-white/60 font-medium text-sm mb-4">{formatViews(calculateListeners())} monthly listeners</p>
                  
                  <div className="flex items-center w-full justify-between">
                     <button className="px-4 py-2 hover:bg-gray-200 bg-white text-black rounded-full font-medium text-sm transition-colors flex items-center gap-2">
                        Subscribe <span className="text-black/70">{formatViews(getSubscribers())}</span>
                     </button>
                     <div className="flex items-center gap-2">
                        <button className="w-11 h-11 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center shrink-0">
                           <Disc className="w-5 h-5" />
                        </button>
                        <button className="w-12 h-12 bg-white hover:scale-105 transition-transform rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-white/20">
                           <Play className="w-6 h-6 text-black fill-current ml-1" />
                        </button>
                     </div>
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex gap-6 mt-6 border-b border-white/10 w-full overflow-x-auto hide-scrollbar">
                     <button className="text-white font-medium text-sm pb-3 border-b-2 border-white shrink-0">Music</button>
                     <button className="text-white/60 font-medium text-sm pb-3 border-b-2 border-transparent shrink-0">Concerts</button>
                     <button className="text-white/60 font-medium text-sm pb-3 border-b-2 border-transparent shrink-0">Store</button>
                  </div>
               </div>
            </div>

            {/* Sections */}
            <div className="px-4 md:px-12 mt-6 flex flex-col gap-10">

                {/* Top Songs */}
                {topSongsChunks.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl md:text-2xl font-bold">Top songs</h2>
                            <button className="px-3 py-1 border border-white/20 rounded-full text-xs font-medium hover:bg-white/10 transition-colors">Play all</button>
                        </div>
                        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 snap-x">
                            {topSongsChunks.map((chunk, i) => (
                                <div key={i} className="flex flex-col gap-2 min-w-[300px] md:min-w-[400px] w-[85vw] md:w-[400px] snap-start shrink-0">
                                    {chunk.map((song) => (
                                        <div key={song.id} onClick={() => handleSelectRelease(song)} className="flex items-center gap-3 p-2 rounded-md hover:bg-white/10 group cursor-pointer transition-colors">
                                            <div className="w-12 h-12 bg-[#212121] rounded shrink-0 overflow-hidden relative">
                                                {song.coverImage ? <img src={song.coverImage || undefined} className="w-full h-full object-cover" /> : null}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <Play className="w-5 h-5 text-white fill-current" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-medium truncate group-hover:underline">{song.title}</h3>
                                                <p className="text-white/60 text-[13px] truncate">{getArtistStr(song)} • {formatViews(getSongYTMusicStreams(song))} streams</p>
                                            </div>
                                            <button className="p-2 opacity-0 group-hover:opacity-100 text-white/50 hover:text-white transition-all">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Albums */}
                {albums.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl md:text-2xl font-bold">Albums</h2>
                            <ChevronRight className="w-6 h-6 text-white/60" />
                        </div>
                        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 snap-x">
                            {albums.map((album) => (
                                <div key={album.id} onClick={() => handleSelectRelease(album)} className="flex flex-col w-[160px] md:w-[200px] snap-start shrink-0 group cursor-pointer">
                                    <div className="w-full aspect-square bg-[#212121] rounded-md overflow-hidden relative mb-3">
                                        {album.coverImage ? <img src={album.coverImage || undefined} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <Disc className="w-12 h-12 text-white/20 m-auto mt-16 md:mt-24" />}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                <Play className="w-6 h-6 text-white fill-current ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="font-medium text-base truncate group-hover:underline">{album.title}</h3>
                                    <p className="text-white/60 text-sm truncate">{album.releaseDate ? new Date(album.releaseDate).getFullYear() : 'Unknown'}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Singles */}
                {singlesAndEPs.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl md:text-2xl font-bold">Singles & EPs</h2>
                            <ChevronRight className="w-6 h-6 text-white/60" />
                        </div>
                        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 snap-x">
                            {[...singlesAndEPs].reverse().map((song) => (
                                <div key={song.id} onClick={() => handleSelectRelease(song)} className="flex flex-col w-[160px] md:w-[200px] snap-start shrink-0 group cursor-pointer">
                                    <div className="w-full aspect-square bg-[#212121] rounded-md overflow-hidden relative mb-3">
                                        {song.coverImage ? <img src={song.coverImage || undefined} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <Disc className="w-12 h-12 text-white/20 m-auto mt-16 md:mt-24" />}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                <Play className="w-6 h-6 text-white fill-current ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="font-medium text-base truncate group-hover:underline">{song.title}</h3>
                                    <p className="text-white/60 text-sm truncate">{song.type} • {song.releaseDate ? new Date(song.releaseDate).getFullYear() : ''}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Videos */}
                {videos.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl md:text-2xl font-bold">Videos</h2>
                            <ChevronRight className="w-6 h-6 text-white/60" />
                        </div>
                        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 snap-x">
                            {[...videos].reverse().map((video) => {
                                const song = songs.find(s => s?.id === video.songId);
                                return (
                                    <div key={video.id} className="flex flex-col w-[260px] md:w-[320px] snap-start shrink-0 group cursor-pointer">
                                        <div className="w-full aspect-video bg-[#212121] rounded-md overflow-hidden relative mb-3">
                                            {video.thumbnail || song?.coverImage ? <img src={video.thumbnail || song?.coverImage || undefined} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> : null}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                    <Play className="w-6 h-6 text-white fill-current ml-1" />
                                                </div>
                                            </div>
                                        </div>
                                        <h3 className="font-medium text-base truncate group-hover:underline">{video.title}</h3>
                                        <p className="text-white/60 text-sm truncate">{getArtistStr(gameState.releases.find(r => r.id === video.songId))} • {formatViews(video.views)} views</p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* About */}
                <section className="mb-12">
                    <h2 className="text-xl md:text-2xl font-bold mb-2">About</h2>
                    <p className="text-white/60 mb-4">{gameState.stats.streams > 0 ? (gameState.stats.streams + videos.reduce((acc, v) => acc + v.views, 0)).toLocaleString('en-US') : 0} views</p>
                    <p className="text-white/80 leading-relaxed max-w-3xl">
                        {gameState.artist.name} is a singer, songwriter from {gameState.artist.country}. 
                        Debuted in {new Date(gameState.time.startDate).getFullYear()} and continues to grow their career in the music industry.
                    </p>
                </section>
            </div>

            {/* Detail Popup Form */}
            {selectedRelease && (
               <div className="fixed inset-0 z-[500] bg-[#030303] overflow-y-auto">
                  <div className="sticky top-0 z-20 flex items-center justify-between p-4 px-6 border-b border-white/10 bg-[#030303]/90 backdrop-blur-md">
                     <button onClick={() => setSelectedRelease(null)} className="flex items-center text-white font-bold text-lg hover:opacity-70 transition-opacity">
                        <ChevronLeft className="w-6 h-6 mr-1" />
                     </button>
                  </div>
                  <div className="w-full max-w-5xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12 items-start">
                     <div className="w-full max-w-xs mx-auto md:max-w-none md:mx-0 md:w-80 shrink-0 md:sticky md:top-32 flex flex-col pt-4 md:pt-0">
                        <div className="w-full aspect-square bg-[#212121] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] mb-6 border border-white/10">
                           {selectedRelease.coverImage ? <img src={selectedRelease.coverImage} className="w-full h-full object-cover" /> : <Disc className="w-24 h-24 text-white/20 m-auto mt-20 md:mt-28" />}
                        </div>
                        <h1 className="text-2xl font-bold leading-tight mb-2">{selectedRelease.title}</h1>
                        <p className="text-white/80 text-xl font-medium mb-1 cursor-pointer hover:underline">{getArtistStr(selectedRelease)}</p>
                        <p className="text-white/40 font-medium text-sm mb-6 uppercase tracking-wider">{selectedRelease.type} • {new Date(selectedRelease.releaseDate!).getFullYear()}</p>
                        
                        <div className="flex gap-3">
                           <button className="flex-1 bg-white text-black py-3 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                              <Play className="w-5 h-5 fill-current" />
                              Play
                           </button>
                        </div>
                     </div>
                     
                     <div className="flex-1 w-full pt-2">
                        <div className="flex flex-col">
                           {(['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(selectedRelease.type) 
                             ? (selectedRelease as Album).trackIds.map(tid => allTracks.find(r => r?.id === tid)) 
                             : [selectedRelease]).map((t, i) => t && (
                              <div key={t.id || i} className="flex items-center justify-between py-3 border-b border-white/5 group hover:bg-white/5 px-2 -mx-2 rounded-lg cursor-pointer transition-colors">
                                 <div className="flex items-center gap-4">
                                    <span className="w-6 text-right text-white/40 font-medium group-hover:hidden">{i + 1}</span>
                                    <span className="w-6 hidden group-hover:flex items-center justify-end"><Play className="w-4 h-4 fill-white text-white"/></span>
                                    {t.coverImage !== selectedRelease.coverImage && t.coverImage && (
                                       <img src={t.coverImage} className="w-10 h-10 rounded shrink-0 object-cover" />
                                    )}
                                    <div className="flex flex-col">
                                       <span className="font-medium text-white leading-tight">{t.title}</span>
                                       <span className="text-white/40 text-sm">{formatViews(getSongYTMusicStreams(t as Song))} streams</span>
                                    </div>
                                 </div>
                                 <MoreVertical className="text-white/30 group-hover:text-white transition-colors" />
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            )}
            </>
            ) : (
             <div className="flex flex-col min-h-screen pt-12 pb-24 text-left">
               <div className="px-4 md:px-8 flex gap-4 md:gap-8 flex-wrap border-b border-white/10 mb-8 sticky top-0 bg-[#030303]/80 backdrop-blur z-20 pt-4">
                  {(['global_song', 'global_album', 'america', 'europe', 'latin_america'] as const).map(tab => (
                     <button
                        key={tab}
                        onClick={() => setYoutubeMusicChart(tab)}
                        className={`pb-4 font-bold text-sm md:text-base capitalize transition-colors relative ${youtubeMusicChart === tab ? 'text-white' : 'text-white/60 hover:text-white'}`}
                     >
                        {tab.replace('_', ' ')}
                        {youtubeMusicChart === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t" />}
                     </button>
                  ))}
               </div>

               <div className="w-full max-w-4xl mx-auto px-4 md:px-8 pb-24">
                  {youtubeMusicChart === 'global_album' ? (
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                         {combinedAlbumsList.map((item, i) => (
                            <div key={item.album.id} className="flex flex-col group cursor-pointer" onClick={() => { setYoutubeMusicChart(null); if(item.isPlayer) handleSelectRelease(item.album as Release); }}>
                               <div className="w-full aspect-square bg-[#212121] rounded-xl overflow-hidden mb-3 relative border border-white/10">
                                  {item.album.coverImage ? <img src={item.album.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <Disc className="w-16 h-16 text-white/30 m-auto mt-12" />}
                                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-xs font-bold">{i+1}</div>
                               </div>
                               <span className="font-bold text-[15px] leading-tight truncate">{item.album.title}</span>
                               <span className="text-white/60 text-[13px]">{item.artist}</span>
                            </div>
                         ))}
                     </div>
                  ) : (
                     <div className="flex flex-col border-t border-white/10">
                         {getYoutubeSongsChart(youtubeMusicChart as any).map((item, i) => (
                            <div key={item.song.id} className="flex items-center gap-4 py-3 border-b border-white/10 hover:bg-white/5 px-2 -mx-2 rounded-lg transition-colors cursor-pointer" onClick={() => { setYoutubeMusicChart(null); if(item.isPlayer) handleSelectRelease(item.song as Release); }}>
                               <div className="w-12 h-12 bg-[#212121] rounded object-cover shrink-0 overflow-hidden relative">
                                  {item.song.coverImage ? <img src={item.song.coverImage} className="w-full h-full object-cover" /> : <Disc className="m-auto mt-3 text-white/30" />}
                               </div>
                               <span className="w-6 font-bold text-lg text-white/60 shrink-0 text-center">{i+1}</span>
                               <div className="flex-1 flex flex-col overflow-hidden">
                                  <span className="font-bold text-lg leading-tight truncate">{item.song.title}</span>
                                  <span className="text-white/60 text-sm truncate">{item.artist}</span>
                               </div>
                               <MoreVertical className="text-white/40 group-hover:text-white shrink-0" />
                            </div>
                         ))}
                     </div>
                  )}
               </div>
            </div>   
            )}

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#030303]/90 backdrop-blur-md border-t border-white/10 z-[300] flex justify-around items-center px-4 md:px-24">
               <button 
                  onClick={() => { setYoutubeMusicChart(null); setYoutubeMusicTab('profile'); }} 
                  className={`flex flex-col items-center justify-center w-24 gap-1 ${youtubeMusicTab === 'profile' ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
               >
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  <span className="text-[10px] font-semibold">Profile</span>
               </button>
               <button 
                  onClick={() => { setYoutubeMusicChart('global_song'); setYoutubeMusicTab('charts'); }} 
                  className={`flex flex-col items-center justify-center w-24 gap-1 ${youtubeMusicTab === 'charts' ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
               >
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11V3H8v6H2v12h20V11h-6zm-6-6h4v14h-4V5zm-6 6h4v8H4v-8zm16 8h-4v-6h4v6z"/></svg>
                  <span className="text-[10px] font-semibold">Charts</span>
               </button>
            </div>
        </div>
    );
}
