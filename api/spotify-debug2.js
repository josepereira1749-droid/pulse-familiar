export default function handler(req, res) {
  const allKeys = Object.keys(process.env);
  const spotifyKeys = allKeys.filter((k) => k.toUpperCase().includes("SPOTIFY"));

  function inspect(name) {
    const v = process.env[name];
    if (v === undefined) return { existe: false };
    return {
      existe: true,
      largo: v.length,
      inicio: v.slice(0, 6),
      final: v.slice(-6),
    };
  }

  const detalle = {};
  spotifyKeys.forEach((k) => { detalle[k] = inspect(k); });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`
    <html><body style="font-family:sans-serif;padding:24px;background:#080912;color:#F4F5FA;">
      <h2>Diagnóstico completo</h2>
      <p>Total de variables de entorno visibles: ${allKeys.length}</p>
      <p>Nombres exactos que contienen "SPOTIFY" (tal como los ve el servidor):</p>
      <pre>${JSON.stringify(spotifyKeys, null, 2)}</pre>
      <p>Detalle:</p>
      <pre>${JSON.stringify(detalle, null, 2)}</pre>
      <p style="color:#8B90A8;font-size:13px;">Borra este archivo cuando termines de diagnosticar.</p>
    </body></html>
  `);
}
