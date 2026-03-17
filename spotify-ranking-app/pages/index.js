import { useState, useEffect } from 'react'
import Router from 'next/router'

const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
const redirectUri = `${baseUrl}/callback`
const scopes = [
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-email',
  'user-read-private'
]

export default function Home() {
  const [query, setQuery] = useState('')
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const t = localStorage.getItem('spotify_access_token')
    setToken(t)
  }, [])

  const loginWithSpotify = () => {
    const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${clientId}&scope=${encodeURIComponent(
      scopes.join(' ')
    )}&redirect_uri=${encodeURIComponent(redirectUri)}`
    window.location.href = authUrl
  }

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/search-artist?name=${encodeURIComponent(query)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Search failed')
      setArtists(json.artists)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function selectArtist(artist) {
    Router.push({
      pathname: '/rank',
      query: { artistId: artist.id, artistName: artist.name }
    })
  }

  return (
    <div style={{ maxWidth:800, margin:'40px auto' }}>
      <h1>Spotify Song Ranking</h1>

      {!token ? (
        <div style={{ marginBottom:20 }}>
          <p>Please log in with Spotify to enable full track playback:</p>
          <button
            onClick={loginWithSpotify}
            style={{ padding:'8px 16px', borderRadius:6, cursor:'pointer' }}
          >
            Login with Spotify
          </button>
        </div>
      ) : (
        <p>Logged in to Spotify. You can now play full tracks in the ranking page.</p>
      )}

      <p>Search for an artist, then select one to start ranking their songs.</p>

      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search artist..."
          style={{ flex:1, padding:8 }}
        />
        <button onClick={search} disabled={!query || loading}>Search</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color:'red' }}>{error}</p>}

      <div style={{ display:'grid', gap:12 }}>
        {artists.map(a => (
          <div
            key={a.id}
            onClick={() => selectArtist(a)}
            style={{
              display:'flex', alignItems:'center',
              gap:12, cursor:'pointer',
              background:'#fff', borderRadius:8,
              padding:8, boxShadow:'0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            {a.image ? <img src={a.image} alt={a.name} width={50} height={50} style={{ borderRadius:4 }} /> : <div style={{ width:50, height:50, background:'#ddd', borderRadius:4 }} />}
            <div>
              <strong>{a.name}</strong><br />
              <small>{a.followers.toLocaleString()} followers</small><br />
              <small>{a.genres.slice(0,2).join(', ')}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
