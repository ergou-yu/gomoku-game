/**
 * 五子棋游戏逻辑处理
 * 包含胜负判断、棋盘状态管理等核心逻辑
 */

import { Stone } from './types';

/** 棋盘大小 */
export const BOARD_SIZE = 15;

/**
 * 创建空棋盘
 */
export const createEmptyBoard = (): Stone[][] => {
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(0));
};

/**
 * 检查指定位置是否可以落子
 */
export const isValidMove = (board: Stone[][], row: number, col: number): boolean => {
  return (
    row >= 0 &&
    row < BOARD_SIZE &&
    col >= 0 &&
    col < BOARD_SIZE &&
    board[row][col] === 0
  );
};

/**
 * 检查游戏是否获胜
 * @param board 棋盘状态
 * @param row 最后落子的行
 * @param col 最后落子的列
 * @param player 当前玩家
 * @returns 是否获胜
 */
export const checkWin = (
  board: Stone[][],
  row: number,
  col: number,
  player: Stone
): boolean => {
  if (player === 0) return false;

  // 四个方向：水平、垂直、主对角线、副对角线
  const directions = [
    [0, 1],   // 水平
    [1, 0],   // 垂直
    [1, 1],   // 主对角线
    [1, -1],  // 副对角线
  ];

  for (const [dx, dy] of directions) {
    let count = 1; // 包含当前落子

    // 向一个方向检查
    let r = row + dx;
    let c = col + dy;
    while (
      r >= 0 &&
      r < BOARD_SIZE &&
      c >= 0 &&
      c < BOARD_SIZE &&
      board[r][c] === player
    ) {
      count++;
      r += dx;
      c += dy;
    }

    // 向相反方向检查
    r = row - dx;
    c = col - dy;
    while (
      r >= 0 &&
      r < BOARD_SIZE &&
      c >= 0 &&
      c < BOARD_SIZE &&
      board[r][c] === player
    ) {
      count++;
      r -= dx;
      c -= dy;
    }

    // 如果连续五子或以上，则获胜
    if (count >= 5) {
      return true;
    }
  }

  return false;
};

/**
 * 检查棋盘是否已满（平局）
 */
export const isBoardFull = (board: Stone[][]): boolean => {
  return board.every(row => row.every(cell => cell !== 0));
};

/**
 * 深拷贝棋盘
 */
export const cloneBoard = (board: Stone[][]): Stone[][] => {
  return board.map(row => [...row]);
};

/**
 * 执行落子操作
 * @param board 当前棋盘状态
 * @param row 落子行
 * @param col 落子列
 * @param player 当前玩家
 * @returns 新的棋盘状态
 */
export const makeMove = (
  board: Stone[][],
  row: number,
  col: number,
  player: Stone
): Stone[][] => {
  if (!isValidMove(board, row, col)) {
    return board;
  }

  const newBoard = cloneBoard(board);
  newBoard[row][col] = player;
  return newBoard;
};

/**
 * 获取下一个玩家
 */
export const getNextPlayer = (currentPlayer: Stone): Stone => {
  return currentPlayer === 1 ? 2 : 1;
};
