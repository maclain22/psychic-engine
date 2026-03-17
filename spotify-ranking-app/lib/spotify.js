/* lib/spotify.js
const fetch = require('node-fetch')


const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'


async function getAppAccessToken() {
// Uses Client Credentials flow for server-side calls that don't require user-specific scopes.
// NOTE: This token cannot access user-private data. It's fine for reading public artist/album/track info.
const clientId = process.env.SPOTIFY_CLIENT_ID // TODO: set in .env.local
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET // TODO: set in .env.local


const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
const res = await fetch(SPOTIFY_TOKEN_URL, {
method: 'POST',
headers: {
Authorization: `Basic ${basic}`,
'Content-Type': 'application/x-www-form-urlencoded',
},
body: new URLSearchParams({ grant_type: 'client_credentials' }),
})
const data = await res.json()
if (!res.ok) throw new Error(`Token error: ${JSON.stringify(data)}`)
return data.access_token
}


async function spotifyFetch(path, accessToken) {
const res = await fetch(`${SPOTIFY_API_BASE}${path}`, {
headers: { Authorization: `Bearer ${accessToken}` },
})
const data = await res.json()
if (!res.ok) throw new Error(JSON.stringify(data))
return data
}


module.exports = { getAppAccessToken, spotifyFetch }
*/

// lib/spotify.js
export async function getAppAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to get token: ${err}`)
  }

  const json = await res.json()
  return json.access_token
}

export async function spotifyFetch(endpoint, token) {
  const base = process.env.SPOTIFY_API_BASE || 'https://api.spotify.com/v1'
  const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(data))
  return data
}
