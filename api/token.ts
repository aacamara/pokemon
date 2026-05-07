import type { VercelRequest, VercelResponse } from '@vercel/node';

const COVEO_HOST = 'org.coveo.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const orgId = process.env.COVEO_ORG_ID;
  const apiKey = process.env.COVEO_API_KEY;
  const searchHub =
    (req.query.searchHub as string | undefined) ||
    process.env.COVEO_SEARCH_HUB ||
    'PokedexSearch';

  if (!orgId || !apiKey) {
    return res.status(500).json({
      error: 'Server is missing COVEO_ORG_ID or COVEO_API_KEY env vars',
    });
  }

  const url = `https://${orgId}.${COVEO_HOST}/rest/search/v2/token`;
  const body = {
    searchHub,
    userIds: [
      {
        name: 'pokedex-anonymous',
        provider: 'Email Security Provider',
        type: 'User',
      },
    ],
  };

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    const data = (await upstream.json()) as { token?: string; message?: string };
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: 'Coveo token endpoint returned an error',
        details: data,
      });
    }
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json({ token: data.token, organizationId: orgId });
  } catch (err) {
    return res
      .status(502)
      .json({ error: 'Failed to mint search token', details: String(err) });
  }
}
