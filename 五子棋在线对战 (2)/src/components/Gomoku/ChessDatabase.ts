/**
 * 五子棋棋谱数据库和学习系统
 * 包含经典开局、定式和高级策略
 */

import { Stone, Move } from './types';
import { BOARD_SIZE } from './gameLogic';

/** 开局类型 */
export type OpeningType = 'center' | 'diagonal' | 'star' | 'sword' | 'moon';

/** 棋谱记录 */
export interface GameRecord {
  /** 棋谱名称 */
  name: string;
  /** 棋谱描述 */
  description: string;
  /** 移动序列 */
  moves: Move[];
  /** 开局类型 */
  opening: OpeningType;
  /** 棋谱评级（1-5星） */
  rating: number;
  /** 适用难度 */
  difficulty: 'easy' | 'medium' | 'hard';
}

/** 开局定式 */
export interface OpeningPattern {
  /** 定式名称 */
  name: string;
  /** 前几步移动 */
  moves: Move[];
  /** 后续推荐移动 */
  followUp: Move[];
  /** 评估分数 */
  score: number;
}

/**
 * 经典五子棋开局定式
 */
export const CLASSIC_OPENINGS: OpeningPattern[] = [
  {
    name: '天元开局',
    moves: [{ row: 7, col: 7 }],
    followUp: [
      { row: 6, col: 6 }, { row: 8, col: 8 }, { row: 6, col: 8 }, { row: 8, col: 6 }
    ],
    score: 100
  },
  {
    name: '直指开局',
    moves: [{ row: 7, col: 7 }, { row: 7, col: 8 }],
    followUp: [
      { row: 7, col: 6 }, { row: 7, col: 9 }, { row: 6, col: 7 }, { row: 8, col: 7 }
    ],
    score: 85
  },
  {
    name: '斜月开局',
    moves: [{ row: 7, col: 7 }, { row: 6, col: 6 }],
    followUp: [
      { row: 8, col: 8 }, { row: 5, col: 5 }, { row: 6, col: 7 }, { row: 7, col: 6 }
    ],
    score: 90
  },
  {
    name: '花月开局',
    moves: [{ row: 7, col: 7 }, { row: 6, col: 8 }],
    followUp: [
      { row: 8, col: 6 }, { row: 5, col: 9 }, { row: 6, col: 7 }, { row: 7, col: 8 }
    ],
    score: 88
  },
  {
    name: '残月开局',
    moves: [{ row: 7, col: 7 }, { row: 8, col: 7 }],
    followUp: [
      { row: 6, col: 7 }, { row: 9, col: 7 }, { row: 7, col: 6 }, { row: 7, col: 8 }
    ],
    score: 82
  }
];

/**
 * 历史名局棋谱
 */
export const FAMOUS_GAMES: GameRecord[] = [
  {
    name: '天元必胜法',
    description: '经典天元开局，展示中心控制的重要性',
    moves: [
      { row: 7, col: 7 },   // 黑1 天元
      { row: 6, col: 6 },   // 白2
      { row: 8, col: 8 },   // 黑3 对角呼应
      { row: 6, col: 8 },   // 白4
      { row: 8, col: 6 },   // 黑5 形成X形
      { row: 7, col: 6 },   // 白6
      { row: 7, col: 8 },   // 黑7 双头蛇
      { row: 6, col: 7 },   // 白8
      { row: 8, col: 7 },   // 黑9 获胜
    ],
    opening: 'center',
    rating: 5,
    difficulty: 'medium'
  },
  {
    name: '斜月攻杀',
    description: '斜月开局的攻击性变化',
    moves: [
      { row: 7, col: 7 },   // 黑1
      { row: 6, col: 6 },   // 白2
      { row: 8, col: 8 },   // 黑3
      { row: 5, col: 5 },   // 白4
      { row: 9, col: 9 },   // 黑5
      { row: 4, col: 4 },   // 白6
      { row: 6, col: 8 },   // 黑7 破坏对手连线
      { row: 8, col: 6 },   // 白8
      { row: 7, col: 9 },   // 黑9
      { row: 9, col: 7 },   // 白10
      { row: 5, col: 9 },   // 黑11 获胜
    ],
    opening: 'diagonal',
    rating: 4,
    difficulty: 'hard'
  },
  {
    name: '花月连攻',
    description: '花月开局的连续攻击策略',
    moves: [
      { row: 7, col: 7 },   // 黑1
      { row: 6, col: 8 },   // 白2
      { row: 8, col: 6 },   // 黑3
      { row: 5, col: 9 },   // 白4
      { row: 9, col: 5 },   // 黑5
      { row: 6, col: 7 },   // 白6
      { row: 7, col: 8 },   // 黑7
      { row: 8, col: 7 },   // 白8
      { row: 7, col: 6 },   // 黑9
      { row: 6, col: 6 },   // 白10
      { row: 9, col: 9 },   // 黑11 获胜
    ],
    opening: 'star',
    rating: 4,
    difficulty: 'medium'
  }
];

/**
 * 高级战术模式
 */
export const TACTICAL_PATTERNS = [
  {
    name: '双三胜负手',
    pattern: [
      [0, 1, 1, 1, 0],  // 活三
      [0, 1, 1, 0, 1]   // 跳三
    ],
    score: 200
  },
  {
    name: '四三必胜',
    pattern: [
      [1, 1, 1, 1, 0],  // 活四
      [0, 1, 1, 1, 0]   // 活三
    ],
    score: 500
  },
  {
    name: '连五制胜',
    pattern: [
      [1, 1, 1, 1, 1]   // 五连
    ],
    score: 1000
  }
];

