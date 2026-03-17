/*
// pages/api/spotify.js
import { getAppAccessToken, spotifyFetch } from '../../lib/spotify'


export default async function handler(req, res) {
try {
const { artistId } = req.query
if (!artistId) return res.status(400).json({ error: 'artistId required' })


const token = await getAppAccessToken()


// 1) Get all albums (albums, singles, appears_on)
// We'll page through results for completeness.
async function fetchAllAlbums() {
let albums = []
let url = `/artists/${artistId}/albums?include_groups=album,single,appears_on&limit=50`
while (url) {
const data = await spotifyFetch(url, token)
albums = albums.concat(data.items)
url = null
if (data.next) {
// Spotify 'next' is a full URL; convert to path relative to /v1
const u = new URL(data.next)
url = u.pathname + u.search
}
}
// Deduplicate albums by id (Spotify can return duplicates for different markets)
const uniq = []
const seen = new Set()
for (const a of albums) {
if (!seen.has(a.id)) {
seen.add(a.id)
uniq.push(a)
}
}
return uniq
}


const albums = await fetchAllAlbums()


// 2) For each album fetch tracks
const tracks = []
for (const album of albums) {
const data = await spotifyFetch(`/albums/${album.id}/tracks?limit=50`, token)
for (const t of data.items) {
tracks.push({
id: t.id,
name: t.name,
album: { id: album.id, name: album.name, image: album.images?.[0]?.url || null },
preview_url: t.preview_url,
external_urls: t.external_urls,
artists: t.artists,
})
}
}


// return flattened tracks
res.status(200).json({ tracks })
} catch (err) {
console.error(err)
res.status(500).json({ error: err.message || err })
}
}
*/



/*
// pages/api/spotify.js
import { getAppAccessToken, spotifyFetch } from '../../lib/spotify'

async function fetchAllAlbums(artistId, token) {
  let albums = []
  let url = `/artists/${artistId}/albums?include_groups=album,single,appears_on,compilation&limit=50`
  while (url) {
    const data = await spotifyFetch(url, token)
    albums.push(...data.items)
    url = data.next ? data.next.replace('https://api.spotify.com/v1', '') : null
  }
  // Remove duplicates by album name
  const seen = new Set()
  return albums.filter(a => {
    const key = a.name.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function fetchAllTracks(albums, token) {
  const tracks = []
  for (const album of albums) {
    const data = await spotifyFetch(`/albums/${album.id}/tracks?limit=50`, token)
    tracks.push(...data.items.map(t => ({ ...t, album })))
  }
  return tracks
}

export default async function handler(req, res) {
  try {
    const { artistId } = req.query
    if (!artistId) return res.status(400).json({ error: 'artistId required' })

    const token = await getAppAccessToken()
    console.log('Fetching albums for', artistId)
    const albums = await fetchAllAlbums(artistId, token)
    console.log(`Fetched ${albums.length} albums`)
    const tracks = await fetchAllTracks(albums, token)
    console.log(`Fetched ${tracks.length} tracks`)

    res.status(200).json({ albums, tracks })
  } catch (err) {
    console.error('API error:', err)
    res.status(500).json({ error: err.message || err })
  }
}
*/




import { getAppAccessToken, spotifyFetch } from '../../lib/spotify'

// Fetch a page of albums, used internally
async function fetchAlbumPage(artistId, token, offset = 0) {
  const url = `/artists/${artistId}/albums?include_groups=album,single,compilation&limit=50&offset=${offset}`;
  const data = await spotifyFetch(url, token);
  return data;
}

// Instead of fetching all albums, fetch a random album lazily
async function fetchAllAlbums(artistId, token) {
  // Fetch first page to get total albums
  const firstPage = await fetchAlbumPage(artistId, token);
  const totalAlbums = firstPage.total;

  // Pick a random album
  const randomIndex = Math.floor(Math.random() * totalAlbums);
  const pageOffset = Math.floor(randomIndex / 50) * 50;
  const pageIndex = randomIndex % 50;

  // Fetch the page containing the random album
  const page = pageOffset === 0 ? firstPage : await fetchAlbumPage(artistId, token, pageOffset);
  const album = page.items[pageIndex];

  return [album]; // return as array to match previous return type
}

// Instead of fetching all tracks, fetch tracks only for the random album
async function fetchAllTracks(albums, token, savedTrackIds = new Set()) {
  const tracks = [];
  for (const album of albums) {
    const data = await spotifyFetch(`/albums/${album.id}/tracks?limit=50`, token);
    // Pick a random track that isn’t in savedTrackIds
    const availableTracks = data.items.filter(t => !savedTrackIds.has(t.id));
    if (availableTracks.length === 0) continue;
    const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
    tracks.push({ ...randomTrack, album });
  }
  return tracks;
}

export default async function handler(req, res) {
  try {
    const { artistId } = req.query;
    if (!artistId) return res.status(400).json({ error: 'artistId required' });

    const token = await getAppAccessToken();
    console.log('Fetching albums for', artistId);

    // Fetch random album only
    const albums = await fetchAllAlbums(artistId, token);
    console.log(`Fetched ${albums.length} album(s)`);

    // Fetch random track from that album
    // Assume you have a list of saved track IDs somewhere, empty set for example
    const savedTrackIds = new Set(); 
    const tracks = await fetchAllTracks(albums, token, savedTrackIds);
    console.log(`Fetched ${tracks.length} track(s)`);

    res.status(200).json({ albums, tracks });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message || err });
  }
}

