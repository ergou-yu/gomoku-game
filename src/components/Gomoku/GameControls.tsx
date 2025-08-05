/**
 * 五子棋游戏控制面板组件
 * 显示游戏状态、当前玩家、获胜信息，以及提供重新开始和悔棋功能
 */

import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { RotateCcw, RefreshCw, Trophy, Users } from 'lucide-react';

interface GameControlsProps {
  /** 当前玩家：1为黑子，2为白子 */
  currentPlayer: number;
  /** 获胜者：0为游戏进行中，1为黑子获胜，2为白子获胜，3为平局 */
  winner: number;
  /** 重新开始游戏回调 */
  onRestart: () => void;
  /** 悔棋回调 */
  onUndo: () => void;
  /** 是否可以悔棋 */
  canUndo: boolean;
}

/**
 * 获取玩家显示信息
 */
const getPlayerInfo = (player: number) => {
  if (player === 1) {
    return {
      name: '黑子',
      color: 'text-gray-800',
      bgColor: 'bg-gradient-to-br from-gray-700 to-black',
      glowColor: 'shadow-black/30',
    };
  }
  return {
    name: '白子',
    color: 'text-gray-700',
    bgColor: 'bg-gradient-to-br from-gray-100 to-white border border-gray-300',
    glowColor: 'shadow-gray-400/30',
  };
};

/**
 * 获取游戏状态显示信息
 */
const getGameStatus = (winner: number, currentPlayer: number) => {
  if (winner === 3) {
    return {
      title: '游戏平局',
      message: '棋盘已满，没有获胜者！',
      icon: <Users className="w-6 h-6 text-yellow-600" />,
      bgColor: 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200',
      textColor: 'text-yellow-800',
    };
  }
  
  if (winner > 0) {
    const playerInfo = getPlayerInfo(winner);
    return {
      title: `${playerInfo.name}获胜！`,
      message: '恭喜获得胜利！',
      icon: <Trophy className="w-6 h-6 text-yellow-600" />,
      bgColor: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200',
      textColor: 'text-green-800',
    };
  }

  const playerInfo = getPlayerInfo(currentPlayer);
  return {
    title: '游戏进行中',
    message: `轮到 ${playerInfo.name} 落子`,
    icon: <Users className="w-6 h-6 text-blue-600" />,
    bgColor: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200',
    textColor: 'text-blue-800',
  };
};

export const GameControls: React.FC<GameControlsProps> = ({
  currentPlayer,
  winner,
  onRestart,
  onUndo,
  canUndo,
}) => {
  const gameStatus = getGameStatus(winner, currentPlayer);
  const currentPlayerInfo = getPlayerInfo(currentPlayer);

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      {/* 游戏状态卡片 */}
      <Card className={`${gameStatus.bgColor} border-2 shadow-lg transition-all duration-300 hover:shadow-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className={`flex items-center gap-2 ${gameStatus.textColor} text-lg font-bold`}>
            {gameStatus.icon}
            {gameStatus.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`${gameStatus.textColor} font-medium`}>
            {gameStatus.message}
          </p>
          
          {/* 当前玩家显示 */}
          {winner === 0 && (
            <div className="flex items-center gap-3 mt-4 p-3 bg-white/50 rounded-lg border border-white/30">
              <div 
                className={`w-8 h-8 rounded-full ${currentPlayerInfo.bgColor} ${currentPlayerInfo.glowColor} shadow-lg`}
              />
              <div>
                <p className="text-sm text-gray-600">当前玩家</p>
                <p className={`font-bold ${currentPlayerInfo.color}`}>
                  {currentPlayerInfo.name}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 游戏规则说明 */}
      <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-amber-800 text-sm font-semibold">游戏规则</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-amber-700 space-y-1">
          <p>• 黑子先手，轮流落子</p>
          <p>• 横、竖、斜任意方向连成五子即获胜</p>
          <p>• 棋盘填满无人获胜则为平局</p>
        </CardContent>
      </Card>

      {/* 控制按钮 */}
      <div className="space-y-3">
        <Button
          onClick={onRestart}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          重新开始
        </Button>
        
        <Button
          onClick={onUndo}
          disabled={!canUndo}
          variant="outline"
          className="w-full border-2 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          悔棋
        </Button>
      </div>

      {/* 游戏统计 */}
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">游戏提示</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>💡 先手优势：黑子有一定的先手优势</p>
            <p>🎯 关键位置：控制中心和星位很重要</p>
            <p>🛡️ 攻防平衡：既要进攻也要防守</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
