/**
 * 五子棋超级智能AI系统
 * 集成现代算法：α-β剪枝、棋形识别、威胁评估、开局库、中局战术
 * 参考世界冠军棋路，实现准职业级别的AI对手
 */

import { Stone } from './types';
import { BOARD_SIZE, checkWin, isValidMove } from './gameLogic';
import { chessDatabase } from './ChessDatabase';
import { SuperGomokuAI } from './SuperAI';
import { aiTrainingSystem } from './AITrainingSystem';

/** AI难度级别 */
export type AIDifficulty = 'easy' | 'medium' | 'hard';

/** 位置评分 */
interface PositionScore {
  row: number;
  col: number;
  score: number;
  threat: number;
  priority: number;
}

/** 棋形类型 */
type PatternType = 'FIVE' | 'FOUR' | 'SFOUR' | 'THREE' | 'STHREE' | 'TWO' | 'ONE';

/** 棋形评分表 */
const PATTERN_SCORES = {
  FIVE: 100000,     // 五连
  FOUR: 10000,      // 活四
  SFOUR: 1000,      // 冲四  
  THREE: 1000,      // 活三
  STHREE: 100,      // 眠三
  TWO: 10,          // 活二
  ONE: 1            // 活一
};

/** 威胁等级 */
const THREAT_LEVELS = {
  WIN: 5,           // 直接获胜
  BLOCK_WIN: 4,     // 阻止对手获胜
  DOUBLE_FOUR: 3,   // 双四必胜
  FOUR_THREE: 2,    // 四三必胜  
  DOUBLE_THREE: 1   // 双三优势
};

/**
 * 五子棋AI类
 */
export class GomokuAI {
  private difficulty: AIDifficulty;
  private maxDepth: number;
  private moveCount: number;
  private useDatabase: boolean;
  private superAI: SuperGomokuAI;
  
  constructor(difficulty: AIDifficulty = 'medium') {
    this.difficulty = difficulty;
    this.maxDepth = this.getDifficultyDepth(difficulty);
    this.moveCount = 0;
    this.useDatabase = true;
    this.superAI = new SuperGomokuAI(difficulty);
  }
  
  /**
   * 根据难度获取搜索深度
   */
  private getDifficultyDepth(difficulty: AIDifficulty): number {
    switch (difficulty) {
      case 'easy': return 1;
      case 'medium': return 2;
      case 'hard': return 3;
      default: return 2;
    }
  }
  
  /**
   * 获取AI的下一步移动 - 全面威胁检测
   */
  public getNextMove(board: Stone[][], aiPlayer: Stone): { row: number; col: number } | null {
    console.log('=== AI开始分析棋局 ===');
    console.log('AI玩家:', aiPlayer === 1 ? '黑子' : '白子');
    console.log('难度:', this.difficulty);
    
    const startTime = Date.now();
    const opponent = aiPlayer === 1 ? 2 : 1;
    
    // 计算当前步数
    this.moveCount = this.calculateMoveCount(board);
    console.log('当前步数:', this.moveCount);
    
    // 第一步选择天元
    if (this.isEmptyBoard(board)) {
      console.log('✅ 开局选择天元位置');
      return { row: 7, col: 7 };
    }
    
    // 🚨 最高优先级：检查AI是否能直接获胜
    const aiWinMove = this.findWinningMove(board, aiPlayer);
    if (aiWinMove) {
      console.log('🏆 发现AI必胜手!', aiWinMove);
      return aiWinMove;
    }
    
    // 🛡️ 第二优先级：检查是否需要阻止对手获胜
    const opponentWinMove = this.findWinningMove(board, opponent);
    if (opponentWinMove) {
      console.log('🚨 阻止对手获胜!', opponentWinMove);
      return opponentWinMove;
    }
    
    // 🔍 第三优先级：检查对手的活三威胁
    const opponentThreeMove = this.findActiveThreeThreat(board, opponent);
    if (opponentThreeMove) {
      console.log('⚠️ 阻止对手活三!', opponentThreeMove);
      return opponentThreeMove;
    }
    
    // ⚔️ 第四优先级：寻找AI的攻击机会
    const aiAttackMove = this.findBestAttackMove(board, aiPlayer);
    if (aiAttackMove) {
      console.log('⚔️ AI攻击移动:', aiAttackMove);
      return aiAttackMove;
    }
    
    // 开局数据库（前10步）
    if (this.useDatabase && this.moveCount < 10) {
      const openingMove = chessDatabase.getOpeningMove(board, this.moveCount);
      if (openingMove && isValidMove(board, openingMove.row, openingMove.col)) {
        console.log('📚 使用开局定式:', openingMove);
        return openingMove;
      }
    }
    
    // 超级AI引擎（困难模式）
    if (this.difficulty === 'hard') {
      const superMove = this.superAI.getBestMove(board, aiPlayer);
      if (superMove) {
        console.log('🧠 超级AI建议:', superMove);
        return superMove;
      }
    }
    
    // 基础评分系统
    const bestMove = this.findHighestScoredMove(board, aiPlayer);
    
    const endTime = Date.now();
    console.log(`AI分析完成，用时: ${endTime - startTime}ms`);
    console.log('最终选择:', bestMove);
    
    return bestMove;
  }

