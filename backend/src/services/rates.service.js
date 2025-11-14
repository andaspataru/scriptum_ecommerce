import fetch from 'node-fetch';

export async function getRates(base = 'EUR') {
  const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('Rate fetch failed');
  const json = await r.json();
  return json;
}
