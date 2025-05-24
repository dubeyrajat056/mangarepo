const express = require('express');
const axios = require('axios');
const ejs = require('ejs');
const path = require('path');

const app = express();

// Configuration
const PORT = 3000; // Direct port configuration
const MANGA_DEX_API = 'https://api.mangadex.org';
const ANILIST_API = 'https://graphql.anilist.co';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', async (req, res) => {
    try {
        const response = await axios.get(`${MANGA_DEX_API}/manga`, {
            params: {
                limit: 20,
                order: { followedCount: 'desc' },
                includes: ['cover_art']
            }
        });
        
        const mangaList = await Promise.all(response.data.data.map(async manga => {
            const thumbnail = await getAniListThumbnail(manga);
            return {
                id: manga.id,
                title: getTitle(manga),
                description: manga.attributes.description?.en || 'No description available',
                thumbnail: thumbnail || getMangaDexCover(manga)
            };
        }));
        
        res.render('index', { 
            mangaList,
            searchQuery: '',
            isHome: true
        });
    } catch (error) {
        console.error('Error fetching manga:', error);
        res.status(500).send('Error loading manga');
    }
});

app.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.redirect('/');
        
        const response = await axios.get(`${MANGA_DEX_API}/manga`, {
            params: {
                title: query,
                limit: 20,
                includes: ['cover_art']
            }
        });
        
        const mangaList = await Promise.all(response.data.data.map(async manga => {
            const thumbnail = await getAniListThumbnail(manga);
            return {
                id: manga.id,
                title: getTitle(manga),
                description: manga.attributes.description?.en || 'No description available',
                thumbnail: thumbnail || getMangaDexCover(manga)
            };
        }));
        
        res.render('index', { 
            mangaList,
            searchQuery: query,
            isHome: false
        });
    } catch (error) {
        console.error('Error searching manga:', error);
        res.status(500).send('Error searching manga');
    }
});

app.get('/manga/:id', async (req, res) => {
    try {
        const mangaId = req.params.id;
        
        const mangaResponse = await axios.get(`${MANGA_DEX_API}/manga/${mangaId}`, {
            params: { includes: ['cover_art', 'author'] }
        });
        
        const chaptersResponse = await axios.get(`${MANGA_DEX_API}/manga/${mangaId}/feed`, {
            params: {
                limit: 100,
                order: { chapter: 'asc' },
                translatedLanguage: ['en']
            }
        });
        
        const manga = mangaResponse.data.data;
        const thumbnail = await getAniListThumbnail(manga);
        
        res.render('manga', {
            manga: {
                id: manga.id,
                title: getTitle(manga),
                description: manga.attributes.description?.en || 'No description available',
                thumbnail: thumbnail || getMangaDexCover(manga),
                author: manga.relationships.find(r => r.type === 'author')?.attributes?.name || 'Unknown',
                status: manga.attributes.status,
                chapters: chaptersResponse.data.data.map(chapter => ({
                    id: chapter.id,
                    title: chapter.attributes.title || `Chapter ${chapter.attributes.chapter}`,
                    chapter: chapter.attributes.chapter,
                    volume: chapter.attributes.volume
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching manga details:', error);
        res.status(500).send('Error loading manga details');
    }
});

app.get('/chapter/:id', async (req, res) => {
    try {
        const chapterId = req.params.id;
        
        const chapterResponse = await axios.get(`${MANGA_DEX_API}/at-home/server/${chapterId}`);
        const chapterInfo = await axios.get(`${MANGA_DEX_API}/chapter/${chapterId}`, {
            params: { includes: ['manga'] }
        });
        
        const mangaId = chapterInfo.data.data.relationships.find(r => r.type === 'manga').id;
        const mangaResponse = await axios.get(`${MANGA_DEX_API}/manga/${mangaId}`);
        
        res.render('chapter', {
            chapter: {
                id: chapterId,
                title: chapterInfo.data.data.attributes.title || `Chapter ${chapterInfo.data.data.attributes.chapter}`,
                pages: chapterResponse.data.chapter.data.map((page, i) => ({
                    url: `${chapterResponse.data.baseUrl}/data/${chapterResponse.data.chapter.hash}/${page}`,
                    number: i + 1
                })),
                mangaTitle: getTitle(mangaResponse.data.data)
            }
        });
    } catch (error) {
        console.error('Error fetching chapter:', error);
        res.status(500).send('Error loading chapter');
    }
});

// Helper functions
function getTitle(manga) {
    return manga.attributes.title.en || 
           Object.values(manga.attributes.title)[0] || 
           'Untitled Manga';
}

function getMangaDexCover(manga) {
    const coverArt = manga.relationships.find(r => r.type === 'cover_art');
    if (coverArt) {
        return `https://uploads.mangadex.org/covers/${manga.id}/${coverArt.attributes.fileName}.256.jpg`;
    }
    return null;
}

async function getAniListThumbnail(manga) {
    try {
        const title = getTitle(manga);
        const query = `
            query ($search: String) {
                Media(search: $search, type: MANGA) {
                    coverImage {
                        large
                    }
                }
            }
        `;
        
        const response = await axios.post(ANILIST_API, {
            query,
            variables: { search: title }
        });
        
        return response.data.data.Media?.coverImage?.large || null;
    } catch (error) {
        console.error('Error fetching AniList thumbnail:', error);
        return null;
    }
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});