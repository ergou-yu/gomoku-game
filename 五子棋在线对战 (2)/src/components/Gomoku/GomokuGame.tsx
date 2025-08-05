/**
 * 五子棋游戏主组件
 * 管理游戏状态和协调各个子组件
 * 支持多主题、在线对战和响应式布局
 */

import React, { useState, useCallback, useEffect } from 'react';
import './gomoku.css';
import { GameBoard } from './GameBoard';
import { GameControls } from './GameControls';
import { ThemeSelector } from './ThemeSelector';
import { OnlineControls } from './OnlineControls';
import { globalOnlineManager } from './GlobalOnlineSystem';
import { SoundSystem, soundManager, SoundType } from './SoundSystem';
import { AIControls } from './AIControls';
import { gomokuAI, AIDifficulty } from './AIPlayer';
import { LoginModal } from '../Auth/LoginModal';
import { UserProfile } from '../Auth/UserProfile';
import { userManager } from '../Auth/UserSystem';
import { GameState, BoardTheme, GameMode, RoomInfo } from './types';
import {
  createEmptyBoard,
  checkWin,
  isBoardFull,
  makeMove,
  getNextPlayer,
  cloneBoard,
} from './gameLogic';

/**
 * 创建初始游戏状态
 */
const createInitialState = (): GameState => ({
  board: createEmptyBoard(),
  currentPlayer: 1, // 黑子先手
  winner: 0,
  history: [],
  theme: 'classic',
  mode: 'local',
});

/**
 * 生成随机房间号
 */
