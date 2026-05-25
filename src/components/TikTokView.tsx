import React, { useState, useMemo } from 'react';
import { GameState, TikTokPost, TikTokSound } from '../types';
import { Search, User, Compass, MessageCircle, Heart, Share2, Play, Bookmark, Music, Zap, ChevronLeft, Mic, Bell, Send, UserPlus, FileText, Camera, Image as ImageIcon, Pin, Settings } from 'lucide-react';

const TikTokVerifiedBadge = ({ className = "w-5 h-5 flex-shrink-0" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.396 2.053a1.5 1.5 0 0 1 1.208 0l1.723.731a1.5 1.5 0 0 0 1.096.068l1.794-.582a1.5 1.5 0 0 1 1.884.992l.53 1.794a1.5 1.5 0 0 0 .848.971l1.706.8a1.5 1.5 0 0 1 .806 1.93l-.684 1.745a1.5 1.5 0 0 0 .153 1.258l1.042 1.55a1.5 1.5 0 0 1-.36 2.115l-1.503 1.134a1.5 1.5 0 0 0-.585 1.127l-.208 1.86a1.5 1.5 0 0 1-1.556 1.32l-1.874-.112a1.5 1.5 0 0 0-1.196.48l-1.182 1.464a1.5 1.5 0 0 1-2.112.21l-1.428-1.23a1.5 1.5 0 0 0-1.266-.18l-1.785.607a1.5 1.5 0 0 1-1.921-.92l-.568-1.782a1.5 1.5 0 0 0-.868-.952l-1.696-.796a1.5 1.5 0 0 1-.803-1.933l.69-1.743a1.5 1.5 0 0 0-.154-1.259L1.87 11.23a1.5 1.5 0 0 1 .36-2.115l1.492-1.126a1.5 1.5 0 0 0 .584-1.127L4.512 5.01a1.5 1.5 0 0 1 1.56-1.32l1.867.111a1.5 1.5 0 0 0 1.193-.48l1.17-1.455a1.5 1.5 0 0 1 1.094-.213Z" fill="#20D5EC"/>
        <path d="M16 9.5L10.5 15.5L8 12.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const formatNumberSafely = (n?: number) => {
    const num = Number(n);
    if (isNaN(num)) return '0';
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 10000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
};

interface TikTokViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
  onClose: () => void;
}

