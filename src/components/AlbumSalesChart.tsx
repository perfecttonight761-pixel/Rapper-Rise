import React from 'react';
import { GameState, Album } from '../types';
import { X } from 'lucide-react';

interface AlbumSalesChartProps {
  gameState: GameState;
  onClose: () => void;
}

export function AlbumSalesChart({ gameState, onClose }: AlbumSalesChartProps) {
  const albums = (gameState.releases || [])
    .filter(r => r.type === 'Album' && r.status === 'Published') as Album[];

  const albumData = albums.map(album => {
     const totalSales = album.sales?.total || 0;
     return { ...album, totalSales };
  }).sort((a, b) => b.totalSales - a.totalSales);

  const overallTotalSales = albumData.reduce((sum, a) => sum + a.totalSales, 0);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  const maxSales = albumData.length > 0 ? albumData[0].totalSales : 1;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto overflow-x-hidden flex flex-col p-6 animate-fade-in text-black">
      <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full shadow z-50 transition-colors">
        <X className="w-6 h-6 text-black" />
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start md:justify-center gap-6 mt-10 md:mt-12 md:px-10 mb-16 max-w-6xl mx-auto w-full">
        <div className="w-32 h-32 md:w-36 md:h-36 shadow-lg rounded-full overflow-hidden border-2 border-gray-200 shrink-0 relative bg-gray-100 flex items-center justify-center">
          {gameState.artist?.image ? (
             <img src={gameState.artist?.image || undefined} className="w-full h-full object-cover" alt={gameState.artist?.name || "Artist"} />
          ) : (
             <span className="text-4xl text-gray-300">🎤</span>
          )}
        </div>
        <div className="flex flex-col justify-center text-center md:text-left mt-2 md:mt-1">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-tight">
            {gameState.artist?.name}&apos;S ALBUM SALES BAR CHART
          </h1>
          <h2 className="text-2xl md:text-3xl font-black mt-2 tracking-tight">
            {formatNumber(overallTotalSales)} UNITS SOLD
          </h2>
          <p className="text-gray-500 font-bold mt-2 tracking-wide text-lg">
            @{gameState.artist?.name.replace(/\s+/g, '') || "Artist"}
          </p>
        </div>
      </div>

      {/* Chart */}
      {albumData.length > 0 ? (
          <div className="flex flex-row items-end justify-start md:justify-center gap-4 md:gap-6 w-full max-w-6xl mx-auto h-[45vh] md:h-[50vh] pb-4 overflow-x-auto hide-scrollbar px-4 md:px-10">
            {albumData.map((album) => {
              const heightPercent = Math.max((album.totalSales / maxSales) * 100, 15); // min 15% height
              return (
                <div key={album.id} className="flex flex-col items-center justify-end h-full gap-3 shrink-0" style={{ width: 'clamp(90px, 14vw, 150px)' }}>
                  <div className="flex flex-col items-center text-center gap-1">
                    <span className="text-2xl md:text-3xl font-black tracking-tighter leading-none">
                      {formatNumber(album.totalSales)}
                    </span>
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest leading-tight px-1">
                      {album.title}
                    </span>
                  </div>
                  
                  {/* The Bar */}
                  <div 
                    className="w-full rounded-t-2xl overflow-hidden shadow-[0_4px_10px_rgba(0,0,0,0.15)] relative group transition-all duration-500 origin-bottom bg-gray-100"
                    style={{ height: `${heightPercent}%` }}
                  >
                    {album.coverImage ? (
                        <img src={album.coverImage || undefined} 
                            alt={album.title}
                            className="absolute top-0 left-0 w-full h-full object-cover object-top"
                        />
                    ) : (
                        <div className="absolute top-0 left-0 w-full h-full bg-gray-200 flex items-center justify-center text-3xl">
                            💿
                        </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
      ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest">
            No albums published yet.
          </div>
      )}
    </div>
  );
}
