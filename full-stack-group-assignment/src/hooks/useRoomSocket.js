import { useEffect } from 'react';
import socket from '../socket';
import { getSessionByRoom } from '../services/roomService';

export default function useRoomSocket({
  roomCode,
  setResultData,
  setShowBoard,
  setError,
  setInfoMessage,
}) {
  useEffect(() => {
    if (!roomCode) return;

    socket.emit('join_room_channel', roomCode);

    const handleRoomUpdated = (updatedRoom) => {
      setResultData((prev) => ({
        ...prev,
        data: {
          ...(prev?.data || {}),
          room: updatedRoom,
          session: prev?.data?.session || null,
        },
      }));

      if (updatedRoom?.status === 'READY') {
        setInfoMessage('Room is ready. Waiting for host to start the game.');
      }

      if (updatedRoom?.status === 'FINISHED') {
        setInfoMessage('Game finished. You can play again.');
      }
    };

    const handleRoomStarted = async (payload) => {
      const startedRoom = payload?.room || payload;
      const startedSession = payload?.session || null;

      setResultData((prev) => ({
        ...prev,
        data: {
          ...(prev?.data || {}),
          room: startedRoom,
          session: startedSession || prev?.data?.session || null,
        },
      }));

      setInfoMessage('');
      setError('');

      if (startedSession) {
        setShowBoard(true);
        return;
      }

      try {
        const sessionRes = await getSessionByRoom(startedRoom.roomCode);
        setResultData((prev) => ({
          ...prev,
          data: {
            ...(prev?.data || {}),
            room: startedRoom,
            session: sessionRes.data,
          },
        }));
        setShowBoard(true);
      } catch (err) {
        setError(err.message || 'Cannot load session');
      }
    };

    const handleSessionUpdated = (updatedSession) => {
      setResultData((prev) => ({
        ...prev,
        data: {
          ...(prev?.data || {}),
          session: updatedSession,
        },
      }));

      if (updatedSession) {
        setShowBoard(true);
        setError('');
      }
    };

    socket.on('room_updated', handleRoomUpdated);
    socket.on('room_started', handleRoomStarted);
    socket.on('session_updated', handleSessionUpdated);

    return () => {
      socket.off('room_updated', handleRoomUpdated);
      socket.off('room_started', handleRoomStarted);
      socket.off('session_updated', handleSessionUpdated);
      socket.emit('leave_room_channel', roomCode);
    };
  }, [roomCode, setResultData, setShowBoard, setError, setInfoMessage]);
}