export function TikTokView({ gameState, setGameState, onClose }: TikTokViewProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'music'>('music');
  const [activePost, setActivePost] = useState<TikTokPost | null>(null);
  const [createPostMode, setCreatePostMode] = useState(false);
  const [promotionRegions, setPromotionRegions] = useState(1);
  
  const [caption, setCaption] = useState('');
  const [postModeType, setPostModeType] = useState<'video' | 'photo'>('video');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [campaignSoundId, setCampaignSoundId] = useState<string | null>(null);
  const [editProfileMode, setEditProfileMode] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editBio, setEditBio] = useState('');
  
  const profile = gameState.tikTok;
  if (!profile) return (
      <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div className="text-white text-center">
              <p>TikTok Profile not found.</p>
              <button onClick={onClose} className="mt-4 px-4 py-2 bg-white text-black rounded-lg font-bold">Return</button>
          </div>
      </div>
  );

  const defaultImage = gameState.artist.image || 'https://images.unsplash.com/photo-1493225457124-a1a2a40b75b1?auto=format&fit=crop&w=400&q=80';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        alert("Image too large. Please use an image smaller than 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = () => {
     if (!caption || profile.fatigueScore >= 100) return;
     
     const tagArray = tags.split(' ').map(t => t.startsWith('#') ? t : `#${t}`).filter(t => t.length > 1);
     
     const usedSong = gameState.releases.find(r => r.id === selectedSongId);
     const songId = usedSong?.id || null;

     let algScore = 1.0;
     const tagCount = tagArray.length;
     if (tagCount > 0 && tagCount <= 4) algScore += 0.1;
     if (tagCount >= 6) algScore -= 0.2; 
     if (caption.length > 5 && caption.length < 50) algScore += 0.1;
     
     let songPop = 0;
     if (usedSong && usedSong.type === 'Single') {
          songPop = Math.log10(Math.max(1, typeof usedSong.streams === 'number' ? usedSong.streams : usedSong.streams?.total || 1)) * 0.1;
          algScore += Math.max(0, Math.min(1.5, songPop));
     }

     algScore -= (profile.fatigueScore / 100) * 0.5;

     const newPost: TikTokPost = {
         id: `post_${Date.now()}_${Math.random()}`,
         type: postModeType,
         imageUrl: postModeType === 'photo' ? postImageUrl : undefined,
         caption,
         tags: tagArray,
         songId: songId || undefined,
         date: new Date().toISOString(),
         views: 0,
         likes: 0,
         comments: 0,
         saves: 0,
         shares: 0,
         isPinned: false,
         algorithmScore: Math.max(0.1, algScore), 
         status: 'Initial Push',
         completionRate: 0.1 + Math.random() * 0.4,
         rewatchRate: Math.random() * 0.2,
     };

     setGameState(prev => {
         if (!prev || !prev.tikTok) return prev;
         const updated = { ...prev.tikTok };
         updated.posts = [newPost, ...updated.posts];
         updated.fatigueScore = Math.min(100, updated.fatigueScore + 15);
         
         if (songId) {
             const existingSound = updated.sounds.find(s => s.songId === songId);
             if (!existingSound) {
                 updated.sounds.push({
                     songId,
                     usedInVideos: 1,
                     viewsGenerated: 0,
                     trendingStatus: 'Not Trending'
                 });
             } else {
                 existingSound.usedInVideos += 1;
             }
         }
         return { ...prev, tikTok: updated };
     });

     setPostImageUrl('');
     setPostModeType('video');
     setCreatePostMode(false);
     setCaption('');
     setTags('');
     setSelectedSongId(null);
  };

  const handleStartCampaign = (soundId: string) => {
      const cost = promotionRegions * 200000;
      if (gameState.stats.money < cost) return;

      setGameState(prev => {
          if (!prev || !prev.tikTok) return prev;
          const updated = { ...prev.tikTok };
          
          const sound = updated.sounds.find(s => s.songId === soundId);
          if (sound && !sound.hasBeenPromoted) {
              sound.hasBeenPromoted = true;
              sound.campaign = {
                  active: true,
                  regionsPromoted: promotionRegions, 
                  daysRemaining: 7,
                  totalCost: cost,
                  budgetSpent: cost
              };
          }
          return {
             ...prev, 
             tikTok: updated,
             stats: { ...prev.stats, money: prev.stats.money - cost }
          };
      });
      setCampaignSoundId(null);
  };

  const formatSeconds = (sec: number) => {
      const minutes = Math.floor(sec / 60);
      const seconds = sec % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 bg-white text-black z-50 flex overflow-hidden animate-in fade-in duration-300">
       <div className="w-full max-w-[500px] h-full mx-auto bg-white relative flex flex-col">
          
          {/* Main App */}
          {!activePost && !createPostMode && !campaignSoundId && !editProfileMode && (
            <div className="flex-1 overflow-y-auto pb-6 hide-scrollbar flex flex-col">
              
              {/* Profile Top Nav */}
              <div className="relative h-[56px] flex items-center justify-between px-4">
                  <button onClick={onClose} className="p-2 -ml-2 text-black transition-colors rounded-full focus:outline-none">
                     <ChevronLeft className="w-7 h-7" />
                  </button>
                  <div className="flex items-center gap-3">
                      <button className="p-2 text-black transition-colors rounded-full focus:outline-none">
                         <Bell className="w-6 h-6" />
                      </button>
                      <button onClick={() => {
                          setEditUsername(profile.username);
                          setEditDisplayName(profile.displayName || gameState.artist.name);
                          setEditLabel(profile.label || 'Artist');
                          setEditBio(profile.bio || `${gameState.artist.name} NEW ERA IS HERE 🌊`);
                          setEditProfileMode(true);
                      }} className="p-2 -mr-2 text-black transition-colors rounded-full focus:outline-none">
                         <Settings className="w-6 h-6" />
                      </button>
                  </div>
              </div>

              {/* Profile Header Block */}
              <div className="px-4 pb-4 mt-3">
                  {/* Title & Avatar */}
                  <div className="flex justify-between items-center mb-4">
                      <div>
                          <h1 className="text-2xl font-bold tracking-tight leading-none mb-1 flex items-center gap-1.5">
                              {profile.displayName || gameState.artist.name}
                              {profile.isVerified && <TikTokVerifiedBadge className="w-5 h-5 ml-1" />}
                          </h1>
                          <div className="flex items-center text-sm text-gray-500 font-medium">
                              @{profile.username}
                              <span className="mx-1.5">&middot;</span>
                              {profile.label || 'Artist'}
                          </div>
                      </div>
                      <div className="relative shrink-0">
                          <img src={defaultImage} alt="Profile" className="w-[84px] h-[84px] rounded-full object-cover shadow-sm border border-black/5" />
                      </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 mb-5 items-center">
                      <div className="flex flex-col text-left">
                          <span className="font-bold text-[17px] text-gray-900 leading-tight">{formatNumberSafely(profile.followers)}</span>
                          <span className="text-[13px] text-gray-500 font-medium">Followers</span>
                      </div>
                      <div className="flex flex-col text-left">
                          <span className="font-bold text-[17px] text-gray-900 leading-tight">{formatNumberSafely(profile.totalLikes)}</span>
                          <span className="text-[13px] text-gray-500 font-medium">Likes</span>
                      </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mb-4">
                       <button onClick={() => setCreatePostMode(true)} className="flex-1 bg-[#FE2C55] text-white hover:bg-[#E6284D] active:bg-[#D02445] transition-colors py-[10px] rounded-[4px] font-bold text-[15px] flex items-center justify-center gap-1.5">
                           <span className="font-bold text-[18px] leading-none -mt-[0.5px]">+</span> Upload Video
                       </button>
                       <button className="px-3 bg-white border border-[#E5E5E5] hover:bg-gray-50 active:bg-gray-100 transition-colors py-[10px] rounded-[4px] flex items-center justify-center">
                           <Send className="w-5 h-5 rotate-45 transform -translate-y-[1px] translate-x-[1px]" />
                       </button>
                       <button className="px-3 bg-white border border-[#E5E5E5] hover:bg-gray-50 active:bg-gray-100 transition-colors py-[10px] rounded-[4px] flex items-center justify-center">
                           <UserPlus className="w-5 h-5" />
                       </button>
                  </div>
                  
                  {/* Linktree / Bio Mock */}
                  <div className="text-[14px]">
                      <p className="text-gray-900 mb-1 font-medium whitespace-pre-wrap">{profile.bio || `${gameState.artist.name} NEW ERA IS HERE \uD83C\uDF0A`}</p>
                      <a href="#" className="font-bold text-gray-900 hover:underline">https://linktr.ee/{profile.username}</a>
                  </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#E5E5E5] sticky top-0 bg-white z-10 px-4">
                  <button onClick={() => setActiveTab('music')} className={`flex-1 py-3 flex justify-center text-gray-400 hover:text-gray-900 transition-colors relative ${activeTab === 'music' ? 'text-gray-900' : ''}`}>
                      <Music className="w-5 h-5" />
                      {activeTab === 'music' && <div className="absolute bottom-0 left-[15%] right-[15%] h-[2px] bg-gray-900" />}
                  </button>
                  <button onClick={() => setActiveTab('feed')} className={`flex-1 py-3 flex justify-center text-gray-400 hover:text-gray-900 transition-colors relative ${activeTab === 'feed' ? 'text-gray-900' : ''}`}>
                      <FileText className="w-5 h-5" />
                      {activeTab === 'feed' && <div className="absolute bottom-0 left-[15%] right-[15%] h-[2px] bg-gray-900" />}
                  </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 bg-white">
                 {activeTab === 'feed' && (
                     <div className="grid grid-cols-3 gap-[1px]">
                         {[...profile.posts].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)).map(post => (
                             <div key={post.id} onClick={() => setActivePost(post)} className="aspect-[3/4] bg-gray-200 relative group cursor-pointer overflow-hidden">
                                 <div className="absolute inset-0 bg-cover bg-center opacity-90 group-hover:opacity-100 transition-opacity" style={{backgroundImage: `url(${post.type === 'photo' && post.imageUrl ? post.imageUrl : defaultImage})`}} />
                                 <div className="absolute bottom-2 left-2 flex items-center gap-1.5 drop-shadow-md">
                                     {post.type === 'photo' ? <ImageIcon className="w-4 h-4 text-white stroke-[2.5]" /> : <Play className="w-4 h-4 text-white fill-transparent stroke-[2.5]" />}
                                     <span className="text-white font-bold text-[13px] tracking-tight">{formatNumberSafely(post.views)}</span>
                                 </div>
                                 {post.isPinned && (
                                     <div className="absolute top-1 left-1 bg-[#FE2C55] rounded-[4px] px-1.5 py-0.5">
                                         <span className="text-white font-bold text-[10px] uppercase tracking-wider">Pinned</span>
                                     </div>
                                 )}
                             </div>
                         ))}
                     </div>
                 )}
                 {activeTab === 'music' && (
                     <div className="p-0">
                         {[...profile.sounds].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)).map(sound => {
                             const linkedSong = gameState.releases.find(r => r.id === sound.songId);
                             if (!linkedSong) return null;
                             return (
                                 <div key={sound.songId} className="flex gap-3 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer items-center" onClick={() => setCampaignSoundId(sound.songId)}>
                                     <div className="relative shrink-0 w-[72px] h-[72px]">
                                        <img src={linkedSong.coverImage || defaultImage} className="block w-[72px] h-[72px] rounded-[4px] object-cover border border-black/5" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-[4px]">
                                            <Play className="w-8 h-8 text-white fill-white opacity-90" />
                                        </div>
                                     </div>
                                     
                                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                                         <p className="font-bold text-[16px] text-gray-900 truncate mb-[2px] flex items-center gap-1.5">
                                             {linkedSong.title}
                                             {sound.isPinned && <Pin className="w-4 h-4 fill-[#FE2C55] text-[#FE2C55] rotate-45 shrink-0" />}
                                         </p>
                                         <p className="text-gray-500 font-medium text-[13px] mb-1.5 truncate">Used in {formatNumberSafely(sound.usedInVideos)} videos</p>
                                         <p className="text-gray-500 font-medium text-[13px]">
                                            {formatSeconds(Math.floor(Math.random() * 45 + 15))}
                                         </p>
                                     </div>
                                     <div className="px-1 flex flex-col items-center justify-center gap-4 text-gray-400">
                                         <button 
                                             onClick={(e) => {
                                                 e.stopPropagation();
                                                 setGameState(prev => {
                                                     if(!prev || !prev.tikTok) return prev;
                                                     return {
                                                         ...prev,
                                                         tikTok: {
                                                             ...prev.tikTok,
                                                             sounds: prev.tikTok.sounds.map(s => s.songId === sound.songId ? { ...s, isPinned: !s.isPinned } : s)
                                                         }
                                                     };
                                                 });
                                             }}
                                             className="p-2 -mr-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
                                         >
                                             <Pin className={`w-5 h-5 ${sound.isPinned ? "fill-[#FE2C55] text-[#FE2C55]" : ""}`} />
                                         </button>
                                     </div>
                                 </div>
                             )
                         })}
                         {profile.sounds.length === 0 && (
                             <div className="text-center p-8 text-gray-400 font-medium text-[15px]">
                                No sounds have been tracked. Ensure you release singles.
                             </div>
                         )}
                     </div>
                 )}
              </div>
          </div>
          )}

          {/* Edit Profile Screen */}
          {editProfileMode && (
              <div className="absolute inset-0 z-30 bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                      <button onClick={() => setEditProfileMode(false)} className="px-2 text-[16px] text-gray-900 font-medium">Cancel</button>
                      <span className="font-bold text-[17px] text-gray-900">Edit profile</span>
                      <button onClick={() => {
                          setGameState(prev => {
                              if (!prev || !prev.tikTok) return prev;
                              return {
                                  ...prev,
                                  tikTok: {
                                      ...prev.tikTok,
                                      username: editUsername.replace(/[^a-zA-Z0-9_.]/g, ''),
                                      displayName: editDisplayName,
                                      label: editLabel,
                                      bio: editBio
                                  }
                              };
                          });
                          setEditProfileMode(false);
                      }} className="px-2 text-[16px] text-[#FE2C55] font-bold">Save</button>
                  </div>
                  
                  <div className="p-4 flex flex-col gap-6">
                      <div className="flex flex-col items-center gap-2 mb-2">
                          <img src={defaultImage} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-sm border border-black/5" />
                          <span className="text-gray-900 font-medium text-[15px]">Change photo</span>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                          <label className="text-[13px] text-gray-500 font-medium ml-1">Name</label>
                          <input 
                              type="text" 
                              value={editDisplayName} 
                              onChange={e => setEditDisplayName(e.target.value)} 
                              className="w-full bg-transparent border-b border-gray-200 outline-none p-2 text-gray-900 font-medium focus:border-gray-900 transition-colors"
                              maxLength={30}
                          />
                      </div>
                      
                      <div className="flex flex-col gap-1">
                          <label className="text-[13px] text-gray-500 font-medium ml-1">Username</label>
                          <input 
                              type="text" 
                              value={editUsername} 
                              onChange={e => setEditUsername(e.target.value)} 
                              className="w-full bg-transparent border-b border-gray-200 outline-none p-2 text-gray-900 font-medium focus:border-gray-900 transition-colors"
                              maxLength={24}
                          />
                      </div>

                      <div className="flex flex-col gap-1">
                          <label className="text-[13px] text-gray-500 font-medium ml-1">Category / Label</label>
                          <input 
                              type="text" 
                              value={editLabel} 
                              onChange={e => setEditLabel(e.target.value)} 
                              className="w-full bg-transparent border-b border-gray-200 outline-none p-2 text-gray-900 font-medium focus:border-gray-900 transition-colors"
                              maxLength={30}
                          />
                      </div>

                      <div className="flex flex-col gap-1">
                          <label className="text-[13px] text-gray-500 font-medium ml-1">Bio</label>
                          <textarea 
                              value={editBio} 
                              onChange={e => setEditBio(e.target.value)} 
                              className="w-full bg-transparent border-b border-gray-200 outline-none p-2 text-gray-900 font-medium focus:border-gray-900 transition-colors min-h-[60px] resize-none"
                              maxLength={150}
                          />
                      </div>
                  </div>
              </div>
          )}

          {/* Post Detail Screen */}
          {activePost && (
              <div className="absolute inset-0 z-20 bg-black flex flex-col">
                  {/* Fake Fullscreen Video UI */}
                  <div className="absolute inset-0 bg-cover bg-center pointer-events-none" style={{backgroundImage: `url(${activePost.type === 'photo' && activePost.imageUrl ? activePost.imageUrl : defaultImage})`, opacity: activePost.type === 'photo' ? 1.0 : 0.8}} />
                  {activePost.type !== 'photo' && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none" />}
                  {activePost.type === 'photo' && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />}
                  
                  <div className="relative flex-1 flex flex-col z-10">
                      <div className="p-4 flex gap-4">
                           <button onClick={() => setActivePost(null)} className="p-2 -ml-2 rounded-full bg-black/40 backdrop-blur text-white hover:bg-black/60">
                               <ChevronLeft className="w-6 h-6" />
                           </button>
                           <div className="flex-1 flex items-center justify-center gap-4 text-white/50 font-bold opacity-0 transition-opacity">
                               <span className="text-white">Following</span>
                               <span>For You</span>
                           </div>
                           <div className="w-10"></div>
                      </div>

                      <div className="flex-1 flex items-end pb-6">
                           <div className="flex-1 px-4 mb-2">
                                <h3 className="font-bold text-white text-[17px] mb-1.5 flex items-center gap-1.5 drop-shadow-md">
                                    {profile.displayName || gameState.artist.name}
                                    {profile.isVerified && <TikTokVerifiedBadge className="w-[18px] h-[18px]" />}
                                </h3>
                                <p className="text-[15px] text-white/95 leading-[1.3] mb-3">{activePost.caption} {activePost.tags.join(' ')}</p>
                                
                                {activePost.songId && (
                                    <div className="flex items-center gap-2 mt-3">
                                        <Music className="w-4 h-4 text-white animate-pulse" />
                                        <p className="text-[14px] font-medium text-white marquee">
                                           {gameState.releases.find(r => r.id === activePost.songId)?.title || 'Original Sound'} - {
                                            (() => {
                                                const rel = gameState.releases.find(r => r.id === activePost.songId);
                                                if (rel && (rel as any).isNPCCollab) return `${(rel as any).collaborator} & ${gameState.artist?.name || 'You'}`;
                                                if (rel && rel.type === 'Single' && (rel as any).collaborator) return `${gameState.artist?.name || 'You'} & ${(rel as any).collaborator}`;
                                                return gameState.artist?.name || 'You';
                                            })()
                                          }
                                        </p>
                                    </div>
                                )}
                           </div>

                           <div className="w-16 flex flex-col items-center justify-end pb-4 pr-2 gap-[18px]">
                                <div className="relative w-12 h-12 mb-2">
                                    <img src={defaultImage} className="w-12 h-12 rounded-full border border-white" />
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[22px] h-[22px] bg-[#FE2C55] rounded-full flex items-center justify-center text-white text-[16px] font-bold leading-none shadow-sm">
                                        +
                                    </div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <Heart className="w-8 h-8 fill-transparent stroke-white stroke-[1.5] mb-1 drop-shadow-md" />
                                    <span className="text-white font-bold text-[13px] drop-shadow-md">{formatNumberSafely(activePost.likes)}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <MessageCircle className="w-8 h-8 fill-transparent stroke-white stroke-[1.5] mb-1 drop-shadow-md" />
                                    <span className="text-white font-bold text-[13px] drop-shadow-md">{formatNumberSafely(activePost.comments)}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <Bookmark className="w-8 h-8 fill-transparent stroke-white stroke-[1.5] mb-1 drop-shadow-md" />
                                    <span className="text-white font-bold text-[13px] drop-shadow-md">{formatNumberSafely(activePost.saves)}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <Share2 className="w-8 h-8 fill-transparent stroke-white stroke-[1.5] mb-1 drop-shadow-md" />
                                    <span className="text-white font-bold text-[13px] drop-shadow-md">{formatNumberSafely(activePost.shares)}</span>
                                </div>
                                <button className="flex flex-col items-center focus:outline-none" onClick={() => {
                                    setGameState(prev => {
                                        if (!prev || !prev.tikTok) return prev;
                                        return {
                                            ...prev,
                                            tikTok: {
                                                ...prev.tikTok,
                                                posts: prev.tikTok.posts.map(p => p.id === activePost.id ? { ...p, isPinned: !p.isPinned } : p)
                                            }
                                        }
                                    });
                                    setActivePost(prev => prev ? { ...prev, isPinned: !prev.isPinned } : prev);
                                }}>
                                    <Pin className={`w-8 h-8 stroke-[1.5] mb-1 drop-shadow-md transition-colors ${activePost.isPinned ? "fill-[#FE2C55] text-[#FE2C55] stroke-[#FE2C55] rotate-45" : "fill-transparent stroke-white"}`} />
                                    <span className="text-white font-bold text-[13px] drop-shadow-md">Pin</span>
                                </button>
                                
                                <div className="w-12 h-12 rounded-full bg-[#333] animate-spin-slow border-[8px] border-[#222] mt-2 overflow-hidden flex items-center justify-center relative shadow-xl">
                                     <img src={activePost.songId ? (gameState.releases.find(r => r.id === activePost.songId)?.coverImage || defaultImage) : defaultImage} className="w-full h-full object-cover" />
                                </div>
                           </div>
                      </div>
                  </div>
              </div>
          )}

          {/* Campaign Screen */}
          {campaignSoundId && (() => {
              const activeSound = profile.sounds.find(s => s.songId === campaignSoundId);
              const isPromoted = activeSound?.hasBeenPromoted || activeSound?.campaign?.active;
              return (
               <div className="absolute inset-0 z-30 bg-white text-black flex flex-col p-6 animate-in slide-in-from-bottom duration-300 overflow-y-auto">
                    <button onClick={() => setCampaignSoundId(null)} className="mb-6 p-2 bg-gray-100 hover:bg-gray-200 self-start rounded-full transition-colors">
                         <ChevronLeft className="w-6 h-6 text-gray-900" />
                    </button>
                    <h2 className="text-3xl font-black tracking-tight mb-2 text-gray-900">Push Sound</h2>
                    <p className="text-gray-500 font-medium text-[15px] mb-6">Invest in TikTok ad algorithms to generate mass usage for this sound globally.</p>
                    
                    {isPromoted ? (
                        <div className="bg-red-50 text-red-500 font-bold p-4 rounded-lg flex-1 text-center">
                            This sound has already been promoted on TikTok. A sound can only be pushed once.
                        </div>
                    ) : (
                        <>
                            <div className="bg-gray-50 border border-gray-200 rounded-[12px] p-5 mb-8">
                                 <div className="flex justify-between items-center mb-4">
                                     <span className="text-gray-500 text-[13px] font-bold uppercase tracking-widest">Available Budget</span>
                                     <span className="text-green-600 font-black text-xl">${formatNumberSafely(gameState.stats.money)}</span>
                                 </div>
                                 <div className="flex flex-col gap-2">
                                     <label className="text-gray-700 font-bold text-sm">Select Regions to Promote ({promotionRegions})</label>
                                     <input 
                                         type="range" 
                                         min="1" 
                                         max="15" 
                                         value={promotionRegions} 
                                         onChange={(e) => setPromotionRegions(parseInt(e.target.value))}
                                         className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FE2C55]"
                                     />
                                     <div className="flex justify-between text-xs text-gray-400 font-medium pt-1">
                                         <span>1 Region</span>
                                         <span>15 Regions</span>
                                     </div>
                                 </div>
                            </div>
        
                            <div className="space-y-4 flex-1">
                                 <div className="bg-white border text-gray-600 border-gray-200 rounded-[16px] p-4 text-[13px] leading-relaxed">
                                    A 7-day TikTok campaign to artificially push this sound in {promotionRegions} regions. Afterward, we will evaluate its natural virality to see if it becomes a TikTok Trend, Hits, or Mega Hits.
                                 </div>
                                 
                                 <button onClick={() => handleStartCampaign(campaignSoundId)} disabled={gameState.stats.money < promotionRegions * 200000} className="w-full mt-4 bg-gradient-to-r from-[#FE2C55] to-[#20D5EC] text-white rounded-[16px] p-5 text-center transition-all active:scale-[0.98] relative overflow-hidden shadow-lg disabled:opacity-50 disabled:grayscale">
                                      <h3 className="font-bold text-[20px] text-white mb-2 flex items-center justify-center gap-2">Start Campaign <Zap className="w-5 h-5 fill-white" /></h3>
                                      <div className="font-black text-white text-xl bg-black/20 rounded-full inline-block px-4 py-1">${formatNumberSafely(promotionRegions * 200000)}</div>
                                 </button>
                            </div>
                        </>
                    )}
               </div>
              );
          })()}

          {/* Create Post Screen */}
          {createPostMode && (
              <div className="absolute inset-0 z-40 bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
                   <div className="flex items-center justify-between p-4 border-b border-gray-200">
                       <button onClick={() => setCreatePostMode(false)} className="text-gray-900 font-bold p-2 -ml-2">Cancel</button>
                       <h2 className="font-bold text-gray-900 text-lg">New Post</h2>
                       <button onClick={handleCreatePost} className="bg-[#FE2C55] text-white font-bold py-2 px-4 rounded-[4px] disabled:opacity-50 disabled:bg-gray-300" disabled={!caption || profile.fatigueScore >= 100}>Post</button>
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 bg-gray-50">
                       
                       {profile.fatigueScore >= 100 && (
                          <div className="bg-red-50 border border-red-200 p-4 rounded-[8px] text-[#FE2C55] text-sm font-bold shadow-sm">
                              Audience fatigue is too high. Stop posting for a few days to recover algorithm standing.
                          </div>
                       )}

                       <div className="bg-white p-4 rounded-[12px] shadow-sm border border-gray-100">
                           <div className="flex gap-4 mb-4">
                               <button onClick={() => setPostModeType('video')} className={`flex-1 py-2 font-bold rounded-[8px] text-[14px] transition-colors border ${postModeType === 'video' ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                   Video
                               </button>
                               <button onClick={() => setPostModeType('photo')} className={`flex-1 py-2 font-bold rounded-[8px] text-[14px] transition-colors border ${postModeType === 'photo' ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                   Photo
                               </button>
                           </div>
                           
                           {postModeType === 'photo' && (
                               <div className="mb-4">
                                   <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-[8px] cursor-pointer hover:bg-gray-50 transition-colors">
                                       <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                           <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                                           <p className="text-sm text-gray-500 font-medium">Click to upload photo</p>
                                       </div>
                                       <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                   </label>
                               </div>
                           )}

                           <div className="flex gap-4 items-start">
                             {postModeType === 'photo' && postImageUrl ? (
                                <img src={postImageUrl} className="w-20 h-28 object-cover rounded-[6px] shrink-0 border border-gray-200" />
                             ) : (
                                <div className="w-20 h-28 bg-gray-100 rounded-[6px] flex items-center justify-center border border-gray-200 shrink-0">
                                    {postModeType === 'photo' ? <ImageIcon className="w-8 h-8 text-gray-400" /> : <Camera className="w-8 h-8 text-gray-400" />}
                                </div>
                             )}
                             <textarea 
                                value={caption}
                                onChange={e => setCaption(e.target.value)}
                                placeholder="Describe your post..."
                                className="flex-1 bg-transparent border-none outline-none text-gray-900 h-28 resize-none text-[15px] placeholder:text-gray-400 p-1 font-medium"
                                maxLength={150}
                             />
                           </div>
                       </div>

                       <div className="bg-white p-4 rounded-[12px] shadow-sm border border-gray-100">
                           <label className="text-[12px] font-bold uppercase tracking-wider text-gray-500 block mb-3">Hashtags</label>
                           <input 
                              type="text"
                              value={tags}
                              onChange={e => setTags(e.target.value)}
                              placeholder="#fyp #newmusic"
                              className="w-full bg-gray-50 border-none outline-none focus:ring-2 focus:ring-[#20D5EC]/50 rounded-[8px] p-3 text-[15px] text-gray-900 font-medium"
                           />
                       </div>

                       <div className="flex-1 flex flex-col min-h-0 bg-white rounded-[12px] shadow-sm border border-gray-100 overflow-hidden">
                           <div className="p-4 border-b border-gray-100 shrink-0">
                             <label className="text-[12px] font-bold uppercase tracking-wider text-gray-500 block">Attach Sound</label>
                           </div>
                           <div className="flex flex-col flex-1 overflow-y-auto">
                               <div 
                                    className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-gray-100 ${selectedSongId === null ? 'bg-[#20D5EC]/10' : 'hover:bg-gray-50'}`}
                                    onClick={() => setSelectedSongId(null)}
                               >
                                    <div className="w-12 h-12 rounded-[6px] bg-black flex items-center justify-center shrink-0">
                                         <Mic className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                         <p className="font-bold text-[15px] text-gray-900 truncate">Original Sound</p>
                                         <p className="text-gray-500 font-medium text-[13px] truncate">{profile.displayName}</p>
                                    </div>
                               </div>
                               
                               {gameState.releases.filter(r => r.type === 'Single').slice(0,20).map(song => (
                                    <div 
                                        key={song.id}
                                        className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-gray-100 ${selectedSongId === song.id ? 'bg-[#20D5EC]/10' : 'hover:bg-gray-50'}`}
                                        onClick={() => setSelectedSongId(song.id)}
                                    >
                                        <img src={song.coverImage || defaultImage} className="w-12 h-12 rounded-[6px] object-cover shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-[15px] text-gray-900 truncate">{song.title}</p>
                                            <p className="text-gray-500 font-medium text-[13px] truncate">{
                                              (song as any).isNPCCollab 
                                                ? `${(song as any).collaborator} & ${gameState.artist.name}`
                                                : (song.type === 'Single' && (song as any).collaborator ? `${gameState.artist.name} & ${(song as any).collaborator}` : gameState.artist.name)
                                            }</p>
                                        </div>
                                    </div>
                               ))}
                           </div>
                       </div>
                   </div>
              </div>
          )}
       </div>
    </div>
  );
}

