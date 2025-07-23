import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export class WebSocketService {
  private static wss: WebSocketServer;

  static initialize(server: Server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws) => {
      console.log('New WebSocket client connected');
      
      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });
  }

  static broadcastFailedEmail(email: string, error: string) {
    if (!this.wss) return;

    const message = JSON.stringify({
      type: 'EMAIL_FAILED',
      data: {
        email,
        error: error.length > 100 ? error.substring(0, 100) + '...' : error,
        timestamp: new Date().toISOString()
      }
    });

    this.sendToAllClients(message);
  }

  static broadcastProgress(current: number, total: number, success: number, failure: number) {
    if (!this.wss) return;

    const message = JSON.stringify({
      type: 'PROGRESS_UPDATE',
      data: {
        current,
        total,
        success,
        failure,
        percentage: Math.round((current / total) * 100)
      }
    });

    this.sendToAllClients(message);
  }

  static broadcastCompletion(success: number, failure: number, total?: number) {
    if (!this.wss) return;

    const message = JSON.stringify({
      type: 'COMPLETION',
      data: {
        success,
        failure,
        total: total || success + failure,
        timestamp: new Date().toISOString()
      }
    });

    this.sendToAllClients(message);
  }

  private static sendToAllClients(message: string) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}