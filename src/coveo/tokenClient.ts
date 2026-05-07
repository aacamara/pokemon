type TokenResponse = { token: string; organizationId: string };

let cached: { token: string; orgId: string; mintedAt: number } | null = null;
const TTL_MS = 12 * 60 * 1000; // refresh well before the 24 h token lifetime

export async function fetchSearchToken(force = false): Promise<TokenResponse> {
  if (!force && cached && Date.now() - cached.mintedAt < TTL_MS) {
    return { token: cached.token, organizationId: cached.orgId };
  }

  const res = await fetch('/api/token', { method: 'POST' });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Token endpoint failed (${res.status}): ${detail}`);
  }
  const json = (await res.json()) as TokenResponse;
  if (!json.token || !json.organizationId) {
    throw new Error('Token endpoint returned a malformed response');
  }
  cached = {
    token: json.token,
    orgId: json.organizationId,
    mintedAt: Date.now(),
  };
  return json;
}
