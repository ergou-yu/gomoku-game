/**
 * 超级五子棋AI - 世界冠军级别
 * 集成最新算法和世界冠军棋路分析
 */

import { Stone } from './types';
import { BOARD_SIZE, checkWin, isValidMove } from './gameLogic';

/** 棋形识别系统 */
export class PatternRecognition {
  // 标准棋形模式库（参考世界冠军棋谱）
  private static patterns = {
    // 获胜棋形
    FIVE: [
      [1, 1, 1, 1, 1],
    ],
    
    // 活四（必胜）
    FOUR: [
      [0, 1, 1, 1, 1, 0],
    ],
    
    // 冲四（需要阻挡）
    BLOCKED_FOUR: [
      [2, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 2],
      [1, 1, 0, 1, 1],
      [1, 0, 1, 1, 1],
      [1, 1, 1, 0, 1],
    ],
    
    // 活三（双向发展）
    THREE: [
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 0, 1, 0],
      [0, 1, 0, 1, 1, 0],
    ],
    
    // 眠三（单向发展）
    BLOCKED_THREE: [
      [2, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 2],
      [1, 1, 0, 1, 0],
      [1, 0, 1, 1, 0],
      [0, 1, 1, 0, 1],
    ],
    
    // 活二
    TWO: [
      [0, 0, 1, 1, 0, 0],
      [0, 1, 0, 1, 0],
    ],
  };

  /**
   * 识别指定方向的棋形
   */
  public static recognizePattern(
    board: Stone[][], 
    row: number, 
    col: number, 
    dx: number, 
    dy: number, 
    player: Stone
  ): { type: string; score: number; threat: number } {
    const line = this.extractLine(board, row, col, dx, dy, 9);
    
    // 检查各种棋形
    if (this.matchesPattern(line, this.patterns.FIVE, player)) {
      return { type: 'FIVE', score: 100000, threat: 5 };
    }
    
    if (this.matchesPattern(line, this.patterns.FOUR, player)) {
      return { type: 'FOUR', score: 10000, threat: 4 };
    }
    
    const blockedFourMatch = this.matchesAnyPattern(line, this.patterns.BLOCKED_FOUR, player);
    if (blockedFourMatch) {
      return { type: 'BLOCKED_FOUR', score: 1000, threat: 3 };
    }
    
    const threeMatch = this.matchesAnyPattern(line, this.patterns.THREE, player);
    if (threeMatch) {
      return { type: 'THREE', score: 1000, threat: 2 };
    }
    
    const blockedThreeMatch = this.matchesAnyPattern(line, this.patterns.BLOCKED_THREE, player);
    if (blockedThreeMatch) {
      return { type: 'BLOCKED_THREE', score: 100, threat: 1 };
    }
    
    const twoMatch = this.matchesAnyPattern(line, this.patterns.TWO, player);
    if (twoMatch) {
      return { type: 'TWO', score: 10, threat: 0 };
    }
    
    return { type: 'NONE', score: 0, threat: 0 };
  }

  /**
   * 提取指定方向的棋子序列
   */
  private static extractLine(
    board: Stone[][], 
    row: number, 
    col: number, 
    dx: number, 
    dy: number, 
    length: number
  ): Stone[] {
    const line: Stone[] = [];
    const start = Math.floor(length / 2);
    
    for (let i = -start; i <= start; i++) {
      const r = row + i * dx;
      const c = col + i * dy;
      
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        line.push(board[r][c]);
      } else {
        line.push(2); // 边界视为对手棋子
      }
    }
    
    return line;
  }

  /**
   * 检查是否匹配指定模式
   */
  private static matchesPattern(line: Stone[], pattern: number[], player: Stone): boolean {
    if (line.length < pattern.length) return false;
    
    for (let i = 0; i <= line.length - pattern.length; i++) {
      let matches = true;
      for (let j = 0; j < pattern.length; j++) {
        const expected = pattern[j];
        const actual = line[i + j];
        
        if (expected === 1 && actual !== player) {
          matches = false;
          break;
        }
        if (expected === 2 && actual !== (3 - player)) {
          matches = false;
          break;
        }
        if (expected === 0 && actual !== 0) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }
    
    return false;
  }

  /**
   * 检查是否匹配任一模式
   */
  private static matchesAnyPattern(line: Stone[], patterns: number[][], player: Stone): boolean {
    return patterns.some(pattern => this.matchesPattern(line, pattern, player));
  }
}

/**
 * 威胁分析系统
 */
