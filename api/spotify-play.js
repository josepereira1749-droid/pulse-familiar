export default async function handler(req, res) {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const refreshToken = process.env.SPOTIFY_RTOKEN;
    const { q, uri: uriDirecto, name: nombreDirecto, artist: artistaDirecto, device_id: deviceIdDirecto, room_id: roomId } = req.query || {};

    if (!q && !uriDirecto) {
      return res.status(400).send(`<html><body style="font-family:sans-serif;padding:24px;">Falta el parámetro ?q= o ?uri=.</body></html>`);
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

    let track;

    if (uriDirecto) {
      // Vino desde una selección exacta (ej. una canción de un álbum) — no hace falta buscar
      track = {
        uri: uriDirecto,
        name: nombreDirecto || "Canción",
        artists: [{ name: artistaDirecto || "" }],
      };
    } else {
      // 1. Limpiar el texto de búsqueda (quitar ruido típico de títulos de YouTube)
      function limpiarTitulo(texto) {
        return texto
          .replace(/\(.*?\)/g, " ")           // quita cosas entre paréntesis: (Official Video), (HD)...
          .replace(/\[.*?\]/g, " ")           // quita cosas entre corchetes
          .replace(/official\s*(music\s*)?video/gi, " ")
          .replace(/official\s*audio/gi, " ")
          .replace(/lyric[s]?\s*video/gi, " ")
          .replace(/\blyrics\b/gi, " ")
          .replace(/\bhd\b|\b4k\b|\bhq\b/gi, " ")
          .replace(/video\s*oficial/gi, " ")
          .replace(/audio\s*oficial/gi, " ")
          .replace(/vevo/gi, " ")
          .replace(/\s{2,}/g, " ")
          .trim();
      }

      function normalizar(texto) {
        return texto
          .toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita acentos
          .replace(/[^a-z0-9\s]/g, " ")
          .replace(/\s{2,}/g, " ")
          .trim();
      }

      const qLimpio = limpiarTitulo(q);
      const qNormalizado = normalizar(qLimpio);

      // 2. Buscar varias opciones en Spotify y elegir la más parecida al título limpio
      const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(qLimpio)}&type=track&limit=5`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const searchData = await searchRes.json();
      const candidatos = searchData.tracks?.items || [];

      if (candidatos.length === 0) {
        return res.status(404).send(`<html><body style="font-family:sans-serif;padding:24px;">No se encontró ninguna canción para "${qLimpio}".</body></html>`);
      }

      // Puntuar cada candidato según cuántas palabras del título limpio coinciden
      function puntuar(t) {
        const nombreCompleto = normalizar(`${t.name} ${t.artists.map((a) => a.name).join(" ")}`);
        const palabrasQuery = qNormalizado.split(" ").filter(Boolean);
        let puntos = 0;
        for (const palabra of palabrasQuery) {
          if (palabra.length > 1 && nombreCompleto.includes(palabra)) puntos++;
        }
        return puntos;
      }

      track = candidatos[0];
      let mejorPuntaje = puntuar(track);
      for (const c of candidatos.slice(1)) {
        const p = puntuar(c);
        if (p > mejorPuntaje) {
          mejorPuntaje = p;
          track = c;
        }
      }
    }

    // 2. Elegir el dispositivo destino: si el navegador ya mandó su device_id
    //    (reproductor web propio de Pulse), lo probamos primero por ser el más directo.
    //    Si falla (por ejemplo, quedó obsoleto tras una reconexión), buscamos en
    //    vivo cuál está realmente activo ahora mismo y reintentamos ahí, en la
    //    misma llamada — sin obligar a la persona a intentarlo de nuevo a mano.
    async function listarDispositivosActivos() {
      const devicesRes = await fetch("https://api.spotify.com/v1/me/player/devices", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const devicesData = await devicesRes.json();
      return devicesData.devices || [];
    }

    async function intentarReproducir(deviceId) {
      return fetch(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ uris: [track.uri] }),
      });
    }

    let dispositivoId = deviceIdDirecto || null;
    let dispositivoNombre = "Reproductor web de Pulse";
    let dispositivoTipo = "";
    let usoRespaldo = false;

    if (!dispositivoId) {
      const dispositivos = await listarDispositivosActivos();
      if (dispositivos.length === 0) {
        return res.status(400).send(`
          <html><body style="font-family:sans-serif;padding:24px;background:#080912;color:#F4F5FA;">
            <h2>⚠️ No hay dispositivos de Spotify disponibles</h2>
            <p>Abre la app de Spotify en tu celular (u otro dispositivo) y dale reproducir/pausar a cualquier cosa para "despertarlo", luego intenta de nuevo.</p>
          </body></html>
        `);
      }
      const activo = dispositivos.find((d) => d.is_active) || dispositivos[0];
      dispositivoId = activo.id;
      dispositivoNombre = activo.name;
      dispositivoTipo = activo.type;
    }

    let playRes = await intentarReproducir(dispositivoId);

    // Si el dispositivo guardado falló (obsoleto, desconectado, etc.), buscamos
    // en vivo cuál está activo de verdad y reintentamos automáticamente ahí.
    if (playRes.status !== 204 && deviceIdDirecto) {
      const dispositivos = await listarDispositivosActivos();
      const candidato = dispositivos.find((d) => d.is_active) || dispositivos[0];
      if (candidato && candidato.id !== dispositivoId) {
        usoRespaldo = true;
        dispositivoId = candidato.id;
        dispositivoNombre = candidato.name;
        dispositivoTipo = candidato.type;
        playRes = await intentarReproducir(dispositivoId);
      }
    }

    if (playRes.status === 204) {
      // Si tuvimos que usar un dispositivo de respaldo, lo guardamos en la sala
      // compartida para que el resto de invitados también apunten ahí directo,
      // sin tener que fallar primero cada uno por su cuenta.
      if (usoRespaldo && roomId) {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
          fetch(`${supabaseUrl}/rest/v1/rooms?id=eq.${encodeURIComponent(roomId)}`, {
            method: "PATCH",
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({ spotify_device_id: dispositivoId }),
          }).catch(() => {});
        }
      }

      return res.status(200).send(`
        <html><body style="font-family:sans-serif;padding:24px;background:#080912;color:#F4F5FA;">
          <h2>▶️ Sonando ahora en tu Spotify</h2>
          <p style="font-size:20px;font-weight:bold;color:#1DB954;">${track.name}</p>
          <p>${track.artists.map((a) => a.name).join(", ")}</p>
          <p style="color:#8B90A8;font-size:12px;margin-top:12px;">Dispositivo: ${dispositivoNombre}${dispositivoTipo ? ` (${dispositivoTipo})` : ""}${usoRespaldo ? " · se usó un dispositivo de respaldo" : ""}</p>
        </body></html>
      `);
    }

    const errData = await playRes.json().catch(() => ({}));
    return res.status(playRes.status).send(`
      <html><body style="font-family:sans-serif;padding:24px;background:#080912;color:#F4F5FA;">
        <h2>⚠️ No se pudo reproducir</h2>
        <p>Código: ${playRes.status}</p>
        <p style="color:#FF3B6B;font-weight:bold;">${errData.error?.message || errData.error || "sin detalle"}</p>
        <p style="color:#8B90A8;font-size:12px;">Dispositivo usado: ${dispositivoId}</p>
        <p>Abre la app de Spotify en tu celular (u otro dispositivo) y dale reproducir/pausar a cualquier cosa para "despertarlo", luego intenta de nuevo.</p>
      </body></html>
    `);
  } catch (e) {
    return res.status(500).send(`<html><body style="font-family:sans-serif;padding:24px;">Error real: ${e.message}<br/><pre>${e.stack}</pre></body></html>`);
  }
}
