import { useEffect, useState } from 'react';
import { MARKERS } from '../constants/gameOptions';

const DRAFT_KEY = 'tictactoe.create-game-draft';

function readDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export default function useGameDraft() {
  const draft = readDraft();

  const [gameMode, setGameMode] = useState(draft?.gameMode || '');
  const [marker, setMarker] = useState(draft?.marker || '');
  const [localPlayer2Marker, setLocalPlayer2Marker] = useState(draft?.localPlayer2Marker || '');
  const [localPlayer2Name, setLocalPlayer2Name] = useState(draft?.localPlayer2Name || 'Player 2');
  const [boardSize, setBoardSize] = useState(draft?.boardSize || '');
  const [aiLevel, setAiLevel] = useState(draft?.aiLevel || 'easy');
  const [nextStarterRole, setNextStarterRole] = useState(draft?.nextStarterRole || 'PLAYER1');
  const [selectedStyleId, setSelectedStyleId] = useState(draft?.selectedStyleId || 1);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        gameMode, marker, localPlayer2Marker, localPlayer2Name,
        boardSize, aiLevel, nextStarterRole, selectedStyleId,
      }));
    } catch { /* ignore storage failures */ }
  }, [gameMode, marker, localPlayer2Marker, localPlayer2Name, boardSize, aiLevel, nextStarterRole, selectedStyleId]);

  useEffect(() => {
    if (gameMode !== 'LOCAL') {
      setLocalPlayer2Marker('');
      return;
    }
    setLocalPlayer2Marker((prev) => {
      if (prev && prev !== marker) return prev;
      return MARKERS.find((item) => item !== marker) || '';
    });
  }, [gameMode, marker]);

  return {
    gameMode, setGameMode,
    marker, setMarker,
    localPlayer2Marker, setLocalPlayer2Marker,
    localPlayer2Name, setLocalPlayer2Name,
    boardSize, setBoardSize,
    aiLevel, setAiLevel,
    nextStarterRole, setNextStarterRole,
    selectedStyleId, setSelectedStyleId,
  };
}
