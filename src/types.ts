export type GameScreen = 'loading' | 'home' | 'saves' | 'create' | 'dashboard' | 'studio' | 'discography' | 'skills' | 'regions' | 'gigs' | 'platforms' | 'charts' | 'x' | 'google' | 'settings' | 'youtube' | 'plaques' | 'grammys' | 'merch' | 'wrapped' | 'tour' | 'tiktok' | 'labels';

export type AwardCategory = 'Artist of the Year' | 'Song of the Year' | 'Album of the Year' | 'Record of the Year' | 'Best Pop Solo Performance' | 'Best Pop Duo/Group Performance' | 'Best Pop Album' | 'Best K-Pop Performance' | 'Best Rap Song' | 'Best Rap Album' | 'Best Country Song' | 'Best Country Album';

export interface GrammysNominee {
  id: string; // release ID or artist name for AOTY
  title?: string;
  artist: string;
  isPlayer: boolean;
  type: 'Single' | 'Album' | 'Artist';
  coverImage?: string | null;
  clipQuery?: string;
}

export interface GrammysCategoryResult {
  category: AwardCategory;
  nominees: GrammysNominee[];
  winnerId: string | null; // ID of the winning release or artist name
}

export interface GrammysHistoricalNomination {
  category: AwardCategory;
  nominee: GrammysNominee;
  won: boolean;
  isHiddenFromPlayerHistory?: boolean;
}

export interface GrammysYearHistory {
  year: number;
  nominations: GrammysHistoricalNomination[];
}

export interface GrammySubmission {
  category: AwardCategory;
  workId: string;
  clipQuery?: string;
}

export interface GrammysState {
  year: number;
  stage: 'Closed' | 'Submission' | 'Nominations' | 'Ceremony' | 'Results';
  submittedReleaseIds?: string[];
  submissions: GrammySubmission[];
  results: GrammysCategoryResult[];
  history?: GrammysYearHistory[];
}

export type StartCapital = 'Broke ($0)' | 'Low ($1,000)' | 'Medium ($10,000)' | 'High ($100,000)';

export type ReleaseType = 'Single' | 'Single Pack' | 'EP' | 'Album' | 'Deluxe Album';
export type ReleaseStatus = 'Vaulted' | 'Published' | 'Scheduled';
export type Genre = 'Pop' | 'Kpop' | 'Rap' | 'Country';
export type Region = 'America' | 'Latin America' | 'Europe';

export interface Video {
  id: string;
  songId: string;
  title: string;
  type: 'MusicVideo';
  publishDate: string; // ISO string of game date
  views: number;
  lastDailyViews?: number;
  budget: number;
  thumbnail?: string;
}

export interface BaseRelease {
  id: string;
  title: string;
  coverImage: string; collaborator?: string; isNPCCollab?: boolean;
  artistId?: string; // If undefined, belongs to player
  isNPCRelease?: boolean;
  type: ReleaseType;
  status: ReleaseStatus;
  releaseDate: string | null; // ISO string of game date, null if vaulted
  debutStreams?: number;
  totalPreSaves?: number;
  lastDailyStreams?: {
    spotify: number;
    appleMusic?: number;
    amazonMusic?: number;
    youtubeMusic?: number;
    total: number;
  };
  currentWeekStreams?: number;
  lastWeekStreams?: number;
  currentWeekSales?: number;
  lastWeekSales?: number;
  currentWeekRadio?: number;
  lastWeekRadio?: number;
  trend?: 'Flop' | 'Non-Hit' | 'Non-Hit Medium' | 'Non-Hit Big' | 'TikTok Trend' | 'Hit' | 'Hit Medium' | 'Hit Big' | 'Mega Hit' | 'Mega Hit Medium' | 'Mega Hit Big';
  streams: {
    spotify: number;
    appleMusic: number;
    amazonMusic: number;
    youtubeMusic: number;
    total: number;
  };
  lastWrappedStreams?: {
    spotify: number;
    total: number;
  };
  sales: {
    physical: number;
    digital: number;
    total: number;
  };
  radioPlays: number;
  masterOwner?: string;
  chartHistory?: {
    [chartName: string]: {
      debutDate: string;
      peakPos: number;
      peakDate: string;
      weeksOnChart: number;
    }
  };
}

export interface Song extends BaseRelease {
  type: 'Single';
  genre?: Genre;
  collaborator: string;
  featuredArtistCost?: number;
  qualityModifier: number; // Impacted by hired staff
  isBSide?: boolean;
  albumTrackNumber?: number;
  isSleeperHit?: boolean;
  isNPCCollab?: boolean;
}

