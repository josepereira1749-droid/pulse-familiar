export default async function handler(req, res) {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ error: "Falta el parámetro q" });
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "Faltan las credenciales de Spotify en Vercel" });
    }

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${basic}` },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
    });
    let tokenData;
    try { tokenData = await tokenRes.json(); } catch {
      return res.status(502).json({ error: "Spotify no respondió correctamente (puede estar limitando peticiones, intenta en unos segundos)" });
    }
    if (!tokenData.access_token) {
      return res.status(500).json({ error: "No se pudo autenticar con Spotify" });
    }

    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q.trim())}&type=track&limit=10`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    let searchData;
    try { searchData = await searchRes.json(); } catch {
      return res.status(502).json({ error: "Spotify no respondió correctamente al buscar (puede estar limitando peticiones, intenta en unos segundos)" });
    }

    const fmt = (ms) => {
      const totalSec = Math.round(ms / 1000);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      return `${m}:${String(s).padStart(2, "0")}`;
    };

    const resultados = (searchData.tracks?.items || []).map((t) => ({
      id: t.id,
      title: t.name,
      artist: t.artists.map((a) => a.name).join(", "),
      duration: fmt(t.duration_ms),
      thumbnail: t.album?.images?.[t.album.images.length - 1]?.url || t.album?.images?.[0]?.url || null,
      spotifyUri: t.uri,
    }));

    return res.status(200).json({ results: resultados });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
