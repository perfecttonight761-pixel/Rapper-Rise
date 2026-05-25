import React, { useState, useRef, useEffect } from 'react';
import localforage from 'localforage';
import { Play, Download, Search, Upload, User, Image as ImageIcon, MapPin, Music, DollarSign, Calendar as CalendarIcon, Award, Activity, Menu, Save, Loader2, Mic, Disc, Zap, Globe, Ticket, Settings as SettingsIcon, Trophy, BarChart3, ShoppingBag, Sparkles, X } from 'lucide-react';
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

export default function App() {
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
      let dailyStreams = 0;
      let dailySales = 0;
      let revenue = 0;
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

      // First pass: trigger Scheduled to Published
      workingReleases = workingReleases.map(r => {
        if (r.status === 'Scheduled' && r.releaseDate && new Date(r.releaseDate) <= currentDateObj) {
           if (['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(r.type)) newlyPublishedAlbumIds.add((r as Album).id);
           return { ...r, status: 'Published' };
        }
        return r;
      });

      // Find all tracks in Published albums
      const publishedAlbumTracks = new Map<string, { date: string, cover?: string }>(); // trackId -> album info
      workingReleases.forEach(r => {
         if (['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(r.type) && r.status === 'Published' && r.releaseDate) {
            (r as Album).trackIds.forEach(id => publishedAlbumTracks.set(id, { date: r.releaseDate!, cover: r.coverImage }));
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
             if (r.type === 'Single' && r.status === 'Published') {
                 const exists = updatedTikTok.sounds?.find((s: any) => s.songId === r.id);
                 if (!exists) {
                     let startingTrend = 'Non Trend';
                     if (r.trend === 'Hit') startingTrend = 'Hits';
                     else if (r.trend === 'Mega Hit') startingTrend = 'Mega Hits';
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
            const genreMultiplier = isSong 
              ? 1 + ((gameState.skills[(release as Song).genre.toLowerCase() as keyof GameState['skills']] || 10) / 100)
              : 1.2; // Max 2.0

            const totalPop = gameState.popularity ? (gameState.popularity.america + gameState.popularity.latinAmerica + gameState.popularity.europe) : 0;
            const popBoost = 1 + (totalPop / 40); // Max 8.5
            
            const qualityMod = isSong ? ((release as Song).qualityModifier || 1) : 2; // Typically 1 to 4

            // Hit Factor (Deterministic per-song based on title)
            const hash = release.title ? release.title.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
            const baseHitFactor = ((hash * 13) % 1000) / 1000;
            
            // Trend Factor: Shift probabilities based on level, popularity, and quality.
            // Max shift around +0.20 for top tier players.
            let trendShift = ((artistLevel / 10) * 0.05) + ((popBoost / 8.5) * 0.10) + ((qualityMod / 4) * 0.05);
            
            // User requested Level 10 singles to be significantly easier to Hit (but not necessarily Mega Hit)
            if (isSong && artistLevel >= 10) {
               trendShift += 0.25; // Significant boost to reach the "Hit" threshold (0.85)
            }

            const intrinsicHitFactor = Math.min(0.999, baseHitFactor + trendShift);
            
            // Introduce more variance for normal songs so they don't all get the same streams
            let hitMultiplier = 0.4 + (intrinsicHitFactor * 0.8); // 0.4 to 1.2 for normal songs
            let currentTrend: 'Flop' | 'Non-Hit' | 'TikTok Trend' | 'Hit' | 'Mega Hit' = 'Non-Hit';

            // Mega Hit: strict requirement of incredibly high luck roll (~0.3% chance) and high intrinsic value
            let isMegaHit = baseHitFactor >= 0.997 && intrinsicHitFactor >= 0.95;
            let isHit = !isMegaHit && intrinsicHitFactor > 0.85;

            // TikTok Overrides
            const tkSound = updatedTikTok?.sounds.find(s => s.songId === release.id);
            if (tkSound) {
                if (tkSound.trendingStatus === 'Mega Hits') isMegaHit = true;
                else if (tkSound.trendingStatus === 'Hits') isHit = true;
            }

            if (isMegaHit) {
                hitMultiplier = Math.max(hitMultiplier, 3.5 + (intrinsicHitFactor * 2)); // Massive hit
                currentTrend = 'Mega Hit';
            } else if (isHit) {
                hitMultiplier = Math.max(hitMultiplier, 2.0 + (intrinsicHitFactor)); // Big hit
                currentTrend = 'Hit';
            } else if (tkSound?.trendingStatus === 'TikTok Trend') {
                hitMultiplier = Math.max(hitMultiplier, 1.5 + (intrinsicHitFactor * 0.5)); // Mild hit
                currentTrend = 'TikTok Trend';
            } else if (intrinsicHitFactor < 0.15) {
                hitMultiplier = 0.2 + (intrinsicHitFactor); // Flop
                currentTrend = 'Flop';
            }

            let isBSide = false;
            if (isSong && (release as Song).isBSide) {
               isBSide = true;
               
               const bSideViralChance = (hash % 100) / 100; // 0 to 0.99
               // Nerf: Only ~10% chance for a B-side to remain a Mega Hit, and ~20% for a Hit
               if (isMegaHit && bSideViralChance > 0.90) {
                   hitMultiplier = Math.max(hitMultiplier, 3.5 + (intrinsicHitFactor * 2)); 
                   currentTrend = 'Mega Hit';
               } else if (isHit && bSideViralChance > 0.80) {
                   hitMultiplier = Math.max(hitMultiplier, 2.0 + (intrinsicHitFactor)); 
                   currentTrend = 'Hit';
               } else if (tkSound?.trendingStatus === 'TikTok Trend' && bSideViralChance > 0.60) {
                   hitMultiplier = Math.max(hitMultiplier, 1.5 + (intrinsicHitFactor * 0.5));
                   currentTrend = 'TikTok Trend';
               } else if (intrinsicHitFactor < 0.15) {
                   hitMultiplier = 0.2 * 0.15;
                   currentTrend = 'Flop';
               } else {
                   hitMultiplier *= 0.15; // Normal B-side nerf
                   currentTrend = tkSound?.trendingStatus === 'TikTok Trend' ? 'TikTok Trend' : 'Non-Hit';
               }
            }

            const hitLongevity = Math.max(1, hitMultiplier);
            const longevityMultiplier = (qualityMod * 0.5) + (artistLevel * 0.15) + (hitLongevity * 0.5); // Usually 1.5 to ~5

            // Sync with TikTok sound
            if (updatedTikTok) {
                const tkSoundSync = updatedTikTok.sounds.find((s: any) => s.songId === release.id);
                if (tkSoundSync) {
                    if (currentTrend === 'Mega Hit' && tkSoundSync.trendingStatus !== 'Mega Hits') tkSoundSync.trendingStatus = 'Mega Hits';
                    else if (currentTrend === 'Hit' && !['Mega Hits', 'Hits'].includes(tkSoundSync.trendingStatus)) tkSoundSync.trendingStatus = 'Hits';
                    else if (currentTrend === 'TikTok Trend' && tkSoundSync.trendingStatus === 'Non Trend') tkSoundSync.trendingStatus = 'TikTok Trend';
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
               // Max fandomPower ~33 at level 99 and 100% popularity in all regions
               const fandomPower = 1 + (popBoost / 1.2) + (artistLevel / 4);
               // Smooth curve dropping from 1.0 to close to 0 over 3 weeks
               const debutCurve = Math.exp(-(daysSinceRelease) / 7); 
               
               let debutMultiplier = fandomPower * debutCurve;
               if (isBSide && currentTrend !== 'Mega Hit' && currentTrend !== 'Hit') {
                   // B-sides get a smaller debut push
                   debutMultiplier *= 0.5;
               }
               initialHypeCurve *= Math.max(1, debutMultiplier);
            }
            
            // 3. Catalog Tail (Slow burn)
            // Reduced to prevent old songs from being too overpowered
            const tailHalfLife = (150 + (artistLevel * 20)) * longevityMultiplier; 
            const catalogBase = isBSide && (currentTrend === 'Non-Hit' || currentTrend === 'Flop') ? 0.002 : 0.015; 
            const tailCurve = catalogBase * Math.exp(-daysSinceRelease / tailHalfLife);
            
            let decayFactor = initialHypeCurve + secondaryCurve + tailCurve;

            // --- STABILITY FLOOR (The "Legacy Effect") ---
            // Prevents massive artists from dropping to zero, giving a realistic floor
            let floorPercentage = artistLevel >= 10 ? 0.015 + (intrinsicHitFactor * 0.015) : (artistLevel * 0.0015); 
            
            // Cap the floor for non-Mega Hits to ensure Hits settle < 1M streams realistically
            if (currentTrend === 'Hit') {
               floorPercentage = Math.min(floorPercentage, 0.002); 
            } else if (currentTrend !== 'Mega Hit') {
               floorPercentage = Math.min(floorPercentage, 0.0008);
            }
            
            // Significant Nerf for B-Sides: Very low floor unless it's a hit
            if (isBSide && (currentTrend === 'Non-Hit' || currentTrend === 'Flop')) {
                floorPercentage *= 0.15; // Raised from 0.02 to avoid dropping to hundreds of streams
            }

            decayFactor = Math.max(floorPercentage, decayFactor);

            // Radio logic ... remains but with higher longevity
            const peakRadioDay = 30 + (intrinsicHitFactor * 50); // Peaks slightly later and stays longer
            const radioWidth = 45 + (hitLongevity * 15);
            
            const distance = Math.abs(daysSinceRelease - peakRadioDay);
            const radioCurve = Math.exp(-(distance * distance) / (radioWidth * radioWidth));
            
            const radioMaxHit = hitMultiplier * qualityMod * (1 + artistLevel * 0.2);
            let dailyRadio = (isBSide && (currentTrend === 'Non-Hit' || currentTrend === 'Flop'))
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
            
            let rawStreamsTotal = baseStreams * 
                Math.pow(qualityMod, 1.4) *  // max ~7
                genreMultiplier *            // max 2
                popBoost *                   // max 8.5
                levelMultiplier *            // max ~5 at level 10
                hitMultiplier *              // max 4.5
                featBoost *                  // boost from featured artist
                (1 + (prodSkill + vocalSkill + swSkill)/3) * // max 2
                (1 + radioBoost * 0.15) *     // radio adds up
                decayFactor *                
                smoothFluctuation *
                weekendBoost;

            if (!isSong) {
                // Albums themselves don't generate massive standalone "pseudo streams" because the sum of tracks usually defines it.
                // But for gameplay simplicity on the backend, we assign the album a "bundled stream value" that is roughly sum of tracks.
                // We assume an album has ~10 tracks. Lead single (1x), B-sides (9 * 0.15 = 1.35x). Total = 2.35x of a single.
                rawStreamsTotal *= 2.35;
            }

            // Apply global softcap log function based on hitMultiplier to allow massive hits to scale farther
            const softCapThreshold = 10000000 + (hitMultiplier * 4000000);
            if (rawStreamsTotal > softCapThreshold) {
                 rawStreamsTotal = softCapThreshold + Math.pow(rawStreamsTotal - softCapThreshold, 0.68 + (hitMultiplier * 0.02)); 
            }
            
            // SUPERSTAR CATALOG FLOOR:
            // Prevents old songs from dying completely, but now scales with song popularity/identity
            const globalPopForFloor = Math.max(1, (gameState.popularity?.america || 0) + (gameState.popularity?.europe || 0) + (gameState.popularity?.latinAmerica || 0));
            // Apply hitMultiplier and B-side penalty to the legacy stream floor to give songs individual identities
            const legacyIdentityMultiplier = (hitMultiplier * 0.5) * (isBSide ? 0.15 : 1.0); 
            const superstarHardFloor = isSong ? Math.floor((globalPopForFloor / 100) * artistLevel * 250 * Math.max(0.2, legacyIdentityMultiplier)) : Math.floor((globalPopForFloor / 100) * artistLevel * 750); 
            if (rawStreamsTotal < superstarHardFloor && daysSinceRelease > 14) { 
                rawStreamsTotal = Math.max(rawStreamsTotal, superstarHardFloor * (Math.random() * 0.2 + 0.9));
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
                if (tkSoundState.trendingStatus === 'Mega Hits') finalTikTokMultiplier = 2.5;
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
            
            const newDigitalSales = Math.floor(dStreamsTotal * digitalSaleRate * qualityMod * (isWeekend ? 1.2 : 0.9) * (1 + (hash%20)/100)); // slight variance
            const newPhysicalSales = Math.floor(dStreamsTotal * physicalSaleRate * qualityMod * Math.max(0.5, (gameState.popularity?.america || 10)/50) * (1 + (hash%30)/100));
            
            const totalNewSales = newDigitalSales + newPhysicalSales;
            dailySales += totalNewSales;
            const salesRev = (newDigitalSales * 0.99 + newPhysicalSales * (isSong ? 4.99 : 14.99)) * 0.25; // 25% artist cut
            const streamingRev = dStreamsTotal * 0.00007; // Extra hard payout: $0.00007 per stream (100k streams = $7)
            
            revenue += salesRev;
            dailySalesRev += salesRev;
            
            let currentReleaseRev = salesRev;

            if (isSong) {
                revenue += streamingRev;
                dailyStreamingRev += streamingRev;
                currentReleaseRev += streamingRev;
            }
            
            dailySongRev[release.id] = currentReleaseRev;

            // Occasional viral spike (1% chance per day)
            // (Moved to top before dStreamsTotal calculation)
            if (isSong) {
                dailyStreams += dStreamsTotal;
            }

            if (release.type === 'Single' && dStreamsTotal > maxSongStreams) {
                maxSongStreams = dStreamsTotal;
                topSong = release.title;
            } else if (['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(release.type) && dStreamsTotal > maxAlbumStreams) {
                maxAlbumStreams = dStreamsTotal;
                topAlbum = release.title;
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

      revenue += merchRevenue + gigPayouts + tourTicketRevenue;

      let updatedReleasesWithSales = updatedReleases.map(r => {
         const d = totalDigitalSalesToAdd[r.id] || 0;
         const p = totalPhysicalSalesToAdd[r.id] || 0;
         if (d > 0 || p > 0 || !r.sales) {
             const exist = r.sales || { physical: 0, digital: 0, total: 0 };
             return {
                 ...r,
                 sales: {
                     physical: exist.physical + p,
                     digital: exist.digital + d,
                     total: exist.total + p + d
                 }
             };
         }
         return r;
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
            views: (video.views || 0) + ytDaily
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
              // Save player nominations to history before resetting
              const playerNominationsThisYear: any[] = [];
              currentGrammys.results.forEach(cat => {
                 const playerNom = cat.nominees.find(n => n.isPlayer);
                 if (playerNom) {
                    playerNominationsThisYear.push({
                       category: cat.category,
                       nominee: playerNom,
                       won: cat.winnerId === playerNom.id
                    });
                 }
              });

              let nextHistory = currentGrammys.history ? [...currentGrammys.history] : [];
              if (playerNominationsThisYear.length > 0) {
                 nextHistory.push({
                    year: currentGrammys.year,
                    nominations: playerNominationsThisYear
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
          const { charts } = computeCharts(intermediateGameState);
          
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

               const songs = updatedReleasesWithSales.filter(r => r.type === 'Single').map(s => {
                   const sStreams = getSpotifyStreams(s.streams);
                   const spotifyThisYear = Math.max(0, sStreams - (s.lastWrappedStreams?.spotify || 0));
                   return { ...s, spotifyThisYear };
               }).sort((a, b) => b.spotifyThisYear - a.spotifyThisYear).slice(0, 5);
               const topSongs = songs.map(s => ({ title: s.title, streams: s.spotifyThisYear, image: s.coverImage }));
                  
               const albums = updatedReleasesWithSales.filter(r => ['Album', 'EP', 'Single Pack', 'Deluxe Album'].includes(r.type)).map(a => {
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
        let finalMoney = prev.stats.money + revenue;

        // NPC Collab Offer Logic
        const pendingCollabsCount = newEmails.filter(e => e.collabOffer && e.collabOffer.status === 'pending').length;
        if (pendingCollabsCount < 3 && (prev.artist?.level || 0) >= 3 && Math.random() < 0.05) {
            const npc = NPC_ARTISTS[Math.floor(Math.random() * NPC_ARTISTS.length)];
            
            let songName = `${['Heart', 'Night', 'Fire', 'Lost', 'Found', 'Dream', 'Broken', 'Wild', 'Midnight', 'Summer', 'Echo', 'Love', 'Tears', 'Shadow'][Math.floor(Math.random() * 14)]} ${['Awake', 'City', 'Walker', 'Lover', 'Soul', 'Sky', 'River', 'Road', 'Vibes', 'Lights', 'Hearts', 'Spirits'][Math.floor(Math.random() * 12)]}`;
            let coverArt = (npc as any).coverImage || `https://i.pravatar.cc/200?u=${encodeURIComponent(npc.name)}`;
            
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
                    if (r > topSongRev) {
                        topSongRev = r;
                        topSongId = id;
                    }
                });
                const topSongTitle = topSongId ? (prev.releases.find(r => r.id === topSongId)?.title || 'Unknown') : 'N/A';

                const bodyTxt = `Monthly Revenue Report - ${prevDateObj.toLocaleString('en-US', {month: 'long', year: 'numeric'})}

Total Monthly Revenue: $${Math.floor(totalMonthlyVar).toLocaleString()}

Platform Breakdown:
• Spotify: $${spotifyRev.toLocaleString()}
• Apple Music: $${appleRev.toLocaleString()}
• YouTube Music: $${ytRev.toLocaleString()}
• Digital & Physical Sales: $${Math.floor(newMonthSalesRev).toLocaleString()}
• Merchandise: $${Math.floor(newMonthMerchRev).toLocaleString()}
• Tours & Live Gigs: $${Math.floor(newMonthTourRev).toLocaleString()}

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

        return {
          ...prev,
          artist: prev.artist ? { 
            ...prev.artist, 
            level: currentLvl,
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
          emails: newEmails
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

      setIsLoadingNextDay(false);
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
    
    setGameState({
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
      time: {
        startDate: INITIAL_DATE,
        daysPassed: 0
      },
      releases: [],
      merch: [],
      gigs: [],
      grammys: {
        year: new Date(INITIAL_DATE).getFullYear() + 1,
        stage: 'Closed',
        submissions: [],
        results: [],
        history: []
      }
    });
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
                                  setGameState(JSON.parse(saved));
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
        <div className="flex items-center justify-between md:justify-start gap-4 md:gap-6">
          {/* Burger Menu (Mobile only toggles sidebar in standard view, but let's keep it functional or visual) */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg transition-all md:hidden"
          >
             <span className="text-3xl font-light leading-none">=</span>
          </button>
          <div className="hidden md:flex w-12 h-12 items-center justify-center bg-white/5 border border-white/20 rounded-lg cursor-default">
            <span className="text-3xl font-light leading-none text-white/40">=</span>
          </div>
          <h1 className="text-lg md:text-xl font-bold tracking-tighter italic text-purple-400">MUSICIAN SIMULATOR</h1>
        </div>

        <div className="flex gap-4 md:gap-8 items-center overflow-x-auto pb-2 md:pb-0">
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[10px] uppercase tracking-widest text-white/40">Current Balance</span>
            <span className="text-xl md:text-2xl font-mono text-green-400">${gameState?.stats.money.toLocaleString()}</span>
          </div>
          <div className="w-[1px] h-8 bg-white/10 shrink-0"></div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[10px] uppercase tracking-widest text-white/40">Artist Age</span>
            <span className="text-xl md:text-2xl font-mono">{currentAgeYears} <span className="text-sm text-white/60">yrs</span></span>
          </div>
          <div className="w-[1px] h-8 bg-white/10 shrink-0"></div>
          <div className="flex flex-col items-end shrink-0">
             <span className="text-[10px] uppercase tracking-widest text-white/40">Total Streams</span>
             <span className="text-xl md:text-2xl font-mono text-blue-400">{gameState?.stats.streams.toLocaleString()}</span>
          </div>
          <div className="w-[1px] h-8 bg-white/10 shrink-0"></div>
          <div className="flex flex-col items-end shrink-0">
             <span className="text-[10px] uppercase tracking-widest text-white/40">Awards</span>
             <span className="text-xl md:text-2xl font-mono text-yellow-500">{gameState?.stats.awards}</span>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <main className="relative z-10 flex-1 flex flex-col md:grid md:grid-cols-12 gap-6 p-4 md:p-8 overflow-y-auto">
        
        {/* Sidebar / Side Menu Area */}
        <div className={`col-span-3 flex-col gap-4 ${sidebarOpen ? 'flex' : 'hidden md:flex'}`}>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-6">Active View</h3>
            <nav className="flex flex-col gap-2">
              <button 
                onClick={() => { setScreen('dashboard'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'dashboard' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Activity className="w-4 h-4" />
                Dashboard
              </button>
              <button 
                onClick={() => { setScreen('studio'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'studio' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Mic className="w-4 h-4" />
                Create Project
              </button>
              <button 
                onClick={() => { setScreen('discography'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'discography' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Disc className="w-4 h-4" />
                Discography
              </button>
              <button 
                onClick={() => { setScreen('merch'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'merch' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <ShoppingBag className="w-4 h-4" />
                Merch Store
              </button>
              <button 
                onClick={() => { setScreen('skills'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'skills' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Zap className="w-4 h-4" />
                Skill Tree
              </button>
              <button 
                onClick={() => { setScreen('regions'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'regions' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Globe className="w-4 h-4" />
                Region Popularity
              </button>
              <button 
                onClick={() => { setScreen('gigs'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'gigs' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Ticket className="w-4 h-4" />
                Book Gigs
              </button>
              <button 
                onClick={() => { setScreen('tour'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'tour' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <MapPin className="w-4 h-4" />
                Tour Settings
              </button>
              <button 
                onClick={() => { setScreen('platforms'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'platforms' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Activity className="w-4 h-4" />
                Platforms
              </button>
              <button 
                onClick={() => { setScreen('charts'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'charts' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <BarChart3 className="w-4 h-4" />
                Charts
              </button>
              <button 
                onClick={() => { setScreen('grammys'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'grammys' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Trophy className="w-4 h-4" />
                Grammys
              </button>
              <button 
                onClick={() => { setScreen('plaques'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'plaques' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Award className="w-4 h-4" />
                Plaques
              </button>
              <button 
                onClick={() => { setScreen('google'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'google' ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Search className="w-4 h-4" />
                Web Search
              </button>
              <button 
                onClick={() => { setScreen('youtube'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'youtube' ? 'bg-red-600/20 text-red-200 border border-red-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Play className="w-4 h-4" />
                YouTube
              </button>
              <button 
                onClick={() => { setScreen('x'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'x' ? 'bg-blue-600/20 text-blue-200 border border-blue-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg>
                X (Social)
              </button>
              <button 
                onClick={() => { 
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
                   setSidebarOpen(false); 
                }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'tiktok' ? 'bg-pink-600/20 text-pink-200 border border-pink-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19.589 6.686a4.793 4.793 0 01-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 01-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 013.183-4.51v-3.5a6.329 6.329 0 00-5.394 10.692 6.33 6.33 0 0010.857-4.424V8.687a8.182 8.182 0 004.773 1.526V6.79a4.831 4.831 0 01-1.003-.104z"></path></svg>
                TikTok
              </button>
              
              <div className="h-px bg-white/10 my-2" />
              
              <button 
                onClick={() => { setScreen('saves'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'saves' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Save className="w-4 h-4" />
                Save / Load Game
              </button>
              
              <button 
                onClick={() => { setScreen('settings'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'settings' ? 'bg-gray-600/20 text-gray-200 border border-gray-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <SettingsIcon className="w-4 h-4" />
                Settings & Redeem
              </button>
              
              <div className="flex gap-2 mt-2">
                 <a href="https://discord.gg/zNQ9d9J4e" target="_blank" rel="noopener noreferrer" className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-[#5865F2] border border-white/5 flex items-center justify-center py-3 rounded-xl transition-colors">
                     <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                 </a>
                 <a href="https://x.com/RapperRise1" target="_blank" rel="noopener noreferrer" className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5 flex items-center justify-center py-3 rounded-xl transition-colors">
                     <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg>
                 </a>
              </div>
            </nav>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-2xl p-6 mt-auto">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Save Management</h3>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                   if (gameState && currentSaveId) {
                      saveGameData(currentSaveId, gameState, false);
                   }
                   setScreen('home');
                }} 
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-3 rounded-xl text-xs uppercase tracking-tighter transition-colors text-center"
              >
                Save & Quit To Menu
              </button>
            </div>
          </div>
        </div>

        {/* Central Interface */}
        {screen !== 'x' && screen !== 'google' && screen !== 'youtube' && screen !== 'wrapped' && (
          <div className="col-span-9 flex flex-col h-full bg-black/20 border border-white/5 rounded-3xl overflow-hidden relative min-h-[400px]">
             {screen === 'dashboard' && <DashboardView gameState={gameState} setGameState={setGameState} dateDayStr={dateDayStr} dayName={dayName} monthYearStr={monthYearStr} handleNextDay={handleNextDay} isLoadingNextDay={isLoadingNextDay} currentAgeYears={currentAgeYears} isAutoAdvancing={isAutoAdvancing} setIsAutoAdvancing={setIsAutoAdvancing} onOpenWrapped={() => setScreen('wrapped')} />}
             {screen === 'studio' && <StudioView gameState={gameState!} setGameState={setGameState} currentDate={currentDate} />}
             {screen === 'discography' && <DiscographyView gameState={gameState!} setGameState={setGameState} currentDate={currentDate} />}
             {screen === 'merch' && <MerchStoreView gameState={gameState!} setGameState={setGameState} />}
             {screen === 'skills' && <SkillsView gameState={gameState!} setGameState={setGameState} />}
             {screen === 'regions' && <RegionPopularityView gameState={gameState!} />}
             {screen === 'gigs' && <GigsView gameState={gameState!} setGameState={setGameState} currentDate={currentDate} />}
             {screen === 'tour' && <TourView gameState={gameState!} setGameState={setGameState} currentDate={currentDate} />}
             {screen === 'platforms' && <PlatformsView gameState={gameState!} setGameState={setGameState as any} />}
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
                   <span className="text-2xl font-mono text-blue-400">+{dailyReport.dailyStreams.toLocaleString()}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                   <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Daily Sales</span>
                   <span className="text-2xl font-mono text-purple-400">+{dailyReport.dailySales.toLocaleString()}</span>
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

