export default function handler(req, res) {
  function inspect(name) {
    const v = process.env[name];
    if (v === undefined) return { existe: false };
    return {
      existe: true,
      largo: v.length,
      inicio: v.slice(0, 6),
      final: v.slice(-6),
      tieneEspacios: /^\s|\s$/.test(v),
      tieneComillas: v.includes('"') || v.includes("'"),
      tieneSaltoDeLinea: /\r|\n/.test(v),
    };
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`
    <html><body style="font-family:sans-serif;padding:24px;background:#080912;color:#F4F5FA;">
      <h2>Diagnóstico de variables Spotify</h2>
      <pre>${JSON.stringify({
        SPOTIFY_CLIENT_ID: inspect("SPOTIFY_CLIENT_ID"),
        SPOTIFY_CLIENT_SECRET: inspect("SPOTIFY_CLIENT_SECRET"),
        SPOTIFY_REDIRECT_URI: inspect("SPOTIFY_REDIRECT_URI"),
        SPOTIFY_REFRESH_TOKEN: inspect("SPOTIFY_REFRESH_TOKEN"),
      }, null, 2)}</pre>
      <p style="color:#8B90A8;font-size:13px;">Borra este archivo cuando termines de diagnosticar, no lo dejes en producción.</p>
    </body></html>
  `);
}
