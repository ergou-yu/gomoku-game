/**
 * 五子棋游戏棋盘组件
 * 负责渲染15x15的棋盘和处理棋子落子逻辑
 * 支持多种主题和响应式设计，适配各种屏幕尺寸
 */

import React from 'react';
import { BoardTheme } from './types';

interface GameBoardProps {
  /** 棋盘状态：15x15的二维数组，0为空，1为黑子，2为白子 */
  board: number[][];
  /** 当前玩家：1为黑子，2为白子 */
  currentPlayer: number;
  /** 落子回调函数 */
  onMove: (row: number, col: number) => void;
  /** 游戏是否结束 */
  gameOver: boolean;
  /** 棋盘主题 */
  theme: BoardTheme;
}

/**
 * 主题样式配置
 */
const getThemeStyles = (theme: BoardTheme) => {
  const themes = {
    classic: {
      boardBg: 'bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-50',
      borderColor: 'border-amber-800/60',
      lineColor: 'bg-amber-900/70 group-hover:bg-amber-900/90',
      starPointColor: 'bg-amber-900/80',
      hoverBg: 'hover:bg-amber-100/30',
      decorBg: ['bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800', 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700'],
      textureBg: 'linear-gradient(45deg, rgba(217, 119, 6, 0.1) 25%, transparent 25%, transparent 75%, rgba(217, 119, 6, 0.1) 75%)',
    },
    modern: {
      boardBg: 'bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50',
      borderColor: 'border-slate-400/60',
      lineColor: 'bg-slate-600/70 group-hover:bg-slate-600/90',
      starPointColor: 'bg-slate-600/80',
      hoverBg: 'hover:bg-slate-100/30',
      decorBg: ['bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800', 'bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700'],
      textureBg: 'linear-gradient(45deg, rgba(100, 116, 139, 0.1) 25%, transparent 25%, transparent 75%, rgba(100, 116, 139, 0.1) 75%)',
    },
    ancient: {
      boardBg: 'bg-gradient-to-br from-stone-100 via-slate-100 to-gray-100',
      borderColor: 'border-stone-600/60',
      lineColor: 'bg-stone-700/70 group-hover:bg-stone-700/90',
      starPointColor: 'bg-stone-700/80',
      hoverBg: 'hover:bg-stone-100/30',
      decorBg: ['bg-gradient-to-br from-stone-600 via-stone-700 to-stone-800', 'bg-gradient-to-br from-stone-500 via-stone-600 to-stone-700'],
      textureBg: 'linear-gradient(45deg, rgba(87, 83, 78, 0.1) 25%, transparent 25%, transparent 75%, rgba(87, 83, 78, 0.1) 75%)',
    },
    sakura: {
      boardBg: 'bg-gradient-to-br from-pink-50 via-rose-50 to-pink-50',
      borderColor: 'border-pink-400/60',
      lineColor: 'bg-rose-600/70 group-hover:bg-rose-600/90',
      starPointColor: 'bg-rose-600/80',
      hoverBg: 'hover:bg-pink-100/30',
      decorBg: ['bg-gradient-to-br from-pink-500 via-rose-600 to-pink-700', 'bg-gradient-to-br from-pink-400 via-rose-500 to-pink-600'],
      textureBg: 'linear-gradient(45deg, rgba(236, 72, 153, 0.1) 25%, transparent 25%, transparent 75%, rgba(236, 72, 153, 0.1) 75%)',
    },
    starry: {
      boardBg: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100',
      borderColor: 'border-blue-400/60',
      lineColor: 'bg-blue-600/70 group-hover:bg-blue-600/90',
      starPointColor: 'bg-yellow-400/90',
      hoverBg: 'hover:bg-blue-100/40',
      decorBg: ['bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-800', 'bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700'],
      textureBg: 'radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.2) 2px, transparent 2px), radial-gradient(circle at 70% 70%, rgba(99, 102, 241, 0.2) 1px, transparent 1px), radial-gradient(circle at 40% 80%, rgba(147, 197, 253, 0.3) 1.5px, transparent 1.5px)',
      flowerField: 'repeating-linear-gradient(45deg, rgba(147, 197, 253, 0.1) 0px, rgba(147, 197, 253, 0.1) 2px, transparent 2px, transparent 8px), repeating-linear-gradient(-45deg, rgba(165, 180, 252, 0.08) 0px, rgba(165, 180, 252, 0.08) 1px, transparent 1px, transparent 6px)',
    },
  };
  return themes[theme];
};

/**
 * 渲染单个交叉点
 */
const Intersection: React.FC<{
  value: number;
  row: number;
  col: number;
  onMove: (row: number, col: number) => void;
  gameOver: boolean;
  currentPlayer: number;
  theme: BoardTheme;
}> = ({ value, row, col, onMove, gameOver, currentPlayer, theme }) => {
  const themeStyles = getThemeStyles(theme);
  
  const handleClick = () => {
    if (value === 0 && !gameOver) {
      onMove(row, col);
    }
  };

  // 判断是否是边缘位置
  const isTopEdge = row === 0;
  const isBottomEdge = row === 14;
  const isLeftEdge = col === 0;
  const isRightEdge = col === 14;

  // 判断是否是星位
  const isStarPoint = ((row === 3 || row === 7 || row === 11) && (col === 3 || col === 7 || col === 11));

  return (
    <div
      className={`relative board-cell flex items-center justify-center cursor-pointer group transition-all duration-200 ${themeStyles.hoverBg}`}
      onClick={handleClick}
    >
      {/* 棋盘线条 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* 水平线 */}
        <div 
          className={`absolute ${themeStyles.lineColor} transition-colors ${
            isLeftEdge ? 'left-1/2 right-0' : isRightEdge ? 'left-0 right-1/2' : 'left-0 right-0'
          }`}
          style={{ height: '2px', top: '50%', transform: 'translateY(-50%)' }}
        />
        {/* 垂直线 */}
        <div 
          className={`absolute ${themeStyles.lineColor} transition-colors ${
            isTopEdge ? 'top-1/2 bottom-0' : isBottomEdge ? 'top-0 bottom-1/2' : 'top-0 bottom-0'
          }`}
          style={{ width: '2px', left: '50%', transform: 'translateX(-50%)' }}
        />
      </div>
      
      {/* 星位标记 */}
      {isStarPoint && (
        <div className={`absolute w-2 h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 ${themeStyles.starPointColor} rounded-full shadow-sm`}></div>
      )}
      
      {/* 棋子 */}
      {value !== 0 && (
        <div
          className={`stone ${
            value === 1
              ? 'bg-gradient-to-br from-gray-700 via-gray-900 to-black border-gray-600 shadow-black/60'
              : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 border-gray-300 shadow-gray-500/40'
          } border-2 rounded-full shadow-xl transform transition-all duration-300 animate-stone-drop relative overflow-hidden`}
        >
          {/* 棋子高光效果 */}
          <div
            className={`absolute rounded-full ${
              value === 1
                ? 'bg-gradient-to-tl from-transparent via-gray-400/30 to-gray-300/50'
                : 'bg-gradient-to-tl from-transparent via-white/60 to-white/80'
            }`}
            style={{
              top: '15%',
              left: '25%',
              width: '40%',
              height: '35%',
            }}
          />
          {/* 棋子纹理 */}
          <div
            className={`absolute inset-0 rounded-full ${
              value === 1
                ? 'bg-gradient-radial from-transparent via-gray-600/10 to-black/20'
                : 'bg-gradient-radial from-white/20 via-transparent to-gray-200/30'
            }`}
          />
        </div>
      )}
      
      {/* 悬停预览效果 */}
      {value === 0 && !gameOver && (
        <div 
          className={`preview-stone opacity-0 group-hover:opacity-50 transition-all duration-200 rounded-full border ${
            currentPlayer === 1
              ? 'bg-gray-800/60 border-gray-600'
              : 'bg-white/80 border-gray-300'
          }`}
        />
      )}
    </div>
  );
};

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  currentPlayer,
  onMove,
  gameOver,
  theme,
}) => {
  const themeStyles = getThemeStyles(theme);

  return (
    <div className="flex items-center justify-center p-2 md:p-4">
      {/* 棋盘容器 */}
      <div className="board-container relative">
        {/* 棋盘背景装饰 */}
        <div className={`absolute -inset-6 md:-inset-8 lg:-inset-10 ${themeStyles.decorBg[0]} rounded-2xl shadow-2xl transform rotate-1`}></div>
        <div className={`absolute -inset-4 md:-inset-6 lg:-inset-8 ${themeStyles.decorBg[1]} rounded-2xl shadow-xl transform -rotate-0.5`}></div>
        
        {/* 满天星主题的棋盘周围静态花朵 */}
        {theme === 'starry' && (
          <div className="absolute -inset-12 md:-inset-16 lg:-inset-20 pointer-events-none">
            {/* 四角花朵装饰 */}
            <div className="absolute top-4 left-4 text-blue-300 opacity-60 text-lg transform rotate-12 animate-pulse petal-float">🌸</div>
            <div className="absolute top-4 right-4 text-indigo-200 opacity-70 text-sm transform -rotate-45 animate-pulse petal-float" style={{animationDelay: '1s'}}>❀</div>
            <div className="absolute bottom-4 left-4 text-cyan-300 opacity-65 text-base transform rotate-45 animate-pulse petal-float" style={{animationDelay: '2s'}}>✿</div>
            <div className="absolute bottom-4 right-4 text-blue-400 opacity-55 text-lg transform -rotate-30 animate-pulse petal-float" style={{animationDelay: '3s'}}>🌸</div>
            
            {/* 边缘中间位置花朵 */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-blue-200 opacity-50 text-sm rotate-90 animate-pulse petal-float" style={{animationDelay: '0.5s'}}>❀</div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-indigo-300 opacity-60 text-base -rotate-90 animate-pulse petal-float" style={{animationDelay: '2.5s'}}>✿</div>
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-200 opacity-70 text-sm rotate-180 animate-pulse petal-float" style={{animationDelay: '1.5s'}}>🌸</div>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-300 opacity-45 text-base rotate-0 animate-pulse petal-float" style={{animationDelay: '3.5s'}}>❀</div>
          </div>
        )}
        
        {/* 棋盘边缘花瓣飘落 - 仅满天星主题 */}
        {theme === 'starry' && (
          <div className="absolute -inset-20 overflow-hidden pointer-events-none z-0">
            {/* 左边缘花瓣 */}
            <div className="petal-fall petal-fall-1" style={{left: '5%', animationDelay: '0s'}}>🌸</div>
            <div className="petal-fall petal-fall-2" style={{left: '8%', animationDelay: '3s'}}>❀</div>
            <div className="petal-fall petal-fall-3" style={{left: '2%', animationDelay: '6s'}}>✿</div>
            
            {/* 右边缘花瓣 */}
            <div className="petal-fall petal-fall-2" style={{left: '92%', animationDelay: '1s'}}>🌸</div>
            <div className="petal-fall petal-fall-1" style={{left: '95%', animationDelay: '4s'}}>❀</div>
            <div className="petal-fall petal-fall-3" style={{left: '88%', animationDelay: '7s'}}>✿</div>
            
            {/* 上方边缘花瓣 */}
            <div className="petal-fall petal-fall-3" style={{left: '15%', animationDelay: '2s'}}>🌸</div>
            <div className="petal-fall petal-fall-1" style={{left: '25%', animationDelay: '5s'}}>❀</div>
            <div className="petal-fall petal-fall-2" style={{left: '35%', animationDelay: '8s'}}>✿</div>
            <div className="petal-fall petal-fall-3" style={{left: '65%', animationDelay: '1.5s'}}>🌸</div>
            <div className="petal-fall petal-fall-1" style={{left: '75%', animationDelay: '4.5s'}}>❀</div>
            <div className="petal-fall petal-fall-2" style={{left: '85%', animationDelay: '7.5s'}}>✿</div>
          </div>
        )}

        {/* 主棋盘 */}
        <div className={`relative ${themeStyles.boardBg} rounded-xl shadow-2xl p-4 md:p-6 lg:p-8 border-4 ${themeStyles.borderColor} animate-board-glow z-10`}>
          {/* 主题纹理背景 */}
          <div className="absolute inset-0 opacity-20 rounded-xl" 
               style={{
                 backgroundImage: theme === 'starry' 
                   ? `${themeStyles.textureBg}, radial-gradient(circle at 15% 15%, rgba(255, 255, 255, 0.6) 1px, transparent 2px), radial-gradient(circle at 85% 25%, rgba(255, 255, 255, 0.4) 1px, transparent 2px), radial-gradient(circle at 30% 90%, rgba(255, 255, 255, 0.5) 1px, transparent 2px)`
                   : `radial-gradient(circle at 25% 25%, rgba(0, 0, 0, 0.1) 0%, transparent 25%),
                      radial-gradient(circle at 75% 75%, rgba(0, 0, 0, 0.05) 0%, transparent 25%),
                      ${themeStyles.textureBg}`
               }}
          />
          
          {/* 满天星花海背景 - 仅在starry主题显示 */}
          {theme === 'starry' && (
            <div className="absolute inset-0 rounded-xl overflow-hidden opacity-30">
              {/* 花海基础层 */}
              <div 
                className="absolute inset-0" 
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 10% 20%, rgba(147, 197, 253, 0.6) 1px, transparent 3px),
                    radial-gradient(circle at 30% 10%, rgba(165, 180, 252, 0.5) 1px, transparent 2px),
                    radial-gradient(circle at 50% 30%, rgba(196, 181, 253, 0.4) 1px, transparent 2px),
                    radial-gradient(circle at 70% 15%, rgba(147, 197, 253, 0.6) 1px, transparent 3px),
                    radial-gradient(circle at 90% 25%, rgba(165, 180, 252, 0.5) 1px, transparent 2px),
                    radial-gradient(circle at 15% 50%, rgba(196, 181, 253, 0.4) 1px, transparent 2px),
                    radial-gradient(circle at 35% 70%, rgba(147, 197, 253, 0.6) 1px, transparent 3px),
                    radial-gradient(circle at 55% 80%, rgba(165, 180, 252, 0.5) 1px, transparent 2px),
                    radial-gradient(circle at 75% 60%, rgba(196, 181, 253, 0.4) 1px, transparent 2px),
                    radial-gradient(circle at 85% 85%, rgba(147, 197, 253, 0.6) 1px, transparent 3px),
                    radial-gradient(circle at 20% 90%, rgba(165, 180, 252, 0.5) 1px, transparent 2px),
                    radial-gradient(circle at 60% 5%, rgba(196, 181, 253, 0.4) 1px, transparent 2px)
                  `,
                  backgroundSize: '60px 60px, 80px 80px, 100px 100px, 70px 70px, 90px 90px, 110px 110px, 65px 65px, 85px 85px, 75px 75px, 95px 95px, 55px 55px, 120px 120px'
                }}
              />
              
              {/* 花海装饰层 - 更多小花 */}
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 25% 35%, rgba(59, 130, 246, 0.3) 0.5px, transparent 1.5px),
                    radial-gradient(circle at 45% 55%, rgba(99, 102, 241, 0.3) 0.5px, transparent 1.5px),
                    radial-gradient(circle at 65% 25%, rgba(147, 197, 253, 0.3) 0.5px, transparent 1.5px),
                    radial-gradient(circle at 15% 75%, rgba(59, 130, 246, 0.3) 0.5px, transparent 1.5px),
                    radial-gradient(circle at 85% 45%, rgba(99, 102, 241, 0.3) 0.5px, transparent 1.5px),
                    radial-gradient(circle at 35% 85%, rgba(147, 197, 253, 0.3) 0.5px, transparent 1.5px),
                    radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.3) 0.5px, transparent 1.5px),
                    radial-gradient(circle at 55% 15%, rgba(99, 102, 241, 0.3) 0.5px, transparent 1.5px)
                  `,
                  backgroundSize: '40px 40px, 50px 50px, 45px 45px, 55px 55px, 35px 35px, 60px 60px, 42px 42px, 48px 48px'
                }}
              />
            </div>
          )}
          
          {/* 满天星主题的特殊星星和花朵效果 */}
          {theme === 'starry' && (
            <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
              {/* 动态闪烁的星星 */}
              <div className="absolute top-[10%] left-[20%] w-1 h-1 bg-yellow-300 rounded-full animate-pulse opacity-80"></div>
              <div className="absolute top-[25%] right-[15%] w-0.5 h-0.5 bg-white rounded-full animate-pulse opacity-60" style={{animationDelay: '0.5s'}}></div>
              <div className="absolute bottom-[30%] left-[80%] w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse opacity-70" style={{animationDelay: '1s'}}></div>
              <div className="absolute top-[70%] left-[10%] w-0.5 h-0.5 bg-yellow-200 rounded-full animate-pulse opacity-50" style={{animationDelay: '1.5s'}}></div>
              <div className="absolute bottom-[15%] right-[25%] w-1 h-1 bg-indigo-200 rounded-full animate-pulse opacity-60" style={{animationDelay: '2s'}}></div>
              <div className="absolute top-[45%] right-[70%] w-0.5 h-0.5 bg-white rounded-full animate-pulse opacity-80" style={{animationDelay: '0.7s'}}></div>
              
              {/* 十字星效果 */}
              <div className="absolute top-[35%] left-[60%] text-yellow-300 opacity-70 animate-pulse text-xs" style={{animationDelay: '1.2s'}}>✦</div>
              <div className="absolute bottom-[50%] right-[40%] text-blue-200 opacity-50 animate-pulse text-xs" style={{animationDelay: '0.3s'}}>✧</div>
              <div className="absolute top-[80%] left-[40%] text-indigo-300 opacity-60 animate-pulse text-xs" style={{animationDelay: '1.8s'}}>✦</div>
              
              {/* 蓝色满天星花朵装饰 */}
              <div className="absolute top-[15%] left-[75%] text-blue-300 opacity-60 animate-pulse text-sm transform rotate-12" style={{animationDelay: '0.8s'}}>🌸</div>
              <div className="absolute top-[60%] right-[20%] text-indigo-200 opacity-70 animate-pulse text-xs transform -rotate-45" style={{animationDelay: '1.3s'}}>❀</div>
              <div className="absolute bottom-[40%] left-[30%] text-blue-200 opacity-50 animate-pulse text-sm transform rotate-90" style={{animationDelay: '2.1s'}}>✿</div>
              <div className="absolute top-[40%] left-[15%] text-cyan-300 opacity-65 animate-pulse text-xs transform -rotate-30" style={{animationDelay: '0.6s'}}>❀</div>
              <div className="absolute bottom-[25%] right-[60%] text-blue-400 opacity-55 animate-pulse text-sm transform rotate-180" style={{animationDelay: '1.7s'}}>🌸</div>
              <div className="absolute top-[85%] right-[10%] text-indigo-300 opacity-45 animate-pulse text-xs transform rotate-45" style={{animationDelay: '0.9s'}}>✿</div>
              <div className="absolute top-[20%] right-[45%] text-blue-100 opacity-60 animate-pulse text-xs transform -rotate-60" style={{animationDelay: '1.4s'}}>❀</div>
              <div className="absolute bottom-[60%] left-[65%] text-cyan-200 opacity-70 animate-pulse text-sm transform rotate-120" style={{animationDelay: '0.4s'}}>🌸</div>
              
              {/* CSS花朵装饰 */}
              <div className="baby-breath-flower absolute top-[30%] right-[30%] opacity-40" style={{animationDelay: '1.6s'}}></div>
              <div className="baby-breath-flower absolute bottom-[45%] left-[50%] opacity-35" style={{animationDelay: '0.2s'}}></div>
              <div className="baby-breath-flower absolute top-[75%] left-[25%] opacity-45" style={{animationDelay: '2.3s'}}></div>
              <div className="baby-breath-flower absolute top-[50%] right-[85%] opacity-30" style={{animationDelay: '1.1s'}}></div>
            </div>
          )}
          
          {/* 棋盘网格 */}
          <div className={`board-grid relative ${themeStyles.boardBg}/80 rounded-lg border border-white/30 shadow-inner`}>
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <Intersection
                  key={`${rowIndex}-${colIndex}`}
                  value={cell}
                  row={rowIndex}
                  col={colIndex}
                  onMove={onMove}
                  gameOver={gameOver}
                  currentPlayer={currentPlayer}
                  theme={theme}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
