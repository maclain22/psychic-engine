// components/SongCard.js
import { useEffect, useState } from 'react';

export default function SongCard({ song, onChoose, label, token }) {
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const albumImage = song.album?.images?.[0]?.url || null;
  const previewUrl = song.preview_url || null;

  // Initialize Web Playback SDK if token exists
  useEffect(() => {
    if (!token) return;

    if (!window.Spotify) {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Ranking App Player',
        getOAuthToken: cb => cb(token),
      });

      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Spotify Player ready with device ID', device_id);
      });

      spotifyPlayer.addListener('player_state_changed', state => {
        if (!state) return;
        setIsPlaying(!state.paused);
      });

      spotifyPlayer.connect();
      setPlayer(spotifyPlayer);
    };
  }, [token]);

  const playTrack = async () => {
    if (player && token) {
      try {
        // Play track via Web Playback SDK
        await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${player._options.id}`,
          {
            method: 'PUT',
            body: JSON.stringify({ uris: [song.uri] }),
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (err) {
        console.error('Error playing track via SDK:', err);
      }
    }
  };

  return (
    <div className="song-card">
      <div className="cover">
        {albumImage ? (
          <img src={albumImage} alt={`${song.name} cover`} />
        ) : (
          <div className="placeholder">No image</div>
        )}
      </div>
      <div className="meta">
        <div className="title">{song.name}</div>
        <div className="album">{song.album.name}</div>

        {token ? (
          <button onClick={playTrack} className="play-btn">
            {isPlaying ? 'Playing...' : 'Play Track'}
          </button>
        ) : previewUrl ? (
          <audio controls src={previewUrl} preload="none" />
        ) : (
          <div className="no-preview">No preview available</div>
        )}

        <button onClick={() => onChoose(song)} className="choose-btn">
          Choose {label}
        </button>
      </div>

      <style jsx>{`
        .song-card {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          border: 1px solid #ddd;
          padding: 12px;
          border-radius: 8px;
        }
        .cover img {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: 6px;
        }
        .meta { flex: 1 }
        .title { font-weight: 700; margin-bottom: 4px }
        .album { color: #666; font-size: 0.9rem; margin-bottom: 8px }
        .play-btn, .choose-btn {
          margin-top: 8px;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          margin-right: 8px;
        }
        .placeholder, .no-preview {
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0f0f0;
          border-radius: 6px;
          color: #999;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
}