  /**
   * 检查活三威胁（三子连线，两端都可以落子形成活四）
   */
  private findActiveThreeThreat(board: Stone[][], player: Stone): { row: number; col: number } | null {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] !== player) continue;
        
        for (const [dx, dy] of directions) {
          let consecutive = 1;
          let positions = [{ row, col }];
          
          // 正向检查
          let r = row + dx, c = col + dy;
          while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
            consecutive++;
            positions.push({ row: r, col: c });
            r += dx;
            c += dy;
          }
          
          // 负向检查
          r = row - dx;
          c = col - dy;
          while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
            consecutive++;
            positions.unshift({ row: r, col: c });
            r -= dx;
            c -= dy;
          }
          
          // 如果有3个连子，检查是否形成活三
          if (consecutive === 3) {
            const firstPos = positions[0];
            const lastPos = positions[positions.length - 1];
            
            // 检查前端
            const frontRow = firstPos.row - dx;
            const frontCol = firstPos.col - dy;
            const frontValid = frontRow >= 0 && frontRow < BOARD_SIZE && frontCol >= 0 && frontCol < BOARD_SIZE && board[frontRow][frontCol] === 0;
            
            // 检查后端
            const backRow = lastPos.row + dx;
            const backCol = lastPos.col + dy;
            const backValid = backRow >= 0 && backRow < BOARD_SIZE && backCol >= 0 && backCol < BOARD_SIZE && board[backRow][backCol] === 0;
            
            // 如果两端都可以落子（活三），随机选择一端阻挡
            if (frontValid && backValid) {
              return Math.random() < 0.5 ? 
                { row: frontRow, col: frontCol } : 
                { row: backRow, col: backCol };
            }
            
            // 如果只有一端可以落子，阻挡该端
            if (frontValid) return { row: frontRow, col: frontCol };
            if (backValid) return { row: backRow, col: backCol };
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * 检查棋盘是否为空
   */
  private isEmptyBoard(board: Stone[][]): boolean {
    return board.every(row => row.every(cell => cell === 0));
  }
  
  /**
   * 获取最佳移动位置
   */
  private getBestMove(board: Stone[][], aiPlayer: Stone): { row: number; col: number } | null {
    const opponent = aiPlayer === 1 ? 2 : 1;
    
    // 1. 检查是否可以直接获胜
    const winMove = this.findWinningMove(board, aiPlayer);
    if (winMove) return winMove;
    
    // 2. 检查是否需要防守
    const blockMove = this.findWinningMove(board, opponent);
    if (blockMove) return blockMove;
    
    // 3. 寻找最佳攻击位置
    const bestAttackMove = this.findBestAttackMove(board, aiPlayer);
    if (bestAttackMove) return bestAttackMove;
    
    // 4. 选择评分最高的位置
    return this.findHighestScoredMove(board, aiPlayer);
  }
  
  /**
   * 查找获胜移动 - 增强版威胁检测
   */
  private findWinningMove(board: Stone[][], player: Stone): { row: number; col: number } | null {
    console.log(`检查玩家${player}的获胜机会...`);
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (isValidMove(board, row, col)) {
          // 模拟落子
          board[row][col] = player;
          const isWin = checkWin(board, row, col, player);
          board[row][col] = 0; // 撤销
          
          if (isWin) {
            console.log(`发现${player === 1 ? '黑子' : '白子'}获胜手: (${row}, ${col})`);
            return { row, col };
          }
        }
      }
    }
    
    // 检查冲四威胁
    const rushFourMove = this.findRushFourThreat(board, player);
    if (rushFourMove) {
      console.log(`发现${player === 1 ? '黑子' : '白子'}冲四威胁: (${rushFourMove.row}, ${rushFourMove.col})`);
      return rushFourMove;
    }
    
    return null;
  }

  /**
   * 检查冲四威胁（四子连线，两端有一端可落子获胜）
   */
  private findRushFourThreat(board: Stone[][], player: Stone): { row: number; col: number } | null {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]]; // 四个方向
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] !== player) continue;
        
        for (const [dx, dy] of directions) {
          let consecutive = 1;
          let positions = [{ row, col }];
          
          // 正向检查
          let r = row + dx, c = col + dy;
          while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
            consecutive++;
            positions.push({ row: r, col: c });
            r += dx;
            c += dy;
          }
          
          // 负向检查
          r = row - dx;
          c = col - dy;
          while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
            consecutive++;
            positions.unshift({ row: r, col: c });
            r -= dx;
            c -= dy;
          }
          
          // 如果有4个连子，检查两端是否可以落子获胜
          if (consecutive >= 4) {
            const firstPos = positions[0];
            const lastPos = positions[positions.length - 1];
            
            // 检查前端
            const frontRow = firstPos.row - dx;
            const frontCol = firstPos.col - dy;
            if (frontRow >= 0 && frontRow < BOARD_SIZE && frontCol >= 0 && frontCol < BOARD_SIZE && board[frontRow][frontCol] === 0) {
              return { row: frontRow, col: frontCol };
            }
            
            // 检查后端
            const backRow = lastPos.row + dx;
            const backCol = lastPos.col + dy;
            if (backRow >= 0 && backRow < BOARD_SIZE && backCol >= 0 && backCol < BOARD_SIZE && board[backRow][backCol] === 0) {
              return { row: backRow, col: backCol };
            }
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * 查找最佳攻击位置
   */
  private findBestAttackMove(board: Stone[][], player: Stone): { row: number; col: number } | null {
    let bestScore = -1;
    let bestMove: { row: number; col: number } | null = null;
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (isValidMove(board, row, col)) {
          const score = this.evaluatePosition(board, row, col, player);
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
   * 查找评分最高的移动
   */
  private findHighestScoredMove(board: Stone[][], player: Stone): { row: number; col: number } | null {
    const validMoves: PositionScore[] = [];
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (isValidMove(board, row, col)) {
          const score = this.evaluatePosition(board, row, col, player);
          validMoves.push({ row, col, score });
        }
      }
    }
    
    if (validMoves.length === 0) return null;
    
    // 按评分排序
    validMoves.sort((a, b) => b.score - a.score);
    
    // 在最高分的几个位置中随机选择（增加变化性）
    const topMoves = validMoves.filter(move => move.score === validMoves[0].score);
    const randomIndex = Math.floor(Math.random() * Math.min(topMoves.length, 3));
    
    return { row: topMoves[randomIndex].row, col: topMoves[randomIndex].col };
  }
  
  /**
   * 获取随机有效移动
   */
  private getRandomValidMoves(board: Stone[][], count: number): { row: number; col: number }[] {
    const validMoves: { row: number; col: number }[] = [];
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (isValidMove(board, row, col)) {
          validMoves.push({ row, col });
        }
      }
    }
    
    // 随机打乱并返回前count个
    const shuffled = validMoves.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
  
  /**
   * 评估位置价值
   */
  private evaluatePosition(board: Stone[][], row: number, col: number, player: Stone): number {
    let score = 0;
    
    // 基础位置分数（中心位置更高）
    const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
    score += (14 - centerDistance) * 2;
    
    // 评估四个方向的连子情况
    const directions = [
      [0, 1],   // 水平
      [1, 0],   // 垂直
      [1, 1],   // 主对角线
      [1, -1],  // 副对角线
    ];
    
    for (const [dx, dy] of directions) {
      const lineScore = this.evaluateLine(board, row, col, dx, dy, player);
      score += lineScore;
    }
    
    return score;
  }
  
  /**
   * 评估一条线的价值
   */
  private evaluateLine(board: Stone[][], row: number, col: number, dx: number, dy: number, player: Stone): number {
    let score = 0;
    let consecutive = 1; // 包含当前位置
    let openEnds = 0; // 开放端点数量
    
    // 向正方向检查
    let r = row + dx;
    let c = col + dy;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      consecutive++;
      r += dx;
      c += dy;
    }
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === 0) {
      openEnds++;
    }
    
    // 向负方向检查
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
    
    // 根据连子数和开放端点计算分数
    switch (consecutive) {
      case 2: score = openEnds * 10; break;
      case 3: score = openEnds * 50; break;
      case 4: score = openEnds * 200; break;
      case 5: score = 1000; break; // 五连
    }
    
    return score;
  }
  
  /**
   * 计算当前步数
   */
  private calculateMoveCount(board: Stone[][]): number {
    let count = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] !== 0) {
          count++;
        }
      }
    }
    return count;
  }
  
  /**
   * 设置AI难度
   */
  public setDifficulty(difficulty: AIDifficulty) {
    this.difficulty = difficulty;
    this.maxDepth = this.getDifficultyDepth(difficulty);
    this.superAI = new SuperGomokuAI(difficulty);
    
    // 根据难度调整数据库使用
    switch (difficulty) {
      case 'easy':
        this.useDatabase = false; // 简单模式不使用数据库
        break;
      case 'medium':
        this.useDatabase = true; // 中等模式使用基础数据库
        break;
      case 'hard':
        this.useDatabase = true; // 困难模式全面使用数据库 + 超级AI
        break;
    }
  }
  
  /**
   * 获取当前难度
   */
  public getDifficulty(): AIDifficulty {
    return this.difficulty;
  }
}

// 导出AI实例
export const gomokuAI = new GomokuAI();
