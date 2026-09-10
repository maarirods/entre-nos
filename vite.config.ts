import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// ==============================================================================
// Servidor em memória compartilhado para sincronização local em tempo real
// Funciona entre Abas Normais, Abas Anônimas e Celulares no mesmo Wi-Fi!
// ==============================================================================
const rooms = new Map<string, any>();
const sseClients = new Map<string, Set<any>>();

function broadcastRoom(code: string, state: any) {
  const clients = sseClients.get(code);
  if (clients) {
    const data = `data: ${JSON.stringify(state)}\n\n`;
    clients.forEach((res) => {
      try {
        res.write(data);
      } catch (err) {
        // cliente desconectado
      }
    });
  }
}

function roomApiPlugin(): Plugin {
  return {
    name: 'room-api-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);

        // Rota SSE para sincronização instantânea em tempo real
        if (req.method === 'GET' && url.pathname.startsWith('/api/rooms/') && url.pathname.endsWith('/events')) {
          const parts = url.pathname.split('/');
          const code = parts[3]?.toUpperCase();

          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });
          res.write('\n');

          if (!sseClients.has(code)) {
            sseClients.set(code, new Set());
          }
          sseClients.get(code)!.add(res);

          // Envia estado atual de imediato se já existir
          const current = rooms.get(code);
          if (current) {
            res.write(`data: ${JSON.stringify(current)}\n\n`);
          }

          req.on('close', () => {
            sseClients.get(code)?.delete(res);
          });
          return;
        }

        // Helper para ler body JSON
        const readBody = async (): Promise<any> => {
          return new Promise((resolve) => {
            let body = '';
            req.on('data', (chunk) => (body += chunk));
            req.on('end', () => {
              try {
                resolve(JSON.parse(body));
              } catch {
                resolve({});
              }
            });
          });
        };

        // Rota GET /api/rooms/:code
        if (req.method === 'GET' && url.pathname.startsWith('/api/rooms/')) {
          const parts = url.pathname.split('/');
          const code = parts[3]?.toUpperCase();
          const room = rooms.get(code);

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          if (room) {
            res.end(JSON.stringify(room));
          } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Sala não encontrada' }));
          }
          return;
        }

        // Rota POST /api/rooms/create
        if (req.method === 'POST' && url.pathname === '/api/rooms/create') {
          const data = await readBody();
          const code = String(data.code || '').trim().toUpperCase();
          rooms.set(code, data.state);
          broadcastRoom(code, data.state);

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ success: true, state: data.state }));
          return;
        }

        // Rota POST /api/rooms/update
        if (req.method === 'POST' && url.pathname === '/api/rooms/update') {
          const data = await readBody();
          const code = String(data.code || '').trim().toUpperCase();
          rooms.set(code, data.state);
          broadcastRoom(code, data.state);

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ success: true, state: data.state }));
          return;
        }

        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), roomApiPlugin()],
  server: {
    host: true,
    port: 5173,
  },
});
