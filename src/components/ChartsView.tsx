import React, { useState, useMemo } from 'react';
import { GameState } from '../types';
import { Calendar, Info, Share, Star, Plus, ArrowDown, ArrowUp, ArrowRight, Music2, X, History } from 'lucide-react';
import { computeCharts } from '../chartUtils';
import { ChartHistoryView } from './ChartHistoryView';

interface ChartsViewProps {
  gameState: GameState;
  onClose?: () => void;
}

type ChartType = 'Hot100' | 'Global200Single' | 'Global200Album' | 'RegionAmerica' | 'RegionLatinAmerica' | 'RegionEurope';

export function ChartsView({ gameState, onClose }: ChartsViewProps) {
  const [activeChart, setActiveChart] = useState<ChartType>('Hot100');
  const [isViewingHistory, setIsViewingHistory] = useState(false);

  // Chart Logic
  const chartsData = useMemo(() => {
     return computeCharts(gameState);
  }, [gameState]);

  const tabs = [
    { id: 'Hot100', label: 'HOT 100', limit: 100 },
    { id: 'Global200Single', label: 'GLOBAL 200', limit: 200 },
    { id: 'Global200Album', label: 'BILLBOARD 200', limit: 200 },
    { id: 'RegionAmerica', label: 'US TOP 100', limit: 100 },
    { id: 'RegionLatinAmerica', label: 'LATIN TOP 100', limit: 100 },
    { id: 'RegionEurope', label: 'EUROPE TOP 100', limit: 100 }
  ] as const;

  const currentData = chartsData.charts[activeChart] || [];
  const currentTabInfo = tabs.find(t => t?.id === activeChart);
  
  const isAlbumChart = activeChart === 'Global200Album';
  const formatStat = (val: number) => {
     return Math.floor(val).toLocaleString();
  };
  
  // Format the date like "MAY 2, 2026"
  const formattedDate = chartsData.today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

  if (isViewingHistory) {
     return <ChartHistoryView gameState={gameState} onClose={() => setIsViewingHistory(false)} />;
  }

  return (
    <div className="fixed inset-0 z-[200] bg-[#f2f0eb] text-black font-sans overflow-y-auto">
      {onClose && (
        <button 
          onClick={onClose}
          className="fixed top-4 right-4 w-10 h-10 flex items-center justify-center bg-black/10 hover:bg-black/20 text-black rounded-full transition-colors z-[210]"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* History Button */}
      <button 
         onClick={() => setIsViewingHistory(true)}
         className="fixed top-4 left-4 w-12 h-12 flex items-center justify-center bg-black hover:bg-gray-800 text-white rounded-full transition-all shadow-md active:scale-95 z-[210]"
      >
         {gameState.artist?.image ? (
            <img src={gameState.artist.image || undefined} className="w-full h-full object-cover rounded-full p-0.5" alt="Artist Profile" />
         ) : (
            <History className="w-5 h-5" />
         )}
         <div className="absolute -bottom-1 -right-1 bg-[#00f878] text-black text-[9px] font-bold px-1 rounded-sm shadow-sm border border-black/10">HISTORY</div>
      </button>

      {/* Header Section */}
      <div className="pt-12 pb-6 px-4 flex flex-col items-center justify-center">
         <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-center scale-y-110" style={{ fontFamily: 'Impact, sans-serif' }}>
            BILLBOARD {currentTabInfo?.label.replace('HOT 100', 'HOT 100™')}
         </h1>
         <div className="text-sm md:text-base font-bold tracking-[0.2em] uppercase mt-6 mb-2">
            WEEK OF {formattedDate}
         </div>
      </div>

      {/* Top Action Bar (Green) */}
      <div className="bg-[#00f878] w-full flex justify-center items-center py-3 gap-16 sticky top-0 z-30 shadow-sm border-b border-[#00f878]">
        <button className="text-black hover:opacity-70 transition-opacity"><Calendar className="w-7 h-7" strokeWidth={1.5} /></button>
        <button className="text-black hover:opacity-70 transition-opacity"><Info className="w-7 h-7" strokeWidth={1.5} /></button>
        <button className="text-black hover:opacity-70 transition-opacity"><Share className="w-7 h-7" strokeWidth={1.5} /></button>
      </div>

      {/* Tabs / Filters */}
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
      <div className="flex flex-col bg-[#f2f0eb]">
         {currentData.length === 0 && (
             <div className="text-center p-12 text-gray-400 font-bold uppercase tracking-widest text-sm">No data available yet. Release more music.</div>
         )}
         
         <div className="w-full flex flex-col gap-1.5 bg-[#f2f0eb] py-1.5 px-0 md:px-4 max-w-4xl mx-auto">
             {currentData.map((item, index) => {
                const isPlayer = item.isPlayer;
                const isFirst = index === 0;
                const label = isPlayer ? 'INDEPENDENT' : (item?.id?.length % 2 === 0 ? 'REPUBLIC' : 'ISLAND');

                return (
                  <div key={`${item?.id}-${index}`} className="flex items-start bg-white w-full pr-4 py-4 relative group border-b border-gray-100">
                     {/* Rank and Movement */}
                     <div className="w-16 md:w-20 shrink-0 flex flex-col items-center justify-start pt-2">
                        {isAlbumChart && isFirst ? (
                             <div className="bg-[#cc2b2b] text-white w-8 h-8 rounded-md flex items-center justify-center font-bold text-xl mb-1">
                                {index + 1}
                             </div>
                        ) : (
                             <span className="text-3xl md:text-3xl font-extrabold mb-1 tracking-tighter" style={{ fontFamily: 'Impact, sans-serif' }}>{index + 1}</span>
                        )}
                        
                        {!isAlbumChart && (
                           item.isNew && !item.isReEntry ? (
                               <span className="bg-[#00f878] text-black text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide">NEW</span>
                           ) : item.isReEntry ? (
                               <span className="text-blue-500 text-[10px] font-bold uppercase tracking-wide">RE</span>
                           ) : item.movement > 0 ? (
                               <ArrowUp className="w-5 h-5 text-gray-400" strokeWidth={2} />
                           ) : item.movement < 0 ? (
                               <ArrowDown className="w-5 h-5 text-gray-400" strokeWidth={2} />
                           ) : (
                               <ArrowRight className="w-5 h-5 text-gray-400" strokeWidth={2} />
                           )
                        )}
                     </div>

                     {/* Image */}
                     <div className="w-24 h-24 shrink-0 bg-[#b3b3b3] flex items-center justify-center overflow-hidden mr-4 md:mr-6">
                        {item.coverImage ? (
                           <img src={item.coverImage || undefined} className="w-full h-full object-cover" alt="" />
                        ) : (
                           <div className="w-full h-full bg-[#b3b3b3] flex items-center justify-center">
                              {isAlbumChart ? (
                                 <span className="font-bold text-black/80 text-sm tracking-tight text-center">billboard</span>
                              ) : (
                                 <Music2 className="w-8 h-8 text-black/50" />
                              )}
                           </div>
                        )}
                     </div>

                     {/* Info */}
                     <div className="flex-1 flex flex-col justify-start min-w-0 pr-2">
                        <h3 className="font-extrabold text-lg md:text-xl truncate leading-tight text-black mb-1 uppercase tracking-tight">{item.title}</h3>
                        <p className="font-semibold text-gray-600 text-sm truncate uppercase tracking-tight mb-1">{item.artist}</p>
                        <p className="font-medium text-gray-400 text-xs truncate uppercase tracking-tight mb-3">{label}</p>
                        
                        {isAlbumChart ? (
                           <div className="flex items-center gap-6 mt-0">
                              <div className="flex flex-col">
                                 <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">ACTIVITY</span>
                                 <span className="text-base text-black font-medium">{formatStat(item.activity || 0)}</span>
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">ALBUMS</span>
                                 <span className="text-base text-black font-medium">{formatStat(item.albums || 0)}</span>
                              </div>
                           </div>
                        ) : (
                           <div className="flex items-center gap-3 text-[10px] md:text-xs text-gray-400 font-medium tracking-wide whitespace-nowrap overflow-x-auto hide-scrollbar">
                              <span>LW <span className="text-black font-bold ml-1">{item.lastPos}</span></span>
                              <span className="text-gray-300">-</span>
                              <span>PEAK <span className="text-black font-bold ml-1">{item.peakPos}</span></span>
                              <span>WEEKS <span className="text-black font-bold ml-1">{item.weeksOnChart}</span></span>
                           </div>
                        )}
                     </div>
                     
                     {/* Actions */}
                     {!isAlbumChart && (
                         <div className="flex items-center gap-3 shrink-0 pl-2 self-center">
                            <button className={`w-8 h-8 flex items-center justify-center rounded-full border border-gray-400 hover:bg-gray-100 transition-colors ${isPlayer ? 'bg-black border-black hover:bg-gray-800' : ''}`}>
                               <Star className={`w-4 h-4 ${isPlayer ? 'text-white fill-white' : 'text-gray-600'}`} strokeWidth={isPlayer ? 0 : 1.5} />
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-400 hover:bg-gray-100 transition-colors">
                               <Plus className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
                            </button>
                         </div>
                     )}
                  </div>
                );
             })}
         </div>
         <div className="h-12 w-full"></div>
      </div>
    </div>
  );
}
