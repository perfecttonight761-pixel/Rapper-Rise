import React, { useState, useMemo } from 'react';
import { GameState, Album, Song } from '../types';
import { Heart, MessageCircle, Repeat2, Share, BadgeCheck, MoreHorizontal, ArrowLeft } from 'lucide-react';
import { computeCharts } from '../chartUtils';
import { AlbumTrackerMedia, ChartPredictionMedia, SpotifyMilestoneCard, DebutTrackerMedia, OfficialChartMedia } from './TweetMedia';

interface XViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
  onClose?: () => void;
}

const CHART_DATA_AVATAR = (
  <div className="w-full h-full bg-black flex items-center justify-center p-0.5 border border-gray-800">
     <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
       <rect width="100" height="100" fill="#000" rx="50"/>
       <g fill="#fff" transform="rotate(-30 50 50)">
         <rect x="15" y="25" width="70" height="12"/>
         <rect x="15" y="45" width="50" height="12"/>
         <rect x="15" y="65" width="60" height="12"/>
       </g>
     </svg>
  </div>
);

const TOTC_AVATAR = (
  <div className="w-full h-full rounded-full bg-[#1A1E24] flex items-center justify-center overflow-hidden">
    <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
      <path d="M28 85 L28 40 L15 40 L35 15 L55 40 L42 40 L42 85 Z" fill="#60a5fa"/>
      <path d="M58 15 L58 60 L45 60 L65 85 L85 60 L72 60 L72 15 Z" fill="#f472b6"/>
    </svg>
  </div>
);

const VerifiedBadge = ({ type, className = "w-[15px] h-[15px]" }: { type: 'blue' | 'gold' | 'none', className?: string }) => {
  if (type === 'none') return null;
  const color = type === 'gold' ? 'text-[#F9A01B]' : 'text-[#1D9BF0]';
  return (
    <svg viewBox="0 0 24 24" aria-label="Verified account" role="img" className={`${className} ${color} fill-current`}>
      <g><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.792-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.756 2.76 1.9 3.44-.136.42-.204.86-.204 1.32 0 2.21 1.71 3.998 3.918 3.998.47 0 .92-.084 1.336-.25.52 1.334 1.815 2.25 3.337 2.25s2.816-.916 3.337-2.25c.416.166.866.25 1.336.25 2.21 0 3.918-1.792 3.918-4 0-.46-.067-.9-.204-1.32 1.144-.68 1.9-1.98 1.9-3.44zm-12.306 4.7l-3.36-3.36 1.06-1.06 2.3 2.3 5.44-5.44 1.06 1.06-6.5 6.5z"></path></g>
    </svg>
  );
};

const Tweet = ({ tweet, onProfileClick }: { key?: React.Key, tweet: any, onProfileClick: (handle: string) => void }) => (
  <div className="flex gap-3 px-4 py-3 border-b border-gray-800 hover:bg-white/[0.03] transition-colors cursor-pointer" onClick={() => onProfileClick(tweet.author.handle)}>
    <div className="w-10 h-10 rounded-full bg-gray-700 flex shrink-0 items-center justify-center font-bold text-lg text-white overflow-hidden">
      {tweet.author.avatar}
    </div>
    <div className="flex flex-col flex-1 pb-1">
      <div className="flex items-center gap-1.5 text-[15px]">
        <span className="font-bold text-white hover:underline">{tweet.author.name}</span>
        <VerifiedBadge type={tweet.author.verified} />
        <span className="text-gray-500">{tweet.author.handle}</span>
        <span className="text-gray-500">·</span>
        <span className="text-gray-500 hover:underline">{tweet.time}</span>
        <button className="ml-auto text-gray-500 hover:text-[#1D9BF0] rounded-full p-1.5 hover:bg-[#1D9BF0]/10 transition-colors">
           <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      <div className="text-[15px] text-white mt-0.5 whitespace-pre-wrap leading-tight">
        {tweet.content}
      </div>
      {tweet.mediaUrl && (
         <div className="mt-3 rounded-2xl border border-gray-800 overflow-hidden">
            <img src={tweet.mediaUrl || undefined} className="w-full max-h-[400px] object-cover" />
         </div>
      )}
      {tweet.media && (
         <div className="mt-3 rounded-2xl border border-gray-800 overflow-hidden">
            {tweet.media}
         </div>
      )}
      <div className="flex items-center justify-between mt-3 text-gray-500 max-w-md">
        <button className="flex items-center gap-2 hover:text-[#1D9BF0] transition-colors group">
           <div className="p-2 rounded-full group-hover:bg-[#1D9BF0]/10 -ml-2">
             <MessageCircle className="w-4 h-4" />
           </div>
           <span className="text-[13px]">{tweet.replies.toLocaleString()}</span>
        </button>
        <button className="flex items-center gap-2 hover:text-[#00BA7C] transition-colors group">
           <div className="p-2 rounded-full group-hover:bg-[#00BA7C]/10 -ml-2">
             <Repeat2 className="w-4 h-4" />
           </div>
           <span className="text-[13px]">{tweet.retweets.toLocaleString()}</span>
        </button>
        <button className="flex items-center gap-2 hover:text-[#F91880] transition-colors group">
           <div className="p-2 rounded-full group-hover:bg-[#F91880]/10 -ml-2">
             <Heart className="w-4 h-4" />
           </div>
           <span className="text-[13px]">{tweet.likes.toLocaleString()}</span>
        </button>
        <button className="flex items-center gap-2 hover:text-[#1D9BF0] transition-colors group">
           <div className="p-2 rounded-full group-hover:bg-[#1D9BF0]/10 -ml-2">
             <Share className="w-4 h-4" />
           </div>
        </button>
      </div>
    </div>
  </div>
);