export interface Album extends BaseRelease {
  type: 'Album' | 'Single Pack' | 'EP' | 'Deluxe Album';
  trackIds: string[];
  originalAlbumId?: string; // Only for Deluxe Album
}

export type Release = Song | Album;

export interface Gig {
  id: string;
  name: string;
  region: Region;
  date: string; // ISO string
  cost: number;
  payout: number;
  popularityGain: number;
  completed: boolean;
}


export interface ScheduledTrack {
  id: string;
  releaseScheduleId: string;
  trackNumber: number;
  title: string;
  artistId: string;
  featuredArtists: string[];
  isReleased: boolean;
  isAnnounced: boolean;
  isHidden: boolean;
  singleReleaseDate?: string;
  duration: number;
  genre?: Genre;
  qualityScore: number;
}

export interface ReleaseSchedule {
  id: string;
  artistId: string; // artistName for NPCs
  releaseTitle: string;
  releaseType: 'Album' | 'Single' | 'EP' | 'Deluxe Album';
  coverImage: string; collaborator?: string; isNPCCollab?: boolean;
  bannerImage: string;
  releaseDate: string;
  announcementDate: string;
  status: 'scheduled' | 'upcoming' | 'released' | 'cancelled';
  totalPreSaves: number;
  dailyPreSaves: number;
  preSaveGrowth: number;
  hypeScore: number;
  popularityScore: number;
  isPlayerRelease: boolean;
  isNPCRelease: boolean;
  tracks: ScheduledTrack[];
  createdAt: string;
}

export interface PreSave {
  id: string;
  userId: string;
  releaseScheduleId: string;
  artistId: string;
  createdAt: string;
}

export interface UpcomingRanking {
  releaseScheduleId: string;
  rank: number;
  totalPreSaves: number;
  preSaveGrowth: number;
  releaseDate: string;
  trendingScore: number;
}
export interface GameState {
  version: number;
  artist: {
    image: string;
    name: string;
    gender: string;
    country: string;
    capital: StartCapital;
    level: number;
    socialProfile?: {
      bio: string;
      bannerUrl: string;
      customTweets?: { id: string; content: string; date: number; likes: number; retweets: number; replies: number; mediaUrl?: string }[];
    };
    spotifyArtistPickId?: string;
    labelContract?: RecordLabelContract | null;
  } | null;
  merch: {
    id: string;
    releaseId: string;
    name: string;
    type: 'Vinyl' | 'CD' | 'Cassette' | 'Digital Download' | 'Box Set' | 'T-Shirt' | 'Single Pack';
    image: string;
    price: number;
    cost: number;
    stock: number;
    sold: number;
    revenue: number;
    color?: string;
  }[];
  skills: {
    performance: number;
    production: number;
    songwriting: number;
    vocals: number;
    pop: number;
    kpop: number;
    rap: number;
    country: number;
  };
  popularity: {
    america: number;
    latinAmerica: number;
    europe: number;
  };
  stats: {
    money: number;
    ageInDays: number; // 0 means exactly 18 years old
    streams: number;
    sales: number;
    awards: number;
    skillPoints: number;
    youtubeSubscribers?: number;
    socialFollowers?: number;
    lastWrappedTotalStreams?: number;
    currentYearRevenue?: number;
    currentMonthStreamingRev?: number;
    currentMonthSalesRev?: number;
    currentMonthMerchRev?: number;
    currentMonthTourRev?: number;
    currentMonthSongRev?: Record<string, number>;
  };
  lastComputedCharts?: any;
  scheduledReleases: ReleaseSchedule[];
  userPreSaves: string[];
  npcStats?: Record<string, {
    listeners: number;
    skills: {
      performance: number;
      production: number;
      songwriting: number;
      vocals: number;
      pop: number;
      kpop: number;
      rap: number;
      country: number;
    };
    popularity: {
      america: number;
      latinAmerica: number;
      europe: number;
    };
  }>;
  time: {
    startDate: string; // ISO string 
    daysPassed: number;
  };
  releases: Release[];
  gigs: Gig[];
  grammys?: GrammysState;
  videos?: Video[];
  wrappedHistory?: {
     year: number;
     streams: number;
     topSongs: { title: string, streams: number, image?: string }[];
     topAlbums: { title: string, streams: number, image?: string }[];
     listeners: number;
     hours: number;
     countries: number;
  }[];
  tours?: Tour[];
  activeTourId?: string | null;
  tikTok?: TikTokProfile;
  isGodMode?: boolean;
  emails?: Email[];
  news?: NewsArticle[];
}

