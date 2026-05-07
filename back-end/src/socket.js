const roomRepo = require('./repositories/gameRoom.repository');

let ioInstance = null;

const ROOM_CODE_RE = /^[A-Z2-9]{6}$/;

function initSocket(io, { onAllDisconnected } = {}) {
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

    socket.on('host_heartbeat', async (roomCode) => {
      if (!roomCode) return;
      try {
        await roomRepo.updateHostLastSeen(roomCode);
      } catch (e) { /* ignore */ }
    });

    socket.on('disconnecting', () => {
      if (!onAllDisconnected) return;
      const roomCodes = [...socket.rooms].filter((r) => ROOM_CODE_RE.test(r));
      roomCodes.forEach(async (roomCode) => {
        const roomSize = io.sockets.adapter.rooms.get(roomCode)?.size || 0;
        if (roomSize - 1 === 0) {
          try {
            await onAllDisconnected(roomCode);
          } catch (e) { /* ignore */ }
        }
      });
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