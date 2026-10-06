'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const BOARD_PATH = path.join(ROOT, 'orchestrator', 'board.json');

function readBoard() {
  if (!fs.existsSync(BOARD_PATH)) {
    return { sprint: 'default', startedAt: new Date().toISOString(), state: 'active', items: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(BOARD_PATH, 'utf8'));
  } catch {
    return { sprint: 'default', startedAt: new Date().toISOString(), state: 'active', items: [] };
  }
}

function writeBoard(board) {
  fs.mkdirSync(path.dirname(BOARD_PATH), { recursive: true });
  fs.writeFileSync(BOARD_PATH, JSON.stringify(board, null, 2) + '\n');
  return board;
}

function getBoard(sprint) {
  const board = readBoard();
  if (sprint && board.sprint !== sprint) return { sprint: board.sprint, items: [] };
  return board;
}

function updateBoard(patch) {
  const board = readBoard();
  const next = { ...board, ...patch };
  if (patch.items) next.items = patch.items;
  return writeBoard(next);
}

const board = { readBoard, writeBoard, getBoard, updateBoard };

export { board, readBoard, writeBoard, getBoard, updateBoard };
export default board;
