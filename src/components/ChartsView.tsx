import React, { useState, useMemo } from 'react';
import { GameState } from '../types';
import { Calendar, Info, Share, Star, Plus, ArrowDown, ArrowUp, ArrowRight, Music2, X, History, Menu, Search, ChevronLeft } from 'lucide-react';
import { computeCharts } from '../chartUtils';
import { ChartHistoryView } from './ChartHistoryView';
import { NPC_ARTISTS } from '../constants';
import { ARTIST_IMAGES } from '../artistImages';

interface ChartsViewProps {
  gameState: GameState;
  onClose?: () => void;
}


type ChartType = 'Hot100' | 'Global200Single' | 'Global200Album' | 'RegionAmerica' | 'RegionLatinAmerica' | 'RegionEurope';

export function ChartsView({ gameState, onClose }: ChartsViewProps) {
  const [activeChart, setActiveChart] = useState<ChartType>('Hot100');
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [viewMode, setViewMode] = useState<'home' | 'full'>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Chart Logic
  const chartsData = useMemo(() => {
     if (gameState.lastComputedCharts) {
        const today = new Date(gameState.time.startDate);
        today.setDate(today.getDate() + gameState.time.daysPassed);
        return { charts: gameState.lastComputedCharts, today };
     }
     return computeCharts(gameState);
  }, [gameState]);

  const tabs = [
    { id: 'Hot100', label: 'HOT 100', shortLabel: 'Hot 100', limit: 100 },
    { id: 'Global200Album', label: 'BILLBOARD 200', shortLabel: 'Billboard 200', limit: 200 },
    { id: 'Global200Single', label: 'GLOBAL 200', shortLabel: 'Global 200', limit: 200 },
    { id: 'RegionAmerica', label: 'US TOP 100', shortLabel: 'US 100', limit: 100 },
    { id: 'RegionLatinAmerica', label: 'LATIN TOP 100', shortLabel: 'Latin 100', limit: 100 },
    { id: 'RegionEurope', label: 'EUROPE TOP 100', shortLabel: 'Euro 100', limit: 100 }
  ] as const;

  const currentData = chartsData.charts[activeChart] || [];
  const currentTabInfo = tabs.find(t => t?.id === activeChart);
  
  const isAlbumChart = activeChart === 'Global200Album';
  const formatStat = (val: number) => {
     return Math.floor(val).toLocaleString();
  };
  
  const formattedDate = chartsData.today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  const formattedDateShort = chartsData.today.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });

  // Fallback news generation based on game state
  const newsItems = useMemo(() => {
     const hot100 = chartsData.charts['Hot100'] || [];
     const bb200 = chartsData.charts['Global200Album'] || [];
     const playerReleases = gameState.releases.filter(r => !(r as any).isNPCRelease && r.status === 'Published');
     const latestPlayerRelease = playerReleases[playerReleases.length - 1];
     
     const news: { title: string, image?: string, tag?: string }[] = [];

     const getArtistImage = (artistName: string) => {
        if (artistName === gameState.artist?.name || artistName.includes(gameState.artist?.name || '')) return gameState.artist?.image;
        if (artistName) {
           const mainArtist = artistName.split(/ Ft\.| ft\.| feat\.| Feat\.| x | X | & |, /)[0].trim();
           return ARTIST_IMAGES[mainArtist] || null;
        }
        return null;
     };
     
     if (hot100.length > 0) {
        if (hot100[0].isNew) {
           news.push({ title: `Massive Debut! ${hot100[0].artist}'s "${hot100[0].title}" Enters Hot 100 at No. 1!`, image: getArtistImage(hot100[0].artist), tag: 'CHARTS' });
        } else {
           news.push({ title: `${hot100[0].artist} Continues to Dominate the Hot 100 with "${hot100[0].title}"`, image: getArtistImage(hot100[0].artist), tag: 'CHARTS' });
        }
     }
     
     if (bb200.length > 0 && bb200[0].isNew) {
        news.push({ title: `${bb200[0].artist} Earns First No. 1 Album with '${bb200[0].title}'`, image: getArtistImage(bb200[0].artist), tag: 'MILESTONE' });
     }

     if (latestPlayerRelease) {
       news.push({ title: `${gameState.artist?.name} Surprises Fans with New ${latestPlayerRelease.type} "${latestPlayerRelease.title}"`, image: getArtistImage(gameState.artist?.name || ''), tag: 'RELEASE' });
     }
     
     if (gameState.grammys && gameState.grammys.results.length > 0) {
         news.push({ title: `Full List of ${gameState.grammys.year} Grammy Award Winners & Nominations`, image: getArtistImage('Beyoncé') || undefined, tag: 'AWARDS' });
     }
     
     if (hot100.length > 0) {
        const biggestJump = [...hot100].sort((a,b) => b.movement - a.movement)[0];
        if (biggestJump && biggestJump.movement > 10) {
           news.push({ title: `"${biggestJump.title}" by ${biggestJump.artist} Rockets Up the Charts, Gaining ${biggestJump.movement} Spots`, image: getArtistImage(biggestJump.artist), tag: 'TRENDING' });
        }
     }
     
     // fallbacks if not enough news
     if (news.length < 5) news.push({ title: `Everything You Need To Know About The Next World Tour Announcements`, image: getArtistImage('Taylor Swift') || undefined, tag: 'TOURING' });
     if (news.length < 5) news.push({ title: `Top 10 Emerging Artists To Watch This Month`, image: getArtistImage('Billie Eilish') || undefined, tag: 'DISCOVERY' });
     if (news.length < 5) news.push({ title: `Industry Experts Predict Next Year's Top Streaming Records`, image: getArtistImage('Drake') || undefined, tag: 'BUSINESS' });

     // deduplicate
     const uniqueNews = [];
     const titles = new Set();
     for (const n of news) {
        if (!titles.has(n.title)) {
           uniqueNews.push(n);
           titles.add(n.title);
        }
     }

     return uniqueNews;
  }, [chartsData, gameState]);
  
  const mainNews = newsItems[0];
  const latestNews = newsItems.slice(1, 4);
  const trendingNews = newsItems.slice(4, 9);

  if (isViewingHistory) {
     return <ChartHistoryView gameState={gameState} onClose={() => setIsViewingHistory(false)} />;
  }

  const renderHeader = (isHome: boolean) => (
    <div className="flex items-center justify-between px-4 py-4 border-b border-black sticky top-0 bg-[#f2f0eb] z-40">
       <div className="flex gap-4 items-center">
         <button onClick={() => setIsMenuOpen(true)}>
            <Menu className="w-8 h-8 text-black" strokeWidth={1.5} />
         </button>
         {!isHome && (
            <button onClick={() => setViewMode('home')}>
                <ChevronLeft className="w-8 h-8 text-black" strokeWidth={1.5} />
            </button>
         )}
       </div>
       <h1 className="text-4xl font-black tracking-tighter lowercase scale-y-110" style={{ fontFamily: 'Impact, sans-serif' }}>
          billboard
       </h1>
       <div className="flex gap-4 items-center">
          <button>
             <Search className="w-7 h-7 text-black" strokeWidth={1.5} />
          </button>
          {onClose && (
             <button onClick={onClose} className="rounded-full bg-black text-white p-1">
                <X className="w-5 h-5" />
             </button>
          )}
       </div>
    </div>
  );

  const renderBurgerMenu = () => {
     if (!isMenuOpen) return null;
     return (
        <div className="fixed inset-0 z-[300] bg-[#f2f0eb] flex flex-col text-black font-sans overflow-y-auto">
           <div className="flex items-center justify-between px-4 py-4 border-b border-black sticky top-0 bg-[#f2f0eb]">
             <button onClick={() => setIsMenuOpen(false)}>
                <X className="w-8 h-8 text-black" strokeWidth={1.5} />
             </button>
             <h1 className="text-4xl font-black tracking-tighter lowercase scale-y-110" style={{ fontFamily: 'Impact, sans-serif' }}>
                billboard
             </h1>
             <button>
                <Search className="w-7 h-7 text-black" strokeWidth={1.5} />
             </button>
           </div>
           
           <div className="flex gap-4 p-4 border-b border-gray-300">
               <button className="flex-1 bg-black text-white font-bold py-3 uppercase text-sm tracking-widest">Subscribe</button>
               <button className="flex-1 bg-black text-white font-bold py-3 uppercase text-sm tracking-widest">Login</button>
           </div>
           
           <div className="bg-[#00f878] flex items-center justify-between px-6 py-5 border-b border-gray-300">
              <span className="font-extrabold text-2xl tracking-tighter uppercase" style={{ fontFamily: 'Impact, sans-serif' }}>CHARTS</span>
              <span className="text-3xl font-light">-</span>
           </div>
           
           <div className="flex flex-col text-lg font-bold text-gray-700 bg-white">
               <button 
                  onClick={() => { setViewMode('home'); setIsMenuOpen(false); }}
                  className="text-left px-6 py-5 border-b border-gray-200 hover:bg-black/5 flex items-center justify-between"
               >
                  All Charts Home
               </button>
               {tabs.map(tab => (
                 <button 
                    key={tab.id}
                    onClick={() => { setActiveChart(tab.id); setViewMode('full'); setIsMenuOpen(false); }}
                    className="text-left px-6 py-5 border-b border-gray-200 hover:bg-black/5 flex items-center gap-2"
                 >
                    {tab.label}™
                 </button>
               ))}
               <button 
                  onClick={() => { setIsViewingHistory(true); setIsMenuOpen(false); }}
                  className="text-left px-6 py-5 border-b border-gray-200 hover:bg-black/5 flex items-center gap-3 text-blue-600"
               >
                  <History className="w-5 h-5" /> Chart History
               </button>
           </div>
        </div>
     );
  };

  const renderHome = () => {
     return (
        <div className="flex flex-col pb-12">
            {/* Top Story Banner */}
            {mainNews && (
               <div className="w-full relative flex flex-col items-center bg-white">
                  <div className="w-full h-64 md:h-[400px] bg-black">
                     {mainNews.image ? (
                        <img src={mainNews.image} alt="Top Story" className="w-full h-full object-cover opacity-90" />
                     ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-blue-900 to-purple-800">
                            <span className="font-extrabold text-white opacity-20 text-7xl uppercase" style={{ fontFamily: 'Impact, sans-serif' }}>billboard</span>
                        </div>
                     )}
                  </div>
                  <div className="flex justify-center -mt-3.5 relative z-10 w-full mb-4">
                     <span className="bg-[#00f878] text-black font-black uppercase px-3 py-1 text-sm tracking-widest scale-y-110" style={{ fontFamily: 'Impact, sans-serif' }}>TOP STORY</span>
                  </div>
                  <div className="text-center px-4 pt-2 pb-8 border-b border-gray-300 w-full max-w-4xl">
                     <h2 className="font-black text-4xl md:text-5xl leading-[0.9] uppercase tracking-tighter scale-y-110" style={{ fontFamily: 'Impact, sans-serif' }}>
                        {mainNews.title}
                     </h2>
                     <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-6">KATIE ATKINSON</p>
                  </div>
               </div>
            )}

            {/* Latest News */}
            <div className="px-4 py-8 bg-[#f2f0eb]">
                <h2 className="font-black text-4xl tracking-tighter uppercase mb-6" style={{ fontFamily: 'Impact, sans-serif' }}>
                   LATEST NEWS
                </h2>
                <div className="flex flex-col">
                   {latestNews.map((news, i) => (
                       <div key={i} className={`py-5 border-b border-gray-300 flex items-center justify-between gap-4 ${i === 0 ? 'border-t' : ''}`}>
                          <div className="flex flex-col flex-1">
                             {news.tag && <p className="text-[#00f878] bg-black inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-widest uppercase mb-2 w-fit">{news.tag}</p>}
                             <h3 className="font-bold text-xl md:text-2xl leading-tight mb-2 text-black hover:text-blue-600 cursor-pointer">{news.title}</h3>
                             <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">{Math.floor(Math.random() * 23 + 1)} HRS AGO</p>
                          </div>
                          {news.image && (
                             <img src={news.image} alt="" className="w-24 h-24 object-cover shadow-sm shrink-0" />
                          )}
                       </div>
                   ))}
                </div>
            </div>

            {/* Chart Preview Section (Green Area) */}
            <div className="bg-[#00f878] w-full pt-6 pb-8 border-y border-black">
                {/* Horizontal Chart Tabs */}
                <div className="flex overflow-x-auto hide-scrollbar px-4 pb-4 gap-2 border-b border-black/10">
                   {tabs.slice(0, 4).map(tab => (
                       <button
                          key={tab.id}
                          onClick={() => setActiveChart(tab.id as ChartType)}
                          className={`px-4 py-2 text-sm font-bold border-2 rounded-md transition-colors whitespace-nowrap ${
                             activeChart === tab.id
                             ? 'bg-black text-white border-black'
                             : 'bg-transparent text-black border-black hover:bg-black/10'
                          }`}
                       >
                          {tab.shortLabel}
                       </button>
                   ))}
                </div>
                
                {/* Top 5 list */}
                <div className="px-4 py-4 flex flex-col gap-0 border-b border-black/10">
                   {currentData.slice(0, 5).map((item, index) => (
                       <div key={index} className="flex flex-row items-center justify-start py-3 border-b border-black/10 last:border-b-0 cursor-pointer hover:bg-black/5"
                            onClick={() => setViewMode('full')}
                       >
                           {/* Rank */}
                           <div className="w-10 font-black text-3xl tracking-tighter shrink-0" style={{ fontFamily: 'Impact, sans-serif' }}>
                               {index + 1}
                           </div>
                           {/* Image */}
                           <div className="w-16 h-16 bg-white shrink-0 shadow-sm overflow-hidden flex items-center justify-center mr-4">
                               {item.coverImage ? (
                                   <img src={item.coverImage} alt="" className="w-full h-full object-cover" />
                               ) : (
                                   <div className="w-full h-full bg-white flex items-center justify-center">
                                      <span className="font-bold text-black/50 text-[8px] tracking-tight text-center uppercase">billboard</span>
                                   </div>
                               )}
                           </div>
                           {/* Details */}
                           <div className="flex flex-col min-w-0 pr-2 pt-1 flex-1">
                               <h4 className="font-extrabold text-base md:text-lg leading-tight truncate uppercase">{item.title}</h4>
                               <p className="font-medium text-black/70 text-sm truncate uppercase">{item.artist}</p>
                           </div>
                       </div>
                   ))}
                </div>

                <div className="px-4 pt-6 flex items-center justify-between">
                   <div className="text-xs font-bold tracking-[0.2em] uppercase text-black/70">
                      WEEK OF {formattedDateShort}
                   </div>
                   <button 
                      onClick={() => setViewMode('full')}
                      className="bg-white text-black text-xs font-bold uppercase tracking-widest px-4 py-2 border border-black hover:bg-gray-100"
                   >
                      VIEW ALL
                   </button>
                </div>
            </div>

            {/* Trending Section */}
            <div className="px-4 py-8 bg-[#f2f0eb]">
                <h2 className="font-black text-4xl tracking-tighter uppercase mb-6 text-blue-600" style={{ fontFamily: 'Impact, sans-serif' }}>
                   TRENDING
                </h2>
                <div className="flex flex-col gap-6">
                   {trendingNews.map((news, i) => (
                       <div key={i} className="flex items-start gap-4 border-b border-gray-300 pb-6">
                           <div className="font-black text-3xl tracking-tighter text-blue-600 underline underline-offset-4 decoration-4" style={{ fontFamily: 'Impact, sans-serif' }}>
                              {i + 1}
                           </div>
                           <div className="flex flex-col pt-1">
                              <h3 className="font-bold text-lg md:text-xl leading-tight mb-2 hover:text-blue-600 cursor-pointer">{news.title}</h3>
                              <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">{formattedDateShort}</p>
                           </div>
                       </div>
                   ))}
                </div>
            </div>
        </div>
     );
  }

  const renderFullChart = () => {
     return (
        <div className="flex flex-col bg-[#f2f0eb]">
            {/* Header Section */}
            <div className="pt-8 pb-4 px-4 flex flex-col items-center justify-center bg-white border-b border-gray-200">
               <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-center scale-y-110 text-black" style={{ fontFamily: 'Impact, sans-serif' }}>
                  {currentTabInfo?.label.replace('HOT 100', 'HOT 100™')}
               </h1>
               <div className="text-sm md:text-base font-bold tracking-[0.2em] uppercase mt-6 mb-2 text-gray-500 hover:text-black cursor-pointer">
                  WEEK OF {formattedDate}
               </div>
            </div>

            {/* Top Action Bar (Green) */}
            <div className="bg-[#00f878] w-full flex justify-center items-center py-3 gap-16 sticky top-16 md:top-20 z-30 shadow-sm border-b border-[#00f878]">
              <button className="text-black hover:opacity-70 transition-opacity"><Calendar className="w-7 h-7" strokeWidth={1.5} /></button>
              <button className="text-black hover:opacity-70 transition-opacity"><Info className="w-7 h-7" strokeWidth={1.5} /></button>
              <button className="text-black hover:opacity-70 transition-opacity"><Share className="w-7 h-7" strokeWidth={1.5} /></button>
            </div>

            {/* Tabs / Filters (Desktop might want it, but mobile Billboard hides it inside menu. We will keep horizontal tabs for quick switching if requested) */}
            <div className="bg-[#f2f0eb] border-b border-gray-300 flex overflow-x-auto hide-scrollbar">
               {tabs.map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveChart(tab.id as ChartType)}
                   className={`px-6 py-4 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                      activeChart === tab.id 
                      ? 'text-black border-b-[3px] border-black pt-4' 
                      : 'text-gray-400 hover:text-black hover:bg-black/5'
                   }`}
                 >
                    {tab.label}
                 </button>
               ))}
            </div>

            {/* Chart List */}
            {currentData.length === 0 && (
                <div className="text-center p-12 text-gray-400 font-bold uppercase tracking-widest text-sm">No data available yet. Release more music.</div>
            )}
            
            <div className="w-full flex flex-col bg-[#f2f0eb] max-w-5xl mx-auto">
                {/* Desktop Data Columns Header */}
                {!isAlbumChart && currentData.length > 0 && (
                   <div className="hidden md:flex items-center px-4 py-2 border-b-4 border-black text-[10px] font-black tracking-widest uppercase text-gray-500 sticky top-[138px] bg-[#f2f0eb] z-20">
                      <div className="w-16 md:w-24 text-center shrink-0">THIS<br/>WEEK</div>
                      <div className="flex-1">AWARD</div>
                      <div className="w-14 text-center shrink-0 text-black">LAST<br/>WEEK</div>
                      <div className="w-14 text-center shrink-0 ml-6 text-black">PEAK<br/>POS.</div>
                      <div className="w-14 text-center shrink-0 ml-6 text-black">WEEKS<br/>ON CHART</div>
                   </div>
                )}
                {isAlbumChart && currentData.length > 0 && (
                   <div className="hidden md:flex items-center px-4 py-2 border-b-4 border-black text-[10px] font-black tracking-widest uppercase text-gray-500 sticky top-[138px] bg-[#f2f0eb] z-20">
                      <div className="w-16 md:w-24 text-center shrink-0">THIS<br/>WEEK</div>
                      <div className="flex-1">AWARD</div>
                      <div className="w-24 text-right shrink-0 text-black">ACTIVITY</div>
                      <div className="w-24 text-right shrink-0 ml-6 text-black">ALBUMS</div>
                   </div>
                )}

                {currentData.map((item, index) => {
                   const isPlayer = item.isPlayer;
                   const isFirst = index === 0;
                   const label = isPlayer ? 'INDEPENDENT' : (item?.id?.length % 2 === 0 ? 'REPUBLIC' : 'ISLAND');

                   return (
                     <div key={`${item?.id}-${index}`} className="flex items-stretch bg-white w-full pr-4 py-3 relative group border-b border-gray-300">
                        {/* Rank and Movement */}
                        <div className="w-16 md:w-24 shrink-0 flex flex-col items-center justify-center relative">
                           {isFirst ? (
                                <span className="text-5xl md:text-6xl font-black tracking-tighter text-black" style={{ fontFamily: 'Impact, sans-serif' }}>{index + 1}</span>
                           ) : (
                                <span className="text-3xl md:text-4xl font-black mb-1 tracking-tighter text-black" style={{ fontFamily: 'Impact, sans-serif' }}>{index + 1}</span>
                           )}
                           
                           {!isAlbumChart && (
                               <div className="mt-1 flex items-center justify-center h-5">
                                  {item.isNew && !item.isReEntry ? (
                                      <span className="bg-[#ff4e00] text-white text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-widest rounded-sm">NEW</span>
                                  ) : item.isReEntry ? (
                                      <span className="bg-[#00f878] text-black text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-widest rounded-sm">RE</span>
                                  ) : item.movement > 0 ? (
                                      <div className="flex items-center gap-0.5 text-gray-500">
                                         <ArrowUp className="w-4 h-4" strokeWidth={3} />
                                         <span className="text-[10px] font-bold">{item.movement}</span>
                                      </div>
                                  ) : item.movement < 0 ? (
                                      <div className="flex items-center gap-0.5 text-gray-500">
                                         <ArrowDown className="w-4 h-4" strokeWidth={3} />
                                         <span className="text-[10px] font-bold">{Math.abs(item.movement)}</span>
                                      </div>
                                  ) : (
                                      <ArrowRight className="w-4 h-4 text-gray-300" strokeWidth={3} />
                                  )}
                               </div>
                           )}
                        </div>

                        {/* Image */}
                        <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 bg-[#f4f4f4] flex items-center justify-center overflow-hidden mr-4 md:mr-6 shadow-sm border border-black/5 self-center">
                           {item.coverImage ? (
                              <img src={item.coverImage || undefined} className="w-full h-full object-cover" alt="" />
                           ) : (
                              <div className="w-full h-full bg-[#f4f4f4] flex items-center justify-center">
                                 {isAlbumChart ? (
                                    <span className="font-bold text-black/50 text-[10px] tracking-tight text-center uppercase">billboard</span>
                                 ) : (
                                    <Music2 className="w-8 h-8 text-black/20" strokeWidth={1} />
                                 )}
                              </div>
                           )}
                        </div>

                        {/* Title and Artist Info */}
                        <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
                           <h3 className={`font-black text-lg md:text-xl truncate leading-tight text-black mb-0.5 tracking-tight ${isFirst ? 'md:text-2xl' : ''}`}>{item.title}</h3>
                           <p className="font-medium text-gray-500 text-sm truncate tracking-tight mb-0.5">{item.artist}</p>
                           <p className="font-bold text-gray-400 text-[9px] truncate uppercase tracking-widest">{label}</p>
                           
                           {/* Mobile version of stats bottom row */}
                           <div className="flex md:hidden mt-3">
                              {isAlbumChart ? (
                                  <div className="flex flex-row items-center gap-4 text-xs">
                                     <span className="font-bold text-black border-r border-gray-300 pr-4">Act: <span className="text-gray-600">{formatStat(item.activity || 0)}</span></span>
                                     <span className="font-bold text-black">Albs: <span className="text-gray-600">{formatStat(item.albums || 0)}</span></span>
                                  </div>
                              ) : (
                                  <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 tracking-wider">
                                     <span>LW <span className="text-black ml-0.5 text-xs">{item.lastPos === '-' ? '-' : item.lastPos}</span></span>
                                     <span>PK <span className="text-black ml-0.5 text-xs">{item.peakPos}</span></span>
                                     <span>WKS <span className="text-black ml-0.5 text-xs">{item.weeksOnChart}</span></span>
                                  </div>
                              )}
                           </div>
                        </div>
                        
                        {/* Desktop Data Columns */}
                        <div className="hidden md:flex items-center">
                           {isAlbumChart ? (
                              <div className="flex items-center font-bold text-base tracking-tight text-black">
                                 <div className="w-24 text-right">{formatStat(item.activity || 0)}</div>
                                 <div className="w-24 text-right ml-6">{formatStat(item.albums || 0)}</div>
                              </div>
                           ) : (
                              <div className="flex items-center font-bold text-xl tracking-tighter text-black">
                                 <div className="w-14 text-center flex justify-center items-center">
                                    <span className="text-gray-400 w-full">{item.lastPos === '-' ? '-' : item.lastPos}</span>
                                 </div>
                                 <div className="w-14 text-center ml-6 flex justify-center items-center">
                                    <span className="text-black w-full">{item.peakPos}</span>
                                 </div>
                                 <div className="w-14 text-center ml-6 flex justify-center items-center">
                                    <span className="text-gray-400 w-full">{item.weeksOnChart}</span>
                                 </div>
                              </div>
                           )}
                           
                           {/* Action button */}
                           <div className="flex items-center justify-end w-12 ml-4">
                              {isPlayer && (
                                 <button className="w-8 h-8 flex items-center justify-center rounded-full bg-black hover:bg-gray-800 transition-colors">
                                    <Star className="w-4 h-4 text-white fill-white" strokeWidth={0} />
                                 </button>
                              )}
                           </div>
                        </div>
                     </div>
                   );
                })}
            </div>
            <div className="h-12 w-full"></div>
        </div>
     );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#f2f0eb] text-black font-sans overflow-y-auto">
      {renderHeader(viewMode === 'home')}
      {renderBurgerMenu()}
      {viewMode === 'home' ? renderHome() : renderFullChart()}
    </div>
  );
}
