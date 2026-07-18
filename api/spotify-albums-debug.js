export default async function handler(req, res) {
  try {
    const { artist } = req.query;
    if (!artist) return res.status(400).json({ error: "Falta ?artist=" });

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${basic}` },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Buscar top 5 artistas que coincidan (para ver si está eligiendo el correcto)
    const artistSearchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(artist)}&type=artist&limit=5`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const artistSearchData = await artistSearchRes.json();
    const candidatosArtista = (artistSearchData.artists?.items || []).map((a) => ({
      id: a.id,
      name: a.name,
      followers: a.followers?.total,
      popularity: a.popularity,
    }));

    const artistaElegido = artistSearchData.artists?.items?.[0];
    if (!artistaElegido) return res.status(404).json({ error: "No se encontró artista", candidatosArtista });

    // Probar distintas variantes del request para aislar la causa del error "Invalid limit"
    const pruebas = [
      { etiqueta: "limit=50 con include_groups", url: `https://api.spotify.com/v1/artists/${artistaElegido.id}/albums?include_groups=album,single&limit=50` },
      { etiqueta: "limit=20 con include_groups", url: `https://api.spotify.com/v1/artists/${artistaElegido.id}/albums?include_groups=album,single&limit=20` },
      { etiqueta: "sin limit, con include_groups", url: `https://api.spotify.com/v1/artists/${artistaElegido.id}/albums?include_groups=album,single` },
      { etiqueta: "solo albums (sin nada más)", url: `https://api.spotify.com/v1/artists/${artistaElegido.id}/albums` },
    ];

    const resultadosPruebas = [];
    for (const p of pruebas) {
      const r = await fetch(p.url, { headers: { Authorization: `Bearer ${accessToken}` } });
      const d = await r.json();
      resultadosPruebas.push({
        etiqueta: p.etiqueta,
        url: p.url,
        status: r.status,
        items: (d.items || []).length,
        error: d.error || null,
      });
    }

    return res.status(200).json({
      busquedaOriginal: artist,
      candidatosArtista,
      artistaElegido: { id: artistaElegido.id, name: artistaElegido.name },
      resultadosPruebas,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}
