/**
 * 棋谱库组件
 * 显示AI学习的棋谱和统计信息
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { BookOpen, TrendingUp, Star, Brain } from 'lucide-react';
import { chessDatabase, FAMOUS_GAMES, CLASSIC_OPENINGS } from './ChessDatabase';

interface ChessLibraryProps {
  /** 是否显示面板 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
}

export const ChessLibrary: React.FC<ChessLibraryProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedGame, setSelectedGame] = useState(0);
  
  if (!isOpen) return null;
  
  const openingStats = chessDatabase.getOpeningStats();
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              AI棋谱学习库
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onClose}>
              关闭
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs defaultValue="games" className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="games" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                历史名局
              </TabsTrigger>
              <TabsTrigger value="openings" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                开局定式
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                学习统计
              </TabsTrigger>
            </TabsList>
            
            <div className="max-h-[60vh] overflow-y-auto">
              <TabsContent value="games" className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  AI已学习的历史名局 ({FAMOUS_GAMES.length}局)
                </h3>
                
                {FAMOUS_GAMES.map((game, index) => (
                  <Card key={index} className={`cursor-pointer transition-all ${
                    selectedGame === index ? 'ring-2 ring-purple-500' : 'hover:shadow-md'
                  }`} onClick={() => setSelectedGame(index)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-800">{game.name}</h4>
                            <Badge variant={
                              game.difficulty === 'easy' ? 'secondary' :
                              game.difficulty === 'medium' ? 'default' : 'destructive'
                            }>
                              {game.difficulty === 'easy' ? '简单' :
                               game.difficulty === 'medium' ? '中等' : '困难'}
                            </Badge>
                            <div className="flex">
                              {Array.from({ length: game.rating }, (_, i) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{game.description}</p>
                          <div className="text-xs text-gray-500">
                            共{game.moves.length}步 • 开局类型: {
                              game.opening === 'center' ? '天元开局' :
                              game.opening === 'diagonal' ? '斜月开局' :
                              game.opening === 'star' ? '花月开局' :
                              game.opening === 'sword' ? '剑月开局' : '残月开局'
                            }
                          </div>
                        </div>
                      </div>
                      
                      {selectedGame === index && (
                        <div className="mt-4 pt-4 border-t">
                          <h5 className="font-medium text-gray-700 mb-2">棋谱序列:</h5>
                          <div className="grid grid-cols-5 gap-2 text-xs">
                            {game.moves.map((move, moveIndex) => (
                              <div key={moveIndex} className={`p-2 rounded text-center ${
                                moveIndex % 2 === 0 ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800'
                              }`}>
                                {moveIndex + 1}. ({move.row + 1},{move.col + 1})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="openings" className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  经典开局定式 ({CLASSIC_OPENINGS.length}种)
                </h3>
                
                {CLASSIC_OPENINGS.map((opening, index) => (
                  <Card key={index} className="hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">{opening.name}</h4>
                        <Badge variant="outline">评分: {opening.score}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1">初始移动:</h5>
                          <div className="space-y-1">
                            {opening.moves.map((move, moveIndex) => (
                              <div key={moveIndex} className="text-gray-600">
                                {moveIndex + 1}. ({move.row + 1},{move.col + 1})
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1">推荐后续:</h5>
                          <div className="flex flex-wrap gap-1">
                            {opening.followUp.slice(0, 4).map((move, moveIndex) => (
                              <Badge key={moveIndex} variant="secondary" className="text-xs">
                                ({move.row + 1},{move.col + 1})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="stats" className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  AI学习统计
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-800 mb-3">开局使用统计</h4>
                      <div className="space-y-2">
                        {openingStats.map((stat, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{stat.name}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-purple-500 h-2 rounded-full transition-all"
                                  style={{ width: `${stat.usage}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{stat.usage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-800 mb-3">胜率统计</h4>
                      <div className="space-y-2">
                        {openingStats.map((stat, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{stat.name}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all"
                                  style={{ width: `${stat.winRate * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">
                                {(stat.winRate * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">学习成果</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{FAMOUS_GAMES.length}</div>
                        <div className="text-sm text-blue-600">历史名局</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{CLASSIC_OPENINGS.length}</div>
                        <div className="text-sm text-green-600">开局定式</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">15+</div>
                        <div className="text-sm text-purple-600">战术模式</div>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">1000+</div>
                        <div className="text-sm text-orange-600">学习步数</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
