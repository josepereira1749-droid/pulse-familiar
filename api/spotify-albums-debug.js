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

    // Paginar álbumes y contar cuántos vienen crudos, por página
    let paginas = [];
    let siguienteUrl = `https://api.spotify.com/v1/artists/${artistaElegido.id}/albums?include_groups=album,single&limit=50`;
    let total = 0;
    let vueltas = 0;
    let primeraRespuestaCruda = null;
    while (siguienteUrl && vueltas < 10) {
      const r = await fetch(siguienteUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
      const d = await r.json();
      if (vueltas === 0) primeraRespuestaCruda = { status: r.status, ok: r.ok, body: d };
      paginas.push({ itemsEnPagina: (d.items || []).length, totalReportadoApi: d.total, hayNext: !!d.next, error: d.error || null });
      total += (d.items || []).length;
      siguienteUrl = d.next || null;
      vueltas++;
    }

    return res.status(200).json({
      busquedaOriginal: artist,
      candidatosArtista,
      artistaElegido: { id: artistaElegido.id, name: artistaElegido.name },
      paginas,
      totalCrudoAcumulado: total,
      primeraRespuestaCruda,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}
