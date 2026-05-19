export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    res.status(400).send('Parâmetro code ausente');
    return;
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();

    if (!data.access_token) {
      res.status(401).send('Autenticação GitHub falhou');
      return;
    }

    const content = JSON.stringify({ token: data.access_token, provider: 'github' });
    const msg = `authorization:github:success:${content}`;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Autenticando...</title></head>
<body>
<script>
(function () {
  var msg = ${JSON.stringify(msg)};
  function done(origin) {
    window.opener.postMessage(msg, origin || '*');
    setTimeout(function () { window.close(); }, 500);
  }
  if (!window.opener) { return; }
  window.addEventListener('message', function (e) {
    if (e.data === 'authorizing:github') { done(e.origin); }
  }, false);
  window.opener.postMessage('authorizing:github', '*');
  setTimeout(function () { done('*'); }, 800);
})();
</script>
</body>
</html>`);
  } catch (_) {
    res.status(500).send('Erro interno');
  }
}