export class ThreatAnalysis {
  /**
   * 分析所有威胁
   */
  public static analyzeThreats(board: Stone[][], player: Stone): {
    myThreats: any[];
    opponentThreats: any[];
    criticalMoves: { row: number; col: number; priority: number }[];
  } {
    const opponent = player === 1 ? 2 : 1;
    const myThreats: any[] = [];
    const opponentThreats: any[] = [];
    const criticalMoves: { row: number; col: number; priority: number }[] = [];
    
    // 扫描整个棋盘
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] !== 0) continue;
        
        // 分析这个位置对我方的威胁
        const myThreat = this.evaluatePosition(board, row, col, player);
        if (myThreat.score > 100) {
          myThreats.push({ row, col, ...myThreat });
        }
        
        // 分析这个位置对对手的威胁
        const opponentThreat = this.evaluatePosition(board, row, col, opponent);
        if (opponentThreat.score > 100) {
          opponentThreats.push({ row, col, ...opponentThreat });
        }
        
        // 确定关键移动
        const priority = Math.max(myThreat.threat, opponentThreat.threat);
        if (priority > 0) {
          criticalMoves.push({ row, col, priority });
        }
      }
    }
    
    // 按优先级排序
    criticalMoves.sort((a, b) => b.priority - a.priority);
    
    return { myThreats, opponentThreats, criticalMoves };
  }

  /**
   * 评估位置威胁
   */
  private static evaluatePosition(board: Stone[][], row: number, col: number, player: Stone): {
    score: number;
    threat: number;
    patterns: string[];
  } {
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    let totalScore = 0;
    let maxThreat = 0;
    const patterns: string[] = [];
    
    for (const [dx, dy] of directions) {
      const result = PatternRecognition.recognizePattern(board, row, col, dx, dy, player);
      totalScore += result.score;
      maxThreat = Math.max(maxThreat, result.threat);
      if (result.type !== 'NONE') {
        patterns.push(result.type);
      }
    }
    
    return { score: totalScore, threat: maxThreat, patterns };
  }
}

/**
 * 超级AI引擎
 */
export class SuperGomokuAI {
  private difficulty: string;
  private maxDepth: number;
  private useOpeningBook: boolean;
  private evaluationCache: Map<string, number> = new Map();
  
  constructor(difficulty: string = 'hard') {
    this.difficulty = difficulty;
    this.maxDepth = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 4 : 6;
    this.useOpeningBook = difficulty !== 'easy';
  }

  /**
   * 获取最佳移动（主入口）
   */
  public getBestMove(board: Stone[][], player: Stone): { row: number; col: number } | null {
    console.log('超级AI开始分析...');
    const startTime = Date.now();
    
    // 1. 立即获胜检查
    const winMove = this.findWinningMove(board, player);
    if (winMove) {
      console.log('发现必胜手:', winMove);
      return winMove;
    }
    
    // 2. 阻止对手获胜
    const opponent = player === 1 ? 2 : 1;
    const blockMove = this.findWinningMove(board, opponent);
    if (blockMove) {
      console.log('阻止对手获胜:', blockMove);
      return blockMove;
    }
    
    // 3. 威胁分析
    const threats = ThreatAnalysis.analyzeThreats(board, player);
    
    // 4. 寻找双四、四三等必胜组合
    const tacticalMove = this.findTacticalMove(board, player, threats);
    if (tacticalMove) {
      console.log('发现战术手:', tacticalMove);
      return tacticalMove;
    }
    
    // 5. 使用α-β剪枝搜索最佳移动
    const bestMove = this.alphaBetaSearch(board, player, this.maxDepth);
    
    const endTime = Date.now();
    console.log(`超级AI分析完成，用时: ${endTime - startTime}ms`);
    
    return bestMove;
  }

