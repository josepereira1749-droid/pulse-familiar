export default function handler(req, res) {
  const allKeys = Object.keys(process.env).sort();

  // Mostrar cada key con su longitud y sus códigos de caracteres,
  // para detectar espacios invisibles, saltos de línea, etc.
  const detalle = allKeys.map((k) => ({
    key: k,
    largo: k.length,
    codigos: Array.from(k).map((c) => c.charCodeAt(0)),
  }));

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`
    <html><body style="font-family:sans-serif;padding:24px;background:#080912;color:#F4F5FA;">
      <h2>Todas las variables de entorno (${allKeys.length})</h2>
      <p>Lista simple de nombres:</p>
      <pre>${JSON.stringify(allKeys, null, 2)}</pre>
      <p style="color:#8B90A8;font-size:13px;">Borra este archivo cuando termines de diagnosticar. Contiene solo nombres, ningún valor secreto.</p>
    </body></html>
  `);
}
