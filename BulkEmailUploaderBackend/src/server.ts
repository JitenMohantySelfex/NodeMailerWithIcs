import { app } from './app';
import { WebSocketService } from './services/websocket.service';
import { createServer } from 'http';

const PORT = process.env.PORT || 5000;

const server = createServer(app);

// Initialize WebSocket server
WebSocketService.initialize(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});