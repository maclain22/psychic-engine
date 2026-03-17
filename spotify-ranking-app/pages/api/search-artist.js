/*
// pages/api/search-artist.js
import { getAppAccessToken, spotifyFetch } from '../../lib/spotify'


export default async function handler(req, res) {
try {
const { name } = req.query
if (!name) return res.status(400).json({ error: 'name required' })
const token = await getAppAccessToken()
const data = await spotifyFetch(`/search?q=${encodeURIComponent(name)}&type=artist&limit=1`, token)
const artist = data.artists.items[0] || null
res.status(200).json({ artist })
} catch (err) {
console.error(err)
res.status(500).json({ error: err.message || err })
}
}
*/

// pages/api/search-artist.js
import { getAppAccessToken, spotifyFetch } from '../../lib/spotify'

export default async function handler(req, res) {
  try {
    const { name } = req.query
    if (!name) return res.status(400).json({ error: 'Missing name parameter' })

    const token = await getAppAccessToken()
    const data = await spotifyFetch(`/search?q=${encodeURIComponent(name)}&type=artist&limit=10`, token)

    const artists = data.artists.items.map(a => ({
      id: a.id,
      name: a.name,
      image: a.images?.[0]?.url || null,
      followers: a.followers?.total || 0,
      genres: a.genres || []
    }))

    res.status(200).json({ artists })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message || err })
  }
}
