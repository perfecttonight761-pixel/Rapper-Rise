import React, { useState, useMemo } from 'react';
import { GameState } from '../types';
import { ChevronDown, X } from 'lucide-react';

interface ChartHistoryViewProps {
  gameState: GameState;
  onClose: () => void;
}

type AllowedChart = 'Billboard Hot 100™' | 'Billboard Global 200 Songs' | 'Billboard Global 200 Albums' | 'US Top 100' | 'Latin Top 100' | 'Europe Top 100';

export function ChartHistoryView({ gameState, onClose }: ChartHistoryViewProps) {
  const [activeChart, setActiveChart] = useState<AllowedChart>('Billboard Hot 100™');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const availableCharts: AllowedChart[] = [
    'Billboard Hot 100™',
    'Billboard Global 200 Songs',
    'Billboard Global 200 Albums',
    'US Top 100',
    'Latin Top 100',
    'Europe Top 100'
  ];

  const historyData = useMemo(() => {
    let no1Hits = 0;
    let totalEntries = 0;
    let top10Hits = 0;
    
    // Extrapolate all entries from all releases the player has released that made it to this chart
    const entries = gameState.releases
      .filter(r => !(r as any).isNPCRelease)
      .filter(r => r.chartHistory && r.chartHistory[activeChart])
      .map(r => {
         const hist = r.chartHistory![activeChart];
         return {
           title: r.title,
           artist: (r as any).isNPCCollab ? `${(r as any).collaborator} & ${gameState.artist?.name || 'You'}` : (r.type === 'Single' && (r as any).collaborator ? `${gameState.artist?.name || 'You'} & ${(r as any).collaborator}` : gameState.artist?.name || 'You'),
           debutDate: new Date(hist.debutDate),
           peakPos: hist.peakPos,
           peakDate: new Date(hist.peakDate),
           weeksOnChart: hist.weeksOnChart,
           weeksAtPeak: (hist as any).weeksAtPeak || 1
         };
      });
      
    // Sort by peak position, then title
    entries.sort((a,b) => {
        if (a.peakPos !== b.peakPos) return a.peakPos - b.peakPos;
        return a.title.localeCompare(b.title);
    });

    entries.forEach(e => {
       totalEntries++;
       if (e.peakPos === 1) no1Hits++;
       if (e.peakPos <= 10) top10Hits++;
    });

    return { entries, no1Hits, totalEntries, top10Hits };
  }, [gameState.releases, activeChart, gameState.artist?.name]);

  const formatDate = (date: Date) => {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  };

  return (
    <div className="fixed inset-0 z-[220] bg-black text-white font-sans overflow-y-auto">
      <button 
        onClick={onClose}
        className="fixed top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[230]"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="p-4 md:p-8 max-w-4xl mx-auto pt-16">
         {/* Green Header */}
         <div className="bg-[#00f878] w-full py-4 px-4 flex items-center justify-center rounded-sm mb-6">
            <h1 className="text-black text-2xl md:text-3xl font-black uppercase tracking-tighter" style={{ fontFamily: 'Impact, sans-serif' }}>
              {activeChart.toUpperCase()}
            </h1>
         </div>

         {/* Stats Row */}
         <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
            <div className="border border-[#00f878]/30 rounded-md p-4 flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#00f878] transition-colors">
               <span className="text-4xl md:text-6xl font-black tabular-nums tracking-tighter mb-1 relative z-10">{historyData.no1Hits}</span>
               <div className="w-[80%] h-px bg-[#00f878]/50 my-1 relative z-10"></div>
               <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] relative z-10 mt-1">NO. 1 HITS</span>
            </div>
            <div className="border border-[#00f878]/30 rounded-md p-4 flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#00f878] transition-colors">
               <span className="text-4xl md:text-6xl font-black tabular-nums tracking-tighter mb-1 relative z-10">
                 {historyData.totalEntries}
               </span>
               <div className="w-[80%] h-px bg-[#00f878]/50 my-1 relative z-10"></div>
               <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] relative z-10 mt-1">
                 {activeChart.includes('Album') ? 'ALBUMS' : 'SONGS'}
               </span>
            </div>
            <div className="border border-[#00f878]/30 rounded-md p-4 flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#00f878] transition-colors">
               <span className="text-4xl md:text-6xl font-black tabular-nums tracking-tighter mb-1 relative z-10">{historyData.top10Hits}</span>
               <div className="w-[80%] h-px bg-[#00f878]/50 my-1 relative z-10"></div>
               <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] relative z-10 mt-1">TOP 10 HITS</span>
            </div>
         </div>

         {/* Dropdown */}
         <div className="relative mb-6">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full border border-[#00f878] bg-black text-[#00f878] py-3 px-4 flex justify-between items-center rounded-sm group hover:bg-[#00f878]/5 transition-colors"
            >
               <span className="font-semibold">{activeChart}</span>
               <div className="w-10 h-full absolute right-0 top-0 border-l border-[#00f878] flex items-center justify-center">
                  <ChevronDown className="w-5 h-5" />
               </div>
            </button>
            
            {dropdownOpen && (
               <div className="absolute top-full left-0 right-0 z-50 bg-[#00f878] mt-px rounded-b-sm shadow-xl flex flex-col">
                  {availableCharts.map((chart) => (
                     <button
                       key={chart}
                       onClick={() => { setActiveChart(chart); setDropdownOpen(false); }}
                       className="text-left font-semibold text-black py-3 px-4 hover:bg-black/10 border-b border-black/10 last:border-0 transition-colors"
                     >
                        {chart}
                     </button>
                  ))}
               </div>
            )}
         </div>

         {/* Table Header like labels */}
         <div className="flex justify-end mb-2 pr-4 text-[#00f878] text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-center">
            <div className="flex w-[240px] md:w-[320px]">
               <div className="w-[70px] md:w-[90px]">DEBUT DATE</div>
               <div className="w-[60px] md:w-[70px]">PEAK POS.</div>
               <div className="w-[70px] md:w-[90px]">PEAK DATE</div>
               <div className="w-[60px] md:w-[70px]">WKS. ON CHART</div>
            </div>
         </div>

         {/* List */}
         <div className="space-y-4">
            {historyData.entries.map((entry, idx) => (
              <div key={idx} className="bg-white text-black p-4 md:p-5 rounded-sm flex flex-col relative overflow-hidden">
                 <div className="mb-4">
                    <h3 className="font-black text-xl md:text-2xl tracking-tight leading-none mb-1">{entry.title}</h3>
                    <p className="text-gray-500 font-medium text-sm">{entry.artist}</p>
                 </div>
                 
                 <div className="flex justify-end self-end w-full max-w-[240px] md:max-w-[320px]">
                    <div className="flex w-full text-center items-end border-b-2 border-black pb-1">
                       {/* Debut Date */}
                       <div className="w-[70px] md:w-[90px] font-bold text-sm">{formatDate(entry.debutDate)}</div>
                       
                       {/* Peak POS & WKS in Peak box */}
                       <div className="w-[60px] md:w-[70px] flex flex-col items-center justify-end px-1 border-l border-r border-gray-300">
                          <span className="font-black text-xl md:text-2xl leading-none">{entry.peakPos}</span>
                          <div className="bg-[#00f878] text-black text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 mt-1 align-bottom whitespace-nowrap">
                             {entry.weeksAtPeak ?? 1} WKS
                          </div>
                       </div>
                       
                       {/* Peak Date */}
                       <div className="w-[70px] md:w-[90px] font-bold text-sm">{formatDate(entry.peakDate)}</div>
                       
                       {/* Total WKS on chart */}
                       <div className="w-[60px] md:w-[70px] font-black text-xl md:text-2xl leading-none flex items-center justify-center">
                          {entry.weeksOnChart}
                       </div>
                    </div>
                 </div>
              </div>
            ))}

            {historyData.entries.length === 0 && (
               <div className="bg-white/5 border border-white/10 rounded-sm p-12 text-center">
                  <p className="text-white/50 font-bold uppercase tracking-widest text-sm">No entries on this chart yet.</p>
               </div>
            )}
         </div>
         
         <div className="h-12 w-full" />
      </div>
    </div>
  );
}
