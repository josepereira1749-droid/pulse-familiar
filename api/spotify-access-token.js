export default async function handler(req, res) {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const refreshToken = process.env.SPOTIFY_RTOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return res.status(500).json({ error: "Faltan credenciales de Spotify en Vercel" });
    }

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return res.status(400).json({ error: tokenData.error_description || tokenData.error });
    }

    // Access token de corta duración (~1 hora), seguro de exponer al navegador
    return res.status(200).json({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
