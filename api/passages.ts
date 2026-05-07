import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const orgId = process.env.COVEO_ORG_ID;
  const apiKey = process.env.COVEO_API_KEY;
  if (!orgId || !apiKey) {
    return res.status(500).json({
      error: 'Server is missing COVEO_ORG_ID or COVEO_API_KEY env vars',
    });
  }

  const { query, maxPassages = 5 } = (req.body || {}) as {
    query?: string;
    maxPassages?: number;
  };
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res
      .status(400)
      .json({ error: 'Body must include a non-empty `query` string' });
  }

  const url = `https://${orgId}.org.coveo.com/rest/search/v3/passages/retrieve`;
  const body = {
    query,
    searchHub: process.env.COVEO_QA_SEARCH_HUB || 'PokedexQA',
    filter: '@source=="pokedex-full"',
    maxPassages: Math.min(Math.max(Number(maxPassages) || 5, 1), 20),
    additionalFields: [
      'pokemonname',
      'pokemonimage',
      'pokemontypes',
      'pokemongeneration',
      'clickableuri',
    ],
    localization: { locale: 'en-US' },
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
    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: 'Coveo passage retrieval returned an error',
        details: data,
      });
    }
    return res.status(200).json(data);
  } catch (err) {
    return res
      .status(502)
      .json({ error: 'Failed to retrieve passages', details: String(err) });
  }
}
