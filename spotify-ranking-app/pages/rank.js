// pages/rank.js
import { useEffect, useState, useRef } from 'react'
import SongCard from '../components/SongCard'

export default function Rank() {
  const [sorted, setSorted] = useState([])          // ranked tracks
  const [candidate, setCandidate] = useState(null) // track being inserted
  const [leftSong, setLeftSong] = useState(null)
  const [rightSong, setRightSong] = useState(null)
  const [message, setMessage] = useState('')
  const boundsRef = useRef({ left: 0, right: 0 })   // binary search bounds
  const [token, setToken] = useState(null);

  useEffect(() => {
    startInitialComparison();
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('spotify_access_token') : null;
    if (storedToken) setToken(storedToken);
  }, [])

  // First comparison: fetch first two tracks
  async function startInitialComparison() {
    const qs = new URLSearchParams(window.location.search)
    const artistId = qs.get('artistId')
    if (!artistId) return

    const res1 = await fetch(`/api/spotify?artistId=${artistId}`)
    const json1 = await res1.json()
    if (!res1.ok || !json1.tracks || !json1.tracks.length) return
    const firstTrack = json1.tracks[0]

    const res2 = await fetch(`/api/spotify?artistId=${artistId}&exclude=${firstTrack.id}`)
    const json2 = await res2.json()
    if (!res2.ok || !json2.tracks || !json2.tracks.length) {
      // Only one track → add it
      setSorted([firstTrack])
      setCandidate(null)
      setLeftSong(null)
      setRightSong(null)
      setMessage('Only one track available, ranking complete.')
      return
    }

    const secondTrack = json2.tracks[0]

    // Set up first comparison
    setSorted([firstTrack])
    setCandidate(secondTrack)
    boundsRef.current = { left: 0, right: 0 } // inclusive bounds
    setLeftSong(firstTrack)
    setRightSong(secondTrack)
    setMessage('Compare the first two tracks to start ranking.')
  }

  // Update left/right song for comparison
  function updateCompareSong(candidate, currentSorted = sorted) {
    const { left, right } = boundsRef.current
    if (left > right) return
    const mid = Math.floor((left + right) / 2)
    setLeftSong(currentSorted[mid])
    setRightSong(candidate)
    setMessage(`Compare "${candidate.name}" with song ${mid + 1} of ${currentSorted.length}`)
  }

  // Handle user choice
  function handleChoose(preferred) {
    const b = boundsRef.current
    const mid = Math.floor((b.left + b.right) / 2)

    if (sorted.length === 0) {
      const newSorted = [candidate]
      setSorted(newSorted)
      setCandidate(null)
      setLeftSong(null)
      setRightSong(null)
      startNextCandidate(newSorted)
      return
    }

    if (preferred.id === candidate.id) {
      // Candidate preferred → go left (better)
      b.right = mid - 1
    } else {
      // Existing song preferred → go right (candidate worse)
      b.left = mid + 1
    }

    if (b.left > b.right) {
      // Insert candidate at final position
      const insertAt = b.left
      const newSorted = [...sorted]
      newSorted.splice(insertAt, 0, candidate)
      setSorted(newSorted)
      setCandidate(null)
      setLeftSong(null)
      setRightSong(null)
      startNextCandidate(newSorted)
    } else {
      updateCompareSong(candidate)
    }
  }

  // Fetch next candidate track
  async function startNextCandidate(currentSorted = sorted) {
    const qs = new URLSearchParams(window.location.search)
    const artistId = qs.get('artistId')
    if (!artistId) return

    const excludeIds = new Set(currentSorted.map(s => s.id))
    let nextCandidate = null

    while (!nextCandidate) {
      const res = await fetch(`/api/spotify?artistId=${artistId}&exclude=${[...excludeIds].join(',')}`)
      const json = await res.json()
      if (!res.ok || !json.tracks || !json.tracks.length) {
        setMessage('Ranking complete!')
        setCandidate(null)
        setLeftSong(null)
        setRightSong(null)
        return
      }
      const track = json.tracks[0]
      if (!excludeIds.has(track.id)) nextCandidate = track
    }

    setCandidate(nextCandidate)
    boundsRef.current = { left: 0, right: currentSorted.length - 1 } // inclusive bounds
    updateCompareSong(nextCandidate, currentSorted)
  }

  // Export ranking as text
  function exportTxt() {
    const text = sorted.map((s, i) => `${i + 1}. ${s.name} — ${s.album.name}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ranking.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ maxWidth: 900, margin: '24px auto' }}>
      <h1>Song Ranking</h1>
      <p>{message}</p>

      {leftSong && rightSong ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <SongCard song={leftSong} onChoose={() => handleChoose(leftSong)} label="Left" />
          <SongCard song={rightSong} onChoose={() => handleChoose(rightSong)} label="Right" />
        </div>
      ) : (
        <p style={{ textAlign: 'center' }}>No comparison active.</p>
      )}

      <hr style={{ margin: '20px 0' }} />

      <h2>Current Rankings ({sorted.length})</h2>
      <ol>
        {sorted.map((s) => (
          <li key={s.id}>{s.name} — {s.album.name}</li>
        ))}
      </ol>

      <button onClick={exportTxt} disabled={!sorted.length}>Export as .txt</button>
    </div>
  )
}
