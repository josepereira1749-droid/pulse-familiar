export default async function handler(req, res) {
  try {
    const { value } = req.query || {};
    if (!value) {
      return res.status(400).send(`<html><body style="font-family:sans-serif;padding:24px;">Falta ?value=TU_PIN en la URL. Ejemplo: /api/set-host-pin?value=4782</body></html>`);
    }

    const vercelToken = process.env.VERCEL_API_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID_TARGET;
    if (!vercelToken || !vercelProjectId) {
      return res.status(500).send(`<html><body style="font-family:sans-serif;padding:24px;">Faltan VERCEL_API_TOKEN o VERCEL_PROJECT_ID_TARGET en Vercel.</body></html>`);
    }

    const envListUrl = `https://api.vercel.com/v9/projects/${vercelProjectId}/env`;
    const listRes = await fetch(envListUrl, { headers: { Authorization: `Bearer ${vercelToken}` } });
    const listData = await listRes.json();
    const existente = (listData.envs || []).find((e) => e.key === "VITE_HOST_PIN");

    let resultado;
    if (existente) {
      const patchRes = await fetch(`https://api.vercel.com/v9/projects/${vercelProjectId}/env/${existente.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${vercelToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      resultado = { ok: patchRes.ok, accion: "actualizado", detalle: patchRes.ok ? null : await patchRes.text() };
    } else {
      const createRes = await fetch(envListUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${vercelToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ key: "VITE_HOST_PIN", value, type: "plain", target: ["production", "preview"] }),
      });
      resultado = { ok: createRes.ok, accion: "creado", detalle: createRes.ok ? null : await createRes.text() };
    }

    return res.status(200).send(`
      <html><body style="font-family:sans-serif;padding:24px;background:#080912;color:#F4F5FA;">
        <h2>${resultado.ok ? "✅ Listo" : "⚠️ Falló"}</h2>
        <p>VITE_HOST_PIN ${resultado.accion} ${resultado.ok ? "correctamente" : "con error"}.</p>
        ${resultado.detalle ? `<pre>${resultado.detalle}</pre>` : ""}
        ${resultado.ok ? "<p>Ahora ve a Vercel y haz <b>Redeploy</b> para que la app tome el cambio.</p>" : ""}
      </body></html>
    `);
  } catch (e) {
    return res.status(500).send(`<html><body style="font-family:sans-serif;padding:24px;">Error: ${e.message}</body></html>`);
  }
}
