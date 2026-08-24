const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const { PORT, CLIENT_URL } = require('./src/config/env');
const setupSocket = require('./src/socket/socketHandler');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

setupSocket(io);

// Entry point
server.listen(PORT, () => {
  console.log(`🚀 Last-Mile Delivery Backend Server running on port ${PORT}`);
  console.log(`📡 WebSocket server active`);
});
