import { formatAiError, handleAiDesignBody } from './_ai-design.js';

async function readJson(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: '只支持 POST' });
    return;
  }
  try {
    const body = await readJson(req);
    const data = await handleAiDesignBody(body);
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: formatAiError(e) });
  }
}
