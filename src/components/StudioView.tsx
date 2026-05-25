import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Music, Check, DollarSign, Calendar } from 'lucide-react';
import { GameState, Genre, Song, Album, ReleaseStatus, DailyReportData } from '../types';
import { compressImage } from '../imageUtils';
import { NPC_ARTISTS } from '../constants';

interface StudioViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
  currentDate: Date; // standard JS date based on game time
}

export function StudioView({ gameState, setGameState, currentDate }: StudioViewProps) {
  const [activeTab, setActiveTab] = useState<'Song' | 'Album'>('Song');

  const activeTour = gameState.tours?.find(t => t.id === gameState.activeTourId);
  if (activeTour?.status === 'Ongoing') {
     return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <h2 className="text-3xl font-black italic uppercase text-white mb-2">On Tour</h2>
            <p className="text-white/60 max-w-md">You are currently hitting the road on <strong>{activeTour.name}</strong>. You cannot record new music until the tour is completed!</p>
        </div>
     )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto">
      <div className="flex border-b border-white/10 p-4 shrink-0">
        <button
          onClick={() => setActiveTab('Song')}
          className={`px-6 py-2 rounded-lg text-sm font-bold tracking-widest uppercase transition-all ${activeTab === 'Song' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-white/40 hover:text-white'}`}
        >
          Create Song
        </button>
        <button
          onClick={() => setActiveTab('Album')}
          className={`px-6 py-2 rounded-lg text-sm font-bold tracking-widest uppercase transition-all ml-4 ${activeTab === 'Album' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-white/40 hover:text-white'}`}
        >
          Create Album
        </button>
      </div>

      <div className="p-6 md:p-8 flex-1">
        {activeTab === 'Song' && <CreateSongForm gameState={gameState} setGameState={setGameState} currentDate={currentDate} />}
        {activeTab === 'Album' && <CreateAlbumForm gameState={gameState} setGameState={setGameState} currentDate={currentDate} />}
      </div>
    </div>
  );
}

