import React, { useState, useMemo, useEffect } from 'react';
import { GameState, Tour, TourLeg, TourSeatLevel, Venue, Region, Song } from '../types';
import { MapPin, Calendar, DollarSign, Upload, Search, ChevronRight, X, ArrowLeft, Plus, Trash2, Users, CheckCircle, Music } from 'lucide-react';
import { AREA_VENUES } from '../tourConstants';
import { NPC_ARTISTS } from '../constants';
import { VenueSeatingChart } from './VenueSeatingChart';

interface TourViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  currentDate: Date;
}

export function TourView({ gameState, setGameState, currentDate }: TourViewProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'history'>('manage');
  const [expandedLegId, setExpandedLegId] = useState<string | null>(null);
  
  // Creation States
  const [step, setStep] = useState(1);
  const [tourName, setTourName] = useState('');
  const [posterUrl, setPosterUrl] = useState('https://images.unsplash.com/photo-1540039155732-d692822dec77?w=400&q=80');
  const [setlistName, setSetlistName] = useState('');
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [legs, setLegs] = useState<Omit<TourLeg, 'id' | 'completed' | 'dailyRevenue' | 'dailyAttendance' | 'totalRevenue' | 'totalAttendance'>[]>([]);

  // Form selections currently
  const [currentRegion, setCurrentRegion] = useState<Region>('America');
  // Step 3 state
  const [selectedMultiVenueIds, setSelectedMultiVenueIds] = useState<string[]>([]);
  
  // Step 4 state
  const [schedDates, setSchedDates] = useState<{date: string, preSaleStart: string, preSaleEnd: string} | null>(null);
  const [schedVenueId, setSchedVenueId] = useState<string | null>(null);
  const [schedOpener, setSchedOpener] = useState<string | null>(null);
  const [seatPrices, setSeatPrices] = useState<Record<number, number>>({});
  const [showsCount, setShowsCount] = useState(1);
  const [tourError, setTourError] = useState<string | null>(null);

  const availableSongs = gameState.releases.filter((r): r is Song => r.type === 'Single');

  // Currently active tour
  const activeTour = gameState.tours?.find(t => t.id === gameState.activeTourId);

  const handleStartTour = () => {
     setTourError(null);
     if (!tourName || selectedSongs.length === 0 || legs.length === 0) {
         setTourError("Please fill out all required fields and schedule at least one leg.");
         return;
     }

     // Calculate upfront costs
     const totalCost = legs.reduce((sum, leg) => {
         const venue = AREA_VENUES.find(v => v.id === leg.venueId);
         const venueCost = (venue?.weeklyCost || 0) * leg.shows;
         const openingActCost = (leg.openerCost || 0) * leg.shows;
         return sum + venueCost + openingActCost;
     }, 0);

     if (gameState.stats.money < totalCost) {
         setTourError(`Not enough money for venue deposits! You need $${totalCost.toLocaleString()} but you only have $${gameState.stats.money.toLocaleString()}`);
         return;
     }

     const newLegs: TourLeg[] = legs.map((l, idx) => ({
         ...l,
         id: `leg_${Date.now()}_${idx}`,
         completed: false,
         dailyRevenue: 0,
         dailyAttendance: 0,
         totalRevenue: 0,
         totalAttendance: 0,
     }));

     const newTour: Tour = {
         id: `tour_${Date.now()}`,
         name: tourName,
         poster: posterUrl,
         setlistName,
         setlist: selectedSongs,
         legs: newLegs,
         status: 'PreSale',
         totalRevenue: 0,
         totalCost,
         totalAttendance: 0
     };

     setGameState(prev => ({
         ...prev,
         stats: {
            ...prev.stats,
            money: prev.stats.money - totalCost
         },
         tours: [...(prev.tours || []), newTour],
         activeTourId: newTour.id
     }));
     
     setActiveTab('manage');
     setStep(1);
     setTourName('');
     setSetlistName('');
     setSelectedSongs([]);
     setLegs([]);
  };

  const autoSchedule = () => {
     const newLegs: typeof legs = [];
     let startD = new Date(currentDate);
     // Start 8 weeks from current date
     startD.setDate(startD.getDate() + 8*7); 

     for(const vid of selectedMultiVenueIds) {
         const v = AREA_VENUES.find(venue => venue.id === vid);
         if (!v) continue;

         let preStart = new Date(currentDate);
         let preEnd = new Date(startD);
         preEnd.setDate(preEnd.getDate() - 1);

         const sl = v.baseCapacityPerLevel.map((cap, idx) => ({
            level: idx+1,
            capacity: cap * 1,
            price: Math.max(20, 100 - (idx*10)),
            sold: 0
         }));

         newLegs.push({
             venueId: v.id,
             shows: 1,
             date: startD.toISOString().split('T')[0],
             preSaleStart: preStart.toISOString().split('T')[0],
             preSaleEnd: preEnd.toISOString().split('T')[0],
             opener: undefined,
             openerCost: undefined,
             seatLevels: sl
         });

         startD.setDate(startD.getDate() + 7); // 1 show a week
     }
     setLegs(newLegs);
     setSchedVenueId(null);
  };


  const renderCreateStep = () => {
      if (activeTour) {
          return (
             <div className="flex flex-col items-center justify-center h-64 bg-white/5 rounded-2xl border border-white/10 text-center p-8">
                 <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                    <X className="w-8 h-8 text-red-400" />
                 </div>
                 <h2 className="text-xl font-bold text-white mb-2">Tour In Progress</h2>
                 <p className="text-white/60 mb-4 max-w-md">You already have an active tour. You cannot plan a new tour while on the road.</p>
                 <button onClick={() => setActiveTab('manage')} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold uppercase tracking-widest text-white transition-all">Manage Active Tour</button>
             </div>
          )
      }

      switch (step) {
          case 1: // Basic Info
            return (
              <div className="space-y-6 max-w-2xl mx-auto">
                 <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Tour Name</label>
                    <input 
                      type="text" 
                      value={tourName}
                      onChange={(e) => setTourName(e.target.value)}
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      placeholder="e.g. The Eras Tour"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Poster Image URL</label>
                <div className="flex gap-4">
                   <div className="flex-1">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={async (e) => {
                           const file = e.target.files?.[0];
                           if (file) {
                              try {
                                 const { compressImage } = await import('../imageUtils');
                                 const compressed = await compressImage(file, 400, 400, 0.7);
                                 setPosterUrl(compressed);
                              } catch (err) {
                                 console.error(err);
                              }
                           }
                        }}
                        className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500"
                      />
                   </div>
                   {posterUrl ? <img src={posterUrl || undefined} className="w-12 h-12 rounded-lg object-cover" /> : null}
                </div>
                 </div>
                 <button disabled={!tourName} onClick={() => setStep(2)} className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-xl transition-colors">
                    Next: Setlist
                 </button>
              </div>
            );
          case 2: // Setlist
            return (
              <div className="space-y-6 max-w-2xl mx-auto">
                 <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Setlist Name</label>
                    <input 
                      type="text" 
                      value={setlistName}
                      onChange={(e) => setSetlistName(e.target.value)}
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      placeholder="e.g. Act I"
                    />
                 </div>
                 
                 <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-xs font-bold uppercase tracking-widest text-white/40">Select Songs</label>
                      <span className="text-xs text-purple-400 font-medium">{selectedSongs.length} Selected</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2">
                       {availableSongs.map(s => {
                           const isSelected = selectedSongs.includes(s.id);
                           return (
                             <div 
                               key={s.id} 
                               onClick={() => {
                                  if (isSelected) setSelectedSongs(p => p.filter(id => id !== s.id));
                                  else setSelectedSongs(p => [...p, s.id]);
                               }}
                               className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${isSelected ? 'bg-purple-600/20 border-purple-500' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                             >
                                {s.coverImage ? (
                                  <img src={s.coverImage || undefined} className="w-10 h-10 rounded-lg object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-white/10" />
                                )}
                                <div className="flex-1 truncate">
                                   <div className="text-sm font-bold text-white truncate">{s.title}</div>
                                   <div className="text-xs text-white/50">{s.streams.total.toLocaleString()} plays</div>
                                </div>
                                {isSelected && <CheckCircle className="w-5 h-5 text-purple-400" />}
                             </div>
                           )
                       })}
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <button onClick={() => setStep(1)} className="w-1/3 py-4 bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest rounded-xl transition-colors">Back</button>
                    <button disabled={!setlistName || selectedSongs.length === 0} onClick={() => setStep(3)} className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-xl transition-colors">
                       Next: Add Legs
                    </button>
                 </div>
              </div>
            );
          case 3: // Select Stages (Venues)
            return (
              <div className="space-y-6">
                 <div className="bg-[#111] border border-[#333] shadow-xl rounded-2xl p-6">
                    <h3 className="text-xl font-bold italic text-white mb-2 flex items-center gap-2">
                       <MapPin className="w-5 h-5 text-purple-400" />
                       Select Tour Stages
                    </h3>
                    <p className="text-white/50 mb-6 text-sm">Select at least 5 venues you want to perform at for your tour route. You'll schedule dates for these stages in the next step.</p>
                    
                    <div className="space-y-4">
                       <div className="flex gap-2">
                          {(['America', 'Latin America', 'Europe'] as Region[]).map(r => (
                             <button
                               key={r}
                               onClick={() => setCurrentRegion(r)}
                               className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${currentRegion === r ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/60 hover:text-white'}`}
                             >{r}</button>
                          ))}
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-[400px] overflow-y-auto pr-2">
                          {AREA_VENUES.filter(v => v.region === currentRegion).map(v => {
                             const isSelected = selectedMultiVenueIds.includes(v.id);
                             return (
                               <div key={v.id} onClick={() => { 
                                           setSelectedMultiVenueIds(p => {
                                             if (isSelected) return p.filter(id => id !== v.id);
                                             return [...p, v.id];
                                          });
                               }} className={`group relative bg-white/5 border rounded-xl overflow-hidden cursor-pointer transition-all ${isSelected ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'border-white/10 hover:border-white/30'}`}>
                                  <div className="aspect-video relative">
                                     {v.image ? (
                                        <img src={v.image || undefined} className={`w-full h-full object-cover text-[#222] bg-[#111] transition-opacity ${isSelected ? 'opacity-100' : 'opacity-60 group-hover:opacity-80'}`} onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80'; }} />
                                     ) : null}
                                     <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase">{v.type}</div>
                                     {isSelected && (
                                        <div className="absolute top-2 left-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                     )}
                                  </div>
                                  <div className="p-3">
                                     <div className="font-bold text-white truncate">{v.name}</div>
                                     <div className="text-xs text-white/50 mt-1">${(v.weeklyCost/1000000).toFixed(1)}M / concert</div>
                                  </div>
                               </div>
                             );
                          })}
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <button onClick={() => setStep(2)} className="w-1/3 py-4 bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest rounded-xl transition-colors">Back</button>
                    <button disabled={selectedMultiVenueIds.length < 4} onClick={() => setStep(4)} className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-xl transition-colors">
                       Next: Schedule Dates ({selectedMultiVenueIds.length} / Min 4)
                    </button>
                 </div>
              </div>
            );
          case 4: // Schedule & Details
             const currentSchedVenue = AREA_VENUES.find(v => v.id === schedVenueId);
             
             return (
               <div className="space-y-8">
                  {legs.length > 0 && (
                     <div className="bg-[#111] border border-[#333] shadow-xl rounded-2xl p-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> SCHEDULED CONCERTS</h3>
                        <div className="flex flex-col gap-2">
                           {legs.map((leg, i) => {
                               const v = AREA_VENUES.find(venue => venue.id === leg.venueId);
                               return (
                                 <div key={i} className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-xl">
                                    <div className="flex items-center gap-4">
                                       <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex flex-col items-center justify-center text-purple-400">
                                          <div className="text-[10px] uppercase font-bold">{new Date(leg.date).toLocaleString('default', { month: 'short' })}</div>
                                          <div className="text-lg font-black leading-none">{new Date(leg.date).getDate()}</div>
                                       </div>
                                       <div>
                                          <div className="font-bold text-white">{v?.name}</div>
                                          <div className="text-sm text-white/50">{leg.shows} Shows {leg.opener ? `• w/ ${leg.opener}` : ''}</div>
                                       </div>
                                    </div>
                                    <button onClick={() => setLegs(p => p.filter((_, idx) => idx !== i))} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                                 </div>
                               )
                           })}
                        </div>
                     </div>
                  )}

                  <div className="bg-[#111] border border-[#333] shadow-xl rounded-2xl p-6">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                           <h3 className="text-xl font-bold italic text-white mb-2 flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-purple-400" />
                              Schedule Dates & Pricing
                           </h3>
                           <p className="text-white/50 text-sm">Select a date from the calendar and tap the venue you want the concert at.</p>
                        </div>
                        {legs.length === 0 && (
                           <button onClick={autoSchedule} className="shrink-0 px-4 py-3 bg-[#a855f7]/20 text-[#a855f7] hover:bg-[#a855f7] hover:text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors">
                              Auto-Schedule All
                           </button>
                        )}
                     </div>
                     
                     <div className="space-y-6">
                        {/* Dates */}
                        <div>
                           <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-3">AVAILABLE DATES</h4>
                           <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                               {Array.from({length: 52}).map((_, i) => {
                                  const d = new Date(currentDate);
                                  d.setDate(d.getDate() + (i + 8) * 7); // Start 8 weeks in the future
                                  const dateStr = d.toISOString().split('T')[0];
                                  const isSelected = schedDates?.date === dateStr;
                                  // Skip if already scheduled
                                  if (legs.find(l => l.date === dateStr)) return null;
                                  
                                  return (
                                     <button
                                       key={dateStr}
                                       onClick={() => {
                                          const preStart = new Date(currentDate);
                                          const preEnd = new Date(d);
                                          preEnd.setDate(preEnd.getDate() - 1);
                                          setSchedDates({ date: dateStr, preSaleStart: preStart.toISOString().split('T')[0], preSaleEnd: preEnd.toISOString().split('T')[0] });
                                       }}
                                       className={`flex flex-col items-center justify-center min-w-[70px] h-20 rounded-xl border transition-all shrink-0 ${isSelected ? 'bg-[#3b5b82] border-blue-400' : 'bg-[#2a3f5c] border-transparent hover:bg-[#324a6d]'}`}
                                     >
                                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{d.toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-xl font-black text-white">{d.getDate()}</span>
                                        <span className="text-[10px] font-bold text-white/50">{d.getFullYear()}</span>
                                     </button>
                                  )
                               })}
                           </div>
                        </div>

                        {/* Venues */}
                        <div>
                           <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-3">CONCERT VENUE</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {selectedMultiVenueIds.map(vid => {
                                  const v = AREA_VENUES.find(venue => venue.id === vid);
                                  if (!v) return null;
                                  const isSelected = schedVenueId === vid;
                                  return (
                                     <button
                                       key={vid}
                                       onClick={() => { setSchedVenueId(vid); setSeatPrices({}); }}
                                       className={`text-left p-4 rounded-xl border transition-all ${isSelected ? 'bg-[#3b5b82] border-blue-400' : 'bg-[#2a3f5c] border-transparent hover:bg-[#324a6d]'}`}
                                     >
                                        <div className="font-bold text-white text-lg mb-1">{v.name}</div>
                                        <div className="flex items-center gap-1 text-xs text-white/70 mb-2">
                                           <MapPin className="w-3 h-3" />
                                           {v.type}
                                        </div>
                                        <div className="flex items-center gap-1 text-[#f5c518] text-sm font-bold">
                                           <DollarSign className="w-4 h-4" />
                                           {(v.weeklyCost/1000000).toFixed(1)}M/concert
                                        </div>
                                     </button>
                                  )
                              })}
                           </div>
                        </div>

                        {/* Openers */}
                        <div>
                           <div className="flex items-center gap-3 mb-3">
                              <h4 className="text-sm font-bold uppercase tracking-widest text-white">BOOK ARTISTS</h4>
                              {schedOpener && <button onClick={() => setSchedOpener(null)} className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded font-bold uppercase hover:bg-red-500/30">Clear</button>}
                           </div>
                           <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                              {NPC_ARTISTS.map((npc, i) => {
                                  const isSelected = schedOpener === npc.name;
                                  const fee = Math.floor(npc.basePoints * 0.05);
                                  const rating = Math.min(100, Math.floor(npc.basePoints / 5000));
                                  return (
                                     <button
                                       key={i}
                                       onClick={() => setSchedOpener(npc.name)}
                                       className={`min-w-[150px] text-left p-3 rounded-xl border transition-all shrink-0 ${isSelected ? 'bg-[#3b5b82] border-blue-400' : 'bg-[#2a3f5c] border-transparent hover:bg-[#324a6d]'}`}
                                     >
                                        <div className="flex justify-between items-center mb-2">
                                           <div className="font-bold text-white truncate pr-2">{npc.name}</div>
                                           <div className="text-xs font-black text-white/50">{rating}</div>
                                        </div>
                                        <div className="text-[10px] font-bold text-blue-200 bg-blue-900/40 px-2 py-1 rounded inline-block">AS AN OPENER</div>
                                        <div className="text-[10px] text-white/40 mt-1">${(fee/1000).toFixed(0)}k/show</div>
                                     </button>
                                  )
                              })}
                           </div>
                        </div>

                        {/* Ticket Gods Pricing Config */}
                        {schedVenueId && currentSchedVenue && (
                           <div className="mt-8 border-t border-white/10 pt-8">
                              <div className="text-center mb-6">
                                 <h2 className="text-2xl font-black text-white tracking-widest uppercase">TICKET GODS</h2>
                                 <p className="text-white/50">Create ticket tiers for {currentSchedVenue.name}.</p>
                              </div>

                              {/* NEW FULL WIDTH VENUE PREVIEW */}
                              <div className="mb-8 max-w-4xl mx-auto">
                                 <VenueSeatingChart venue={currentSchedVenue} showsCount={showsCount} />
                              </div>

                              <div className="max-w-md mx-auto bg-[#1b2638] rounded-3xl p-6 border border-[#2a3f5c]">
                                 <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-6 border-b border-white/10 pb-2">FORM (FILL TO CREATE TIER)</h4>
                                 
                                 <div className="space-y-6">
                                    <div>
                                       <label className="block text-xs font-bold uppercase tracking-widest text-white mb-2">Number of Shows</label>
                                       <input type="number" min="1" max="15" value={showsCount} onChange={(e) => setShowsCount(Math.max(1, Math.min(15, Number(e.target.value))))} className="w-full bg-white text-black font-bold rounded-xl px-4 py-3 focus:outline-none" />
                                    </div>

                                    {Array.from({length: currentSchedVenue?.levels || 1}).map((_, i) => (
                                       <div key={i}>
                                          <label className="block text-xs font-bold uppercase tracking-widest text-white mb-2">{i===0 ? 'VIP / L1' : `L${i+1}`}</label>
                                          <div className="flex items-center gap-2">
                                             <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black font-bold">$</span>
                                                <input 
                                                   type="number"
                                                   min={1}
                                                   value={seatPrices[i+1] || ''}
                                                   onChange={(e) => setSeatPrices(p => ({...p, [i+1]: Number(e.target.value)}))}
                                                   className="w-24 bg-white text-black font-black rounded-xl px-2 pl-6 py-3 focus:outline-none placeholder-black/30"
                                                   placeholder="0"
                                                />
                                             </div>
                                             <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
                                                {[-100, -10, -1, 1, 10, 100].map(val => (
                                                   <button key={val} onClick={() => setSeatPrices(p => ({...p, [i+1]: Math.max(0, (p[i+1]||0) + val)}))} className="min-w-[40px] px-2 py-3 bg-[#2a3f5c] hover:bg-[#3b5b82] text-white/80 font-bold rounded-lg text-xs transition-colors shrink-0">
                                                      {val > 0 ? `+${val}` : val}
                                                   </button>
                                                ))}
                                             </div>
                                          </div>
                                       </div>
                                    ))}

                                    <button 
                                       disabled={!schedDates || Object.keys(seatPrices).length !== currentSchedVenue?.levels}
                                       onClick={() => {
                                          if (!currentSchedVenue || !schedDates) return;
                                          const openerCost = schedOpener ? Math.floor((NPC_ARTISTS.find(n => n.name === schedOpener)?.basePoints || 0) * 0.05) : undefined;
                                          const newLeg: Omit<TourLeg, 'id' | 'completed' | 'dailyRevenue' | 'dailyAttendance' | 'totalRevenue' | 'totalAttendance'> = {
                                             venueId: currentSchedVenue.id,
                                             shows: showsCount,
                                             date: schedDates.date,
                                             preSaleStart: schedDates.preSaleStart,
                                             preSaleEnd: schedDates.preSaleEnd,
                                             opener: schedOpener || undefined,
                                             openerCost,
                                             seatLevels: currentSchedVenue.baseCapacityPerLevel.map((cap, idx) => ({
                                                level: idx + 1,
                                                capacity: cap * showsCount,
                                                price: seatPrices[idx+1] || 0,
                                                sold: 0
                                             }))
                                          };
                                          setLegs(p => [...p, newLeg]);
                                          setSchedVenueId(null);
                                          setSchedDates(null);
                                          setSchedOpener(null);
                                          setShowsCount(1);
                                          setSeatPrices({});
                                       }}
                                       className="w-full py-4 mt-6 bg-[#3b5b82] hover:bg-blue-500 disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-xl transition-all"
                                    >
                                       Save Config
                                    </button>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                  {tourError && (
                     <div className="bg-red-500/20 border border-red-500 p-4 rounded-xl text-red-200 font-bold mb-4 text-center">
                        {tourError}
                     </div>
                  )}
                  <div className="flex gap-4">
                     <button onClick={() => setStep(3)} className="w-1/3 py-4 bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest rounded-xl transition-colors">Back</button>
                     <button disabled={legs.length === 0} onClick={handleStartTour} className="flex-1 py-4 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-xl transition-colors">
                        Launch Tour
                     </button>
                  </div>
               </div>
             );
       }
   };

   const renderManageTab = () => {
       if (!activeTour) {
          return (
              <div className="flex flex-col items-center justify-center p-10 text-center border-2 border-dashed border-white/20 rounded-[2rem] bg-[#0B0D16] mt-4 shrink-0 mx-auto max-w-sm w-full">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                     <MapPin className="w-8 h-8 text-white/50" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">No Active Tour</h2>
                  <p className="text-white/50 mb-10 leading-relaxed max-w-[280px]">Hit the road, perform for your fans, and generate massive revenue by booking your next global tour.</p>
                  <button onClick={() => setActiveTab('create')} className="w-full h-14 bg-[#a855f7] hover:bg-purple-500 text-white rounded-xl font-bold uppercase tracking-widest transition-all">Book A Tour</button>
              </div>
          );
       }

      return (
         <div className="space-y-8 max-w-4xl mx-auto pb-10">
             {/* Header */}
             <div className="relative rounded-3xl overflow-hidden min-h-[300px] flex items-end">
                <div className="absolute inset-0">
                   {activeTour.poster ? (
                      <img src={activeTour.poster || undefined} className="w-full h-full object-cover" />
                   ) : (
                      <div className="w-full h-full bg-[#111]" />
                   )}
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                </div>
                <div className="relative z-10 p-8 w-full">
                   <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                      <div>
                         <div className="inline-block px-3 py-1 bg-[#a855f7] rounded-full text-[10px] font-bold text-white uppercase tracking-widest mb-3">
                            {activeTour.status}
                         </div>
                         <h2 className="text-4xl md:text-5xl font-black text-white mb-2">{activeTour.name}</h2>
                         <div className="flex items-center gap-4 text-sm font-medium text-white/60">
                            <span className="flex items-center gap-1"><Music className="w-4 h-4" /> {activeTour.setlistName} ({activeTour.setlist.length} Songs)</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {activeTour.legs.length} Stops</span>
                         </div>
                      </div>
                      <div className="text-left md:text-right bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                         <div className="text-xs uppercase tracking-widest text-[#a855f7] font-bold mb-1">Gross Revenue</div>
                         <div className="text-3xl font-mono text-green-400">${activeTour.totalRevenue.toLocaleString()}</div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="flex flex-col gap-3">
                 <h3 className="text-lg font-bold text-white uppercase tracking-widest px-2 mb-2">Tour Dates</h3>
                 {activeTour.legs.map((leg, idx) => {
                     const v = AREA_VENUES.find(venue => venue.id === leg.venueId);
                     const isFuture = new Date(leg.date) > currentDate;
                     const isOngoing = leg.preSaleStart <= currentDate.toISOString() && isFuture;
                     
                     const totalCapacity = leg.seatLevels.reduce((sum, sl) => sum + sl.capacity, 0);
                     const totalSold = leg.seatLevels.reduce((sum, sl) => sum + sl.sold, 0);
                     
                     const isExpanded = expandedLegId === leg.id;

                     return (
                         <div key={leg.id} className={`bg-[#0B0D16] border ${isOngoing ? 'border-[#a855f7]/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'border-[#1c1c2e] hover:border-white/20'} rounded-2xl overflow-hidden transition-all duration-300`}>
                            {/* Accordion Header */}
                            <button onClick={() => setExpandedLegId(isExpanded ? null : leg.id)} className="w-full flex justify-between items-center p-5 md:p-6 text-left group">
                               <div className="flex flex-col">
                                  <div className="flex items-center gap-3 mb-2">
                                     <h4 className="font-bold text-white text-lg md:text-xl group-hover:text-purple-300 transition-colors">{v?.name}</h4>
                                     {leg.completed ? (
                                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-bold uppercase">Completed</span>
                                     ) : isOngoing ? (
                                        <span className="px-2 py-0.5 bg-[#a855f7]/20 text-[#a855f7] rounded text-[10px] font-bold uppercase animate-pulse">Selling</span>
                                     ) : (
                                        <span className="px-2 py-0.5 bg-white/10 text-white/50 rounded text-[10px] font-bold uppercase">Scheduled</span>
                                     )}
                                  </div>
                                  <div className="text-sm text-white/50 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(leg.date).toLocaleDateString()} • {leg.shows} Show(s)
                                  </div>
                               </div>
                               <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-90 bg-white/10' : 'bg-[#131722]'}`}>
                                  <ChevronRight className="w-4 h-4 text-white/50" />
                               </div>
                            </button>

                            {/* Accordion Body */}
                            {isExpanded && (
                               <div className="p-5 md:p-6 border-t border-[#1c1c2e] bg-[#0a0b12]">
                                 {/* Stats */}
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#131722] border border-[#1c1c2e] p-4 rounded-xl mb-6">
                                     <div className="flex flex-col">
                                        <span className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Status</span>
                                        <span className="font-bold text-base text-white">{totalSold >= totalCapacity ? 'Sold Out' : 'Available'}</span>
                                     </div>
                                     <div className="flex flex-col">
                                        <span className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Sold / Total</span>
                                        <span className="font-bold text-base text-white">{totalSold.toLocaleString()} / {totalCapacity.toLocaleString()}</span>
                                     </div>
                                     <div className="flex flex-col">
                                        <span className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Unsold</span>
                                        <span className="font-bold text-base text-[#ff8c00]">{(totalCapacity - totalSold).toLocaleString()}</span>
                                     </div>
                                     <div className="flex flex-col">
                                        <span className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Gross Rev</span>
                                        <span className="font-bold text-base text-green-400 font-mono">${leg.totalRevenue.toLocaleString()}</span>
                                     </div>
                                 </div>

                                 {/* Full visual stage preview */}
                                 <div className="bg-[#0B0D16] border border-[#1c1c2e] rounded-xl overflow-hidden pb-4">
                                    <div className="p-4 border-b border-[#1c1c2e] flex justify-between items-center bg-[#131722]">
                                       <h5 className="text-xs font-bold text-white uppercase tracking-widest">Stage & Ticket Tier Preview</h5>
                                       <div className="text-[10px] text-[#a855f7] font-bold uppercase tracking-widest flex items-center gap-2">
                                           <span className="w-2 h-2 rounded-full bg-[#a855f7] animate-pulse"></span>
                                           Live Sales Engine
                                       </div>
                                    </div>
                                    <div className="p-0 sm:p-4">
                                       {v && <VenueSeatingChart venue={v} seatLevels={leg.seatLevels} mode="active" showsCount={leg.shows} />}
                                    </div>
                                 </div>
                               </div>
                            )}
                         </div>
                     );
                 })}
             </div>
         </div>
      );
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6 shrink-0 pt-4">
          <div className="flex items-start gap-3">
             <MapPin className="w-5 h-5 text-purple-400 mt-1 shrink-0" />
             <div>
               <h1 className="text-3xl font-black italic uppercase tracking-widest text-white leading-tight mb-2">
                 Tour &<br/>Live Options
               </h1>
               <p className="text-white/50 text-sm max-w-[200px] leading-relaxed">
                 Hit the road, generate hype, and make millions.
               </p>
             </div>
          </div>
          <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl w-full md:w-auto overflow-x-auto custom-scrollbar">
             <button onClick={() => setActiveTab('manage')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'manage' ? 'bg-[#a855f7] text-white' : 'text-white/50 hover:text-white'}`}>Active Tour</button>
             <button onClick={() => setActiveTab('create')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'create' ? 'bg-[#a855f7] text-white' : 'text-white/50 hover:text-white'}`}>Book Tour</button>
             <button onClick={() => setActiveTab('history')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-[#a855f7] text-white' : 'text-white/50 hover:text-white'}`}>History</button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar pr-2 pb-12">
        {activeTab === 'create' && renderCreateStep()}
        {activeTab === 'manage' && renderManageTab()}
        {activeTab === 'history' && (
           <div className="space-y-4">
              {(gameState.tours || []).filter(t => t.status === 'Completed').length === 0 ? (
                 <div className="flex flex-col items-center justify-center p-12 text-center text-white/40">
                    <Calendar className="w-12 h-12 mb-4" />
                    <p>You haven't completed any tours yet.</p>
                 </div>
              ) : (
                 (gameState.tours || []).filter(t => t.status === 'Completed').map(t => (
                    <div key={t.id} className="bg-white/5 border border-white/10 p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 overflow-hidden relative group hover:bg-white/10 transition-colors">
                       <div className="flex items-start md:items-center gap-4 w-full md:w-auto">
                          {t.poster ? (
                             <img src={t.poster || undefined} className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover shrink-0 bg-black/40 border border-white/10" />
                          ) : (
                             <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white/10 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0 pr-2">
                             <h4 className="text-lg md:text-xl font-bold text-white mb-0.5 md:mb-1 truncate">{t.name}</h4>
                             <div className="text-xs md:text-sm text-white/50 truncate">
                               {t.legs.length} Stops • {t.totalAttendance.toLocaleString()} Tickets Sold
                             </div>
                             <div className="text-[10px] md:text-xs font-medium text-white/70 mt-1 truncate">
                               Setlist: {t.setlistName} ({t.setlist.length} Songs)
                             </div>
                          </div>
                       </div>
                       <div className="border-t border-white/5 pt-3 sm:border-t-0 sm:pt-0 flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end w-full sm:w-auto shrink-0">
                          <div className="text-[10px] md:text-xs uppercase tracking-widest text-white/40 mb-0 sm:mb-1">Total Revenue</div>
                          <div className="text-lg md:text-2xl font-mono text-green-400">${t.totalRevenue.toLocaleString()}</div>
                       </div>
                    </div>
                 ))
              )}
           </div>
        )}
      </div>
    </div>
  );
}
