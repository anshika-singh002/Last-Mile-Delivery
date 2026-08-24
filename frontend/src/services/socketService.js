import { io } from 'socket.io-client';

let socket = null;

export const socketService = {
  connect: () => {
    if (!socket) {
      socket = io('/', {
        transports: ['websocket', 'polling']
      });
    }
    return socket;
  },
  joinOrderRoom: (orderId) => {
    if (socket) {
      socket.emit('join_order_room', orderId);
    }
  },
  onLocationUpdate: (callback) => {
    if (socket) {
      socket.on('live_location_changed', callback);
    }
  },
  onStatusUpdate: (callback) => {
    if (socket) {
      socket.on('status_changed', callback);
    }
  },
  sendLocationUpdate: (locationData) => {
    if (socket) {
      socket.emit('agent_location_update', locationData);
    }
  },
  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }
};
