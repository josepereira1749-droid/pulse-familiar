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

    // --- Guardado automático del refresh token en Vercel ---
    const vercelToken = process.env.VERCEL_API_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID_TARGET;
    let autoSaveMsg = "";

    if (!vercelToken || !vercelProjectId) {
      autoSaveMsg = `<p style="color:#f87171;">⚠️ No se pudo autoguardar: faltan VERCEL_API_TOKEN o VERCEL_PROJECT_ID_TARGET en Vercel.</p>`;
    } else {
      try {
        const envListUrl = `https://api.vercel.com/v9/projects/${vercelProjectId}/env`;
        const listRes = await fetch(envListUrl, {
          headers: { Authorization: `Bearer ${vercelToken}` },
        });
        const listData = await listRes.json();
        const existing = (listData.envs || []).find((e) => e.key === "SPOTIFY_RTOKEN");

        if (existing) {
          const patchRes = await fetch(
            `https://api.vercel.com/v9/projects/${vercelProjectId}/env/${existing.id}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${vercelToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ value: data.refresh_token }),
            }
          );
          if (patchRes.ok) {
            autoSaveMsg = `<p style="color:#4ade80;">✅ Token guardado automáticamente en Vercel (actualizado). Ve a Vercel y haz <b>Redeploy</b> para que tome el cambio.</p>`;
          } else {
            const errBody = await patchRes.text();
            autoSaveMsg = `<p style="color:#f87171;">⚠️ Falló al actualizar: ${errBody}</p>`;
          }
        } else {
          const createRes = await fetch(envListUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${vercelToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              key: "SPOTIFY_RTOKEN",
              value: data.refresh_token,
              type: "encrypted",
              target: ["production", "preview"],
            }),
          });
          if (createRes.ok) {
            autoSaveMsg = `<p style="color:#4ade80;">✅ Token guardado automáticamente en Vercel (creado). Ve a Vercel y haz <b>Redeploy</b> para que tome el cambio.</p>`;
          } else {
            const errBody = await createRes.text();
            autoSaveMsg = `<p style="color:#f87171;">⚠️ Falló al crear: ${errBody}</p>`;
          }
        }
      } catch (autoErr) {
        autoSaveMsg = `<p style="color:#f87171;">⚠️ Error al autoguardar: ${autoErr.message}</p>`;
      }
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(`
      <html>
        <body style="font-family:sans-serif;padding:24px;background:#080912;color:#F4F5FA;">
          <h2>✅ Conexión con Spotify exitosa</h2>
          ${autoSaveMsg}
          <p style="color:#8B90A8;font-size:13px;">Si el autoguardado falló, copia el token manualmente como respaldo:</p>
          <textarea readonly style="width:100%;height:120px;font-size:13px;padding:10px;border-radius:8px;">${data.refresh_token}</textarea>
        </body>
      </html>
    `);
  } catch (e) {
    return res.status(500).send(`<html><body style="font-family:sans-serif;padding:24px;">Error real: ${e.message}<br/><pre>${e.stack}</pre></body></html>`);
  }
}
