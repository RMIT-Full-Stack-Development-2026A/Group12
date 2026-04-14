import { useState } from 'react';
import { createRoom } from '../services/roomService';

function CreateRoomForm() {
  const [userId, setUserId] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async (e) => {
    e.preventDefault();

    if (!userId.trim()) {
      setError('Please enter userId');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = await createRoom(userId);
      setRoomData(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto' }}>
      <h2>Create Room</h2>

      <form onSubmit={handleCreateRoom}>
        <input
          type="text"
          placeholder="Enter userId"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '12px'
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 16px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Creating...' : 'Create Room'}
        </button>
      </form>

      {error && (
        <p style={{ color: 'red', marginTop: '16px' }}>
          {error}
        </p>
      )}

      {roomData && (
        <div style={{ marginTop: '24px', padding: '16px', border: '1px solid #ccc' }}>
          <h3>Room Created Successfully</h3>
          <p><strong>Room Code:</strong> {roomData.roomCode}</p>
          <p><strong>Status:</strong> {roomData.status}</p>
          <p><strong>Current Turn:</strong> {roomData.currentTurn}</p>
          <p><strong>Created At:</strong> {new Date(roomData.createdAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

export default CreateRoomForm;