import React, { useState, useMemo } from 'react';
import { GameState, RecordLabelContract, Release } from '../types';
import { RECORD_LABELS } from '../recordLabels';
import { X, CheckCircle, TrendingDown, Star, ChevronRight, Music, Target, UserCheck, TrendingUp, Info } from 'lucide-react';
import { ARTIST_IMAGES } from '../artistImages';
import { NPC_ARTISTS } from '../constants';

interface LabelsViewProps {
  gameState: GameState | null;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
  onClose: () => void;
}

export function LabelsView({ gameState, setGameState, onClose }: LabelsViewProps) {
  const [pitchLabelId, setPitchLabelId] = useState<string | null>(null);
  const [selectedSongToPitch, setSelectedSongToPitch] = useState<string>('');
  const [tab, setTab] = useState<'home' | 'financials' | 'contract' | 'merch'>('home');

  if (!gameState) return null;

  const currentLabelId = gameState.artist?.labelContract?.labelId;
  const currentLabel = RECORD_LABELS.find(l => l.id === currentLabelId);
  const contract = gameState.artist?.labelContract;

  const handleSendPitch = () => {
     if (!pitchLabelId) return;
     const label = RECORD_LABELS.find(l => l.id === pitchLabelId);
     if (!label) return;

     // Check requirements
     const level = gameState.artist?.level || 1;
     const streams = gameState.stats.streams;
     const followers = gameState.stats.socialFollowers || 0;
     
     if (level < label.requirements.targetLevel || streams < label.requirements.minStreams || followers < label.requirements.minFollowers) {
        window.alert(`Pitch Rejected! ${label.name} stated you do not meet their requirements yet. Check their requirements and try again later.`);
        setPitchLabelId(null);
        return;
     }

     if (!selectedSongToPitch) {
        window.alert("You must select a track to pitch!");
        return;
     }

     const dealType = Math.random() > 0.5 ? 'album' : 'year';
     const duration = dealType === 'album' ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 4) + 2;
     const advance = Math.floor(Math.random() * (label.contractBasics.maxAdvance - label.contractBasics.baseAdvance)) + label.contractBasics.baseAdvance;

     const newEmail = {
        id: Math.random().toString(36).substring(7),
        dateStr: new Date(new Date(gameState.time.startDate).getTime() + gameState.time.daysPassed * 86400000).toISOString(),
        sender: `${label.name} A&R`,
        subject: `OFFER: Recording Contract`,
        body: `We loved your pitch with that track! \n\nWe want to sign you. We've attached a contract offer for you to review.\n\nTake your time, let us know.\n\nBest,\n${label.name}`,
        isRead: false,
        contractOffer: {
            labelId: label.id,
            status: 'pending' as const,
            type: dealType,
            duration: duration,
            requiredAlbums: dealType === 'album' ? duration : 0,
            requiredEPs: 0,
            requiredSingles: dealType === 'year' ? duration * 2 : 0, 
            advanceMoney: advance,
            royaltyCut: label.royaltyCut
        }
     };

     setGameState(prev => {
         if (!prev) return prev;
         return {
             ...prev,
             emails: [newEmail, ...(prev.emails || [])]
         };
     });
     
     window.alert("Pitch sent! They were impressed and sent a counter-offer to your inbox. Check your emails.");
     setPitchLabelId(null);
  };

  const topArtists = useMemo(() => {
      if (!currentLabel) return [];
      const labelName = currentLabel.name;
      const labelNpcs = NPC_ARTISTS.filter(a => RECORD_LABELS.find(l => l.name === labelName)?.artists.includes(a.name));
      
      const augmentedNpcs = labelNpcs.map(npc => {
          // Deterministic pseudo-random based on npc name length to avoid changing on render
          const pseudoRandom = ((npc.name.length * 7.123) % 1) * 0.5; // 0 to 0.5
          const dailyStreams = Math.floor(npc.basePoints * 15 * (1 + pseudoRandom));
          const dailySales = Math.floor(dailyStreams * 0.005);
          const dailyRevenue = Math.floor((dailyStreams * 0.001) + (dailySales * 10));
          return { name: npc.name, isPlayer: false, dailyStreams, dailySales, dailyRevenue, basePoints: npc.basePoints };
      });

      const playerReleases = (gameState.releases || []).filter(r => !(r as any).isNPCRelease);
      let playerDailyStreamsApprox = 0;
      let playerDailySalesApprox = 0;
      let playerDailyRevApprox = 0;
      
      playerReleases.forEach(r => {
          if (r.status === 'Published') {
              const qualityMod = 0.5;
              const rTime = new Date(r.releaseDate).getTime();
              const sTime = new Date(gameState.time.startDate).getTime();
              let daysSince = Math.max(1, gameState.time.daysPassed);
              if (!isNaN(rTime) && !isNaN(sTime)) {
                  const diff = (rTime - sTime) / 86400000;
                  daysSince = Math.max(1, gameState.time.daysPassed - diff);
              }
              const decay = Math.pow(0.95, daysSince / 30);
              const curStreams = Math.floor(10000 * qualityMod * (isNaN(decay) ? 1 : decay) * (gameState.artist?.level || 1));
              const curSales = Math.floor(curStreams * 0.01);
              playerDailyStreamsApprox += curStreams;
              playerDailySalesApprox += curSales;
          }
      });
      playerDailyRevApprox = Math.floor((playerDailyStreamsApprox * 0.003) + (playerDailySalesApprox * 10));

      const playerObj = {
          name: gameState.artist?.name || 'You',
          isPlayer: true,
          dailyStreams: playerDailyStreamsApprox,
          dailySales: playerDailySalesApprox,
          dailyRevenue: playerDailyRevApprox,
          basePoints: 0
      };

      const combined = [...augmentedNpcs, playerObj].sort((a,b) => b.dailyRevenue - a.dailyRevenue);
      return combined.slice(0, 10);
  }, [currentLabel, gameState.releases, gameState.time, gameState.artist?.level, gameState.artist?.name]);

  if (!currentLabel) {
      return (
        <div className="flex flex-col h-full bg-[#050507] text-white p-6 relative overflow-hidden">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors z-20">
              <X className="w-6 h-6" />
            </button>
            <div className="mb-8 z-10 relative">
              <h2 className="text-3xl font-black tracking-tighter italic text-purple-400 uppercase flex items-center gap-3">
                 <Star className="w-8 h-8" /> Record Labels
              </h2>
              <p className="text-white/60">Pitch your best songs to Record Labels and secure a lucrative record deal. Deals come with advance money, but remember it must be recouped!</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pb-20 pr-2">
                {RECORD_LABELS.map(label => (
                    <div key={label.id} className="bg-white/5 border border-white/10 hover:border-white/20 transition-all rounded-[2rem] p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
                        <img src={label.image} alt={label.name} className="w-32 h-32 lg:w-48 lg:h-48 rounded-[1.5rem] object-cover bg-black shadow-lg" />
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-3xl font-black">{label.name}</h3>
                                    <div className="text-red-400 font-black text-xl flex items-center gap-1 bg-red-500/10 px-4 py-2 rounded-xl">
                                        -{label.royaltyCut}%
                                    </div>
                                </div>
                                <p className="text-white/60 mb-6">{label.description}</p>
                                <div className="grid grid-cols-3 gap-2 mb-4 bg-black/40 p-4 rounded-xl border border-white/5 text-center">
                                    <div>
                                        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Target Lvl</div>
                                        <div className="font-bold text-blue-400 max-w-[100px] mx-auto truncate" title={label.requirements.targetLevel.toString()}>Lvl {label.requirements.targetLevel}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Min. Streams</div>
                                        <div className="font-bold text-green-400 max-w-[100px] mx-auto truncate" title={label.requirements.minStreams.toLocaleString()}>{(label.requirements.minStreams / 1000000).toFixed(1)}M</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Followers</div>
                                        <div className="font-bold text-pink-400 max-w-[100px] mx-auto truncate" title={label.requirements.minFollowers.toLocaleString()}>{(label.requirements.minFollowers / 1000).toFixed(1)}k</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col justify-end">
                                <button onClick={() => setPitchLabelId(label.id)} className="w-full bg-white text-black hover:bg-gray-200 font-black tracking-tight text-lg py-3 rounded-xl transition-all">
                                    Pitch To Label
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {pitchLabelId && (() => {
                const pitchLabel = RECORD_LABELS.find(l => l.id === pitchLabelId);
                const availableSongs = gameState.releases.filter(r => r.type === 'Single' && !(r as any).isNPCRelease && !r.masterOwner);
                return (
                    <div className="fixed inset-0 z-50 bg-black/90 flex justify-center items-center p-4">
                        <div className="bg-[#0a0a0e] border border-white/10 p-8 rounded-3xl w-full max-w-lg shadow-2xl relative">
                            <button onClick={() => setPitchLabelId(null)} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="w-5 h-5"/></button>
                            <h3 className="text-2xl font-black mb-2 italic uppercase">Pitch to {pitchLabel?.name}</h3>
                            <p className="text-white/60 mb-6 text-sm">Select one of your best independent songs to pitch to their A&R team. If impressed, they will send a contract offer to your inbox.</p>
                            
                            <div className="mb-6 space-y-2">
                                <label className="text-xs uppercase tracking-widest text-white/40 font-bold ml-1">Select Track to Pitch</label>
                                <select 
                                    className="w-full bg-black border border-white/10 rounded-xl p-4 text-white appearance-none cursor-pointer outline-none focus:border-purple-500 transition-colors empty:opacity-50"
                                    value={selectedSongToPitch}
                                    onChange={(e) => setSelectedSongToPitch(e.target.value)}
                                >
                                    <option value="" disabled>-- Select a Track --</option>
                                    {availableSongs.map(s => (
                                        <option key={s.id} value={s.id}>{s.title}</option>
                                    ))}
                                </select>
                                {availableSongs.length === 0 && <div className="text-red-400 text-xs mt-1 ml-1">You don't have any independent single releases to pitch. Release a song first!</div>}
                            </div>
                            
                            <button 
                                onClick={handleSendPitch}
                                disabled={availableSongs.length === 0}
                                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all"
                            >
                                Send Pitch
                            </button>
                        </div>
                    </div>
                )
            })()}
        </div>
      );
  }

  // ALREADY SIGNED VIEW
  return (
    <div className="flex flex-col h-full bg-[#050507] text-white relative overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-blue-900/60 to-purple-900/60 p-6 flex flex-col pt-12 text-center items-center justify-center relative">
            <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors z-20"><X className="w-6 h-6" /></button>
            <div className="text-[10px] tracking-widest uppercase text-white/60 font-bold mb-2">Signed To</div>
            <img src={currentLabel.image} alt={currentLabel.name} className="w-20 h-20 rounded-2xl mb-3 shadow-xl object-cover" />
            <h2 className="text-3xl font-black tracking-tighter uppercase italic drop-shadow-lg">{currentLabel.name}</h2>
            
            <div className="flex gap-4 mt-8 pb-0">
                {(['home', 'financials', 'contract', 'merch'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`pb-3 px-2 border-b-2 font-bold uppercase tracking-widest text-xs transition-colors ${tab === t ? 'border-white text-white' : 'border-transparent text-white/40 hover:text-white/80'}`}>
                       {t}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {tab === 'home' && (
                <div className="animate-in fade-in slide-in-from-bottom flex flex-col gap-8">
                    <div>
                        <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400" /> Label Top Artists</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {topArtists.map((npc, idx) => (
                                <div key={npc.name} className={`bg-white/5 border ${npc.isPlayer ? 'border-purple-500/50 relative overflow-hidden' : 'border-white/10'} p-5 rounded-2xl flex flex-col gap-4`}>
                                    {npc.isPlayer && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>}
                                    <div className="flex items-center gap-4">
                                       <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center font-bold text-xl relative overflow-hidden shrink-0">
                                           {npc.isPlayer ? (gameState.artist?.name[0]) : (ARTIST_IMAGES[npc.name] ? <img src={ARTIST_IMAGES[npc.name]} className="w-full h-full object-cover"/> : npc.name[0])}
                                       </div>
                                       <div className="min-w-0 flex-1">
                                          <div className="font-bold truncate">{npc.name} {npc.isPlayer && '(You)'}</div>
                                          <div className="text-[10px] uppercase tracking-widest text-white/40">#{idx + 1} Label Chart</div>
                                       </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                                        <div>
                                            <div className="text-[9px] uppercase text-white/40 mb-0.5">Daily Streams</div>
                                            <div className="font-mono text-xs font-bold text-blue-400">{(npc.dailyStreams / 1000).toFixed(1)}k</div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] uppercase text-white/40 mb-0.5">Daily Sales</div>
                                            <div className="font-mono text-xs font-bold text-orange-400">{npc.dailySales.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] uppercase text-white/40 mb-0.5">Daily Est. Rev</div>
                                            <div className="font-mono text-xs font-bold text-green-400">${npc.dailyRevenue.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold tracking-tight mb-4">Your Label Benefits</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className={`p-5 rounded-2xl border ${currentLabel.benefits.freeTikTokPromo ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10 opacity-50'}`}>
                                <div className="font-bold mb-1">TikTok Promo</div>
                                <div className="text-xs text-white/60">{currentLabel.benefits.freeTikTokPromo ? 'Fully covered by label.' : 'Not included.'}</div>
                            </div>
                            <div className={`p-5 rounded-2xl border ${currentLabel.benefits.freeMusicVideo ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10 opacity-50'}`}>
                                <div className="font-bold mb-1">Music Videos</div>
                                <div className="text-xs text-white/60">{currentLabel.benefits.freeMusicVideo ? 'Fully covered by label.' : 'Not included.'}</div>
                            </div>
                            <div className={`p-5 rounded-2xl border ${currentLabel.benefits.collabPromoCut > 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10 opacity-50'}`}>
                                <div className="font-bold mb-1">Collab Discount</div>
                                <div className="text-xs text-white/60">{currentLabel.benefits.collabPromoCut > 0 ? `-${currentLabel.benefits.collabPromoCut}% on labelmates.` : 'Not included.'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'financials' && (
                <div className="animate-in fade-in slide-in-from-bottom">
                    <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-400" /> Revenue Analysis</h3>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl mb-6">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Total Revenue Generated by You For Label</div>
                        <div className="text-4xl font-black text-green-400 font-mono">${(contract?.revenueGeneratedForLabel || 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-black/50 border border-white/5 p-6 rounded-3xl">
                        <div className="flex items-center gap-2 mb-4 text-white/60 text-sm">
                           <Info className="w-4 h-4"/> Your record label takes a {contract?.royaltyCut}% royalty cut from all your music revenue (streams and sales). Masters are owned by the label.
                        </div>
                    </div>
                </div>
            )}

            {tab === 'contract' && (
                <div className="animate-in fade-in slide-in-from-bottom">
                    <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2"><UserCheck className="w-5 h-5 text-blue-400" /> Contract Status</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col justify-between">
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Unrecouped Balance</div>
                                <div className="text-3xl font-black text-red-400 font-mono mb-2">${(contract?.unrecoupedBalance || 0).toLocaleString()}</div>
                                <p className="text-xs text-white/60 leading-relaxed">This is the remaining advance you owe the label. Royalties you earn ({100 - (contract?.royaltyCut || 0)}%) will first pay this debt before going into your pocket.</p>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col justify-between">
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Label Royalty Cut</div>
                                <div className="text-3xl font-black text-blue-400 font-mono mb-2">{contract?.royaltyCut}%</div>
                                <p className="text-xs text-white/60 leading-relaxed">The permanent percentage of revenue the label keeps from releases under this deal.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                        <h4 className="font-bold mb-4">Delivery Obligations</h4>
                        {contract?.type === 'album' && (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-bold">Albums Delivered</span>
                                        <span className="text-sm font-mono text-white/60">{contract.deliveredAlbums} / {contract.requiredAlbums}</span>
                                    </div>
                                    <div className="w-full bg-black rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((contract.deliveredAlbums||0) / (contract.requiredAlbums||1)) * 100)}%`}}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {contract?.type === 'year' && (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-bold">Singles Delivered</span>
                                        <span className="text-sm font-mono text-white/60">{contract.deliveredSingles} / {contract.requiredSingles}</span>
                                    </div>
                                    <div className="w-full bg-black rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((contract.deliveredSingles||0) / (contract.requiredSingles||1)) * 100)}%`}}></div>
                                    </div>
                                </div>
                                <div className="text-xs text-white/40 mt-4">Contract runs for {contract.duration} years. Deal expires regardless of deliveries once time is up.</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {tab === 'merch' && (
                <div className="animate-in fade-in slide-in-from-bottom">
                    <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-pink-400" /> Exclusive Label Store</h3>
                    <p className="text-white/60 text-sm mb-6 pb-6 border-b border-white/10">{currentLabel.name} exclusively manages physical production (CDs, Vinyls) for your releases delivered under this contract. You receive {(100 - (contract?.royaltyCut || 0))}% of the profits.</p>
                    
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
                        <div className="text-xs font-bold uppercase tracking-widest">Physical Distribution Lineup</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gameState.releases.filter(r => !(r as any).isNPCRelease && r.masterOwner === currentLabel.id).map(r => (
                            <div key={r.id} className="bg-[#0a0a0e] border border-white/5 rounded-3xl overflow-hidden group hover:border-pink-500/30 transition-colors shadow-2xl relative">
                                <div className="absolute top-0 right-0 p-4 z-10 flex flex-col gap-2 opacity-100 items-end">
                                   <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-pink-400 border border-pink-400/20 shadow-lg">
                                      {r.type === 'Single' ? '7" Vinyl Single' : '12" LP + CD Deluxe'}
                                   </div>
                                </div>
                                
                                <div className="aspect-[4/3] w-full relative overflow-hidden bg-white/5 p-8 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-0"></div>
                                    <img src={r.coverImage} className="w-32 h-32 rounded object-cover shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-700" />
                                    {r.type !== 'Single' && (
                                       <div className="absolute right-8 top-12 w-24 h-24 rounded-full border border-[#222] bg-gradient-to-tr from-[#111] to-[#333] shadow-xl flex items-center justify-center z-0 translate-x-4 animate-spin" style={{ animationDuration: '4s', animationTimingFunction: 'linear' }}>
                                           <div className="w-8 h-8 rounded-full bg-[#111] border border-[#222]"></div>
                                       </div>
                                    )}
                                </div>
                                <div className="p-6 relative z-10 bg-gradient-to-b from-transparent to-[#0a0a0e]">
                                    <h4 className="font-bold text-lg mb-1 truncate" title={r.title}>{r.title}</h4>
                                    <div className="text-[10px] text-white/50 uppercase tracking-widest mb-4">Official Physical Release</div>
                                    
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                                         <div>
                                            <div className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Total Units Sold</div>
                                            <div className="text-pink-400 font-mono text-sm font-bold">{(r.sales.physical || 0).toLocaleString()}</div>
                                         </div>
                                         <div className="text-right">
                                            <div className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Gross Rev</div>
                                            <div className="text-green-400 font-mono text-sm font-bold">${((r.sales.physical || 0) * (r.type === 'Single' ? 4.99 : 14.99)).toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                                         </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {gameState.releases.filter(r => !(r as any).isNPCRelease && r.masterOwner === currentLabel.id).length === 0 && (
                        <div className="text-center py-16 bg-white/5 border border-white/10 rounded-3xl mt-6">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Target className="w-6 h-6 text-white/20"/>
                            </div>
                            <div className="font-bold mb-2">No Label Merch Available</div>
                            <p className="text-sm text-white/40 max-w-sm mx-auto">Once you deliver releases under this {currentLabel.name} contract, the label will manufacture and distribute official physical copies here.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
}
