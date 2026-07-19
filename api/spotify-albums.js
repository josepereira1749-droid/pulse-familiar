// Hace un fetch con reintento automático si Spotify responde 429 (demasiadas peticiones),
// esperando el tiempo que Spotify indica en la cabecera "Retry-After".
async function fetchConReintento(url, options, maxEsperaMs = 3000) {
  const r = await fetch(url, options);
  if (r.status === 429) {
    const retryAfter = parseInt(r.headers.get("retry-after") || "1", 10);
    const espera = Math.min(retryAfter * 1000, maxEsperaMs);
    await new Promise((res) => setTimeout(res, espera));
    return fetch(url, options); // un solo reintento
  }
  return r;
}

export default async function handler(req, res) {
  try {
    const { artist } = req.query;
    if (!artist) {
      return res.status(400).json({ error: "Falta el parámetro artist" });
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "Faltan las credenciales de Spotify en Vercel" });
    }

    // Este endpoint usa "Client Credentials" (no requiere que el anfitrión
    // tenga Spotify conectado ni abierto, solo sirve para buscar en el catálogo)
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetchConReintento("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
    });
    let tokenData;
    try {
      tokenData = await tokenRes.json();
    } catch {
      return res.status(502).json({ error: "Spotify está limitando peticiones ahora mismo. Espera unos segundos e intenta de nuevo." });
    }
    if (!tokenData.access_token) {
      return res.status(500).json({ error: "No se pudo autenticar con Spotify" });
    }
    const accessToken = tokenData.access_token;

    // Buscar el artista
    const artistSearchRes = await fetchConReintento(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(artist)}&type=artist&limit=1`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    let artistSearchData;
    try {
      artistSearchData = await artistSearchRes.json();
    } catch {
      return res.status(502).json({ error: "Spotify está limitando peticiones ahora mismo. Espera unos segundos e intenta de nuevo." });
    }
    const artistaEncontrado = artistSearchData.artists?.items?.[0];

    if (!artistaEncontrado) {
      return res.status(404).json({ error: `No se encontró ningún artista para "${artist}"` });
    }

    // Traer TODOS sus álbumes y sencillos (con paginación, sin restringir a un solo mercado
    // para no perder álbumes que no estén licenciados específicamente en Chile).
    // Nota: pedir explícitamente ?limit= dispara un error 400 "Invalid limit" en este
    // endpoint de Spotify, así que se omite y se sigue la paginación con las URLs
    // "next" que la propia API entrega, que sí vienen bien formadas.
    let albumsCrudos = [];
    let siguienteUrl = `https://api.spotify.com/v1/artists/${artistaEncontrado.id}/albums?include_groups=album,single`;
    let paginas = 0;
    let limitadoPorSpotify = false;
    let retryAfterObservado = null;

    while (siguienteUrl && paginas < 25) { // tope de seguridad generoso
      const albumsRes = await fetchConReintento(siguienteUrl, { headers: { Authorization: `Bearer ${accessToken}` } });

      if (albumsRes.status === 429) {
        retryAfterObservado = albumsRes.headers.get("retry-after");
        limitadoPorSpotify = true;
        break;
      }

      let albumsData;
      try {
        albumsData = await albumsRes.json();
      } catch {
        limitadoPorSpotify = true;
        break;
      }

      if (albumsData.error) break;

      albumsCrudos = albumsCrudos.concat(albumsData.items || []);
      siguienteUrl = albumsData.next || null;
      paginas++;

      // Pequeña pausa entre páginas para no disparar el límite de peticiones por segundo de Spotify
      if (siguienteUrl) await new Promise((r) => setTimeout(r, 200));
    }

    // Quitar duplicados (mismo álbum lanzado en distintos países/formatos)
    const vistos = new Set();
    const albumes = albumsCrudos
      .filter((a) => {
        const key = a.name.toLowerCase().trim();
        if (vistos.has(key)) return false;
        vistos.add(key);
        return true;
      })
      .sort((a, b) => (b.release_date || "").localeCompare(a.release_date || ""))
      .map((a) => ({
        id: a.id,
        name: a.name,
        image: a.images?.[0]?.url || a.images?.[1]?.url || null,
        releaseDate: a.release_date,
        totalTracks: a.total_tracks,
        type: a.album_type,
      }));

    return res.status(200).json({
      artist: {
        id: artistaEncontrado.id,
        name: artistaEncontrado.name,
        image: artistaEncontrado.images?.[0]?.url || null,
      },
      albums: albumes,
      avisoIncompleto: limitadoPorSpotify ? `Spotify limitó las peticiones (Retry-After: ${retryAfterObservado ?? "no especificado"} segundos según Spotify). Espera ese tiempo e intenta de nuevo.` : null,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
