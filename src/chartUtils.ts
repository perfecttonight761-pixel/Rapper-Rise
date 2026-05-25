import { GameState } from './types';
import { generateNPCSongs, generateNPCAlbums } from './constants';
import { ARTIST_IMAGES } from './artistImages';

export const computeCharts = (gameState: GameState) => {
    const today = new Date(gameState.time.startDate);
    today.setDate(today.getDate() + gameState.time.daysPassed);
    
    // Simulate updating once a week
    const currentWeekNumber = Math.max(1, Math.floor(gameState.time.daysPassed / 7)); 
    const previousWeekNumber = Math.max(1, currentWeekNumber - 1);

    const currentWeekFluctuation = 1 + (Math.sin(currentWeekNumber / 10) * 0.05);
    const prevWeekFluctuation = 1 + (Math.sin(previousWeekNumber / 10) * 0.05);
    
    const pName = gameState.artist?.name || '';
    const npcSingles = generateNPCSongs(currentWeekFluctuation, currentWeekNumber, pName);
    const npcAlbums = generateNPCAlbums(currentWeekFluctuation, currentWeekNumber, pName);
    const npcSinglesPrev = generateNPCSongs(prevWeekFluctuation, previousWeekNumber, pName);
    const npcAlbumsPrev = generateNPCAlbums(prevWeekFluctuation, previousWeekNumber, pName);

    const publishedReleases = gameState.releases.filter(r => r.status === 'Published' && r.releaseDate);

    const generatePlayerItems = (isPrevWeek: boolean) => {
      return publishedReleases.map(r => {
        // Extrapolate current week's partial data to a full 7 days so it stays competitive with NPCs
        let daysIntoWeek = gameState.time.daysPassed % 7;
        if (daysIntoWeek === 0) daysIntoWeek = 7;

        let weeklyStreams = isPrevWeek ? (r.lastWeekStreams ?? 0) : ((r.currentWeekStreams ?? 0) / daysIntoWeek) * 7;
        let weeklySales = isPrevWeek ? (r.lastWeekSales ?? 0) : ((r.currentWeekSales ?? 0) / daysIntoWeek) * 7;
        let weeklyRadio = isPrevWeek ? (r.lastWeekRadio ?? 0) : ((r.currentWeekRadio ?? 0) / daysIntoWeek) * 7;

        // If it's the current week and we don't have accumulated stats yet (very new release), 
        // fallback to estimating from daily
        if (!isPrevWeek && (!r.currentWeekStreams || r.currentWeekStreams === 0) && r.lastDailyStreams?.total) {
             weeklyStreams = r.lastDailyStreams.total * 7;
             weeklySales = r.sales?.total || 0;
             weeklyRadio = r.currentWeekRadio || 0;
        }

        const totalPop = (gameState.popularity.america + gameState.popularity.latinAmerica + gameState.popularity.europe) || 1;
        const probAmerica = gameState.popularity.america / totalPop;
        const probLatin = gameState.popularity.latinAmerica / totalPop;
        const probEurope = gameState.popularity.europe / totalPop;

        let basePoints = 0;
        let activity = 0;
        let albums = 0;

        if (r.type === 'Single') {
           basePoints = (weeklyStreams / 200) + (weeklySales * 1.2) + (weeklyRadio / 800);
           activity = (weeklyStreams / 100) + (weeklySales * 1.2) + (weeklyRadio / 150);
           albums = weeklySales;
        } else {
           basePoints = (weeklyStreams / 300) + (weeklySales * 1.5) + (weeklyRadio / 1200);
           activity = (weeklyStreams / 150) + (weeklySales * 1.5) + (weeklyRadio / 250);
           albums = weeklySales * 1.2;
        }

        return {
          id: r.id,
          title: r.title,
          artist: Object.hasOwn(r, 'isNPCCollab') && (r as any).isNPCCollab 
              ? `${(r as any).collaborator} & ${gameState.artist?.name || 'You'}` 
              : (r.type === 'Single' && (r as any).collaborator ? `${gameState.artist?.name || 'You'} & ${(r as any).collaborator}` : gameState.artist?.name || 'You'),
          type: r.type,
          isPlayer: true,
          coverImage: r.coverImage,
          points: basePoints,
          computedTotal: basePoints,
          activity,
          albums,
          regionalPoints: {
             america: basePoints * probAmerica * 1.2,
             latinAmerica: basePoints * probLatin * 1.1,
             europe: basePoints * probEurope * 1.1,
             global: basePoints
          }
        };
      });
    };

    const playerItems = generatePlayerItems(false);
    const playerItemsPrev = generatePlayerItems(true);

    const npcItemsObj = (items: any[], weekNum: number) => {
        return items.map((npc) => {
            const genre = npc.artistGenre || 'Pop';
            const isLatin = genre === 'Latin';
            const isKpop = genre === 'Kpop';
            const isEuro = genre === 'Pop' && (npc.artist === 'Dua Lipa' || npc.artist === 'Ed Sheeran' || npc.artist === 'Adele');
            const isCountry = genre === 'Country';
            
            let popAm = isLatin ? 0.2 : isKpop ? 0.3 : isEuro ? 0.3 : isCountry ? 0.9 : 0.6;
            let popLat = isLatin ? 0.8 : isKpop ? 0.2 : isEuro ? 0.1 : isCountry ? 0.05 : 0.2;
            let popEur = isLatin ? 0.2 : isKpop ? 0.3 : isEuro ? 0.8 : isCountry ? 0.05 : 0.4;

            const reEntryHash = (npc.id.charCodeAt(0) + npc.artist.charCodeAt(0) + weekNum) % 15;
            const isReEntry = reEntryHash === 0;

            return {
                id: npc.id,
                title: npc.title,
                artist: npc.artist,
                type: npc.type,
                isPlayer: false,
                coverImage: npc.coverImage || ARTIST_IMAGES[npc.artist as string] || `https://i.pravatar.cc/200?u=${encodeURIComponent(npc.artist)}`,
                points: npc.points * 1.1,
                computedTotal: npc.points * 1.1,
                activity: npc.points * 1.2 * 1.1,
                albums: npc.type === 'Album' ? npc.points * 0.35 * 1.1 : 0,
                isReEntrySim: isReEntry,
                regionalPoints: {
                    america: npc.points * popAm * 1.1,
                    latinAmerica: npc.points * popLat * 1.1,
                    europe: npc.points * popEur * 1.1,
                    global: npc.points * 1.1
                }
            };
        });
    };

    const npcsS = npcItemsObj(npcSingles, currentWeekNumber);
    const npcsA = npcItemsObj(npcAlbums, currentWeekNumber);
    const npcsSPrev = npcItemsObj(npcSinglesPrev, previousWeekNumber);
    const npcsAPrev = npcItemsObj(npcAlbumsPrev, previousWeekNumber);

    const getFullCharts = (pItems: any[], nS: any[], nA: any[]) => {
       const allS = [...pItems.filter((p: any) => p.type === 'Single'), ...nS];
       const allA = [...pItems.filter((p: any) => p.type === 'Album'), ...nA];
       return {
          Hot100: [...allS].sort((a,b) => b.regionalPoints.america - a.regionalPoints.america).slice(0, 100),
          Global200Single: [...allS].sort((a,b) => b.regionalPoints.global - a.regionalPoints.global).slice(0, 200),
          Global200Album: [...allA].sort((a,b) => b.regionalPoints.global - a.regionalPoints.global).slice(0, 200),
          RegionAmerica: [...allS].sort((a,b) => b.regionalPoints.america - a.regionalPoints.america).slice(0, 100),
          RegionLatinAmerica: [...allS].sort((a,b) => b.regionalPoints.latinAmerica - a.regionalPoints.latinAmerica).slice(0, 100),
          RegionEurope: [...allS].sort((a,b) => b.regionalPoints.europe - a.regionalPoints.europe).slice(0, 100),
       };
    };

    const currentCharts = getFullCharts(playerItems, npcsS, npcsA);
    const previousCharts = getFullCharts(playerItemsPrev, npcsSPrev, npcsAPrev);

    const chartsWithMovement: Record<keyof ReturnType<typeof getFullCharts>, any[]> = {} as any;
    
    (Object.keys(currentCharts) as Array<keyof ReturnType<typeof getFullCharts>>).forEach(chartKey => {
       const currList = currentCharts[chartKey];
       const prevList = previousCharts[chartKey];
       const chartLimit = chartKey.includes('200') ? 200 : 100;
       
       chartsWithMovement[chartKey] = currList.map((item, index) => {
          const prevIndex = prevList.findIndex((p: any) => p?.id === item.id);
          let movement = 0; 
          let isNew = false;
          
          if (prevIndex === -1) {
             isNew = true;
          } else {
             movement = prevIndex - index;
          }

          const hashStr = item?.id + item?.title;
          let hash = 0;
          for(let i = 0; i < hashStr.length; i++) hash = Math.imul(31, hash) + hashStr.charCodeAt(i) | 0;
          const randomWeekVal = Math.abs(hash % 20) + 1;
          const randomPeakOffset = Math.abs(hash % 8);

          // If tracking week is exactly the same (daysPassed < 7), all is "NEW" or same as baseline
          // But to make it feel alive, we use currentWeekNumber to increment years/weeks
          let wks = isNew ? 1 : (randomWeekVal + currentWeekNumber);
          let pPeak = isNew ? (index + 1) : Math.max(1, Math.min(index + 1, Math.abs(hash % 10) + 1));
          let isPlayerReEntry = false;

          if (item.isPlayer) {
              const displayChartName = chartKey === 'Hot100' ? 'Billboard Hot 100™' :
                                       chartKey === 'Global200Single' ? 'Billboard Global 200 Songs' :
                                       chartKey === 'Global200Album' ? 'Billboard Global 200 Albums' :
                                       chartKey === 'RegionAmerica' ? 'US Top 100' :
                                       chartKey === 'RegionLatinAmerica' ? 'Latin Top 100' :
                                       chartKey === 'RegionEurope' ? 'Europe Top 100' : chartKey;
              const playerRelease = publishedReleases.find(r => r.id === item.id);
              if (playerRelease && playerRelease.chartHistory && playerRelease.chartHistory[displayChartName]) {
                  const hist = playerRelease.chartHistory[displayChartName];
                  wks = hist.weeksOnChart;
                  pPeak = Math.min(index + 1, hist.peakPos);
                  if (isNew) {
                      isPlayerReEntry = true;
                  }
              } else {
                  wks = 1;
                  pPeak = index + 1;
              }
          }

          return { 
            ...item, 
            movement, 
            isNew, 
            isReEntry: isNew ? (item.isPlayer ? isPlayerReEntry : !!item.isReEntrySim) : false, 
            lastPos: prevIndex !== -1 ? (prevIndex + 1 > chartLimit ? 'NEW' : prevIndex + 1) : 'NEW',
            peak: pPeak, 
            weeksOnChart: wks,
            peakPos: pPeak
          };
       });
    });

    return { charts: chartsWithMovement, today };
};