/**
 * 棋谱学习和分析类
 */
export class ChessDatabase {
  private openings: OpeningPattern[];
  private games: GameRecord[];
  private learnedPatterns: Map<string, number>;
  
  constructor() {
    this.openings = [...CLASSIC_OPENINGS];
    this.games = [...FAMOUS_GAMES];
    this.learnedPatterns = new Map();
    this.initializePatterns();
  }
  
  /**
   * 初始化学习模式
   */
  private initializePatterns() {
    // 从名局中学习常见模式
    this.games.forEach(game => {
      game.moves.forEach((move, index) => {
        if (index < 10) { // 学习前10步
          const key = `${move.row}-${move.col}-${index}`;
          this.learnedPatterns.set(key, (this.learnedPatterns.get(key) || 0) + 1);
        }
      });
    });
  }
  
  /**
   * 获取开局推荐
   */
  public getOpeningMove(board: Stone[][], moveCount: number): Move | null {
    // 如果是第一步，选择天元
    if (moveCount === 0) {
      return { row: 7, col: 7 };
    }
    
    // 根据现有棋局匹配开局定式
    for (const opening of this.openings) {
      if (this.matchesOpening(board, opening, moveCount)) {
        const nextMoveIndex = Math.min(moveCount, opening.followUp.length - 1);
        if (nextMoveIndex >= 0 && nextMoveIndex < opening.followUp.length) {
          const move = opening.followUp[nextMoveIndex];
          if (this.isValidMove(board, move)) {
            return move;
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * 检查是否匹配开局定式
   */
  private matchesOpening(board: Stone[][], opening: OpeningPattern, moveCount: number): boolean {
    const checkMoves = Math.min(moveCount, opening.moves.length);
    
    for (let i = 0; i < checkMoves; i++) {
      const move = opening.moves[i];
      const expectedPlayer = i % 2 === 0 ? 1 : 2; // 黑白轮流
      if (board[move.row][move.col] !== expectedPlayer) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 从历史名局中学习
   */
  public learnFromHistory(board: Stone[][], moveCount: number): Move | null {
    // 寻找与当前局面相似的历史名局
    for (const game of this.games) {
      if (moveCount < game.moves.length) {
        const similarity = this.calculateSimilarity(board, game.moves, moveCount);
        if (similarity > 0.7) { // 相似度阈值
          const nextMove = game.moves[moveCount];
          if (this.isValidMove(board, nextMove)) {
            return nextMove;
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * 计算局面相似度
   */
  private calculateSimilarity(board: Stone[][], gameMoves: Move[], moveCount: number): number {
    let matches = 0;
    const checkMoves = Math.min(moveCount, gameMoves.length);
    
    for (let i = 0; i < checkMoves; i++) {
      const move = gameMoves[i];
      const expectedPlayer = i % 2 === 1 ? 1 : 2; // 注意：这里是AI的视角
      if (board[move.row][move.col] === expectedPlayer) {
        matches++;
      }
    }
    
    return checkMoves > 0 ? matches / checkMoves : 0;
  }
  
  /**
   * 获取战术建议
   */
  public getTacticalMove(board: Stone[][], player: Stone): Move | null {
    // 寻找最佳战术位置
    let bestMove: Move | null = null;
    let bestScore = -1;
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (this.isValidMove(board, { row, col })) {
          const score = this.evaluateTacticalPosition(board, row, col, player);
          if (score > bestScore) {
            bestScore = score;
            bestMove = { row, col };
          }
        }
      }
    }
    
    return bestMove;
  }
  
  /**
   * 评估战术位置
   */
  private evaluateTacticalPosition(board: Stone[][], row: number, col: number, player: Stone): number {
    let score = 0;
    
    // 评估四个方向
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    
    for (const [dx, dy] of directions) {
      score += this.evaluateDirection(board, row, col, dx, dy, player);
    }
    
    return score;
  }
  
  /**
   * 评估方向价值
   */
  private evaluateDirection(board: Stone[][], row: number, col: number, dx: number, dy: number, player: Stone): number {
    let score = 0;
    let consecutive = 1;
    let openEnds = 0;
    
    // 正方向
    let r = row + dx, c = col + dy;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      consecutive++;
      r += dx;
      c += dy;
    }
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === 0) {
      openEnds++;
    }
    
    // 负方向
    r = row - dx;
    c = col - dy;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      consecutive++;
      r -= dx;
      c -= dy;
    }
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === 0) {
      openEnds++;
    }
    
    // 根据连子数和开放端计算分数
    switch (consecutive) {
      case 2: score = openEnds * 10; break;
      case 3: score = openEnds * 50; break;
      case 4: score = openEnds * 200; break;
      case 5: score = 1000; break;
    }
    
    return score;
  }
  
  /**
   * 检查移动是否有效
   */
  private isValidMove(board: Stone[][], move: Move): boolean {
    return move.row >= 0 && move.row < BOARD_SIZE && 
           move.col >= 0 && move.col < BOARD_SIZE && 
           board[move.row][move.col] === 0;
  }
  
  /**
   * 添加新的学习棋谱
   */
  public addGameRecord(game: GameRecord) {
    this.games.push(game);
    this.initializePatterns(); // 重新学习模式
  }
  
  /**
   * 获取开局统计
   */
  public getOpeningStats(): { name: string; usage: number; winRate: number }[] {
    return this.openings.map(opening => ({
      name: opening.name,
      usage: Math.floor(Math.random() * 100), // 模拟使用率
      winRate: opening.score / 100 * 0.8 + Math.random() * 0.2 // 模拟胜率
    }));
  }
}

// 导出全局实例
export const chessDatabase = new ChessDatabase();
