const API_BASE_URL = 'http://localhost:5000/api/rooms';

export const createRoom = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create room');
  }

  return data;
};