export default async function handler(req, res) {
  try {
    const { albumId } = req.query;
    if (!albumId) {
      return res.status(400).json({ error: "Falta el parámetro albumId" });
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "Faltan las credenciales de Spotify en Vercel" });
    }

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(500).json({ error: "No se pudo autenticar con Spotify" });
    }
    const accessToken = tokenData.access_token;

    const albumRes = await fetch(`https://api.spotify.com/v1/albums/${albumId}?market=CL`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const albumData = await albumRes.json();

    if (albumData.error) {
      return res.status(404).json({ error: "No se encontró el álbum" });
    }

    const fmt = (ms) => {
      const totalSec = Math.round(ms / 1000);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      return `${m}:${String(s).padStart(2, "0")}`;
    };

    const tracks = (albumData.tracks?.items || []).map((t) => ({
      uri: t.uri,
      name: t.name,
      artist: t.artists.map((a) => a.name).join(", "),
      duration: fmt(t.duration_ms),
      trackNumber: t.track_number,
    }));

    return res.status(200).json({
      albumId: albumData.id,
      albumName: albumData.name,
      albumImage: albumData.images?.[0]?.url || null,
      tracks,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
