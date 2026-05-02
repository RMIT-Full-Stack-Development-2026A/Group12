import { API_ORIGIN } from '../config/appConfig'

export function toAlgebraicNotation(position) {
  if (!position || typeof position !== 'string') return ''

  const [rawRow, rawCol] = position.split(',')
  const row = Number(rawRow)
  const col = Number(rawCol)

  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0) {
    return ''
  }

  let value = col
  let column = ''

  do {
    column = String.fromCharCode(65 + (value % 26)) + column
    value = Math.floor(value / 26) - 1
  } while (value >= 0)

  return `${column}${row + 1}`
}

export function computeWinningCells(board, row, col, target = 5) {
  if (!board || row == null || col == null) return [];
  const size = board.length;
  if (row < 0 || row >= size || col < 0 || col >= size) return [];
  const marker = board[row]?.[col];
  if (!marker) return [];

  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

  for (const [dr, dc] of directions) {
    const cells = [];
    for (let i = -(target - 1); i < target; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r >= 0 && r < size && c >= 0 && c < size && board[r]?.[c] === marker) {
        cells.push(r * size + c);
      } else {
        if (cells.length >= target) break;
        cells.length = 0;
      }
    }
    if (cells.length >= target) return cells.slice(0, target);
  }
  return [];
}

export function toAssetUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  if (API_ORIGIN) return `${API_ORIGIN}${path}`
  return path
}