function CreateSongForm({ gameState, setGameState, currentDate }: StudioViewProps) {
  const [cover, setCover] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCollabs, setSelectedCollabs] = useState<string[]>([]);
  const [showCollabDropdown, setShowCollabDropdown] = useState(false);

  const [genre, setGenre] = useState<Genre>('Pop');
  const [scheduleDays, setScheduleDays] = useState<number>(7);
  
  // Costs: 0=Self, 1=Low, 2=Medium, 3=High
  const [songwriterLvl, setSongwriterLvl] = useState(0);
  const [producerLvl, setProducerLvl] = useState(0);
  const [composerLvl, setComposerLvl] = useState(0);

  const rankedNPCs = [...NPC_ARTISTS].sort((a, b) => a.name.localeCompare(b.name));

  const calculateCollabCost = (npc: any) => {
     // Taylor Swift is the benchmark at 450000 base points = $5,000,000
     return Math.ceil((npc.basePoints / 450000) * 5000000);
  };

  const toggleCollab = (name: string) => {
    if (selectedCollabs.includes(name)) {
      setSelectedCollabs(prev => prev.filter(c => c !== name));
    } else if (selectedCollabs.length < 3) {
      setSelectedCollabs(prev => [...prev, name]);
    }
  };

  const calculateTotalCost = () => {
    const swCost = songwriterLvl === 0 ? 0 : (songwriterLvl * 500);
    const pCost = producerLvl === 0 ? 0 : (producerLvl * 1000);
    const cCost = composerLvl === 0 ? 0 : (composerLvl * 600);
    const totalCollabCost = selectedCollabs.reduce((sum, name) => {
      const npc = NPC_ARTISTS.find(n => n.name === name);
      return sum + (npc ? calculateCollabCost(npc) : 0);
    }, 0);
    return swCost + pCost + cCost + totalCollabCost;
  };

  const getQualityValue = (lvl: number, skillType: 'songwriting' | 'production' | 'vocals') => {
    if (lvl > 0) return lvl;
    // Map skill 1-100 to tier 1-4 for quality
    const skillVal = gameState.skills[skillType];
    return Math.max(1, Math.min(4, Math.ceil(skillVal / 25)));
  };

  const calculateQuality = () => {
    const swQ = getQualityValue(songwriterLvl, 'songwriting');
    const pQ = getQualityValue(producerLvl, 'production');
    const cQ = getQualityValue(composerLvl, 'vocals'); // vocals for composer here
    return (swQ + pQ + cQ) / 3;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 400, 400, 0.7);
        setCover(compressed);
      } catch (err) {
        console.error("Compression error", err);
      }
    }
  };

  const handleCreate = (status: ReleaseStatus) => {
    if (!title.trim()) return alert("Enter a title");
    
    const cost = calculateTotalCost();
    if (gameState.stats.money < cost) {
      return alert("Not enough money!");
    }

    const releaseDateObj = new Date(currentDate);
    if (status === 'Scheduled') {
       releaseDateObj.setDate(releaseDateObj.getDate() + scheduleDays);
    }

    let finalTitle = title;
    if (selectedCollabs.length > 0 && !title.toLowerCase().includes('feat')) {
        finalTitle = `${title} (feat. ${selectedCollabs.join(' & ')})`;
    }

    const newSong: Song = {
      id: 'song_' + Date.now(),
      title: finalTitle,
      coverImage: cover,
      type: 'Single',
      status,
      releaseDate: status === 'Vaulted' ? null : releaseDateObj.toISOString(),
      streams: { spotify: 0, appleMusic: 0, amazonMusic: 0, youtubeMusic: 0, total: 0 },
      sales: { physical: 0, digital: 0, total: 0 },
      radioPlays: 0,
      genre,
      collaborator: selectedCollabs.join(', '),
      featuredArtistCost: selectedCollabs.reduce((sum, name) => {
        const npc = NPC_ARTISTS.find(n => n.name === name);
        return sum + (npc ? calculateCollabCost(npc) : 0);
      }, 0),
      qualityModifier: calculateQuality()
    };

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        stats: {
          ...prev.stats,
          money: prev.stats.money - cost
        },
        releases: [...prev.releases, newSong]
      };
    });

    alert(status === 'Published' ? "Song Released!" : (status === 'Scheduled' ? "Song Scheduled!" : "Song Vaulted!"));
    setTitle('');
    setSelectedCollabs([]);
    setCover('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex gap-6 items-start">
        <label className="w-32 h-32 shrink-0 rounded-2xl overflow-hidden border-2 border-dashed border-white/20 bg-black/40 flex items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-white/10 transition-colors relative group">
          {cover ? (
            <img src={cover || undefined} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-2 text-white/40 group-hover:text-purple-400 transition-colors">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Cover</span>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Song Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-purple-500 focus:bg-white/5 transition-all font-mono" placeholder="Hit Song Title" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Features (Max 3)</label>
            <div className="relative">
              <button 
                onClick={() => setShowCollabDropdown(!showCollabDropdown)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-left text-white focus:outline-none focus:border-purple-500 transition-all font-mono flex justify-between items-center"
              >
                <span className="truncate">
                  {selectedCollabs.length === 0 
                    ? 'No Features' 
                    : selectedCollabs.join(', ')}
                </span>
                <span className="text-white/40">▼</span>
              </button>
              
              {showCollabDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-white/10 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                  {rankedNPCs.map(npc => {
                    const isSelected = selectedCollabs.includes(npc.name);
                    const isDisabled = !isSelected && selectedCollabs.length >= 3;
                    return (
                      <label 
                        key={npc.name} 
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'}`}
                      >
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => toggleCollab(npc.name)}
                          className="w-4 h-4 rounded border-white/20 bg-black/40 checked:bg-purple-500 focus:ring-0 focus:ring-offset-0"
                        />
                        <span className="font-mono text-sm text-white">
                          {npc.name} <span className="text-white/40">(${calculateCollabCost(npc).toLocaleString()})</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 mt-4 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Genre</label>
            <select value={genre} onChange={e => setGenre(e.target.value as Genre)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all appearance-none font-mono">
              <option className="bg-zinc-900" value="Pop">Pop</option>
              <option className="bg-zinc-900" value="Kpop">Kpop</option>
              <option className="bg-zinc-900" value="Rap">Rap</option>
              <option className="bg-zinc-900" value="Country">Country</option>
            </select>
          </div>
      </div>
      
      <div className="space-y-4 py-4 border-t border-white/10 mt-6">
        <h3 className="text-sm font-bold tracking-widest uppercase text-purple-400">Production Team</h3>
        
        <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
           <span className="font-mono text-sm">Songwriter <span className="text-white/40 text-xs">- Affects lyrical score</span></span>
           <select value={songwriterLvl} onChange={e => setSongwriterLvl(Number(e.target.value))} className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono">
             <option value={0}>Self ($0)</option>
             <option value={1}>Amateur ($500)</option>
             <option value={2}>Pro ($1,000)</option>
             <option value={3}>Hit-maker ($2,500)</option>
           </select>
        </div>
        <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
           <span className="font-mono text-sm">Producer <span className="text-white/40 text-xs">- Affects stream reach</span></span>
           <select value={producerLvl} onChange={e => setProducerLvl(Number(e.target.value))} className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono">
             <option value={0}>Self ($0)</option>
             <option value={1}>Bedroom Prod ($1,000)</option>
             <option value={2}>Studio Staff ($2,500)</option>
             <option value={3}>Platinum Prod ($10,000)</option>
           </select>
        </div>
        <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
           <span className="font-mono text-sm">Composer <span className="text-white/40 text-xs">- Affects musicality</span></span>
           <select value={composerLvl} onChange={e => setComposerLvl(Number(e.target.value))} className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono">
             <option value={0}>Self ($0)</option>
             <option value={1}>Amateur ($600)</option>
             <option value={2}>Advanced ($1,500)</option>
             <option value={3}>Orchestral ($5,000)</option>
           </select>
        </div>
      </div>

      <div className="flex justify-between items-center bg-black/40 border border-white/10 p-4 rounded-xl mt-4">
        <span className="text-sm font-bold tracking-widest uppercase text-white/60">Total Cost</span>
        <span className={`text-2xl font-mono ${gameState.stats.money >= calculateTotalCost() ? 'text-green-400' : 'text-red-400'}`}>${calculateTotalCost().toLocaleString()}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
         <button onClick={() => handleCreate('Vaulted')} className="bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors">
           Save to Vault
         </button>
         <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-purple-500 transition-colors">
            <input 
              type="number" 
              min="1" 
              max="30" 
              value={scheduleDays}
              onChange={(e) => setScheduleDays(Math.max(1, Math.min(30, Number(e.target.value))))}
              className="w-16 bg-transparent text-center text-white outline-none font-bold"
            />
            <button onClick={() => handleCreate('Scheduled')} className="flex-1 bg-transparent hover:bg-white/5 p-4 font-bold uppercase tracking-widest text-xs transition-colors border-l border-white/10 flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" /> Schedule (Days)
            </button>
         </div>
         <button onClick={() => handleCreate('Published')} className="bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
           <Check className="w-4 h-4" /> Release Now
         </button>
      </div>

    </div>
  )
}

function CreateAlbumForm({ gameState, setGameState, currentDate }: StudioViewProps) {
  const [cover, setCover] = useState('');
  const [title, setTitle] = useState('');
  const [albumType, setAlbumType] = useState<'Single Pack' | 'EP' | 'Album'>('Album');
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [scheduleDays, setScheduleDays] = useState<number>(30);

  // Get eligible tracks (we only use Singles that are already Vaulted or Published, but usually Vaulted are used for albums before release, or maybe they can bundle existing published ones. Prompt says 'tracklist vault/released').
  const eligibleTracks = gameState.releases.filter(r => r.type === 'Single' && (r.status === 'Vaulted' || r.status === 'Published'));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 400, 400, 0.7);
        setCover(compressed);
      } catch (err) {
        console.error("Compression error", err);
      }
    }
  };

  const toggleTrack = (id: string) => {
    if (selectedTracks.includes(id)) {
      setSelectedTracks(selectedTracks.filter(t => t !== id));
    } else {
      setSelectedTracks([...selectedTracks, id]);
    }
  };

  const handleCreate = (status: ReleaseStatus) => {
    if (!title.trim()) return alert("Enter title");

    let minTracks = 1;
    let maxTracks = 100;
    if (albumType === 'Single Pack') { minTracks = 1; maxTracks = 3; }
    if (albumType === 'EP') { minTracks = 4; maxTracks = 7; }
    if (albumType === 'Album') { minTracks = 8; }

    if (selectedTracks.length < minTracks) return alert(`Select at least ${minTracks} track(s) for a ${albumType}`);
    if (selectedTracks.length > maxTracks) return alert(`Maximum ${maxTracks} tracks for a ${albumType}`);

    const releaseDateObj = new Date(currentDate);
    if (status === 'Scheduled') {
       releaseDateObj.setDate(releaseDateObj.getDate() + scheduleDays);
    }

    const newAlbum: Album = {
      id: 'album_' + Date.now(),
      title,
      coverImage: cover,
      type: albumType,
      status,
      releaseDate: status === 'Vaulted' ? null : releaseDateObj.toISOString(),
      streams: { spotify: 0, appleMusic: 0, amazonMusic: 0, youtubeMusic: 0, total: 0 },
      sales: { physical: 0, digital: 0, total: 0 },
      radioPlays: 0,
      trackIds: selectedTracks
    };

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        releases: [...prev.releases, newAlbum]
      }
    });

    alert(status === 'Published' ? `${albumType} Released!` : (status === 'Scheduled' ? `${albumType} Scheduled!` : `${albumType} Vaulted!`));
    setTitle('');
    setCover('');
    setSelectedTracks([]);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
       <div className="flex gap-6 items-start mb-6">
        <label className="w-32 h-32 shrink-0 rounded-2xl overflow-hidden border-2 border-dashed border-white/20 bg-black/40 flex items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-white/10 transition-colors relative group">
          {cover ? (
            <img src={cover || undefined} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-2 text-white/40 group-hover:text-purple-400 transition-colors">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Album Art</span>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
        <div className="flex-1 space-y-4 mt-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-purple-500 focus:bg-white/5 transition-all font-mono" placeholder="Release Name" />
          </div>
          <div>
             <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Type</label>
             <div className="flex gap-2">
                <button onClick={() => setAlbumType('Single Pack')} className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-colors border ${albumType === 'Single Pack' ? 'bg-purple-600/20 text-purple-400 border-purple-500/30' : 'bg-transparent text-white/40 border-white/10 hover:border-white/30'}`}>Single Pack (1-3)</button>
                <button onClick={() => setAlbumType('EP')} className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-colors border ${albumType === 'EP' ? 'bg-purple-600/20 text-purple-400 border-purple-500/30' : 'bg-transparent text-white/40 border-white/10 hover:border-white/30'}`}>EP (4-7)</button>
                <button onClick={() => setAlbumType('Album')} className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-colors border ${albumType === 'Album' ? 'bg-purple-600/20 text-purple-400 border-purple-500/30' : 'bg-transparent text-white/40 border-white/10 hover:border-white/30'}`}>Album (8+)</button>
             </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold tracking-widest uppercase text-purple-400">Select Tracklist</h3>
        {eligibleTracks.length === 0 ? (
          <div className="p-8 text-center border border-white/10 rounded-xl bg-white/5 text-white/40 text-sm font-mono">
            No eligible singles available. Create a Song first!
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
            {eligibleTracks.map(track => (
              <label key={track.id} className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                <input type="checkbox" className="w-4 h-4 bg-black border border-white/20 rounded accent-purple-500" checked={selectedTracks.includes(track.id)} onChange={() => toggleTrack(track.id)} />
                {track.coverImage ? <img src={track.coverImage || undefined} alt="cover" className="w-10 h-10 rounded-md object-cover" /> : <div className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center"><Music className="w-4 h-4 text-white/40" /></div>}
                <div className="flex flex-col">
                   <span className="font-bold text-sm tracking-wide">{track.title}</span>
                   <span className="text-xs text-white/40 uppercase tracking-widest">{track.status}</span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
         <button onClick={() => handleCreate('Vaulted')} className="bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors">
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
            <button onClick={() => handleCreate('Scheduled')} className="flex-1 bg-transparent hover:bg-white/5 p-4 font-bold uppercase tracking-widest text-xs transition-colors border-l border-white/10 flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" /> Schedule (Days)
            </button>
         </div>
         <button onClick={() => handleCreate('Published')} className="bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
           <Check className="w-4 h-4" /> Release Now
         </button>
      </div>
    </div>
  )
}
