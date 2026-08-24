function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);

    socket.on('join_order_room', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`[SOCKET] Socket ${socket.id} joined order room: order_${orderId}`);
    });

    socket.on('agent_location_update', ({ orderId, agentId, lat, lng }) => {
      io.to(`order_${orderId}`).emit('live_location_changed', {
        orderId,
        agentId,
        location: { lat, lng },
        timestamp: new Date().toISOString()
      });
    });

    socket.on('order_status_update', ({ orderId, status, notes }) => {
      io.to(`order_${orderId}`).emit('status_changed', {
        orderId,
        status,
        notes,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET] Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = setupSocket;
