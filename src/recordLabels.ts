import { RecordLabelContract } from './types';

export interface RecordLabel {
  id: string;
  name: string;
  description: string;
  image: string;
  royaltyCut: number; // percentage
  benefits: {
    freeTikTokPromo: boolean;
    freeMusicVideo: boolean;
    collabPromoCut: number; // percentage discount
  };
  requirements: {
    targetLevel: number;
    minStreams: number;
    minFollowers: number;
  };
  contractBasics: {
    baseAdvance: number; // e.g. min advance they offer
    maxAdvance: number;  
  };
  artists: string[];
}

export const RECORD_LABELS: RecordLabel[] = [
  {
    id: "universal_republic",
    name: "Universal Republic",
    description: "The biggest label in the world. High royalties, but unmatched perks.",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' fill='none'><rect width='200' height='200' fill='%23050505'/><path d='M100 30a70 70 0 100 140V130a40 40 0 110-80z' fill='%23FFF'/><circle cx='100' cy='100' r='15' fill='%23FFF'/></svg>",
    royaltyCut: 20,
    benefits: {
      freeTikTokPromo: true,
      freeMusicVideo: true,
      collabPromoCut: 50,
    },
    requirements: { targetLevel: 5, minStreams: 10_000_000, minFollowers: 1_000_000 },
    contractBasics: { baseAdvance: 5_000_000, maxAdvance: 50_000_000 },
    artists: [
      "Taylor Swift", "Ariana Grande", "The Weeknd", "Drake", "Post Malone"
    ]
  },
  {
    id: "intergalactic_records",
    name: "Intergalactic Records",
    description: "A trendy label focused on Pop and emerging artists. Good balance of cuts and perks.",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' fill='none'><rect width='200' height='200' fill='%230f0c29'/><path d='M100 30L120 80L170 100L120 120L100 170L80 120L30 100L80 80Z' fill='%23ff00cc'/></svg>",
    royaltyCut: 15,
    benefits: {
      freeTikTokPromo: false,
      freeMusicVideo: true,
      collabPromoCut: 25,
    },
    requirements: { targetLevel: 3, minStreams: 1_000_000, minFollowers: 250_000 },
    contractBasics: { baseAdvance: 500_000, maxAdvance: 5_000_000 },
    artists: [
      "Billie Eilish", "Olivia Rodrigo", "Dua Lipa", "Sabrina Carpenter", "Chappell Roan"
    ]
  },
  {
    id: "rhythm_nation",
    name: "Rhythm Nation",
    description: "Specializes in R&B, Rap, and Latin stars.",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' fill='none'><rect width='200' height='200' fill='%234B0000'/><path d='M60 150V50h40c20 0 40 10 40 40c0 15-10 25-20 30l30 30h-30l-20-25H90v25H60zm30-50h10c10 0 15-5 15-15s-5-15-15-15H90v30z' fill='%23FFF'/></svg>",
    royaltyCut: 18,
    benefits: {
      freeTikTokPromo: true,
      freeMusicVideo: false,
      collabPromoCut: 40,
    },
    requirements: { targetLevel: 4, minStreams: 5_000_000, minFollowers: 500_000 },
    contractBasics: { baseAdvance: 1_000_000, maxAdvance: 15_000_000 },
    artists: [
      "Beyoncé", "Rihanna", "Bad Bunny", "Rosalía", "Kendrick Lamar", "Travis Scott"
    ]
  },
  {
    id: "seoul_vibe",
    name: "Seoul Vibe Entertainment",
    description: "A powerhouse in the Kpop industry.",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' fill='none'><rect width='200' height='200' fill='%230432ff'/><path d='M70 100a30 30 0 1060 0a30 30 0 10-60 0' fill='%23ff2a7e'/></svg>",
    royaltyCut: 25, 
    benefits: {
      freeTikTokPromo: true,
      freeMusicVideo: true,
      collabPromoCut: 75,
    },
    requirements: { targetLevel: 2, minStreams: 500_000, minFollowers: 100_000 },
    contractBasics: { baseAdvance: 200_000, maxAdvance: 2_000_000 },
    artists: [
      "BTS", "BLACKPINK", "NewJeans", "SEVENTEEN", "Stray Kids"
    ]
  },
  {
    id: "indie_collective",
    name: "Indie Collective",
    description: "For the artists who want to keep what they earn. Very low cut, but zero perks.",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' fill='none'><rect width='200' height='200' fill='%23EAEAEA'/><circle cx='100' cy='100' r='50' stroke='%23111' stroke-width='12' fill='none'/><path d='M100 50V150M50 100H150' stroke='%23111' stroke-width='12'/></svg>",
    royaltyCut: 5,
    benefits: {
      freeTikTokPromo: false,
      freeMusicVideo: false,
      collabPromoCut: 0,
    },
    requirements: { targetLevel: 1, minStreams: 0, minFollowers: 0 },
    contractBasics: { baseAdvance: 10_000, maxAdvance: 100_000 },
    artists: [
      "Lana Del Rey", "Mitski", "Frank Ocean", "Conan Gray"
    ]
  }
];

export const getArtistLabel = (artistName: string): RecordLabel | undefined => {
  return RECORD_LABELS.find(label => label.artists.includes(artistName));
};