export interface NewsArticle {
  id: string;
  dateStr: string;
  title: string;
  body: string;
  imageUrl?: string;
  type: 'general' | 'scandal' | 'achievement' | 'review' | 'grammy';
  artistName?: string;
}

export interface Email {
  id: string;
  dateStr: string;
  sender: string;
  subject: string;
  body: string;
  isRead: boolean;
  collabOffer?: {
    npcArtist: string;
    songTitle: string;
    coverArt: string;
    fee: number;
    status: 'pending' | 'accepted' | 'rejected';
    genre?: Genre;
  };
  contractOffer?: Partial<RecordLabelContract> & { 
    labelId: string;
    status: 'pending' | 'accepted' | 'rejected';
  };
}

export type VenueType = 'Cafe' | 'Arena' | 'Stadium';

export interface TourSeatLevel {
  level: number;
  price: number;
  capacity: number;
  sold: number;
}

export interface Venue {
  id: string;
  name: string;
  type: VenueType;
  region: Region;
  weeklyCost: number;
  levels: number;
  baseCapacityPerLevel: number[]; 
  image: string;
}

export interface TourLeg {
  id: string;
  venueId: string;
  shows: number; 
  date: string; 
  seatLevels: TourSeatLevel[];
  preSaleStart: string;
  preSaleEnd: string;
  opener?: string;
  openerCost?: number;
  dailyRevenue: number;
  dailyAttendance: number;
  totalRevenue: number;
  totalAttendance: number;
  completed: boolean;
}

export interface Tour {
  id: string;
  name: string;
  poster: string;
  setlistName: string;
  setlist: string[]; 
  legs: TourLeg[];
  status: 'Planning' | 'PreSale' | 'Ongoing' | 'Completed';
  reviews?: number; 
  totalRevenue: number;
  totalCost: number;
  totalAttendance: number;
}

export interface DailyReportData {
  dailyStreams: number;
  dailySales: number;
  revenue: number;
  topSong: string | null;
  topAlbum: string | null;
  tourRevenue?: number;
  tourAttendance?: number;
  tourName?: string;
  tourStage?: string;
}

export type TikTokPostStatus = 'Initial Push' | 'Testing Phase' | 'Expansion Phase' | 'Viral Phase' | 'Decline Phase' | 'Long Tail Phase';

export interface TikTokPost {
  id: string;
  type: 'video' | 'photo' | 'carousel';
  imageUrl?: string;
  caption: string;
  tags: string[];
  songId?: string; // Optional if they use their own song
  date: string;
  views: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  isPinned: boolean;
  algorithmScore: number;
  thumbnailUrl?: string; 
  status: TikTokPostStatus;
  
  // Realism tracking
  completionRate: number;
  rewatchRate: number;
}

export type TikTokTrendingStatus = 'Non Trend' | 'Non Trend Medium' | 'Non Trend Big' | 'TikTok Trend' | 'Hits' | 'Hits Medium' | 'Hits Big' | 'Mega Hits' | 'Mega Hits Medium' | 'Mega Hits Big';

export interface TikTokSoundCampaign {
  active: boolean;
  regionsPromoted: number;
  daysRemaining: number;
  totalCost: number;
  budgetSpent: number;
}

export interface TikTokSound {
  songId: string;
  isPinned?: boolean;
  hasBeenPromoted?: boolean;
  usedInVideos: number;
  viewsGenerated: number;
  trendingStatus: TikTokTrendingStatus;
  campaign?: TikTokSoundCampaign;
}

export interface TikTokProfile {
  followers: number;
  following: number;
  totalLikes: number;
  username: string;
  displayName: string;
  isVerified: boolean;
  label: string;
  bio?: string;
  posts: TikTokPost[];
  sounds: TikTokSound[];
  fatigueScore: number; // 0 to 100
  lastPostDate?: string;
}

export interface RecordLabelContract {
  labelId: string;
  type: 'album' | 'year'; // length based on albums or years
  duration: number; // Num years if type is 'year'
  requiredAlbums: number;
  requiredEPs: number;
  requiredSingles: number;
  deliveredAlbums: number;
  deliveredEPs: number;
  deliveredSingles: number;
  advanceMoney: number;
  unrecoupedBalance: number;
  royaltyCut: number; // label's cut
  revenueGeneratedForLabel: number;
  signedDate: string;
}
