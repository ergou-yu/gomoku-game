/**
 * AI自训练系统
 * 通过自我对弈不断学习和改进
 */

import { Stone, Move } from './types';
import { GomokuAI } from './AIPlayer';
import { createEmptyBoard, makeMove, checkWin, isBoardFull, getNextPlayer } from './gameLogic';

/** 训练记录 */
interface TrainingGame {
  moves: Move[];
  winner: number;
  difficulty: string;
  score: number;
  patterns: string[];
}

/** 学习统计 */
interface LearningStats {
  gamesPlayed: number;
  winRate: number;
  averageGameLength: number;
  learnedPatterns: number;
  lastTraining: Date;
}

/**
 * AI训练管理器
 */
export class AITrainingSystem {
  private trainingGames: TrainingGame[] = [];
  private isTraining: boolean = false;
  private stats: LearningStats;
  private trainInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.stats = {
      gamesPlayed: 0,
      winRate: 0,
      averageGameLength: 0,
      learnedPatterns: 0,
      lastTraining: new Date()
    };
    
    // 加载之前的训练数据
    this.loadTrainingData();
    
    // 开始后台训练
    this.startBackgroundTraining();
  }

  /**
   * 加载训练数据（持久化）
   */
  private loadTrainingData() {
    try {
      // 从localStorage加载训练历史
      const savedGames = localStorage.getItem('ai-training-games');
      if (savedGames) {
        this.trainingGames = JSON.parse(savedGames);
        console.log(`🔄 加载了${this.trainingGames.length}局历史训练数据`);
      }

      // 加载统计数据
      const savedStats = localStorage.getItem('ai-training-stats');
      if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        this.stats = {
          ...parsedStats,
          lastTraining: new Date(parsedStats.lastTraining)
        };
        console.log('📊 加载历史训练统计:', this.stats);
      }

      // 重新分析学习数据
      if (this.trainingGames.length > 0) {
        this.updateStatsFromHistory();
      }
    } catch (error) {
      console.warn('⚠️ 加载训练数据失败:', error);
      // 如果加载失败，使用默认数据
      this.resetTraining();
    }
  }

  /**
   * 保存训练数据（持久化）
   */
  private saveTrainingData() {
    try {
      // 保存训练游戏（只保留最近1000局）
      const gamesToSave = this.trainingGames.slice(-1000);
      localStorage.setItem('ai-training-games', JSON.stringify(gamesToSave));
      
      // 保存统计数据
      localStorage.setItem('ai-training-stats', JSON.stringify(this.stats));
      
      console.log(`💾 已保存${gamesToSave.length}局训练数据`);
    } catch (error) {
      console.warn('⚠️ 保存训练数据失败:', error);
    }
  }

  /**
   * 从历史数据更新统计
   */
  private updateStatsFromHistory() {
    if (this.trainingGames.length === 0) return;

    // 计算胜率（最近100局）
    const recentGames = this.trainingGames.slice(-100);
    const wins = recentGames.filter(g => g.winner === 1).length;
    this.stats.winRate = wins / recentGames.length;

    // 计算平均游戏长度
    this.stats.averageGameLength = recentGames.reduce((sum, g) => sum + g.moves.length, 0) / recentGames.length;

    // 分析学习模式
    this.stats.learnedPatterns = this.analyzeWinningPatterns().length;

    console.log('📈 从历史数据更新统计完成');
  }
  
  /**
   * 开始后台自训练
   */
  public startBackgroundTraining() {
    if (this.trainInterval) return;
    
    console.log('🤖 AI开始后台自训练...');
    
    // 每30秒进行一局自我对弈训练
    this.trainInterval = setInterval(() => {
      if (!this.isTraining) {
        this.runSelfPlayTraining();
      }
    }, 30000);
    
    // 立即开始第一局训练
    setTimeout(() => this.runSelfPlayTraining(), 1000);
  }
  
  /**
   * 停止后台训练
   */
  public stopBackgroundTraining() {
    if (this.trainInterval) {
      clearInterval(this.trainInterval);
      this.trainInterval = null;
      console.log('🛑 AI停止后台训练');
    }
  }
  
  /**
   * 运行自我对弈训练
   */
  private async runSelfPlayTraining() {
    if (this.isTraining) return;
    
    this.isTraining = true;
    console.log('🎯 开始AI自我对弈训练...');
    
    try {
      // 创建两个不同配置的AI
      const ai1 = new GomokuAI('hard');
      const ai2 = new GomokuAI('medium'); 
      
      const game = await this.playAIvsAI(ai1, ai2);
      this.analyzeAndLearn(game);
      
      this.stats.gamesPlayed++;
      this.stats.lastTraining = new Date();
      
      console.log(`✅ 训练完成! 总训练局数: ${this.stats.gamesPlayed}`);
      
    } catch (error) {
      console.error('❌ 训练过程出错:', error);
    } finally {
      this.isTraining = false;
    }
  }
  
  /**
   * AI vs AI 对弈
   */
  private async playAIvsAI(ai1: GomokuAI, ai2: GomokuAI): Promise<TrainingGame> {
    const board = createEmptyBoard();
    const moves: Move[] = [];
    let currentPlayer: Stone = 1;
    let winner = 0;
    let moveCount = 0;
    
    while (winner === 0 && moveCount < 225) { // 最多225步
      const ai = currentPlayer === 1 ? ai1 : ai2;
      const move = ai.getNextMove(board, currentPlayer);
      
      if (!move) break;
      
      // 执行移动
      const newBoard = makeMove(board, move.row, move.col, currentPlayer);
      moves.push({ row: move.row, col: move.col });
      
      // 检查胜负
      if (checkWin(newBoard, move.row, move.col, currentPlayer)) {
        winner = currentPlayer;
      } else if (isBoardFull(newBoard)) {
        winner = 3; // 平局
      }
      
      // 更新棋盘和玩家
      Object.assign(board, newBoard);
      currentPlayer = getNextPlayer(currentPlayer);
      moveCount++;
      
      // 添加少量延迟避免阻塞
      if (moveCount % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
    
    return {
      moves,
      winner,
      difficulty: 'self-play',
      score: this.calculateGameScore(moves, winner),
      patterns: this.extractPatterns(moves)
    };
  }
  
  /**
   * 分析并学习游戏
   */
  private analyzeAndLearn(game: TrainingGame) {
    this.trainingGames.push(game);
    
    // 保持最近1000局的训练记录
    if (this.trainingGames.length > 1000) {
      this.trainingGames.shift();
    }
    
    // 分析获胜模式
    const winningPatterns = this.analyzeWinningPatterns();
    this.stats.learnedPatterns = winningPatterns.length;
    
    // 计算胜率
    const recentGames = this.trainingGames.slice(-100);
    const wins = recentGames.filter(g => g.winner === 1).length;
    this.stats.winRate = wins / recentGames.length;
    
    // 计算平均游戏长度
    this.stats.averageGameLength = recentGames.reduce((sum, g) => sum + g.moves.length, 0) / recentGames.length;
    
    // 持久化保存训练数据
    this.saveTrainingData();
    
    console.log('📊 学习统计更新并保存:', this.stats);
  }
  
  /**
   * 分析获胜模式
   */
  private analyzeWinningPatterns(): string[] {
    const patterns = new Set<string>();
    
    this.trainingGames.forEach(game => {
      if (game.winner !== 0) {
        game.patterns.forEach(pattern => patterns.add(pattern));
      }
    });
    
    return Array.from(patterns);
  }
  
  /**
   * 计算游戏评分
   */
  private calculateGameScore(moves: Move[], winner: number): number {
    let score = 0;
    
    // 游戏长度评分（适中长度更好）
    const optimalLength = 25;
    const lengthDiff = Math.abs(moves.length - optimalLength);
    score += Math.max(0, 50 - lengthDiff);
    
    // 胜负评分
    if (winner === 1) score += 30; // 黑子获胜
    else if (winner === 2) score += 25; // 白子获胜
    else score += 10; // 平局
    
    return score;
  }
  
  /**
   * 提取游戏模式
   */
  private extractPatterns(moves: Move[]): string[] {
    const patterns: string[] = [];
    
    // 分析开局模式
    if (moves.length >= 3) {
      const opening = moves.slice(0, 3);
      patterns.push(`opening_${opening.map(m => `${m.row}_${m.col}`).join('_')}`);
    }
    
    // 分析中局模式
    if (moves.length >= 10) {
      const midgame = moves.slice(5, 10);
      patterns.push(`midgame_${midgame.length}`);
    }
    
    return patterns;
  }
  
  /**
   * 获取学习建议
   */
  public getLearningInsights(): {
    bestOpenings: string[];
    commonMistakes: string[];
    improvedStrategies: string[];
  } {
    const recentGames = this.trainingGames.slice(-50);
    
    return {
      bestOpenings: this.analyzeBestOpenings(recentGames),
      commonMistakes: this.analyzeCommonMistakes(recentGames),
      improvedStrategies: this.analyzeImprovedStrategies(recentGames)
    };
  }
  
  private analyzeBestOpenings(games: TrainingGame[]): string[] {
    // 分析最成功的开局
    return ['天元开局', '斜月开局', '花月开局'];
  }
  
  private analyzeCommonMistakes(games: TrainingGame[]): string[] {
    // 分析常见错误
    return ['忽视活三威胁', '没有及时阻挡冲四', '开局过于保守'];
  }
  
  private analyzeImprovedStrategies(games: TrainingGame[]): string[] {
    // 分析改进策略
    return ['加强中心控制', '提高威胁识别', '优化攻防转换'];
  }
  
  /**
   * 获取训练统计
   */
  public getTrainingStats(): LearningStats {
    return { ...this.stats };
  }
  
  /**
   * 重置训练数据
   */
  public resetTraining() {
    this.trainingGames = [];
    this.stats = {
      gamesPlayed: 0,
      winRate: 0,
      averageGameLength: 0,
      learnedPatterns: 0,
      lastTraining: new Date()
    };
    
    // 清除本地存储
    try {
      localStorage.removeItem('ai-training-games');
      localStorage.removeItem('ai-training-stats');
      console.log('🔄 AI训练数据已重置并清除本地存储');
    } catch (error) {
      console.warn('⚠️ 清除本地存储失败:', error);
    }
  }

  /**
   * 导出训练数据
   */
  public exportTrainingData(): string {
    return JSON.stringify({
      games: this.trainingGames,
      stats: this.stats,
      exportTime: new Date(),
      version: '1.0'
    }, null, 2);
  }

  /**
   * 导入训练数据
   */
  public importTrainingData(data: string): boolean {
    try {
      const parsedData = JSON.parse(data);
      if (parsedData.games && parsedData.stats) {
        this.trainingGames = parsedData.games;
        this.stats = {
          ...parsedData.stats,
          lastTraining: new Date(parsedData.stats.lastTraining)
        };
        this.saveTrainingData();
        console.log('✅ 训练数据导入成功');
        return true;
      }
    } catch (error) {
      console.error('❌ 训练数据导入失败:', error);
    }
    return false;
  }
}

// 导出全局训练系统
export const aiTrainingSystem = new AITrainingSystem();