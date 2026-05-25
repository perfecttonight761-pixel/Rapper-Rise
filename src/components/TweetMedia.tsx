import React from 'react';
import { GameState } from '../types';
import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';

const hash = (str: string) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return Math.abs(h);
};

const itemToPoints = (item: any) => {
  return item.computedTotal || item.points || 0;
};

export const TwitterPost = ({ profileName, handle, profileImage, tweetText, children, date, views, reposts, quotes, likes, bookmarks, verified }: any) => {
  return (
    <div className="bg-black text-[#e7e9ea] p-4 max-w-xl mx-auto border border-gray-800 rounded-xl font-sans mt-4 text-left">
       <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
             {profileImage ? <img src={profileImage || undefined} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-900 border border-gray-600"></div>}
          </div>
          <div className="flex flex-col leading-tight">
             <div className="font-bold flex items-center gap-1 text-[15px]">
                <span className="truncate max-w-[150px] sm:max-w-none">{profileName}</span>
                {verified !== 'none' && (
                  <span className={verified === 'gold' ? 'text-[#e6c13e]' : 'text-[#1d9bf0]'}>
                    <svg viewBox="0 0 24 24" className="w-[16px] h-[16px] fill-current shrink-0">
                       <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.79-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.147 2.02-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.918 4 .63 0 1.222-.163 1.748-.445.903 1.3 2.39 2.15 4.09 2.15 1.705 0 3.193-.85 4.095-2.15.524.282 1.116.445 1.746.445 2.21 0 3.918-1.79 3.918-4 0-.174-.012-.344-.033-.513 1.158-.69 1.943-1.99 1.943-3.487zm-11.49 4l-4.5-4.5 1.41-1.42 3.09 3.09 7.09-7.09 1.41 1.42-8.5 8.5z" />
                    </svg>
                  </span>
                )}
             </div>
             <div className="text-gray-500 text-[15px]">@{handle}</div>
          </div>
          <div className="ml-auto flex items-center mb-auto">
             <button className="bg-white hover:bg-gray-200 text-black font-bold px-4 py-1.5 rounded-full text-sm">Follow</button>
          </div>
       </div>
       <div className="text-[17px] sm:text-[19px] mb-3 leading-snug whitespace-pre-wrap">
          {tweetText}
       </div>
       <div className="rounded-2xl overflow-hidden border border-gray-800 mb-3">
          {children}
       </div>
       <div className="text-gray-500 text-[15px] mb-3 flex gap-1 items-center font-normal">
          <span>{date}</span> <span className="text-gray-700 font-bold">·</span>
          <span className="text-white font-bold">{views}</span> <span>Views</span>
       </div>
       <div className="border-t border-b border-gray-800 py-3 flex gap-6 flex-wrap text-gray-500 text-[15px]">
          <div><span className="text-white font-bold">{reposts}</span> Reposts</div>
          <div><span className="text-white font-bold">{quotes}</span> Quotes</div>
          <div><span className="text-white font-bold">{likes}</span> Likes</div>
          <div className="hidden sm:block"><span className="text-white font-bold">{bookmarks}</span> Bookmarks</div>
       </div>
    </div>
  )
}

export const SpotifyMilestoneCard = ({ albumCover, typeLabel, dateLabel, title, artist, dailyStreams, changePercent, totalStreams }: any) => {
  return (
    <div className="flex w-[90%] sm:w-[85%] max-w-[500px] mx-auto bg-[#1b1464] text-white overflow-hidden rounded-2xl relative font-sans aspect-[2/1] border border-gray-800 items-stretch">
       {/* Left side album cover */}
       <div className="w-[45%] shrink-0 relative flex items-center justify-center overflow-hidden bg-black">
          {albumCover ? <img src={albumCover || undefined} className="w-full h-full object-cover" /> : <span className="text-white/50 font-bold text-3xl">COVER</span>}
       </div>
       
       {/* Right side content */}
       <div className="w-[55%] p-3 sm:p-5 flex flex-col justify-between relative bg-gradient-to-br from-[#1b1464] via-[#1b1464] to-[#0a0530]">
           <div className="flex justify-between items-center text-[8px] sm:text-[10px] font-bold tracking-[0.2em] text-white/80 uppercase">
             <span>{typeLabel || 'SONG'}</span>
             <span>{dateLabel}</span>
           </div>
           
           <div className="flex flex-col mt-2 sm:mt-4">
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight leading-none mb-1 text-white truncate">{title}</h2>
              <h3 className="text-white/80 text-xs sm:text-sm font-normal tracking-wide truncate">{artist}</h3>
           </div>
           
           <div className="flex flex-col mt-auto mb-2 sm:mb-4 pt-4">
              <div className="flex items-center gap-2 sm:gap-3">
                 <div className="bg-white text-black font-bold text-lg sm:text-2xl px-2 sm:px-4 py-0.5 sm:py-1 tracking-tight min-w-[100px] sm:min-w-[140px] text-right truncate">
                    {dailyStreams.toLocaleString()}
                 </div>
                 <div className="text-white font-bold text-xs sm:text-xs shrink-0">{changePercent}</div>
              </div>
              <div className="text-sm sm:text-xl font-bold tracking-tight mt-1 text-white truncate">
                 {totalStreams.toLocaleString()}
              </div>
           </div>
           
           <div className="mt-auto flex items-end justify-between relative">
               <div className="flex flex-col">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                     <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 24 24" className="w-[60%] h-[60%] fill-[#1db954]">
                           <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.2-1.261 11.28-1.021 15.721 1.62.539.3.719 1.02.419 1.56-.239.54-.959.72-1.56.3z" />
                        </svg>
                     </div>
                     <span className="text-[10px] sm:text-xs font-bold tracking-tight text-white">SpotifySwiftie</span>
                  </div>
                  <span className="text-[6px] sm:text-[8px] text-white/50 mt-0.5">Layout by: @socasuallygay</span>
               </div>
               <div className="absolute right-0 bottom-0 text-white">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-4 h-4 sm:w-6 sm:h-6">
                     <path d="M5 19L19 5M19 5v10M19 5H9" />
                  </svg>
               </div>
           </div>
       </div>
    </div>
  )
}

export const DetailedAlbumTrackerMedia = ({ album, playerName, currentDate, tracks = [] }: { album: any, playerName: string, currentDate: Date, tracks?: any[] }) => {
  if (!album) return null;

  const displayDate = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
  const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

  const totalDaily = Math.floor(album.lastDailyStreams?.total || 0); // use total, not just spotify, or scale it
  const totalStreams = album.streams?.total || 0;
  const isSingle = tracks.length <= 1;
  const albumColor = '#1d4ed8'; // we could map this deterministically but blue is nice
  
  // Deterministic hash based on album title
  const hash = album.title ? album.title.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0) : 0;
  
  // Assign streams to tracks based on a zipfian distribution (track 1 gets most, etc.)
  // or based on track ID if known.
  
  // Normalize factors
  const factors = tracks.map((tr, i) => {
    // If it's a single, 100% of streams are for this track
    if (isSingle) return 1;
    // Otherwise, tracks get a declining share, but some random spikes
    let factor = 1 / Math.pow(i + 1, 0.5); 
    // maybe track 3 is a hit?
    if (i === (hash % tracks.length)) factor *= 2.5;
    return factor;
  });
  
  const sumFactors = factors.reduce((a, b) => a + b, 0) || 1;
  let runningDaily = 0;
  let runningTotal = 0;
  
  const displayTracks = tracks.map((tr: any, i: number) => {
      // If the track actually has its own tracked streams (e.g. it was released as a single), use those!
      // Otherwise calculate from album total
      const factor = factors[i] / sumFactors;
      let trDaily = typeof tr.lastDailyStreams?.total === 'number' ? tr.lastDailyStreams.total : Math.floor(totalDaily * factor);
      let trTotal = typeof tr.streams?.total === 'number' ? tr.streams.total : Math.floor(totalStreams * factor);
      
      // if track totals somehow exceed album (due to being a massive pre-release single), that's fine. 
      // But if we are estimating, just use the estimation.
      
      const changeNum = Math.floor(trDaily * (0.01 + ((hash+i)%15)*0.01)); // 1% to 15% change
      const isPositive = ((hash + i) % 3) !== 0; // 2/3 chance of positive daily change
      const changeVal = isPositive ? changeNum : -changeNum;
      
      runningDaily += trDaily;
      runningTotal += trTotal;
      
      return {
          title: tr.title,
          daily: trDaily,
          change: changeVal,
          pct: `${isPositive ? '+' : ''}${((changeVal / (trDaily - changeVal + 1)) * 100).toFixed(2)}%`,
          total: trTotal
      };
  });
  
  const changeTotal = displayTracks.reduce((acc, tr) => acc + tr.change, 0);
  const totalDailyCalc = Math.max(totalDaily, runningDaily);
  const totalStreamsCalc = Math.max(totalStreams, runningTotal);
  const totalPct = totalDailyCalc - changeTotal > 0 ? `${changeTotal >= 0 ? '+' : ''}${((changeTotal / (totalDailyCalc - changeTotal)) * 100).toFixed(2)}%` : '0.00%';

  return (
    <div className={`p-2.5 sm:p-3 text-[9px] sm:text-[10px] text-white font-sans w-[85%] sm:w-[80%] max-w-[420px] mx-auto rounded-[1.25rem] mt-2 relative overflow-hidden`} style={{ background: `linear-gradient(135deg, #0f172a, ${albumColor}40)` }}>
       <div className="absolute inset-0 bg-[#0f172a] mix-blend-multiply opacity-80 pointer-events-none"></div>
       <div className="relative z-10">
           {/* Header Section */}
           <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 shadow-xl relative rounded-md overflow-hidden bg-gray-900 border border-white/10 flex items-center justify-center">
                 {album.coverImage ? <img src={album.coverImage || undefined} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-white/50 font-bold tracking-widest text-[10px]">COVER</div>}
              </div>
              <div className="flex flex-col flex-1 py-0.5 min-w-0">
                 <div className="mb-auto">
                     <div className="text-[8px] sm:text-[9px] text-white/60 tracking-[0.25em] font-bold mb-1 uppercase flex justify-between">
                         <span>{isSingle ? 'SONG' : 'ALBUM'} TRACKER</span>
                         <span className="text-right">{displayDate}</span>
                     </div>
                     <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-0.5 leading-none truncate">{album.title}</h2>
                     <h3 className="text-white/80 text-sm sm:text-base font-medium tracking-wide truncate">{playerName}</h3>
                 </div>
                 
                 <div className="flex flex-col mt-2">
                    <div className="flex items-end gap-2 mb-0.5">
                      <div className="bg-white text-black px-2 sm:px-2.5 py-0.5 text-lg sm:text-xl font-black rounded-sm tracking-tighter leading-none">
                         {totalDailyCalc.toLocaleString()}
                      </div>
                      <div className={`font-bold text-[10px] sm:text-xs mb-0.5 ${changeTotal >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                         {totalPct}
                      </div>
                    </div>
                    <div className="text-white/50 font-semibold text-[9px] sm:text-[10px] tracking-wide ml-0.5 flex gap-1.5 items-center">
                       <span>Total Streams:</span>
                       <span className="text-white font-bold">{totalStreamsCalc.toLocaleString()}</span>
                    </div>
                 </div>
              </div>
           </div>
           
           {/* Table Section */}
           {!isSingle && (
           <div className="bg-black/30 rounded-lg p-2 sm:p-2.5 backdrop-blur-md border border-white/5">
              <div className="flex text-white/50 text-[8px] sm:text-[9px] uppercase font-bold tracking-widest mb-2 px-1.5 border-b border-white/10 pb-1.5">
                 <div className="w-4 sm:w-5 text-center">#</div>
                 <div className="flex-1">Track</div>
                 <div className="w-16 sm:w-20 text-right">Daily</div>
                 <div className="w-14 sm:w-16 text-right hidden lg:block">Change</div>
                 <div className="w-12 sm:w-14 text-right">%</div>
                 <div className="w-20 sm:w-24 text-right">Total</div>
              </div>
              
              <div className="flex flex-col gap-0.5">
                 {displayTracks.map((tr: any, i: number) => {
                     const isPos = !tr.pct?.includes('-');
                     const textColor = isPos ? 'text-[#4ade80]' : 'text-[#f87171]';
                     return (
                       <div key={i} className="flex px-1.5 py-1 hover:bg-white/5 items-center rounded-md transition-colors font-mono text-[9px] sm:text-[10px] group">
                          <div className="w-4 sm:w-5 text-center text-white/30 font-bold text-[8px] sm:text-[9px] group-hover:text-white/80 transition-colors">{i + 1}</div>
                          <div className="flex-1 truncate pr-2 text-white/90 font-sans font-medium">{tr.title}</div>
                          <div className="w-16 sm:w-20 text-right font-semibold text-white/95">{tr.daily?.toLocaleString()}</div>
                          <div className={`w-14 sm:w-16 text-right hidden lg:block ${textColor}`}>{isPos ? '+' : ''}{tr.change.toLocaleString()}</div>
                          <div className={`w-12 sm:w-14 text-right ${textColor}`}>{tr.pct}</div>
                          <div className="w-20 sm:w-24 text-right text-white/70 font-semibold">{tr.total?.toLocaleString()}</div>
                       </div>
                     )
                 })}
              </div>
              
              {/* Total Row */}
              <div className="flex px-1.5 py-1.5 mt-1.5 rounded-md bg-white/10 items-center font-mono text-[9px] sm:text-[10px] font-bold border border-white/10 shadow-sm">
                  <div className="flex-1 tracking-widest uppercase text-white/90 font-sans pl-4 sm:pl-5">TOTAL</div>
                  <div className="w-16 sm:w-20 text-right text-white">{runningDaily.toLocaleString()}</div>
                  <div className={`w-14 sm:w-16 text-right hidden lg:block ${changeTotal >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                      {changeTotal >= 0 ? '+' : ''}{changeTotal.toLocaleString()}
                  </div>
                  <div className={`w-12 sm:w-14 text-right ${changeTotal >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>{totalPct}</div>
                  <div className="w-20 sm:w-24 text-right text-white">{runningTotal.toLocaleString()}</div>
              </div>
           </div>
           )}
       </div>
    </div>
  )
}

export const AlbumTrackerMedia = DetailedAlbumTrackerMedia;

export const DebutTrackerMedia = ({ release, playerName }: { release: any; playerName: string }) => {
   const isSingle = release.type === 'Single';
   
   return (
    <div className="flex flex-col w-[90%] sm:w-[85%] max-w-[500px] mx-auto bg-[#111111] text-white overflow-hidden rounded-xl relative font-sans border border-gray-800">
       <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500" />
       <div className="p-4 sm:p-5 flex flex-col items-center">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-sm overflow-hidden mb-4 shadow-xl border border-white/10">
             {release.coverImage ? <img src={release.coverImage || undefined} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black"></div>}
          </div>
          <h3 className="text-xl sm:text-3xl font-black uppercase tracking-tighter text-center leading-none mb-1">{release.title}</h3>
          <p className="text-sm sm:text-base text-gray-400 uppercase tracking-widest font-bold mb-4">{playerName}</p>
          
          <div className="bg-[#222] w-full rounded-lg p-3 sm:p-4 text-center border border-white/5">
             <div className="text-[10px] sm:text-xs font-bold text-[#1db954] uppercase tracking-widest mb-1">{isSingle ? 'GLOBAL SINGLE DEBUT' : 'GLOBAL ALBUM DEBUT'}</div>
             <div className="text-4xl sm:text-6xl font-black text-white tracking-tighter leading-none mb-2">{(release.debutStreams || release.streams?.total || 0).toLocaleString()}</div>
             <div className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-widest">FIRST DAY STREAMS (ALL PLATFORMS)</div>
          </div>
       </div>
    </div>
   );
};

export const OfficialChartMedia = ({ chartName = 'Billboard 200', type = 'album', songs = [], playerName, currentDate = new Date() }: any) => {
  const chartDate = new Date(currentDate);
  chartDate.setDate(chartDate.getDate() + 7);
  const formattedDate = chartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  
  let headerColor = '#00f2fe'; // cyan
  if (chartName === 'Billboard Hot 100') headerColor = '#05f57a'; // bright green
  else if (chartName === 'Billboard Global 200') headerColor = '#d900ff'; // magenta/purple
  
  let chartTitle1 = 'billboard';
  let chartTitle2 = chartName === 'Billboard 200' ? 'BILLBOARD 200' : chartName.toUpperCase().replace('BILLBOARD', '').trim();
  
  return (
    <div className="bg-[#050505] text-white rounded-[1rem] overflow-hidden w-[95%] sm:w-[90%] max-w-[420px] mx-auto my-2 border border-black shadow-2xl font-sans relative">
       {/* Fake curved lighting graphic behind text (approximate) */}
       <div className="absolute top-[80px] left-0 right-0 bottom-0 bg-gradient-to-tr from-white/5 via-transparent to-white/5 opacity-30 pointer-events-none backdrop-blur-3xl"></div>
       
       {/* Header */}
       <div className="pt-5 pb-3 px-5 sm:px-6 flex flex-col justify-end relative z-20" style={{ backgroundColor: headerColor }}>
          <div className="flex justify-between items-end relative top-1">
             <div className="flex flex-col">
                 <div className="text-black font-black text-xl sm:text-2xl italic tracking-tighter leading-none mb-0 w-[120px] overflow-hidden">
                    <svg viewBox="0 0 100 24" className="w-full fill-black">
                       <text x="0" y="20" fontSize="24" fontFamily="Impact, sans-serif" letterSpacing="-1">billboard</text>
                    </svg>
                 </div>
                 <div className="-ml-1 text-black font-black text-[54px] sm:text-[64px] tracking-tighter leading-[0.8] font-sans">
                    {chartTitle2}
                 </div>
             </div>
             <div className="text-black/80 font-bold text-[7px] sm:text-[8px] uppercase tracking-widest text-right pb-1 leading-tight">
                CHART DATED <br/> <span className="font-black text-black">{formattedDate}</span>
             </div>
          </div>
       </div>

       <div className="bg-[#050505] relative z-20 pt-1 pb-4 px-2">
           {/* Sub Header */}
           <div className="flex justify-between items-end px-3 py-2 border-b border-white/20 mb-1">
              <div className="text-black font-black text-[8px] sm:text-[9px] px-3 py-1 rounded-[10px] tracking-wider" style={{ backgroundColor: headerColor }}>
                 {songs[0]?.weeksOnChart || 1} {songs[0]?.weeksOnChart === 1 ? 'WEEK' : 'WEEKS'} AT NO. 1
              </div>
              <div className="font-bold text-[7px] sm:text-[8px] uppercase tracking-widest leading-none text-right" style={{ color: headerColor }}>
                 LAST<br/>WEEK
              </div>
           </div>

           {/* Rows */}
           <div className="flex flex-col">
                {songs.slice(0, 10).map((song: any, i: number) => {
                   const isNew = song.isNew;
                   const lastWeek = isNew ? (song.isReEntry ? 'RE-ENTRY' : 'NEW') : song.lastPos;
                   const movement = song.movement || 0;
                   let lwColor = headerColor; // match header
                   
                   return (
                      <div key={i} className="flex px-3 py-1.5 sm:py-2 items-center border-b border-white/10 hover:bg-white/5 transition-colors">
                         <div className="w-[20px] sm:w-[24px] font-black text-[14px] sm:text-[15px] text-white text-center">
                            {i + 1}
                         </div>
                         {/* Optional Movement Arrow for Official Chart too */}
                         <div className="w-[16px] sm:w-[18px] flex justify-center ml-1">
                            {isNew ? null : movement > 0 ? (
                               <ArrowUp className="w-2.5 h-2.5 text-green-400 fill-green-400" />
                            ) : movement < 0 ? (
                               <ArrowDown className="w-2.5 h-2.5 text-red-500 fill-red-500" />
                            ) : (
                               <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
                            )}
                         </div>
                         <div className="flex-1 flex justify-between items-baseline px-2 gap-2 overflow-hidden">
                            <span className="font-black text-[11px] sm:text-[12px] tracking-normal uppercase truncate text-white">
                               {song.title}
                            </span>
                            <span className="text-white/80 font-medium text-[10px] sm:text-[11px] truncate shrink-0 max-w-[50%]">
                               {song.isPlayer ? playerName : song.artist || 'Unknown Artist'}
                            </span>
                         </div>
                         <div className="w-[40px] sm:w-[48px] text-right font-black text-[9px] sm:text-[10px]" style={{ color: lwColor }}>
                            {lastWeek}
                         </div>
                      </div>
                   )
                })}
           </div>
       </div>
    </div>
  )
}

export const ChartPredictionMedia = ({ songs, playerName, stage = 'Early', currentDate = new Date() }: { songs: any[], playerName: string, stage?: string, currentDate?: Date }) => {
  const chartDate = new Date(currentDate);
  chartDate.setDate(chartDate.getDate() + 7);
  const dataEnd = new Date(currentDate);
  const dataStart = new Date(currentDate);
  dataStart.setDate(dataStart.getDate() - 6);
  
  const formattedChartDate = chartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const formattedDataDate = `${dataStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${dataEnd.getDate()}`;

  return (
    <div className="bg-[#111111] text-white p-2.5 sm:p-3 rounded-[1rem] flex flex-col select-none font-sans overflow-hidden w-[85%] sm:w-[80%] max-w-[420px] mx-auto my-2 border border-gray-800 shadow-2xl">
       {/* Header */}
       <div className="flex flex-col mb-3">
          <div className="flex justify-between items-center mb-1 border-b border-gray-800 pb-2">
             <div className="flex flex-col">
                <div className="text-gray-500 font-bold text-[8px] sm:text-[9px] uppercase tracking-[0.2em] mb-0.5">
                   Predictions
                </div>
                <h3 className="font-extrabold text-[11px] sm:text-[13px] tracking-tight text-white m-0 leading-none flex items-center gap-1.5">
                  {stage} Hot 100 <span className="bg-[#38bdf8] text-black px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase">UPDATE</span>
                </h3>
             </div>
             <div className="flex flex-col items-end text-[7px] sm:text-[8px] font-medium text-gray-500 uppercase tracking-widest text-right">
                <div className="mb-0.5">Chart: {formattedChartDate}</div>
                <div>Data: {formattedDataDate}</div>
             </div>
          </div>
       </div>

       {/* Table wrapper */}
       <div className="bg-[#161616] rounded-md overflow-hidden border border-gray-800">
          {/* Table Header */}
          <div className="flex text-[7px] sm:text-[8px] font-bold text-gray-500 border-b border-gray-800 py-1.5 px-2 items-center tracking-widest uppercase bg-[#1a1a1a]">
             <div className="w-[14px] sm:w-[18px] text-center">#</div>
             <div className="w-[20px] sm:w-[24px] text-center">+/-</div>
             <div className="flex-1 pl-1">Title</div>
             <div className="w-[22px] sm:w-[28px] text-right">Pts</div>
             <div className="w-[18px] sm:w-[22px] text-right">%</div>
             <div className="w-[14px] sm:w-[18px] text-right">Pk</div>
             <div className="w-[16px] sm:w-[20px] text-right">Wk</div>
          </div>

          {/* Rows */}
          <div className="flex flex-col">
             {songs.slice(0, 10).map((song: any, i: number) => {
                const isNew = song.isNew;
                const changeNum = song.movement || 0;
                
                let changeEl;
                if (isNew) {
                   changeEl = <span className="text-[#38bdf8] font-black text-[7px] sm:text-[8px]">{song.isReEntry ? 'RE' : 'NEW'}</span>;
                } else if (changeNum > 0) {
                   changeEl = <span className="text-[#4ade80] font-bold text-[8px] sm:text-[9px]">▲{changeNum}</span>;
                } else if (changeNum < 0) {
                   changeEl = <span className="text-[#f87171] font-bold text-[8px] sm:text-[9px]">▼{Math.abs(changeNum)}</span>;
                } else {
                   changeEl = <span className="text-gray-600 font-bold text-[9px] sm:text-[10px]">=</span>;
                }
                
                const points = Math.floor(itemToPoints(song));
                const percent = isNew ? '--' : `${changeNum > 0 ? '+' : ''}${Math.abs((hash(song.id)%15))}%`;
                const percentColor = changeNum > 0 ? 'text-[#4ade80]' : 'text-[#f87171]';
                
                const peak = song.peak || (i + 1);
                const woc = song.weeksOnChart || 1;

                return (
                  <div key={song.id || i} className={`flex items-center text-[9px] sm:text-[10px] font-medium py-1 px-2 border-b border-gray-800/50 hover:bg-white/5 transition-colors ${i < 3 ? 'bg-[#1a1a1a]' : ''}`}>
                     <div className={`w-[14px] sm:w-[18px] text-center font-bold text-[9px] sm:text-[11px] ${i === 0 ? 'text-[#38bdf8]' : 'text-gray-400'}`}>{i + 1}</div>
                     <div className="w-[20px] sm:w-[24px] text-center flex items-center justify-center tracking-tighter">
                        {changeEl}
                     </div>
                     <div className="flex-1 flex items-center gap-1.5 pl-1 overflow-hidden">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-900 shrink-0 overflow-hidden rounded-[2px] relative border border-gray-700">
                           {song.coverImage ? <img src={song.coverImage || undefined} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex border border-gray-800"></div>}
                        </div>
                        <div className="flex flex-col truncate leading-tight justify-center">
                           <span className={`font-bold truncate text-[9px] sm:text-[10px] ${song.isPlayer ? 'text-white' : 'text-gray-200'}`}>{song.title}</span>
                           <span className={`text-[7px] sm:text-[8px] truncate font-semibold tracking-wide ${song.isPlayer ? 'text-[#38bdf8]' : 'text-gray-500'}`}>{song.isPlayer ? playerName : song.artist || 'Unknown Artist'}</span>
                        </div>
                     </div>
                     <div className="w-[22px] sm:w-[28px] text-right text-gray-300 font-bold text-[8px] sm:text-[9px]">
                        {points}
                     </div>
                     <div className={`w-[18px] sm:w-[22px] text-right text-[7px] sm:text-[8px] font-bold ${isNew ? 'text-gray-600' : percentColor}`}>
                        {percent}
                     </div>
                     <div className="w-[14px] sm:w-[18px] text-right text-gray-400 font-bold text-[8px] sm:text-[9px] text-center">{peak}</div>
                     <div className="w-[16px] sm:w-[20px] text-right text-gray-600 font-bold text-[8px] sm:text-[9px] text-center">{woc}</div>
                  </div>
                );
             })}
          </div>
          <div className="py-2 text-center text-[7px] sm:text-[8px] font-bold text-gray-600 bg-[#161616] w-full border-t border-gray-800 uppercase tracking-[0.2em]">
             <span className="text-[#38bdf8]">@talkofthecharts</span> • Subscribers see Top 100
          </div>
       </div>
    </div>
  );
};

