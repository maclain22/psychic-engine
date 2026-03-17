// pages/api/auth.js
export default function handler(req, res) {
const clientId = process.env.SPOTIFY_CLIENT_ID
const redirectUri = process.env.SPOTIFY_REDIRECT_URI
const scope = 'user-read-playback-state user-modify-playback-state user-read-private'


const url = new URL('https://accounts.spotify.com/authorize')
url.searchParams.set('client_id', clientId)
url.searchParams.set('response_type', 'code')
url.searchParams.set('redirect_uri', redirectUri)
url.searchParams.set('scope', scope)


res.status(200).json({ url: url.toString() })
}