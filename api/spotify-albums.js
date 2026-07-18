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

    // Buscar el artista
    const artistSearchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(artist)}&type=artist&limit=1`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const artistSearchData = await artistSearchRes.json();
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

    while (siguienteUrl && paginas < 25) { // tope de seguridad generoso
      const albumsRes = await fetch(siguienteUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
      const albumsData = await albumsRes.json();
      albumsCrudos = albumsCrudos.concat(albumsData.items || []);
      siguienteUrl = albumsData.next || null;
      paginas++;
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
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