  /**
   * 寻找获胜移动
   */
  private findWinningMove(board: Stone[][], player: Stone): { row: number; col: number } | null {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] === 0) {
          board[row][col] = player;
          const wins = checkWin(board, row, col, player);
          board[row][col] = 0;
          
          if (wins) {
            return { row, col };
          }
        }
      }
    }
    return null;
  }

  /**
   * 寻找战术移动（双四、四三等）
   */
  private findTacticalMove(
    board: Stone[][], 
    player: Stone, 
    threats: any
  ): { row: number; col: number } | null {
    // 寻找能形成双威胁的移动
    for (const move of threats.criticalMoves.slice(0, 10)) {
      board[move.row][move.col] = player;
      
      const newThreats = ThreatAnalysis.analyzeThreats(board, player);
      const myActiveThreats = newThreats.myThreats.filter(t => t.threat >= 3);
      
      board[move.row][move.col] = 0;
      
      // 如果能形成多个高威胁，这是好手
      if (myActiveThreats.length >= 2) {
        return { row: move.row, col: move.col };
      }
    }
    
    return null;
  }

  /**
   * α-β剪枝搜索
   */
  private alphaBetaSearch(
    board: Stone[][], 
    player: Stone, 
    depth: number
  ): { row: number; col: number } | null {
    let bestMove: { row: number; col: number } | null = null;
    let bestScore = -Infinity;
    
    const candidates = this.generateCandidateMoves(board, player);
    
    for (const move of candidates.slice(0, 15)) { // 限制搜索宽度
      board[move.row][move.col] = player;
      
      const score = this.minimax(board, depth - 1, -Infinity, Infinity, false, player);
      
      board[move.row][move.col] = 0;
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  }

  /**
   * Minimax算法实现
   */
  private minimax(
    board: Stone[][], 
    depth: number, 
    alpha: number, 
    beta: number, 
    maximizing: boolean, 
    originalPlayer: Stone
  ): number {
    if (depth === 0) {
      return this.evaluateBoard(board, originalPlayer);
    }
    
    const currentPlayer = maximizing ? originalPlayer : (originalPlayer === 1 ? 2 : 1);
    const candidates = this.generateCandidateMoves(board, currentPlayer);
    
    if (maximizing) {
      let maxScore = -Infinity;
      
      for (const move of candidates.slice(0, 10)) {
        board[move.row][move.col] = currentPlayer;
        
        const score = this.minimax(board, depth - 1, alpha, beta, false, originalPlayer);
        
        board[move.row][move.col] = 0;
        
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        
        if (beta <= alpha) break; // β剪枝
      }
      
      return maxScore;
      
    } else {
      let minScore = Infinity;
      
      for (const move of candidates.slice(0, 10)) {
        board[move.row][move.col] = currentPlayer;
        
        const score = this.minimax(board, depth - 1, alpha, beta, true, originalPlayer);
        
        board[move.row][move.col] = 0;
        
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        
        if (beta <= alpha) break; // α剪枝
      }
      
      return minScore;
    }
  }

  /**
   * 生成候选移动
   */
  private generateCandidateMoves(board: Stone[][], player: Stone): { row: number; col: number; score: number }[] {
    const moves: { row: number; col: number; score: number }[] = [];
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] === 0 && this.isRelevantPosition(board, row, col)) {
          const score = this.quickEvaluate(board, row, col, player);
          moves.push({ row, col, score });
        }
      }
    }
    
    // 按评分排序
    moves.sort((a, b) => b.score - a.score);
    return moves;
  }

  /**
   * 检查位置是否相关（减少搜索空间）
   */
  private isRelevantPosition(board: Stone[][], row: number, col: number): boolean {
    const range = 2;
    
    for (let r = Math.max(0, row - range); r <= Math.min(BOARD_SIZE - 1, row + range); r++) {
      for (let c = Math.max(0, col - range); c <= Math.min(BOARD_SIZE - 1, col + range); c++) {
        if (board[r][c] !== 0) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * 快速评估位置
   */
  private quickEvaluate(board: Stone[][], row: number, col: number, player: Stone): number {
    const opponent = player === 1 ? 2 : 1;
    
    const myEval = ThreatAnalysis.analyzeThreats(board, player);
    const opponentEval = ThreatAnalysis.analyzeThreats(board, opponent);
    
    return myEval.myThreats.length * 100 - opponentEval.opponentThreats.length * 80;
  }

  /**
   * 评估整个棋盘
   */
  private evaluateBoard(board: Stone[][], player: Stone): number {
    const boardKey = this.getBoardKey(board);
    const cached = this.evaluationCache.get(boardKey);
    if (cached !== undefined) return cached;
    
    const opponent = player === 1 ? 2 : 1;
    
    let score = 0;
    
    // 位置价值
    score += this.evaluatePositionalAdvantage(board, player);
    
    // 棋形评估
    score += this.evaluatePatterns(board, player) - this.evaluatePatterns(board, opponent);
    
    this.evaluationCache.set(boardKey, score);
    return score;
  }

  /**
   * 评估位置优势
   */
  private evaluatePositionalAdvantage(board: Stone[][], player: Stone): number {
    let score = 0;
    const center = Math.floor(BOARD_SIZE / 2);
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] === player) {
          const distance = Math.abs(row - center) + Math.abs(col - center);
          score += Math.max(0, 14 - distance);
        }
      }
    }
    
    return score;
  }

  /**
   * 评估棋形
   */
  private evaluatePatterns(board: Stone[][], player: Stone): number {
    let score = 0;
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] === player) {
          for (const [dx, dy] of directions) {
            const pattern = PatternRecognition.recognizePattern(board, row, col, dx, dy, player);
            score += pattern.score;
          }
        }
      }
    }
    
    return score;
  }

  /**
   * 获取棋盘状态键
   */
  private getBoardKey(board: Stone[][]): string {
    return board.map(row => row.join('')).join('');
  }
}