const generateRoomId = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const GomokuGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [aiThinking, setAiThinking] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(userManager.getCurrentUser());

  // 初始化AI难度和用户系统
  React.useEffect(() => {
    gomokuAI.setDifficulty(aiDifficulty);
    console.log('AI初始化完成，难度:', aiDifficulty);
    
    // 初始化用户系统
    setIsLoggedIn(userManager.isAuthenticated());
    setCurrentUser(userManager.getCurrentUser());
    
    // 设置用户系统回调
    userManager.setCallbacks({
      onAuthChange: (user) => {
        setIsLoggedIn(!!user);
        setCurrentUser(user);
      },
      onLevelUp: (newLevel) => {
        // 显示升级提示
        console.log('🎉 恭喜升级到', newLevel, '级！');
      }
    });
  }, []);

  /**
   * AI执行落子
   */
  const executeAIMove = useCallback(async () => {
    if (!aiEnabled || gameState.winner !== 0 || gameState.currentPlayer !== 2) {
      return;
    }

    setAiThinking(true);
    
    // 添加思考延迟，让AI看起来更真实
    setTimeout(() => {
      const aiMove = gomokuAI.getNextMove(gameState.board, 2);
      
      if (aiMove) {
        handleMove(aiMove.row, aiMove.col);
      }
      
      setAiThinking(false);
    }, 500 + Math.random() * 1000); // 0.5-1.5秒的思考时间
  }, [aiEnabled, gameState.winner, gameState.currentPlayer, gameState.board]);

  /**
   * 处理落子
   */
  const handleMove = useCallback((row: number, col: number) => {
    console.log('handleMove被调用:', { 
      row, 
      col, 
      currentPlayer: gameState.currentPlayer, 
      winner: gameState.winner,
      boardValue: gameState.board[row][col],
      aiEnabled,
      aiThinking
    });

    if (gameState.winner !== 0 || gameState.board[row][col] !== 0) {
      console.log('落子被阻止: 游戏已结束或位置已占用');
      soundManager.play('error');
      return;
    }

    // 在线模式下检查是否轮到当前玩家
    if (gameState.mode === 'online' && roomInfo && roomInfo.playerRole !== gameState.currentPlayer) {
      console.log('落子被阻止: 在线模式下不是当前玩家的回合');
      soundManager.play('error');
      return;
    }

    // 播放落子音效
    soundManager.play('move');
    console.log('开始执行落子逻辑...');

    setGameState(prevState => {
      // 保存当前状态到历史记录
      const newHistory = [
        ...prevState.history,
        {
          board: cloneBoard(prevState.board),
          currentPlayer: prevState.currentPlayer,
        },
      ];

      // 执行落子
      const newBoard = makeMove(prevState.board, row, col, prevState.currentPlayer);
      
      // 检查是否获胜
      const hasWon = checkWin(newBoard, row, col, prevState.currentPlayer);
      const isFull = isBoardFull(newBoard);
      
      let winner = 0;
      if (hasWon) {
        winner = prevState.currentPlayer;
        soundManager.play('win');
        
        // 更新用户游戏统计
        if (isLoggedIn) {
          const playerWon = (gameState.mode === 'local' && prevState.currentPlayer === 1) || 
                           (gameState.mode === 'online' && roomInfo?.playerRole === prevState.currentPlayer);
          userManager.updateGameStats(playerWon, 15); // 获胜15经验
        }
      } else if (isFull) {
        winner = 3; // 平局
        soundManager.play('win');
        
        // 平局也给经验
        if (isLoggedIn) {
          userManager.updateGameStats(false, 5); // 平局5经验
        }
      }

      return {
        ...prevState,
        board: newBoard,
        currentPlayer: winner === 0 ? getNextPlayer(prevState.currentPlayer) : prevState.currentPlayer,
        winner,
        history: newHistory,
      };
    });

    // 在线模式下发送落子消息
    if (gameState.mode === 'online') {
      console.log('发送落子消息:', { row, col, player: gameState.currentPlayer });
    }
  }, [gameState.winner, gameState.board, gameState.mode, roomInfo]);

  // AI自动执行落子的useEffect
  useEffect(() => {
    console.log('AI useEffect 触发:', {
      aiEnabled,
      currentPlayer: gameState.currentPlayer,
      winner: gameState.winner,
      aiThinking
    });

    if (aiEnabled && gameState.currentPlayer === 2 && gameState.winner === 0 && !aiThinking) {
      console.log('AI开始思考...');
      setAiThinking(true);
      
      const timer = setTimeout(() => {
        console.log('AI思考完成，准备落子...');
        
        // 再次检查状态，防止在延迟期间状态发生变化
        if (!aiEnabled || gameState.winner !== 0 || gameState.currentPlayer !== 2) {
          console.log('AI落子被取消，状态已变化');
          setAiThinking(false);
          return;
        }

        const aiMove = gomokuAI.getNextMove(gameState.board, 2);
        console.log('AI获取到移动:', aiMove);
        
        if (aiMove) {
          console.log('AI执行落子:', aiMove);
          handleMove(aiMove.row, aiMove.col);
        } else {
          console.log('AI没有获取到有效移动');
        }
        
        setAiThinking(false);
      }, 800 + Math.random() * 800); // 0.8-1.6秒的思考时间

      return () => {
        console.log('AI useEffect 清理');
        clearTimeout(timer);
        setAiThinking(false);
      };
    }
  }, [aiEnabled, gameState.currentPlayer, gameState.winner, gameState.board, handleMove]);

  /**
   * 重新开始游戏
   */
  const handleRestart = useCallback(() => {
    soundManager.play('button');
    setAiThinking(false);
    setGameState(prev => ({
      ...createInitialState(),
      theme: prev.theme,
      mode: prev.mode,
    }));
  }, []);

  /**
   * 悔棋
   */
  const handleUndo = useCallback(() => {
    if (gameState.history.length === 0) return;

    // 在线模式下不允许悔棋
    if (gameState.mode === 'online') return;

    soundManager.play('button');
    setAiThinking(false); // 停止AI思考
    
    setGameState(prevState => {
      // AI模式下需要悔棋两步（玩家和AI的），否则悔棋一步
      let stepsToUndo = 1;
      if (aiEnabled && prevState.history.length >= 2) {
        stepsToUndo = 2;
      }

      const targetIndex = Math.max(0, prevState.history.length - stepsToUndo);
      const previousState = prevState.history[targetIndex] || {
        board: createEmptyBoard(),
        currentPlayer: 1,
      };
      const newHistory = prevState.history.slice(0, targetIndex);

      return {
        ...prevState,
        board: previousState.board,
        currentPlayer: previousState.currentPlayer,
        winner: 0,
        history: newHistory,
      };
    });
  }, [gameState.history.length, gameState.mode, aiEnabled]);

  /**
   * 切换主题
   */
  const handleThemeChange = useCallback((theme: BoardTheme) => {
    setGameState(prev => ({ ...prev, theme }));
  }, []);

  /**
   * 切换游戏模式
   */
  const handleModeChange = useCallback((mode: GameMode) => {
    setGameState(prev => ({ ...prev, mode }));
    if (mode === 'local') {
      setRoomInfo(null);
    }
  }, []);

  /**
   * 创建房间
   */
  const handleCreateRoom = useCallback(async () => {
    console.log('🏠 创建全球房间...');
    try {
      const roomId = await globalOnlineManager.createRoom(true);
      if (roomId) {
        console.log('✅ 全球房间创建成功:', roomId);
        // 全球房间信息通过globalOnlineManager的回调处理
      }
    } catch (error) {
      console.error('❌ 创建全球房间失败:', error);
    }
  }, []);

  /**
   * 加入房间
   */
  const handleJoinRoom = useCallback(async (roomId: string) => {
    console.log('🚪 加入全球房间:', roomId);
    try {
      const success = await globalOnlineManager.joinRoom(roomId);
      if (success) {
        console.log('✅ 成功加入全球房间');
        // 房间信息通过globalOnlineManager的回调处理
      }
    } catch (error) {
      console.error('❌ 加入全球房间失败:', error);
    }
  }, []);

  /**
   * 离开房间
   */
  const handleLeaveRoom = useCallback(() => {
    console.log('🚪 离开全球房间');
    globalOnlineManager.leaveRoom();
    setRoomInfo(null);
    setGameState(prev => ({ ...prev, mode: 'local' }));
  }, []);

  /**
   * 音效设置
   */
  const handleSoundToggle = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled);
    soundManager.setEnabled(enabled);
  }, []);

  const handleMusicToggle = useCallback((enabled: boolean) => {
    setMusicEnabled(enabled);
  }, []);

  /**
   * AI设置
   */
  const handleAIToggle = useCallback((enabled: boolean) => {
    console.log('AI切换:', enabled);
    setAiEnabled(enabled);
    setAiThinking(false);
    soundManager.play('button');
  }, []);

  const handleDifficultyChange = useCallback((difficulty: AIDifficulty) => {
    console.log('AI难度更改为:', difficulty);
    setAiDifficulty(difficulty);
    gomokuAI.setDifficulty(difficulty);
    soundManager.play('button');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-40 h-40 bg-gradient-to-br from-blue-200/30 to-indigo-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-52 h-52 bg-gradient-to-br from-purple-200/30 to-pink-300/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-gradient-to-br from-cyan-200/20 to-blue-300/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/3 right-1/4 w-36 h-36 bg-gradient-to-br from-rose-200/20 to-pink-300/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
      </div>



      {/* 主内容 */}
      <div className="relative z-10 px-4 py-6 md:py-8">
        {/* 页面标题和用户信息 */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex justify-between items-start mb-4">
            <div></div> {/* 左侧占位 */}
            
            <div className="flex-1">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 md:mb-4 drop-shadow-lg">
                五子棋韵
              </h1>
              <p className="text-base md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                黑白子间论雅韵，纵横交错显智慧。体验诗意盎然的五子棋，感受古典与现代的完美邂逅！
              </p>
            </div>
            
            {/* 用户信息区域 */}
            <div className="flex items-start gap-2">
              {isLoggedIn && currentUser ? (
                <button
                  onClick={() => setShowUserProfile(true)}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-sm font-medium text-gray-800">{currentUser.username}</div>
                    <div className="text-xs text-gray-600">Lv.{currentUser.level}</div>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <span>登录</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded">保存记录</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 游戏主体区域 */}
        <div className="max-w-8xl mx-auto">
          <div className="flex flex-col 2xl:flex-row gap-6 md:gap-8 items-start justify-center">
            {/* 左侧控制面板 */}
            <div className="w-full 2xl:w-96 order-1 2xl:order-1 space-y-6">
              <div className="sticky top-4 space-y-6">
                {/* 在线对战控制 */}
                <OnlineControls
                  mode={gameState.mode}
                  roomInfo={roomInfo}
                  onModeChange={handleModeChange}
                  onCreateRoom={handleCreateRoom}
                  onJoinRoom={handleJoinRoom}
                  onLeaveRoom={handleLeaveRoom}
                />
                
                {/* AI对手控制 */}
                {gameState.mode === 'local' && (
                  <AIControls
                    aiEnabled={aiEnabled}
                    aiDifficulty={aiDifficulty}
                    onAIToggle={handleAIToggle}
                    onDifficultyChange={handleDifficultyChange}
                    aiThinking={aiThinking}
                  />
                )}
                
                {/* 主题选择器 */}
                <ThemeSelector
                  currentTheme={gameState.theme}
                  onThemeChange={handleThemeChange}
                />
                
                {/* 音效控制 */}
                <SoundSystem
                  enabled={soundEnabled}
                  onToggle={handleSoundToggle}
                  onMusicToggle={handleMusicToggle}
                />
                
                {/* 游戏控制 */}
                <GameControls
                  currentPlayer={gameState.currentPlayer}
                  winner={gameState.winner}
                  onRestart={handleRestart}
                  onUndo={handleUndo}
                  canUndo={gameState.history.length > 0 && gameState.winner === 0 && gameState.mode === 'local'}
                />
              </div>
            </div>

            {/* 游戏棋盘 */}
            <div className="order-2 2xl:order-2 flex-1 flex justify-center">
              <div className="w-full max-w-4xl">
                <GameBoard
                  board={gameState.board}
                  currentPlayer={gameState.currentPlayer}
                  onMove={handleMove}
                  gameOver={gameState.winner !== 0}
                  theme={gameState.theme}
                />
              </div>
            </div>

            {/* 右侧空白区域，保持布局平衡 */}
            <div className="hidden 2xl:block w-96"></div>
          </div>
        </div>

        {/* 页脚信息 */}
        <div className="text-center mt-12 md:mt-16 space-y-2">
          <div className="flex justify-center items-center gap-4 text-sm md:text-base text-gray-600">
            <span className="flex items-center gap-2">
              🌸 <span>诗意主题</span>
            </span>
            <span className="flex items-center gap-2">
              ⭐ <span>星辰对弈</span>
            </span>
            <span className="flex items-center gap-2">
              💫 <span>梦幻体验</span>
            </span>
          </div>
          <p className="text-xs md:text-sm text-gray-500">
            星辰花语 - 诗意与策略的美妙邂逅
          </p>
        </div>

        {/* 登录弹窗 */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            console.log('登录成功！');
          }}
        />

        {/* 用户资料弹窗 */}
        <UserProfile
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          onSettingsOpen={() => {
            setShowUserProfile(false);
            // 这里可以打开设置面板
          }}
        />
      </div>
    </div>
  );
};
