/**
 * AI对手控制组件
 * 提供AI难度选择和AI对战功能
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Bot, Brain, Zap, Target, BookOpen, TrendingUp } from 'lucide-react';
import { AIDifficulty } from './AIPlayer';
import { ChessLibrary } from './ChessLibrary';
import { aiTrainingSystem } from './AITrainingSystem';

interface AIControlsProps {
  /** 是否启用AI模式 */
  aiEnabled: boolean;
  /** 当前AI难度 */
  aiDifficulty: AIDifficulty;
  /** AI模式切换回调 */
  onAIToggle: (enabled: boolean) => void;
  /** AI难度切换回调 */
  onDifficultyChange: (difficulty: AIDifficulty) => void;
  /** 是否正在等待AI思考 */
  aiThinking?: boolean;
}

/** 难度配置 */
const difficultyConfig = {
  easy: {
    name: '简单',
    icon: <Target className="w-4 h-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    description: '适合新手练习',
  },
  medium: {
    name: '中等',
    icon: <Brain className="w-4 h-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    description: '有一定挑战性',
  },
  hard: {
    name: '专家',
    icon: <Zap className="w-4 h-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    description: '世界冠军级AI',
  },
};

export const AIControls: React.FC<AIControlsProps> = ({
  aiEnabled,
  aiDifficulty,
  onAIToggle,
  onDifficultyChange,
  aiThinking = false,
}) => {
  const currentDifficulty = difficultyConfig[aiDifficulty];
  const [showLibrary, setShowLibrary] = useState(false);
  const [trainingStats, setTrainingStats] = useState(aiTrainingSystem.getTrainingStats());
  
  // 定期更新训练统计
  useEffect(() => {
    const interval = setInterval(() => {
      setTrainingStats(aiTrainingSystem.getTrainingStats());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <>
    <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-cyan-800">
          <Bot className="w-5 h-5" />
          AI对手
          {aiThinking && (
            <div className="ml-2 flex items-center gap-1 text-sm text-cyan-600">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
              <span>思考中...</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* AI开关 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-cyan-800">启用AI对手</span>
          <Button
            variant={aiEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => onAIToggle(!aiEnabled)}
            className={aiEnabled ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
          >
            {aiEnabled ? '已启用' : '已关闭'}
          </Button>
        </div>
        
        {/* AI难度选择 */}
        {aiEnabled && (
          <>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-cyan-800 flex items-center gap-2">
                {currentDifficulty.icon}
                AI难度
              </h4>
              
              <div className="grid grid-cols-1 gap-2">
                {(Object.entries(difficultyConfig) as [AIDifficulty, typeof difficultyConfig.easy][]).map(([key, config]) => (
                  <Button
                    key={key}
                    variant={aiDifficulty === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => onDifficultyChange(key)}
                    className={`justify-start h-auto p-3 ${
                      aiDifficulty === key 
                        ? 'ring-2 ring-cyan-500 ring-offset-1 bg-cyan-600 hover:bg-cyan-700' 
                        : 'hover:bg-cyan-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className={config.color}>
                        {config.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className={`font-medium ${
                          aiDifficulty === key ? 'text-white' : config.color
                        }`}>
                          {config.name}
                        </div>
                        <div className={`text-xs ${
                          aiDifficulty === key ? 'text-white/80' : 'text-gray-500'
                        }`}>
                          {config.description}
                        </div>
                      </div>
                      {aiDifficulty === key && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* 当前难度显示 */}
            <div className={`p-3 rounded-lg border-2 ${currentDifficulty.bgColor}`}>
              <div className={`text-sm font-medium ${currentDifficulty.color} flex items-center gap-2`}>
                {currentDifficulty.icon}
                当前难度: {currentDifficulty.name}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {currentDifficulty.description}
              </div>
            </div>
            
            {/* AI棋谱库 */}
            <div className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLibrary(true)}
                className="w-full justify-start"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                查看AI棋谱库
              </Button>
            </div>
            
            {/* AI训练状态 */}
            <div className="p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-cyan-600" />
                <span className="text-sm font-medium text-cyan-800">后台自训练中</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-cyan-600">
                <div>训练局数: {trainingStats.gamesPlayed}</div>
                <div>胜率: {(trainingStats.winRate * 100).toFixed(1)}%</div>
                <div>学习模式: {trainingStats.learnedPatterns}</div>
                <div>平均步数: {Math.round(trainingStats.averageGameLength)}</div>
              </div>
              <div className="text-xs text-cyan-500 mt-1">
                上次训练: {trainingStats.lastTraining.toLocaleTimeString()}
              </div>
            </div>
            
            {/* AI能力说明 */}
            <div className="text-xs text-cyan-600 space-y-1">
              <p>🧠 专家级：α-β剪枝 + 威胁分析 + 棋形识别</p>
              <p>📚 内置世界冠军棋路和经典定式</p>
              <p>⚡ 实时计算最优解，识别活三冲四</p>
              <p>🤖 后台自我对弈，持续学习进化</p>
            </div>
          </>
        )}
        
        {/* 关闭AI时的提示 */}
        {!aiEnabled && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 text-center">
              <Bot className="w-5 h-5 mx-auto mb-2 text-gray-400" />
              开启AI对手模式
              <br />
              与智能AI进行单人练习
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    
    {/* 棋谱库弹窗 */}
    <ChessLibrary 
      isOpen={showLibrary}
      onClose={() => setShowLibrary(false)}
    />
  </>
  );
};
