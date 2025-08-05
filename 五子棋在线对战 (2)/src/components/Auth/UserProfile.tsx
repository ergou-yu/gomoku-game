/**
 * 用户资料组件
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  User, 
  Trophy, 
  Target, 
  TrendingUp, 
  Award, 
  Settings,
  LogOut,
  Crown,
  Star,
  Medal,
  Calendar,
  Mail
} from 'lucide-react';
import { userManager, User as UserType } from './UserSystem';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsOpen: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  isOpen,
  onClose,
  onSettingsOpen,
}) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setUser(userManager.getCurrentUser());
      setStats(userManager.getUserStats());
    }
  }, [isOpen]);

  if (!isOpen || !user || !stats) return null;

  /**
   * 处理登出
   */
  const handleLogout = () => {
    userManager.logout();
    onClose();
  };

  /**
   * 获取等级进度
   */
  const getLevelProgress = () => {
    const currentLevelExp = (stats.level - 1) * 100;
    const nextLevelExp = stats.level * 100;
    const progress = ((stats.experience - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;
    return Math.min(progress, 100);
  };

  /**
   * 获取等级称号
   */
  const getLevelTitle = () => {
    if (stats.level >= 30) return { title: '大师', color: 'text-purple-600', icon: Crown };
    if (stats.level >= 20) return { title: '专家', color: 'text-yellow-600', icon: Medal };
    if (stats.level >= 10) return { title: '高手', color: 'text-blue-600', icon: Star };
    if (stats.level >= 5) return { title: '进阶', color: 'text-green-600', icon: Target };
    return { title: '新手', color: 'text-gray-600', icon: User };
  };

  const levelInfo = getLevelTitle();
  const LevelIcon = levelInfo.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2"
            onClick={onClose}
          >
            ✕
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${levelInfo.color.replace('text', 'bg').replace('600', '500')} rounded-full flex items-center justify-center`}>
                <LevelIcon className="w-3 h-3 text-white" />
              </div>
            </div>
            
            <div className="flex-1">
              <CardTitle className="text-xl">{user.username}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className={levelInfo.color}>
                  <LevelIcon className="w-3 h-3 mr-1" />
                  Lv.{stats.level} {levelInfo.title}
                </Badge>
                {user.ranking > 0 && (
                  <Badge variant="outline">
                    <Trophy className="w-3 h-3 mr-1" />
                    排名 #{user.ranking}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 经验进度 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>经验值</span>
              <span>{stats.experience}/{stats.level * 100}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${getLevelProgress()}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 text-center">
              距离下一级还需 {(stats.level * 100) - stats.experience} 经验
            </div>
          </div>

          {/* 游戏统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Target className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-blue-600">{stats.gamesPlayed}</div>
              <div className="text-xs text-blue-600">总局数</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Trophy className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-green-600">{stats.gamesWon}</div>
              <div className="text-xs text-green-600">胜利数</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-purple-600">
                {(stats.winRate * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-purple-600">胜率</div>
            </div>
            
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <Award className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-yellow-600">{stats.achievements.length}</div>
              <div className="text-xs text-yellow-600">成就数</div>
            </div>
          </div>

          {/* 成就展示 */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-600" />
              我的成就
            </h3>
            <div className="flex flex-wrap gap-2">
              {stats.achievements.map((achievement: string, index: number) => (
                <Badge key={index} variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                  🏆 {achievement}
                </Badge>
              ))}
            </div>
            {stats.achievements.length === 0 && (
              <div className="text-gray-500 text-sm text-center py-4">
                还没有获得成就，继续加油！
              </div>
            )}
          </div>

          {/* 账户信息 */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600" />
              账户信息
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">邮箱:</span>
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">注册时间:</span>
                <span>{new Date(user.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">最后登录:</span>
                <span>{new Date(user.lastLoginAt).toLocaleDateString('zh-CN')}</span>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onSettingsOpen}
              className="flex-1"
            >
              <Settings className="w-4 h-4 mr-2" />
              设置
            </Button>
            
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              登出
            </Button>
          </div>

          {/* 提示信息 */}
          <div className="text-xs text-gray-500 text-center space-y-1 pt-2 border-t">
            <p>💡 多多对弈可以获得经验和成就奖励</p>
            <p>🎯 提高胜率可以解锁更多成就称号</p>
            <p>🏆 达到一定等级可以参与排位赛</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
