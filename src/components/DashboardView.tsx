import React, { useState } from 'react';
import { User, Loader2, Calendar as CalendarIcon, Music, MapPin, X, ArrowUpCircle, FastForward, Pause, Mail } from 'lucide-react';
import { GameState } from '../types';
import { LEVEL_REQUIREMENTS } from '../constants';

interface DashboardViewProps {
  gameState: GameState | null;
  setGameState?: React.Dispatch<React.SetStateAction<GameState | null>>;
  dateDayStr: string;
  dayName: string;
  monthYearStr: string;
  handleNextDay: () => void;
  isLoadingNextDay: boolean;
  currentAgeYears: number;
  isAutoAdvancing: boolean;
  setIsAutoAdvancing: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenWrapped?: () => void;
}

export function DashboardView({
  gameState,
  setGameState,
  dateDayStr,
  dayName,
  monthYearStr,
  handleNextDay,
  isLoadingNextDay,
  currentAgeYears,
  isAutoAdvancing,
  setIsAutoAdvancing,
  onOpenWrapped
}: DashboardViewProps) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const getUpcomingEvents = () => {
    if (!gameState) return [];
    
    const events: { date: Date; title: string; type: 'release' | 'gig'; obj: any }[] = [];
    
    // Scheduled releases
    (gameState.releases || []).filter(r => r.status === 'Scheduled' && r.releaseDate && !(r as any).isNPCRelease).forEach(r => {
      events.push({
        date: new Date(r.releaseDate!),
        title: `Release: ${r.title}`,
        type: 'release',
        obj: r
      });
    });

    // Booked gigs
    (gameState.gigs || []).filter(g => !g.completed).forEach(g => {
      events.push({
        date: new Date(g.date),
        title: `Gig: ${g.name}`,
        type: 'gig',
        obj: g
      });
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const upcomingEvents = getUpcomingEvents();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && setGameState) {
       try {
          const { compressImage } = await import('../imageUtils');
          const compressed = await compressImage(file, 400, 400, 0.7);
          setGameState(prev => {
            if (!prev?.artist) return prev;
            return {
              ...prev,
              artist: {
                ...prev.artist,
                image: compressed
              }
            };
          });
       } catch (err) {
          console.error("Compression err", err);
       }
    }
  };

  const handleAcceptCollab = (emailId: string) => {
      if (!setGameState || !gameState) return;
      const email = gameState.emails?.find(e => e.id === emailId);
      if (!email || !email.collabOffer) return;
      
      const offer = email.collabOffer;
      
      setGameState(prev => {
          if (!prev) return prev;
          
          const newSong: any = {
              id: 'song_' + Date.now(),
              title: offer.songTitle + " (feat. " + (prev.artist?.name || "You") + ")",
              coverImage: offer.coverArt,
              type: 'Single',
              status: 'Published',
              releaseDate: new Date(prev.time.startDate).getTime() + (prev.time.daysPassed * 24 * 60 * 60 * 1000), // approx current time, but let's use a nice string.
              streams: { spotify: 0, appleMusic: 0, amazonMusic: 0, youtubeMusic: 0, total: 0 },
              sales: { physical: 0, digital: 0, total: 0 },
              radioPlays: 0,
              genre: offer.genre,
              collaborator: offer.npcArtist,
              qualityModifier: 1.0,
              isBSide: false,
              isNPCCollab: true
          };
          
          // Re-format release date to ISO using the actual game date
          const rDateObj = new Date(prev.time.startDate);
          rDateObj.setDate(rDateObj.getDate() + prev.time.daysPassed);
          newSong.releaseDate = rDateObj.toISOString();

          return {
              ...prev,
              releases: [...prev.releases, newSong],
              stats: {
                  ...prev.stats,
                  money: prev.stats.money + offer.fee
              },
              emails: prev.emails?.map(e => e.id === emailId ? { ...e, collabOffer: { ...e.collabOffer!, status: 'accepted' } } : e)
          };
      });
  };

  const handleRejectCollab = (emailId: string) => {
      if (!setGameState) return;
      setGameState(prev => {
          if (!prev) return prev;
          return {
              ...prev,
              emails: prev.emails?.map(e => e.id === emailId ? { ...e, collabOffer: { ...e.collabOffer!, status: 'rejected' } } : e)
          };
      });
  };

  return (
    <div className="flex flex-col h-full p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-2xl font-bold tracking-tighter italic text-purple-400 uppercase">Dashboard</h2>
      </div>

      {/* Artist Profile & Calendar Card */}
      <div className="flex-1 bg-gradient-to-br from-white/5 to-transparent border border-white/5 rounded-[2.5rem] p-8 md:p-12 flex flex-col items-center md:items-stretch overflow-hidden relative shadow-2xl group">
         {/* Background Subtle Accent */}
         <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 blur-[100px] rounded-full group-hover:bg-purple-500/30 transition-all duration-1000" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full" />
         </div>

         <div className="absolute top-6 right-6 flex flex-row items-center gap-3 z-20">
            <button 
              onClick={() => {
                  setShowInbox(true);
                  if (gameState?.emails && gameState.emails.some(e => !e.isRead)) {
                      setGameState(prev => {
                          if (!prev || !prev.emails) return prev;
                          return {
                              ...prev,
                              emails: prev.emails.map(e => ({ ...e, isRead: true }))
                          }
                      });
                  }
              }}
              className="p-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all flex items-center gap-3 group/btn backdrop-blur-md active:scale-95 relative"
            >
               <Mail className="w-5 h-5 text-blue-400" />
               <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white/50 group-hover/btn:text-white transition-colors hidden sm:block">Inbox</span>
               {gameState?.emails && gameState.emails.some(e => !e.isRead) && (
                   <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-[#111]" />
               )}
            </button>
            <button 
              onClick={() => setShowSchedule(true)}
              className="p-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all flex items-center gap-3 group/btn backdrop-blur-md active:scale-95"
            >
               <CalendarIcon className="w-5 h-5 text-purple-400" />
               <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white/50 group-hover/btn:text-white transition-colors hidden sm:block">Timeline</span>
            </button>
            <button 
              onClick={() => setShowLevelModal(true)}
              className="p-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all flex items-center gap-3 group/btn backdrop-blur-md active:scale-95"
            >
               <ArrowUpCircle className="w-5 h-5 text-yellow-500 animate-pulse" />
               <span className="text-[10px] font-black tracking-[0.2em] text-white/50 group-hover/btn:text-white transition-colors hidden sm:block uppercase">Rank {gameState?.artist?.level || 0}</span>
            </button>
         </div>

         <div className="flex flex-col md:flex-row w-full mb-12 relative z-10 pt-16 md:pt-0">
            <div className="w-full md:w-1/3 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 pb-10 md:pb-0 md:pr-12 mb-10 md:mb-0 relative group/avatar">
              <label className="w-56 h-56 cursor-pointer bg-[#111] rounded-[2rem] border border-white/10 flex items-center justify-center mb-8 relative overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover/avatar:scale-105 group-hover/avatar:shadow-purple-500/10">
                 {gameState?.artist?.image ? (
                    <>
                      <img src={gameState.artist.image || undefined} alt="Artist" className="absolute w-full h-full object-cover transition-all duration-500 group-hover/avatar:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                        <span className="text-white font-bold text-sm tracking-widest uppercase">Change</span>
                      </div>
                    </>
                 ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                      <User className="w-20 h-20 text-white/10" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity z-20">
                        <span className="text-white font-bold text-sm tracking-widest uppercase">Upload</span>
                      </div>
                    </>
                 )}
                 <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                 <div className="absolute inset-0 border border-white/10 rounded-[2rem] pointer-events-none" />
              </label>
              <h2 className="text-4xl font-black tracking-[-0.05em] text-center text-white">{gameState?.artist?.name}</h2>
              <div className="flex items-center gap-3 mt-3">
                 <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
                 <p className="text-white/40 text-xs font-black uppercase tracking-[0.2em]">{gameState?.artist?.country} • {gameState?.artist?.gender}</p>
              </div>
            </div>

            <div className="flex-1 md:pl-16 flex flex-col justify-center items-center md:items-start text-center md:text-left relative pt-8 md:pt-0">
              <div className="mb-4 text-purple-400 font-black text-[10px] uppercase tracking-[0.5em] opacity-60">Global Presence</div>
              <div className="flex items-center gap-6 mb-8">
                 <div className="text-[100px] md:text-[140px] font-black leading-none tracking-tighter text-white drop-shadow-2xl">{dateDayStr}</div>
                 <div className="flex flex-col items-start space-y-1">
                   <div className="text-3xl md:text-5xl font-black text-white/80 uppercase tracking-tighter leading-none">{dayName}</div>
                   <div className="text-lg md:text-xl font-bold text-purple-400/60 lowercase tracking-widest">{monthYearStr}</div>
                 </div>
              </div>
              <div className="inline-flex items-center gap-3 bg-white/5 px-6 py-2 rounded-full border border-white/10 overflow-hidden relative group/status">
                <div className="absolute inset-0 bg-green-500/5 translate-x-[-100%] group-hover/status:translate-x-0 transition-transform duration-500" />
                <span className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">Vitals:</span>
                <span className="text-green-400 font-black text-[10px] tracking-[0.2em] uppercase relative z-10">Peak Condition</span>
              </div>
            </div>
         </div>


         {/* Artist Level System */}
         <div className="w-full border-t border-white/10 pt-6 mt-auto">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                 <ArrowUpCircle className="w-6 h-6 text-yellow-500" />
                 <h3 className="text-lg font-bold">Artist Level: <span className="text-purple-400">{gameState?.artist?.level || 0}</span> <span className="text-white/40 text-sm">/ 10</span></h3>
              </div>
              <span className="text-xs font-mono uppercase text-white/40 tracking-widest leading-tight text-right">Req. Lvl {(gameState?.artist?.level || 0) + 1}</span>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {(() => {
               const currentLvl = gameState?.artist?.level || 0;
               if (currentLvl >= 10) {
                 return <div className="col-span-full text-green-400 font-bold text-center p-4 bg-white/5 rounded-xl border border-white/10">Max Level Reached!</div>;
               }
               
               const reqs = LEVEL_REQUIREMENTS[currentLvl + 1];
               const completedGigs = (gameState?.gigs || []).filter(g => g.completed).length;
               
               const conditions = [
                 { name: "Gigs", current: completedGigs, required: reqs.gigs },
                 { name: "Performance", current: gameState?.skills?.performance || 0, required: reqs.performance },
                 { name: "Vocals", current: gameState?.skills?.vocals || 0, required: reqs.vocals },
                 { name: "Songwriting", current: gameState?.skills?.songwriting || 0, required: reqs.songwriting },
                 { name: "Production", current: gameState?.skills?.production || 0, required: reqs.production },
                 { name: "Streams", current: gameState?.stats?.streams || 0, required: reqs.streams, format: true },
                 { name: "Sales", current: gameState?.stats?.sales || 0, required: reqs.sales, format: true }
               ];

               return conditions.filter(c => c.required > 0).map((c, i) => (
                 <div key={i} className="bg-black/30 p-2 md:p-3 rounded-xl border border-white/10 relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 h-1 bg-purple-500 transition-all" style={{ width: `${Math.min(100, (c.current / c.required) * 100)}%` }}></div>
                    <div className="text-[10px] uppercase font-bold text-white/50">{c.name}</div>
                    <div className="text-xs md:text-sm font-mono mt-1 flex flex-col md:flex-row md:items-baseline gap-1">
                      <span className={c.current >= c.required ? 'text-green-400 font-bold' : 'text-white'}>
                         {c.format ? c.current.toLocaleString() : c.current}
                      </span>
                      <span className="text-white/40 text-[10px] md:text-xs text-nowrap whitespace-nowrap">/ {c.format ? c.required.toLocaleString() : c.required}</span>
                    </div>
                 </div>
               ));
             })()}
           </div>
         </div>
      </div>

      {/* Action Area */}
      <div className="md:h-32 flex flex-col md:flex-row items-center justify-end gap-4 md:gap-6 shrink-0 z-20 mt-6">
        <div className="flex-1 text-white/40 text-sm text-center md:text-left w-full flex flex-col md:flex-row items-center md:items-start justify-start gap-4">
           {(() => {
              if (!gameState) return null;
              const currentDate = new Date(gameState.time.startDate);
              currentDate.setDate(currentDate.getDate() + gameState.time.daysPassed);
              const m = currentDate.getMonth();
              const d = currentDate.getDate();
              if (m === 11 && d >= 10 && d <= 31) {
                 return (
                    <button onClick={onOpenWrapped} className="relative group overflow-hidden bg-gradient-to-r from-[#FF00D6] to-[#01F0FF] rounded-2xl p-[2px] transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,0,214,0.3)]">
                       <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                       <div className="bg-black/80 backdrop-blur-sm px-6 py-3 rounded-xl flex items-center gap-3">
                          <Music className="w-5 h-5 text-white animate-bounce" />
                          <div className="flex flex-col items-start leading-tight">
                             <span className="text-white font-black text-sm uppercase tracking-widest">Artist Wrapped</span>
                             <span className="text-white/60 text-[10px] font-bold">Your Year in Review</span>
                          </div>
                       </div>
                    </button>
                 );
              }
              return (
                 <span className="max-w-md hidden md:block mt-auto text-right md:text-left">
                    Ready for your next session? Advancing time will progress your career and potential chart performance.
                 </span>
              );
           })()}
        </div>
        <div className="flex gap-4 w-full md:w-auto h-20 md:h-full">
          <button 
            onClick={() => setIsAutoAdvancing(prev => !prev)}
            className={`w-20 md:w-24 h-full flex flex-col items-center justify-center rounded-2xl transition-all border ${isAutoAdvancing ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/60 hover:text-white'} active:scale-95`}
          >
            {isAutoAdvancing ? <Pause className="w-6 h-6 mb-1" /> : <FastForward className="w-6 h-6 mb-1" />}
            <span className="text-[9px] font-black tracking-widest uppercase">
               {isAutoAdvancing ? 'Stop' : 'Auto'}
            </span>
          </button>
          
          <button 
            onClick={handleNextDay}
            disabled={isLoadingNextDay || isAutoAdvancing}
            className={`flex-1 md:w-auto md:px-16 h-full ${(isLoadingNextDay) ? 'bg-purple-900 border border-purple-500' : isAutoAdvancing ? 'bg-white/20 text-white/40 border border-white/10' : 'bg-white hover:bg-purple-400'} ${isAutoAdvancing ? '' : 'text-black'} font-black text-xl rounded-2xl transition-all ${isAutoAdvancing ? '' : 'shadow-[0_0_40px_rgba(255,255,255,0.1)]'} group flex flex-col items-center justify-center ${!(isLoadingNextDay || isAutoAdvancing) && 'active:scale-95'}`}
          >
            {isLoadingNextDay && !isAutoAdvancing ? (
              <div className="flex flex-col items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-1" />
                <span className="text-[10px] uppercase tracking-widest text-white/60">Processing</span>
              </div>
            ) : (
              <>
                NEXT DAY
                <span className={`block text-[10px] font-bold tracking-widest uppercase mt-1 ${isAutoAdvancing ? 'text-white/30' : 'text-black/50 group-hover:text-black'}`}>
                  {isAutoAdvancing ? 'Auto Advancing' : 'Press to Advance'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {showSchedule && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-[#050507] border border-white/10 rounded-3xl p-8 max-w-lg w-full relative max-h-[80vh] flex flex-col">
              <button 
                onClick={() => setShowSchedule(false)}
                className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold tracking-tighter italic text-purple-400 mb-6 uppercase">Upcoming Schedule</h2>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                 {upcomingEvents.length === 0 ? (
                   <div className="text-center text-white/40 font-mono text-sm uppercase p-8 border border-white/5 rounded-xl bg-white/5">
                     Your schedule is empty.
                   </div>
                 ) : (
                   upcomingEvents.map((evt, idx) => (
                     <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center justify-center shrink-0">
                           <span className="text-[10px] text-white/40 uppercase font-bold">{evt.date.toLocaleDateString('en-US', { month: 'short' })}</span>
                           <span className="text-lg font-mono font-bold">{evt.date.getDate()}</span>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                           <span className="font-bold text-sm tracking-wide truncate">{evt.title}</span>
                           <span className={`text-[10px] uppercase tracking-widest flex items-center gap-1 mt-1 ${evt.type === 'release' ? 'text-purple-400' : 'text-blue-400'}`}>
                             {evt.type === 'release' ? <Music className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                             {evt.type}
                           </span>
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </div>
        </div>
      )}

      {showLevelModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-[#050507] border border-white/10 rounded-3xl p-8 max-w-4xl w-full relative max-h-[85vh] flex flex-col">
              <button 
                onClick={() => setShowLevelModal(false)}
                className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-3xl font-bold tracking-tighter italic text-purple-400 mb-2 uppercase">Artist Level Requirements</h2>
              <p className="text-white/60 text-sm mb-6">Complete all requirements of your current level to advance to the next stage of your career.</p>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                 {[1,2,3,4,5,6,7,8,9,10].map(lvl => {
                    const reqs = LEVEL_REQUIREMENTS[lvl];
                    const isCurrent = (gameState?.artist?.level || 0) + 1 === lvl;
                    const isPast = (gameState?.artist?.level || 0) >= lvl;
                    
                    return (
                      <div key={lvl} className={`border ${isCurrent ? 'border-yellow-500/50 bg-yellow-500/5' : isPast ? 'border-green-500/20 bg-green-500/5 opacity-50' : 'border-white/10 bg-white/5'} p-6 rounded-2xl`}>
                         <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-xl font-bold ${isCurrent ? 'text-yellow-500' : isPast ? 'text-green-500' : 'text-white'}`}>Level {lvl}</h3>
                            {isPast && <div className="text-xs font-bold uppercase tracking-widest text-green-500 bg-green-500/20 px-3 py-1 rounded-full">Completed</div>}
                            {isCurrent && <div className="text-xs font-bold uppercase tracking-widest text-yellow-500 bg-yellow-500/20 px-3 py-1 rounded-full animate-pulse">Current Target</div>}
                         </div>
                         
                         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {reqs.gigs > 0 && (
                              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                 <span className="text-[10px] uppercase tracking-widest text-white/40">Gigs</span>
                                 <div className="font-mono text-lg">{isCurrent ? Math.min((gameState?.gigs || []).filter(g=>g.completed).length, reqs.gigs) : isPast ? reqs.gigs : 0} <span className="text-white/40 text-sm">/ {reqs.gigs}</span></div>
                              </div>
                            )}
                            {reqs.performance > 0 && (
                              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                 <span className="text-[10px] uppercase tracking-widest text-white/40">Performance</span>
                                 <div className="font-mono text-lg">{isCurrent ? Math.min(gameState?.skills?.performance || 0, reqs.performance) : isPast ? reqs.performance : 0} <span className="text-white/40 text-sm">/ {reqs.performance}</span></div>
                              </div>
                            )}
                            {reqs.vocals > 0 && (
                              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                 <span className="text-[10px] uppercase tracking-widest text-white/40">Vocals</span>
                                 <div className="font-mono text-lg">{isCurrent ? Math.min(gameState?.skills?.vocals || 0, reqs.vocals) : isPast ? reqs.vocals : 0} <span className="text-white/40 text-sm">/ {reqs.vocals}</span></div>
                              </div>
                            )}
                            {reqs.songwriting > 0 && (
                              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                 <span className="text-[10px] uppercase tracking-widest text-white/40">Songwriting</span>
                                 <div className="font-mono text-lg">{isCurrent ? Math.min(gameState?.skills?.songwriting || 0, reqs.songwriting) : isPast ? reqs.songwriting : 0} <span className="text-white/40 text-sm">/ {reqs.songwriting}</span></div>
                              </div>
                            )}
                            {reqs.production > 0 && (
                              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                 <span className="text-[10px] uppercase tracking-widest text-white/40">Production</span>
                                 <div className="font-mono text-lg">{isCurrent ? Math.min(gameState?.skills?.production || 0, reqs.production) : isPast ? reqs.production : 0} <span className="text-white/40 text-sm">/ {reqs.production}</span></div>
                              </div>
                            )}
                            {reqs.streams > 0 && (
                              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                 <span className="text-[10px] uppercase tracking-widest text-white/40">Streams</span>
                                 <div className="font-mono text-lg">
                                    {isCurrent ? Math.min(gameState?.stats?.streams || 0, reqs.streams).toLocaleString() : isPast ? reqs.streams.toLocaleString() : 0} 
                                    <span className="text-white/40 text-[10px] block lg:inline lg:ml-1">/ {reqs.streams.toLocaleString()}</span>
                                 </div>
                              </div>
                            )}
                            {reqs.sales > 0 && (
                              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                 <span className="text-[10px] uppercase tracking-widest text-white/40">Sales</span>
                                 <div className="font-mono text-lg">
                                    {isCurrent ? Math.min(gameState?.stats?.sales || 0, reqs.sales).toLocaleString() : isPast ? reqs.sales.toLocaleString() : 0} 
                                    <span className="text-white/40 text-[10px] block lg:inline lg:ml-1">/ {reqs.sales.toLocaleString()}</span>
                                 </div>
                              </div>
                            )}
                         </div>
                      </div>
                    )
                 })}
              </div>
           </div>
        </div>
      )}

      {/* Inbox Modal */}
      {showInbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-[#0A0A0D] border border-white/10 rounded-[2rem] p-6 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl relative">
              <button 
                onClick={() => {
                    setShowInbox(false);
                    setSelectedEmail(null);
                }}
                className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-full transition-colors"
              >
                 <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-2xl font-bold tracking-tighter italic text-blue-400 mb-6 uppercase flex items-center gap-3">
                 <Mail className="w-6 h-6" /> INBOX
              </h2>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                 {selectedEmail ? (() => {
                     const email = gameState?.emails?.find(e => e.id === selectedEmail);
                     if (!email) {
                         setSelectedEmail(null);
                         return null;
                     }
                     return (
                         <div className="flex flex-col animate-in fade-in zoom-in-95">
                             <button onClick={() => setSelectedEmail(null)} className="mb-4 text-white/50 hover:text-white text-sm flex items-center gap-2 font-medium w-fit transition-colors">
                                 ← Back to Inbox
                             </button>
                             <div className="flex flex-col mb-6 pb-6 border-b border-white/10">
                                 <span className="text-blue-400 font-bold tracking-widest text-xs uppercase mb-1">{email.sender}</span>
                                 <span className="text-white font-bold text-2xl mb-2 leading-tight">{email.subject}</span>
                                 <span className="text-white/40 text-[11px] tracking-widest uppercase">
                                     {new Date(email.dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                 </span>
                             </div>
                             <div className="text-white/80 text-[15px] leading-relaxed whitespace-pre-wrap">
                                 {email.body}
                             </div>
                             
                             {email.collabOffer && email.collabOffer.status === 'pending' && (
                                 <div className="mt-8 border border-white/10 rounded-2xl p-6 bg-white/5 flex flex-col sm:flex-row items-center gap-6">
                                     <img src={email.collabOffer.coverArt} alt="Collab Cover" className="w-24 h-24 rounded-lg object-cover shadow-lg" />
                                     <div className="flex-1 text-center sm:text-left">
                                         <h3 className="font-bold text-lg">{email.collabOffer.songTitle}</h3>
                                         <p className="text-white/60 text-sm mb-4">{email.collabOffer.npcArtist} (feat. {gameState?.artist?.name || 'You'})</p>
                                         <div className="text-green-400 font-bold mb-4 font-mono">Fee: ${email.collabOffer.fee.toLocaleString()}</div>
                                         <div className="flex gap-3 justify-center sm:justify-start">
                                             <button onClick={() => handleAcceptCollab(email.id)} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold text-sm transition-colors text-white">Accept</button>
                                             <button onClick={() => handleRejectCollab(email.id)} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-sm transition-colors text-white">Reject</button>
                                         </div>
                                     </div>
                                 </div>
                             )}
                             {email.contractOffer && email.contractOffer.status === 'pending' && (
                                 <div className="mt-8 border border-white/10 rounded-3xl p-6 bg-gradient-to-b from-blue-900/40 to-[#050507] flex flex-col gap-6 relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px]"></div>
                                     <h3 className="font-black text-2xl uppercase tracking-tighter italic text-blue-400">RECORDING CONTRACT</h3>
                                     
                                     <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black/50 border border-white/5 p-4 rounded-xl">
                                            <div className="text-[10px] text-white/40 tracking-widest uppercase mb-1">Contract Type</div>
                                            <div className="font-bold">{email.contractOffer.type === 'album' ? 'Multi-Album Deal' : 'Term Deal (Years)'}</div>
                                        </div>
                                        <div className="bg-black/50 border border-white/5 p-4 rounded-xl">
                                            <div className="text-[10px] text-white/40 tracking-widest uppercase mb-1">Duration / Obligation</div>
                                            <div className="font-bold text-lg">{email.contractOffer.type === 'album' ? `${email.contractOffer.requiredAlbums} Albums` : `${email.contractOffer.duration} Years`}</div>
                                            {(email.contractOffer.requiredSingles || 0) > 0 && <div className="text-xs text-white/60">Must deliver {email.contractOffer.requiredSingles} Singles</div>}
                                        </div>
                                        <div className="bg-black/50 border border-white/5 p-4 rounded-xl">
                                            <div className="text-[10px] text-white/40 tracking-widest uppercase mb-1">Advance Payment</div>
                                            <div className="font-black text-green-400 text-xl font-mono">${email.contractOffer.advanceMoney?.toLocaleString()}</div>
                                        </div>
                                        <div className="bg-black/50 border border-white/5 p-4 rounded-xl">
                                            <div className="text-[10px] text-white/40 tracking-widest uppercase mb-1">Label Royalty Cut</div>
                                            <div className="font-black text-red-400 text-xl font-mono">{email.contractOffer.royaltyCut}%</div>
                                        </div>
                                     </div>

                                     <div className="bg-blue-500/10 p-4 rounded-xl text-sm text-blue-200">
                                         <strong className="text-blue-300">Recoupment Note:</strong> The advance payment of ${email.contractOffer.advanceMoney?.toLocaleString()} is a 100% recoupable debt. You will not earn royalties from this label until the advance has been paid back in full from your share of revenue.
                                     </div>

                                     <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                                         <button onClick={() => {
                                             
                                                const currentDateObj = new Date(gameState!.time.startDate);
                                                currentDateObj.setDate(currentDateObj.getDate() + gameState!.time.daysPassed);
                                                
                                                setGameState(prev => {
                                                    if (!prev) return prev;
                                                    let emails = [...(prev.emails || [])];
                                                    const idx = emails.findIndex(e => e.id === email.id);
                                                    if (idx > -1) {
                                                        emails[idx] = { ...emails[idx], contractOffer: { ...emails[idx].contractOffer!, status: 'accepted' } };
                                                    }
                                                    return {
                                                        ...prev,
                                                        emails,
                                                        artist: {
                                                            ...prev.artist!,
                                                            labelContract: {
                                                                labelId: email.contractOffer!.labelId,
                                                                type: email.contractOffer!.type as 'album' | 'year',
                                                                duration: email.contractOffer!.duration as number,
                                                                requiredAlbums: email.contractOffer!.requiredAlbums as number,
                                                                requiredEPs: email.contractOffer!.requiredEPs as number,
                                                                requiredSingles: email.contractOffer!.requiredSingles as number,
                                                                deliveredAlbums: 0,
                                                                deliveredEPs: 0,
                                                                deliveredSingles: 0,
                                                                advanceMoney: email.contractOffer!.advanceMoney as number,
                                                                unrecoupedBalance: email.contractOffer!.advanceMoney as number, // Full advance must be recouped
                                                                royaltyCut: email.contractOffer!.royaltyCut as number,
                                                                revenueGeneratedForLabel: 0,
                                                                signedDate: currentDateObj.toISOString()
                                                            }
                                                        },
                                                        stats: {
                                                            ...prev.stats,
                                                            money: prev.stats.money + (email.contractOffer?.advanceMoney || 0)
                                                        }
                                                    }
                                                });
                                                
                                                
                                         }} className="flex-1 py-4 bg-white hover:bg-gray-200 text-black rounded-xl font-black text-lg transition-colors shadow-lg">Sign Contract</button>
                                         <button onClick={() => {
                                              
                                                  setGameState(prev => {
                                                      if (!prev) return prev;
                                                      let emails = [...(prev.emails || [])];
                                                      const idx = emails.findIndex(e => e.id === email.id);
                                                      
                                                      if (idx > -1) {
                                                          const success = Math.random() > 0.3; // 70% chance of success
                                                          if (success) {
                                                              const oldOffer = emails[idx].contractOffer!;
                                                              emails[idx] = { 
                                                                  ...emails[idx], 
                                                                  subject: `(Renegotiated) ${emails[idx].subject}`,
                                                                  body: `We respect the hustle. We've updated the contract with better terms for you.\n\nTake a look and let us know.`,
                                                                  contractOffer: { 
                                                                    ...oldOffer, 
                                                                    royaltyCut: Math.max(10, oldOffer.royaltyCut - (Math.floor(Math.random() * 10) + 5)),
                                                                    advanceMoney: oldOffer.advanceMoney! + Math.floor(Math.random() * 50000)
                                                                  } 
                                                              };
                                                              
                                                          } else {
                                                              emails[idx] = { 
                                                                  ...emails[idx], 
                                                                  contractOffer: { ...emails[idx].contractOffer!, status: 'rejected' },
                                                                  body: "We couldn't reach an agreement on the terms. We are pulling our offer. Best of luck.",
                                                              };
                                                              
                                                          }
                                                      }
                                                      
                                                      return { ...prev, emails };
                                                  });
                                              }} className="px-6 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors">Negotiate</button>
                                         <button onClick={() => {
                                             setGameState(prev => {
                                                 if (!prev) return prev;
                                                 let emails = [...(prev.emails || [])];
                                                 const idx = emails.findIndex(e => e.id === email.id);
                                                 if (idx > -1) {
                                                     emails[idx] = { ...emails[idx], contractOffer: { ...emails[idx].contractOffer!, status: 'rejected' } };
                                                 }
                                                 return { ...prev, emails };
                                             });
                                         }} className="px-6 py-4 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-xl font-bold transition-colors">Decline Deal</button>
                                     </div>
                                 </div>
                             )}
                             {email.contractOffer && email.contractOffer.status !== 'pending' && (
                                 <div className="mt-8 p-4 text-center rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm italic">
                                     You have {email.contractOffer.status} this recording contract.
                                 </div>
                             )}
                             {email.collabOffer && email.collabOffer.status !== 'pending' && (
                                 <div className="mt-8 p-4 text-center rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm italic">
                                     You have {email.collabOffer.status} this collaboration offer.
                                 </div>
                             )}
                         </div>
                     );
                 })() : (!gameState?.emails || gameState.emails.length === 0) ? (
                    <div className="text-center py-12">
                       <Mail className="w-12 h-12 text-white/10 mx-auto mb-4" />
                       <div className="text-white/40 tracking-widest uppercase text-sm">Your inbox is empty</div>
                    </div>
                 ) : (
                    gameState.emails.map(email => (
                       <button 
                          key={email.id} 
                          onClick={() => setSelectedEmail(email.id)}
                          className="w-full relative text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-5 flex flex-col transition-all group"
                       >
                          <div className="flex justify-between items-start w-full">
                             <div className="flex flex-col pr-4">
                                <span className="text-blue-400 font-bold tracking-widest text-[10px] uppercase mb-1">{email.sender}</span>
                                <span className={`text-white font-bold text-[15px] group-hover:text-blue-300 transition-colors ${email.isRead ? 'opacity-80' : ''}`}>{email.subject}</span>
                             </div>
                             <span className="text-white/40 text-[10px] tracking-widest uppercase whitespace-nowrap mt-1">
                                {new Date(email.dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                             </span>
                          </div>
                          {!email.isRead && (
                             <span className="absolute top-5 right-5 w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                       </button>
                    ))
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
