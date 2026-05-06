export function extractErrorMessage(error) {
  const data = error?.data;
  if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors[0]?.message || error.message || 'Request failed';
  }
  return error.message || 'Request failed';
}

export function validatePasswordChange(password, confirmPassword) {
  if (!password) return 'Please enter a new password before saving.';

  if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[$#@!]/.test(password)
  ) {
    return 'Password must be at least 8 characters and include uppercase, number, and special character ($, #, @, !).';
  }

  if (!confirmPassword) return 'Please confirm your new password before saving.';
  if (password !== confirmPassword) return 'Confirm password does not match the new password.';

  return '';
}

export function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

export function resolveReplayPlayerName(session, moveMarker, currentUsername) {
  if (!session || !moveMarker) return '-';
  const gameType = (session.gameType || '').toLowerCase();

  if (gameType === 'single_player') {
    if (moveMarker === session.player1Marker) return 'Player 1';
    if (moveMarker === session.player2Marker) return session.opponent?.name || 'Bot';
    return moveMarker;
  }

  if (gameType === 'two_player') {
    if (moveMarker === session.player1Marker) return 'Player 1';
    if (moveMarker === session.player2Marker) return 'Player 2';
    return moveMarker;
  }

  if (gameType === 'online') {
    if (moveMarker === session.player1Marker) return currentUsername || 'You';
    if (moveMarker === session.player2Marker) return session.opponent?.name || 'Opponent';
    return moveMarker;
  }

  return moveMarker;
}
