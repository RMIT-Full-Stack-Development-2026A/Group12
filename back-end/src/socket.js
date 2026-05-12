const roomRepo = require('./repositories/gameRoom.repository');

let ioInstance = null;

const ROOM_CODE_RE = /^[A-Z2-9]{6}$/;
const SESSION_PREFIX = 'session:';

function initSocket(io, {
  onAllDisconnected,   // legacy – kept for compat, maps to onRoomEmpty
  onRoomEmpty,
  onSessionEmpty,
  onRoomRejoined,
  onSessionRejoined,
} = {}) {
  // Support legacy single-callback form
  const _onRoomEmpty = onRoomEmpty || onAllDisconnected;

  ioInstance = io;

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join_room_channel', (roomCode) => {
      if (!roomCode) return;
      if (onRoomRejoined) onRoomRejoined(roomCode);
      socket.join(roomCode);
    });

    socket.on('leave_room_channel', (roomCode) => {
      if (!roomCode) return;
      socket.leave(roomCode);
      if (_onRoomEmpty && ROOM_CODE_RE.test(roomCode)) {
        const size = io.sockets.adapter.rooms.get(roomCode)?.size || 0;
        if (size === 0) {
          _onRoomEmpty(roomCode);
        }
      }
    });

    socket.on('join_session_channel', (sessionId) => {
      if (!sessionId) return;
      if (onSessionRejoined) onSessionRejoined(sessionId);
      socket.join(`${SESSION_PREFIX}${sessionId}`);
    });

    socket.on('leave_session_channel', (sessionId) => {
      if (!sessionId) return;
      socket.leave(`${SESSION_PREFIX}${sessionId}`);
      if (onSessionEmpty) {
        const channelKey = `${SESSION_PREFIX}${sessionId}`;
        const size = io.sockets.adapter.rooms.get(channelKey)?.size || 0;
        if (size === 0) {
          onSessionEmpty(sessionId);
        }
      }
    });

    socket.on('host_heartbeat', async (roomCode) => {
      if (!roomCode) return;
      try {
        await roomRepo.updateHostLastSeen(roomCode);
      } catch (e) { /* ignore */ }
    });

    socket.on('disconnecting', () => {
      const channels = [...socket.rooms];

      // Room channels
      if (_onRoomEmpty) {
        channels.filter((r) => ROOM_CODE_RE.test(r)).forEach((roomCode) => {
          const roomSize = io.sockets.adapter.rooms.get(roomCode)?.size || 0;
          if (roomSize - 1 === 0) {
            try { _onRoomEmpty(roomCode); } catch (e) { /* ignore */ }
          }
        });
      }

      // Session channels
      if (onSessionEmpty) {
        channels.filter((r) => r.startsWith(SESSION_PREFIX)).forEach((channel) => {
          const sessionId = channel.slice(SESSION_PREFIX.length);
          const size = io.sockets.adapter.rooms.get(channel)?.size || 0;
          if (size - 1 === 0) {
            try { onSessionEmpty(sessionId); } catch (e) { /* ignore */ }
          }
        });
      }
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