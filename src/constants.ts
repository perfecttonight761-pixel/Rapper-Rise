export interface LevelRequirement {
  gigs: number;
  performance: number;
  vocals: number;
  songwriting: number;
  production: number;
  streams: number;
  sales: number;
}

export const LEVEL_REQUIREMENTS: Record<number, LevelRequirement> = {
  1: { gigs: 10, performance: 0, vocals: 0, songwriting: 0, production: 0, streams: 0, sales: 0 },
  2: { gigs: 25, performance: 10, vocals: 5, songwriting: 5, production: 10, streams: 0, sales: 0 },
  3: { gigs: 40, performance: 20, vocals: 15, songwriting: 15, production: 20, streams: 0, sales: 0 },
  4: { gigs: 60, performance: 35, vocals: 25, songwriting: 25, production: 35, streams: 0, sales: 0 },
  5: { gigs: 80, performance: 50, vocals: 40, songwriting: 40, production: 50, streams: 0, sales: 0 },
  6: { gigs: 100, performance: 60, vocals: 50, songwriting: 50, production: 60, streams: 1000000, sales: 10000 },
  7: { gigs: 120, performance: 75, vocals: 65, songwriting: 65, production: 75, streams: 5000000, sales: 50000 },
  8: { gigs: 150, performance: 85, vocals: 80, songwriting: 80, production: 85, streams: 25000000, sales: 250000 },
  9: { gigs: 200, performance: 95, vocals: 90, songwriting: 90, production: 95, streams: 100000000, sales: 1000000 },
  10: { gigs: 250, performance: 100, vocals: 100, songwriting: 100, production: 100, streams: 500000000, sales: 5000000 }
};

import { ARTIST_DISCOGRAPHY } from './artistDiscography';

