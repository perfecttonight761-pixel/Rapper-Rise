import React, { useState, useRef, useEffect } from 'react';
import localforage from 'localforage';
import { Play, Download, Search, Upload, User, Image as ImageIcon, MapPin, Music, DollarSign, Calendar as CalendarIcon, Award, Activity, Menu, Save, Loader2, Mic, Disc, Zap, Globe, Ticket, Settings as SettingsIcon, Trophy, BarChart3, ShoppingBag, Sparkles, X, Star } from 'lucide-react';
import { GameState, GameScreen, StartCapital, DailyReportData, Song, Album, Gig } from './types';
import { LEVEL_REQUIREMENTS, NPC_ARTISTS } from './constants';
import { ARTIST_DISCOGRAPHY } from './artistDiscography';
import { generateNominees, pickWinner } from './grammyUtils';
import { computeCharts } from './chartUtils';
import { DashboardView } from './components/DashboardView';
import { StudioView } from './components/StudioView';
import { DiscographyView } from './components/DiscographyView';
import { MerchStoreView } from './components/MerchStoreView';
import { SkillsView } from './components/SkillsView';
import { RegionPopularityView } from './components/RegionPopularityView';
import { GigsView } from './components/GigsView';
import { PlatformsView } from './components/PlatformsView';
import { ChartsView } from './components/ChartsView';
import { XView } from './components/XView';
import { GoogleView } from './components/GoogleView';
import { YouTubeView } from './components/YouTubeView';
import { SettingsView } from './components/SettingsView';
import { PlaquesView } from './components/PlaquesView';
import { GrammysView } from './components/GrammysView';
import { SpotifyWrappedView } from './components/SpotifyWrappedView';
import { TikTokView } from './components/TikTokView';
import { processTikTokDaily } from './tiktokUtils';
import { LabelsView } from './components/LabelsView';
import { generateDailyNews } from './newsGenerator';

import { TourView } from './components/TourView';

const INITIAL_DATE = "2024-01-01T00:00:00.000Z";
const STARTING_AGE_YEARS = 18;
const CAPITAL_MAP: Record<StartCapital, number> = {
  'Broke ($0)': 0,
  'Low ($1,000)': 1000,
  'Medium ($10,000)': 10000,
  'High ($100,000)': 100000,
};

export interface SaveProfile {
  id: string;
  artistName: string;
  profilePicUrl?: string;
  lastPlayed: number;
}

let globalShowToast: (msg: string) => void = () => {};
window.alert = (msg: any) => globalShowToast(String(msg));

