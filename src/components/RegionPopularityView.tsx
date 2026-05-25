import React from 'react';
import { GameState } from '../types';
import { Globe, TrendingUp, Music, Plane } from 'lucide-react';

interface RegionPopularityViewProps {
  gameState: GameState;
}

export function RegionPopularityView({ gameState }: RegionPopularityViewProps) {
  const regions = [
    { id: 'america', name: 'America', val: gameState.popularity.america },
    { id: 'latinAmerica', name: 'Latin America', val: gameState.popularity.latinAmerica },
    { id: 'europe', name: 'Europe', val: gameState.popularity.europe },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 md:p-8 space-y-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tighter italic text-purple-400 uppercase mb-2">Region Popularity</h2>
        <p className="text-white/60 text-sm">Grow your fan base globally. Higher popularity immensely boosts your streaming numbers and sales in that region.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {regions.map(r => (
           <div key={r.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center justify-center text-center group hover:bg-white/10 transition-colors">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Globe className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="font-bold tracking-widest uppercase text-sm mb-2">{r.name}</h3>
              <div className="text-3xl font-mono font-bold text-white mb-4">{Math.floor(r.val)}%</div>
              
              {/* Progress */}
              <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${r.val}%` }}></div>
              </div>
              
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mt-4">
                {r.val < 20 ? 'Unknown' : r.val < 50 ? 'Rising Star' : r.val < 80 ? 'Famous' : 'Superstar'}
              </p>
           </div>
         ))}
      </div>

      <div className="bg-purple-900/20 border border-purple-500/20 rounded-3xl p-6 text-center">
         <Plane className="w-8 h-8 text-purple-400 mx-auto mb-4" />
         <h3 className="font-bold tracking-widest uppercase text-purple-300 mb-2">How to increase popularity?</h3>
         <p className="text-sm text-purple-200/60 max-w-lg mx-auto">
           Go to the <strong>Gigs</strong> tab and start booking shows across different regions. Performing live helps spread your music and organically grows your listener base. 
         </p>
      </div>
    </div>
  );
}