export const NPC_ARTISTS = [
  { name: 'Taylor Swift', basePoints: 450000, type: 'Pop' },
  { name: 'Ariana Grande', basePoints: 420000, type: 'Pop' },
  { name: 'Billie Eilish', basePoints: 390000, type: 'Pop' },
  { name: 'Olivia Rodrigo', basePoints: 370000, type: 'Pop' },
  { name: 'The Weeknd', basePoints: 440000, type: 'R&B' },
  { name: 'Drake', basePoints: 430000, type: 'Rap' },
  { name: 'Ed Sheeran', basePoints: 350000, type: 'Pop' },
  { name: 'Bruno Mars', basePoints: 360000, type: 'Pop' },
  { name: 'Justin Bieber', basePoints: 340000, type: 'Pop' },
  { name: 'Dua Lipa', basePoints: 330000, type: 'Pop' },
  { name: 'Lady Gaga', basePoints: 310000, type: 'Pop' },
  { name: 'Beyoncé', basePoints: 380000, type: 'R&B' },
  { name: 'Rihanna', basePoints: 390000, type: 'R&B' },
  { name: 'Katy Perry', basePoints: 260000, type: 'Pop' },
  { name: 'Selena Gomez', basePoints: 280000, type: 'Pop' },
  { name: 'Shawn Mendes', basePoints: 250000, type: 'Pop' },
  { name: 'Post Malone', basePoints: 340000, type: 'Rap' },
  { name: 'Doja Cat', basePoints: 310000, type: 'Rap' },
  { name: 'SZA', basePoints: 340000, type: 'R&B' },
  { name: 'Lana Del Rey', basePoints: 320000, type: 'Pop' },
  { name: 'Adele', basePoints: 360000, type: 'Pop' },
  { name: 'Sam Smith', basePoints: 250000, type: 'Pop' },
  { name: 'Harry Styles', basePoints: 350000, type: 'Pop' },
  { name: 'Zayn Malik', basePoints: 190000, type: 'Pop' },
  { name: 'Niall Horan', basePoints: 180000, type: 'Pop' },
  { name: 'Louis Tomlinson', basePoints: 170000, type: 'Pop' },
  { name: 'Liam Payne', basePoints: 160000, type: 'Pop' },
  { name: 'Charlie Puth', basePoints: 220000, type: 'Pop' },
  { name: 'Camila Cabello', basePoints: 210000, type: 'Pop' },
  { name: 'Halsey', basePoints: 230000, type: 'Pop' },
  { name: 'Imagine Dragons', basePoints: 270000, type: 'Rock' },
  { name: 'Coldplay', basePoints: 300000, type: 'Rock' },
  { name: 'Maroon 5', basePoints: 260000, type: 'Rock' },
  { name: 'Linkin Park', basePoints: 280000, type: 'Rock' },
  { name: 'OneRepublic', basePoints: 220000, type: 'Rock' },
  { name: 'One Direction', basePoints: 180000, type: 'Pop' },
  { name: 'BLACKPINK', basePoints: 350000, type: 'Kpop' },
  { name: 'BTS', basePoints: 400000, type: 'Kpop' },
  { name: 'TWICE', basePoints: 250000, type: 'Kpop' },
  { name: 'NewJeans', basePoints: 300000, type: 'Kpop' },
  { name: 'Stray Kids', basePoints: 270000, type: 'Kpop' },
  { name: 'SEVENTEEN', basePoints: 260000, type: 'Kpop' },
  { name: 'EXO', basePoints: 240000, type: 'Kpop' },
  { name: 'IU', basePoints: 310000, type: 'Kpop' },
  { name: 'Jennie', basePoints: 260000, type: 'Kpop' },
  { name: 'Lisa', basePoints: 260000, type: 'Kpop' },
  { name: 'Jungkook', basePoints: 320000, type: 'Kpop' },
  { name: 'Jimin', basePoints: 300000, type: 'Kpop' },
  { name: 'V', basePoints: 280000, type: 'Kpop' },
  { name: 'RM', basePoints: 250000, type: 'Kpop' },
  { name: 'Michael Jackson', basePoints: 500000, type: 'Pop' },
  { name: 'Elvis Presley', basePoints: 450000, type: 'Pop' },
  { name: 'Freddie Mercury', basePoints: 350000, type: 'Rock' },
  { name: 'Whitney Houston', basePoints: 380000, type: 'R&B' },
  { name: 'Madonna', basePoints: 360000, type: 'Pop' },
  { name: 'Prince', basePoints: 330000, type: 'Pop' },
  { name: 'David Bowie', basePoints: 300000, type: 'Rock' },
  { name: 'Celine Dion', basePoints: 320000, type: 'Pop' },
  { name: 'Mariah Carey', basePoints: 340000, type: 'Pop' },
  { name: 'Stevie Wonder', basePoints: 310000, type: 'R&B' },
  { name: 'Eminem', basePoints: 420000, type: 'Rap' },
  { name: 'Kendrick Lamar', basePoints: 410000, type: 'Rap' },
  { name: 'Travis Scott', basePoints: 370000, type: 'Rap' },
  { name: 'Future', basePoints: 330000, type: 'Rap' },
  { name: '21 Savage', basePoints: 300000, type: 'Rap' },
  { name: 'Nicki Minaj', basePoints: 350000, type: 'Rap' },
  { name: 'Cardi B', basePoints: 310000, type: 'Rap' },
  { name: 'Lil Nas X', basePoints: 260000, type: 'Rap' },
  { name: 'Tyler, the Creator', basePoints: 300000, type: 'Rap' },
  { name: 'J. Cole', basePoints: 310000, type: 'Rap' },
  { name: 'Shakira', basePoints: 380000, type: 'Latin' },
  { name: 'Bad Bunny', basePoints: 420000, type: 'Latin' },
  { name: 'Karol G', basePoints: 360000, type: 'Latin' },
  { name: 'Rosalía', basePoints: 310000, type: 'Latin' },
  { name: 'Enrique Iglesias', basePoints: 260000, type: 'Latin' },
  { name: 'Daddy Yankee', basePoints: 300000, type: 'Latin' },
  { name: 'Maluma', basePoints: 280000, type: 'Latin' },
  { name: 'Anitta', basePoints: 250000, type: 'Latin' },
  { name: 'Luis Fonsi', basePoints: 220000, type: 'Latin' },
  { name: 'J Balvin', basePoints: 320000, type: 'Latin' },
  { name: 'Tulus', basePoints: 250000, type: 'Pop' },
  { name: 'Raisa', basePoints: 220000, type: 'Pop' },
  { name: 'Isyana Sarasvati', basePoints: 200000, type: 'Pop' },
  { name: 'Afgan', basePoints: 190000, type: 'Pop' },
  { name: 'Judika', basePoints: 210000, type: 'Pop' },
  { name: 'Noah', basePoints: 260000, type: 'Rock' },
  { name: 'Dewa 19', basePoints: 280000, type: 'Rock' },
  { name: 'Pamungkas', basePoints: 180000, type: 'Pop' },
  { name: 'Mahalini', basePoints: 230000, type: 'Pop' },
  { name: 'Nadin Amizah', basePoints: 210000, type: 'Pop' },
  { name: 'Aurora', basePoints: 150000, type: 'Pop' },
  { name: 'Conan Gray', basePoints: 210000, type: 'Pop' },
  { name: 'Gracie Abrams', basePoints: 190000, type: 'Pop' },
  { name: 'Joji', basePoints: 240000, type: 'R&B' },
  { name: 'Lorde', basePoints: 260000, type: 'Pop' },
  { name: 'Troye Sivan', basePoints: 200000, type: 'Pop' },
  { name: 'Mitski', basePoints: 220000, type: 'Pop' },
  { name: 'Frank Ocean', basePoints: 300000, type: 'R&B' },
  { name: 'Sabrina Carpenter', basePoints: 340000, type: 'Pop' },
  { name: 'Chappell Roan', basePoints: 320000, type: 'Pop' },
  { name: 'PinkPantheress', basePoints: 240000, type: 'Pop' },
  { name: 'Zara Larsson', basePoints: 210000, type: 'Pop' },
  { name: 'Tate McRae', basePoints: 310000, type: 'Pop' },
  { name: 'ILLIT', basePoints: 280000, type: 'Kpop' },
  { name: 'KATSEYE', basePoints: 250000, type: 'Pop' }
];

