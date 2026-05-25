import React, { useState } from 'react';
import { GameState, Release, Album } from '../types';
import { Music, Disc, BarChart3, Calendar } from 'lucide-react';
import { AlbumCardView } from './AlbumCardView';
import { ReleaseStatsPopup } from './ReleaseStatsPopup';
import { AlbumSalesChart } from './AlbumSalesChart';

interface DiscographyViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
  currentDate: Date;
}

export function DiscographyView({ gameState, setGameState, currentDate }: DiscographyViewProps) {
  const releases = gameState.releases || [];
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [deluxeFormAlbum, setDeluxeFormAlbum] = useState<Album | null>(null);
  const [statsPopupRelease, setStatsPopupRelease] = useState<Release | null>(null);
  const [activeTab, setActiveTab] = useState<'Published' | 'Unreleased'>('Published');
  const [showAlbumSalesChart, setShowAlbumSalesChart] = useState(false);

  const isProject = (type: string) => ['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(type);
  const projects = releases.filter(r => isProject(r.type));
  const allProjectTrackIds = new Set(projects.flatMap(p => (p as Album).trackIds || []));
  
  const albums = releases.filter(r => ['Album', 'Deluxe Album'].includes(r.type));
  const epsAndSinglePacks = releases.filter(r => ['EP', 'Single Pack'].includes(r.type));

  const standaloneSingles = releases.filter(r => r.type === 'Single' && !(r as Song).isBSide);
  const albumTracks = releases.filter(r => r.type === 'Single' && allProjectTrackIds.has(r.id));

  const sectionsByStatus = {
    Published: {
       Albums: albums.filter(r => r.status === 'Published'),
      'Singles & EPs': [...epsAndSinglePacks, ...standaloneSingles].filter(r => r.status === 'Published'),
      'Album Tracks': albumTracks.filter(r => r.status === 'Published'),
    },
    Unreleased: {
      'Scheduled': releases.filter(r => r.status === 'Scheduled'),
      'The Vault': releases.filter(r => r.status === 'Vaulted'),
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 md:p-8 space-y-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase">Discography</h2>
        
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
          <button 
            onClick={() => setShowAlbumSalesChart(true)}
            className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all bg-blue-500/20 text-blue-300 hover:text-white mr-2 flex items-center gap-2"
          >
            <BarChart3 className="w-3 h-3" />
            Albums Sales Chart
          </button>
          <button 
            onClick={() => setActiveTab('Published')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'Published' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            Published
          </button>
          <button 
            onClick={() => setActiveTab('Unreleased')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'Unreleased' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            Unreleased
          </button>
        </div>
      </div>
      
      {releases.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-white/40 py-20">
           <Disc className="w-16 h-16 mb-4 opacity-20" />
           <p className="font-mono text-sm uppercase tracking-widest">No releases yet. Head to the Studio.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {activeTab === 'Published' ? (
            <>
              <ReleaseSection 
                title="Major Albums" 
                items={sectionsByStatus.Published.Albums} 
                onSelectAlbum={setSelectedAlbum} 
                onShowStats={setStatsPopupRelease} 
              />
              <ReleaseSection 
                title="Singles & EPs" 
                items={sectionsByStatus.Published['Singles & EPs']} 
                onSelectAlbum={setSelectedAlbum} 
                onShowStats={setStatsPopupRelease} 
              />
              <details className="group">
                <summary className="text-xs font-bold tracking-widest uppercase text-white/30 mb-4 cursor-pointer hover:text-white/60 transition-colors list-none flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-white/20 flex items-center justify-center group-open:rotate-180 transition-transform">▼</div>
                  View Album Tracks ({sectionsByStatus.Published['Album Tracks'].length})
                </summary>
                <div className="mt-4">
                  <ReleaseSection 
                    title="" 
                    items={sectionsByStatus.Published['Album Tracks']} 
                    onSelectAlbum={setSelectedAlbum} 
                    onShowStats={setStatsPopupRelease} 
                    isSmall={true}
                  />
                </div>
              </details>
            </>
          ) : (
            <>
              <ReleaseSection 
                title="Scheduled for Release" 
                items={sectionsByStatus.Unreleased.Scheduled} 
                onSelectAlbum={setSelectedAlbum} 
                onShowStats={setStatsPopupRelease} 
              />
              <ReleaseSection 
                title="The Vault" 
                items={sectionsByStatus.Unreleased['The Vault']} 
                onSelectAlbum={setSelectedAlbum} 
                onShowStats={setStatsPopupRelease} 
              />
            </>
          )}
        </div>
      )}

      {selectedAlbum && (
        <AlbumCardView album={selectedAlbum} gameState={gameState} onClose={() => setSelectedAlbum(null)} onReleaseDeluxe={() => { setDeluxeFormAlbum(selectedAlbum); setSelectedAlbum(null); }} />
      )}
      
      {deluxeFormAlbum && (
        <ReleaseDeluxeForm album={deluxeFormAlbum} gameState={gameState} setGameState={setGameState} currentDate={currentDate} onClose={() => setDeluxeFormAlbum(null)} />
      )}

      {statsPopupRelease && (
        <ReleaseStatsPopup release={statsPopupRelease} gameState={gameState} onClose={() => setStatsPopupRelease(null)} />
      )}

      {showAlbumSalesChart && (
        <AlbumSalesChart gameState={gameState} onClose={() => setShowAlbumSalesChart(false)} />
      )}
    </div>
  );
}

function ReleaseSection({ title, items, onSelectAlbum, onShowStats, isSmall }: { title: string, items: Release[], onSelectAlbum: (a: Album) => void, onShowStats: (r: Release) => void, isSmall?: boolean }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
       {title && <h3 className="text-xs font-bold tracking-widest uppercase text-purple-400/80 mb-4 flex items-center gap-2">
         <div className="h-[1px] flex-1 bg-purple-400/20"></div>
         {title}
         <div className="h-[1px] w-8 bg-purple-400/20"></div>
       </h3>}
       <div className={`grid grid-cols-1 ${isSmall ? 'md:grid-cols-3 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
         {items.map(item => (
           <div 
             key={item.id} 
             onClick={() => onShowStats(item)}
             className={`bg-[#1a1a1a] border border-white/5 p-4 rounded-2xl flex gap-4 items-center group hover:bg-white/5 hover:border-purple-500/30 transition-all cursor-pointer relative overflow-hidden ${isSmall ? 'opacity-60 scale-95 hover:opacity-100 hover:scale-100' : ''}`}
           >
              {/* Subtle accent line */}
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/0 group-hover:bg-purple-500 transition-colors"></div>

              <div className={`${isSmall ? 'w-10 h-10' : 'w-16 h-16'} shrink-0 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center shadow-lg relative`}>
                 {item.coverImage ? (
                   <img src={item.coverImage || undefined} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                 ) : (
                   <Music className="w-6 h-6 text-white/20" />
                 )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                 <span className={`font-bold ${isSmall ? 'text-xs' : 'text-sm'} tracking-wide truncate`}>{item.title}</span>
                 <span className="text-[9px] text-white/40 uppercase tracking-widest flex items-center gap-2 mt-1">
                   {['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(item.type) ? <Disc className="w-3 h-3" /> : <Music className="w-3 h-3" />}
                   {item.type}
                 </span>
                 
                 {!isSmall && (
                   <div className="flex flex-col gap-0.5 mt-2">
                     <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-white/40">Streams</span>
                        <span className="text-blue-400">{(item.streams as any).total !== undefined ? (item.streams as any).total.toLocaleString() : typeof item.streams === 'number' ? (item.streams as number).toLocaleString() : '0'}</span>
                     </div>
                     <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-white/40">Sales</span>
                        <span className="text-purple-400">{item.sales?.total?.toLocaleString() || '0'}</span>
                     </div>
                   </div>
                 )}

                 {item.status === 'Scheduled' && item.releaseDate && (
                    <span className="text-[10px] text-yellow-400 font-mono mt-2 flex items-center gap-1 leading-none uppercase">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(item.releaseDate).toLocaleDateString()}
                    </span>
                 )}
                 {['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(item.type) && item.status === 'Published' && (
                    <button 
                       onClick={(e) => { e.stopPropagation(); onSelectAlbum(item as Album); }}
                       className="mt-3 bg-purple-600/10 hover:bg-purple-600/30 text-purple-200 border border-purple-500/20 px-3 py-1.5 rounded-lg flex items-center justify-center gap-2 transition-colors text-[10px] font-bold uppercase tracking-widest w-full"
                    >
                       <BarChart3 className="w-3 h-3" />
                       Album Card
                    </button>
                 )}
              </div>
           </div>
         ))}
        </div>
     </div>
  );
}

import { Image as ImageIcon, X as CloseIcon, Check } from 'lucide-react';
import { compressImage } from '../imageUtils';

interface ReleaseDeluxeFormProps {
  album: Album;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
  currentDate: Date;
  onClose: () => void;
}

function ReleaseDeluxeForm({ album, gameState, setGameState, currentDate, onClose }: ReleaseDeluxeFormProps) {
  const [cover, setCover] = useState(album.coverImage || '');
  const [title, setTitle] = useState(`${album.title} (Deluxe)`);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [scheduleDays, setScheduleDays] = useState<number>(30);

  const eligibleTracks = gameState.releases.filter(r => r.type === 'Single' && (r.status === 'Vaulted' || r.status === 'Published') && !album.trackIds.includes(r.id));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 400, 400, 0.7);
        setCover(compressed);
      } catch (err) { }
    }
  };

  const toggleTrack = (id: string) => {
    if (selectedTracks.includes(id)) {
      setSelectedTracks(selectedTracks.filter(t => t !== id));
    } else {
      setSelectedTracks([...selectedTracks, id]);
    }
  };

  const handleCreate = (status: 'Published' | 'Scheduled' | 'Vaulted') => {
    if (!title.trim()) return alert("Enter title");
    if (selectedTracks.length === 0) return alert("Select at least 1 new track for Deluxe");

    const releaseDateObj = new Date(currentDate);
    if (status === 'Scheduled') {
       releaseDateObj.setDate(releaseDateObj.getDate() + scheduleDays);
    }

    const newAlbum: Album = {
      id: 'album_' + Date.now(),
      title,
      coverImage: cover,
      type: 'Deluxe Album',
      originalAlbumId: album.id,
      status,
      releaseDate: status === 'Vaulted' ? null : releaseDateObj.toISOString(),
      streams: { spotify: 0, appleMusic: 0, amazonMusic: 0, youtubeMusic: 0, total: 0 },
      sales: { physical: 0, digital: 0, total: 0 },
      radioPlays: 0,
      trackIds: [...album.trackIds, ...selectedTracks]
    };

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        releases: [...prev.releases, newAlbum]
      };
    });

    alert(`Deluxe Album ${status}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121212] rounded-3xl shadow-2xl border border-white/10 p-6 md:p-8 max-w-2xl w-full max-h-[90vh] flex flex-col relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
          <CloseIcon className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-6">Release Deluxe Version</h2>
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 hide-scrollbar">
           <div className="flex gap-6 items-start">
            <label className="w-32 h-32 shrink-0 rounded-2xl overflow-hidden border-2 border-dashed border-white/20 bg-black/40 flex items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-white/10 transition-colors relative group">
              {cover ? (
                <img src={cover} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-2 text-white/40 group-hover:text-purple-400 transition-colors">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <span className="text-[10px] uppercase tracking-widest font-bold">New Cover</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            <div className="flex-1 space-y-4 pt-2">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Deluxe Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-purple-500 font-mono" placeholder="Album Name" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-widest uppercase text-purple-400">Select Bonus Tracks</h3>
            {eligibleTracks.length === 0 ? (
              <div className="p-8 text-center border border-white/10 rounded-xl bg-white/5 text-white/40 text-sm font-mono">
                No eligible singles available. Create a Song first!
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-2 hide-scrollbar border border-white/5 p-2 rounded-xl bg-white/[0.02]">
                {eligibleTracks.map(track => (
                  <label key={track.id} className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                    <input type="checkbox" className="w-4 h-4 bg-black border border-white/20 rounded accent-purple-500" checked={selectedTracks.includes(track.id)} onChange={() => toggleTrack(track.id)} />
                    {track.coverImage ? <img src={track.coverImage} alt="cover" className="w-10 h-10 rounded-md object-cover" /> : <div className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center"><Music className="w-4 h-4 text-white/40" /></div>}
                    <div className="flex flex-col">
                       <span className="font-bold text-sm tracking-wide text-white">{track.title}</span>
                       <span className="text-xs text-white/40 uppercase tracking-widest">{track.status}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 mt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
           <button onClick={() => handleCreate('Vaulted')} className="bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-xl font-bold uppercase tracking-widest text-xs text-white transition-colors">
             Save to Vault
           </button>
           <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-purple-500 transition-colors">
              <input 
                type="number" 
                min="1" 
                max="120" 
                value={scheduleDays}
                onChange={(e) => setScheduleDays(Math.max(1, Math.min(120, Number(e.target.value))))}
                className="w-16 bg-transparent text-center text-white outline-none font-bold"
              />
              <button onClick={() => handleCreate('Scheduled')} className="flex-1 bg-transparent hover:bg-white/5 p-4 font-bold uppercase tracking-widest text-xs text-white transition-colors border-l border-white/10 flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" /> Schedule (Days)
              </button>
           </div>
           <button onClick={() => handleCreate('Published')} className="bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
             <Check className="w-4 h-4" /> Release Now
           </button>
        </div>
      </div>
    </div>
  );
}
