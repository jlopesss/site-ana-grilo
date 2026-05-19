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

    const message = JSON.stringify({
      token: data.access_token,
      provider: 'github',
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html><html><body><script>
(function () {
  var msg = 'authorization:github:success:' + ${JSON.stringify(message)};
  function onMessage(e) {
    window.opener.postMessage(msg, e.origin);
  }
  window.addEventListener('message', onMessage, false);
  window.opener.postMessage('authorizing:github', '*');
})();
<\/script></body></html>`);
  } catch (_) {
    res.status(500).send('Erro interno');
  }
}
