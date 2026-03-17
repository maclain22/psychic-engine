// pages/login.js
const clientId = process.env.SPOTIFY_CLIENT_ID;
const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/callback`;
const scopes = [
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-email',
  'user-read-private',
];

export default function Login() {
  const handleLogin = () => {
    const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${clientId}&scope=${encodeURIComponent(
      scopes.join(' ')
    )}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = authUrl;
  };

  return (
    <div>
      <h1>Spotify Login</h1>
      <button onClick={handleLogin}>Login with Spotify</button>
    </div>
  );
}
