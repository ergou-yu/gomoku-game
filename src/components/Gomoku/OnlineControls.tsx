/**
 * 在线对战控制组件
 * 管理房间创建、加入和对战状态
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Wifi, 
  WifiOff, 
  Users, 
  Copy, 
  LogIn, 
  LogOut,
  Dice3,
  Globe,
  Clock,
  Earth,
  Zap,
  Shield
} from 'lucide-react';
import { RoomInfo, GameMode } from './types';
import { globalOnlineManager, GlobalRoom, ConnectionStatus } from './GlobalOnlineSystem';

interface OnlineControlsProps {
  /** 当前游戏模式 */
  mode: GameMode;
  /** 房间信息 */
  roomInfo: RoomInfo | null;
  /** 模式切换回调 */
  onModeChange: (mode: GameMode) => void;
  /** 创建房间回调 */
  onCreateRoom: () => void;
  /** 加入房间回调 */
  onJoinRoom: (roomId: string) => void;
  /** 离开房间回调 */
  onLeaveRoom: () => void;
}

/**
 * 生成随机房间号
 */
const generateRoomId = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * 复制到剪贴板
 */
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // 备用方案
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
};

export const OnlineControls: React.FC<OnlineControlsProps> = ({
  mode,
  roomInfo,
  onModeChange,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
}) => {
  const [joinRoomId, setJoinRoomId] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [copied, setCopied] = useState(false);
  const [globalRoom, setGlobalRoom] = useState<GlobalRoom | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // 初始化全球连接系统
  useEffect(() => {
    globalOnlineManager.setCallbacks({
      onStatusChange: (status) => {
        setConnectionStatus(status);
        setIsConnecting(status === 'connecting');
      },
      onRoomUpdate: (room) => {
        setGlobalRoom(room);
      },
      onMessage: (message, type) => {
        console.log(`[${type.toUpperCase()}] ${message}`);
        // 这里可以添加toast通知
      },
      onMove: (move, player, playerId) => {
        console.log('收到全球对战移动:', { move, player, playerId });
        // 这里需要调用游戏的移动处理函数
      }
    });

    return () => {
      globalOnlineManager.disconnect();
    };
  }, []);

  /**
   * 处理创建全球房间
   */
  const handleCreateGlobalRoom = async () => {
    setIsConnecting(true);
    try {
      const roomId = await globalOnlineManager.createRoom(true);
      if (roomId) {
        console.log('✅ 全球房间创建成功:', roomId);
      }
    } catch (error) {
      console.error('❌ 创建房间失败:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * 处理加入全球房间
   */
  const handleJoinGlobalRoom = async () => {
    if (!joinRoomId.trim()) return;
    
    setIsConnecting(true);
    try {
      const success = await globalOnlineManager.joinRoom(joinRoomId.trim().toUpperCase());
      if (success) {
        setJoinRoomId('');
        console.log('✅ 成功加入全球房间');
      }
    } catch (error) {
      console.error('❌ 加入房间失败:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * 处理复制房间号
   */
  const handleCopyRoomId = async () => {
    const roomId = globalRoom?.id || roomInfo?.roomId;
    if (!roomId) return;
    
    const success = await copyToClipboard(roomId);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /**
   * 处理离开全球房间
   */
  const handleLeaveGlobalRoom = () => {
    globalOnlineManager.leaveRoom();
    setGlobalRoom(null);
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          {connectionStatus === 'connected' ? (
            <Earth className="w-5 h-5 text-green-600 animate-pulse" />
          ) : connectionStatus === 'connecting' || isConnecting ? (
            <div className="w-5 h-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          ) : (
            <WifiOff className="w-5 h-5 text-gray-500" />
          )}
          全球在线对战
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 模式选择 */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={mode === 'local' ? 'default' : 'outline'}
            onClick={() => onModeChange('local')}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            本地对战
          </Button>
          <Button
            variant={mode === 'online' ? 'default' : 'outline'}
            onClick={() => onModeChange('online')}
            className="flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            在线对战
          </Button>
        </div>

        {/* 全球在线模式内容 */}
        {mode === 'online' && (
          <>
            {/* 连接状态显示 */}
            <div className={`p-3 rounded-lg border ${
              connectionStatus === 'connected' ? 'bg-green-50 border-green-200' :
              connectionStatus === 'connecting' ? 'bg-yellow-50 border-yellow-200' :
              connectionStatus === 'error' ? 'bg-red-50 border-red-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className={`text-sm font-medium flex items-center gap-2 ${
                connectionStatus === 'connected' ? 'text-green-700' :
                connectionStatus === 'connecting' ? 'text-yellow-700' :
                connectionStatus === 'error' ? 'text-red-700' :
                'text-gray-700'
              }`}>
                {connectionStatus === 'connected' && <Shield className="w-4 h-4" />}
                {connectionStatus === 'connecting' && <Zap className="w-4 h-4 animate-pulse" />}
                {connectionStatus === 'connected' ? '🌍 全球服务器已连接' :
                 connectionStatus === 'connecting' ? '🔄 连接全球服务器中...' :
                 connectionStatus === 'error' ? '❌ 连接失败，请重试' :
                 '⚡ 点击创建或加入房间自动连接'}
              </div>
            </div>

            {!globalRoom ? (
              <div className="space-y-4">
                {/* 创建全球房间 */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <Earth className="w-4 h-4" />
                    创建全球房间
                  </h4>
                  <p className="text-sm text-blue-600 mb-3">
                    创建房间后，世界各地的玩家都能通过房间号加入对弈
                  </p>
                  <Button 
                    onClick={handleCreateGlobalRoom}
                    disabled={isConnecting}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isConnecting ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        连接中...
                      </>
                    ) : (
                      <>
                        <Earth className="w-4 h-4 mr-2" />
                        创建全球房间
                      </>
                    )}
                  </Button>
                </div>

                {/* 加入全球房间 */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    加入全球房间
                  </h4>
                  <p className="text-sm text-green-600 mb-3">
                    输入朋友分享的房间号，与全球玩家在线对弈
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="输入6位房间号"
                      value={joinRoomId}
                      onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && handleJoinGlobalRoom()}
                      className="uppercase font-mono text-center"
                      maxLength={6}
                      disabled={isConnecting}
                    />
                    <Button 
                      onClick={handleJoinGlobalRoom}
                      disabled={!joinRoomId.trim() || isConnecting}
                      variant="outline"
                      className="border-green-300 text-green-600 hover:bg-green-50"
                    >
                      {isConnecting ? '连接中...' : '加入'}
                    </Button>
                  </div>
                </div>

                {/* 全球对战特色 */}
                <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <h5 className="text-sm font-semibold text-purple-800 mb-2">🌟 全球对战特色</h5>
                  <div className="text-xs text-purple-700 space-y-1">
                    <p>🌍 与世界各地玩家实时对弈</p>
                    <p>⚡ 低延迟，流畅对战体验</p>
                    <p>🔒 房间密码保护，安全可靠</p>
                    <p>💬 实时聊天，交流棋艺</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 全球房间信息 */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-green-800 flex items-center gap-2">
                      <Earth className="w-4 h-4 animate-pulse" />
                      全球房间 {globalRoom.id}
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyRoomId}
                      className={copied ? 'bg-green-100 text-green-800' : 'border-green-300 text-green-600 hover:bg-green-50'}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      {copied ? '已复制!' : '分享'}
                    </Button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">在线玩家:</span>
                      <span className="font-medium text-green-600">{globalRoom.players.length}/2</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">我的角色:</span>
                      <span className={`font-medium ${
                        globalRoom.players.find(p => p.id === globalOnlineManager.getStatus().playerId)?.role === 1 
                          ? 'text-gray-800' : 'text-gray-600'
                      }`}>
                        {globalRoom.players.find(p => p.id === globalOnlineManager.getStatus().playerId)?.role === 1 
                          ? '⚫ 黑子 (先手)' : '⚪ 白子 (后手)'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">房间状态:</span>
                      <span className={`font-medium flex items-center gap-1 ${
                        globalRoom.gameState === 'playing' ? 'text-green-600' : 
                        globalRoom.gameState === 'waiting' ? 'text-yellow-600' : 'text-gray-600'
                      }`}>
                        {globalRoom.gameState === 'waiting' && <Clock className="w-3 h-3 animate-pulse" />}
                        {globalRoom.gameState === 'waiting' ? '⏳ 等待对手加入' : 
                         globalRoom.gameState === 'playing' ? '🎮 对弈进行中' : '🏁 游戏结束'}
                      </span>
                    </div>
                    
                    {globalRoom.spectators > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">观战人数:</span>
                        <span className="font-medium text-blue-600">{globalRoom.spectators} 人观战</span>
                      </div>
                    )}
                  </div>
                  
                  {/* 玩家列表 */}
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="text-xs font-medium text-green-800 mb-2">房间内玩家:</div>
                    <div className="space-y-1">
                      {globalRoom.players.map((player, index) => (
                        <div key={player.id} className="flex items-center gap-2 text-xs">
                          <div className={`w-2 h-2 rounded-full ${
                            player.role === 1 ? 'bg-gray-800' : 'bg-gray-200 border border-gray-400'
                          }`} />
                          <span className={`${
                            player.id === globalOnlineManager.getStatus().playerId ? 'font-bold text-green-700' : 'text-gray-600'
                          }`}>
                            {player.name} {player.id === globalOnlineManager.getStatus().playerId ? '(你)' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 全球连接状态 */}
                <div className={`p-3 rounded-lg border ${
                  connectionStatus === 'connected' ? 'bg-green-50 border-green-200' :
                  connectionStatus === 'connecting' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className={`text-sm font-medium ${
                    connectionStatus === 'connected' ? 'text-green-700' :
                    connectionStatus === 'connecting' ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {connectionStatus === 'connected' ? '✅ 全球服务器连接稳定' :
                     connectionStatus === 'connecting' ? '🔄 正在连接全球服务器...' :
                     '❌ 全球服务器连接中断'}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleLeaveGlobalRoom}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    离开房间
                  </Button>
                  
                  <Button
                    onClick={handleCopyRoomId}
                    variant="outline"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    邀请朋友
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* 本地模式提示 */}
        {mode === 'local' && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 text-center">
              <Users className="w-5 h-5 mx-auto mb-2 text-gray-400" />
              本地对战模式
              <br />
              两名玩家轮流在同一设备上下棋
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
