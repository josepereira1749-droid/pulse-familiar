export default function handler(req, res) {
  const allKeys = Object.keys(process.env).sort();
  const spotifyKeys = allKeys.filter((k) => k.toUpperCase().includes("SPOTIFY") || k.toUpperCase().includes("REFRESH"));

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`
    <html lang="en" translate="no">
    <head>
      <meta name="google" content="notranslate">
    </head>
    <body class="notranslate" translate="no" style="font-family:monospace;padding:24px;background:#080912;color:#F4F5FA;">
      <h2 class="notranslate" translate="no">Diagnostico (sin traduccion)</h2>
      <p>Total variables: ${allKeys.length}</p>
      <p>Variables relacionadas a SPOTIFY o REFRESH:</p>
      <pre class="notranslate" translate="no">${JSON.stringify(spotifyKeys, null, 2)}</pre>
      <p>SPOTIFY_REFRESH_TOKEN existe: <b>${process.env.SPOTIFY_REFRESH_TOKEN !== undefined}</b></p>
    </body>
    </html>
  `);
}
