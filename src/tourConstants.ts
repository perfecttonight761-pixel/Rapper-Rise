import { Venue } from './types';

export const AREA_VENUES: Venue[] = [
  // Cafes / Clubs
  {
    id: 'venue_america_cafe_1',
    name: 'Bluebird Cafe (Nashville)',
    type: 'Cafe',
    region: 'America',
    weeklyCost: 2000,
    levels: 1,
    baseCapacityPerLevel: [150],
    image: 'https://images.unsplash.com/photo-1559336197-bed8fdd8d431?w=800&q=80'
  },
  {
    id: 'venue_europe_cafe_1',
    name: 'The Cavern Club (Liverpool)',
    type: 'Cafe',
    region: 'Europe',
    weeklyCost: 3500,
    levels: 1,
    baseCapacityPerLevel: [300],
    image: 'https://images.unsplash.com/photo-1588667512781-671239cd66fc?w=800&q=80'
  },
  {
    id: 'venue_latin_cafe_1',
    name: 'Cafe La Habana (Mexico City)',
    type: 'Cafe',
    region: 'Latin America',
    weeklyCost: 1500,
    levels: 1,
    baseCapacityPerLevel: [200],
    image: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=800&q=80'
  },

  // Arenas
  {
    id: 'venue_america_arena_1',
    name: 'Madison Square Garden (NYC)',
    type: 'Arena',
    region: 'America',
    weeklyCost: 450000,
    levels: 3,
    baseCapacityPerLevel: [3000, 7000, 9500], // 19,500 total
    image: 'https://images.unsplash.com/photo-1540821924489-73fb46e12e2c?w=800&q=80'
  },
  {
    id: 'venue_america_arena_2',
    name: 'Crypto.com Arena (LA)',
    type: 'Arena',
    region: 'America',
    weeklyCost: 400000,
    levels: 3,
    baseCapacityPerLevel: [2500, 6500, 11000], // 20,000 total
    image: 'https://images.unsplash.com/photo-1621255569420-53bc354ab5ff?w=800&q=80'
  },
  {
    id: 'venue_europe_arena_1',
    name: 'The O2 Arena (London)',
    type: 'Arena',
    region: 'Europe',
    weeklyCost: 500000,
    levels: 3,
    baseCapacityPerLevel: [4000, 8000, 8000], // 20,000 total
    image: 'https://images.unsplash.com/photo-1621748888764-ee0d1ce2b9df?w=800&q=80'
  },
  {
    id: 'venue_latin_arena_1',
    name: 'Arena Ciudad de México (Mexico City)',
    type: 'Arena',
    region: 'Latin America',
    weeklyCost: 250000,
    levels: 3,
    baseCapacityPerLevel: [3500, 8500, 10300], // 22,300 total
    image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80'
  },

  // Stadiums
  {
    id: 'venue_america_stadium_1',
    name: 'SoFi Stadium (LA)',
    type: 'Stadium',
    region: 'America',
    weeklyCost: 2739272,
    levels: 5,
    baseCapacityPerLevel: [10000, 12000, 18000, 15000, 15240], // 70,240 total
    image: 'https://images.unsplash.com/photo-1521251325852-c28dd6fb1bfa?w=800&q=80'
  },
  {
    id: 'venue_america_stadium_2',
    name: 'MetLife Stadium (NJ)',
    type: 'Stadium',
    region: 'America',
    weeklyCost: 3100000,
    levels: 5,
    baseCapacityPerLevel: [12000, 16000, 20000, 17000, 17500], // 82,500 total
    image: 'https://images.unsplash.com/photo-1616853683833-288d6c703eb8?w=800&q=80'
  },
  {
    id: 'venue_europe_stadium_1',
    name: 'Wembley Stadium (London)',
    type: 'Stadium',
    region: 'Europe',
    weeklyCost: 3300000,
    levels: 5,
    baseCapacityPerLevel: [15000, 18000, 22000, 15000, 20000], // 90,000 total
    image: 'https://images.unsplash.com/photo-1517462310114-1e0f0dfd1010?w=800&q=80'
  },
  {
    id: 'venue_latin_stadium_1',
    name: 'Maracanã Stadium (Rio)',
    type: 'Stadium',
    region: 'Latin America',
    weeklyCost: 1800000,
    levels: 5,
    baseCapacityPerLevel: [10000, 15000, 20000, 16000, 17838], // 78,838 total
    image: 'https://images.unsplash.com/photo-1555029304-432a938c5f59?w=800&q=80'
  },
  {
    id: 'venue_america_stadium_3',
    name: 'AT&T Stadium (TX)',
    type: 'Stadium',
    region: 'America',
    weeklyCost: 2900000,
    levels: 5,
    baseCapacityPerLevel: [15000, 15000, 20000, 15000, 15000], // 80,000 total
    image: 'https://images.unsplash.com/photo-1540821924489-73fb46e12e2c?w=800&q=80'
  },
  {
    id: 'venue_america_stadium_4',
    name: 'Allegiant Stadium (NV)',
    type: 'Stadium',
    region: 'America',
    weeklyCost: 3500000,
    levels: 5,
    baseCapacityPerLevel: [10000, 10000, 15000, 15000, 15000], // 65,000 total
    image: 'https://images.unsplash.com/photo-1555029304-432a938c5f59?w=800&q=80'
  },
  {
    id: 'venue_europe_stadium_2',
    name: 'Stade de France (Paris)',
    type: 'Stadium',
    region: 'Europe',
    weeklyCost: 3000000,
    levels: 5,
    baseCapacityPerLevel: [15000, 15000, 20000, 15000, 16338], // 81,338 total
    image: 'https://images.unsplash.com/photo-1521251325852-c28dd6fb1bfa?w=800&q=80'
  },
  {
    id: 'venue_europe_stadium_3',
    name: 'Olympiastadion (Berlin)',
    type: 'Stadium',
    region: 'Europe',
    weeklyCost: 2800000,
    levels: 5,
    baseCapacityPerLevel: [10000, 15000, 20000, 14000, 15453], // 74,453 total
    image: 'https://images.unsplash.com/photo-1616853683833-288d6c703eb8?w=800&q=80'
  },
  {
    id: 'venue_europe_stadium_4',
    name: 'Camp Nou (Barcelona)',
    type: 'Stadium',
    region: 'Europe',
    weeklyCost: 3500000,
    levels: 5,
    baseCapacityPerLevel: [18000, 20000, 25000, 20000, 16354], // 99,354 total
    image: 'https://images.unsplash.com/photo-1517462310114-1e0f0dfd1010?w=800&q=80'
  },
  {
    id: 'venue_latin_stadium_2',
    name: 'Estadio Azteca (Mexico City)',
    type: 'Stadium',
    region: 'Latin America',
    weeklyCost: 2000000,
    levels: 5,
    baseCapacityPerLevel: [15000, 18000, 25000, 15000, 14539], // 87,539 total
    image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80'
  },
  {
    id: 'venue_latin_stadium_3',
    name: 'Estadio Monumental (Buenos Aires)',
    type: 'Stadium',
    region: 'Latin America',
    weeklyCost: 2200000,
    levels: 5,
    baseCapacityPerLevel: [15000, 18000, 20000, 15000, 15000], // 83,000 total
    image: 'https://images.unsplash.com/photo-1621255569420-53bc354ab5ff?w=800&q=80'
  },
  {
    id: 'venue_latin_stadium_4',
    name: 'Estadio Nacional (Santiago)',
    type: 'Stadium',
    region: 'Latin America',
    weeklyCost: 1500000,
    levels: 5,
    baseCapacityPerLevel: [8000, 10000, 12000, 10000, 8665], // 48,665 total
    image: 'https://images.unsplash.com/photo-1621748888764-ee0d1ce2b9df?w=800&q=80'
  }
];
