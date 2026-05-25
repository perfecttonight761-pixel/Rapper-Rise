import { TikTokProfile, TikTokPost, TikTokSound, Release } from './types';

export function processTikTokDaily(
    profile: TikTokProfile | undefined,
    releases: Release[],
    artistPop: number // average pop
): { updatedProfile: TikTokProfile; tikTokStreamsDelta: Record<string, number> } | null {
    if (!profile) return null;

    let newProfile = JSON.parse(JSON.stringify(profile)) as TikTokProfile;
    const streamsDelta: Record<string, number> = {};

    let totalViewsGenerated = 0;
    
    // Process Posts
    newProfile.posts = newProfile.posts.map(post => {
        if (post.status === 'Decline Phase' || post.status === 'Long Tail Phase') {
            let soundMultiplier = 1.0;
            if (post.songId) {
                const sound = newProfile.sounds.find(s => s.songId === post.songId);
                if (sound) {
                    switch(sound.trendingStatus as any) {
                        case 'TikTok Trend': soundMultiplier = 1.5; break;
                        case 'Hits': soundMultiplier = 4.0; break;
                        case 'Mega Hits': soundMultiplier = 15.0; break;
                        case 'Non Trend':
                        default: soundMultiplier = 0.5; break;
                    }
                } else {
                    soundMultiplier = 0.5;
                }
            } else {
                soundMultiplier = 0.5;
            }

            post.algorithmScore *= (0.7 + Math.random() * 0.2); // Decay score
            
            const popMultiplier = Math.pow(Math.max(1, artistPop) / 10, 3);
            const basePotentialViews = ((newProfile.followers * 0.3) + (popMultiplier * 25000)) * soundMultiplier;
            let viewsMultiplier = Math.max(0.001, post.algorithmScore * 0.2); // Never fully zero
            
            let dailyViews = Math.floor(basePotentialViews * viewsMultiplier * (0.5 + Math.random() * 0.5));
            
            // At least standard long tail based on following
            if (dailyViews < newProfile.followers * 0.002 + 10) {
                dailyViews = Math.floor(newProfile.followers * 0.002 * (0.8 + Math.random()*0.4)) + Math.floor(Math.random() * 10);
            }

            // Rare spike
            if (Math.random() < 0.01) {
                dailyViews *= (2 + Math.random() * 3);
            }

            post.views += dailyViews;
            
            const dailyLikes = Math.floor(dailyViews * (0.05 + Math.random() * 0.05));
            const dailyComments = Math.floor(dailyViews * (0.002 + Math.random() * 0.005));
            const dailySaves = Math.floor(dailyViews * (0.01 + Math.random() * 0.02));
            const dailyShares = Math.floor(dailyViews * (0.005 + Math.random() * 0.01));

            post.likes += dailyLikes;
            post.comments += dailyComments;
            post.saves += dailySaves;
            post.shares += dailyShares;
            
            newProfile.totalLikes += dailyLikes;
            totalViewsGenerated += dailyViews;

            if (post.algorithmScore < 0.05) {
                post.status = 'Long Tail Phase';
            } else {
                post.status = 'Decline Phase';
            }
            return post;
        }

        // Active phases
        let viewsMultiplier = 1;
        if (post.status === 'Initial Push') viewsMultiplier = 0.05;
        if (post.status === 'Testing Phase') viewsMultiplier = 0.15;
        if (post.status === 'Expansion Phase') viewsMultiplier = 0.4;
        if (post.status === 'Viral Phase') viewsMultiplier = 1.0;

        let soundMultiplier = 1.0;
        if (post.songId) {
            const sound = newProfile.sounds.find(s => s.songId === post.songId);
            if (sound) {
                switch(sound.trendingStatus as any) {
                    case 'TikTok Trend': soundMultiplier = 1.5; break;
                    case 'Hits': soundMultiplier = 4.0; break;
                    case 'Mega Hits': soundMultiplier = 15.0; break;
                    case 'Non Trend':
                    default: soundMultiplier = 0.5; break;
                }
            } else {
                soundMultiplier = 0.5;
            }
        } else {
            soundMultiplier = 0.5;
        }

        const popMultiplier = Math.pow(Math.max(1, artistPop) / 10, 3); // 100 pop = 1000 multiplier
        const baseViews = ((newProfile.followers * 0.3) + (popMultiplier * 25000)) * soundMultiplier; 
        let dailyViews = Math.floor(baseViews * viewsMultiplier * post.algorithmScore * (0.8 + Math.random() * 0.4));
        
        // Random viral explosion
        let viralChance = 0.02;
        if (soundMultiplier >= 4.0) viralChance += 0.05; // Hits and Mega Hits
        if (artistPop >= 80) viralChance += 0.03;
        if (post.algorithmScore > 1.2 && Math.random() < viralChance) {
            dailyViews *= (3 + Math.random() * 5); // Massive viral spike
        }

        post.views += dailyViews;
        const dailyLikes = Math.floor(dailyViews * (0.05 + Math.random() * 0.1));
        const dailyComments = Math.floor(dailyViews * (0.005 + Math.random() * 0.015));
        const dailySaves = Math.floor(dailyViews * (0.02 + Math.random() * 0.04));
        const dailyShares = Math.floor(dailyViews * (0.01 + Math.random() * 0.03));

        post.likes += dailyLikes;
        post.comments += dailyComments;
        post.saves += dailySaves;
        post.shares += dailyShares;
        
        newProfile.totalLikes += dailyLikes;
        totalViewsGenerated += dailyViews;

        // Progress status
        if (post.status === 'Initial Push') post.status = 'Testing Phase';
        else if (post.status === 'Testing Phase') post.status = 'Expansion Phase';
        else if (post.status === 'Expansion Phase') post.status = 'Viral Phase';
        else if (post.status === 'Viral Phase') post.status = 'Decline Phase';

        // Add streams to song
        if (post.songId) {
            streamsDelta[post.songId] = (streamsDelta[post.songId] || 0) + Math.floor(dailyViews * 0.02);
            
            // Increment sound usage slightly
            const sound = newProfile.sounds.find(s => s.songId === post.songId);
            if (sound) {
                const usedGained = Math.floor(dailyViews * 0.005);
                sound.usedInVideos += usedGained;
                sound.viewsGenerated += dailyViews;
            }
        }

        return post;
    });

    // Process campaigns and sounds
    newProfile.sounds = newProfile.sounds.map(sound => {
        // Handle active campaign
        if (sound.campaign && sound.campaign.active) {
            if (sound.campaign.daysRemaining > 0) {
                sound.campaign.daysRemaining--;
                
                const factor = sound.campaign.regionsPromoted || 1;
                const campaignViews = (1000 + factor * 2000) * (0.8 + Math.random() * 0.4);
                const campaignUses = (10 + factor * 20) * (0.8 + Math.random() * 0.4);

                sound.viewsGenerated += Math.floor(campaignViews);
                sound.usedInVideos += Math.floor(campaignUses);
            } else {
                sound.campaign.active = false;
                
                // Evaluate result
                const regions = sound.campaign.regionsPromoted || 1;
                let roll = Math.random();
                let newStatus: typeof sound.trendingStatus = 'Non Trend';
                if (regions >= 10 && roll < 0.05) newStatus = 'Mega Hits';
                else if (regions >= 5 && roll < 0.15) newStatus = 'Hits';
                else if (sound.trendingStatus === 'Hits' && roll < 0.02) newStatus = 'Mega Hits';
                else if (regions >= 1 && roll < 0.8) newStatus = 'TikTok Trend';

                // Only upgrade status
                if (sound.trendingStatus === 'Non Trend' || 
                   (sound.trendingStatus === 'TikTok Trend' && (newStatus === 'Hits' || newStatus === 'Mega Hits')) ||
                   (sound.trendingStatus === 'Hits' && newStatus === 'Mega Hits') ) {
                     sound.trendingStatus = newStatus;
                }
            }
        }

        // Natural growth for sounds based on trendingStatus
        let dailyUses = 0;
        let dailySoundViews = 0;
        
        switch (sound.trendingStatus as any) {
            case 'TikTok Trend': dailyUses = 50; dailySoundViews = 25000; break;
            case 'Hits': dailyUses = 800; dailySoundViews = 150000; break;
            case 'Mega Hits': dailyUses = 4000; dailySoundViews = 1500000; break;
            case 'Non Trend': 
            default: 
                dailyUses = Math.floor(Math.random() * 5); 
                dailySoundViews = dailyUses * 50; 
                if(!['Non Trend', 'TikTok Trend', 'Hits', 'Mega Hits'].includes(sound.trendingStatus)) {
                    sound.trendingStatus = 'Non Trend';
                }
                break;
        }

        // Apply fatigue (slowly dies down)
        if (sound.trendingStatus !== 'Non Trend' && Math.random() < 0.04 && !sound.campaign?.active) {
            if (sound.trendingStatus === 'Mega Hits') sound.trendingStatus = 'Hits';
            else if (sound.trendingStatus === 'Hits') sound.trendingStatus = 'TikTok Trend';
            else if (sound.trendingStatus === 'TikTok Trend') sound.trendingStatus = 'Non Trend';
        }

        sound.usedInVideos += Math.floor(dailyUses * (0.8 + Math.random() * 0.4));
        sound.viewsGenerated += Math.floor(dailySoundViews * (0.8 + Math.random() * 0.4));
        
        let streams = 0;
        if (sound.trendingStatus === 'TikTok Trend') streams = Math.floor(dailySoundViews * 0.05);
        else if (sound.trendingStatus === 'Hits') streams = Math.floor(dailySoundViews * 0.1); 
        else if (sound.trendingStatus === 'Mega Hits') streams = Math.floor(dailySoundViews * 0.15);
        else streams = Math.floor(dailySoundViews * 0.01);
        
        streamsDelta[sound.songId] = (streamsDelta[sound.songId] || 0) + streams;

        return sound;
    });

    // Followers growth based on total views today + organic base
    let dailyFollowerGain = 0;
    if (totalViewsGenerated > 0) {
        // Follower growth curve: harder as you get bigger
        let conversionRate = 0.05; // 5% base
        // Scale down conversion based on current followers
        if (newProfile.followers >= 100000000) conversionRate = 0.0001;
        else if (newProfile.followers >= 50000000) conversionRate = 0.0002;
        else if (newProfile.followers > 10000000) conversionRate = 0.0005; // 0.05%
        else if (newProfile.followers > 5000000) conversionRate = 0.001;
        else if (newProfile.followers > 1000000) conversionRate = 0.002; // 0.2%
        else if (newProfile.followers > 500000) conversionRate = 0.005;
        else if (newProfile.followers > 100000) conversionRate = 0.01; // 1%
        else if (newProfile.followers > 10000) conversionRate = 0.02;

        if (artistPop >= 90) conversionRate *= 2.5; // Famous artists scale faster
        else if (artistPop >= 70) conversionRate *= 1.5;

        dailyFollowerGain = Math.floor(totalViewsGenerated * conversionRate * (0.5 + Math.random()));
    }
    
    // Organic growth/decay
    let passiveGrowth = Math.floor(newProfile.followers * 0.0005 * (0.5 + Math.random()));
    if (artistPop >= 80) {
        passiveGrowth += Math.floor(2000 + Math.random() * 3000); // Famous artists get tons of free passive followers
    } else if (artistPop >= 50) {
        passiveGrowth += Math.floor(500 + Math.random() * 1000);
    }

    if (totalViewsGenerated < newProfile.followers * 0.01) {
        // Less than 1% activity = slight decay or tiny growth
        if (Math.random() < 0.3) {
            dailyFollowerGain -= Math.floor(newProfile.followers * 0.001); 
        } else {
            dailyFollowerGain += Math.floor(passiveGrowth * 0.1);
        }
    } else {
        dailyFollowerGain += passiveGrowth;
    }
    
    // Hard floor at 0
    newProfile.followers = Math.max(0, newProfile.followers + dailyFollowerGain);
    
    // Check verification
    if ((newProfile.followers >= 100000 || artistPop >= 60) && !newProfile.isVerified) {
        newProfile.isVerified = true;
    }
    
    // Fatigue recovery
    if (newProfile.fatigueScore > 0) {
        newProfile.fatigueScore = Math.max(0, newProfile.fatigueScore - 2);
    }

    return { updatedProfile: newProfile, tikTokStreamsDelta: streamsDelta };
}
