import { useEffect, useRef } from 'react';
import socket from '../socket';

export default function useRoomSocket({
  roomCode,
  sessionId,
  isHost = false,
  setResultData,
  setShowBoard,
  setError,
  setInfoMessage,
  onFetchSession,
  onRoomClosed,
  onAdminStop,
}) {
  const onRoomClosedRef = useRef(onRoomClosed);
  const onAdminStopRef = useRef(onAdminStop);

  useEffect(() => { onRoomClosedRef.current = onRoomClosed; });
  useEffect(() => { onAdminStopRef.current = onAdminStop; });

  // Host heartbeat: keep the waiting room alive while host is on the lobby page
  useEffect(() => {
    if (!roomCode || !isHost) return;
    socket.emit('host_heartbeat', roomCode);
    const interval = setInterval(() => {
      socket.emit('host_heartbeat', roomCode);
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [roomCode, isHost]);

  useEffect(() => {
    if (!roomCode && !sessionId) return;

    if (roomCode) {
      socket.emit('join_room_channel', roomCode);
    } else {
      socket.emit('join_session_channel', sessionId);
    }

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

      if (onFetchSession) {
        try {
          const sessionRes = await onFetchSession(startedRoom.roomCode);
          setResultData((prev) => ({
            ...prev,
            data: {
              ...(prev?.data || {}),
              room: startedRoom,
              session: sessionRes?.data || sessionRes,
            },
          }));
          setShowBoard(true);
        } catch (err) {
          setError(err.message || 'Cannot load session');
        }
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

    const handleRoomClosed = (data) => {
      if (onRoomClosedRef.current) onRoomClosedRef.current(data?.message || 'This room is closed, return to main menu.');
    };

    const handleAdminNotification = (payload) => {
      if (!payload) return;
      const message = payload.message || 'Admin stopped this match.';
      const reason = payload.reason || 'No reason provided';
      
      if (payload.action === 'stopped') {
        setInfoMessage('');
        setError('');

        // Call the admin stop callback with reason to show modal
        if (onAdminStopRef.current) {
          onAdminStopRef.current({ reason, message });
        }
      }
    };

    socket.on('room_updated', handleRoomUpdated);
    socket.on('room_started', handleRoomStarted);
    socket.on('session_updated', handleSessionUpdated);
    socket.on('room_closed', handleRoomClosed);
    socket.on('admin_notification', handleAdminNotification);

    return () => {
      socket.off('room_updated', handleRoomUpdated);
      socket.off('room_started', handleRoomStarted);
      socket.off('session_updated', handleSessionUpdated);
      socket.off('room_closed', handleRoomClosed);
      socket.off('admin_notification', handleAdminNotification);
      if (roomCode) {
        socket.emit('leave_room_channel', roomCode);
      } else {
        socket.emit('leave_session_channel', sessionId);
      }
    };
  }, [roomCode, sessionId, setResultData, setShowBoard, setError, setInfoMessage, onFetchSession]);
}