export function XView({ gameState, setGameState, onClose }: XViewProps) {
  const [activeTab, setActiveTab] = useState<'foryou' | 'profile'>('foryou');
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editBio, setEditBio] = useState(gameState.artist?.socialProfile?.bio || "Musician. Stream my new music now!");
  const [newTweetContent, setNewTweetContent] = useState('');
  const [newTweetImage, setNewTweetImage] = useState<string | null>(null);

  const handlePostTweet = () => {
    if (!newTweetContent.trim() && !newTweetImage) return;
    setGameState(prev => {
      if (!prev || !prev.artist) return prev;
      
      const newCustomTweet = {
        id: `custom_${Date.now()}`,
        content: newTweetContent,
        date: prev.time.daysPassed,
        likes: Math.floor(Math.random() * 50) + 5,
        retweets: Math.floor(Math.random() * 10),
        replies: Math.floor(Math.random() * 5),
        mediaUrl: newTweetImage || undefined
      };

      return {
        ...prev,
        artist: {
          ...prev.artist,
          socialProfile: {
            bio: prev.artist.socialProfile?.bio || "",
            bannerUrl: prev.artist.socialProfile?.bannerUrl || "",
            customTweets: [newCustomTweet, ...(prev.artist.socialProfile?.customTweets || [])]
          }
        }
      };
    });
    setNewTweetContent('');
    setNewTweetImage(null);
  };

  const handleSaveProfile = () => {
    setGameState(prev => {
      if (!prev || !prev.artist) return prev;
      return {
        ...prev,
        artist: {
          ...prev.artist,
          socialProfile: {
            bio: editBio,
          }
        }
      };
    });
    setIsEditingProfile(false);
  };

  const playerHandle = `@${gameState.artist?.name.replace(/\s+/g, '').toLowerCase() || 'player'}`;
  const playerName = gameState.artist?.name || 'Player';

  const globalPopularity = gameState.popularity.america + gameState.popularity.europe + gameState.popularity.latinAmerica;
  const followerCount = gameState.stats.socialFollowers || Math.floor((gameState.stats.streams || 0) * 0.05 + globalPopularity * 100);

  const isPlayerVerified = followerCount > 100000;
  const playerVerifiedType = isPlayerVerified ? 'gold' : 'none';

  // Generate some deterministic tweets
  const tweets = useMemo(() => {
    const generatedTweets = [];
    
    const currentDate = new Date(gameState.time.startDate);
    currentDate.setDate(currentDate.getDate() + gameState.time.daysPassed);
    
    // Recent release reaction
    const latestRelease = gameState.releases.filter(r => r.status === 'Published').pop();
    if (latestRelease) {
      const isGood = (latestRelease as any).qualityModifier ? (latestRelease as any).qualityModifier > 1 : true;
      generatedTweets.push({
        id: '1',
        author: { name: 'Music Fan 🎧', handle: '@stanacc_01', verified: 'none', avatar: 'M' },
        content: isGood 
          ? `Wait, ${latestRelease.title} by ${playerHandle} is actually a bop?? It's been on repeat all day 🔥`
          : `I'm sorry but ${latestRelease.title} is kinda mid :/ expected more from ${playerHandle}`,
        likes: Math.floor(followerCount * 0.01 * (isGood ? 1.5 : 0.5)),
        retweets: Math.floor(followerCount * 0.005 * (isGood ? 1.2 : 0.3)),
        replies: Math.floor(followerCount * 0.001),
        time: '2h',
        isPlayer: false
      });

      const releaseDateTime = latestRelease.releaseDate ? new Date(latestRelease.releaseDate).getTime() : new Date(gameState.time.startDate).getTime();
      const daysSinceRelease = Math.max(0, Math.floor((currentDate.getTime() - releaseDateTime) / (1000 * 3600 * 24)));
      const dailyAvgGlobal = latestRelease.lastDailyStreams?.total || Math.floor((latestRelease.streams.total || 0) / Math.max(1, daysSinceRelease));
      const dailyAvgSpotify = latestRelease.lastDailyStreams?.spotify || Math.floor((latestRelease.streams.spotify || 0) / Math.max(1, daysSinceRelease));

      // Debut Streams & Sales Tweet
      if (latestRelease.debutStreams && daysSinceRelease <= 2) {
         const dS = latestRelease.debutStreams;
         const spotStr = Math.floor(dS * 0.45);
         const appleStr = Math.floor(dS * 0.25);
         const amzStr = Math.floor(dS * 0.15);
         const ytStr = dS - spotStr - appleStr - amzStr;

         const totPop = (gameState.popularity.america + gameState.popularity.latinAmerica + gameState.popularity.europe) || 1;
         const usaSales = Math.floor((latestRelease.sales?.total || 0) * (gameState.popularity.america / totPop));
         const latamSales = Math.floor((latestRelease.sales?.total || 0) * (gameState.popularity.latinAmerica / totPop));
         const euroSales = Math.floor((latestRelease.sales?.total || 0) * (gameState.popularity.europe / totPop));

         const tweetText = `${playerName} - ${latestRelease.title} (${latestRelease.type})
         
Debut On Spotify: ${spotStr.toLocaleString()}
Apple Music: ${appleStr.toLocaleString()}
Amazon Music: ${amzStr.toLocaleString()}
YouTube Music: ${ytStr.toLocaleString()}

And Earned ${dS.toLocaleString()} Global Streams!

Sold in each region:
🇺🇸 US: ${usaSales.toLocaleString()}
🌎 Latin America: ${latamSales.toLocaleString()}
🇪🇺 Europe: ${euroSales.toLocaleString()}`;

         generatedTweets.push({
            id: '1.25',
            author: { name: 'chart data', handle: '@chartdata', verified: 'gold', avatar: CHART_DATA_AVATAR },
            content: tweetText,
            media: latestRelease.coverImage ? <div className="bg-black flex justify-center mt-2 rounded-[1rem] overflow-hidden"><img src={latestRelease.coverImage || undefined} className="w-full max-w-[400px] h-auto border border-gray-800" /></div> : undefined,
            likes: Math.min(999000, Math.floor(latestRelease.debutStreams / 50)),
            retweets: Math.min(100000, Math.floor(latestRelease.debutStreams / 200)),
            replies: Math.floor(followerCount * 0.002) + 20,
            time: '3h',
            isPlayer: false
         });
      } else if (latestRelease.streams?.total > 1000) {
         generatedTweets.push({
            id: '1.5',
            author: { name: 'Pop Crave', handle: '@PopCrave', verified: 'gold', avatar: 'P' },
            content: `📊 "${latestRelease.title}" by ${playerHandle} has crossed ${latestRelease.streams?.total.toLocaleString()} streams on global platforms!`,
            likes: Math.floor(followerCount * 0.05) + 500,
            retweets: Math.floor(followerCount * 0.01) + 120,
            replies: Math.floor(followerCount * 0.002) + 20,
            time: '3h',
            isPlayer: false
         });
      }
      
      // Milestone Tweet
      generatedTweets.push({
         id: '1.6',
         author: { name: 'SpotifySwiftie', handle: '@SpotifySwiftie', verified: 'blue', avatar: 'S' },
         content: `"${latestRelease.title}" by ${playerName} is doing incredible numbers on Spotify today!`,
         media: <SpotifyMilestoneCard 
              albumCover={latestRelease.coverImage} 
              typeLabel={latestRelease.type.toUpperCase()}
              dateLabel={new Date(currentDate).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})}
              title={latestRelease.title}
              artist={playerName}
              dailyStreams={Math.floor(dailyAvgSpotify * (1 + (Math.random() * 0.2)))}
              changePercent="+7.96%"
              totalStreams={latestRelease.streams.spotify}
         />,
         likes: Math.floor(followerCount * 0.03) + 200,
         retweets: Math.floor(followerCount * 0.01) + 40,
         replies: 15,
         time: '3h',
         isPlayer: false
      });
      
      // Album Tracker Tweet
      if (latestRelease.type === 'Album') {
         generatedTweets.push({
            id: '1.8',
            author: { name: 'Spotify Daily Data', handle: '@spotifydata', verified: 'gold', avatar: 'S' },
            content: `Tracker for "${latestRelease.title}" by ${playerName} on Spotify:`,
            media: <AlbumTrackerMedia album={latestRelease} playerName={playerName} currentDate={currentDate} tracks={gameState.releases.filter(r => (latestRelease as Album).trackIds.includes(r.id)) as Song[]} />,
            likes: Math.floor(followerCount * 0.02) + 200,
            retweets: Math.floor(followerCount * 0.008) + 50,
            replies: 10,
            time: '4h',
            isPlayer: false
         });
      }

      // Spotify Counter style text tweet
      if (latestRelease.type === 'Single' && gameState.time.daysPassed > 3) {
         let counterText = `"${latestRelease.title}" — Spotify Counter\n\n`;
         let total = latestRelease.streams?.spotify || 0;
         const dailyAvg = dailyAvgSpotify || Math.floor(total / Math.max(1, gameState.time.daysPassed));
         for (let i = 4; i >= 0; i--) {
            const date = new Date(gameState.time.startDate);
            date.setDate(date.getDate() + gameState.time.daysPassed - i);
            const val = dailyAvg + Math.floor(Math.random() * dailyAvg * 0.1);
            counterText += `${date.toLocaleDateString(undefined, {month:'2-digit', day:'2-digit'})} — ${val.toLocaleString()}\n`;
         }
         counterText += `\nTotal: ${total.toLocaleString()}`;
         
         generatedTweets.push({
            id: '1.9',
            author: { name: 'spotify counter', handle: '@spotify_counter', verified: 'blue', avatar: 'S' },
            content: counterText,
            likes: Math.floor(followerCount * 0.01) + 80,
            retweets: Math.floor(followerCount * 0.005) + 20,
            replies: 5,
            time: '5h',
            isPlayer: false
         });
      }
    }

    const { charts } = computeCharts(gameState);

    const weekProgress = gameState.time.daysPassed % 7;
    let predictionStage = 'Early';
    if (weekProgress >= 5) predictionStage = 'Final';
    else if (weekProgress >= 3) predictionStage = 'Midweek';

    let tweetTime = '12h';
    if (predictionStage === 'Final') tweetTime = '2h';
    else if (predictionStage === 'Early') tweetTime = '1d';

    // Setup generic songs/albums
    const hot100Songs = charts.RegionAmerica.slice(0, 10);
    const global200Songs = charts.Global200Single.slice(0, 10);
    const billboard200 = charts.Global200Album.slice(0, 10);

    // Prediction Tweet (Visible most of the week)
    if (weekProgress < 5) {
       generatedTweets.push({
         id: 'totc_prediction',
         author: { name: 'Talk of the Charts', handle: '@talkofthecharts', verified: 'gold', avatar: TOTC_AVATAR },
         content: `${predictionStage} Billboard Hot 100 predictions`,
         media: <ChartPredictionMedia songs={hot100Songs} playerName={playerName} stage={predictionStage as any} />,
         likes: 24500,
         retweets: 8200,
         replies: 1250,
         time: tweetTime,
         isPlayer: false
       });
    }
    
    // Only show official charts on certain days
    // The user said "seminggu sekali ya 3 Tweet itu bisa kan" -> Just show them at the end of the chart week
    if (weekProgress >= 5) {
       generatedTweets.push({
         id: 'totc_bb200',
         author: { name: 'Talk of the Charts', handle: '@talkofthecharts', verified: 'gold', avatar: TOTC_AVATAR },
         content: `This week's Billboard 200 top 10`,
         media: <OfficialChartMedia songs={billboard200} playerName={playerName} chartName="Billboard 200" currentDate={currentDate} />,
         likes: 54400,
         retweets: 12200,
         replies: 1850,
         time: '13h',
         isPlayer: false
       });
       
       generatedTweets.push({
         id: 'totc_hot100',
         author: { name: 'Talk of the Charts', handle: '@talkofthecharts', verified: 'gold', avatar: TOTC_AVATAR },
         content: `This week's Billboard Hot 100 top 10`,
         media: <OfficialChartMedia songs={hot100Songs} playerName={playerName} chartName="Billboard Hot 100" currentDate={currentDate} />,
         likes: 45400,
         retweets: 9200,
         replies: 2850,
         time: '13h',
         isPlayer: false
       });
       
       generatedTweets.push({
         id: 'totc_global200',
         author: { name: 'Talk of the Charts', handle: '@talkofthecharts', verified: 'gold', avatar: TOTC_AVATAR },
         content: `This week's Billboard Global 200 top 10`,
         media: <OfficialChartMedia songs={global200Songs} playerName={playerName} chartName="Billboard Global 200" currentDate={currentDate} />,
         likes: 31400,
         retweets: 6200,
         replies: 1350,
         time: '10h',
         isPlayer: false
       });
    }

    // 1. Debuts and milestones
     let potentialCertTweets: any[] = [];
    gameState.releases.filter(r => r.status === 'Published').forEach((release, i) => {
       const releaseDateTime = release.releaseDate ? new Date(release.releaseDate).getTime() : new Date(gameState.time.startDate).getTime();
       const daysSinceRelease = Math.max(0, Math.floor((currentDate.getTime() - releaseDateTime) / (1000 * 3600 * 24)));
       const isAlbum = release.type === 'Album';
       const chartName = isAlbum ? 'Billboard 200' : 'Billboard Hot 100';
       const chartList = isAlbum ? charts.Global200Album : charts.RegionAmerica;
       
       const rankData = chartList.find(c => c?.id === release.id);
       const rank = rankData ? chartList.indexOf(rankData) + 1 : null;
       
       if (daysSinceRelease > 0 && daysSinceRelease <= 14 && rank && rank <= 100) {
          generatedTweets.push({
            id: `debut_${release.id}`,
            author: { name: 'chart data', handle: '@chartdata', verified: 'gold', avatar: CHART_DATA_AVATAR },
            content: `${playerName}'s "${release.title}" debuts at #${rank} on the ${chartName}.`,
            media: release.coverImage ? <div className="bg-black flex justify-center"><img src={release.coverImage || undefined} className="w-full max-w-[400px] h-auto shadow-xl border border-gray-800" /></div> : undefined,
            likes: Math.floor(Math.random() * 50000) + 20000,
            retweets: Math.floor(Math.random() * 10000) + 5000,
            replies: Math.floor(Math.random() * 2000) + 500,
            time: '1d',
            isPlayer: false
          });
       }
       
       // Certification
       const sales = release.sales?.total || 0;
       let cert = null;
       if (sales >= 10000000) cert = 'Diamond';
       else if (sales >= 1000000) cert = `${Math.floor(sales / 1000000)}x Platinum`;
       else if (sales >= 500000) cert = 'Gold';
       else if (sales >= 200000) cert = 'Silver';

       if (cert) {
         potentialCertTweets.push({
           id: `cert_${release.id}`,
           author: { name: 'chart data', handle: '@chartdata', verified: 'gold', avatar: CHART_DATA_AVATAR },
           content: `${playerName}'s "${release.title}" is now certified ${cert} in the US for selling over ${sales.toLocaleString()} units!`,
           media: release.coverImage ? <div className="bg-black flex justify-center"><img src={release.coverImage || undefined} className="w-full max-w-[400px] h-auto shadow-xl border border-gray-800" /></div> : undefined,
           likes: Math.floor(followerCount * 0.05) + 10000,
           retweets: Math.floor(followerCount * 0.01) + 2000,
           replies: 1000 + Math.floor(Math.random() * 500),
           time: '3d',
           isPlayer: false
         });
       }
    });

    // Select 2-3 random certification tweets if there are many
    if (potentialCertTweets.length > 0) {
      const numToPick = Math.min(potentialCertTweets.length, Math.floor(Math.random() * 2) + 2); // 2 or 3
      const shuffled = [...potentialCertTweets].sort(() => 0.5 - Math.random());
      generatedTweets.push(...shuffled.slice(0, numToPick));
    }

    // Monthly Streams
    if (gameState.time.daysPassed > 30) {
        const estimatedMonthly = Math.floor(gameState.stats.streams * (30 / Math.max(1, gameState.time.daysPassed)));
        generatedTweets.push({
            id: `monthly_streams`,
            author: { name: 'chart data', handle: '@chartdata', verified: 'gold', avatar: CHART_DATA_AVATAR },
            content: `${playerName} earned ${estimatedMonthly.toLocaleString()} streams this month on all platforms.`,
            media: gameState.artist?.image ? <div className="bg-black flex justify-center"><img src={gameState.artist.image || undefined} className="w-full max-w-[400px] h-auto shadow-xl border border-gray-800" /></div> : undefined,
            likes: Math.floor(Math.random() * 30000) + 15000,
            retweets: Math.floor(Math.random() * 5000) + 2000,
            replies: Math.floor(Math.random() * 1000) + 300,
            time: '5h',
            isPlayer: false
        });
    }

    // Grammys
    if (gameState.grammys && gameState.grammys.results && gameState.grammys.results.length > 0) {
      const GRAMMYS_AVATAR = (
         <div className="w-full h-full bg-[#E5B869] flex items-center justify-center p-0.5 border border-[#C59B4B]">
           <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[70%] h-[70%]">
             <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"></path>
           </svg>
         </div>
      );
      
      const isNomStage = gameState.grammys.stage === 'Nominations';
      const isWinStage = gameState.grammys.stage === 'Ceremony' || gameState.grammys.stage === 'Results';

      if (isNomStage) {
         gameState.grammys.results.forEach((result, idx) => {
            const playerNom = result.nominees.find(n => n.isPlayer);
            if (playerNom) {
               const nomineesList = result.nominees.map(n => `• ${n.title ? `"${n.title}"` : n.artist}`).join('\n');
               let mediaContent = undefined;
               
               if (playerNom.type !== 'Artist') {
                 const release = gameState.releases.find(r => r?.id === playerNom.id);
                 if (release?.coverImage) {
                   mediaContent = <div className="bg-black flex justify-center"><img src={release.coverImage || undefined} className="w-full max-w-[400px] h-auto shadow-xl border border-gray-800" /></div>;
                 }
               } else if (gameState.artist?.image) {
                 mediaContent = <div className="bg-black flex justify-center"><img src={gameState.artist?.image || undefined} className="w-full max-w-[400px] h-auto shadow-xl border border-gray-800" /></div>;
               }

               generatedTweets.push({
                  id: `grammys_nom_${gameState.grammys?.year}_${idx}`,
                  author: { name: 'Recording Academy / GRAMMYs', handle: '@RecordingAcad', verified: 'gold', avatar: GRAMMYS_AVATAR },
                  content: `${result.category} Nominations are:\n\n${nomineesList}\n\nCongrats to all the nominees! ✨ #GRAMMYs`,
                  media: mediaContent,
                  likes: 154000 + (idx * 10000),
                  retweets: 42000,
                  replies: 12500,
                  time: '1h',
                  isPlayer: false
               });
            }
         });
      }
      
      if (isWinStage) {
         gameState.grammys.results.forEach((result, idx) => {
            if (result.winnerId) {
               const winner = result.nominees.find(n => n?.id === result.winnerId);
               if (winner && winner.isPlayer) {
                  let mediaContent = undefined;
                  if (winner.type !== 'Artist') {
                    const release = gameState.releases.find(r => r?.id === winner.id);
                    if (release?.coverImage) {
                      mediaContent = <div className="bg-black flex justify-center"><img src={release.coverImage || undefined} className="w-full max-w-[400px] h-auto shadow-xl border border-gray-800" /></div>;
                    }
                  } else if (gameState.artist?.image) {
                    mediaContent = <div className="bg-black flex justify-center"><img src={gameState.artist?.image || undefined} className="w-full max-w-[400px] h-auto shadow-xl border border-gray-800" /></div>;
                  }

                  generatedTweets.push({
                     id: `grammys_win_${gameState.grammys?.year}_${idx}`,
                     author: { name: 'Recording Academy / GRAMMYs', handle: '@RecordingAcad', verified: 'gold', avatar: GRAMMYS_AVATAR },
                     content: `${winner.title ? `"${winner.title}" by ${winner.artist}` : winner.artist} has won ${result.category}! 🏆\n\nCongratulations! #GRAMMYs`,
                     media: mediaContent,
                     likes: 354000 + (idx * 20000),
                     retweets: 92000,
                     replies: 22500,
                     time: '2h',
                     isPlayer: false
                  });
               }
            }
         });
      }
    }

    // --- Additional Variety Feed Types ---
    
    // Tour Fan
    const activeTour = gameState.tours?.find(t => !t.completed);
    if (activeTour) {
      generatedTweets.push({
        id: '2.1',
        author: { name: 'Concert Updates', handle: '@TourAlerts', verified: 'blue', avatar: 'C' },
        content: `Fans are going crazy for the ${activeTour.name}! The setlist is insane. Are you attending any dates? 🎤🎟️`,
        likes: Math.floor(followerCount * 0.015) + 300,
        retweets: Math.floor(followerCount * 0.005) + 50,
        replies: 45,
        time: '4h',
        isPlayer: false
      });
      generatedTweets.push({
        id: '2.2',
        author: { name: 'emily ♡', handle: '@emily_stans', verified: 'none', avatar: 'E' },
        content: `I JUST SURVIVED THE WAR FOR ${playerHandle.toUpperCase()} TICKETS 😭😭 SEE YOU IN THE FRONT ROW!`,
        likes: Math.floor(followerCount * 0.002) + 20,
        retweets: Math.floor(followerCount * 0.001) + 2,
        replies: 5,
        time: '5h',
        isPlayer: false
      });
    }

    // Merch Fan
    if (gameState.merch && gameState.merch.length > 0) {
      const topMerch = gameState.merch.reduce((prev, current) => (prev.sold > current.sold) ? prev : current);
      if (topMerch.sold > 100) {
        generatedTweets.push({
          id: '2.3',
          author: { name: 'Merch Drops', handle: '@MerchWatcher', verified: 'blue', avatar: 'M' },
          content: `${playerName}'s ${topMerch.name} is selling out incredibly fast. Did you manage to grab one before they're gone? 👕🔥`,
          likes: Math.floor(followerCount * 0.008) + 100,
          retweets: Math.floor(followerCount * 0.002) + 15,
          replies: 10,
          time: '7h',
          isPlayer: false
        });
        generatedTweets.push({
          id: '2.4',
          author: { name: 'alex', handle: '@alex__music', verified: 'none', avatar: 'A' },
          content: `my ${topMerch.name} just arrived and the quality is actually so good wow ${playerHandle}`,
          likes: 34,
          retweets: 2,
          replies: 1,
          time: '6h',
          isPlayer: false
        });
      }
    }

    // Gig / Live Performance
    const recentGigs = gameState.gigs?.filter(g => g.completed);
    if (recentGigs && recentGigs.length > 0) {
      const lastGig = recentGigs[recentGigs.length - 1];
      generatedTweets.push({
        id: '2.5',
        author: { name: 'local live music', handle: '@locallive', verified: 'none', avatar: 'L' },
        content: `saw ${playerName} perform at ${lastGig.venue} ${lastGig.city ? 'in ' + lastGig.city : ''}... honestly incredible stage presence. totally worth it.`,
        likes: 120,
        retweets: 15,
        replies: 4,
        time: '18h',
        isPlayer: false
      });
    }

    // Regional Popularity Praise
    if (gameState.popularity.latinAmerica > 40) {
      generatedTweets.push({
        id: '2.6',
        author: { name: 'Brazil Updates 🇧🇷', handle: '@BrazilStans', verified: 'blue', avatar: 'B' },
        content: `COME TO BRAZIL 🇧🇷🇧🇷 LATAM LOVES YOU ${playerHandle.toUpperCase()}!!`,
        likes: Math.floor(followerCount * 0.02) + 500,
        retweets: Math.floor(followerCount * 0.005) + 100,
        replies: 30,
        time: '9h',
        isPlayer: false
      });
    }
    
    if (gameState.popularity.europe > 50) {
      generatedTweets.push({
        id: '2.7',
        author: { name: 'UK Charts', handle: '@UKChartsLive', verified: 'none', avatar: 'U' },
        content: `${playerName} is dominating the airwaves across Europe right now. A true global smash.`,
        likes: 3400,
        retweets: 540,
        replies: 22,
        time: '11h',
        isPlayer: false
      });
    }

    // Random fan
    const randomFanMessages = [
      `thinking about ${playerName}... they need to drop the album right now 😭`,
      `if ${playerHandle} has a million fans, I am one of them. if they have one fan, it's me.`,
      `listening to ${playerName} making me feel like i'm floating rn ✨`,
      `how does ${playerHandle} never miss?? literally every song is a bop`
    ];
    generatedTweets.push({
      id: '3',
      author: { name: 'Sarah', handle: '@sarahlovesmusic', verified: 'blue', avatar: 'S' },
      content: randomFanMessages[Math.floor(gameState.time.daysPassed % randomFanMessages.length)],
      likes: Math.floor(followerCount * 0.005) + 12,
      retweets: 5,
      replies: 2,
      time: '6h',
      isPlayer: false
    });

    // Random Hater
    const haterMessages = [
      `who even listens to ${playerHandle} unironically? industry plant confirmed.`,
      `overrated... people hype up ${playerName} for absolutely nothing.`,
      `flop era incoming for ${playerHandle} 🥱`,
      `${playerName}'s discography is literally all skips.`
    ];
    generatedTweets.push({
      id: '4',
      author: { name: 'hater #1', handle: '@dailyhater', verified: 'none', avatar: 'H' },
      content: haterMessages[Math.floor((gameState.time.daysPassed + 1) % haterMessages.length)],
      likes: Math.floor(followerCount * 0.002) + 40,
      retweets: 10,
      replies: 89,
      time: '8h',
      isPlayer: false
    });

    // Player's latest tweet (mocked)
    generatedTweets.push({
      id: '5',
      author: { name: playerName, handle: playerHandle, verified: playerVerifiedType, avatar: gameState.artist?.image ? <img src={gameState.artist.image || undefined} className="w-full h-full object-cover" /> : playerName[0] },
      content: latestRelease ? `thank u for streaming ${latestRelease.title} 🖤` : `working on something special for u guys...`,
      likes: Math.floor(followerCount * 0.02) + 1000,
      retweets: Math.floor(followerCount * 0.008) + 200,
      replies: Math.floor(followerCount * 0.005) + 50,
      time: '1d',
      isPlayer: true
    });

    // Add player's custom tweets
    if (gameState.artist?.socialProfile?.customTweets) {
      const customTweets = gameState.artist.socialProfile.customTweets.map(ct => {
         const daysAgo = gameState.time.daysPassed - ct.date;
         let timeStr = 'Just now';
         if (daysAgo === 0) timeStr = 'Today';
         else if (daysAgo === 1) timeStr = '1d';
         else if (daysAgo > 1) timeStr = `${daysAgo}d`;
         
         return {
            id: ct.id,
            author: { name: playerName, handle: playerHandle, verified: playerVerifiedType, avatar: gameState.artist?.image ? <img src={gameState.artist.image || undefined} className="w-full h-full object-cover" /> : playerName[0] },
            content: ct.content,
            likes: ct.likes,
            retweets: ct.retweets,
            replies: ct.replies,
            time: timeStr,
            isPlayer: true
         };
      });
      generatedTweets.unshift(...customTweets);
    }

    return generatedTweets.sort((a,b) => {
       // if they have standard numerical IDs, preserve numeric order
       const aNum = parseFloat(a.id);
       const bNum = parseFloat(b.id);
       if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
       return 0; // keep custom tweets at top
    }); // just keep order for now
  }, [gameState]);

  const profileTweets = tweets.filter(t => t.author.handle === playerHandle);
  const forYouTweets = tweets;

  const navigateToProfile = (handle: string) => {
    if (handle === playerHandle) {
      setViewingProfile('player');
    } else {
      setViewingProfile(handle);
    }
  };

  if (viewingProfile) {
     const isPlayerProfile = viewingProfile === 'player' || viewingProfile === playerHandle;
     const profileName = isPlayerProfile ? playerName : viewingProfile.substring(1); // naive
     const profileHandle = isPlayerProfile ? playerHandle : viewingProfile;
     const profileFollowers = isPlayerProfile ? followerCount : Math.floor(Math.random() * 5000000);
     const profileTweetsList = tweets.filter(t => t.author.handle === profileHandle);

     return (
       <div className="flex h-full bg-black text-white font-sans max-w-[600px] border-r border-gray-800 border-l mx-auto w-full flex-col">
          <div className="flex items-center gap-6 px-4 py-2 sticky top-0 bg-black/60 backdrop-blur-md z-10">
             <button onClick={() => setViewingProfile(null)} className="p-2 hover:bg-gray-900 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
             </button>
             <div className="flex flex-col">
                <span className="text-xl font-bold leading-tight flex items-center gap-1">
                   {profileName} <VerifiedBadge type={isPlayerProfile ? playerVerifiedType : 'blue'} className="w-5 h-5" />
                </span>
                <span className="text-[13px] text-gray-500 leading-tight">{profileTweetsList.length} posts</span>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto hide-scrollbar">
             <div className="relative">
                <div className="h-32 bg-gradient-to-r from-gray-800 to-gray-600 w-full relative">
                   {isPlayerProfile && gameState.artist?.image && (
                      <div className="absolute inset-0 bg-cover bg-center blur-sm opacity-50" style={{ backgroundImage: `url(${gameState.artist.image})` }}></div>
                   )}
                </div>
                <div className="px-4 pb-4 pt-3 relative">
                   <div className="flex justify-between items-start absolute -top-12 left-4 right-4">
                      <div className="w-24 h-24 rounded-full bg-gray-700 border-4 border-black flex items-center justify-center text-4xl font-bold overflow-hidden">
                         {(isPlayerProfile && gameState.artist?.image) ? (
                            <img src={gameState.artist.image || undefined} className="w-full h-full object-cover" alt="Profile" />
                         ) : (
                            profileName[0]
                         )}
                      </div>
                      {!isPlayerProfile && (
                        <button className="mt-14 px-4 py-1.5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">
                           Follow
                        </button>
                      )}
                      {isPlayerProfile && (
                        <button onClick={() => setIsEditingProfile(true)} className="mt-14 px-4 py-1.5 bg-transparent border border-gray-600 text-white font-bold rounded-full hover:bg-gray-900 transition-colors">
                           Edit profile
                        </button>
                      )}
                   </div>
                   <div className="mt-16">
                      <span className="text-xl font-black block flex items-center gap-1">
                         {profileName} <VerifiedBadge type={isPlayerProfile ? playerVerifiedType : 'blue'} className="w-5 h-5" />
                      </span>
                      <span className="text-[15px] text-gray-500 block">{profileHandle}</span>
                   </div>
                   <div className="mt-3 text-[15px] whitespace-pre-wrap">
                      {isPlayerProfile ? (gameState.artist?.socialProfile?.bio || "Musician. Stream my new music now!") : "Official account."}
                   </div>
                   <div className="flex gap-4 mt-3 text-[14px]">
                      <span className="text-gray-500"><span className="text-white font-bold">0</span> Following</span>
                      <span className="text-gray-500"><span className="text-white font-bold">{profileFollowers.toLocaleString()}</span> Followers</span>
                   </div>
                </div>
             </div>
             <div className="flex border-b border-gray-800">
                <button className="flex-1 hover:bg-gray-900 transition-colors relative">
                   <div className="py-4 text-[15px] font-bold text-white inline-block">
                      Posts
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1 bg-[#1D9BF0] rounded-full"></div>
                   </div>
                </button>
                <button className="flex-1 hover:bg-gray-900 transition-colors text-gray-500 font-medium text-[15px]">Replies</button>
                <button className="flex-1 hover:bg-gray-900 transition-colors text-gray-500 font-medium text-[15px]">Media</button>
             </div>

           <div className="flex flex-col">
              {profileTweetsList.length === 0 && (
                 <div className="py-12 text-center text-gray-500 text-[15px]">
                    No posts yet.
                 </div>
              )}
              {profileTweetsList.map(t => <Tweet key={t.id} tweet={t} onProfileClick={navigateToProfile} />)}
           </div>
        </div>

        {isEditingProfile && (
           <div className="fixed inset-0 bg-white/10 flex items-center justify-center z-50 p-4">
              <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col">
                 <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <div className="flex items-center gap-6">
                       <button onClick={() => setIsEditingProfile(false)} className="hover:bg-gray-900 p-2 -ml-2 rounded-full transition-colors">
                          <ArrowLeft className="w-5 h-5" />
                       </button>
                       <span className="text-xl font-bold">Edit profile</span>
                    </div>
                    <button onClick={handleSaveProfile} className="bg-white text-black font-bold px-4 py-1.5 rounded-full hover:bg-gray-200">
                       Save
                    </button>
                 </div>
                 <div className="p-4 flex flex-col gap-4">
                    <div>
                       <label className="text-sm text-gray-400 block mb-1">Bio</label>
                       <textarea 
                          value={editBio} 
                          onChange={(e) => setEditBio(e.target.value)} 
                          className="w-full bg-transparent border border-gray-700 rounded p-3 text-white h-24 focus:outline-none focus:border-[#1D9BF0]" 
                       ></textarea>
                    </div>
                 </div>
              </div>
           </div>
        )}
     </div>
   );
  }

  return (
    <div className="flex h-full bg-black text-white font-sans w-full justify-center overflow-hidden">
        {/* LEFT NAV (Desktop) */}
        <div className="hidden lg:flex flex-col w-[275px] pt-4 px-4 gap-6 items-end pr-8">
            <div className="w-full max-w-[200px]">
               <svg viewBox="0 0 24 24" aria-hidden="true" className="w-8 h-8 fill-white ml-3 mb-6"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg>
               <div className="flex flex-col gap-2">
                   <button onClick={() => { setActiveTab('foryou'); setViewingProfile(null); }} className="flex items-center gap-4 p-3 hover:bg-gray-900 rounded-full text-xl font-bold transition-colors w-max"><div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center">H</div> Home</button>
                   <button onClick={() => setViewingProfile('player')} className="flex items-center gap-4 p-3 hover:bg-gray-900 rounded-full text-xl font-medium transition-colors w-max"><div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center">P</div> Profile</button>
                   <button onClick={onClose} className="flex items-center gap-4 p-3 hover:bg-gray-900 rounded-full text-xl font-medium text-gray-400 hover:text-white transition-colors w-max mt-4"><ArrowLeft className="w-6 h-6" /> Back to Game</button>
               </div>
            </div>
        </div>

        {/* FEED */}
        <div className="flex flex-col w-full max-w-[600px] border-x border-gray-800 h-full relative">
           {/* Main Header */}
           <div className="sticky top-0 bg-black/60 backdrop-blur-md z-10 border-b border-gray-800">
             <div className="flex lg:hidden items-center justify-between p-3">
                 <button onClick={onClose} className="p-2 hover:bg-gray-900 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                 </button>
                 <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6 fill-white"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg>
                 <div className="w-9" /> {/* Spacer for centering */}
             </div>
             <div className="flex h-[53px]">
                <button 

              onClick={() => setActiveTab('foryou')}
              className="flex-1 flex justify-center hover:bg-white/[0.03] transition-colors cursor-pointer relative"
            >
               <div className={`flex items-center h-full px-2 font-bold text-[15px] ${activeTab === 'foryou' ? 'text-white' : 'text-gray-500 font-medium'}`}>
                 For you
                 {activeTab === 'foryou' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1D9BF0] rounded-full"></div>}
               </div>
            </button>
            <button 
              onClick={() => setViewingProfile('player')}
              className="flex-1 flex justify-center hover:bg-white/[0.03] transition-colors cursor-pointer relative"
            >
               <div className={`flex items-center h-full px-2 font-bold text-[15px] ${activeTab === 'profile' ? 'text-white' : 'text-gray-500 font-medium'}`}>
                 Profile
                 {activeTab === 'profile' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1D9BF0] rounded-full"></div>}
               </div>
            </button>
         </div>
       </div>

       {/* Composer */}
       <div className="flex gap-3 p-4 border-b border-gray-800">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex shrink-0 items-center justify-center font-bold text-lg cursor-pointer flex-shrink-0 overflow-hidden" onClick={() => setViewingProfile('player')}>
             {gameState.artist?.image ? <img src={gameState.artist.image || undefined} className="w-full h-full object-cover" /> : playerName[0]}
          </div>
          <div className="flex-1 flex flex-col pt-1.5">
             <input 
                type="text" 
                placeholder="What is happening?!" 
                className="bg-transparent border-none outline-none text-xl placeholder:text-gray-500 mb-4 text-white" 
                value={newTweetContent}
                onChange={(e) => setNewTweetContent(e.target.value)}
                onKeyDown={(e) => {
                   if (e.key === 'Enter') handlePostTweet();
                }}
             />
             {newTweetImage && (
                <div className="relative mb-4">
                   <img src={newTweetImage || undefined} className="w-full max-h-[300px] object-cover rounded-2xl border border-gray-800" />
                   <button onClick={() => setNewTweetImage(null)} className="absolute top-2 right-2 bg-black/60 p-2 rounded-full hover:bg-black/80 transition-colors">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"></path></svg>
                   </button>
                </div>
             )}
             <div className="flex justify-between items-center pt-3 border-t border-gray-800">
                <div className="flex gap-4 text-[#1D9BF0]">
                   <label className="hover:bg-[#1D9BF0]/10 p-2 -m-2 rounded-full transition-colors cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                              try {
                                 const { compressImage } = await import('../imageUtils');
                                 const compressed = await compressImage(file, 400, 400, 0.7);
                                 setNewTweetImage(compressed);
                              } catch(err) {
                                  console.error(err);
                              }
                          }
                      }} />
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="w-[20px] h-[20px] fill-current"><g><path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"></path></g></svg>
                   </label>
                   <button className="hover:bg-[#1D9BF0]/10 p-2 -m-2 rounded-full transition-colors hidden sm:block">
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="w-[20px] h-[20px] fill-current"><g><path d="M11.96 14.945c-.067 0-.136-.01-.203-.027-1.13-.318-2.097-.986-2.795-1.932-.832-1.125-1.176-2.508-.968-3.893s.942-2.605 2.068-3.438l3.53-2.608c2.322-1.716 5.61-1.224 7.33 1.1.83 1.127 1.175 2.51.967 3.895s-.943 2.605-2.07 3.439l-1.48 1.094c-.333.246-.804.175-1.05-.158-.246-.334-.176-.804.158-1.05l1.48-1.095c.803-.592 1.327-1.463 1.476-2.45.148-.988-.098-1.975-.69-2.778-1.225-1.656-3.572-2.01-5.23-.784l-3.53 2.608c-.802.593-1.326 1.464-1.475 2.45-.15.99.097 1.975.69 2.778.498.675 1.187 1.15 1.992 1.377.4.114.633.528.52.928-.092.33-.394.547-.722.547z"></path><path d="M7.27 22.054c-1.61 0-3.197-.735-4.225-2.125-.832-1.127-1.176-2.51-.968-3.894s.943-2.605 2.07-3.438l1.478-1.094c.334-.245.805-.175 1.05.158s.177.804-.157 1.05l-1.48 1.095c-.803.593-1.326 1.464-1.475 2.45-.148.99.097 1.975.69 2.778 1.225 1.657 3.57 2.01 5.23.785l3.528-2.608c.803-.593 1.326-1.464 1.475-2.45.148-.99-.097-1.975-.69-2.778-.498-.674-1.188-1.15-1.992-1.376-.4-.113-.633-.527-.52-.927.115-.4.528-.63.928-.522 1.13.318 2.096.986 2.794 1.932.833 1.126 1.176 2.508.968 3.893s-.942 2.605-2.068 3.438l-3.53 2.608c-.933.693-2.023 1.026-3.105 1.026z"></path></g></svg>
                   </button>
                   <button className="hover:bg-[#1D9BF0]/10 p-2 -m-2 rounded-full transition-colors hidden sm:block">
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="w-[20px] h-[20px] fill-current"><g><path d="M2.5 7.252a2 2 0 0 1 2-2h15a2 2 0 0 1 2 2v2.496H2.5V7.252zM21.5 16.748a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2v-4.996h19v4.996zm-19-10.996c0-.276.224-.5.5-.5h15c.276 0 .5.224.5.5v.748H2.5v-.748zM2 11.252h20v5.496c0 .827-.673 1.5-1.5 1.5h-15c-.827 0-1.5-.673-1.5-1.5v-5.496zm3.5 2.248a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"></path></g></svg>
                   </button>
                </div>
                <button 
                  onClick={handlePostTweet}
                  disabled={!newTweetContent.trim() && !newTweetImage}
                  className="bg-[#1D9BF0] hover:bg-[#1a8cd8] text-white font-bold py-1.5 px-4 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   Post
                </button>
             </div>
          </div>
       </div>

       {/* Feed */}
       <div className="flex-1 overflow-y-auto hide-scrollbar">
         {activeTab === 'foryou' && forYouTweets.map(tweet => (
           <Tweet key={tweet.id} tweet={tweet} onProfileClick={navigateToProfile} />
         ))}
       </div>
    </div>

    {/* RIGHT SIDEBAR (Desktop) */}
    <div className="hidden lg:flex flex-col w-[350px] pl-8 pt-4">
        <div className="bg-[#16181c] rounded-2xl p-4 mb-4">
            <h2 className="text-xl font-extrabold mb-4">What's happening</h2>
            <div className="flex flex-col pb-2 gap-5">
               <div>
                   <div className="text-[13px] text-gray-500 flex justify-between"><span>Music · Trending</span> <span>...</span></div>
                   <div className="font-bold">{playerName}</div>
                   <div className="text-[13px] text-gray-500">{Math.floor(followerCount * 0.4).toLocaleString()} posts</div>
               </div>
               <div>
                   <div className="text-[13px] text-gray-500 flex justify-between"><span>Charts · Trending</span> <span>...</span></div>
                   <div className="font-bold">Hot 100 Predictions</div>
                   <div className="text-[13px] text-gray-500">24.5K posts</div>
               </div>
               <div>
                   <div className="text-[13px] text-gray-500 flex justify-between"><span>Pop · Trending</span> <span>...</span></div>
                   <div className="font-bold">Top 10</div>
                   <div className="text-[13px] text-gray-500">18.2K posts</div>
               </div>
            </div>
        </div>
        <div className="text-[13px] text-gray-500 px-4">
            Terms of Service Privacy Policy Cookie Policy Accessibility Ads info More © 2026 X Corp.
        </div>
    </div>

  </div>
  );
}
