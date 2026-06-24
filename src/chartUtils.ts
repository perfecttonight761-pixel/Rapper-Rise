import { GameState } from './types';
import { ARTIST_IMAGES } from './artistImages';

export const computeCharts = (gameState: GameState, previousChartsData?: any) => {
    const today = new Date(gameState.time.startDate);
    today.setDate(today.getDate() + gameState.time.daysPassed);
    
    // Simulate updating once a week
    const currentWeekNumber = Math.max(1, Math.floor(gameState.time.daysPassed / 7)); 
    
    const pName = gameState.artist?.name || '';

    const publishedReleases = gameState.releases.filter(r => r.status === 'Published' && r.releaseDate);

    const generatePlayerItems = () => {
      return publishedReleases.map(r => {
        const isNPC = !!(r as any).isNPCRelease;
        const rArtist = isNPC ? (r as any).artistId : gameState.artist?.name;

        // Use lastWeekStreams because computeCharts is called exactly when the week completes and currentWeekStreams is reset
        let weeklyStreams = r.lastWeekStreams ?? 0;
        let weeklySales = r.lastWeekSales ?? 0;
        let weeklyRadio = r.lastWeekRadio ?? 0;

        // If it's a completely new release with 0 streams, fallback to lastDailyStreams extrapolated
        // so it can debut on its first week properly
        if ((!r.lastWeekStreams || r.lastWeekStreams === 0) && r.lastDailyStreams?.total) {
             weeklyStreams = r.lastDailyStreams.total * 7;
             weeklySales = r.sales?.total || 0;
             weeklyRadio = r.currentWeekRadio || 0;
        }

        let probAmerica = 0.33, probLatin = 0.33, probEurope = 0.33;
        if (isNPC) {
           const genre = (r as any).genre || 'Pop';
           const isLatin = genre === 'Latin';
           const isKpop = genre === 'Kpop';
           const isEuro = genre === 'Pop' && (rArtist === 'Dua Lipa' || rArtist === 'Ed Sheeran' || rArtist === 'Adele');
           const isCountry = genre === 'Country';
           
           probAmerica = isLatin ? 0.2 : isKpop ? 0.3 : isEuro ? 0.3 : isCountry ? 0.9 : 0.6;
           probLatin = isLatin ? 0.8 : isKpop ? 0.2 : isEuro ? 0.1 : isCountry ? 0.05 : 0.2;
           probEurope = isLatin ? 0.2 : isKpop ? 0.3 : isEuro ? 0.8 : isCountry ? 0.05 : 0.4;
        } else {
           const totalPop = (gameState.popularity.america + gameState.popularity.latinAmerica + gameState.popularity.europe) || 1;
           probAmerica = gameState.popularity.america / totalPop;
           probLatin = gameState.popularity.latinAmerica / totalPop;
           probEurope = gameState.popularity.europe / totalPop;
        }

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
          artist: isNPC ? rArtist : (Object.hasOwn(r, 'isNPCCollab') && (r as any).isNPCCollab 
              ? `${(r as any).collaborator} & ${gameState.artist?.name || 'You'}` 
              : (r.type === 'Single' && (r as any).collaborator ? `${gameState.artist?.name || 'You'} & ${(r as any).collaborator}` : gameState.artist?.name || 'You')),
          type: r.type,
          isPlayer: !isNPC,
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
    const playerItems = generatePlayerItems();

    const getFullCharts = (pItems: any[]) => {
       const allS = pItems.filter((p: any) => p.type === 'Single');
       const allA = pItems.filter((p: any) => ['Album', 'EP', 'Deluxe Album', 'Single Pack'].includes(p.type));
       return {
          Hot100: [...allS].sort((a,b) => b.regionalPoints.america - a.regionalPoints.america).slice(0, 100),
          Global200Single: [...allS].sort((a,b) => b.regionalPoints.global - a.regionalPoints.global).slice(0, 200),
          Global200Album: [...allA].sort((a,b) => b.regionalPoints.global - a.regionalPoints.global).slice(0, 200),
          RegionAmerica: [...allS].sort((a,b) => b.regionalPoints.america - a.regionalPoints.america).slice(0, 100),
          RegionLatinAmerica: [...allS].sort((a,b) => b.regionalPoints.latinAmerica - a.regionalPoints.latinAmerica).slice(0, 100),
          RegionEurope: [...allS].sort((a,b) => b.regionalPoints.europe - a.regionalPoints.europe).slice(0, 100),
       };
    };

    const currentCharts = getFullCharts(playerItems);
    const previousCharts = previousChartsData || {
       Hot100: [], Global200Single: [], Global200Album: [], RegionAmerica: [], RegionLatinAmerica: [], RegionEurope: []
    };

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
