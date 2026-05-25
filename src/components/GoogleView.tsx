import React, { useState, useMemo } from 'react';
import { GameState } from '../types';
import { Search, ChevronDown, Check, X, AlignJustify } from 'lucide-react';
import { generateNPCSongs, generateNPCAlbums } from '../constants';
import { ARTIST_IMAGES } from '../artistImages';
import { RadioChart } from './RadioChart';

interface GoogleViewProps {
  gameState: GameState;
  onClose: () => void;
}

export function GoogleView({ gameState, onClose }: GoogleViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'google' | 'spotify' | 'spotify_detail' | 'radio'>('google');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDailyDetail, setIsDailyDetail] = useState<boolean>(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setView('spotify');
  };

  if (view === 'spotify') {
    return <SpotifyCharts gameState={gameState} onBack={() => setView('google')} onSelect={(item, isDaily) => { setSelectedItem(item); setIsDailyDetail(isDaily); setView('spotify_detail'); }} />;
  }
  
  if (view === 'spotify_detail') {
    return <SpotifyDetail item={selectedItem} isDaily={isDailyDetail} gameState={gameState} onBack={() => setView('spotify')} />;
  }

  if (view === 'radio') {
    return <RadioChart gameState={gameState} onBack={() => setView('google')} />;
  }

  return (
    <div className="flex flex-col items-center w-full h-full bg-white text-black p-4 pt-20 relative font-sans overflow-y-auto">
       <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:bg-gray-100 p-2 border border-gray-100 rounded-full">
         <X className="w-5 h-5"/>
       </button>
       <div className="flex flex-col items-center w-full max-w-2xl gap-8">
         <div className="text-6xl sm:text-7xl font-sans font-medium tracking-tighter cursor-pointer" style={{color: '#4285F4'}}>
            <span style={{color: '#4285F4'}}>G</span><span style={{color: '#EA4335'}}>o</span><span style={{color: '#FBBC05'}}>o</span><span style={{color: '#4285F4'}}>g</span><span style={{color: '#34A853'}}>l</span><span style={{color: '#EA4335'}}>e</span>
         </div>
         <form onSubmit={handleSearch} className="w-full relative flex items-center group">
            <Search className="w-5 h-5 absolute left-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Google or type a URL"
              className="w-full border border-gray-200 rounded-full py-3 sm:py-4 pl-12 pr-4 shadow-sm hover:shadow-md focus:shadow-md focus:outline-none transition-shadow text-lg"
            />
         </form>
         <div className="flex gap-4">
            <button type="button" onClick={handleSearch} className="bg-gray-50 text-sm font-medium px-4 py-2 text-gray-700 rounded transition-colors hover:bg-gray-100">
               Google Search
            </button>
            <button type="button" onClick={handleSearch} className="bg-gray-50 text-sm font-medium px-4 py-2 text-gray-700 rounded transition-colors hover:bg-gray-100">
               I'm Feeling Lucky
            </button>
         </div>

         {/* Discover News Feed */}
         <div className="w-full max-w-2xl mt-12 flex flex-col gap-4 text-left">
            <h3 className="text-xl font-medium text-gray-800 mb-2">Discover</h3>
            
            <div className="flex gap-4 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setView('radio')}>
               <div className="flex-1 flex flex-col justify-between">
                  <h4 className="font-bold text-lg leading-tight mb-2">US Radio Top 50: Official Airplay Charts updated</h4>
                  <p className="text-sm text-gray-500">RadioTracker US • Just now</p>
               </div>
               <div className="w-24 h-24 bg-red-100 rounded-lg shrink-0 flex items-center justify-center">
                 <span className="text-4xl">📻</span>
               </div>
            </div>

            <div className="flex gap-4 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSearchQuery('chart')}>
               <div className="flex-1 flex flex-col justify-between">
                  <h4 className="font-bold text-lg leading-tight mb-2">Spotify announces new global charts criteria focusing on organic reach</h4>
                  <p className="text-sm text-gray-500">Music Industry Weekly • 2 hours ago</p>
               </div>
               <div className="w-24 h-24 bg-green-100 rounded-lg shrink-0 flex items-center justify-center">
                 <span className="text-4xl">📈</span>
               </div>
            </div>

            <div className="flex gap-4 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer">
               <div className="flex-1 flex flex-col justify-between">
                  <h4 className="font-bold text-lg leading-tight mb-2">Independent artists are dominating the streams this year, report shows</h4>
                  <p className="text-sm text-gray-500">The Sounds • 5 hours ago</p>
               </div>
               <div className="w-24 h-24 bg-purple-100 rounded-lg shrink-0 flex items-center justify-center">
                 <span className="text-4xl">🎸</span>
               </div>
            </div>

            <div className="flex gap-4 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer">
               <div className="flex-1 flex flex-col justify-between">
                  <h4 className="font-bold text-lg leading-tight mb-2">Major labels rethinking strategy as physical sales see surprising return</h4>
                  <p className="text-sm text-gray-500">Global Music News • 1 day ago</p>
               </div>
               <div className="w-24 h-24 bg-blue-100 rounded-lg shrink-0 flex items-center justify-center">
                 <span className="text-4xl">💿</span>
               </div>
            </div>
         </div>
       </div>
    </div>
  );
}

