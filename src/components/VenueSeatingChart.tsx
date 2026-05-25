import React, { useState, useMemo } from 'react';

interface VenueSeatingChartProps {
  venue: { id: string; type: string; name: string; levels: number; baseCapacityPerLevel: number[] };
  seatLevels?: { level: number; capacity: number; sold: number; price: number }[];
  mode?: 'planning' | 'active';
  showsCount?: number;
}

// Fixed color mappings for the seating chart
const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]', // VIP (Level 1)
  2: 'bg-orange-400', // VIP Tier 2 (if exists)
  3: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]', // General (Level 3 or 2 depending)
  4: 'bg-blue-500', // Discount (Level 4)
  5: 'bg-blue-600', // Discount (Level 5)
};

const SOLD_OUT_COLOR = 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,1)]';

export function VenueSeatingChart({ venue, seatLevels, mode = 'planning', showsCount = 1 }: VenueSeatingChartProps) {
  const [viewMode, setViewMode] = useState<'Arranged' | 'Optimal'>('Optimal');

  // Distribute the capacity to dots.
  // Render ~500-1000 dots max to keep it performant
  const totalCapacity = useMemo(() => {
    return venue.baseCapacityPerLevel.reduce((a, b) => a + b, 0) * showsCount;
  }, [venue, showsCount]);

  const maxDots = 600;
  const dotRatio = Math.max(1, Math.floor(totalCapacity / maxDots));

  // Determine dots layout
  const levelBlocks = useMemo(() => {
    const blocks: { level: number; totalDots: number; soldDots: number; color: string }[] = [];
    
    venue.baseCapacityPerLevel.forEach((cap, i) => {
      const level = i + 1;
      const capacity = cap * showsCount;
      const sold = seatLevels ? seatLevels.find(s => s.level === level)?.sold || 0 : 0;
      
      const totalDots = Math.max(10, Math.floor(capacity / dotRatio));
      const soldDots = seatLevels ? Math.floor(sold / dotRatio) : 0;
      
      let colorClass = LEVEL_COLORS[level] || 'bg-gray-500';
      if (venue.levels === 1) colorClass = 'bg-purple-500'; // Only GM
      if (venue.levels === 3) {
          if (level === 1) colorClass = LEVEL_COLORS[1];
          if (level === 2) colorClass = LEVEL_COLORS[3];
          if (level === 3) colorClass = LEVEL_COLORS[4];
      }

      blocks.push({ level, totalDots, soldDots, color: colorClass });
    });

    return blocks;
  }, [venue, seatLevels, dotRatio, showsCount]);

  return (
    <div className="w-full bg-[#05050A] rounded-[24px] overflow-hidden border border-[#1a1a3a] shadow-2xl pb-6">
      <div className="px-6 pt-6 pb-4">
        <h3 className="text-white text-xl font-black tracking-tight mb-1">Venue Preview</h3>
        <p className="text-white/50 text-xs">
          Showing: {venue.name} • {venue.type === 'Cafe' ? 'Small Event' : venue.type === 'Arena' ? 'Medium Setup' : 'Large Scale'} • {totalCapacity.toLocaleString()} capacity {showsCount > 1 ? `(${showsCount} Shows)` : ''}
        </p>
      </div>

      <div className="flex gap-2 bg-[#111116] mx-6 p-1 rounded-xl mb-6">
        <button 
          onClick={() => setViewMode('Arranged')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'Arranged' ? 'bg-[#1a1a3a] text-white' : 'text-white/40 hover:text-white'}`}
        >
          Arranged
        </button>
        <button 
           onClick={() => setViewMode('Optimal')}
           className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'Optimal' ? 'bg-purple-600 text-white' : 'text-white/40 hover:text-white'}`}
        >
          Optimal
        </button>
      </div>

      {/* Seat Map Area */}
      <div className="bg-[#0B0D16] rounded-2xl border border-[#1c1c2e] relative flex flex-col items-center justify-between p-4 sm:p-8 min-h-[250px] sm:min-h-[350px]">
        
        {/* Render Dots Container */}
        <div className="w-full flex flex-col items-center gap-4 sm:gap-8 z-10 flex-1 justify-center">
           {/* Rear Block (Level 3 for Arena, Level 3 for Stadium) */}
           {venue.levels >= 3 && (
               <div className="w-full flex justify-center">
                  <div className="w-full max-w-[95%] sm:max-w-[85%] flex flex-wrap justify-center gap-[2px] sm:gap-1">
                     {levelBlocks[2] && Array.from({length: levelBlocks[2].totalDots}).map((_, i) => (
                        <div key={`l3-${i}`} className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-colors duration-700 ${i < levelBlocks[2].soldDots ? SOLD_OUT_COLOR : levelBlocks[2].color}`} />
                     ))}
                  </div>
               </div>
           )}

           {/* Middle Tier with Wings (If Stadium) */}
           <div className="w-full flex justify-between gap-1 sm:gap-4 px-1 sm:px-4">
               {/* Left Wing (Level 4) */}
               {venue.levels === 5 ? (
                  <div className="w-1/4 flex flex-col flex-wrap content-end justify-center gap-[2px] sm:gap-1 opacity-80 max-h-[150px] sm:max-h-[200px] overflow-hidden">
                     {levelBlocks[3] && Array.from({length: levelBlocks[3].totalDots}).map((_, i) => (
                        <div key={`s4-${i}`} className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-colors duration-700 ${i < levelBlocks[3].soldDots ? SOLD_OUT_COLOR : levelBlocks[3].color}`} />
                     ))}
                  </div>
               ) : <div className="w-[10%] hidden sm:block" />} {/* Spacer for Arena to keep center */}

               {/* Center Block (Level 2) */}
               {venue.levels >= 3 && (
                   <div className={`${venue.levels === 5 ? 'w-1/2' : 'w-full max-w-[80%] mx-auto'} flex flex-wrap justify-center content-start gap-[2px] sm:gap-1 shrink-0`}>
                      {levelBlocks[1] && Array.from({length: levelBlocks[1].totalDots}).map((_, i) => (
                         <div key={`l2-${i}`} className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-colors duration-700 ${i < levelBlocks[1].soldDots ? SOLD_OUT_COLOR : levelBlocks[1].color}`} />
                      ))}
                   </div>
               )}

               {/* Right Wing (Level 5) */}
               {venue.levels === 5 ? (
                  <div className="w-1/4 flex flex-col flex-wrap content-start justify-center gap-[2px] sm:gap-1 opacity-80 max-h-[150px] sm:max-h-[200px] overflow-hidden">
                     {levelBlocks[4] && Array.from({length: levelBlocks[4].totalDots}).map((_, i) => (
                        <div key={`s5-${i}`} className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-colors duration-700 ${i < levelBlocks[4].soldDots ? SOLD_OUT_COLOR : levelBlocks[4].color}`} />
                     ))}
                  </div>
               ) : <div className="w-[10%] hidden sm:block" />} {/* Spacer for Arena */}
           </div>

           {/* VIP / Front Block (Level 1 for Cafe, Arena, Stadium) */}
           <div className={`flex flex-wrap justify-center gap-[2px] sm:gap-1 mt-2 sm:mt-4 shrink-0 ${venue.levels === 1 ? 'w-full max-w-[90%]' : 'w-full max-w-[60%] sm:max-w-[40%]'}`}>
              {levelBlocks[0] && Array.from({length: levelBlocks[0].totalDots}).map((_, i) => (
                 <div key={`l1-${i}`} className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-colors duration-700 ${i < levelBlocks[0].soldDots ? SOLD_OUT_COLOR : levelBlocks[0].color}`} />
              ))}
           </div>
        </div>

        {/* Stage */}
        <div className="mt-8 sm:mt-12 w-[140px] sm:w-[200px] h-10 sm:h-14 border border-[#ff8c00]/40 bg-[#0B0D16] shadow-[0_0_20px_rgba(255,140,0,0.15)] rounded-lg flex items-center justify-center z-20 shrink-0">
            <span className="text-[#ff8c00] text-[10px] sm:text-xs font-black tracking-[0.3em] uppercase">Stage</span>
        </div>
      </div>

      <div className="flex justify-center items-center gap-6 mt-6 px-6">
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
            <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Discount</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.6)]" />
            <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider">General</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.8)]" />
            <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider">VIP</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_6px_rgba(220,38,38,1)]" />
            <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Sold Out</span>
         </div>
      </div>
    </div>
  );
}
