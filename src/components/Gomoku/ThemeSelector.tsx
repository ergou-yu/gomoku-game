/**
 * 棋盘主题选择器组件
 * 提供多种精美的棋盘主题选择
 */

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Palette, Check } from 'lucide-react';
import { BoardTheme } from './types';

interface ThemeSelectorProps {
  /** 当前选中的主题 */
  currentTheme: BoardTheme;
  /** 主题切换回调 */
  onThemeChange: (theme: BoardTheme) => void;
}

interface ThemeConfig {
  id: BoardTheme;
  name: string;
  description: string;
  preview: string;
  colors: string[];
  isSpecial?: boolean;
}

/** 主题配置 */
const themes = [
  {
    id: 'classic' as BoardTheme,
    name: '经典木质',
    description: '传统温暖的木质纹理',
    preview: 'bg-gradient-to-br from-amber-200 to-yellow-100',
    colors: ['#f59e0b', '#d97706', '#b45309'],
  },
  {
    id: 'modern' as BoardTheme,
    name: '现代简约',
    description: '简洁现代的设计风格',
    preview: 'bg-gradient-to-br from-slate-100 to-gray-200',
    colors: ['#64748b', '#475569', '#334155'],
  },
  {
    id: 'ancient' as BoardTheme,
    name: '古典青石',
    description: '古朴典雅的青石材质',
    preview: 'bg-gradient-to-br from-slate-300 to-stone-400',
    colors: ['#0f766e', '#134e4a', '#065f46'],
  },
  {
    id: 'sakura' as BoardTheme,
    name: '樱花主题',
    description: '浪漫唯美的樱花风格',
    preview: 'bg-gradient-to-br from-pink-100 to-rose-200',
    colors: ['#ec4899', '#db2777', '#be185d'],
  },
  {
    id: 'starry' as BoardTheme,
    name: '蓝色满天星',
    description: '星星与花朵的梦幻邂逅',
    preview: 'bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-200',
    colors: ['#3b82f6', '#6366f1', '#1e40af'],
    isSpecial: true,
  },
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange,
}) => {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/30 shadow-xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-gray-800">棋盘主题</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {themes.map((theme: ThemeConfig) => (
            <Button
              key={theme.id}
              variant={currentTheme === theme.id ? "default" : "outline"}
              className={`h-auto p-3 relative overflow-hidden transition-all duration-300 ${
                currentTheme === theme.id
                  ? 'ring-2 ring-purple-500 ring-offset-2 shadow-lg scale-105'
                  : 'hover:scale-102 hover:shadow-md'
              }`}
              onClick={() => onThemeChange(theme.id)}
            >
              <div className="flex flex-col items-center gap-2 w-full">
                {/* 主题预览 */}
                <div className={`w-full h-12 rounded-lg ${theme.preview} relative overflow-hidden border-2 border-white/50`}>
                  {/* 棋盘网格预览 */}
                  <div className="absolute inset-2 grid grid-cols-3 grid-rows-3 gap-px">
                    {Array(9).fill(0).map((_, i) => (
                      <div key={i} className="bg-black/10 rounded-sm" />
                    ))}
                  </div>
                  
                  {/* 满天星主题特殊效果 */}
                  {theme.id === 'starry' && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* 星星效果 */}
                      <div className="absolute top-1 left-2 w-0.5 h-0.5 bg-yellow-300 rounded-full animate-pulse"></div>
                      <div className="absolute top-2 right-1 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                      <div className="absolute bottom-1 left-1 w-0.5 h-0.5 bg-blue-200 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                      <div className="absolute top-1 right-3 text-yellow-300 text-xs opacity-70 animate-pulse" style={{animationDelay: '0.3s'}}>✦</div>
                      
                      {/* 蓝色满天星花朵 */}
                      <div className="absolute top-1.5 left-4 text-blue-300 opacity-60 animate-pulse text-xs transform rotate-12" style={{animationDelay: '0.8s'}}>🌸</div>
                      <div className="absolute bottom-1.5 right-2 text-indigo-200 opacity-50 animate-pulse text-xs transform -rotate-45" style={{animationDelay: '1.3s'}}>❀</div>
                      <div className="absolute top-2.5 right-1.5 text-cyan-300 opacity-55 animate-pulse text-xs transform rotate-30" style={{animationDelay: '0.6s'}}>✿</div>
                    </div>
                  )}
                  
                  {/* 选中标记 */}
                  {currentTheme === theme.id && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                
                {/* 主题信息 */}
                <div className="text-center">
                  <div className={`font-medium text-sm ${
                    currentTheme === theme.id ? 'text-white' : 'text-gray-700'
                  }`}>
                    {theme.name}
                  </div>
                  <div className={`text-xs mt-1 ${
                    currentTheme === theme.id ? 'text-white/80' : 'text-gray-500'
                  }`}>
                    {theme.description}
                  </div>
                </div>
                
                {/* 颜色预览 */}
                <div className="flex gap-1">
                  {theme.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-2 h-2 rounded-full border border-white/50"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
