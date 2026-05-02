let ioInstance = null;

function initSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join_room_channel', (roomCode) => {
      if (!roomCode) return;
      socket.join(roomCode);
    });

    socket.on('leave_room_channel', (roomCode) => {
      if (!roomCode) return;
      socket.leave(roomCode);
    });

    socket.on('join_session_channel', (sessionId) => {
      if (!sessionId) return;
      socket.join(`session:${sessionId}`);
    });

    socket.on('leave_session_channel', (sessionId) => {
      if (!sessionId) return;
      socket.leave(`session:${sessionId}`);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
}

function getIO() {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized');
  }
  return ioInstance;
}

module.exports = {
  initSocket,
  getIO
};