function SpotifyCharts({ gameState, onBack, onSelect }: { gameState: GameState, onBack: () => void, onSelect: (item: any, isDaily: boolean) => void }) {
  const [chartView, setChartView] = useState<'home' | 'list'>('home');
  const [currentChartType, setCurrentChartType] = useState<'weekly_songs' | 'daily_songs' | 'weekly_albums' | 'daily_artists'>('weekly_songs');

  const currentDateObj = new Date(gameState.time.startDate);
  currentDateObj.setDate(currentDateObj.getDate() + gameState.time.daysPassed);
  const formattedDaily = currentDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();

  const chartData = useMemo(() => {
    const publishedPlayer = gameState.releases.filter(r => r.status === 'Published').map(r => {
      let daysSinceRelease = 1;
      if (r.releaseDate) {
         daysSinceRelease = Math.max(1, Math.floor((currentDateObj.getTime() - new Date(r.releaseDate).getTime()) / (1000 * 3600 * 24)));
      }
      
      let dailySpotify = r.lastDailyStreams?.spotify || 0;
      if (dailySpotify === 0 && (r.streams?.spotify || 0) > 0) {
          dailySpotify = Math.floor(r.streams!.spotify / daysSinceRelease);
      }
      
      return {
        ...r,
        isPlayer: true,
        artist: gameState.artist?.name || 'Player',
        totalStreams: r.streams?.spotify || 0,
        weeklyStreams: dailySpotify * 7,
        dailyStreams: dailySpotify,
      };
    });
    
    // NPC streams scale gracefully and realistically
    const daySeed = Math.floor(gameState.time.daysPassed / 10);
    const pName = gameState.artist?.name || '';
    const npcSongs = generateNPCSongs(1, daySeed, pName).map((s, i) => {
       const fluctuation = 1 + (Math.sin(gameState.time.daysPassed + i) * 0.1);
       const isHit = i % 10 === 0 ? 3.5 : (i % 3 === 0 ? 0.5 : 1);
       const daily = Math.floor(s.points * 6 * fluctuation * isHit); // Max around ~8M - 12M daily Spotify streams for big hits
       return { 
          ...s, 
          coverImage: s.coverImage || ARTIST_IMAGES[s.artist as string] || `https://i.pravatar.cc/200?u=${encodeURIComponent(s.artist)}`,
          totalStreams: daily * (50 + gameState.time.daysPassed % 300), 
          weeklyStreams: daily * 7, 
          dailyStreams: daily 
       };
    });
    
    const npcAlbums = generateNPCAlbums(1, daySeed, pName).map((s, i) => {
       const fluctuation = 1 + (Math.cos(gameState.time.daysPassed + i) * 0.1);
       const isHit = i % 8 === 0 ? 3.0 : (i % 3 === 0 ? 0.5 : 1);
       const daily = Math.floor(s.points * 5 * fluctuation * isHit);
       return { 
          ...s, 
          coverImage: s.coverImage || ARTIST_IMAGES[s.artist as string] || `https://i.pravatar.cc/200?u=${encodeURIComponent(s.artist)}`,
          totalStreams: daily * (50 + gameState.time.daysPassed % 200), 
          weeklyStreams: daily * 7, 
          dailyStreams: daily 
       };
    });
    
    const playerSongs = publishedPlayer.filter(p => p.type === 'Single');
    const playerAlbums = publishedPlayer.filter(p => p.type === 'Album');
    
    const allSongs = [...playerSongs, ...npcSongs];
    const allAlbums = [...playerAlbums, ...npcAlbums];

    const weeklySongs = [...allSongs].sort((a,b) => b.weeklyStreams - a.weeklyStreams).slice(0, 100);
    const dailySongs = [...allSongs].sort((a,b) => b.dailyStreams - a.dailyStreams).slice(0, 100);
    const weeklyAlbums = [...allAlbums].sort((a,b) => b.weeklyStreams - a.weeklyStreams).slice(0, 100);

    const artistMapDaily: Record<string, number> = {};
    const imgMap: Record<string, string> = {};
    const addArtistDaily = (name: string, pts: number, img?: string) => {
      artistMapDaily[name] = (artistMapDaily[name] || 0) + pts;
      if (img && !imgMap[name]) imgMap[name] = img;
    };
    
    allSongs.forEach(r => addArtistDaily(r.artist, r.dailyStreams, r.coverImage));
    allAlbums.forEach(r => addArtistDaily(r.artist, r.dailyStreams, r.coverImage));

    const dailyArtists = Object.entries(artistMapDaily)
        .map(([name, pts]) => {
           let finalImage = imgMap[name];
           const playerName = gameState.artist?.name || 'Player';
           if (name === playerName || name === 'You') {
              if (gameState.artist?.image) finalImage = gameState.artist.image;
              else finalImage = ''; // no fallback to song cover
           }
           return { title: name, artist: name, type: 'Artist', isPlayer: name === playerName || name === 'You', dailyStreams: pts, weeklyStreams: pts * 7, coverImage: finalImage };
        })
        .sort((a,b) => b.dailyStreams - a.dailyStreams)
        .slice(0, 100);

    return { weeklySongs, dailySongs, weeklyAlbums, dailyArtists };
  }, [gameState]);

  const handleOpenList = (type: 'weekly_songs' | 'daily_songs' | 'weekly_albums' | 'daily_artists') => {
    setCurrentChartType(type);
    setChartView('list');
  };

  if (chartView === 'list') {
     return <SpotifyList 
        type={currentChartType} 
        data={chartData} 
        formattedDaily={formattedDaily} 
        onBack={() => setChartView('home')} 
        onSelect={onSelect} 
        gameState={gameState}
        currentDateObj={currentDateObj} 
     />;
  }

  return (
    <div className="flex flex-col w-full h-full bg-white text-black overflow-hidden font-sans">
       <div className="sticky top-0 bg-white z-50 px-4 py-3 flex items-center border-b border-gray-200 justify-between">
          <div className="flex items-center gap-3">
             <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6"/></button>
             <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
               <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <div className="flex flex-col gap-[3px] items-center pb-0.5 pl-0.5">
                     <div className="w-4 h-1 bg-white rounded-full bg-opacity-90 transform -rotate-6"></div>
                     <div className="w-3.5 h-[3px] bg-white rounded-full bg-opacity-80 transform -rotate-6 ml-0.5"></div>
                     <div className="w-2.5 h-[2px] bg-white rounded-full bg-opacity-70 transform -rotate-6 ml-1"></div>
                  </div>
               </div>
               Charts
             </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-300 border border-gray-300 flex items-center justify-center text-xs font-bold overflow-hidden">
             {gameState.artist?.name ? gameState.artist.name[0] : 'U'}
          </div>
       </div>

       <div className="flex-1 overflow-y-auto">
         <div className="p-4 border-b border-gray-200">
           <button className="flex items-center justify-between w-full border border-gray-300 rounded-md py-2.5 px-4 text-sm font-medium hover:bg-gray-50 transition-colors">
              Global
              <ChevronDown className="w-4 h-4 text-gray-500" />
           </button>
         </div>

         <div className="flex px-4 py-2 border-b border-gray-200">
            <span className="font-bold border-b-2 border-black pb-2 mr-6 text-sm">Flagship</span>
            <span className="font-bold text-gray-400 pb-2 text-sm">City</span>
         </div>

         <div className="p-4 space-y-4 bg-white pb-20">
            
            {/* Weekly Top Songs Global */}
            <div className="bg-[#6b359f] text-white p-5 rounded-lg flex flex-col justify-between cursor-pointer hover:opacity-95 transition-opacity" style={{aspectRatio: '1', maxHeight: '400px'}} onClick={() => handleOpenList('weekly_songs')}>
               <div className="text-4xl sm:text-5xl font-black tracking-tight leading-none mb-4 w-[70%]">Weekly Top Songs<br/><span className="opacity-90">Global</span></div>
               <div className="mt-auto flex items-end gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); onSelect(chartData.weeklySongs[0], false); }}>
                 <div className="w-24 h-24 bg-black/20 shadow-xl shrink-0 overflow-hidden">
                    <ChartCoverImage item={chartData.weeklySongs[0]} />
                 </div>
                 <div className="flex flex-col min-w-0 pb-1">
                    <span className="bg-white text-black text-[10px] font-black px-1.5 py-0.5 rounded-sm w-max uppercase mb-1 tracking-tight">#1 THIS WEEK</span>
                    <span className="font-bold text-lg sm:text-xl truncate leading-tight">{chartData.weeklySongs[0]?.title || 'Unknown'}</span>
                    <span className="text-sm font-medium opacity-90 truncate">{chartData.weeklySongs[0]?.artist || 'Unknown'}</span>
                 </div>
               </div>
            </div>

            {/* Daily Top Songs Global */}
            <div className="bg-[#f2ece4] text-[#6b359f] p-5 rounded-lg flex flex-col justify-between cursor-pointer hover:opacity-95 transition-opacity" style={{aspectRatio: '1', maxHeight: '400px'}} onClick={() => handleOpenList('daily_songs')}>
               <div className="text-4xl sm:text-5xl font-black tracking-tight leading-none mb-4 w-[70%]">Daily Top Songs<br/><span className="opacity-90">Global</span></div>
               <div className="mt-auto flex items-end gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); onSelect(chartData.dailySongs[0], true); }}>
                 <div className="w-24 h-24 bg-black/10 shadow-xl shrink-0 overflow-hidden relative">
                    <ChartCoverImage item={chartData.dailySongs[0]} />
                    {!chartData.dailySongs[0]?.coverImage && <div className="absolute bottom-0 w-full bg-yellow-400 text-black text-[10px] font-black text-center py-1 uppercase truncate px-1">NEW</div>}
                 </div>
                 <div className="flex flex-col min-w-0 pb-1">
                    <span className="bg-[#6b359f] text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm w-max uppercase mb-1 tracking-tight">#1 {formattedDaily}</span>
                    <span className="font-bold text-lg sm:text-xl text-[#6b359f] truncate leading-tight">{chartData.dailySongs[0]?.title || 'Unknown'}</span>
                    <span className="text-sm font-medium text-[#6b359f]/80 truncate">{chartData.dailySongs[0]?.artist || 'Unknown'}</span>
                 </div>
               </div>
            </div>

            {/* Weekly Top Albums Global */}
            <div className="bg-[#0f6c4c] text-white p-5 rounded-lg flex flex-col justify-between cursor-pointer hover:opacity-95 transition-opacity" style={{aspectRatio: '1', maxHeight: '400px'}} onClick={() => handleOpenList('weekly_albums')}>
               <div className="text-4xl sm:text-5xl font-black tracking-tight leading-none mb-4 w-[70%]">Weekly Top Albums<br/><span className="opacity-90">Global</span></div>
               <div className="mt-auto flex items-end gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); onSelect(chartData.weeklyAlbums[0], false); }}>
                 <div className="w-24 h-24 bg-black/20 shadow-xl shrink-0 overflow-hidden relative">
                    <ChartCoverImage item={chartData.weeklyAlbums[0]} />
                 </div>
                 <div className="flex flex-col min-w-0 pb-1">
                    <span className="bg-white text-black text-[10px] font-black px-1.5 py-0.5 rounded-sm w-max uppercase mb-1 tracking-tight">#1 THIS WEEK</span>
                    <span className="font-bold text-lg sm:text-xl truncate leading-tight">{chartData.weeklyAlbums[0]?.title || 'Unknown'}</span>
                    <span className="text-sm font-medium opacity-90 truncate">{chartData.weeklyAlbums[0]?.artist || 'Unknown'}</span>
                 </div>
               </div>
            </div>

            {/* Daily Top Artists Global */}
            <div className="bg-[#f2ece4] text-[#2c52c6] p-5 rounded-lg flex flex-col justify-between cursor-pointer hover:opacity-95 transition-opacity" style={{aspectRatio: '1', maxHeight: '400px'}} onClick={() => handleOpenList('daily_artists')}>
               <div className="text-4xl sm:text-5xl font-black tracking-tight leading-none mb-4 w-[70%]">Daily Top Artists<br/><span className="opacity-90">Global</span></div>
               <div className="mt-auto flex items-end gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); onSelect(chartData.dailyArtists[0], true); }}>
                 <div className="w-24 h-24 bg-[#2c52c6] shadow-xl shrink-0 overflow-hidden rounded-md relative flex items-center justify-center text-white">
                    {chartData.dailyArtists[0]?.coverImage ? <img src={chartData.dailyArtists[0].coverImage || undefined} className="w-full h-full object-cover" /> : <span className="text-3xl font-black">{chartData.dailyArtists[0]?.title?.substring(0, 2).toUpperCase() || 'A'}</span>}
                 </div>
                 <div className="flex flex-col min-w-0 pb-1">
                    <span className="bg-[#2c52c6] text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm w-max uppercase mb-1 tracking-tight">#1 {formattedDaily}</span>
                    <span className="font-bold text-lg sm:text-xl text-[#2c52c6] truncate leading-tight">{chartData.dailyArtists[0]?.title || 'Unknown'}</span>
                 </div>
               </div>
            </div>

         </div>
       </div>
    </div>
  );
}

