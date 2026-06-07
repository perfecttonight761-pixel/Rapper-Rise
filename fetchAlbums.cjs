const fs = require('fs');
const https = require('https');

const NPC_ARTISTS = [
  "Taylor Swift", "Ariana Grande", "Billie Eilish", "Olivia Rodrigo", "The Weeknd",
  "Drake", "Ed Sheeran", "Bruno Mars", "Justin Bieber", "Dua Lipa", "Post Malone", "Doja Cat",
  "SZA", "Bad Bunny", "Rihanna", "Eminem", "Kanye West", "Kendrick Lamar", "J. Cole", "Travis Scott",
  "Future", "21 Savage", "Lil Baby", "Lil Uzi Vert", "Jack Harlow", "Megan Thee Stallion",
  "Cardi B", "Nicki Minaj", "Rosalía", "Karol G", "Shakira", "J Balvin", "Maluma", "Daddy Yankee",
  "BLACKPINK", "BTS", "NewJeans", "Stray Kids", "TWICE", "SEVENTEEN", "TXT", "ENHYPEN", "LE SSERAFIM",
  "Peso Pluma", "Feid", "Bizarrap", "Miley Cyrus", "Katy Perry", "Lady Gaga", "Snoop Dogg"
];

const fetchJson = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
            });
        }).on('error', reject);
    });
};

async function processArtist(artist, result) {
    try {
        const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=album&limit=3`;
        const albumData = await fetchJson(searchUrl);
        
        const albums = [];
        const tracks = [];
        
        if (albumData && albumData.results) {
            for (let alb of albumData.results) {
                if (alb.artistName.toLowerCase().includes(artist.toLowerCase().split(' ')[0])) {
                    albums.push({
                        title: alb.collectionName,
                        cover: alb.artworkUrl100 ? alb.artworkUrl100.replace('100x100bb', '1000x1000bb') : ''
                    });
                    
                    const trackUrl = `https://itunes.apple.com/lookup?id=${alb.collectionId}&entity=song`;
                    const trackData = await fetchJson(trackUrl);
                    
                    if (trackData && trackData.results) {
                        for (let t of trackData.results) {
                            if (t.wrapperType === 'track') {
                                tracks.push({
                                    title: t.trackName,
                                    cover: alb.artworkUrl100 ? alb.artworkUrl100.replace('100x100bb', '1000x1000bb') : '',
                                    albumName: alb.collectionName
                                });
                            }
                        }
                    }
                }
            }
        }
        
        if (albums.length > 0) {
            result[artist] = { albums, tracks };
        }
    } catch (err) {
        console.error(`Failed ${artist}: ${err.message}`);
    }
}

async function main() {
    let result = {};
    const batches = [];
    const batchSize = 10;
    
    for (let i = 0; i < NPC_ARTISTS.length; i += batchSize) {
        const batch = NPC_ARTISTS.slice(i, i + batchSize);
        await Promise.all(batch.map(artist => processArtist(artist, result)));
    }
    
    fs.writeFileSync('src/artistDiscography.ts', 'export const ARTIST_DISCOGRAPHY: Record<string, any> = ' + JSON.stringify(result, null, 2) + ';\n');
    console.log("Done fetching!");
}

main();
