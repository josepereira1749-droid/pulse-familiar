export default async function handler(req, res) {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const refreshToken = process.env.SPOTIFY_RTOKEN;
    const { action, device_id: deviceId } = req.query || {}; // action: "pause" | "resume"

    if (action !== "pause" && action !== "resume") {
      return res.status(400).json({ error: 'Falta ?action=pause o ?action=resume' });
    }
    if (!deviceId) {
      return res.status(400).json({ error: "Falta ?device_id=" });
    }

    const basic = btoa(`${clientId}:${clientSecret}`);
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${basic}` },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      return res.status(400).json({ error: tokenData.error_description || tokenData.error });
    }
    const accessToken = tokenData.access_token;

    const endpoint = action === "pause" ? "pause" : "play";

    async function intentar(id) {
      return fetch(`https://api.spotify.com/v1/me/player/${endpoint}?device_id=${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }

    let dispositivoId = deviceId;
    let spotifyRes = await intentar(dispositivoId);

    // Si el dispositivo guardado ya no responde, buscamos en vivo cuál está
    // activo de verdad y reintentamos ahí mismo, sin que la persona note nada.
    if (spotifyRes.status !== 204 && spotifyRes.status !== 202) {
      const devicesRes = await fetch("https://api.spotify.com/v1/me/player/devices", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const devicesData = await devicesRes.json();
      const dispositivos = devicesData.devices || [];
      const candidato = dispositivos.find((d) => d.is_active) || dispositivos[0];
      if (candidato && candidato.id !== dispositivoId) {
        dispositivoId = candidato.id;
        spotifyRes = await intentar(dispositivoId);
      }
    }

    if (spotifyRes.status === 204 || spotifyRes.status === 202) {
      return res.status(200).json({ ok: true, action, device_id: dispositivoId });
    }

    let detalle = null;
    try { detalle = await spotifyRes.json(); } catch {}
    return res.status(spotifyRes.status).json({ error: detalle?.error?.message || "No se pudo cambiar el estado de reproducción" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
