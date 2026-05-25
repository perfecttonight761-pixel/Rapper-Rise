import React, { useState } from 'react';
import { GameState, Release, Song, Album, Video } from '../types';
import { ArrowLeft, Search, MoreVertical, Bell, ShoppingBag, Plus, Home, MonitorPlay, User as UserIcon, PlaySquare, Music, ChevronDown, Disc, Upload } from 'lucide-react';

interface YouTubeViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onClose: () => void;
}

export function YouTubeView({ gameState, setGameState, onClose }: YouTubeViewProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'releases'>('video');
  const [videoSort, setVideoSort] = useState<'latest' | 'popular' | 'oldest'>('latest');
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTrackId, setUploadTrackId] = useState('');
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [uploadBudget, setUploadBudget] = useState(10000);
  const [uploadThumbnail, setUploadThumbnail] = useState('');
  
  const eligibleReleases = gameState.releases.filter(r => r.status === 'Published' || r.status === 'Scheduled');
  const publishedReleases = gameState.releases.filter(r => r.status === 'Published' && !(r.type === 'Single' && (r as Song).isBSide));
  const allSongs = eligibleReleases.filter(r => r.type === 'Single') as Song[];
  
  // Also get tracks from albums
  const albums = eligibleReleases.filter(r => r.type === 'Album') as Album[];
  albums.forEach(a => {
    a.trackIds.forEach(tid => {
       const s = gameState.releases.find(rel => rel?.id === tid) as Song;
       if (s && !allSongs.find(existing => existing?.id === s.id)) {
          allSongs.push(s);
       }
    });
  });

  const videos = gameState.videos || [];
  
  const getArtistStr = (r: any) => r ? (r.isNPCCollab ? `${r.collaborator} & ${gameState.artist?.name || 'You'}` : (r.type === 'Single' && r.collaborator ? `${gameState.artist?.name || 'You'} & ${r.collaborator}` : gameState.artist?.name || 'You')) : gameState.artist?.name || 'You';

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // compress image instead of reading raw
        const { compressImage } = await import('../imageUtils');
        const compressed = await compressImage(file, 400, 400, 0.7);
        setUploadThumbnail(compressed);
      } catch (err) {
        console.error("Compression err", err);
      }
    }
  };

  const handleUpload = () => {
    if (!uploadTrackId) return;
    const song = allSongs.find(s => s?.id === uploadTrackId);
    if (!song) return;
    
    if (gameState.stats.money < uploadBudget) {
      alert("Not enough money!");
      return;
    }

    const currentDate = new Date(gameState.time.startDate);
    currentDate.setDate(currentDate.getDate() + gameState.time.daysPassed);

    let pubDate = currentDate.toISOString();
    if (song.status === 'Scheduled' && song.releaseDate) {
        pubDate = song.releaseDate; // matches scheduled song date
    }

    const newVideo: Video = {
      id: `vid_${Date.now()}`,
      songId: song.id,
      title: `${getArtistStr(song)} - ${song.title} (Official Music Video)`,
      type: 'MusicVideo',
      publishDate: pubDate,
      views: 0,
      budget: uploadBudget,
      thumbnail: uploadThumbnail || song.coverImage
    };

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        stats: {
          ...prev.stats,
          money: prev.stats.money - uploadBudget
        },
        videos: [...(prev.videos || []), newVideo]
      };
    });

    setShowUploadModal(false);
    setUploadTrackId('');
    setUploadBudget(10000);
    setUploadThumbnail('');
    setActiveTab('video');
  };

  const formatViews = (views: number) => {
     if (views >= 1000000000) {
        return (views / 1000000000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'B';
     } else if (views >= 1000000) {
        return (views / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'M';
     } else if (views >= 1000) {
        return (views / 1000).toLocaleString('en-US', { maximumFractionDigits: 0 }) + 'K';
     }
     return views.toLocaleString('en-US');
  };

  const getSubscribers = () => {
     if (gameState.stats.youtubeSubscribers !== undefined) {
        return gameState.stats.youtubeSubscribers;
     }
     // Fallback calculation based on popularity
     const totalPop = (gameState.popularity.america + gameState.popularity.europe + gameState.popularity.latinAmerica) / 3;
     return Math.floor(gameState.stats.streams * 0.05 + totalPop * 10000);
  };
  
  const subsText = formatViews(getSubscribers());
  
  const timeAgo = (dateStr: string) => {
     if (!dateStr) return "";
     const publishDate = new Date(dateStr);
     const currentDate = new Date(gameState.time.startDate);
     currentDate.setDate(currentDate.getDate() + gameState.time.daysPassed);
     
     const diffTime = currentDate.getTime() - publishDate.getTime();
     if (diffTime < 0) {
        const daysUntil = Math.ceil(Math.abs(diffTime) / (1000 * 60 * 60 * 24));
        return `Premieres in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
     }
     const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
     
     if (diffDays === 0) return "Today";
     if (diffDays === 1) return "1 day ago";
     if (diffDays < 7) return `${diffDays} days ago`;
     if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
     if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
     return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="w-[400px] h-full bg-[#0f0f0f] text-white flex flex-col relative font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 bg-[#0f0f0f] z-10 sticky top-0">
        <button onClick={onClose} className="p-2 hover:bg-white/10 text-white rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-white/10 text-white rounded-full transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-white/10 text-white rounded-full transition-colors">
             <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-20">
         {/* Banner */}
         <div className="w-full h-32 md:h-40 bg-zinc-800">
            {gameState.artist?.socialProfile?.bannerUrl ? (
               <img src={gameState.artist.socialProfile.bannerUrl || undefined} alt="Banner" className="w-full h-full object-cover" />
            ) : gameState.artist?.image ? (
               <div className="w-full h-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-cover bg-center blur-md opacity-50 transform scale-110" style={{ backgroundImage: `url(${gameState.artist.image})` }}></div>
               </div>
            ) : null}
         </div>

         {/* Profile Info */}
         <div className="px-4 mt-3 flex flex-col items-start text-left">
            <div className="flex items-center gap-4 mb-3">
               <div className="w-20 h-20 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                  {gameState.artist?.image ? <img src={gameState.artist.image || undefined} className="w-full h-full object-cover" /> : <UserIcon className="m-auto mt-5 w-10 h-10 text-zinc-600" />}
               </div>
               
               <div className="flex flex-col">
                  <h1 className="text-2xl font-bold flex items-center gap-1.5">
                     {gameState.artist?.name}
                     <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-zinc-400"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"/></svg>
                  </h1>
                  <p className="text-white/60 text-[13px] mt-0.5 tracking-wide">@{gameState.artist?.name.replace(/\s+/g, '')}</p>
                  <p className="text-white/60 text-[13px] mt-0.5">{subsText} subscriber • {videos.length + publishedReleases.length} video</p>
               </div>
            </div>
            
            <p className="text-white/80 text-[13px] leading-snug line-clamp-2 w-full mt-1">
               {gameState.artist?.socialProfile?.bio || `Welcome to the official YouTube channel for ${gameState.artist?.name}.`}
            </p>
            
            <div className="flex w-full gap-2 mt-4">
               <button className="flex-1 bg-[#272727] hover:bg-[#3f3f3f] py-2 rounded-full font-medium text-[13px] flex items-center justify-center gap-2 transition-colors">
                  <Bell className="w-4 h-4" /> Unsubscribe <ChevronDown className="w-4 h-4 text-white/50" />
               </button>
               <button className="flex-1 bg-[#272727] hover:bg-[#3f3f3f] py-2 rounded-full font-medium text-[13px] flex items-center justify-center gap-2 transition-colors">
                  <ShoppingBag className="w-4 h-4" /> Store
               </button>
            </div>
         </div>

         {/* Tabs Navigation */}
         <div className="sticky top-0 z-20 bg-[#0f0f0f]">
            <div className="flex border-b border-white/10 mt-4 overflow-x-auto hide-scrollbar px-4">
               <button 
                  onClick={() => setActiveTab('video')}
                  className={`py-3 mr-6 font-medium text-[14px] shrink-0 border-b-2 transition-colors ${activeTab === 'video' ? 'text-white border-white' : 'text-white/60 border-transparent hover:text-white/80'}`}
               >
                  Videos
               </button>
               <button 
                  onClick={() => { setActiveTab('releases'); setSelectedReleaseId(null); }}
                  className={`py-3 mr-6 font-medium text-[14px] shrink-0 border-b-2 transition-colors ${activeTab === 'releases' ? 'text-white border-white' : 'text-white/60 border-transparent hover:text-white/80'}`}
               >
                  Releases
               </button>
            </div>
         </div>

         {/* Content Area */}
         <div className="p-0">
            {activeTab === 'video' && (
               <div className="flex flex-col">
                  {/* Sorting chips */}
                  <div className="flex gap-2 p-3">
                     <button 
                        onClick={() => setVideoSort('latest')}
                        className={`px-3 py-1 font-medium text-[13px] rounded-lg transition-colors ${videoSort === 'latest' ? 'bg-white text-black' : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'}`}>
                        Latest
                     </button>
                     <button 
                        onClick={() => setVideoSort('popular')}
                        className={`px-3 py-1 font-medium text-[13px] rounded-lg transition-colors ${videoSort === 'popular' ? 'bg-white text-black' : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'}`}>
                        Popular
                     </button>
                     <button 
                        onClick={() => setVideoSort('oldest')}
                        className={`px-3 py-1 font-medium text-[13px] rounded-lg transition-colors ${videoSort === 'oldest' ? 'bg-white text-black' : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'}`}>
                        Oldest
                     </button>
                  </div>
                  
                  {videos.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-16 text-white/40">
                        <MonitorPlay className="w-16 h-16 mb-4 opacity-50" />
                        <p>No videos uploaded yet.</p>
                     </div>
                  ) : (
                     <div className="flex flex-col">
                        {[...videos].sort((a, b) => {
                           if (videoSort === 'popular') return b.views - a.views;
                           if (videoSort === 'oldest') return new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime();
                           return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
                        }).map(video => {
                           const song = allSongs.find(s => s?.id === video.songId);
                           return (
                              <div key={video.id} className="flex gap-3 p-3">
                                 <div className="w-40 aspect-video bg-zinc-800 rounded-lg overflow-hidden shrink-0 relative">
                                    {video.thumbnail || song?.coverImage ? <img src={video.thumbnail || song?.coverImage || undefined} className="w-full h-full object-cover" /> : null}
                                    <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[10px] font-medium font-mono text-white flex items-center">
                                       <Music className="w-3 h-3 mr-1" /> 3:45
                                    </div>
                                 </div>
                                 <div className="flex flex-col flex-1">
                                    <h3 className="text-[14px] font-medium line-clamp-2 leading-tight text-white mb-[3px]">{video.title}</h3>
                                    <p className="text-[12px] text-white/60">{formatViews(video.views)} views • {timeAgo(video.publishDate)}</p>
                                 </div>
                                 <button className="p-1 h-fit text-white/60">
                                    <MoreVertical className="w-4 h-4" />
                                 </button>
                              </div>
                           );
                        })}
                     </div>
                  )}
               </div>
            )}

            {activeTab === 'releases' && !selectedReleaseId && (
               <div className="flex flex-col pt-3">
                  {publishedReleases.slice().reverse().map(release => (
                     <div key={release.id} onClick={() => setSelectedReleaseId(release.id)} className="flex gap-4 p-3 items-center cursor-pointer hover:bg-white/5 transition-colors">
                        <div className="w-32 h-32 bg-zinc-800 rounded-lg overflow-hidden shrink-0 relative">
                           {release.coverImage ? <img src={release.coverImage || undefined} className="w-full h-full object-cover" /> : null}
                           <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[11px] font-medium font-mono text-white flex items-center">
                              <Music className="w-3 h-3 mr-1" /> 
                              {release.type === 'Album' ? (release as Album).trackIds.length : 1}
                           </div>
                        </div>
                        <div className="flex flex-col flex-1">
                           <h3 className="text-base font-medium line-clamp-2 leading-tight text-white mb-1">{release.title}</h3>
                           <p className="text-sm text-white/60">{getArtistStr(release)} • {release.type}</p>
                        </div>
                        <button className="p-2 text-white/60">
                           <MoreVertical className="w-5 h-5" />
                        </button>
                     </div>
                  ))}
                  {publishedReleases.length === 0 && (
                     <div className="flex flex-col items-center justify-center py-16 text-white/40">
                        <Disc className="w-16 h-16 mb-4 opacity-50" />
                        <p>No releases yet.</p>
                     </div>
                  )}
               </div>
            )}

            {activeTab === 'releases' && selectedReleaseId && (() => {
               const release = publishedReleases.find(r => r?.id === selectedReleaseId);
               if (!release) return null;
               
               let releaseTracks: Song[] = [];
               let totalViews = 0;
               if (release.type === 'Album') {
                  const album = release as Album;
                  releaseTracks = album.trackIds.map(tid => allSongs.find(s => s?.id === tid)).filter(Boolean) as Song[];
               } else {
                  releaseTracks = [release as Song];
               }

               // real totalViews calculation
               totalViews = releaseTracks.reduce((acc, t) => acc + (t.streams.youtubeMusic || Math.floor(t.streams.spotify * 0.3)), 0);

               return (
                  <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                     <div className="p-6 pb-2 relative overflow-hidden flex flex-col items-center">
                        {/* Background blurry effect */}
                        <div className="absolute inset-0 z-0">
                           {release.coverImage && <div className="w-full h-full bg-cover bg-center opacity-30 blur-2xl transform scale-110" style={{ backgroundImage: `url(${release.coverImage})` }}></div>}
                           <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0f0f0f]"></div>
                        </div>
                        
                        <button onClick={() => setSelectedReleaseId(null)} className="absolute top-4 left-4 p-2 z-10 text-white/80 hover:text-white bg-black/40 rounded-full">
                           <ArrowLeft className="w-5 h-5" />
                        </button>

                        <div className="w-48 h-48 bg-zinc-800 shadow-2xl relative z-10 rounded mb-6">
                           {release.coverImage && <img src={release.coverImage || undefined} className="w-full h-full object-cover rounded" />}
                        </div>
                        <h2 className="text-2xl font-bold text-center z-10 relative mb-1">{release.title}</h2>
                        <p className="text-sm font-medium text-white/60 z-10 relative">Playlist • {releaseTracks.length} video • {formatViews(totalViews)} views</p>
                        
                        <div className="flex items-center gap-3 w-full mt-6 z-10 relative">
                           <button className="flex-1 bg-white hover:bg-gray-200 text-black py-2.5 rounded-full font-bold flex items-center justify-center gap-2 transition-colors">
                              <PlaySquare className="w-5 h-5 fill-current" /> Play all
                           </button>
                           <button className="w-11 h-11 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors">
                              <Plus className="w-5 h-5" />
                           </button>
                        </div>
                     </div>

                     <div className="flex flex-col mt-4">
                        {releaseTracks.map((track, idx) => {
                           // Use youtube streams or derive from total streams
                           const trackViews = track.streams.youtubeMusic || Math.floor(track.streams.spotify * 0.3);
                           return (
                              <div key={track.id} className="flex gap-4 p-3 px-4 hover:bg-white/5 transition-colors group cursor-pointer">
                                 <div className="w-32 aspect-video bg-zinc-800 rounded-lg overflow-hidden shrink-0 relative">
                                    {release.coverImage ? <img src={release.coverImage || undefined} className="w-full h-full object-cover" /> : null}
                                    <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[10px] font-medium font-mono text-white flex items-center">
                                       <Music className="w-3 h-3 mr-1" /> 3:20
                                    </div>
                                 </div>
                                 <div className="flex flex-col flex-1 justify-center">
                                    <h3 className="text-[14px] font-medium line-clamp-2 leading-tight text-white mb-[3px] group-hover:text-blue-400 transition-colors">{getArtistStr(release)} - {track.title} (Official Audio)</h3>
                                    <p className="text-[12px] text-white/60">{formatViews(trackViews)} views • {timeAgo(release.releaseDate || "")}</p>
                                 </div>
                                 <button className="p-2 h-fit text-white/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="w-5 h-5" />
                                 </button>
                              </div>
                           );
                        })}
                     </div>
                     <div className="h-6"></div>
                  </div>
               );
            })()}
         </div>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#0f0f0f]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around px-12 py-2 z-20 pb-4">
         <button className="flex flex-col items-center gap-1 text-white hover:text-white/80 transition-colors">
            <Home className="w-6 h-6" />
            <span className="text-[10px]">Home</span>
         </button>
         <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-white text-white hover:bg-white/20 transition-colors"
         >
            <Plus className="w-8 h-8" />
         </button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
         <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#212121] rounded-2xl w-full max-w-md p-6">
               <h2 className="text-xl font-bold mb-4">Upload Music Video</h2>
               
               <div className="mb-4">
                  <label className="block text-sm font-medium text-white/60 mb-2">Select Track</label>
                  <input
                     type="text"
                     placeholder="Search songs..."
                     value={songSearchQuery}
                     onChange={(e) => setSongSearchQuery(e.target.value)}
                     className="w-full bg-[#0f0f0f] border border-white/20 rounded-lg px-4 py-2 mb-2 text-white outline-none focus:border-white transition-colors"
                  />
                  <select 
                     value={uploadTrackId} 
                     onChange={(e) => setUploadTrackId(e.target.value)}
                     className="w-full bg-[#0f0f0f] border border-white/20 rounded-lg px-4 py-3 text-white appearance-none outline-none focus:border-white transition-colors"
                  >
                     <option value="" disabled>Select a song...</option>
                     {allSongs.filter(s => s.title.toLowerCase().includes(songSearchQuery.toLowerCase())).map(song => (
                        <option key={song.id} value={song.id}>{song.title}</option>
                     ))}
                  </select>
               </div>

               {uploadTrackId && (
                  <div className="mb-4">
                     <label className="block text-sm font-medium text-white/60 mb-2">Auto-Generated Title</label>
                     <div className="bg-[#0f0f0f] p-3 rounded-lg border border-white/10 text-white/80 font-medium">
                        {getArtistStr(allSongs.find(s => s?.id === uploadTrackId))} - {allSongs.find(s => s?.id === uploadTrackId)?.title} (Official Music Video)
                     </div>
                  </div>
               )}

               <div className="mb-6">
                  <label className="block text-sm font-medium text-white/60 mb-2">Thumbnail (Optional)</label>
                  {!uploadThumbnail ? (
                     <label className="w-full aspect-video rounded-lg border-2 border-dashed border-white/20 hover:border-white/40 bg-[#0f0f0f] flex flex-col items-center justify-center cursor-pointer transition-colors">
                        <Upload className="w-6 h-6 text-white/40 mb-2" />
                        <span className="text-sm font-medium text-white/60">Upload Image</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                     </label>
                  ) : (
                     <div className="w-full aspect-video rounded bg-black overflow-hidden relative group">
                        <img src={uploadThumbnail || undefined} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                           <label className="bg-[#212121] text-white px-4 py-2 rounded-lg font-medium text-sm cursor-pointer hover:bg-[#3f3f3f] transition-colors">
                              Change Thumbnail
                              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                           </label>
                        </div>
                     </div>
                  )}
               </div>

               <div className="mb-6">
                  <label className="block text-sm font-medium text-white/60 mb-2">MV Budget ($)</label>
                  <div className="flex items-center gap-4">
                     <input 
                        type="range" 
                        min="5000" 
                        max="1000000" 
                        step="5000"
                        value={uploadBudget} 
                        onChange={(e) => setUploadBudget(Number(e.target.value))}
                        className="flex-1 accent-white"
                     />
                     <span className="font-mono bg-[#0f0f0f] px-3 py-1 rounded text-white min-w-[100px] text-right">
                        ${uploadBudget.toLocaleString()}
                     </span>
                  </div>
                  <p className="text-xs text-white/40 mt-2">Higher budget increases potential views and chart performance.</p>
               </div>

               <div className="flex gap-3">
                  <button 
                     onClick={() => setShowUploadModal(false)}
                     className="flex-1 py-3 font-bold text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                  >
                     Cancel
                  </button>
                  <button 
                     onClick={handleUpload}
                     disabled={!uploadTrackId}
                     className="flex-1 py-3 font-bold text-black bg-[#3ea6ff] hover:bg-[#65b8ff] disabled:opacity-50 disabled:bg-white/20 disabled:text-white/40 rounded-xl transition-colors"
                  >
                     Upload
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