function SpotifyList({ type, data, formattedDaily, onBack, onSelect, gameState, currentDateObj }: any) {
  const getListData = () => {
     switch(type) {
        case 'weekly_songs': return { list: data.weeklySongs, title: 'Weekly Top Songs Global', subtitle: 'Your weekly update of the most played tracks right now.', isDaily: false };
        case 'daily_songs': return { list: data.dailySongs, title: 'Daily Top Songs Global', subtitle: 'Your daily update of the most played tracks right now.', isDaily: true };
        case 'weekly_albums': return { list: data.weeklyAlbums, title: 'Weekly Top Albums Global', subtitle: 'Your weekly update of the most played albums right now.', isDaily: false };
        case 'daily_artists': return { list: data.dailyArtists, title: 'Daily Top Artists Global', subtitle: 'Your daily update of the most listened artists right now.', isDaily: true };
        default: return { list: [], title: 'Chart', subtitle: '', isDaily: false };
     }
  };

  const { list, title, subtitle, isDaily } = getListData();

  return (
    <div className="flex flex-col w-full h-full bg-white text-black overflow-hidden font-sans">
       <div className="sticky top-0 bg-white z-50 px-4 py-3 flex items-center border-b border-gray-200 justify-between shadow-sm">
          <div className="flex items-center gap-3">
             <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors font-medium">← Back</button>
             <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
                Spotify Charts
             </div>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto pb-10">
          <div className="p-6">
             <h1 className="text-3xl font-black tracking-tight mb-2">{title}</h1>
             <p className="text-gray-600 mb-6">{subtitle}</p>

             <div className="flex gap-3 mb-6">
                 <button className="border border-gray-300 rounded-full px-4 py-1.5 text-sm font-medium flex items-center gap-2">
                    {isDaily ? 'Daily' : 'Weekly'}
                    <ChevronDown className="w-4 h-4" />
                 </button>
                 <button className="border border-gray-300 rounded-full px-4 py-1.5 text-sm font-medium flex items-center gap-2">
                    {isDaily ? formattedDaily : 'This Week'}
                    <ChevronDown className="w-4 h-4" />
                 </button>
             </div>
          </div>

          <div className="w-full text-left">
             <div className="px-6 py-2 border-b border-gray-100 flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="w-16">#</div>
                <div className="flex-1">{type === 'daily_artists' ? 'Artist' : 'Track'}</div>
                <div className="w-20 text-center hidden md:block" title="Time on Chart">Streak</div>
                <div className="w-24 text-right pr-4 hidden sm:block">Streams</div>
             </div>
             
             <div className="flex flex-col">
                {list.map((item: any, index: number) => {
                   const streamsText = Math.floor(isDaily ? item.dailyStreams : item.weeklyStreams).toLocaleString();

                   const hash = item.title ? item.title.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0) : 0;
                   let daysSinceRelease = 1;
                   if (item.releaseDate) {
                       daysSinceRelease = Math.max(0, Math.floor((currentDateObj.getTime() - new Date(item.releaseDate).getTime()) / (1000 * 3600 * 24)));
                   } else {
                       const pseudoAgeDays = (hash % 300) + 10; // 10 to 310 days old
                       daysSinceRelease = Math.max(1, gameState.time.daysPassed + pseudoAgeDays); 
                   }

                   const isNew = isDaily ? daysSinceRelease <= 1 : daysSinceRelease <= 7;
                   let changeElement = null;
                   let fakePrevPos = index + 1;

                   if (isNew) {
                       changeElement = <div className="text-blue-500 text-[10px] font-bold uppercase">New</div>;
                   } else if (daysSinceRelease > (isDaily ? 1 : 7) && daysSinceRelease < (isDaily ? 3 : 14) && hash % 15 === 0) {
                       changeElement = <div className="text-purple-500 text-[10px] font-bold uppercase">Re-Entry</div>;
                   }

                   if (!changeElement) {
                       if (item.isPlayer && (item.dailyStreams || 0) > (item.lastDailyStreams?.total || 0) && isDaily && item.lastDailyStreams) {
                           fakePrevPos = (index + 1) + Math.floor(Math.random() * 5 + 1); // it rose
                       } else {
                           const wobble = Math.floor((hash + daysSinceRelease) % 5);
                           if (wobble === 0) {
                                fakePrevPos = index + 1;
                           } else if (wobble > 2) {
                                fakePrevPos = (index + 1) + (wobble - 1);
                           } else {
                                fakePrevPos = Math.max(1, (index + 1) - wobble);
                           }
                       }
                       
                       if (fakePrevPos > index + 1) {
                           const changeNum = fakePrevPos - (index + 1);
                           changeElement = <div className="flex items-center text-green-500 text-[10px] font-bold"><span className="text-[12px] leading-none mb-0.5">↑</span> {changeNum}</div>;
                       } else if (fakePrevPos < index + 1) {
                           const changeNum = (index + 1) - fakePrevPos;
                           changeElement = <div className="flex items-center text-red-500 text-[10px] font-bold"><span className="text-[12px] leading-none mb-0.5">↓</span> {changeNum}</div>;
                       } else {
                           changeElement = <div className="text-gray-300 text-lg leading-none">-</div>;
                       }
                   }

                   return (
                      <div key={index} className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-transparent group" onClick={() => {
                          const detailItem = {
                              ...item, 
                              currentPos: index + 1, 
                              prevPos: isNew ? 'N/A' : fakePrevPos, 
                              isNew, 
                              daysSinceRelease, weeksOnChart: Math.max(1, Math.floor(daysSinceRelease / 7))
                          };
                          onSelect(detailItem, isDaily);
                      }}>
                         <div className="w-16 flex flex-col items-center justify-center shrink-0">
                            <span className="font-bold text-lg">{index + 1}</span>
                            {changeElement}
                         </div>
                         
                         <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                            <div className={`w-12 h-12 bg-gray-200 shrink-0 shadow-sm ${type === 'daily_artists' ? 'rounded-full overflow-hidden' : ''}`}>
                               <ChartCoverImage item={item} />
                            </div>
                            <div className="flex flex-col min-w-0">
                               <span className="font-bold text-base truncate">{item.title}</span>
                               {item.type !== 'Artist' && (
                                   <span className="text-sm text-gray-500 truncate">{item.artist}</span>
                               )}
                            </div>
                         </div>

                         <div className="w-20 text-center text-xs text-gray-500 font-medium hidden md:block uppercase tracking-wider">
                            {isNew ? '-' : (isDaily ? `${daysSinceRelease} Day${daysSinceRelease !== 1 ? 's' : ''}` : `${Math.floor(daysSinceRelease / 7)} Wk${Math.floor(daysSinceRelease / 7) !== 1 ? 's' : ''}`)}
                         </div>

                         <div className="w-24 text-right text-sm text-gray-500 pr-4 hidden sm:block">
                            {streamsText}
                         </div>
                      </div>
                   );
                })}
             </div>
          </div>
       </div>
    </div>
  );
}

