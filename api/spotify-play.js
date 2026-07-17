export default async function handler(req, res) {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const refreshToken = process.env.SPOTIFY_RTOKEN;
    const { q } = req.query || {};

    if (!q) {
      return res.status(400).send(`<html><body style="font-family:sans-serif;padding:24px;">Falta el parámetro ?q= con el nombre de la canción. Ejemplo: /api/spotify-play?q=Despacito</body></html>`);
    }

    const basic = btoa(`${clientId}:${clientSecret}`);
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${basic}` },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      return res.status(400).send(`<html><body style="font-family:sans-serif;padding:24px;">Error al renovar el token: ${tokenData.error_description || tokenData.error}</body></html>`);
    }
    const accessToken = tokenData.access_token;

    // 1. Buscar la canción en el catálogo de Spotify
    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=1`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const searchData = await searchRes.json();
    const track = searchData.tracks?.items?.[0];

    if (!track) {
      return res.status(404).send(`<html><body style="font-family:sans-serif;padding:24px;">No se encontró ninguna canción para "${q}".</body></html>`);
    }

    // 2. Mandar la orden de reproducir en el dispositivo activo
    const playRes = await fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ uris: [track.uri] }),
    });

    if (playRes.status === 204) {
      return res.status(200).send(`
        <html><body style="font-family:sans-serif;padding:24px;background:#080912;color:#F4F5FA;">
          <h2>▶️ Sonando ahora en tu Spotify</h2>
          <p style="font-size:20px;font-weight:bold;color:#1DB954;">${track.name}</p>
          <p>${track.artists.map((a) => a.name).join(", ")}</p>
        </body></html>
      `);
    }

    const errData = await playRes.json().catch(() => ({}));
    return res.status(playRes.status).send(`
      <html><body style="font-family:sans-serif;padding:24px;">
        No se pudo reproducir (código ${playRes.status}): ${errData.error?.message || "sin detalle"}<br/><br/>
        Asegúrate de tener Spotify abierto y activo en algún dispositivo justo antes de probar esto.
      </body></html>
    `);
  } catch (e) {
    return res.status(500).send(`<html><body style="font-family:sans-serif;padding:24px;">Error real: ${e.message}<br/><pre>${e.stack}</pre></body></html>`);
  }
}
