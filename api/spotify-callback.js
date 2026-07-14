
export default async function handler(req, res) {
  try {
    const { code, error } = req.query || {};

    if (error) {
      return res.status(400).send(`<html><body style="font-family:sans-serif;padding:24px;">Spotify devolvió un error: ${error}</body></html>`);
    }
    if (!code) {
      return res.status(400).send(`<html><body style="font-family:sans-serif;padding:24px;">Falta el código de autorización en la URL.</body></html>`);
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).send(`<html><body style="font-family:sans-serif;padding:24px;">Faltan variables de entorno en Vercel. clientId:${!!clientId} secret:${!!clientSecret} redirect:${!!redirectUri}</body></html>`);
    }

    const basic = btoa(`${clientId}:${clientSecret}`);

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await tokenRes.json();

    if (data.error) {
      return res.status(400).send(`<html><body style="font-family:sans-serif;padding:24px;">Error de Spotify: ${data.error_description || data.error}</body></html>`);
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(`
      <html>
        <body style="font-family:sans-serif;padding:24px;background:#080912;color:#F4F5FA;">
          <h2>✅ Conexión con Spotify exitosa</h2>
          <p>Copia el siguiente <b>refresh token</b> completo (toca dentro del cuadro, selecciona todo, copia) y guárdalo como variable de entorno <code>SPOTIFY_REFRESH_TOKEN</code> en Vercel. No lo compartas con nadie ni lo pegues en ningún chat.</p>
          <textarea readonly style="width:100%;height:120px;font-size:13px;padding:10px;border-radius:8px;">${data.refresh_token}</textarea>
          <p style="color:#8B90A8;font-size:13px;">Después de guardarlo en Vercel, puedes cerrar esta pestaña.</p>
        </body>
      </html>
    `);
  } catch (e) {
    return res.status(500).send(`<html><body style="font-family:sans-serif;padding:24px;">Error real: ${e.message}<br/><pre>${e.stack}</pre></body></html>`);
  }
}
