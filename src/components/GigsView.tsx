import React, { useState } from 'react';
import { GameState, Gig, Region } from '../types';
import { Calendar, MapPin, DollarSign, Zap, Ticket } from 'lucide-react';

interface GigsViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
  currentDate: Date;
}

export function GigsView({ gameState, setGameState, currentDate }: GigsViewProps) {
  
  // Generate deterministically random gigs for today
  const generateGigs = () => {
    const gigs = [];
    const regions: Region[] = ['America', 'Latin America', 'Europe'];
    const names = ['Local Dive Bar', 'City Festival', 'Club Night', 'Charity Event', 'Underground Rave'];
    
    // Use daysPassed as a seed
    const seed = gameState.time.daysPassed;
    
    for (let i = 0; i < 4; i++) {
      const pseudoRand = (seed * 13 + i * 7) % 100;
      const region = regions[pseudoRand % regions.length];
      const name = names[(pseudoRand + i) % names.length];
      const delayDays = (pseudoRand % 14) + i * 2 + 1; // staggering delay
      const gigDate = new Date(currentDate);
      gigDate.setDate(gigDate.getDate() + delayDays);
      gigDate.setHours(0, 0, 0, 0); // Normalize to start of day
      
      const cost = 100 + (pseudoRand * 5); // 100 to 600
      const payout = cost * 1.5 + (pseudoRand * 2); 
      const popGain = 1 + (pseudoRand % 3); // 1 to 3 pop gain

      gigs.push({
        id: `gig_offer_${seed}_${i}`,
        name: `${region} ${name}`,
        region,
        date: gigDate.toISOString(),
        cost,
        payout,
        popularityGain: popGain,
        completed: false
      });
    }
    return gigs;
  };

  const bookedGigs = gameState.gigs || [];
  
  // Filter out any available gig that shares the EXACT same date as a booked gig
  const availableGigs = generateGigs().filter(g => {
     const gDateStr = new Date(g.date).toDateString();
     return !bookedGigs.some(booked => new Date(booked.date).toDateString() === gDateStr);
  });

  const handleBook = (gig: Gig) => {
    if (gameState.stats.money < gig.cost) {
      alert("Not enough money to book this gig.");
      return;
    }

    const gigDateStr = new Date(gig.date).toDateString();
    if (bookedGigs.some(g => new Date(g.date).toDateString() === gigDateStr)) {
      alert("You already have a gig booked on this date!");
      return;
    }

    const gigMonth = new Date(gig.date).getMonth();
    const gigYear = new Date(gig.date).getFullYear();

    const gigsThisMonth = bookedGigs.filter(g => {
      const d = new Date(g.date);
      return d.getMonth() === gigMonth && d.getFullYear() === gigYear;
    }).length;

    if (gigsThisMonth >= 15) {
      alert("You have reached the maximum limit of 15 gigs for this month.");
      return;
    }

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        stats: {
          ...prev.stats,
          money: prev.stats.money - gig.cost
        },
        gigs: [...(prev.gigs || []), gig]
      };
    });

    alert("Gig booked! Check your schedule.");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 md:p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tighter italic text-purple-400 uppercase mb-2">Book Gigs</h2>
        <p className="text-white/60 text-sm">Pay the booking fee to secure a spot. Perform to gain popularity and earn a payout. (Max 15 gigs per month).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {availableGigs.map(gig => {
          const isBooked = bookedGigs.some(g => g?.id === gig.id);

          return (
            <div key={gig.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col relative overflow-hidden group hover:bg-white/10 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg tracking-wide">{gig.name}</h3>
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-white/40 mt-1">
                    <MapPin className="w-3 h-3 text-blue-400" /> {gig.region}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Gig Date</span>
                  <span className="text-sm font-mono text-purple-300">{new Date(gig.date).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-6">
                 <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-red-400/60 mb-1">Fee Cost</span>
                    <span className="text-sm font-mono text-red-300">-${gig.cost}</span>
                 </div>
                 <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-green-400/60 mb-1">Guaranteed Payout</span>
                    <span className="text-sm font-mono text-green-400">+${gig.payout}</span>
                 </div>
                 <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-blue-400/60 mb-1">Pop Gain</span>
                    <span className="text-sm font-mono text-blue-400">+{gig.popularityGain}%</span>
                 </div>
              </div>

              <button 
                onClick={() => handleBook(gig)}
                disabled={isBooked}
                className={`w-full py-3 rounded-xl font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-2 transition-colors ${isBooked ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}
              >
                <Ticket className="w-4 h-4" />
                {isBooked ? 'Already Booked' : 'Book Gig'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
