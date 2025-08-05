/**
 * 五子棋游戏相关类型定义
 */

/** 棋子类型：空位、黑子、白子 */
export type Stone = 0 | 1 | 2;

/** 棋盘主题类型 */
export type BoardTheme = 'classic' | 'modern' | 'ancient' | 'sakura' | 'starry';

/** 游戏模式 */
export type GameMode = 'local' | 'online';

/** 游戏状态 */
export interface GameState {
  /** 棋盘状态：15x15的二维数组 */
  board: Stone[][];
  /** 当前玩家：1为黑子，2为白子 */
  currentPlayer: Stone;
  /** 获胜者：0为未结束，1为黑子获胜，2为白子获胜，3为平局 */
  winner: number;
  /** 历史记录，用于悔棋 */
  history: Array<{
    board: Stone[][];
    currentPlayer: Stone;
  }>;
  /** 当前棋盘主题 */
  theme: BoardTheme;
  /** 游戏模式 */
  mode: GameMode;
}

/** 落子位置 */
export interface Move {
  row: number;
  col: number;
}

/** 房间信息 */
export interface RoomInfo {
  /** 房间号 */
  roomId: string;
  /** 房间内玩家数量 */
  playerCount: number;
  /** 当前玩家角色（1为黑子，2为白子） */
  playerRole: Stone;
  /** 房间状态 */
  status: 'waiting' | 'playing' | 'finished';
}

/** 在线游戏消息类型 */
export interface GameMessage {
  type: 'move' | 'restart' | 'undo' | 'join' | 'leave' | 'status';
  data: any;
  roomId: string;
  playerId: string;
}
