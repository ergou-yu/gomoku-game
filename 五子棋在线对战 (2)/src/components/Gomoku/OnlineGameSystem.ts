/**
 * 在线对战系统
 * 基于WebSocket的实时对战功能
 */

import { Stone, Move, GameMessage } from './types';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface OnlinePlayer {
  id: string;
  name: string;
  role: Stone; // 1=黑子, 2=白子
  isReady: boolean;
}

export interface OnlineRoom {
  id: string;
  players: OnlinePlayer[];
  currentPlayer: Stone;
  gameState: 'waiting' | 'playing' | 'finished';
  winner: number;
  spectators: number;
}

/**
 * 在线游戏管理器
 */
export class OnlineGameManager {
  private ws: WebSocket | null = null;
  private playerId: string;
  private currentRoom: OnlineRoom | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  
  // 事件回调
  private onStatusChange?: (status: ConnectionStatus) => void;
  private onRoomUpdate?: (room: OnlineRoom) => void;
  private onMove?: (move: Move, player: Stone) => void;
  private onMessage?: (message: string, type: 'info' | 'error' | 'success') => void;

  constructor() {
    this.playerId = this.generatePlayerId();
  }

  /**
   * 生成唯一玩家ID
   */
  private generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * 连接到游戏服务器
   */
  public async connect(): Promise<boolean> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return true;
    }

    try {
      this.setConnectionStatus('connecting');
      
      // 这里使用一个公共的WebSocket测试服务器作为演示
      // 在实际应用中，您需要部署自己的WebSocket服务器
      this.ws = new WebSocket('wss://echo.websocket.org/');
      
      this.ws.onopen = () => {
        console.log('WebSocket连接已建立');
        this.setConnectionStatus('connected');
        this.reconnectAttempts = 0;
        this.sendMessage({
          type: 'join',
          data: { playerId: this.playerId },
          roomId: '',
          playerId: this.playerId
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: GameMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('解析消息失败:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket连接已关闭');
        this.setConnectionStatus('disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket错误:', error);
        this.setConnectionStatus('error');
      };

      return new Promise((resolve) => {
        const checkConnection = () => {
          if (this.connectionStatus === 'connected') {
            resolve(true);
          } else if (this.connectionStatus === 'error') {
            resolve(false);
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });

    } catch (error) {
      console.error('连接失败:', error);
      this.setConnectionStatus('error');
      return false;
    }
  }

  /**
   * 尝试重连
   */
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => {
        this.connect();
      }, 2000 * this.reconnectAttempts);
    }
  }

  /**
   * 设置连接状态
   */
  private setConnectionStatus(status: ConnectionStatus) {
    this.connectionStatus = status;
    this.onStatusChange?.(status);
  }

  /**
   * 创建房间
   */
  public async createRoom(): Promise<string | null> {
    if (!this.isConnected()) {
      await this.connect();
    }

    const roomId = this.generateRoomId();
    
    // 模拟房间创建（在实际应用中这应该由服务器处理）
    this.currentRoom = {
      id: roomId,
      players: [{
        id: this.playerId,
        name: `玩家${this.playerId.slice(-4)}`,
        role: 1, // 房主默认为黑子
        isReady: true
      }],
      currentPlayer: 1,
      gameState: 'waiting',
      winner: 0,
      spectators: 0
    };

    this.sendMessage({
      type: 'join',
      data: { roomId, action: 'create' },
      roomId,
      playerId: this.playerId
    });

    this.onRoomUpdate?.(this.currentRoom);
    this.onMessage?.(`房间 ${roomId} 创建成功！`, 'success');

    return roomId;
  }

  /**
   * 加入房间
   */
  public async joinRoom(roomId: string): Promise<boolean> {
    if (!this.isConnected()) {
      const connected = await this.connect();
      if (!connected) return false;
    }

    // 模拟加入房间
    this.currentRoom = {
      id: roomId,
      players: [
        {
          id: 'host_player',
          name: '房主',
          role: 1,
          isReady: true
        },
        {
          id: this.playerId,
          name: `玩家${this.playerId.slice(-4)}`,
          role: 2, // 加入者为白子
          isReady: true
        }
      ],
      currentPlayer: 1,
      gameState: 'playing',
      winner: 0,
      spectators: 0
    };

    this.sendMessage({
      type: 'join',
      data: { roomId, action: 'join' },
      roomId,
      playerId: this.playerId
    });

    this.onRoomUpdate?.(this.currentRoom);
    this.onMessage?.(`成功加入房间 ${roomId}！`, 'success');

    return true;
  }

  /**
   * 发送落子消息
   */
  public sendMove(move: Move) {
    if (!this.currentRoom) return;

    const message: GameMessage = {
      type: 'move',
      data: move,
      roomId: this.currentRoom.id,
      playerId: this.playerId
    };

    this.sendMessage(message);
  }

  /**
   * 离开房间
   */
  public leaveRoom() {
    if (this.currentRoom) {
      this.sendMessage({
        type: 'leave',
        data: {},
        roomId: this.currentRoom.id,
        playerId: this.playerId
      });
      
      this.currentRoom = null;
      this.onRoomUpdate?.(null as any);
      this.onMessage?.('已离开房间', 'info');
    }
  }

  /**
   * 发送消息
   */
  private sendMessage(message: GameMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: GameMessage) {
    switch (message.type) {
      case 'move':
        if (message.data && message.playerId !== this.playerId) {
          this.onMove?.(message.data, message.data.player || 1);
        }
        break;
      
      case 'status':
        if (message.data.room) {
          this.currentRoom = message.data.room;
          this.onRoomUpdate?.(this.currentRoom);
        }
        break;
      
      case 'join':
        this.onMessage?.(message.data.message || '有玩家加入房间', 'info');
        break;
      
      case 'leave':
        this.onMessage?.(message.data.message || '有玩家离开房间', 'info');
        break;
    }
  }

  /**
   * 生成房间ID
   */
  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * 检查是否已连接
   */
  private isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 断开连接
   */
  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setConnectionStatus('disconnected');
  }

  /**
   * 设置事件回调
   */
  public setCallbacks(callbacks: {
    onStatusChange?: (status: ConnectionStatus) => void;
    onRoomUpdate?: (room: OnlineRoom) => void;
    onMove?: (move: Move, player: Stone) => void;
    onMessage?: (message: string, type: 'info' | 'error' | 'success') => void;
  }) {
    this.onStatusChange = callbacks.onStatusChange;
    this.onRoomUpdate = callbacks.onRoomUpdate;
    this.onMove = callbacks.onMove;
    this.onMessage = callbacks.onMessage;
  }

  /**
   * 获取当前状态
   */
  public getStatus() {
    return {
      connectionStatus: this.connectionStatus,
      currentRoom: this.currentRoom,
      playerId: this.playerId
    };
  }
}

// 导出全局实例
export const onlineGameManager = new OnlineGameManager();