export const NPC_SONG_TITLES = [
  "Midnight Rain", "Sunset Blvd", "Electric Love", "Heartbreak", "Lost in the City", 
  "Neon Lights", "Summer Breeze", "Dancing Alone", "Echoes", "Fading Away", 
  "Starry Night", "Ocean Waves", "Fire & Ice", "Golden Hour", "Silver Lining", 
  "Broken Glass", "Silent Whispers", "Wildfire", "Tidal Wave", "Desert Rose", 
  "Crystal Clear", "Velvet Sky", "Crimson Tide", "Shadows", "Mirage", "Oasis", 
  "Labyrinth", "Euphoria", "Nostalgia", "Serendipity", "Temptation", "Reckless", 
  "Wanderlust", "Reverie", "Enigma", "Paradox", "Infinity", "Eternity", "Baby", 
  "Toxic", "Bad Guy", "Lover", "Stay", "Heat Waves", "Blinding Lights", "Sugar"
];

export const NPC_ALBUM_TITLES = [
  "The Album", "Deluxe Edition", "Vol. 1", "Greatest Hits", "Unplugged", 
  "Live at Wembley", "Remixed", "Stripped", "The Collection", "B-Sides", 
  "The EP", "Lost Tapes", "Acoustic Sessions", "Summer Sampler", "Winter Stories"
];

const ADJECTIVES = [
  "Midnight", "Electric", "Neon", "Summer", "Silent", "Starry", "Golden", 
  "Silver", "Broken", "Wild", "Crystal", "Velvet", "Crimson", "Dark", 
  "Sweet", "Bitter", "Beautiful", "Endless", "Fading", "Lost", "Lonely"
];

const NOUNS = [
  "Rain", "Love", "City", "Breeze", "Echoes", "Night", "Waves", "Hour", 
  "Lining", "Glass", "Whispers", "Fire", "Tide", "Rose", "Sky", "Shadows", 
  "Mirage", "Oasis", "Heart", "Dream", "Memories"
];

