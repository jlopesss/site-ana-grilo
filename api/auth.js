export default function handler(req, res) {
  const redirectUri = 'https://www.anagrilovoz.com/api/auth/callback';

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'repo');

  res.redirect(url.toString());
}