function ChartCoverImage({ item }: { item: any }) {
   if (item?.coverImage) {
      return <img src={item.coverImage || undefined} className="w-full h-full object-cover" />;
   }
   
   // Generate fallback cover
   const isArtist = item?.type === 'Artist';
   const hash = item?.title ? item.title.split('').reduce((a: number,b: string) => a + b.charCodeAt(0), 0) : 0;
   const hue = hash % 360;
   const initials = item?.title?.substring(0, 2).toUpperCase() || 'NA';
   
   return (
      <div 
        className="w-full h-full flex flex-col items-center justify-center font-black text-white p-1 text-center leading-none"
        style={{
           background: `linear-gradient(135deg, hsl(${hue}, 60%, 50%), hsl(${(hue + 40)%360}, 60%, 30%))`,
           fontSize: isArtist ? '20px' : '10px'
        }}
      >
        {isArtist ? initials : <div className="truncate w-full">{item.artist}</div>}
      </div>
   );
}


function SpotifyDetail({ item, isDaily, gameState, onBack }: { item: any, isDaily: boolean, gameState: GameState, onBack: () => void }) {
  if (!item) return <div className="h-full bg-white text-black p-4"><button onClick={onBack}>Back</button></div>;

  const pointsText = Math.floor(isDaily ? item.dailyStreams : item.weeklyStreams).toLocaleString();
  const streamLabel = isDaily ? "Daily Streams" : "Weekly Streams";

  // Compute a generated first entry date for NPCs based on current date minus some hash
  const hash = item.title ? item.title.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0) : 0;
  
  let entryDateStr = 'N/A';
  let releaseDateStr = 'N/A';
  if (item.releaseDate) {
      entryDateStr = new Date(item.releaseDate).toLocaleDateString();
      releaseDateStr = new Date(item.releaseDate).toLocaleDateString();
  } else {
      const pseudoAgeDays = (hash % 300) + 10;
      const releaseDateObj = new Date(gameState.time.startDate);
      releaseDateObj.setDate(releaseDateObj.getDate() + gameState.time.daysPassed - pseudoAgeDays);
      releaseDateStr = releaseDateObj.toLocaleDateString();
      
      const entryDateObj = new Date(releaseDateObj);
      entryDateObj.setDate(entryDateObj.getDate() + (hash % 10) + 1); // entered chart 1 to 10 days after release
      entryDateStr = entryDateObj.toLocaleDateString();
  }
  
  let daysSinceRelease = item.daysSinceRelease;
  if (daysSinceRelease === undefined) {
       daysSinceRelease = 1;
       if (item.releaseDate) {
           const currentDateObj = new Date(gameState.time.startDate);
           currentDateObj.setDate(currentDateObj.getDate() + gameState.time.daysPassed);
           daysSinceRelease = Math.max(0, Math.floor((currentDateObj.getTime() - new Date(item.releaseDate).getTime()) / (1000 * 3600 * 24)));
       } else {
           const pseudoAgeDays = (hash % 300) + 10;
           daysSinceRelease = Math.max(1, gameState.time.daysPassed + pseudoAgeDays);
       }
  }
  
  const isNew = item.isNew !== undefined ? item.isNew : (isDaily ? daysSinceRelease <= 1 : daysSinceRelease <= 7);
  const weeksOnChart = item.weeksOnChart !== undefined ? item.weeksOnChart : Math.max(1, Math.floor(daysSinceRelease / 7));

  const currentPos = item.currentPos || 1;
  const pseudoPeak = Math.min(currentPos, (hash % currentPos) + 1);
  const prevPos = item.prevPos || (isNew ? 'N/A' : currentPos + (hash % 10));

  const streak = isNew ? 1 : (isDaily ? daysSinceRelease : weeksOnChart);
  const totalChartTime = isDaily ? streak : weeksOnChart + (hash % Math.max(1, weeksOnChart));

  return (
    <div className="flex flex-col w-full h-full bg-white text-black overflow-hidden font-sans">
       <div className="sticky top-0 bg-white z-50 px-4 py-3 flex items-center border-b border-gray-200 justify-between">
          <div className="flex items-center gap-3 w-full">
             <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6"/></button>
             <div className="flex items-center gap-2 font-bold text-xl tracking-tight flex-1">
                Details
             </div>
             <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold">
               {gameState.artist?.name ? gameState.artist.name[0] : 'U'}
             </div>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-28 h-28 bg-gray-200 shrink-0 shadow-md">
                 <ChartCoverImage item={item} />
             </div>
             <div>
                <h1 className="text-2xl font-black tracking-tight leading-tight mb-2">{item.title}</h1>
                <h2 className="text-gray-600 font-medium text-lg">{item.artist}</h2>
             </div>
          </div>

          <div className="flex flex-col divide-y divide-gray-100">
             <DetailRow label="Producers" value={item.isPlayer ? "Player Studio" : "Various"} />
             <DetailRow label="Songwriters" value={item.artist} />
             <DetailRow label="Source" value="Indie" />
             <DetailRow label="Peak" value={pseudoPeak} />
             <DetailRow label={isDaily ? "Prev Day" : "Prev Week"} value={prevPos} />
             <DetailRow label="Streak" value={streak} />
             <DetailRow label={streamLabel} value={pointsText} />
             <DetailRow label="Release Date" value={releaseDateStr} />
             <DetailRow label="First entry date" value={entryDateStr} />
             <DetailRow label="First entry position" value={(hash % 90) + 10} />
             <DetailRow label={isDaily ? "Total days on chart" : "Total weeks on chart"} value={totalChartTime} />
          </div>
       </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="flex justify-between items-start py-4">
       <span className="font-bold text-sm w-1/3 text-gray-900">{label}</span>
       <span className="text-sm text-gray-600 w-2/3 text-right sm:text-left">{value}</span>
    </div>
  );
}