const getNPCTitle = (seed: number, isAlbum: boolean) => {
  if (isAlbum) {
    const arr = NPC_ALBUM_TITLES;
    return arr[seed % arr.length];
  }
  const adj = ADJECTIVES[seed % ADJECTIVES.length];
  const noun = NOUNS[Math.floor(seed / ADJECTIVES.length) % NOUNS.length];
  // Occasional single word
  if (seed % 5 === 0) return noun;
  return `${adj} ${noun}`;
};

export const generateNPCSongs = (multiplier: number = 1, seed: number = 1, excludeName: string = '') => {
  const songs: any[] = [];
  NPC_ARTISTS.forEach((npc, i) => {
    if (npc.name.toLowerCase() === excludeName.toLowerCase()) return;
    const songsToRelease = Math.min(15, 3 + Math.floor(seed / 12));
    const disco = ARTIST_DISCOGRAPHY || {};
    
    for (let j = 0; j < songsToRelease; j++) {
      // Add a long-term cycle so songs don't stay at the top forever (e.g. 5-15 weeks cycle)
      const cycleLength = 8 + (j % 10);
      const phase = (seed + i * 5 + j * 11) / cycleLength;
      // cycleMod goes from 0.1 to 1.0 depending on the week
      const cycleMod = 0.15 + 0.85 * ((Math.sin(phase) + 1) / 2);

      const basePseudo = Math.floor(Math.abs(Math.sin((i + 1) * (j + 1))) * 50000);
      const weeklyFluctuation = Math.floor(Math.abs(Math.cos(seed * (i + j + 1))) * 15000);
      
      const titleSeed = Math.floor(Math.abs(Math.cos(i * 10 + j) * 1000));
      const fallbackTitle = getNPCTitle(titleSeed, false);
      const trackDisco = disco[npc.name]?.tracks?.[j];
      const title = trackDisco?.title || fallbackTitle;
      const coverImage = trackDisco?.cover || null;
      
      songs.push({
        id: `${npc.name}-${j}-song`,
        title: `${title}`,
        artist: npc.name,
        artistGenre: npc.type,
        coverImage,
        points: Math.floor((npc.basePoints * 1.25 * (1 - j * 0.15) * cycleMod + basePseudo * cycleMod + weeklyFluctuation) * multiplier),
        type: 'Single' as const,
        isPlayer: false
      });
    }
  });
  return songs;
};

export const generateNPCAlbums = (multiplier: number = 1, seed: number = 1, excludeName: string = '') => {
  const albums: any[] = [];
  NPC_ARTISTS.forEach((npc, i) => {
    if (npc.name.toLowerCase() === excludeName.toLowerCase()) return;
    const albumsToRelease = Math.min(5, 2 + Math.floor(seed / 24));
    const disco = ARTIST_DISCOGRAPHY || {};

    for (let j = 0; j < albumsToRelease; j++) {
      const cycleLength = 10 + (j % 8);
      const phase = (seed + i * 4 + j * 13) / cycleLength;
      const cycleMod = 0.2 + 0.8 * ((Math.sin(phase) + 1) / 2);

      const basePseudo = Math.floor(Math.abs(Math.cos((i + 1) * (j + 1))) * 30000);
      const weeklyFluctuation = Math.floor(Math.abs(Math.sin(seed * (i + j + 1))) * 10000);
      
      const titleSeed = Math.floor(Math.abs(Math.sin(i * 10 + j) * 1000));
      const fallbackTitle = getNPCTitle(titleSeed, true);
      const albumDisco = disco[npc.name]?.albums?.[j];
      const title = albumDisco?.title || fallbackTitle;
      const coverImage = albumDisco?.cover || null;

      albums.push({
        id: `${npc.name}-${j}-album`,
        title: `${title}`,
        artist: npc.name,
        artistGenre: npc.type,
        coverImage,
        points: Math.floor((npc.basePoints * 0.8 * (1 - j * 0.2) * cycleMod + basePseudo * cycleMod + weeklyFluctuation) * multiplier),
        type: 'Album' as const,
        isPlayer: false
      });
    }
  });
  return albums;
};