export default function App() {
  const [toastMsg, setToastMsg] = useState('');
  const [screen, setScreen] = useState<GameScreen>('loading');
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dailyReport, setDailyReport] = useState<DailyReportData | null>(null);
  const [isLoadingNextDay, setIsLoadingNextDay] = useState(false);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [currentSaveId, setCurrentSaveId] = useState<string | null>(null);
  const [saveProfiles, setSaveProfiles] = useState<SaveProfile[]>([]);

  useEffect(() => {
     let timeoutId: any;
     globalShowToast = (msg: string) => {
         setToastMsg(msg);
         if (timeoutId) clearTimeout(timeoutId);
         timeoutId = setTimeout(() => setToastMsg(''), 3000);
     };
     const initSaves = async () => {
      try {
        let idx = await localforage.getItem<string>('musician_simulator_saves_index');
        
        // --- MIGRATION BLOCK: move localStorage to localforage ---
        if (!idx) {
          const lsIdx = localStorage.getItem('musician_simulator_saves_index');
          if (lsIdx) {
            idx = lsIdx;
            await localforage.setItem('musician_simulator_saves_index', lsIdx);
            const parsed = JSON.parse(lsIdx);
            for (const profile of parsed) {
              if (profile.id) {
                const lsSave = localStorage.getItem('musician_simulator_save_' + profile.id);
                if (lsSave) {
                   await localforage.setItem('musician_simulator_save_' + profile.id, lsSave);
                   localStorage.removeItem('musician_simulator_save_' + profile.id);
                }
              }
            }
            const lastId = localStorage.getItem('musician_simulator_last_save_id');
            if (lastId) {
               await localforage.setItem('musician_simulator_last_save_id', lastId);
               localStorage.removeItem('musician_simulator_last_save_id');
            }
            localStorage.removeItem('musician_simulator_saves_index');
          } else {
             // Did they have a very old single save?
             const extremelyOldSave = localStorage.getItem('musician_simulator_save') || await localforage.getItem('musician_simulator_save');
             if (extremelyOldSave) {
                 const newSlotId = 'slot_1';
                 await localforage.setItem('musician_simulator_save_' + newSlotId, extremelyOldSave);
                 const parsedSave = JSON.parse(extremelyOldSave as string);
                 const indexArr = [{ id: newSlotId, artistName: parsedSave?.artist?.name || 'Unknown', lastPlayed: Date.now() }];
                 idx = JSON.stringify(indexArr);
                 await localforage.setItem('musician_simulator_saves_index', idx);
                 await localforage.removeItem('musician_simulator_save');
                 localStorage.removeItem('musician_simulator_save');
             }
          }
        }
        // --- END MIGRATION ---

        if (idx) {
          let parsed = JSON.parse(idx);
          let assignedSlots = new Set(parsed.filter((p: any) => p.id && p.id.startsWith('slot_')).map((p: any) => p.id));
          
          let needsUpdate = false;
          let newProfiles = [];
          
          let availableSlotNum = 1;
          for (let p of parsed) {
            if (p.id && p.id.startsWith('slot_')) {
                newProfiles.push(p);
            } else if (p.id) {
                // Find next available slot
                while (assignedSlots.has(`slot_${availableSlotNum}`) && availableSlotNum <= 3) {
                    availableSlotNum++;
                }
                
                if (availableSlotNum <= 3) {
                   const newSlotId = `slot_${availableSlotNum}`;
                   // Move localforage data
                   const oldData = await localforage.getItem('musician_simulator_save_' + p.id);
                   if (oldData) {
                       await localforage.setItem('musician_simulator_save_' + newSlotId, oldData);
                       await localforage.removeItem('musician_simulator_save_' + p.id);
                   }
                   p.id = newSlotId;
                   newProfiles.push(p);
                   assignedSlots.add(newSlotId);
                   needsUpdate = true;
                }
            }
          }

          setSaveProfiles(newProfiles);
          if (needsUpdate || newProfiles.length !== parsed.length) {
              await localforage.setItem('musician_simulator_saves_index', JSON.stringify(newProfiles));
          }
        }



        // Attempt to load last active save (No longer auto-loads to screen)
        const lastId = await localforage.getItem<string>('musician_simulator_last_save_id');
        if (lastId && !lastId.startsWith('slot_')) {
           await localforage.removeItem('musician_simulator_last_save_id');
        }
      } catch (e) {
        console.error("Failed to init saves", e);
      }
    };
    initSaves().finally(() => {
        setTimeout(() => {
            setScreen('home');
            setShowUpdatePopup(true);
        }, 3000); // 3 seconds loading screen
    });
  }, []);

  const saveGameData = async (slotId: string, stateToSave: GameState, isAutoSave: boolean = false) => {
    let internalState = JSON.parse(JSON.stringify(stateToSave)) as GameState;
    let success = false;
    let attempts = 0;

    while (!success && attempts < 3) {
       try {
          await localforage.setItem('musician_simulator_save_' + slotId, JSON.stringify(internalState));
          await localforage.setItem('musician_simulator_last_save_id', slotId);
          
          const currentProfiles = saveProfiles;
          let existIdx = currentProfiles.findIndex(s => s?.id === slotId);
          let updated = [...currentProfiles];
          if (existIdx >= 0) {
            updated[existIdx] = { ...updated[existIdx], lastPlayed: Date.now(), artistName: internalState.artist?.name || 'Unknown', profilePicUrl: internalState.artist?.image };
          } else {
            updated.push({ id: slotId, artistName: internalState.artist?.name || 'Unknown', profilePicUrl: internalState.artist?.image, lastPlayed: Date.now() });
          }
          setSaveProfiles(updated);
          
          await localforage.setItem('musician_simulator_saves_index', JSON.stringify(updated));

          success = true;
          if (!isAutoSave) alert(`Game saved successfully!`);
       } catch (e: any) {
          attempts++;
          if (e.name === 'QuotaExceededError' || e.code === 22) { // QuotaExceededError
              if (attempts === 1) {
                  // Strategy 1: Wipe customTweets, keep fewer gigs
                  if (internalState.artist?.socialProfile) {
                     internalState.artist.socialProfile.customTweets = [];
                  }
                  if (internalState.gigs) {
                     internalState.gigs = internalState.gigs.filter(g => !g.completed);
                  }
                  if (internalState.wrappedHistory) {
                     internalState.wrappedHistory = [];
                  }
              } else if (attempts === 2) {
                  // Strategy 2: Strip ALL release cover images and venue images
                  internalState.releases = internalState.releases.map(r => ({ ...r, coverImage: '' }));
                  if (internalState.tours) {
                      internalState.tours = internalState.tours.map(t => ({ ...t, poster: '' }));
                  }
              }
          } else {
              break; // unknown error
          }
       }
    }

    if (!success) {
      if (isAutoSave) setIsAutoAdvancing(false);
      alert("Storage quota exceeded! Save failed. Please delete an older save slot to continue.");
    }
  };

  useEffect(() => {
    // Auto-save whenever gameState changes
    if (gameState && currentSaveId) {
      saveGameData(currentSaveId, gameState, true);
    }
  }, [gameState, currentSaveId]);

  useEffect(() => {
    // Stop auto advancing if we navigate away from dashboard
    if (screen !== 'dashboard') {
      setIsAutoAdvancing(false);
    }
  }, [screen]);

  useEffect(() => {
    if (isAutoAdvancing && !isLoadingNextDay && screen === 'dashboard') {
      const timer = setTimeout(() => {
        handleNextDay();
      }, 50); // Small interval between auto skips
      return () => clearTimeout(timer);
    }
  }, [isAutoAdvancing, isLoadingNextDay, screen]);

  // --- Handlers ---

  const handleStartNew = () => {
    setCurrentSaveId(null);
    setScreen('create');
  };

  const handleNextDay = () => {
    if (!gameState || isLoadingNextDay) return;
    setIsLoadingNextDay(true);

    const isAutoSkip = isAutoAdvancing;

    // Use a very short timeout for auto-advance, otherwise use the normal simulation delay
    setTimeout(() => {
      try {
      let dailyStreams = 0;
      let dailySales = 0;
      let revenue = 0;
      let labelRecoupableRevenue = 0;
      let dailyStreamingRev = 0;
      let dailySalesRev = 0;
      let dailySongRev: Record<string, number> = {};
      
      let topSong: string | null = null;
      let topAlbum: string | null = null;
      let maxSongStreams = -1;
      let maxAlbumStreams = -1;

      const currentDateObj = new Date(gameState.time.startDate);
      currentDateObj.setDate(currentDateObj.getDate() + gameState.time.daysPassed + 1);

      const artistLevel = gameState.artist?.level || 0;
      const levelMultiplier = 1 + (artistLevel * 0.4); // max ~ 5 at level 10, ~40 at level 99

      const prodSkill = (gameState.skills.production || 1) / 100;
      const vocalSkill = (gameState.skills.vocals || 1) / 100;
      const swSkill = (gameState.skills.songwriting || 1) / 100;
      const perfSkill = (gameState.skills.performance || 1) / 100;

      let workingReleases = [...(gameState.releases || [])];
      const newlyPublishedAlbumIds = new Set<string>();

      // Daily NPC scheduling check
      if (gameState.time.daysPassed > 0) {
         NPC_ARTISTS.forEach(npc => {
            if (gameState.artist?.name && npc.name.toLowerCase() === gameState.artist.name.toLowerCase()) return;
            // Each NPC decides to start an album/single cycle once every 365 days based on their name
            const npcDayOffset = (npc.name.charCodeAt(0) * 17 + (npc.name.charCodeAt(1) || 0) * 31) % 365;
            if (gameState.time.daysPassed % 365 !== npcDayOffset) return;

            const currentYearCycle = Math.floor(gameState.time.daysPassed / 365);
            const disco = (ARTIST_DISCOGRAPHY as any) || {};
            let albumsList = disco[npc.name]?.albums || [];
            
            if (albumsList.length === 0) {
                return;
            }
            
            // Delete oldest releases to maintain history size (max 5 albums per NPC)
            const npcRels = workingReleases.filter(r => (r as any).isNPCRelease && (r as any).artistId === npc.name);
            const npcAlbums = npcRels.filter(r => ['Album', 'EP', 'Deluxe Album', 'Single Pack'].includes(r.type)).sort((a,b) => new Date(a.releaseDate||0).getTime() - new Date(b.releaseDate||0).getTime());
            
            if (npcAlbums.length > 5) {
               const oldestAlbum = npcAlbums[0];
               // Delete oldest album and its tracks
               workingReleases = workingReleases.filter(r => r.id !== oldestAlbum.id && !(oldestAlbum.trackIds?.includes(r.id)));
            }

            // Randomly pick: 1-2 albums, OR 1-3 singles only
            const isSingleOnlyYear = Math.random() < 0.3;
            const singleCount = Math.floor(Math.random() * 3) + 1; // 1 to 3
            const albumCount = Math.random() < 0.2 ? 2 : 1; // mostly 1, sometimes 2

            const itemsToSchedule = isSingleOnlyYear ? singleCount : albumCount;

            for (let j = 0; j < itemsToSchedule; j++) {
                const baseDate = new Date(currentDateObj);
                const daysUntilRelease = [8, 14, 21, 30, 45, 60][Math.floor(Math.random() * 6)];
                baseDate.setDate(baseDate.getDate() + daysUntilRelease);

                const npcPublishedTitles = npcRels.map(r => r.title);
                const unusedAlbums = albumsList.filter((a: any) => {
                    const cleanTitle = a.title.replace(/ - Single$/i, '').replace(/ - EP$/i, ' EP');
                    return !npcPublishedTitles.includes(cleanTitle) && !npcPublishedTitles.includes(a.title);
                });
                
                let randomAlbumIdx = 0;
                let albumDisco: any = null;
                if (unusedAlbums.length > 0) {
                    const rnd = Math.floor(Math.random() * unusedAlbums.length);
                    randomAlbumIdx = albumsList.findIndex((a: any) => a.title === unusedAlbums[rnd].title);
                    albumDisco = { ...albumsList[randomAlbumIdx] };
                } else {
                    randomAlbumIdx = Math.floor(Math.random() * albumsList.length);
                    albumDisco = { ...albumsList[randomAlbumIdx], isReRelease: true };
                }
                
                if (albumDisco.isReRelease) {
                    const oldAlbum = workingReleases.find(r => r.title === albumDisco.title && (r as any).artistId === npc.name && ['Album', 'EP', 'Single Pack'].includes(r.type));
                    if (oldAlbum) {
                        workingReleases = workingReleases.filter(r => r.id !== oldAlbum.id && !(oldAlbum as any).trackIds?.includes(r.id));
                    }
                }
                
                let albumTracks = [];
                if (disco[npc.name]?.tracks && disco[npc.name]?.tracks.length > 0) {
                    albumTracks = disco[npc.name].tracks.filter((t: any) => t.album === albumDisco.title || (t.album && albumDisco.title && t.album.toLowerCase().includes(albumDisco.title.toLowerCase())));
                    if (albumTracks.length === 0) {
                         albumTracks = disco[npc.name].tracks.filter((t: any) => t.cover === albumDisco.cover);
                    }
                    if (albumTracks.length === 0) {
                         albumTracks = disco[npc.name].tracks.slice(randomAlbumIdx * 10, (randomAlbumIdx + 1) * 10);
                    }
                    if (albumTracks.length === 0) {
                        albumTracks = [disco[npc.name].tracks[0]];
                    }
                } else {
                    albumTracks = Array(10).fill(null).map((_, i) => ({
                         title: `${albumDisco.title} - Track ${i+1}`,
                         cover: albumDisco.cover
                    }));
                }

                let albType = 'Album';
                if (albumDisco.title) {
                    if (albumDisco.title.match(/ - Single$/i)) albType = 'Single Pack';
                    else if (albumDisco.title.match(/ - EP$/i)) albType = 'EP';
                    albumDisco.title = albumDisco.title.replace(/ - Single$/i, '').replace(/ - EP$/i, ' EP');
                }

                if (isSingleOnlyYear) {
                     // Schedule a standalone single
                     const npcPublishedTitlesForSingles = npcRels.map(r => r.title);
                     let allTracks = disco[npc.name]?.tracks || [];
                     let unusedTracks = allTracks.filter((t: any) => !npcPublishedTitlesForSingles.includes(t.title));
                     let track;
                     if (unusedTracks.length > 0) {
                        track = unusedTracks[Math.floor(Math.random() * unusedTracks.length)];
                     } else {
                        if (allTracks.length === 0) {
                           track = { title: `Single ${currentYearCycle}-${j}`, cover: albumDisco?.cover };
                        } else {
                           track = { ...allTracks[Math.floor(Math.random() * allTracks.length)], isReRelease: true };
                        }
                     }
                     
                     if (track.isReRelease) {
                        workingReleases = workingReleases.filter(r => !(r.title === track.title && (r as any).artistId === npc.name));
                     }
                     
                     let title = track.title;
                     let collaborator = undefined;
                     let isNPCCollab = false;
                     const featMatch = title.match(/\b(?:feat\.?|featuring|ft\.?)\s+([^()[\]]+)/i);
                     if (featMatch && featMatch[1]) {
                         const featName = featMatch[1].trim();
                         const isRealNPC = NPC_ARTISTS.find(a => a.name.toLowerCase() === featName.toLowerCase());
                         if (isRealNPC) {
                             collaborator = isRealNPC.name;
                             isNPCCollab = true;
                             title = title.substring(0, featMatch.index) + 'feat. ' + collaborator + title.substring(featMatch.index + featMatch[0].length);
                         } else {
                             const otherNPCs = NPC_ARTISTS.filter(a => a.name !== npc.name);
                             const randomNPC = otherNPCs[Math.floor(Math.random() * otherNPCs.length)].name;
                             collaborator = randomNPC;
                             isNPCCollab = true;
                             title = title.substring(0, featMatch.index) + 'feat. ' + randomNPC + title.substring(featMatch.index + featMatch[0].length);
                         }
                     }

                     workingReleases.push({
                        id: `npc-${npc.name}-singleonly-${currentYearCycle}-${j}`,
                        title: title,
                        coverImage: track?.cover || albumDisco?.cover || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=60`,
                        artistId: npc.name,
                        collaborator: collaborator,
                        isNPCCollab,
                        isNPCRelease: true,
                        isBSide: false,
                        type: 'Single',
                        genre: npc.type || 'Pop',
                        status: 'Scheduled',
                        releaseDate: baseDate.toISOString(),
                        trend: 'Non-Hit',
                        streams: { spotify: npc.basePoints * 5, appleMusic: npc.basePoints * 2, amazonMusic: npc.basePoints * 1, youtubeMusic: npc.basePoints * 3, total: npc.basePoints * 11 },
                        sales: { physical: 0, digital: 0, total: 0 },
                        radioPlays: 0,
                        debutStreams: npc.basePoints * 2
                     } as any);
                     
                } else {
                     // Schedule Album + singles
                     let single1Date = new Date(baseDate);
                     let single2Date = new Date(baseDate);
                     let albumDate = new Date(baseDate);

                     const dropSimultaneously = Math.random() > 0.8;
                     if (dropSimultaneously) {
                         const offset = 7 + Math.floor(Math.random() * 14);
                         single1Date.setDate(single1Date.getDate() + offset);
                         single2Date.setDate(single2Date.getDate() + offset);
                         albumDate.setDate(albumDate.getDate() + offset);
                     } else {
                         single1Date.setDate(single1Date.getDate() + 7);
                         single2Date.setDate(single2Date.getDate() + 21);
                         albumDate.setDate(albumDate.getDate() + 35);
                     }

                     const albumId = `npc-${npc.name}-album-${currentYearCycle}-${j}`;
                     const trackIds = albumTracks.map((_, i) => `npc-${npc.name}-single-${currentYearCycle}-${j}-${i}`);
                     
                     workingReleases.push({
                         id: albumId,
                         title: albumDisco.title,
                         coverImage: albumDisco.cover || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=60`,
                         artistId: npc.name,
                         isNPCRelease: true,
                         type: albType as any,
                         status: 'Scheduled',
                         releaseDate: albumDate.toISOString(),
                         trackIds,
                         trend: 'Non-Hit',
                         streams: { spotify: npc.basePoints * 10, appleMusic: npc.basePoints * 5, amazonMusic: npc.basePoints * 2, youtubeMusic: npc.basePoints * 8, total: npc.basePoints * 25 },
                         sales: { physical: 0, digital: 0, total: 0 },
                         radioPlays: 0,
                         debutStreams: npc.basePoints * 5
                     } as any);
                     
                     albumTracks.forEach((track: any, i: number) => {
                         let rDate = albumDate;
                         if (!dropSimultaneously) {
                             if (i === 0) rDate = single1Date;
                             if (i === 1) rDate = single2Date;
                         }
                         
                         let title = track.title;
                         let collaborator = undefined;
                         let isNPCCollab = false;
                         const featMatch = title.match(/\b(?:feat\.?|featuring|ft\.?)\s+([^()[\]]+)/i);
                         if (featMatch && featMatch[1]) {
                             const featName = featMatch[1].trim();
                             const isRealNPC = NPC_ARTISTS.find(a => a.name.toLowerCase() === featName.toLowerCase());
                             
                             if (isRealNPC) {
                                 collaborator = isRealNPC.name;
                                 isNPCCollab = true;
                                 title = title.substring(0, featMatch.index) + 'feat. ' + collaborator + title.substring(featMatch.index + featMatch[0].length);
                             } else {
                                 const otherNPCs = NPC_ARTISTS.filter(a => a.name !== npc.name);
                                 const randomNPC = otherNPCs[Math.floor(Math.random() * otherNPCs.length)].name;
                                 collaborator = randomNPC;
                                 isNPCCollab = true;
                                 title = title.substring(0, featMatch.index) + 'feat. ' + randomNPC + title.substring(featMatch.index + featMatch[0].length);
                             }
                         }

                         workingReleases.push({
                             id: trackIds[i],
                             title: title,
                             coverImage: albumDisco?.cover || track.cover || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=60`,
                             artistId: npc.name,
                             collaborator,
                             isNPCCollab,
                             isNPCRelease: true,
                             isBSide: i > 1,
                             type: 'Single',
                             genre: npc.type || 'Pop',
                             status: 'Scheduled',
                             releaseDate: rDate.toISOString(),
                             trend: 'Non-Hit',
                             streams: { spotify: npc.basePoints * 5, appleMusic: npc.basePoints * 2, amazonMusic: npc.basePoints * 1, youtubeMusic: npc.basePoints * 3, total: npc.basePoints * 11 },
                             sales: { physical: 0, digital: 0, total: 0 },
                             radioPlays: 0,
                             debutStreams: npc.basePoints * 2
                         } as any);
                     });
                }
            }
         });
      }

      // First pass: trigger Scheduled to Published and daily Pre-Save growth
      workingReleases = workingReleases.map(r => {
        if (r.status === 'Scheduled' && r.releaseDate) {
            const relDate = new Date(r.releaseDate);
            if (relDate <= currentDateObj) {
               if (['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(r.type)) newlyPublishedAlbumIds.add((r as Album).id);
               return { ...r, status: 'Published' };
            } else {
               // Calculate daily pre-save growth
               const isNPC = !!(r as any).isNPCRelease;
               const npc = isNPC ? NPC_ARTISTS.find(n => n.name === (r as any).artistId) : null;
               
               let popTarget = isNPC ? (npc ? Math.floor((npc.basePoints / 450000) * 100) : 50) : ((gameState.popularity?.america || 10) + (gameState.popularity?.europe || 5) + (gameState.popularity?.latinAmerica || 5)) / 3;
               
               // Album hype from lead single
               let leadSingleHypeMux = 1.0;
               if (!isNPC && ['Album', 'EP', 'Deluxe Album'].includes(r.type)) {
                   const albId = r.id;
                   const releasedSingles = (gameState.releases || []).filter(sl => sl.type === 'Single' && sl.status === 'Published' && (r as Album).trackIds?.includes(sl.id));
                   for (const s of releasedSingles) {
                       if (s.trend?.includes('Mega Hit')) leadSingleHypeMux = Math.max(leadSingleHypeMux, 3.5);
                       else if (s.trend?.includes('Hit')) leadSingleHypeMux = Math.max(leadSingleHypeMux, 2.0);
                       else if (s.trend === 'TikTok Trend' || s.trend === 'Viral') leadSingleHypeMux = Math.max(leadSingleHypeMux, 1.5);
                   }
               }
               
               let baseDaily = Math.pow(popTarget / 100, 3) * 200000;
               if (!isNPC) {
                  // Social media buzz
                  baseDaily += ((gameState.stats.socialFollowers || 0) * 0.0005);
               }
               baseDaily = Math.max(10, baseDaily * leadSingleHypeMux);
               
               const daysUntilRelease = Math.max(1, Math.floor((relDate.getTime() - currentDateObj.getTime()) / (1000 * 3600 * 24)));
               
               // Growth multiplier: increases as it gets closer
               let growthMux = 1.0;
               if (daysUntilRelease <= 3) growthMux = 4.0;
               else if (daysUntilRelease <= 7) growthMux = 2.0;
               else if (daysUntilRelease <= 14) growthMux = 1.3;
               else if (daysUntilRelease > 30) growthMux = 0.5;

               // Apply random jitter
               let newPreSaves = Math.floor(baseDaily * growthMux * (Math.random() * 0.4 + 0.8));
               
               return { 
                   ...r, 
                   totalPreSaves: (r.totalPreSaves || 0) + newPreSaves 
               };
            }
        }
        return r;
      });

      // Find all tracks in Published albums
      const publishedAlbumTracks = new Map<string, { date: string, cover?: string, trackNum: number, isSleeperHit: boolean }>(); // trackId -> album info
      workingReleases.forEach(r => {
         if (['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(r.type) && r.status === 'Published' && r.releaseDate) {
            const tracks = (r as Album).trackIds || [];
            tracks.forEach((id, index) => {
               // Roughly 1 in 8 late-album tracks becomes a random fan favorite sleeper hit
               const isSleeper = index > 2 && Math.random() < 0.15;
               publishedAlbumTracks.set(id, { date: r.releaseDate!, cover: r.coverImage, trackNum: index + 1, isSleeperHit: isSleeper });
            });
         }
      });

      // Second pass: publish tracks belonging to newly/already published albums
      workingReleases = workingReleases.map(r => {
         if (r.type === 'Single') {
            const albumInfo = publishedAlbumTracks.get(r.id);
            if (albumInfo) {
              const updates: any = {};
              let modified = false;

              if (r.status !== 'Published') {
                 updates.status = 'Published';
                 updates.releaseDate = albumInfo.date || currentDateObj.toISOString();
                 updates.isBSide = true;
                 modified = true;
              }
              
              if ((r as Song).albumTrackNumber === undefined) {
                 updates.albumTrackNumber = albumInfo.trackNum;
                 updates.isSleeperHit = albumInfo.isSleeperHit;
                 modified = true;
              }

              if (!r.coverImage && albumInfo.cover) {
                 updates.coverImage = albumInfo.cover;
                 modified = true;
              }

              if (modified) {
                 return { ...r, ...updates } as Song;
              }
            }
         }
         return r;
      });

      let tikTokStreams: Record<string, number> = {};
      let updatedTikTok = gameState.tikTok ? JSON.parse(JSON.stringify(gameState.tikTok)) : undefined;

      if (updatedTikTok) {
         // Auto-add published singles to TikTok sounds
         workingReleases.forEach(r => {
             if (r.type === 'Single' && r.status === 'Published' && !(r as any).isNPCRelease) {
                 const exists = updatedTikTok.sounds?.find((s: any) => s.songId === r.id);
                 if (!exists) {
                     let startingTrend = 'Non Trend';
                     if (r.trend?.includes('Mega Hit')) {
                        startingTrend = r.trend.includes('Big') ? 'Mega Hits Big' : r.trend.includes('Medium') ? 'Mega Hits Medium' : 'Mega Hits';
                     }
                     else if (r.trend?.includes('Hit')) {
                        startingTrend = r.trend.includes('Big') ? 'Hits Big' : r.trend.includes('Medium') ? 'Hits Medium' : 'Hits';
                     }
                     else if (r.trend === 'TikTok Trend') startingTrend = 'TikTok Trend';

                     updatedTikTok.sounds?.push({
                         songId: r.id,
                         usedInVideos: 0,
                         viewsGenerated: 0,
                         trendingStatus: startingTrend
                     });
                 }
             }
         });

         const tRes = processTikTokDaily(
             updatedTikTok,
             workingReleases,
             (gameState.popularity?.america || 0 + (gameState.popularity?.europe || 0) + (gameState.popularity?.latinAmerica || 0)) / 3
         );
         if (tRes) {
             updatedTikTok = tRes.updatedProfile;
             tikTokStreams = tRes.tikTokStreamsDelta;
         }
      }

      const updatedReleases = workingReleases.map(release => {
        let currentStatus = release.status;

        if (currentStatus === 'Published') {
            const isSong = release.type === 'Single';
            const isNPC = release.isNPCRelease || !!((release as any).artistId && NPC_ARTISTS.some(n => n.name === (release as any).artistId));
            const npc = isNPC ? NPC_ARTISTS.find(n => n.name === (release as any).artistId) : null;
            
            // Fix NPC base calculations so they emulate a high-tier player.
            // basePoints are roughly 250k-450k. 450000 = Taylor Swift (Level ~90)
            const effectiveLevel = npc ? Math.min(99, Math.floor((npc.basePoints / 450000) * 90)) : artistLevel;
            
            // For Player: max totalPop ~300. 
            const totalPop = npc ? Math.floor((npc.basePoints / 450000) * 400) : (gameState.popularity ? (gameState.popularity.america + gameState.popularity.latinAmerica + gameState.popularity.europe) : 0);
            
            const genreMultiplier = npc ? 1.2 : (isSong ? 1 + ((gameState.skills[(release as Song).genre.toLowerCase() as keyof GameState['skills']] || 10) / 200) : 1.1);
            const popBoost = npc ? 1 + (totalPop / 60) : 1 + (totalPop / 100);
            
            const qualityMod = isNPC ? 2.0 : (isSong ? ((release as Song).qualityModifier || 1) : 1.5);

            // Hit Factor (Deterministic per-song based on title)
            const hash = release.title ? release.title.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
            const baseHitFactor = ((hash * 13) % 1000) / 1000;
            
            // Trend Factor: Shift probabilities based on level, popularity, and quality.
            // Max shift around +0.20 for top tier players.
            let trendShift = ((effectiveLevel / 10) * 0.05) + ((popBoost / 8.5) * 0.10) + ((qualityMod / 4) * 0.05);
            
            // User requested Level 10 singles to be significantly easier to Hit (but not necessarily Mega Hit)
            if (isSong && effectiveLevel >= 10) {
               trendShift += 0.25; // Significant boost to reach the "Hit" threshold (0.85)
            }

            const intrinsicHitFactor = Math.min(0.999, baseHitFactor + trendShift);
            
            // Introduce more variance for normal songs so they don't all get the same streams
            let hitMultiplier = 0.4 + (intrinsicHitFactor * 0.8); // 0.4 to 1.2 for normal songs
            let currentTrend: any = 'Non-Hit';

            // Tier Definitions
            let isMegaHitBig = baseHitFactor >= 0.992 && intrinsicHitFactor >= 0.96;
            let isMegaHitMedium = !isMegaHitBig && baseHitFactor >= 0.985 && intrinsicHitFactor >= 0.93;
            let isMegaHit = !isMegaHitBig && !isMegaHitMedium && baseHitFactor >= 0.975 && intrinsicHitFactor >= 0.90;
            
            let isHitBig = !isMegaHitBig && !isMegaHitMedium && !isMegaHit && baseHitFactor >= 0.94 && intrinsicHitFactor >= 0.86;
            let isHitMedium = !isHitBig && !isMegaHitBig && !isMegaHitMedium && !isMegaHit && baseHitFactor >= 0.88 && intrinsicHitFactor >= 0.80;
            let isHit = !isHitBig && !isHitMedium && !isMegaHitBig && !isMegaHitMedium && !isMegaHit && baseHitFactor >= 0.78 && intrinsicHitFactor > 0.75;

            let isNonHitBig = !isHit && !isHitMedium && !isHitBig && !isMegaHit && !isMegaHitMedium && !isMegaHitBig && intrinsicHitFactor >= 0.65;
            let isNonHitMedium = !isNonHitBig && !isHit && !isHitMedium && !isHitBig && !isMegaHit && !isMegaHitMedium && !isMegaHitBig && intrinsicHitFactor >= 0.45;

            // TikTok Overrides
            const tkSound = updatedTikTok?.sounds.find(s => s.songId === release.id);
            if (tkSound) {
                if (tkSound.trendingStatus === 'Mega Hits Big') isMegaHitBig = true;
                else if (tkSound.trendingStatus === 'Mega Hits Medium') isMegaHitMedium = true;
                else if (tkSound.trendingStatus === 'Mega Hits') isMegaHit = true;
                else if (tkSound.trendingStatus === 'Hits Big') isHitBig = true;
                else if (tkSound.trendingStatus === 'Hits Medium') isHitMedium = true;
                else if (tkSound.trendingStatus === 'Hits') isHit = true;
                else if (tkSound.trendingStatus === 'Non Trend Big') isNonHitBig = true;
                else if (tkSound.trendingStatus === 'Non Trend Medium') isNonHitMedium = true;
            }

            if (isMegaHitBig) {
                hitMultiplier = Math.max(hitMultiplier, 5.0 + (intrinsicHitFactor * 3.0));
                currentTrend = 'Mega Hit Big';
            } else if (isMegaHitMedium) {
                hitMultiplier = Math.max(hitMultiplier, 4.2 + (intrinsicHitFactor * 2.5));
                currentTrend = 'Mega Hit Medium';
            } else if (isMegaHit) {
                hitMultiplier = Math.max(hitMultiplier, 3.5 + (intrinsicHitFactor * 2.0));
                currentTrend = 'Mega Hit';
            } else if (isHitBig) {
                hitMultiplier = Math.max(hitMultiplier, 2.7 + (intrinsicHitFactor * 1.5));
                currentTrend = 'Hit Big';
            } else if (isHitMedium) {
                hitMultiplier = Math.max(hitMultiplier, 2.3 + (intrinsicHitFactor * 1.2));
                currentTrend = 'Hit Medium';
            } else if (isHit) {
                hitMultiplier = Math.max(hitMultiplier, 2.0 + (intrinsicHitFactor * 1.0));
                currentTrend = 'Hit';
            } else if (tkSound?.trendingStatus === 'TikTok Trend') {
                hitMultiplier = Math.max(hitMultiplier, 1.5 + (intrinsicHitFactor * 0.5));
                currentTrend = 'TikTok Trend';
            } else if (isNonHitBig) {
                hitMultiplier = Math.max(hitMultiplier, 1.3 + (intrinsicHitFactor * 0.4));
                currentTrend = 'Non-Hit Big';
            } else if (isNonHitMedium) {
                hitMultiplier = Math.max(hitMultiplier, 0.9 + (intrinsicHitFactor * 0.4));
                currentTrend = 'Non-Hit Medium';
            } else if (intrinsicHitFactor < 0.15) {
                hitMultiplier = 0.2 + (intrinsicHitFactor); // Flop
                currentTrend = 'Flop';
            } else {
                currentTrend = 'Non-Hit';
            }

            let isBSide = false;
            if (isSong && (release as Song).isBSide) {
               isBSide = true;
               
               const bSideViralChance = (hash % 100) / 100; // 0 to 0.99
               // Nerf: B-Sides are much harder to become hits depending on their tier
               if (isMegaHitBig && bSideViralChance > 0.85) {
                   hitMultiplier = Math.max(hitMultiplier, 5.0 + (intrinsicHitFactor * 3.0)); 
                   currentTrend = 'Mega Hit Big';
               } else if (isMegaHitMedium && bSideViralChance > 0.80) {
                   hitMultiplier = Math.max(hitMultiplier, 4.2 + (intrinsicHitFactor * 2.5)); 
                   currentTrend = 'Mega Hit Medium';
               } else if (isMegaHit && bSideViralChance > 0.75) {
                   hitMultiplier = Math.max(hitMultiplier, 3.5 + (intrinsicHitFactor * 2.0)); 
                   currentTrend = 'Mega Hit';
               } else if (isHitBig && bSideViralChance > 0.70) {
                   hitMultiplier = Math.max(hitMultiplier, 2.7 + (intrinsicHitFactor * 1.5)); 
                   currentTrend = 'Hit Big';
               } else if (isHitMedium && bSideViralChance > 0.65) {
                   hitMultiplier = Math.max(hitMultiplier, 2.3 + (intrinsicHitFactor * 1.2)); 
                   currentTrend = 'Hit Medium';
               } else if (isHit && bSideViralChance > 0.60) {
                   hitMultiplier = Math.max(hitMultiplier, 2.0 + (intrinsicHitFactor * 1.0)); 
                   currentTrend = 'Hit';
               } else if (tkSound?.trendingStatus === 'TikTok Trend' && bSideViralChance > 0.40) {
                   hitMultiplier = Math.max(hitMultiplier, 1.5 + (intrinsicHitFactor * 0.5));
                   currentTrend = 'TikTok Trend';
               } else if (isNonHitBig && bSideViralChance > 0.35) {
                   hitMultiplier = Math.max(hitMultiplier, 1.3 + (intrinsicHitFactor * 0.4));
                   currentTrend = 'Non-Hit Big';
               } else if (isNonHitMedium && bSideViralChance > 0.30) {
                   hitMultiplier = Math.max(hitMultiplier, 0.9 + (intrinsicHitFactor * 0.4));
                   currentTrend = 'Non-Hit Medium';
               } else if (intrinsicHitFactor < 0.15) {
                   hitMultiplier = 0.2 * 0.15;
                   currentTrend = 'Flop';
               } else {
                   let cascadeModifier = 0.15;
                   const trackNum = isSong && (release as Song).albumTrackNumber ? (release as Song).albumTrackNumber! : 10;
                   const isSleeper = isSong && (release as Song).isSleeperHit;
                   
                   if (isSleeper) {
                        cascadeModifier = 0.55; // High visibility fan favorite
                        currentTrend = 'Non-Hit Big';
                   } else if (trackNum === 1) {
                        cascadeModifier = 0.40; // Huge focus front-loaded
                   } else if (trackNum === 2 || trackNum === 3) {
                        cascadeModifier = 0.28; // Upper tracklist
                   } else {
                        // Severe deep-cut decay cascade based on how deep the track is
                        cascadeModifier = Math.max(0.04, 0.18 - ((trackNum - 4) * 0.02));
                   }
                   
                   hitMultiplier *= cascadeModifier; 
                   if (currentTrend === 'Non-Hit' || currentTrend === 'Flop') {
                       currentTrend = tkSound?.trendingStatus === 'TikTok Trend' ? 'TikTok Trend' : 'Non-Hit';
                   }
               }
            }

            const hitLongevity = Math.max(1, hitMultiplier);
            const longevityMultiplier = (qualityMod * 0.5) + (effectiveLevel * 0.15) + (hitLongevity * 0.5); // Usually 1.5 to ~5

            // Sync with TikTok sound
            if (updatedTikTok) {
                const tkSoundSync = updatedTikTok.sounds.find((s: any) => s.songId === release.id);
                if (tkSoundSync) {
                    if (currentTrend === 'Mega Hit Big' && tkSoundSync.trendingStatus !== 'Mega Hits Big') tkSoundSync.trendingStatus = 'Mega Hits Big';
                    else if (currentTrend === 'Mega Hit Medium' && tkSoundSync.trendingStatus !== 'Mega Hits Medium') tkSoundSync.trendingStatus = 'Mega Hits Medium';
                    else if (currentTrend === 'Mega Hit' && tkSoundSync.trendingStatus !== 'Mega Hits') tkSoundSync.trendingStatus = 'Mega Hits';
                    else if (currentTrend === 'Hit Big' && !['Mega Hits Big', 'Mega Hits Medium', 'Mega Hits', 'Hits Big'].includes(tkSoundSync.trendingStatus)) tkSoundSync.trendingStatus = 'Hits Big';
                    else if (currentTrend === 'Hit Medium' && !['Mega Hits Big', 'Mega Hits Medium', 'Mega Hits', 'Hits Big', 'Hits Medium'].includes(tkSoundSync.trendingStatus)) tkSoundSync.trendingStatus = 'Hits Medium';
                    else if (currentTrend === 'Hit' && !['Mega Hits Big', 'Mega Hits Medium', 'Mega Hits', 'Hits Big', 'Hits Medium', 'Hits'].includes(tkSoundSync.trendingStatus)) tkSoundSync.trendingStatus = 'Hits';
                    else if (currentTrend === 'TikTok Trend' && ['Non Trend', 'Non Trend Medium', 'Non Trend Big'].includes(tkSoundSync.trendingStatus)) tkSoundSync.trendingStatus = 'TikTok Trend';
                }
            }

            const daysSinceRelease = release.releaseDate ? Math.max(0, Math.floor((currentDateObj.getTime() - new Date(release.releaseDate).getTime()) / (1000 * 3600 * 24))) : 0;

            // --- DECAY LOGIC REFINED ---
            // 1. Initial Hype (Steep drop-off in the first 2-4 weeks)
            const initialHypeHalfLife = 20 + (longevityMultiplier * 3); // Longer hype: 24 to 35 days
            let initialHypeCurve = Math.exp(-daysSinceRelease / initialHypeHalfLife);
            
            // 2. Secondary Run (Slower decay for the next few months)
            const secondaryHalfLife = 60 + (longevityMultiplier * 15); // e.g. 80 to 135 days
            let secondaryCurve = 0.5 * Math.exp(-daysSinceRelease / secondaryHalfLife);
            
            // Mass Streaming Debut Boost (Fanbase Power)
            // Fanbase streams massive numbers in the first week, especially first 3 days, irrespective of trend.
            if (daysSinceRelease <= 21) {
               const fandomPower = 1 + (popBoost / 1.5) + Math.sqrt(effectiveLevel) / 1.5;
               // Smooth curve dropping from 1.0 to close to 0 over 3 weeks
               const debutCurve = Math.exp(-(daysSinceRelease) / 7); 
               
               let debutMultiplier = fandomPower * debutCurve;

               if (currentTrend === 'Flop' || currentTrend.includes('Non-Hit')) {
                   debutMultiplier *= 0.2; // NERF: Non-Hits have a much weaker debut
               } else if (currentTrend.includes('Hit') && !currentTrend.includes('Mega')) {
                   debutMultiplier *= 0.45; // NERF: Hits have a balanced debut, keeping Mega Hits massive
               }

               if (isBSide && !currentTrend.includes('Hit')) {
                   // B-sides get a smaller debut push unless they are a Hit version
                   debutMultiplier *= (isNPC ? 0.2 : 0.4);
               }
               initialHypeCurve *= Math.max(1, debutMultiplier);
            }
            
            // 3. Catalog Tail (Slow burn)
            // Reduced to prevent old songs from being too overpowered
            const tailHalfLife = (150 + (effectiveLevel * 20)) * longevityMultiplier; 
            const catalogBase = isBSide && (currentTrend.includes('Non-Hit') || currentTrend === 'Flop') ? 0.002 : 0.015; 
            const tailCurve = catalogBase * Math.exp(-daysSinceRelease / tailHalfLife);
            
            let decayFactor = initialHypeCurve + secondaryCurve + tailCurve;

            // --- STABILITY FLOOR (The "Legacy Effect") ---
            // Prevents massive artists from dropping to zero, giving a realistic floor
            let floorPercentage = effectiveLevel >= 10 ? 0.015 + (intrinsicHitFactor * 0.015) : (effectiveLevel * 0.0015); 
            
            // Cap the floor based on tier
            if (currentTrend === 'Mega Hit Big') {
               floorPercentage = Math.min(floorPercentage, 0.005);
            } else if (currentTrend.includes('Mega Hit')) {
               floorPercentage = Math.min(floorPercentage, 0.0035);
            } else if (currentTrend === 'Hit Big') {
               floorPercentage = Math.min(floorPercentage, 0.0025);
            } else if (currentTrend === 'Hit Medium') {
               floorPercentage = Math.min(floorPercentage, 0.0020);
            } else if (currentTrend === 'Hit') {
               floorPercentage = Math.min(floorPercentage, 0.0015);
            } else if (currentTrend.includes('Non-Hit Big')) {
               floorPercentage = Math.min(floorPercentage, 0.001);
            } else if (currentTrend.includes('Non-Hit Medium')) {
               floorPercentage = Math.min(floorPercentage, 0.0006);
            } else {
               floorPercentage = Math.min(floorPercentage, 0.0003);
            }
            
            // Significant Nerf for B-Sides: Very low floor unless it's a hit
            if (isBSide && (currentTrend.includes('Non-Hit') || currentTrend === 'Flop')) {
                floorPercentage *= 0.15; // Raised from 0.02 to avoid dropping to hundreds of streams
            }

            decayFactor = Math.max(floorPercentage, decayFactor);

            // Radio logic ... remains but with higher longevity
            const peakRadioDay = 30 + (intrinsicHitFactor * 50); // Peaks slightly later and stays longer
            const radioWidth = 45 + (hitLongevity * 15);
            
            const distance = Math.abs(daysSinceRelease - peakRadioDay);
            const radioCurve = Math.exp(-(distance * distance) / (radioWidth * radioWidth));
            
            const radioMaxHit = hitMultiplier * qualityMod * (1 + artistLevel * 0.2);
            let dailyRadio = (isBSide && (currentTrend.includes('Non-Hit') || currentTrend === 'Flop'))
                ? 0 // Normal B-sides get no radio
                : Math.floor(radioCurve * radioMaxHit * 10 * popBoost * (Math.random() * 0.4 + 0.8));

            // Recurrent Radio (Catalog play after peak)
            if (daysSinceRelease > peakRadioDay && dailyRadio < (radioMaxHit * 2)) {
               const recurrentFactor = (hitMultiplier > 2 ? 0.05 : 0.01) * radioMaxHit * popBoost;
               dailyRadio = Math.max(dailyRadio, Math.floor(recurrentFactor * (Math.random() * 0.5 + 0.7)));
            }

            const oldTotalRadio = typeof release.radioPlays === 'number' ? release.radioPlays : 0;
            const updatedRadio = oldTotalRadio + dailyRadio;
            const radioBoost = 1 + (Math.log10(dailyRadio + 1) * 0.8); // Slightly smoother boost

            // Smooth daily fluctuations & Weekend boost
            const fluctuationSeed = (daysSinceRelease + hash) % 10;
            const smoothFluctuation = 0.95 + (Math.sin(fluctuationSeed) * 0.05); // +/- 5% wobble
            const isWeekend = currentDateObj.getDay() === 0 || currentDateObj.getDay() === 6;
            const weekendBoost = isWeekend ? 1.05 : 1.0;
            
            let featBoost = 1;
            if (isSong && (release as Song).featuredArtistCost) {
                const fCost = (release as Song).featuredArtistCost || 0;
                featBoost += Math.log10(fCost / 500 + 1) * 0.6;
            }
            
            // Streams logic
            const baseStreams = ((hash % 16000) + 4000) + (Math.random() * 8000); // 4k to 28k base with randomization
            
            const releaseLevelMultiplier = 1 + Math.sqrt(effectiveLevel) * 0.4;

            let rawStreamsTotal = baseStreams * 
                Math.pow(qualityMod, 1.4) *  // max ~7
                genreMultiplier *            // max 2
                popBoost *                   // max 8.5
                releaseLevelMultiplier *     // max ~5 at level 10, ~40 at level 90 (NPC)
                hitMultiplier *              // max 4.5
                featBoost *                  // boost from featured artist
                (1 + (prodSkill + vocalSkill + swSkill)/3) * // max 2
                (1 + radioBoost * 0.15) *     // radio adds up
                decayFactor *                
                smoothFluctuation *
                weekendBoost;

            // Apply global softcap log function based on hitMultiplier to allow massive hits to scale farther
            const softCapThreshold = 10000000 + (hitMultiplier * 4000000);
            if (rawStreamsTotal > softCapThreshold) {
                 rawStreamsTotal = softCapThreshold + Math.pow(rawStreamsTotal - softCapThreshold, 0.68 + (hitMultiplier * 0.02)); 
            }
            
            // SUPERSTAR CATALOG FLOOR (Dynamic Target Based on User Logic)
            // This prevents old songs from dying completely but is now properly scaled down.
            let userTargetMin = 0;
            let userTargetMax = 0;
            if (isSong) {
                if (isBSide) {
                     if (currentTrend === 'Mega Hit Big') {
                         userTargetMin = 500000; userTargetMax = 800000;
                     } else if (currentTrend === 'Mega Hit Medium') {
                         userTargetMin = 300000; userTargetMax = 500000;
                     } else if (currentTrend === 'Mega Hit') {
                         userTargetMin = 250000; userTargetMax = 350000;
                     } else if (currentTrend === 'Hit Big') {
                         userTargetMin = 150000; userTargetMax = 250000;
                     } else if (currentTrend === 'Hit Medium') {
                         userTargetMin = 100000; userTargetMax = 150000;
                     } else if (currentTrend === 'Hit') {
                         userTargetMin = 60000; userTargetMax = 100000;
                     } else if (currentTrend === 'Non-Hit Big') {
                         userTargetMin = 40000; userTargetMax = 60000;
                     } else if (currentTrend === 'Non-Hit Medium') {
                         userTargetMin = 20000; userTargetMax = 40000;
                     } else if (currentTrend === 'Non-Hit') {
                         userTargetMin = 10000; userTargetMax = 20000;
                     } else {
                         userTargetMin = 5000; userTargetMax = 10000;
                     }
                } else {
                     if (currentTrend === 'Mega Hit Big') {
                         userTargetMin = 1500000; userTargetMax = 2500000;
                     } else if (currentTrend === 'Mega Hit Medium') {
                         userTargetMin = 1000000; userTargetMax = 1500000;
                     } else if (currentTrend === 'Mega Hit') {
                         userTargetMin = 800000; userTargetMax = 1000000;
                     } else if (currentTrend === 'Hit Big') {
                         userTargetMin = 600000; userTargetMax = 900000;
                     } else if (currentTrend === 'Hit Medium') {
                         userTargetMin = 500000; userTargetMax = 700000;
                     } else if (currentTrend === 'Hit') {
                         userTargetMin = 400000; userTargetMax = 600000;
                     } else if (currentTrend === 'Non-Hit Big') {
                         userTargetMin = 80000; userTargetMax = 150000;
                     } else if (currentTrend === 'Non-Hit Medium') {
                         userTargetMin = 40000; userTargetMax = 80000;
                     } else if (currentTrend === 'Non-Hit') {
                         userTargetMin = 20000; userTargetMax = 40000;
                     } else {
                         userTargetMin = 5000; userTargetMax = 20000;
                     }
                }
            } else {
               userTargetMin = 3000000; userTargetMax = 6000000;
            }
            
            // Adjust to player stats. At Level 10+, Pop 300+, Quality 3.5+, target factor is 1.0.
            const maxLvlRef = 10;
            const maxPopRef = 300;
            const lvlScale = Math.min(1.2, effectiveLevel / maxLvlRef);
            const popScale = Math.min(1.2, Math.max(1, totalPop) / maxPopRef);
            const qualScale = Math.min(1.2, qualityMod / 3.5);
            // Cap statScale to avoid overpowering multiplier on the hard floor
            const statScale = Math.max(0.001, Math.min(1.5, Math.pow(lvlScale * popScale * qualScale, 0.8)));
            
            const baseFloor = userTargetMin + ((hash % 100) / 100) * (userTargetMax - userTargetMin);
            const superstarHardFloor = Math.floor(baseFloor * statScale * (Math.random() * 0.2 + 0.9));

            if (rawStreamsTotal < superstarHardFloor && daysSinceRelease > 7) { 
                // Legacy stream floor - constant, never drops
                rawStreamsTotal = Math.max(rawStreamsTotal, superstarHardFloor);
            }

            let dStreamsTotal = Math.floor(rawStreamsTotal);

            // Occasional viral spike (0.5% chance per day after day 10)
            if (daysSinceRelease > 10 && Math.random() < 0.005) {
                dStreamsTotal = Math.floor(dStreamsTotal * 4); // single day viral boost
            }
            
            // Add TikTok Viral Boost
            let finalTikTokMultiplier = 1.0;
            const tkSoundState = updatedTikTok?.sounds.find((s: any) => s.songId === release.id);
            if (tkSoundState) {
                if (tkSoundState.trendingStatus === 'Mega Hits Big') finalTikTokMultiplier = 3.5;
                else if (tkSoundState.trendingStatus === 'Mega Hits Medium') finalTikTokMultiplier = 3.0;
                else if (tkSoundState.trendingStatus === 'Mega Hits') finalTikTokMultiplier = 2.5;
                else if (tkSoundState.trendingStatus === 'Hits Big') finalTikTokMultiplier = 2.0;
                else if (tkSoundState.trendingStatus === 'Hits Medium') finalTikTokMultiplier = 1.7;
                else if (tkSoundState.trendingStatus === 'Hits') finalTikTokMultiplier = 1.5;
                else if (tkSoundState.trendingStatus === 'TikTok Trend') finalTikTokMultiplier = 1.25;
            }
            dStreamsTotal = Math.floor(dStreamsTotal * finalTikTokMultiplier);

            const extraTikTokStreams = tikTokStreams[release.id] || 0;
            if (extraTikTokStreams > 0) {
                dStreamsTotal += extraTikTokStreams;
            }

            // Sales logic based on contemporary industry standards where sales are a fraction of stream engagement
            const digitalSaleRate = isSong ? 0.0002 : 0.0015; // e.g. 20M streams -> 4k single sales. 10M album streams -> 15k digital album sales
            const physicalSaleRate = isSong ? 0.00005 : 0.003; 
            
            const usPop = isNPC ? Math.floor((npc!.basePoints / 450000) * 100) : (gameState.popularity?.america || 10);
            const maxPhysicalPopMulti = Math.max(0.5, usPop / 50);

            const newDigitalSales = Math.floor(dStreamsTotal * digitalSaleRate * qualityMod * (isWeekend ? 1.2 : 0.9) * (1 + (hash%20)/100)); // slight variance
            const newPhysicalSales = Math.floor(dStreamsTotal * physicalSaleRate * qualityMod * maxPhysicalPopMulti * (1 + (hash%30)/100));
            
            const totalNewSales = newDigitalSales + newPhysicalSales;
            if (!isNPC) {
                dailySales += totalNewSales;
            }
            const salesRev = (newDigitalSales * 0.99 + newPhysicalSales * (isSong ? 4.99 : 14.99)) * 0.25; // 25% artist cut
            const streamingRev = dStreamsTotal * 0.00007; // Extra hard payout: $0.00007 per stream (100k streams = $7)
            
            let currentReleaseRev = salesRev;

            if (isSong) {
                if (!isNPC) {
                    revenue += streamingRev;
                    if (release.masterOwner) {
                       labelRecoupableRevenue += streamingRev;
                    }
                    dailyStreamingRev += streamingRev;
                }
                currentReleaseRev += streamingRev;
            }
            
            if (!isNPC) {
               dailySongRev[release.id] = currentReleaseRev;
               revenue += salesRev;
               if (release.masterOwner) {
                   labelRecoupableRevenue += salesRev;
               }
               dailySalesRev += salesRev;
            }

            // Occasional viral spike (1% chance per day)
            // (Moved to top before dStreamsTotal calculation)
            if (isSong && !isNPC) {
                dailyStreams += dStreamsTotal;
            }

            if (!isNPC) {
                if (release.type === 'Single' && dStreamsTotal > maxSongStreams) {
                    maxSongStreams = dStreamsTotal;
                    topSong = release.title;
                } else if (['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(release.type) && dStreamsTotal > maxAlbumStreams) {
                    maxAlbumStreams = dStreamsTotal;
                    topAlbum = release.title;
                }
            }
            
            const oldTotal = typeof release.streams === 'number' ? release.streams : (release.streams?.total || 0);
            const oldSpotify = typeof release.streams === 'number' ? Math.floor(oldTotal * 0.4) : (release.streams?.spotify || 0);
            const oldApple = typeof release.streams === 'number' ? Math.floor(oldTotal * 0.25) : (release.streams?.appleMusic || 0);
            const oldAmazon = typeof release.streams === 'number' ? Math.floor(oldTotal * 0.25) : (release.streams?.amazonMusic || 0);
            const oldYoutube = typeof release.streams === 'number' ? Math.floor(oldTotal * 0.1) : (release.streams?.youtubeMusic || 0);

            const oldPhysical = release.sales?.physical || 0;
            const oldDigital = release.sales?.digital || 0;
            const oldTotalSales = release.sales?.total || 0;

            // Dynamic Platform Splitting (Per-song base with daily random jitter)
            // Create strong bias per song so Lagu A leans Spotify, Lagu B leans Apple Music
            const spBase = 0.25 + ((hash % 30) / 100); // 25% - 54%
            const apBase = 0.15 + (((hash * 7) % 25) / 100); // 15% - 39%
            const amBase = 0.10 + (((hash * 13) % 20) / 100); // 10% - 29%
            
            // Add daily random noise so it doesn't stay perfectly mathematically correlated
            const spPerc = Math.max(0.1, spBase + (Math.random() * 0.08 - 0.04));
            const apPerc = Math.max(0.05, apBase + (Math.random() * 0.06 - 0.03));
            const amPerc = Math.max(0.05, amBase + (Math.random() * 0.06 - 0.03));
            
            const totalPerc = spPerc + apPerc + amPerc;
            // Leave ~5-15% for YouTube
            const targetTotal = Math.max(0.85, 1.0 - (Math.random() * 0.1 + 0.05));
            const sf = targetTotal / totalPerc;
            
            const sp = Math.floor(dStreamsTotal * spPerc * sf);
            const ap = Math.floor(dStreamsTotal * apPerc * sf);
            const am = Math.floor(dStreamsTotal * amPerc * sf);
            const yt = Math.max(0, dStreamsTotal - sp - ap - am);

            let newCurrentWeekStreams = release.currentWeekStreams || 0;
            let newLastWeekStreams = release.lastWeekStreams || 0;
            let newCurrentWeekSales = release.currentWeekSales || 0;
            let newLastWeekSales = release.lastWeekSales || 0;
            let newCurrentWeekRadio = release.currentWeekRadio || 0;
            let newLastWeekRadio = release.lastWeekRadio || 0;
            
            // Provide a starting point if it just released
            if (daysSinceRelease === 0) {
               newLastWeekStreams = dStreamsTotal * 7; 
               newLastWeekSales = totalNewSales * 7;
               newLastWeekRadio = dailyRadio * 7;
            }

            // If it's chart reset day (e.g. tracking week ends)
            // gameState.time.daysPassed represents the day that just happened. If it's a multiple of 7, 
            // a week has concluded. We push the accumulated current week to last week BEFORE adding today's streams.
            if (gameState.time.daysPassed > 0 && gameState.time.daysPassed % 7 === 0) {
                 newLastWeekStreams = newCurrentWeekStreams; 
                 newCurrentWeekStreams = 0; 
                 
                 newLastWeekSales = newCurrentWeekSales;
                 newCurrentWeekSales = 0;

                 newLastWeekRadio = newCurrentWeekRadio;
                 newCurrentWeekRadio = 0;
            }
            
            newCurrentWeekStreams += dStreamsTotal;
            newCurrentWeekSales += totalNewSales;
            newCurrentWeekRadio += dailyRadio;

            return {
              ...release,
              trend: currentTrend,
              status: currentStatus,
              radioPlays: updatedRadio,
              debutStreams: daysSinceRelease === 0 ? dStreamsTotal : release.debutStreams,
              sales: {
                physical: oldPhysical + newPhysicalSales,
                digital: oldDigital + newDigitalSales,
                total: oldTotalSales + totalNewSales
              },
              lastDailyStreams: {
                spotify: sp,
                appleMusic: ap,
                amazonMusic: am,
                youtubeMusic: yt,
                total: dStreamsTotal
              },
              currentWeekStreams: newCurrentWeekStreams,
              lastWeekStreams: newLastWeekStreams,
              currentWeekSales: newCurrentWeekSales,
              lastWeekSales: newLastWeekSales,
              currentWeekRadio: newCurrentWeekRadio,
              lastWeekRadio: newLastWeekRadio,
              streams: {
                spotify: oldSpotify + sp,
                appleMusic: oldApple + ap,
                amazonMusic: oldAmazon + am,
                youtubeMusic: oldYoutube + yt,
                total: oldTotal + dStreamsTotal
              }
            };
        }

        return {
           ...release,
           status: currentStatus
        };
      });

      let gigPayouts = 0;
      let newAmériquePop = gameState.popularity?.america || 0;
      let newLatinPop = gameState.popularity?.latinAmerica || 0;
      let newEuropePop = gameState.popularity?.europe || 0;
      
      let updatedGigs = (gameState.gigs || []).map(gig => {
        if (!gig.completed && new Date(gig.date) <= currentDateObj) {
           gigPayouts += gig.payout;
           if (gig.region === 'America') newAmériquePop = Math.min(100, newAmériquePop + gig.popularityGain);
           else if (gig.region === 'Latin America') newLatinPop = Math.min(100, newLatinPop + gig.popularityGain);
           else if (gig.region === 'Europe') newEuropePop = Math.min(100, newEuropePop + gig.popularityGain);
           return { ...gig, completed: true };
        }
        return gig;
      });

      let tourTicketRevenue = 0;
      let tourTicketsSold = 0;
      let activeTourName = '';
      let activeTourStage = '';
      let activeTourId = gameState.activeTourId;

      const updatedTours = (gameState.tours || []).map(tour => {
        if (tour.status === 'Completed') {
           if (activeTourId === tour.id) activeTourId = null;
           return tour;
        }
        if (tour.status === 'Planning') return tour;
        
        let tourActive = false;
        const updatedLegs = tour.legs.map(leg => {
             if (leg.completed) return leg;

             const preSaleStart = new Date(leg.preSaleStart);
             const preSaleEnd = new Date(leg.preSaleEnd);
             const legDate = new Date(leg.date);

             let dailyLegRev = 0;
             let dailyLegAtt = 0;

             // Check if gig is happening or passed
             if (currentDateObj >= legDate) {
                 return { ...leg, completed: true, dailyRevenue: 0, dailyAttendance: 0 };
             }

               // Presale selling
               if (currentDateObj >= preSaleStart && currentDateObj <= legDate) {
                   tourActive = true;
                   activeTourStage = String(leg.venueId);

                   const totalDays = Math.max(1, (legDate.getTime() - preSaleStart.getTime()) / (1000 * 3600 * 24));
                   const daysSinceStart = Math.max(0, (currentDateObj.getTime() - preSaleStart.getTime()) / (1000 * 3600 * 24));
                   
                   // Demand factors
                   let popToUse = newAmériquePop;
                   if (leg.venueId.includes('Europe') || leg.venueId.includes('europe')) popToUse = newEuropePop;
                   else if (leg.venueId.includes('latin') || leg.venueId.includes('Latin')) popToUse = newLatinPop;
                   
                   const popFactor = Math.max(1, popToUse);
                   const popDemand = Math.pow(popFactor, 2); 
                   
                   // Demand curve: Huge on day 0, then a steady lower tail that slightly rises near the event.
                   let dayMultiplier = 0.5;
                   if (daysSinceStart === 0) dayMultiplier = 15; // First day rush
                   else if (daysSinceStart === 1) dayMultiplier = 5;
                   else if (daysSinceStart > totalDays - 7) dayMultiplier = 1.5; // Final week rush
                   
                   // Total max people wanting to buy a ticket today
                   const totalDailyShowDemand = (popDemand * 0.4 + (popToUse * 20)) * dayMultiplier * (0.8 + Math.random() * 0.4) * (1 + (levelMultiplier * 0.05));
                   let remainingDailyDemand = Math.floor(totalDailyShowDemand);

                   const newSeatLevels = leg.seatLevels.map(sl => {
                       if (sl.sold >= sl.capacity || remainingDailyDemand <= 0) return sl;

                       // Determine willingness to pay based on venue level and seat tier
                       const baseWillingness = 20 + (Math.pow(popFactor, 1.5) * 0.5) + (levelMultiplier * 5);
                       const willingness = baseWillingness / sl.level; 
                       const priceRatio = sl.price / willingness;

                       // If price > willingness, sales tank.
                       let priceSensitivity = 1.0;
                       if (priceRatio > 1) {
                           priceSensitivity = Math.max(0, Math.min(1.0, Math.exp(-(priceRatio - 1) * 4))); 
                       }
                       
                       // Try to allocate remaining demand
                       // If tier is cheap/good value, faster allocation
                       const availableTiers = leg.seatLevels.filter(s => s.sold < s.capacity).length;
                       const demandShare = remainingDailyDemand / Math.max(1, availableTiers);
                       
                       let dailyCapacityDemand = Math.floor(demandShare * priceSensitivity);
                       if (dailyCapacityDemand < 0) dailyCapacityDemand = 0;
                       
                       // Small drip if demand is practically 0 but they are a bit famous
                       if (dailyCapacityDemand === 0 && priceSensitivity > 0.05 && popToUse > 5 && remainingDailyDemand > 0) {
                           dailyCapacityDemand = Math.floor(Math.random() * 3);
                       }

                       const actualSold = Math.min(dailyCapacityDemand, sl.capacity - sl.sold);
                       
                       remainingDailyDemand -= actualSold; // Reduce the pool
                       dailyLegAtt += actualSold;
                       dailyLegRev += (actualSold * sl.price);

                       return { ...sl, sold: sl.sold + actualSold };
                   });
                   
                   tourTicketsSold += dailyLegAtt;
                   tourTicketRevenue += dailyLegRev;

                   return {
                       ...leg,
                       seatLevels: newSeatLevels,
                       dailyRevenue: dailyLegRev,
                       dailyAttendance: dailyLegAtt,
                       totalRevenue: leg.totalRevenue + dailyLegRev,
                       totalAttendance: leg.totalAttendance + dailyLegAtt
                   };
             }

             return { ...leg, dailyRevenue: 0, dailyAttendance: 0 };
        });

        if (tourActive) {
            activeTourName = tour.name;
        }

        let newStatus = tour.status;
        const allCompleted = updatedLegs.every(l => l.completed);
        
        if (allCompleted) {
            newStatus = 'Completed';
            if (activeTourId === tour.id) activeTourId = null;
        } else if (tourActive && newStatus === 'PreSale') {
            newStatus = 'Ongoing';
            activeTourId = tour.id;
        }

        return {
           ...tour,
           legs: updatedLegs,
           status: newStatus,
           totalRevenue: tour.totalRevenue + tourTicketRevenue,
           totalAttendance: tour.totalAttendance + tourTicketsSold
        };
      });

      let merchRevenue = 0;
      let totalPhysicalSalesToAdd: Record<string, number> = {};
      let totalDigitalSalesToAdd: Record<string, number> = {};

      const updatedMerch = (gameState.merch || []).map(m => {
         if (m.sold >= m.stock) return m;

         const linkedRelease = updatedReleases.find(r => r?.id === m.releaseId);
         const pop = Math.max(1, (newAmériquePop + newLatinPop + newEuropePop) / 3);
         const levelMult = 1 + (artistLevel * 0.8);
         
         let dailyDemand = pop * levelMult * 0.1; // Base: level 10 & pop 20 -> 20 * 9 * 0.1 = 18. Level 99 & pop 100 -> 100 * 80 * 0.1 = 800

         // Adjust demand by type
         switch (m.type) {
             case 'Digital Download': dailyDemand *= 3.0; break;
             case 'CD': dailyDemand *= 2.0; break;
             case 'Single Pack': dailyDemand *= 2.2; break;
             case 'Vinyl': dailyDemand *= 1.2; break;
             case 'T-Shirt': dailyDemand *= 1.5; break;
             case 'Cassette': dailyDemand *= 0.4; break;
             case 'Box Set': dailyDemand *= 0.2; break;
         }

         if (linkedRelease) {
             const daysSincePublished = linkedRelease.releaseDate ? Math.max(0, Math.floor((currentDateObj.getTime() - new Date(linkedRelease.releaseDate).getTime()) / (1000 * 3600 * 24))) : 1000;
             if (linkedRelease.status === 'Scheduled') {
                 dailyDemand *= 3.0; // Pre-orders hype
             } else if (daysSincePublished < 14) {
                 dailyDemand *= 5.0; // Release hype
             } else if (daysSincePublished < 30) {
                 dailyDemand *= 2.0;
             } else if (daysSincePublished > 100) {
                 dailyDemand *= 0.3; // decay
             }
         }

         // For digital downloads, cost is 0, so we use a fallback base
         const expectedPrice = m.cost === 0 ? 5 : m.cost * 2.5; 
         const priceRatio = m.price / expectedPrice;
         
         // Stricter price penalty: > 2x expected price means almost 0 sales
         const priceSensitivity = Math.max(0, Math.min(2.0, Math.exp(-(priceRatio - 1) * 2.5))); 

         let dailySales = Math.floor(dailyDemand * priceSensitivity * (0.8 + Math.random() * 0.4));
         if (dailySales < 0) dailySales = 0;

         const actualSales = Math.min(dailySales, m.stock - m.sold);
         const dailyMerchRev = actualSales * m.price;
         merchRevenue += dailyMerchRev;
         
         if (actualSales > 0 && linkedRelease) {
            if (m.type === 'Digital Download') {
               totalDigitalSalesToAdd[linkedRelease.id] = (totalDigitalSalesToAdd[linkedRelease.id] || 0) + actualSales;
            } else {
               totalPhysicalSalesToAdd[linkedRelease.id] = (totalPhysicalSalesToAdd[linkedRelease.id] || 0) + actualSales;
            }
         }

         return {
            ...m,
            sold: m.sold + actualSales,
            revenue: m.revenue + dailyMerchRev
         };
      });

      // For label merch and regular merch
      revenue += merchRevenue;
        
      // Treat 50% of merch revenue as label recoupable IF they have a contract (simplification)
      if (gameState.artist?.labelContract && merchRevenue > 0) {
          labelRecoupableRevenue += (merchRevenue * 0.5);
      }
        
      revenue += gigPayouts + tourTicketRevenue;

      let updatedReleasesWithSales = updatedReleases.map(r => {
         const d = totalDigitalSalesToAdd[r.id] || 0;
         const p = totalPhysicalSalesToAdd[r.id] || 0;
         let newR = r;
         if (d > 0 || p > 0 || !r.sales) {
             const exist = r.sales || { physical: 0, digital: 0, total: 0 };
             newR = {
                 ...r,
                 sales: {
                     physical: exist.physical + p,
                     digital: exist.digital + d,
                     total: exist.total + p + d
                 }
             };
         }
         
         if (['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(newR.type)) {
             const mappedAlbum = newR as Album;
             if (mappedAlbum.trackIds && mappedAlbum.trackIds.length > 0) {
                 const tIds = mappedAlbum.trackIds;
                 let sumSp = 0, sumAp = 0, sumAm = 0, sumYt = 0, sumTot = 0, sumRadio = 0;
                 let sumCwStreams = 0, sumLwStreams = 0, sumCwSales = 0, sumLwSales = 0;
                 let sumCwRadio = 0, sumLwRadio = 0;
                 let latestLastDaily = { spotify: 0, appleMusic: 0, amazonMusic: 0, youtubeMusic: 0, total: 0 };

                 tIds.forEach(tId => {
                     const tSync = updatedReleases.find(tr => tr.id === tId);
                     if (tSync) {
                         const ts = tSync.streams;
                         sumSp += typeof ts === 'number' ? ts * 0.4 : (ts?.spotify || 0);
                         sumAp += typeof ts === 'number' ? ts * 0.25 : (ts?.appleMusic || 0);
                         sumAm += typeof ts === 'number' ? ts * 0.25 : (ts?.amazonMusic || 0);
                         sumYt += typeof ts === 'number' ? ts * 0.1 : (ts?.youtubeMusic || 0);
                         sumTot += typeof ts === 'number' ? ts : (ts?.total || 0);
                         sumRadio += (tSync.radioPlays || 0);
                         
                         sumCwStreams += (tSync.currentWeekStreams || 0);
                         sumLwStreams += (tSync.lastWeekStreams || 0);
                         sumCwSales += (tSync.currentWeekSales || 0);
                         sumLwSales += (tSync.lastWeekSales || 0);
                         sumCwRadio += (tSync.currentWeekRadio || 0);
                         sumLwRadio += (tSync.lastWeekRadio || 0);
                         
                         if (tSync.lastDailyStreams) {
                             latestLastDaily.spotify += tSync.lastDailyStreams.spotify;
                             latestLastDaily.appleMusic += tSync.lastDailyStreams.appleMusic || 0;
                             latestLastDaily.amazonMusic += tSync.lastDailyStreams.amazonMusic || 0;
                             latestLastDaily.youtubeMusic += tSync.lastDailyStreams.youtubeMusic || 0;
                             latestLastDaily.total += tSync.lastDailyStreams.total;
                         }
                     }
                 });
                 
                 const totalSEA = Math.floor(sumTot / 1500);
                 const currentWeekSEA = Math.floor(sumCwStreams / 1500);
                 const lastWeekSEA = Math.floor(sumLwStreams / 1500);

                 return {
                     ...newR,
                     streams: { spotify: sumSp, appleMusic: sumAp, amazonMusic: sumAm, youtubeMusic: sumYt, total: sumTot },
                     sales: {
                         physical: newR.sales?.physical || 0,
                         digital: newR.sales?.digital || 0,
                         total: (newR.sales?.physical || 0) + (newR.sales?.digital || 0) + totalSEA
                     },
                     radioPlays: sumRadio,
                     currentWeekStreams: sumCwStreams,
                     lastWeekStreams: sumLwStreams,
                     currentWeekSales: (newR.currentWeekSales || 0) + currentWeekSEA,
                     lastWeekSales: (newR.lastWeekSales || 0) + lastWeekSEA,
                     currentWeekRadio: sumCwRadio,
                     lastWeekRadio: sumLwRadio,
                     lastDailyStreams: latestLastDaily
                 };
             }
         }
         return newR;
      });

      let dailyYoutubeViews = 0;
      const updatedVideos = (gameState.videos || []).map(video => {
         const linkedSong = updatedReleasesWithSales.find(r => r?.id === video.songId) as Song;
         let ytDaily = 0;
         const videoPubDate = new Date(video.publishDate);
         const daysSincePublished = Math.max(0, Math.floor((currentDateObj.getTime() - videoPubDate.getTime()) / (1000 * 3600 * 24)));
         
         if (currentDateObj < videoPubDate) {
             // Scheduled in the future, 0 views
             ytDaily = 0;
         } else if (linkedSong) {
            const baseYTStreams = linkedSong.lastDailyStreams?.youtubeMusic || 0;
            const budgetBoost = 1 + (Math.log10(Math.max(1, (video.budget || 5000) / 1000))) * 0.2;
            
            let mvHype = 1.0;
            if (daysSincePublished < 14) {
               mvHype = 3.0 - (daysSincePublished * 0.15); // Starts high, decays
            } else {
               mvHype = 0.5 + Math.exp(-daysSincePublished / 60);
            }
            ytDaily = Math.floor(baseYTStreams * 2.5 * budgetBoost * mvHype); 
         } else {
             ytDaily = Math.floor(2000 * Math.exp(-daysSincePublished / 20));
         }

         ytDaily = Math.floor(ytDaily * (0.8 + Math.random() * 0.4));
         if (ytDaily < 0) ytDaily = 0;
         dailyYoutubeViews += ytDaily;
         
         return {
            ...video,
            views: (video.views || 0) + ytDaily,
            lastDailyViews: ytDaily
         };
      });

      const ytSubscriberGain = Math.floor(dailyYoutubeViews * 0.005 * (0.5 + Math.random()));
      const globalPop = newAmériquePop + newLatinPop + newEuropePop;
      const baseFollowerGain = (globalPop * 10) + Math.floor(dailyStreams * 0.002);
      const socialFollowerGain = Math.floor(baseFollowerGain * (0.8 + Math.random() * 0.4));

      setGameState(prev => {
        if (!prev) return prev;
        
        const nextDaysPassed = prev.time.daysPassed + 1;
        const reachedNextWeek = nextDaysPassed % 7 === 0;

        const prevDateObj = new Date(prev.time.startDate);
        prevDateObj.setDate(prevDateObj.getDate() + prev.time.daysPassed);
        const nextDateObj = new Date(prev.time.startDate);
        nextDateObj.setDate(nextDateObj.getDate() + nextDaysPassed);
        const isNewMonth = nextDateObj.getMonth() !== prevDateObj.getMonth();
        
        // Accumulate monthly stats
        let newMonthStreamingRev = (prev.stats.currentMonthStreamingRev || 0) + dailyStreamingRev;
        let newMonthSalesRev = (prev.stats.currentMonthSalesRev || 0) + dailySalesRev;
        let newMonthMerchRev = (prev.stats.currentMonthMerchRev || 0) + merchRevenue;
        let newMonthTourRev = (prev.stats.currentMonthTourRev || 0) + tourTicketRevenue + gigPayouts;
        
        let newMonthSongRev = { ...(prev.stats.currentMonthSongRev || {}) };
        Object.entries(dailySongRev).forEach(([k, v]) => {
             newMonthSongRev[k] = (newMonthSongRev[k] || 0) + v;
        });

        // Level Up Logic
        let currentLvl = prev.artist?.level || 0;
        
        const nextStreams = prev.stats.streams + dailyStreams;
        const nextSales = (prev.stats.sales || 0) + dailySales;
        const completedGigsCount = updatedGigs.filter(g => g.completed).length;

        // Limit total gigs memory footprint
        if (updatedGigs.length > 1200) {
           const incomplete = updatedGigs.filter(g => !g.completed);
           const completed = updatedGigs.filter(g => g.completed);
           // Keep all incomplete, and only the newest 1000 completed
           updatedGigs = [...incomplete, ...completed.slice(Math.max(0, completed.length - 1000))];
        }

        while (currentLvl < 10) {
           const req = LEVEL_REQUIREMENTS[currentLvl + 1];
           if (!req) break;
           
           if (
              completedGigsCount >= req.gigs &&
              prev.skills.performance >= req.performance &&
              prev.skills.vocals >= req.vocals &&
              prev.skills.songwriting >= req.songwriting &&
              prev.skills.production >= req.production &&
              nextStreams >= req.streams &&
              nextSales >= req.sales
           ) {
              currentLvl++;
           } else {
              break;
           }
        }

        const currentGrammys = prev.grammys || { 
          year: currentDateObj.getFullYear(), 
          stage: 'Closed' as const, 
          submissions: [], 
          results: [],
          history: []
        };
        let nextGrammys = { ...currentGrammys };

        const month = currentDateObj.getMonth(); // 0 = Jan
        const day = currentDateObj.getDate();

        if (month === 0) {
           nextGrammys.stage = 'Submission';
        } else if (month === 1) {
           if (day < 15) {
              if (nextGrammys.stage === 'Submission' || nextGrammys.stage === 'Closed') {
                 nextGrammys.stage = 'Nominations';
                 // Generate nominees if they don't exist for this year
                 if (nextGrammys.results.length === 0) {
                    nextGrammys.results = generateNominees(prev, nextGrammys.year);
                 }
              }
           } else {
              if (nextGrammys.stage === 'Nominations') {
                 nextGrammys.stage = 'Ceremony';
                 // Pick winners
                 nextGrammys.results = nextGrammys.results.map(cat => ({
                    ...cat,
                    winnerId: pickWinner(cat, prev)
                 }));
                 
                 // Update total awards count if player won
                 const playerWins = nextGrammys.results.filter(cat => {
                    const winnerNominee = cat.nominees.find(n => n?.id === cat.winnerId);
                    return winnerNominee?.isPlayer;
                 }).length;
                 
                 if (playerWins > 0) {
                    // We increment stats.awards in the next section
                 }
              }
           }
        } else if (month === 2) {
           nextGrammys.stage = 'Results';
        } else {
           if (nextGrammys.stage === 'Results') {
              // Save player nominations and any NPC winners to history before resetting
              const nominationsThisYearToSave: any[] = [];
              (currentGrammys.results || []).forEach(cat => {
                 const playerNom = cat.nominees.find(n => n.isPlayer);
                 if (playerNom) {
                    nominationsThisYearToSave.push({
                       category: cat.category,
                       nominee: playerNom,
                       won: cat.winnerId === playerNom.id
                    });
                 }
                 
                 // If the player didn't win this category, also save the NPC winner for YouTube integration
                 if (cat.winnerId && (!playerNom || cat.winnerId !== playerNom.id)) {
                     const winnerNom = cat.nominees.find(n => n.id === cat.winnerId);
                     if (winnerNom) {
                         nominationsThisYearToSave.push({
                             category: cat.category,
                             nominee: winnerNom,
                             won: true,
                             isHiddenFromPlayerHistory: true
                         });
                     }
                 }
              });

              let nextHistory = currentGrammys.history ? [...currentGrammys.history] : [];
              if (nominationsThisYearToSave.length > 0) {
                 nextHistory.push({
                    year: currentGrammys.year,
                    nominations: nominationsThisYearToSave
                 });
              }

              nextGrammys = {
                year: currentDateObj.getFullYear() + 1,
                stage: 'Closed',
                submissions: [],
                results: [],
                history: nextHistory
              };
           }
        }

        // Count player wins to update stats
        let totalPlayerWinsAtCeremony = 0;
        let newCustomTweets = [...(prev.artist?.socialProfile?.customTweets || [])];
        if (newCustomTweets.length > 50) {
           newCustomTweets = newCustomTweets.slice(0, 50); // Keep only the 50 most recent tweets
        }

        if (currentGrammys.stage === 'Nominations' && nextGrammys.stage === 'Ceremony') {
           const winningCats = nextGrammys.results.filter(cat => {
              const winnerNominee = cat.nominees.find(n => n?.id === cat.winnerId);
              return winnerNominee?.isPlayer;
           });
           totalPlayerWinsAtCeremony = winningCats.length;
           
           if (totalPlayerWinsAtCeremony > 0) {
              const categoriesStr = winningCats.map(c => c.category).join(", ");
              newCustomTweets = [{
                 id: `grammy-win-${nextGrammys.year}`,
                 content: `I JUST WON ${totalPlayerWinsAtCeremony} GRAMMYs! (${categoriesStr}). Thank you so much to all my fans and the Academy! 🏆✨ #Grammys`,
                 date: nextDaysPassed,
                 likes: 120000 + (totalPlayerWinsAtCeremony * 40000),
                 retweets: 45000 + (totalPlayerWinsAtCeremony * 15000),
                 replies: 8000,
                 mediaUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=800&auto=format&fit=crop'
              }, ...newCustomTweets];
           }
        }

        let newLastComputedCharts = prev.lastComputedCharts;

        if (reachedNextWeek) {
          const intermediateGameState = { 
              ...prev, 
              releases: updatedReleasesWithSales, 
              time: { startDate: prev.time.startDate, daysPassed: nextDaysPassed },
              popularity: {
                 america: newAmériquePop,
                 latinAmerica: newLatinPop,
                 europe: newEuropePop
              }
          };
          const { charts } = computeCharts(intermediateGameState, prev.lastComputedCharts);
          newLastComputedCharts = charts;
          
          updatedReleasesWithSales = updatedReleasesWithSales.map(r => {
            let newChartHistory = r.chartHistory ? JSON.parse(JSON.stringify(r.chartHistory)) : {};
            let isModified = false;
            
            Object.keys(charts).forEach(chartName => {
              const entryIndex = charts[chartName as keyof typeof charts].findIndex((c: any) => c?.id === r.id);
              if (entryIndex !== -1) {
                  const entryInChart = charts[chartName as keyof typeof charts][entryIndex];
                  isModified = true;
                  const displayChartName = chartName === 'Hot100' ? 'Billboard Hot 100™' :
                                           chartName === 'Global200Single' ? 'Billboard Global 200 Songs' :
                                           chartName === 'Global200Album' ? 'Billboard Global 200 Albums' :
                                           chartName === 'RegionAmerica' ? 'US Top 100' :
                                           chartName === 'RegionLatinAmerica' ? 'Latin Top 100' :
                                           chartName === 'RegionEurope' ? 'Europe Top 100' : chartName;
                                           
                  const currentPosition = entryIndex + 1;
                  
                  if (!newChartHistory[displayChartName]) {
                     newChartHistory[displayChartName] = {
                       debutDate: currentDateObj.toISOString(),
                       peakPos: currentPosition,
                       peakDate: currentDateObj.toISOString(),
                       weeksOnChart: 1,
                       weeksAtPeak: 1
                     };
                  } else {
                     if (intermediateGameState.time.daysPassed > 0 && intermediateGameState.time.daysPassed % 7 === 0) {
                         newChartHistory[displayChartName].weeksOnChart = (newChartHistory[displayChartName].weeksOnChart || 0) + 1;
                         
                         if (currentPosition < newChartHistory[displayChartName].peakPos) {
                             newChartHistory[displayChartName].peakPos = currentPosition;
                             newChartHistory[displayChartName].peakDate = currentDateObj.toISOString();
                             newChartHistory[displayChartName].weeksAtPeak = 1;
                         } else if (currentPosition === newChartHistory[displayChartName].peakPos) {
                             const fallback = newChartHistory[displayChartName].peakPos === 1 
                                ? Math.max(1, newChartHistory[displayChartName].weeksOnChart - 1) 
                                : 1;
                             newChartHistory[displayChartName].weeksAtPeak = (newChartHistory[displayChartName].weeksAtPeak ?? fallback) + 1;
                         }
                     } else {
                         // Even mid-week, if they somehow reach a higher peak (shouldn't happen on static days but just in case)
                         if (currentPosition < newChartHistory[displayChartName].peakPos) {
                             newChartHistory[displayChartName].peakPos = currentPosition;
                             newChartHistory[displayChartName].peakDate = currentDateObj.toISOString();
                             newChartHistory[displayChartName].weeksAtPeak = 1;
                         }
                     }
                  }
              }
            });
            return isModified ? { ...r, chartHistory: newChartHistory } : r;
          });
        }

        const currentYear = currentDateObj.getFullYear();
        const currentMonth = currentDateObj.getMonth();
        const currentDay = currentDateObj.getDate();
        
        let newWrappedHistory = prev.wrappedHistory ? [...prev.wrappedHistory] : [];
        let newLastWrappedTotalStreams = prev.stats.lastWrappedTotalStreams || 0;
        
        if (currentMonth === 11 && currentDay === 10) {
           const alreadyWrapped = newWrappedHistory.find(w => w.year === currentYear);
           if (!alreadyWrapped) {
               const streamsThisYear = (prev.stats.streams || 0) + dailyStreams - newLastWrappedTotalStreams;
               const spotifyStreamsThisYear = Math.floor(streamsThisYear * 0.42); // Estimate since we don't track it exactly per year
               
               const getSpotifyStreams = (itemStreams: any) => typeof itemStreams === 'number' ? Math.floor(itemStreams * 0.4) : (itemStreams?.spotify || 0);

               const songs = updatedReleasesWithSales.filter(r => !r.isNPCRelease && r.type === 'Single').map(s => {
                   const sStreams = getSpotifyStreams(s.streams);
                   const spotifyThisYear = Math.max(0, sStreams - (s.lastWrappedStreams?.spotify || 0));
                   return { ...s, spotifyThisYear };
               }).sort((a, b) => b.spotifyThisYear - a.spotifyThisYear).slice(0, 5);
               const topSongs = songs.map(s => ({ title: s.title, streams: s.spotifyThisYear, image: s.coverImage }));
                  
               const albums = updatedReleasesWithSales.filter(r => !r.isNPCRelease && ['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(r.type)).map(a => {
                   const aStreams = getSpotifyStreams(a.streams);
                   const spotifyThisYear = Math.max(0, aStreams - (a.lastWrappedStreams?.spotify || 0));
                   return { ...a, spotifyThisYear };
               }).sort((a, b) => b.spotifyThisYear - a.spotifyThisYear).slice(0, 5);
               const topAlbums = albums.map(a => ({ title: a.title, streams: a.spotifyThisYear, image: a.coverImage }));
                  
               newWrappedHistory.push({
                   year: currentYear,
                   streams: Math.max(0, spotifyStreamsThisYear),
                   topSongs,
                   topAlbums,
                   listeners: Math.floor(Math.max(0, spotifyStreamsThisYear) / (Math.random() * 5 + 10)) + 5000,
                   hours: Math.floor(Math.max(0, spotifyStreamsThisYear) * 3.5 / 60 / 60), // assume 3.5 mins per stream
                   countries: Math.floor(Math.random() * 40) + 150
               });
               
               newLastWrappedTotalStreams = (prev.stats.streams || 0) + dailyStreams;
               
               // Update lastWrappedStreams for all releases
               updatedReleasesWithSales = updatedReleasesWithSales.map(r => {
                   const oldTotal = typeof r.streams === 'number' ? r.streams : (r.streams?.total || 0);
                   const oldSpotify = typeof r.streams === 'number' ? Math.floor(oldTotal * 0.4) : (r.streams?.spotify || 0);
                   return {
                       ...r,
                       lastWrappedStreams: {
                           spotify: oldSpotify,
                           total: oldTotal,
                       }
                   };
               });
           }
        }

        let newEmails = prev.emails ? [...prev.emails] : [];
        let newCurrentYearRevenue = (prev.stats.currentYearRevenue || 0) + revenue;
        
        let labelDeduction = 0;
        let finalRevenueForPlayer = revenue;
        let newContract = prev.artist?.labelContract ? { ...prev.artist.labelContract } : undefined;

        if (newContract && labelRecoupableRevenue > 0) {
            const cut = newContract.royaltyCut / 100;
            const labelCutAmount = Math.floor(labelRecoupableRevenue * cut);
            let playerShare = labelRecoupableRevenue - labelCutAmount;
            
            if (newContract.unrecoupedBalance > 0) {
                if (playerShare >= newContract.unrecoupedBalance) {
                     playerShare -= newContract.unrecoupedBalance;
                     newContract.unrecoupedBalance = 0;
                } else {
                     newContract.unrecoupedBalance -= playerShare;
                     playerShare = 0;
                }
            }
            
            labelDeduction = labelRecoupableRevenue - playerShare;
            finalRevenueForPlayer -= labelDeduction;
            newContract.revenueGeneratedForLabel = (newContract.revenueGeneratedForLabel || 0) + labelCutAmount;
        }

        // Check for contract expiration
        if (newContract) {
            let isExpired = false;
            let expirationReason = "";
            const currentObj = new Date(currentDateObj);
            const signedObj = new Date(newContract.signedDate);
            
            if (newContract.type === 'year') {
                const yearsPassed = (currentObj.getTime() - signedObj.getTime()) / (1000 * 3600 * 24 * 365.25);
                if (yearsPassed >= newContract.duration) {
                     isExpired = true;
                     expirationReason = `Your ${newContract.duration} year term has expired.`;
                }
            } else if (newContract.type === 'album') {
                if (newContract.deliveredAlbums >= newContract.requiredAlbums) {
                     isExpired = true;
                     expirationReason = `You have delivered the required ${newContract.requiredAlbums} albums.`;
                }
            }

            if (isExpired) {
                newEmails.unshift({
                    id: Math.random().toString(36).substring(7),
                    dateStr: currentDateObj.toISOString(),
                    sender: "Label Contract Dept.",
                    subject: "Contract Satisfied & Expired",
                    body: `Hello,\n\nThis letter is to formally notify you that your recording agreement has successfully concluded.\n${expirationReason}\n\nAny unrecouped balance ($${Math.floor(newContract.unrecoupedBalance).toLocaleString()}) has been written off by the label.\n\nPlease note: The label will permanently retain the master rights and collect royalties for any releases distributed during this deal, unless you decide to buy back the masters via your Discography.\n\nBest of luck on your independent journey.`,
                    isRead: false
                });
                
                // Add highly lucrative renewal offer if artist was very profitable or high level
                if ((newContract.revenueGeneratedForLabel || 0) > 1000000 || (prev.artist?.level || 1) >= 4) {
                    const isSuperstar = (prev.artist?.level || 1) >= 8 || (newContract.revenueGeneratedForLabel || 0) > 5000000;
                    const dealType = Math.random() > 0.5 ? 'album' : 'year';
                    const renewalDuration = dealType === 'album' ? Math.floor(Math.random() * 2) + 1 : Math.floor(Math.random() * 3) + 1;
                    const renewalAdvance = Math.floor(Math.random() * 5000000) + 1000000 + (isSuperstar ? 10000000 : 0);
                    const newRoyaltyCut = Math.max(5, newContract.royaltyCut - (isSuperstar ? 10 : 5));

                    newEmails.unshift({
                        id: Math.random().toString(36).substring(7),
                        dateStr: currentDateObj.toISOString(),
                        sender: "Label Executives",
                        subject: "RENEWAL OFFER: Exclusive Contract",
                        body: `We are absolutely blown away by your performance during our last deal. You are a massive asset to this label.\n\nWe don't want to lose you, so we are sending over a highly lucrative renewal contract with better terms, a massive advance, and lower royalty cuts.\n\nPlease let us know if you accept.`,
                        isRead: false,
                        contractOffer: {
                            labelId: newContract.labelId,
                            status: 'pending' as const,
                            type: dealType,
                            duration: renewalDuration,
                            requiredAlbums: dealType === 'album' ? renewalDuration : 0,
                            requiredEPs: 0,
                            requiredSingles: dealType === 'year' ? renewalDuration * 2 : 0, 
                            advanceMoney: renewalAdvance,
                            royaltyCut: newRoyaltyCut
                        }
                    });
                }

                newContract = undefined;
            }
        }
        
        let finalMoney = prev.stats.money + finalRevenueForPlayer;

        // NPC Collab Offer Logic
        const pendingCollabsCount = newEmails.filter(e => e.collabOffer && e.collabOffer.status === 'pending').length;
        if (pendingCollabsCount < 3 && (prev.artist?.level || 0) >= 3 && Math.random() < 0.05) {
            const availableNpcs = NPC_ARTISTS.filter(n => !prev.artist?.name || n.name.toLowerCase() !== prev.artist.name.toLowerCase());
            const npc = availableNpcs[Math.floor(Math.random() * availableNpcs.length)];
            
            let songName = `${['Heart', 'Night', 'Fire', 'Lost', 'Found', 'Dream', 'Broken', 'Wild', 'Midnight', 'Summer', 'Echo', 'Love', 'Tears', 'Shadow'][Math.floor(Math.random() * 14)]} ${['Awake', 'City', 'Walker', 'Lover', 'Soul', 'Sky', 'River', 'Road', 'Vibes', 'Lights', 'Hearts', 'Spirits'][Math.floor(Math.random() * 12)]}`;
            let coverArt = (npc as any).coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=60`;
            
            const disco = ARTIST_DISCOGRAPHY[npc.name];
            if (disco && disco.tracks && disco.tracks.length > 0) {
                const rt = disco.tracks[Math.floor(Math.random() * disco.tracks.length)];
                songName = rt.title;
                coverArt = rt.cover;
            }

            const fee = Math.floor(Math.random() * 15000) + ((prev.artist?.level || 1) * 15000); // Scales with level
            
            newEmails.unshift({
               id: `collab_${Date.now()}_${Math.random()}`,
               dateStr: currentDateObj.toISOString(),
               sender: `${npc.name} Management`,
               subject: `Collaboration Offer: ${npc.name}`,
               body: `Hi ${prev.artist?.name || 'Artist'},\n\nWe love your recent work and ${npc.name} would like to have you as a featured artist on their upcoming track "${songName}".\n\nWe are offering a one-time flat fee of $${fee.toLocaleString()} for the feature. You will be credited properly across all platforms.\n\nPlease review the details below and let us know.`,
               isRead: false,
               collabOffer: {
                   npcArtist: npc.name,
                   songTitle: songName,
                   coverArt: coverArt,
                   fee: fee,
                   status: 'pending',
                   genre: (npc as any).type || 'Pop'
               }
            });
        }

        if (nextDaysPassed > 0 && nextDaysPassed % 365 === 0) {
            let taxRate = 0;
            if (newCurrentYearRevenue > 10000000) taxRate = 0.40;
            else if (newCurrentYearRevenue > 1000000) taxRate = 0.35;
            else if (newCurrentYearRevenue > 500000) taxRate = 0.28;
            else if (newCurrentYearRevenue > 100000) taxRate = 0.20;
            else if (newCurrentYearRevenue > 25000) taxRate = 0.15;
            else if (newCurrentYearRevenue > 10000) taxRate = 0.10;

            const taxAmount = Math.floor(newCurrentYearRevenue * taxRate);
            finalMoney -= taxAmount;

            newEmails.unshift({
               id: `tax_${Date.now()}_${Math.random()}`,
               dateStr: currentDateObj.toISOString(),
               sender: "Global Revenue Authority",
               subject: "Annual Tax Deduction Report",
               body: `Dear ${prev.artist?.name || 'Artist'},\n\n This is a notification that your annual tax has been automatically deducted from your account balance.\n\nAnnual Revenue: $${Math.floor(newCurrentYearRevenue).toLocaleString()}\nTax Bracket: ${(taxRate * 100).toFixed(0)}%\n\nTax Amount Deducted: $${taxAmount.toLocaleString()}\n\nThank you for your contribution.`,
               isRead: false
            });

            newCurrentYearRevenue = 0;
        }

        if (isNewMonth) {
            const totalMonthlyVar = newMonthStreamingRev + newMonthSalesRev + newMonthMerchRev + newMonthTourRev;
            if (totalMonthlyVar > 0) {
                const spotifyRev = Math.floor(newMonthStreamingRev * 0.55);
                const appleRev = Math.floor(newMonthStreamingRev * 0.35);
                const ytRev = Math.floor(newMonthStreamingRev * 0.10);
                
                let topSongId = '';
                let topSongRev = -1;
                Object.entries(newMonthSongRev).forEach(([id, r]) => {
                    const rev = r as number;
                    if (rev > topSongRev) {
                        topSongRev = rev;
                        topSongId = id;
                    }
                });
                const topSongTitle = topSongId ? (prev.releases.find(r => r.id === topSongId)?.title || 'Unknown') : 'N/A';

                const bodyTxt = `Monthly Revenue Report - ${prevDateObj.toLocaleString('en-US', {month: 'long', year: 'numeric'})}

Total Gross Monthly Revenue: $${Math.floor(totalMonthlyVar).toLocaleString()}

Platform Breakdown:
• Spotify: $${spotifyRev.toLocaleString()}
• Apple Music: $${appleRev.toLocaleString()}
• YouTube Music: $${ytRev.toLocaleString()}
• Digital & Physical Sales: $${Math.floor(newMonthSalesRev).toLocaleString()}
• Merchandise: $${Math.floor(newMonthMerchRev).toLocaleString()}
• Tours & Live Gigs: $${Math.floor(newMonthTourRev).toLocaleString()}

${labelDeduction > 0 ? `* Advance Recoupment & Label Cut Deduction: -$${labelDeduction.toLocaleString()}\n` : ''}
Top Generating Song:
"${topSongTitle}" ($${Math.floor(topSongRev).toLocaleString()})
`;
                newEmails.unshift({
                   id: `report_${Date.now()}_${Math.random()}`,
                   dateStr: currentDateObj.toISOString(),
                   sender: "Management",
                   subject: `${prevDateObj.toLocaleString('en-US', {month: 'short'})} Revenue Report`,
                   body: bodyTxt,
                   isRead: false
                });
            }

            // reset
            newMonthStreamingRev = 0;
            newMonthSalesRev = 0;
            newMonthMerchRev = 0;
            newMonthTourRev = 0;
            newMonthSongRev = {};
        }

        const newNews = prev.news ? [...prev.news] : [];
        const dailyNews = generateDailyNews(prev, nextDateObj, nextDateObj.toISOString());
        if (dailyNews) {
           newNews.unshift(dailyNews);
           // keep max 50 news items
           if (newNews.length > 50) newNews.length = 50;
        }

        return {
          ...prev,
          artist: prev.artist ? { 
            ...prev.artist, 
            level: currentLvl,
            labelContract: newContract,
            socialProfile: prev.artist.socialProfile ? {
              ...prev.artist.socialProfile,
              customTweets: newCustomTweets
            } : prev.artist.socialProfile
          } : null,
          popularity: {
             america: newAmériquePop,
             latinAmerica: newLatinPop,
             europe: newEuropePop
          },
          stats: {
            ...prev.stats,
            lastWrappedTotalStreams: newLastWrappedTotalStreams,
            currentYearRevenue: newCurrentYearRevenue,
            currentMonthStreamingRev: newMonthStreamingRev,
            currentMonthSalesRev: newMonthSalesRev,
            currentMonthMerchRev: newMonthMerchRev,
            currentMonthTourRev: newMonthTourRev,
            currentMonthSongRev: newMonthSongRev,
            money: finalMoney,
            streams: prev.stats.streams + dailyStreams,
            sales: (prev.stats.sales || 0) + dailySales,
            awards: prev.stats.awards + totalPlayerWinsAtCeremony,
            ageInDays: prev.stats.ageInDays + 1,
            skillPoints: prev.stats.skillPoints + (reachedNextWeek ? 250 : 0),
            youtubeSubscribers: Math.floor((prev.stats.youtubeSubscribers || 0) + ytSubscriberGain),
            socialFollowers: Math.floor((prev.stats.socialFollowers || 0) + socialFollowerGain)
          },
          time: {
            ...prev.time,
            daysPassed: nextDaysPassed
          },
          releases: updatedReleasesWithSales,
          merch: updatedMerch,
          gigs: updatedGigs,
          tours: updatedTours,
          activeTourId,
          videos: updatedVideos,
          tikTok: updatedTikTok,
          grammys: nextGrammys,
          wrappedHistory: newWrappedHistory,
          emails: newEmails,
          news: newNews,
          lastComputedCharts: newLastComputedCharts
        };
      });

      const dateToCheck = new Date(gameState.time.startDate);
      dateToCheck.setDate(dateToCheck.getDate() + gameState.time.daysPassed + 1);
      const isWrappedDay = dateToCheck.getMonth() === 11 && dateToCheck.getDate() === 10;

      // Do not show the daily report popup if auto-advancing
      // Do not show daily report if it's wrapped day (we show wrapped screen instead)
      if (!isAutoSkip && !isWrappedDay) {
        setDailyReport({
          dailyStreams,
          dailySales,
          revenue,
          topSong,
          topAlbum,
          tourRevenue: tourTicketRevenue,
          tourAttendance: tourTicketsSold,
          tourName: activeTourName,
          tourStage: activeTourStage
        });
      }

      if (isWrappedDay) {
          setIsAutoAdvancing(false);
          setScreen('wrapped');
      }
      } catch (err) { console.error('Error during advance time:', err); alert('Error advancing day. Fix code: ' + err); }
      finally {
         setIsLoadingNextDay(false);
      }
    }, isAutoSkip ? 100 : 1500); 
  };

  const handleCreateArtist = (artistData: GameState['artist']) => {
    if (!artistData) return;
    const initialMoney = CAPITAL_MAP[artistData.capital];
    
    let assignedSlotId = currentSaveId;
    if (!assignedSlotId || !assignedSlotId.startsWith('slot_') || assignedSlotId === 'slot_auto') {
        const assignedSlots = saveProfiles.map(p => p.id);
        const availableSlots = ['slot_1', 'slot_2', 'slot_3'].filter(id => !assignedSlots.includes(id));
        assignedSlotId = availableSlots.length > 0 ? availableSlots[0] : 'slot_1';
        setCurrentSaveId(assignedSlotId);
    }
    
    const npcReleases = [];
    NPC_ARTISTS.forEach((npc, i) => {
        if (artistData.name && npc.name.toLowerCase() === artistData.name.toLowerCase()) return;
        const disco = (ARTIST_DISCOGRAPHY as any) || {};

        // 1 Album
        let albumId = `npc-${npc.name}-album-0`;
        let albumDisco = disco[npc.name]?.albums?.[0];
        let albumTracks = [];

        if (disco[npc.name]?.tracks && disco[npc.name]?.tracks.length > 0) {
            albumTracks = disco[npc.name].tracks.filter((t: any) => t.album === albumDisco?.title || (t.album && albumDisco?.title && t.album.toLowerCase().includes(albumDisco.title.toLowerCase())));
            if (albumTracks.length === 0) {
                albumTracks = disco[npc.name].tracks.filter((t: any) => t.cover === albumDisco?.cover);
            }
            if (albumTracks.length === 0) {
                 albumTracks = disco[npc.name].tracks.slice(0, 10);
            }
            if (albumTracks.length === 0) {
                albumTracks = [disco[npc.name].tracks[0]];
            }
        }

        if (!albumDisco || !albumTracks || albumTracks.length === 0 || !albumDisco.title) return;

        let albType = 'Album';
        if (albumDisco) {
             if (albumDisco.title) {
                 if (albumDisco.title.match(/ - Single$/i)) albType = 'Single Pack';
                 else if (albumDisco.title.match(/ - EP$/i)) albType = 'EP';
                 albumDisco.title = albumDisco.title.replace(/ - Single$/i, '').replace(/ - EP$/i, ' EP');
             }

            const trackIds = albumTracks.map((_, i) => `npc-${npc.name}-single-0-${i}`);
            npcReleases.push({
                id: albumId,
                title: albumDisco.title,
                coverImage: albumDisco.cover || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=60`,
                artistId: npc.name,
                isNPCRelease: true,
                type: albType as any,
                status: 'Published',
                releaseDate: INITIAL_DATE,
                trackIds, // Let this be populated so it behaves correctly
                trend: 'Non-Hit',
                streams: { spotify: npc.basePoints * 10, appleMusic: npc.basePoints * 5, amazonMusic: npc.basePoints * 2, youtubeMusic: npc.basePoints * 8, total: npc.basePoints * 25 },
                sales: { physical: 0, digital: 0, total: 0 },
                radioPlays: 0,
                debutStreams: npc.basePoints * 5
            });
        }
        
        // Tracks
        albumTracks.forEach((track: any, i: number) => {
            let title = track.title;
            let collaborator = undefined;
            let isNPCCollab = false;
            const featMatch = title.match(/\b(?:feat\.?|featuring|ft\.?)\s+([^()[\]]+)/i);
            if (featMatch && featMatch[1]) {
                const featName = featMatch[1].trim();
                const isRealNPC = NPC_ARTISTS.find(a => a.name.toLowerCase() === featName.toLowerCase());
                
                if (isRealNPC) {
                    collaborator = isRealNPC.name;
                    isNPCCollab = true;
                    title = title.substring(0, featMatch.index) + 'feat. ' + collaborator + title.substring(featMatch.index + featMatch[0].length);
                } else {
                    const otherNPCs = NPC_ARTISTS.filter(a => a.name !== npc.name);
                    const randomNPC = otherNPCs[Math.floor(Math.random() * otherNPCs.length)].name;
                    collaborator = randomNPC;
                    isNPCCollab = true;
                    title = title.substring(0, featMatch.index) + 'feat. ' + randomNPC + title.substring(featMatch.index + featMatch[0].length);
                }
            }

            npcReleases.push({
                id: `npc-${npc.name}-single-0-${i}`,
                title: title,
                coverImage: albumDisco?.cover || track.cover || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=60`,
                artistId: npc.name,
                collaborator,
                isNPCCollab,
                isNPCRelease: true,
                isBSide: i > 1,
                type: 'Single',
                genre: npc.type || 'Pop',
                status: 'Published',
                releaseDate: INITIAL_DATE,
                trend: 'Non-Hit',
                streams: { spotify: npc.basePoints * 5, appleMusic: npc.basePoints * 2, amazonMusic: npc.basePoints * 1, youtubeMusic: npc.basePoints * 3, total: npc.basePoints * 11 },
                sales: { physical: 0, digital: 0, total: 0 },
                radioPlays: 0,
                debutStreams: npc.basePoints * 2
            });
        });
    });

    const initialState: GameState = {
      version: 1,
      artist: {
        ...artistData,
        level: 0
      },
      stats: {
        money: initialMoney,
        ageInDays: 0,
        streams: 0,
        sales: 0,
        awards: 0,
        skillPoints: 0
      },
      skills: {
        performance: 10,
        production: 10,
        songwriting: 10,
        vocals: 10,
        pop: 10,
        kpop: 10,
        rap: 10,
        country: 10
      },
      popularity: {
        america: 0,
        latinAmerica: 0,
        europe: 0
      },
      tikTok: {
        followers: Math.floor(Math.random() * 500) + 100,
        following: Math.floor(Math.random() * 50) + 10,
        totalLikes: 0,
        username: artistData.name.toLowerCase().replace(/[^a-z0-9]/g, '') + 'official',
        displayName: artistData.name,
        isVerified: false,
        label: 'Artist',
        posts: [],
        sounds: [],
        fatigueScore: 0
      },
      npcStats: Object.fromEntries(NPC_ARTISTS.filter(npc => !artistData.name || npc.name.toLowerCase() !== artistData.name.toLowerCase()).map(npc => {
        const isHighTier = npc.basePoints > 380000;
        const regionBias = Math.random();
        return [
          npc.name,
          {
            listeners: npc.basePoints * (Math.random() * 20 + 80), // roughly 20-40 million
            skills: {
              performance: isHighTier ? 60 + Math.random() * 30 : 40 + Math.random() * 30,
              production: isHighTier ? 60 + Math.random() * 30 : 40 + Math.random() * 30,
              songwriting: isHighTier ? 60 + Math.random() * 30 : 40 + Math.random() * 30,
              vocals: isHighTier ? 60 + Math.random() * 30 : 40 + Math.random() * 30,
              pop: npc.type === 'Pop' ? 80 + Math.random()*20 : 50,
              kpop: npc.type === 'Kpop' ? 80 + Math.random()*20 : 10,
              rap: npc.type === 'Rap' ? 80 + Math.random()*20 : 10,
              country: npc.type === 'Country' ? 80 + Math.random()*20 : 10,
            },
            popularity: {
              america: isHighTier ? 70 + Math.random() * 30 : 40 + Math.random() * 30,
              latinAmerica: isHighTier ? 50 + Math.random() * 30 : 30 + Math.random() * 30,
              europe: isHighTier ? 60 + Math.random() * 30 : 35 + Math.random() * 30,
            }
          }
        ];
      })),
      time: {
        startDate: INITIAL_DATE,
        daysPassed: 0
      },
      releases: npcReleases as any,
      merch: [],
      gigs: [],
      grammys: {
        year: new Date(INITIAL_DATE).getFullYear() + 1,
        stage: 'Closed',
        submissions: [],
        results: [],
        history: []
      }
    };
    
    const { charts } = computeCharts(initialState);
    initialState.lastComputedCharts = charts;
    
    setGameState(initialState);
    setScreen('dashboard');
  };

  // --- Calculations ---
  
  const getCurrentDate = () => {
    if (!gameState) return new Date();
    const d = new Date(gameState.time.startDate);
    d.setDate(d.getDate() + gameState.time.daysPassed);
    return d;
  };

  const currentAgeYears = gameState ? Math.floor(STARTING_AGE_YEARS + (gameState.stats.ageInDays / 365.25)) : 18;

  // --- Screens ---

  if (screen === 'loading') {
    return (
      <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center p-6 text-white overflow-hidden relative font-sans">
        <div className="animate-pulse flex flex-col items-center duration-1000 animate-in fade-in zoom-in-50">
           <div className="relative mb-6">
              <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
              <div className="w-56 h-56 flex items-center justify-center relative shadow-2xl overflow-hidden rounded-3xl border border-yellow-500/30">
                 <Mic className="absolute w-24 h-24 text-yellow-500/20" />
                 <img src="/logo.svg" alt="Rapper Rise Logo" className="w-full h-full object-cover scale-110 relative z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
           </div>
           <h1 className="text-5xl font-black tracking-[-0.08em] uppercase text-white mb-2 leading-none text-center">
             RAPPER<br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">RISE</span>
           </h1>
           <p className="text-yellow-500/50 text-[10px] font-bold tracking-[0.4em] uppercase mt-8">Loading Experience...</p>
        </div>
      </div>
    );
  }

  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center p-6 text-white overflow-hidden relative font-sans selection:bg-purple-500/30">
        
        {/* Update Pop Up */}
        {showUpdatePopup && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-md w-full relative animate-in fade-in zoom-in-95 duration-500 shadow-2xl">
                <button onClick={() => setShowUpdatePopup(false)} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center border border-yellow-500/30">
                      <Sparkles className="w-6 h-6 text-yellow-500" />
                   </div>
                   <div>
                     <h2 className="text-2xl font-black uppercase tracking-tight">Update <span className="text-yellow-500">v1.6</span></h2>
                     <p className="text-white/40 text-xs font-bold uppercase tracking-widest">What's New in Rapper Rise</p>
                   </div>
                </div>
                
                 <div className="space-y-4 mb-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <h3 className="font-bold text-lg mb-2 text-pink-400">TikTok Update!</h3>
                      <p className="text-sm text-white/70 leading-relaxed">
                        A full TikTok simulation has been added! Manage your profile, build followers, post viral videos, launch sound campaigns, and boost your songs directly to the Billboard charts! Chart History Weeks bug is also fixed.
                      </p>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
                     <h3 className="text-sm font-bold text-white mb-2 tracking-tight flex items-center justify-center">Join Our Community</h3>
                     <div className="flex justify-center gap-4">
                         <a href="https://discord.gg/zNQ9d9J4e" target="_blank" rel="noopener noreferrer" className="bg-[#5865F2]/20 hover:bg-[#5865F2]/40 text-[#5865F2] border border-[#5865F2]/50 p-3 rounded-xl transition-colors flex items-center justify-center">
                             <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                         </a>
                         <a href="https://x.com/RapperRise1" target="_blank" rel="noopener noreferrer" className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 border border-blue-500/50 p-3 rounded-xl transition-colors flex items-center justify-center">
                             <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg>
                         </a>
                     </div>
                  </div>
                <button onClick={() => setShowUpdatePopup(false)} className="w-full bg-white text-black py-4 rounded-xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-xl hover:bg-gray-200">
                  Got It, Let's Rap
                </button>
             </div>
          </div>
        )}

        {/* Background Atmosphere */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-yellow-600/10 blur-[150px] rounded-full"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-orange-600/10 blur-[150px] rounded-full"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay"></div>
        </div>
        
        <div className="relative z-10 text-center w-full max-w-xl">
          <div className="mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="relative inline-block">
               <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
               <div className="relative w-48 h-48 bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-yellow-500/30 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl overflow-hidden group">
                 <Mic className="absolute w-20 h-20 text-yellow-500/20" />
                 <div className="absolute inset-0 bg-white/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                 <img src="/logo.svg" alt="Rapper Rise Logo" className="w-full h-full object-cover scale-110 relative z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
               </div>
            </div>
            
            <h1 className="text-6xl sm:text-8xl font-black tracking-[ -0.08em] uppercase text-white mb-4 leading-none text-center">
              RAPPER<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">RISE</span>
            </h1>
            <div className="flex items-center justify-center gap-4 mt-6">
               <div className="h-px w-12 bg-white/10" />
               <p className="text-white/40 font-black tracking-[0.4em] text-[10px] uppercase">Est. 2024 • System v1.5</p>
               <div className="h-px w-12 bg-white/10" />
            </div>
          </div>

          <div className="space-y-4 max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
            <button 
              onClick={() => setScreen('saves')}
              className="w-full h-16 flex items-center justify-center gap-4 bg-white text-black hover:bg-white/90 active:scale-95 font-black tracking-widest text-sm rounded-2xl transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/10 to-yellow-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Play className="w-5 h-5 fill-current text-yellow-500" />
              PLAY
            </button>
          </div>
        </div>

        <div className="absolute bottom-10 text-[10px] font-black tracking-[0.5em] text-white/20 uppercase animate-pulse">
          Select Operation Mode
        </div>
      </div>
    );
  }

  if (screen === 'saves') {
    return (
      <div className="flex flex-col h-full bg-[#0a0a0a] overflow-y-auto w-full p-4 md:p-12 font-sans selection:bg-purple-500/30">
        <div className="max-w-5xl mx-auto w-full">
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-xl">
                  <Save className="w-6 h-6 text-white" />
               </div>
               <div>
                  <h1 className="text-3xl font-black text-white tracking-tight uppercase">Save & Load Manager</h1>
                  <p className="text-white/40 text-sm font-medium tracking-wide">Manage your career legacies via Slots or backup as JSON Files.</p>
               </div>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3].map(slotNum => {
               const slotId = `slot_${slotNum}`;
               const profile = saveProfiles.find(p => p?.id === slotId);
               
               return (
                 <div key={slotId} className="bg-[#111] border border-white/10 rounded-[2rem] p-6 relative overflow-hidden group hover:border-purple-500/30 transition-all flex flex-col">
                   <div className="mb-4">
                     <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-500/20">Slot {slotNum}</span>
                   </div>
                   
                   {profile ? (
                     <div className="flex flex-col flex-1">
                        <div className="flex items-center gap-4 mb-4">
                           {profile.profilePicUrl ? (
                             <img src={profile.profilePicUrl} className="w-16 h-16 rounded-full object-cover border-2 border-white/10" />
                           ) : (
                             <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
                               <User className="w-8 h-8 text-white/40" />
                             </div>
                           )}
                           <h3 className="text-2xl font-black mb-1 truncate">{profile.artistName}</h3>
                        </div>
                        <p className="text-xs text-white/40 font-bold uppercase tracking-widest mb-6">Last Played: {new Date(profile.lastPlayed).toLocaleString()}</p>
                        
                        <div className="mt-auto space-y-2">
                           <button 
                             onClick={async () => {
                               const saved = await localforage.getItem<string>('musician_simulator_save_' + slotId);
                               if (saved) {
                                  const parsedState = JSON.parse(saved);
                                  if (parsedState && parsedState.releases) {
                                      parsedState.releases = parsedState.releases.filter((r: any) => {
                                          if (r.isNPCRelease || (r.artistId && NPC_ARTISTS.some(n => n.name === r.artistId))) {
                                              if (r.coverImage && r.coverImage.includes('pravatar')) return false;
                                              if (r.title && /Album \d+$/.test(r.title)) return false;
                                              if (r.title && / Studio Album \d+$/.test(r.title)) return false;
                                              if (r.title && /'s Debut$/.test(r.title)) return false;
                                              if (r.title && /- Track \d+$/.test(r.title)) return false;
                                              if (r.title && /^Single \d+-\d+$/.test(r.title)) return false;
                                          }
                                          return true;
                                      }).map((r: any) => {
                                          if (!r.isNPCRelease && r.artistId && NPC_ARTISTS.some(n => n.name === r.artistId)) {
                                              return { ...r, isNPCRelease: true };
                                          }
                                          return r;
                                      });
                                  }
                                  if (parsedState && parsedState.grammys) {
                                      const genericSongs = ["Midnight", "Hold On", "Never Let Go", "City Lights", "Sunset", "Echoes", "Fading Away", "Better Days", "Lost In You", "Runaway", "Silent Whisper", "Dreams", "Euphoria", "Chasing Stars", "Nostalgia", "Desire", "Breathe", "Awake", "Gravity", "Illusions"];
                                      const genericAlbums = ["The Journey", "Evolution", "Midnight Sessions", "Echoes of Time", "Horizons", "Rebirth", "Golden Hour", "Neon Lights", "Into the Wild", "Silent Storm", "Unplugged", "Daydreams", "Nocturne", "Vibrations", "The Aftermath", "Ascension", "Odyssey", "Mirage", "Prism", "Legacy"];
                                      
                                      const fixNominee = (nom: any) => {
                                         if (nom && nom.title && typeof nom.title === 'string' && / Hit 20\d\d$/.test(nom.title)) {
                                            let hash = 0;
                                            if (nom.artist && typeof nom.artist === 'string') {
                                               hash = (nom.artist.charCodeAt(0) * 17) % 20;
                                            }
                                            nom.title = nom.type === 'Album' ? genericAlbums[hash] : genericSongs[hash];
                                         }
                                         return nom;
                                      };
                                      
                                      if (parsedState.grammys.results) {
                                         parsedState.grammys.results = parsedState.grammys.results.map((res: any) => ({
                                            ...res,
                                            nominees: res.nominees.map(fixNominee)
                                         }));
                                      }
                                      if (parsedState.grammys.history) {
                                         parsedState.grammys.history = parsedState.grammys.history.map((hist: any) => ({
                                            ...hist,
                                            categories: hist.categories ? hist.categories.map((cat: any) => ({
                                               ...cat,
                                               nominees: cat.nominees ? cat.nominees.map(fixNominee) : []
                                            })) : []
                                         }));
                                      }
                                  }
                                  
                                  setGameState(parsedState);
                                  setCurrentSaveId(slotId);
                                  setScreen('dashboard');
                               }
                             }}
                             className="w-full bg-white text-black hover:bg-gray-200 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95"
                           >
                             Load Game
                           </button>
                           
                           {gameState && (
                              <button 
                                onClick={() => {
                                   setCurrentSaveId(slotId);
                                   saveGameData(slotId, gameState, false);
                                }}
                                className="w-full bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors"
                              >
                                Save Current Here
                              </button>
                           )}
                           
                           <button 
                             onClick={async () => {
                               await localforage.removeItem('musician_simulator_save_' + slotId);
                               const lastLSA = await localforage.getItem('musician_simulator_last_save_id');
                               if (lastLSA === slotId) {
                                 await localforage.removeItem('musician_simulator_last_save_id');
                               }
                                 
                               const updated = saveProfiles.filter(p => p?.id !== slotId);
                               setSaveProfiles(updated);
                               await localforage.setItem('musician_simulator_saves_index', JSON.stringify(updated));

                               if (currentSaveId === slotId) {
                                   setCurrentSaveId(null);
                               }
                             }}
                             className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-400 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors border border-red-500/10"
                           >
                             Delete Slot
                           </button>
                        </div>
                     </div>
                   ) : (
                     <div className="flex flex-col flex-1 items-center justify-center py-6 text-center">
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-4">
                           <Save className="w-5 h-5 text-white/20" />
                        </div>
                        <h3 className="text-lg font-bold text-white/50 mb-6">Empty Slot</h3>
                        
                        <div className="mt-auto w-full space-y-2">
                           {gameState && (
                              <button 
                                onClick={() => {
                                   setCurrentSaveId(slotId);
                                   saveGameData(slotId, gameState, false);
                                }}
                                className="w-full bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors mb-2"
                              >
                                Save Current Here
                              </button>
                           )}
                           <button 
                             onClick={() => {
                               setCurrentSaveId(slotId);
                               setGameState(null);
                               setScreen('create');
                             }}
                             className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors shadow-xl active:scale-95"
                           >
                             Start New Career
                           </button>
                        </div>
                     </div>
                   )}
                 </div>
               );
             })}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'create') {
    return <CreateArtistScreen onSubmit={handleCreateArtist} />;
  }

  // Dashboard Screen
  const currentDate = getCurrentDate();
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const monthYearStr = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const dateDayStr = currentDate.toLocaleDateString('en-US', { day: '2-digit' });

  return (
    <div className="min-h-screen bg-[#050507] text-white font-sans overflow-hidden relative flex flex-col">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full"></div>
      </div>

      {/* Top Navigation & Stats Bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 bg-black/40 backdrop-blur-md border-b border-white/10 gap-4 md:gap-0">
        <div className="flex items-center justify-start gap-4 md:gap-6">
          <div className="flex w-12 h-12 items-center justify-center bg-purple-600/20 border border-purple-500/30 rounded-lg cursor-default">
            <Music className="w-5 h-5 text-purple-400" />
          </div>
          <h1 className="text-lg md:text-xl font-bold tracking-tighter italic text-purple-400">MUSICIAN SIMULATOR</h1>
        </div>

        <div className="flex gap-4 md:gap-8 items-center overflow-x-auto pb-2 md:pb-0">
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[10px] uppercase tracking-widest text-white/40">Current Balance</span>
            <span className="text-xl md:text-2xl font-mono text-green-400">${(gameState?.stats?.money || 0).toLocaleString()}</span>
          </div>
          <div className="w-[1px] h-8 bg-white/10 shrink-0"></div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[10px] uppercase tracking-widest text-white/40">Artist Age</span>
            <span className="text-xl md:text-2xl font-mono">{currentAgeYears} <span className="text-sm text-white/60">yrs</span></span>
          </div>
          <div className="w-[1px] h-8 bg-white/10 shrink-0"></div>
          <div className="flex flex-col items-end shrink-0">
             <span className="text-[10px] uppercase tracking-widest text-white/40">Total Streams</span>
             <span className="text-xl md:text-2xl font-mono text-blue-400">{(gameState?.stats?.streams || 0).toLocaleString()}</span>
          </div>
          <div className="w-[1px] h-8 bg-white/10 shrink-0"></div>
          <div className="flex flex-col items-end shrink-0">
             <span className="text-[10px] uppercase tracking-widest text-white/40">Awards</span>
             <span className="text-xl md:text-2xl font-mono text-yellow-500">{gameState?.stats.awards}</span>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <main className="relative z-10 flex-1 flex flex-col p-4 md:p-8 overflow-y-auto mb-[72px]">
        
        {/* Central Interface */}
        {screen !== 'x' && screen !== 'google' && screen !== 'youtube' && screen !== 'wrapped' && (
          <div className="flex-1 flex flex-col h-full bg-black/20 border border-white/5 rounded-3xl overflow-hidden relative min-h-[400px]">
             {screen === 'dashboard' && <DashboardView gameState={gameState} setGameState={setGameState} dateDayStr={dateDayStr} dayName={dayName} monthYearStr={monthYearStr} handleNextDay={handleNextDay} isLoadingNextDay={isLoadingNextDay} currentAgeYears={currentAgeYears} isAutoAdvancing={isAutoAdvancing} setIsAutoAdvancing={setIsAutoAdvancing} onOpenWrapped={() => setScreen('wrapped')} />}
             {screen === 'studio' && <StudioView gameState={gameState!} setGameState={setGameState} currentDate={currentDate} />}
             {screen === 'discography' && <DiscographyView gameState={gameState!} setGameState={setGameState} currentDate={currentDate} />}
             {screen === 'merch' && <MerchStoreView gameState={gameState!} setGameState={setGameState} />}
             {screen === 'skills' && <SkillsView gameState={gameState!} setGameState={setGameState} />}
             {screen === 'regions' && <RegionPopularityView gameState={gameState!} />}
             {screen === 'gigs' && <GigsView gameState={gameState!} setGameState={setGameState} currentDate={currentDate} />}
             {screen === 'tour' && <TourView gameState={gameState!} setGameState={setGameState} currentDate={currentDate} />}
             {screen === 'platforms' && <PlatformsView gameState={gameState!} setGameState={setGameState as any} />}
             {screen === 'labels' && <LabelsView gameState={gameState!} setGameState={setGameState} onClose={() => setScreen('dashboard')} />}
             {screen === 'charts' && <ChartsView gameState={gameState!} onClose={() => setScreen('dashboard')} />}
             {screen === 'settings' && <SettingsView gameState={gameState!} setGameState={setGameState} />}
             {screen === 'plaques' && <PlaquesView gameState={gameState!} />}
             {screen === 'grammys' && <GrammysView gameState={gameState!} setGameState={setGameState} />}
          </div>
        )}
      </main>

      {screen === 'wrapped' && (
        <div className="fixed inset-0 z-[60] bg-black text-white w-full h-full overflow-hidden flex justify-center">
           <SpotifyWrappedView gameState={gameState!} onClose={() => setScreen('dashboard')} />
        </div>
      )}

      {screen === 'youtube' && (
        <div className="fixed inset-0 z-[60] bg-black text-white w-full h-full overflow-hidden flex justify-center">
           <YouTubeView gameState={gameState!} setGameState={setGameState} onClose={() => setScreen('dashboard')} />
        </div>
      )}

      {screen === 'tiktok' && (
        <div className="fixed inset-0 z-[60] bg-black text-white w-full h-full overflow-hidden flex justify-center">
           <TikTokView gameState={gameState!} setGameState={setGameState as any} onClose={() => setScreen('dashboard')} />
        </div>
      )}

      {screen === 'x' && (
        <div className="fixed inset-0 z-[60] bg-black text-white w-full h-full overflow-hidden flex justify-center">
           <XView gameState={gameState!} setGameState={setGameState} onClose={() => setScreen('dashboard')} />
        </div>
      )}

      {screen === 'google' && (
        <div className="fixed inset-0 z-[60] bg-white text-black w-full h-full overflow-hidden flex justify-center">
           <GoogleView gameState={gameState!} onClose={() => setScreen('dashboard')} />
        </div>
      )}

      {/* Loading Overlay (Optional whole page blocker) */}
      {isLoadingNextDay && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                <span className="text-white font-mono text-sm uppercase tracking-widest animate-pulse">Simulating Time...</span>
            </div>
        </div>
      )}



      {/* Daily Report Modal Overlay */}
      {dailyReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#050507] border border-white/10 rounded-3xl p-8 max-w-lg w-full relative overflow-hidden shadow-[0_0_50px_rgba(192,132,252,0.1)]">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>

             <h2 className="text-2xl font-bold tracking-tighter italic text-purple-400 mb-6 text-center">DAILY REPORT</h2>

             <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                   <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Daily Streams</span>
                   <span className="text-2xl font-mono text-blue-400">+{(dailyReport?.dailyStreams || 0).toLocaleString()}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                   <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Daily Sales</span>
                   <span className="text-2xl font-mono text-purple-400">+{(dailyReport?.dailySales || 0).toLocaleString()}</span>
                </div>
                <div className="col-span-2 lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                   <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Revenue</span>
                   <span className="text-2xl font-mono text-green-400">+${dailyReport.revenue.toFixed(2)}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center">
                   <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Top Song</span>
                   <span className="text-sm font-medium text-white line-clamp-1">{dailyReport.topSong || 'None'}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center">
                   <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Top Album</span>
                   <span className="text-sm font-medium text-white line-clamp-1">{dailyReport.topAlbum || 'None'}</span>
                </div>
                {dailyReport.tourName && (
                  <div className="col-span-2 lg:col-span-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex justify-between items-center text-center">
                     <div className="flex flex-col text-left">
                       <span className="text-[10px] uppercase tracking-widest text-blue-400 mb-1">Tour Update</span>
                       <span className="text-sm font-black text-white">{dailyReport.tourName}</span>
                     </div>
                     <div className="flex gap-4">
                       <div className="flex flex-col items-end">
                          <span className="text-[10px] uppercase tracking-widest text-white/50">Tickets Sold</span>
                          <span className="text-sm font-mono text-white">+{dailyReport.tourAttendance?.toLocaleString()}</span>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className="text-[10px] uppercase tracking-widest text-white/50">Revenue</span>
                          <span className="text-sm font-mono text-green-400">+${dailyReport.tourRevenue?.toLocaleString()}</span>
                       </div>
                     </div>
                  </div>
                )}
             </div>

             <button 
               onClick={() => setDailyReport(null)}
               className="w-full h-14 bg-white/10 hover:bg-white/20 text-white font-bold tracking-widest text-sm rounded-xl transition-all uppercase"
             >
               Continue
             </button>
          </div>
        </div>
      )}

      {/* Navigation Di Bawah Player Tinggal Klik Klik Aja */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/10 flex items-center overflow-x-auto hide-scrollbar sm:justify-center p-2 gap-1 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] style={{ touchAction: 'pan-x' }}">
        <button onClick={() => setScreen('dashboard')} className={`flex flex-col items-center justify-center w-[72px] shrink-0 p-2 rounded-xl transition-colors ${screen === 'dashboard' ? 'text-purple-400 bg-purple-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <Activity className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">Dash</span>
        </button>
        <button onClick={() => setScreen('studio')} className={`flex flex-col items-center justify-center w-[72px] shrink-0 p-2 rounded-xl transition-colors ${screen === 'studio' ? 'text-purple-400 bg-purple-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <Mic className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">Studio</span>
        </button>
        <button onClick={() => setScreen('discography')} className={`flex flex-col items-center justify-center w-[72px] shrink-0 p-2 rounded-xl transition-colors ${screen === 'discography' ? 'text-purple-400 bg-purple-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <Disc className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">Disco</span>
        </button>
        <button onClick={() => setScreen('merch')} className={`flex flex-col items-center justify-center w-[72px] shrink-0 p-2 rounded-xl transition-colors ${screen === 'merch' ? 'text-purple-400 bg-purple-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <ShoppingBag className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">Merch</span>
        </button>
        <button onClick={() => setScreen('skills')} className={`flex flex-col items-center justify-center w-[72px] shrink-0 p-2 rounded-xl transition-colors ${screen === 'skills' ? 'text-purple-400 bg-purple-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <Zap className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">Skills</span>
        </button>
        <button onClick={() => setScreen('regions')} className={`flex flex-col items-center justify-center w-[72px] shrink-0 p-2 rounded-xl transition-colors ${screen === 'regions' ? 'text-purple-400 bg-purple-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <Globe className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">Regions</span>
        </button>
        <button onClick={() => setScreen('gigs')} className={`flex flex-col items-center justify-center w-[72px] shrink-0 p-2 rounded-xl transition-colors ${screen === 'gigs' ? 'text-purple-400 bg-purple-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <Ticket className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">Gigs</span>
        </button>
        <button onClick={() => setScreen('tour')} className={`flex flex-col items-center justify-center w-[72px] shrink-0 p-2 rounded-xl transition-colors ${screen === 'tour' ? 'text-purple-400 bg-purple-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <MapPin className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">Tour</span>
        </button>
        <button onClick={() => setScreen('platforms')} className={`flex flex-col items-center justify-center w-[72px] shrink-0 p-2 rounded-xl transition-colors ${screen === 'platforms' ? 'text-purple-400 bg-purple-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <Activity className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">Platform</span>
        </button>
        <button onClick={() => setScreen('labels')} className={`flex flex-col items-center justify-center w-[72px] shrink-0 p-2 rounded-xl transition-colors ${screen === 'labels' ? 'text-purple-400 bg-purple-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <Star className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">Labels</span>
        </button>
        <button onClick={() => setScreen('charts')} className={`flex flex-col items-center justify-center w-[72px] shrink-0 p-2 rounded-xl transition-colors ${screen === 'charts' ? 'text-purple-400 bg-purple-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <BarChart3 className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">Charts</span>
        </button>
        <button onClick={() => setScreen('grammys')} className={`flex flex-col items-center justify-center w-[72px] shrink-0 p-2 rounded-xl transition-colors ${screen === 'grammys' ? 'text-purple-400 bg-purple-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <Trophy className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">Grammy</span>
        </button>
        <button onClick={() => setScreen('plaques')} className={`flex flex-col items-center justify-center w-[72px] shrink-0 p-2 rounded-xl transition-colors ${screen === 'plaques' ? 'text-purple-400 bg-purple-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <Award className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">Plaques</span>
        </button>
        <div className="w-[1px] h-8 bg-white/10 mx-1 shrink-0" />
        <button onClick={() => setScreen('google')} className={`flex flex-col items-center justify-center w-[72px] shrink-0 p-2 rounded-xl transition-colors ${screen === 'google' ? 'text-indigo-400 bg-indigo-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <Search className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">Search</span>
        </button>
        <button onClick={() => setScreen('youtube')} className={`flex flex-col items-center justify-center w-[72px] shrink-0 p-2 rounded-xl transition-colors ${screen === 'youtube' ? 'text-red-400 bg-red-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <Play className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">YouTube</span>
        </button>
        <button onClick={() => setScreen('x')} className={`flex flex-col items-center justify-center w-[72px] shrink-0 p-2 rounded-xl transition-colors ${screen === 'x' ? 'text-blue-400 bg-blue-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6 mb-1 fill-current"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg>
          <span className="text-[10px] font-medium tracking-tight">X</span>
        </button>
        <button onClick={() => {
           if (!gameState.tikTok) {
               setGameState(prev => {
                   if(!prev) return prev;
                   return {
                       ...prev,
                       tikTok: {
                            followers: Math.floor(Math.random() * 500) + 100,
                            following: Math.floor(Math.random() * 50) + 10,
                            totalLikes: 0,
                            username: prev.artist.name.toLowerCase().replace(/[^a-z0-9]/g, '') + 'official',
                            displayName: prev.artist.name,
                            isVerified: false,
                            label: 'Artist',
                            posts: [],
                            sounds: [],
                            fatigueScore: 0
                       }
                   }
               });
           }
           setScreen('tiktok');
        }} className={`flex flex-col items-center justify-center w-[72px] shrink-0 p-2 rounded-xl transition-colors ${screen === 'tiktok' ? 'text-pink-400 bg-pink-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mb-1"><path d="M19.589 6.686a4.793 4.793 0 01-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 01-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 013.183-4.51v-3.5a6.329 6.329 0 00-5.394 10.692 6.33 6.33 0 0010.857-4.424V8.687a8.182 8.182 0 004.773 1.526V6.79a4.831 4.831 0 01-1.003-.104z"></path></svg>
          <span className="text-[10px] font-medium tracking-tight">TikTok</span>
        </button>
        
        <div className="w-[1px] h-8 bg-white/10 mx-1 shrink-0" />
        <button onClick={() => setScreen('saves')} className={`flex flex-col items-center justify-center w-[72px] shrink-0 p-2 rounded-xl transition-colors ${screen === 'saves' ? 'text-green-400 bg-green-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <Save className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">Save</span>
        </button>
        <button onClick={() => setScreen('settings')} className={`flex flex-col items-center justify-center w-[72px] shrink-0 p-2 rounded-xl transition-colors ${screen === 'settings' ? 'text-gray-400 bg-gray-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <SettingsIcon className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">Settings</span>
        </button>
      </nav>
    </div>
  );
}

// --- Create Artist Screen Component ---

function CreateArtistScreen({ onSubmit }: { onSubmit: (data: GameState['artist']) => void }) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Male');
  const [country, setCountry] = useState('United States');
  const [capital, setCapital] = useState<StartCapital>('Medium ($10,000)');
  const [imageContent, setImageContent] = useState<string>('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        alert("Image too large. Please use an image smaller than 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 250;
          let width = img.width;
          let height = img.height;
          if (width > height) {
             if (width > MAX_SIZE) {
               height *= MAX_SIZE / width;
               width = MAX_SIZE;
             }
          } else {
             if (height > MAX_SIZE) {
               width *= MAX_SIZE / height;
               height = MAX_SIZE;
             }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          setImageContent(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Please enter an artist name.");
    onSubmit({
      name,
      gender,
      country,
      capital,
      level: 1,
      image: imageContent
    });
  };

  return (
    <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center p-6 text-white py-12 relative overflow-hidden font-sans">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative z-10 backdrop-blur-xl">
        <div className="p-10">
          <h2 className="text-2xl font-bold tracking-tighter italic text-purple-400 mb-2">ARTIST PROFILE</h2>
          <p className="text-white/40 mb-8 text-sm">Configure the base identity for your simulation.</p>

          <form onSubmit={handleCreate} className="space-y-6">
            
            {/* Image Upload */}
            <div className="flex flex-col items-center mb-8">
              <label className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-dashed border-white/20 bg-black/40 flex items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-white/10 transition-colors relative group">
                {imageContent ? (
                  <>
                    <img src={imageContent || undefined} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
                       <Upload className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="text-center p-2 text-white/40">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span className="text-[10px] uppercase tracking-widest font-bold">Portrait</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>

            {/* Inputs */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Moniker / Artist Name</label>
              <input 
                type="text" 
                maxLength={40}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Lil Code, The Devs"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-purple-500 focus:bg-white/5 transition-all font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Gender Identity</label>
                <select 
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:bg-white/5 transition-all appearance-none font-mono"
                >
                  <option className="bg-zinc-900">Male</option>
                  <option className="bg-zinc-900">Female</option>
                  <option className="bg-zinc-900">Non-Binary</option>
                  <option className="bg-zinc-900">Band / Group</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Origin Country</label>
                <select 
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:bg-white/5 transition-all appearance-none font-mono"
                >
                  <option className="bg-zinc-900">United States</option>
                  <option className="bg-zinc-900">United Kingdom</option>
                  <option className="bg-zinc-900">Indonesia</option>
                  <option className="bg-zinc-900">South Korea</option>
                  <option className="bg-zinc-900">Japan</option>
                  <option className="bg-zinc-900">Canada</option>
                  <option className="bg-zinc-900">Australia</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Starting Capital</label>
              <select 
                value={capital}
                onChange={e => setCapital(e.target.value as StartCapital)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:bg-white/5 transition-all appearance-none font-mono"
              >
                <option value="Broke ($0)" className="bg-zinc-900">Broke ($0) - "Hard Mode"</option>
                <option value="Low ($1,000)" className="bg-zinc-900">Low ($1,000) - "Indie Beginner"</option>
                <option value="Medium ($10,000)" className="bg-zinc-900">Medium ($10,000) - "Trust Fund Kid"</option>
                <option value="High ($100,000)" className="bg-zinc-900">High ($100,000) - "Industry Plant"</option>
              </select>
            </div>

            <button 
              type="submit"
              className="w-full h-16 mt-6 bg-white text-black font-black text-lg tracking-widest rounded-xl hover:bg-purple-400 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 uppercase group"
            >
              INITIALIZE <Play className="w-5 h-5 fill-current" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


