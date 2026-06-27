import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { formatAiError, handleAiDesignBody } from './api/_ai-design.js';

async function readBody(req: any) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

export default defineConfig({
  base: '/',
  plugins: [react(), {
    name: 'local-ai-api',
    configureServer(server) {
      server.middlewares.use('/api/ai-design', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405; res.end(JSON.stringify({ error: '只支持 POST' })); return;
        }
        try {
          const data = await handleAiDesignBody(await readBody(req));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        } catch (e) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: formatAiError(e) }));
        }
      });
    },
  }],
  server: { port: 5173 },
});
