export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://gavin-dashboard.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { grant_type, code, redirect_uri, refresh_token } = req.body || {};

  if (!grant_type) return res.status(400).json({ error: 'Missing grant_type' });

  const params = new URLSearchParams({
    client_id:     process.env.WHOOP_CLIENT_ID,
    client_secret: process.env.WHOOP_CLIENT_SECRET,
    grant_type,
  });

  if (grant_type === 'authorization_code') {
    if (!code) return res.status(400).json({ error: 'Missing code' });
    params.set('code',         code);
    params.set('redirect_uri', process.env.WHOOP_REDIRECT_URI);
  } else if (grant_type === 'refresh_token') {
    if (!refresh_token) return res.status(400).json({ error: 'Missing refresh_token' });
    params.set('refresh_token', refresh_token);
  } else {
    return res.status(400).json({ error: 'Unsupported grant_type' });
  }

  try {
    const whoopRes = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString(),
    });

    const data = await whoopRes.json();
    if (!whoopRes.ok) return res.status(whoopRes.status).json(data);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Proxy error', detail: err.message });
  }
}
