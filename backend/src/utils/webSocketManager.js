import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import logger from './logger.js';

class WebSocketManager {
  constructor() {
    this.clients = new Map();
    this.wss = null;
  }

  init(server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws, req) => {
      // The initial connection is unauthenticated.
      // The client must send an auth token as its first message.
      logger.info('WebSocket client connected');

      const authTimeout = setTimeout(() => {
        ws.terminate();
        logger.warn('WebSocket client terminated due to auth timeout');
      }, 10000); // 10 seconds to authenticate

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          if (data.type === 'auth' && data.token) {
            clearTimeout(authTimeout);
            jwt.verify(data.token, process.env.SUPABASE_JWT_SECRET, (err, decoded) => {
              if (err) {
                logger.warn('WebSocket authentication failed:', err.message);
                ws.terminate();
              } else {
                const userId = decoded.sub;
                this.clients.set(userId, ws);
                logger.info(`WebSocket client authenticated for user: ${userId}`);

                ws.on('close', () => {
                  this.clients.delete(userId);
                  logger.info(`WebSocket client disconnected for user: ${userId}`);
                });

                ws.send(JSON.stringify({ type: 'auth_success', message: 'Authentication successful' }));
              }
            });
          }
        } catch (e) {
          logger.error('Error processing WebSocket message:', e);
        }
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });
    });

    logger.info('WebSocket server initialized');
  }

  sendMessage(userId, message) {
    const client = this.clients.get(userId);
    if (client && client.readyState === client.OPEN) {
      client.send(JSON.stringify(message));
      return true;
    }
    return false;
  }
}

export default new WebSocketManager();
