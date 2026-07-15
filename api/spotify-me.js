export default async function handler(req, res) {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return res.status(500).send(`<html><body style="font-family:sans-serif;padding:24px;">Falta alguna variable: clientId:${!!clientId} secret:${!!clientSecret} refreshToken:${!!refreshToken}</body></html>`);
    }

    const basic = btoa(`${clientId}:${clientSecret}`);

    // 1. Cambiar el refresh token por un access token nuevo
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return res.status(400).send(`<html><body style="font-family:sans-serif;padding:24px;">Error al renovar el token: ${tokenData.error_description || tokenData.error}<br/>Puede que el refresh token guardado no sea el correcto — revisa que se haya copiado bien, sin espacios ni texto de más.</body></html>`);
    }

    // 2. Usar el access token para preguntar quién es el usuario conectado
    const meRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const me = await meRes.json();

    if (me.error) {
      return res.status(400).send(`<html><body style="font-family:sans-serif;padding:24px;">Error al consultar tu cuenta: ${me.error.message}</body></html>`);
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(`
      <html>
        <body style="font-family:sans-serif;padding:24px;background:#080912;color:#F4F5FA;">
          <h2>✅ Todo conectado correctamente</h2>
          <p>Spotify confirma que estás conectado como:</p>
          <p style="font-size:22px;font-weight:bold;color:#1DB954;">${me.display_name || me.id}</p>
          <p style="color:#8B90A8;font-size:13px;">Producto: ${me.product} (debería decir "premium")</p>
        </body>
      </html>
    `);
  } catch (e) {
    return res.status(500).send(`<html><body style="font-family:sans-serif;padding:24px;">Error real: ${e.message}<br/><pre>${e.stack}</pre></body></html>`);
  }
}
