function createBoard(size) {
  return Array.from({ length: size }, () => Array(size).fill(''));
}

function placeMarker(board, row, col, marker) {
  if (
    row < 0 ||
    col < 0 ||
    row >= board.length ||
    col >= board[0].length
  ) {
    throw new Error('Invalid position');
  }

  if (board[row][col] !== '') {
    throw new Error('Cell is already occupied');
  }

  board[row][col] = marker;
}

function getGameStatus(board, row, col) {
  const marker = board[row][col];
  if (!marker) {
    return { status: 'PLAYING', winner: null };
  }

  const size = board.length;
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];

  const countInDirection = (dx, dy) => {
    let count = 1;

    let r = row + dx;
    let c = col + dy;
    while (
      r >= 0 &&
      r < size &&
      c >= 0 &&
      c < size &&
      board[r][c] === marker
    ) {
      count++;
      r += dx;
      c += dy;
    }

    r = row - dx;
    c = col - dy;
    while (
      r >= 0 &&
      r < size &&
      c >= 0 &&
      c < size &&
      board[r][c] === marker
    ) {
      count++;
      r -= dx;
      c -= dy;
    }

    return count;
  };

  const target = size === 3 ? 3 : 5;

  for (const [dx, dy] of directions) {
    if (countInDirection(dx, dy) >= target) {
      return {
        status: 'WIN',
        winner: marker
      };
    }
  }

  const isDraw = board.every((boardRow) =>
    boardRow.every((cell) => cell !== '')
  );

  if (isDraw) {
    return {
      status: 'DRAW',
      winner: null
    };
  }

  return {
    status: 'PLAYING',
    winner: null
  };
}

module.exports = {
  createBoard,
  placeMarker,
  getGameStatus
};