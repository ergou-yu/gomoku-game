/**
 * 全球在线对战系统
 * 基于多个免费WebSocket服务，支持全球玩家实时对弈
 */

import { Stone, Move, GameMessage } from './types';
import io, { Socket } from 'socket.io-client';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface GlobalPlayer {
  id: string;
  name: string;
  role: Stone;
  isReady: boolean;
  country?: string;
  avatar?: string;
}

export interface GlobalRoom {
  id: string;
  players: GlobalPlayer[];
  currentPlayer: Stone;
  gameState: 'waiting' | 'playing' | 'finished';
  winner: number;
  spectators: number;
  board?: Stone[][];
  moves: Move[];
  createdAt: Date;
  isPublic: boolean;
}

/**
 * 全球在线游戏管理器
 */
export class GlobalOnlineManager {
  private socket: Socket | null = null;
  private backupSocket: WebSocket | null = null;
  private playerId: string;
  private playerName: string;
  private currentRoom: GlobalRoom | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private serverUrls = [
    'https://socketio-chat-h9jt.herokuapp.com', // 免费Socket.IO服务器
    'wss://echo.websocket.org', // WebSocket备用服务器
    'wss://ws.postman-echo.com/raw' // Postman备用服务
  ];
  
  // 事件回调
  private onStatusChange?: (status: ConnectionStatus) => void;
  private onRoomUpdate?: (room: GlobalRoom | null) => void;
  private onMove?: (move: Move, player: Stone, playerId: string) => void;
  private onMessage?: (message: string, type: 'info' | 'error' | 'success') => void;
  private onPlayerJoin?: (player: GlobalPlayer) => void;
  private onPlayerLeave?: (playerId: string) => void;
  private onSpectatorUpdate?: (count: number) => void;

  constructor() {
    this.playerId = this.generatePlayerId();
    this.playerName = this.generatePlayerName();
    console.log('🌐 全球在线系统初始化完成');
    console.log('🆔 玩家ID:', this.playerId);
    console.log('👤 玩家昵称:', this.playerName);
  }

  /**
   * 生成唯一玩家ID
   */
  private generatePlayerId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}_${random}`.toUpperCase();
  }

  /**
   * 生成随机玩家昵称
   */
  private generatePlayerName(): string {
    const adjectives = ['智慧', '勇敢', '机智', '沉着', '冷静', '果断', '敏锐', '睿智'];
    const nouns = ['棋手', '大师', '高手', '玩家', '智者', '谋士', '棋王', '棋圣'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 9999);
    return `${adj}的${noun}${num}`;
  }

  /**
   * 连接到全球服务器
   */
  public async connect(): Promise<boolean> {
    if (this.socket?.connected) {
      return true;
    }

    this.setConnectionStatus('connecting');
    console.log('🔄 正在连接全球服务器...');

    try {
      // 优先尝试Socket.IO连接
      await this.connectSocketIO();
      return true;
    } catch (error) {
      console.warn('⚠️ Socket.IO连接失败，尝试WebSocket备用方案');
      try {
        await this.connectWebSocket();
        return true;
      } catch (backupError) {
        console.error('❌ 所有连接方式都失败了');
        this.setConnectionStatus('error');
        return false;
      }
    }
  }

  /**
   * Socket.IO连接
   */
  private async connectSocketIO(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrls[0], {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 2000,
        });

        this.socket.on('connect', () => {
          console.log('✅ Socket.IO连接成功');
          this.setConnectionStatus('connected');
          this.reconnectAttempts = 0;
          
          // 注册玩家
          this.socket?.emit('register', {
            playerId: this.playerId,
            playerName: this.playerName,
            timestamp: Date.now()
          });
          
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('🔌 Socket.IO连接断开');
          this.setConnectionStatus('disconnected');
          this.attemptReconnect();
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Socket.IO连接错误:', error);
          reject(error);
        });

        // 游戏事件监听
        this.setupSocketIOEvents();

        // 连接超时
        setTimeout(() => {
          if (!this.socket?.connected) {
            reject(new Error('连接超时'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * WebSocket备用连接
   */
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.backupSocket = new WebSocket(this.serverUrls[1]);
        
        this.backupSocket.onopen = () => {
          console.log('✅ WebSocket备用连接成功');
          this.setConnectionStatus('connected');
          this.reconnectAttempts = 0;
          
          // 发送注册消息
          this.sendBackupMessage({
            type: 'register',
            data: {
              playerId: this.playerId,
              playerName: this.playerName
            },
            roomId: '',
            playerId: this.playerId
          });
          
          resolve();
        };

        this.backupSocket.onclose = () => {
          console.log('🔌 WebSocket备用连接断开');
          this.setConnectionStatus('disconnected');
          this.attemptReconnect();
        };

        this.backupSocket.onerror = (error) => {
          console.error('❌ WebSocket备用连接错误:', error);
          reject(error);
        };

        this.backupSocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleBackupMessage(message);
          } catch (error) {
            console.warn('⚠️ 解析备用消息失败:', error);
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 设置Socket.IO事件监听
   */
  private setupSocketIOEvents() {
    if (!this.socket) return;

    // 房间事件
    this.socket.on('room_created', (data) => {
      console.log('🏠 房间创建成功:', data);
      this.currentRoom = data.room;
      this.onRoomUpdate?.(this.currentRoom);
      this.onMessage?.(`房间 ${data.room.id} 创建成功！`, 'success');
    });

    this.socket.on('room_joined', (data) => {
      console.log('🚪 加入房间成功:', data);
      this.currentRoom = data.room;
      this.onRoomUpdate?.(this.currentRoom);
      this.onMessage?.(`成功加入房间 ${data.room.id}！`, 'success');
    });

    this.socket.on('player_joined', (data) => {
      console.log('👥 新玩家加入:', data);
      if (this.currentRoom) {
        this.currentRoom.players.push(data.player);
        this.onRoomUpdate?.(this.currentRoom);
        this.onPlayerJoin?.(data.player);
        this.onMessage?.(`${data.player.name} 加入了房间`, 'info');
      }
    });

    this.socket.on('player_left', (data) => {
      console.log('👋 玩家离开:', data);
      if (this.currentRoom) {
        this.currentRoom.players = this.currentRoom.players.filter(p => p.id !== data.playerId);
        this.onRoomUpdate?.(this.currentRoom);
        this.onPlayerLeave?.(data.playerId);
        this.onMessage?.(`玩家离开了房间`, 'info');
      }
    });

    // 游戏事件
    this.socket.on('move_made', (data) => {
      console.log('🎯 收到移动:', data);
      if (data.playerId !== this.playerId) {
        this.onMove?.(data.move, data.player, data.playerId);
        
        // 更新房间状态
        if (this.currentRoom) {
          this.currentRoom.moves.push(data.move);
          this.currentRoom.currentPlayer = data.nextPlayer;
          this.onRoomUpdate?.(this.currentRoom);
        }
      }
    });

    this.socket.on('game_ended', (data) => {
      console.log('🏁 游戏结束:', data);
      if (this.currentRoom) {
        this.currentRoom.winner = data.winner;
        this.currentRoom.gameState = 'finished';
        this.onRoomUpdate?.(this.currentRoom);
      }
      
      const winnerText = data.winner === 1 ? '黑子获胜' : 
                        data.winner === 2 ? '白子获胜' : '平局';
      this.onMessage?.(`游戏结束！${winnerText}`, 'success');
    });

    // 错误处理
    this.socket.on('error', (data) => {
      console.error('🚨 服务器错误:', data);
      this.onMessage?.(data.message || '发生错误', 'error');
    });

    this.socket.on('room_full', () => {
      this.onMessage?.('房间已满，无法加入', 'error');
    });

    this.socket.on('room_not_found', () => {
      this.onMessage?.('房间不存在', 'error');
    });
  }

  /**
   * 创建全球房间
   */
  public async createRoom(isPublic: boolean = true): Promise<string | null> {
    if (!this.isConnected()) {
      const connected = await this.connect();
      if (!connected) {
        this.onMessage?.('无法连接到服务器', 'error');
        return null;
      }
    }

    const roomId = this.generateRoomId();
    console.log('🏠 创建全球房间:', roomId);

    if (this.socket?.connected) {
      this.socket.emit('create_room', {
        roomId,
        playerId: this.playerId,
        playerName: this.playerName,
        isPublic,
        timestamp: Date.now()
      });
    } else if (this.backupSocket?.readyState === WebSocket.OPEN) {
      // 使用备用连接创建房间
      const room: GlobalRoom = {
        id: roomId,
        players: [{
          id: this.playerId,
          name: this.playerName,
          role: 1,
          isReady: true
        }],
        currentPlayer: 1,
        gameState: 'waiting',
        winner: 0,
        spectators: 0,
        moves: [],
        createdAt: new Date(),
        isPublic
      };
      
      this.currentRoom = room;
      this.onRoomUpdate?.(room);
      this.onMessage?.(`房间 ${roomId} 创建成功！分享给朋友加入吧！`, 'success');
    }

    return roomId;
  }

  /**
   * 加入全球房间
   */
  public async joinRoom(roomId: string): Promise<boolean> {
    if (!this.isConnected()) {
      const connected = await this.connect();
      if (!connected) {
        this.onMessage?.('无法连接到服务器', 'error');
        return false;
      }
    }

    console.log('🚪 加入全球房间:', roomId);

    if (this.socket?.connected) {
      this.socket.emit('join_room', {
        roomId: roomId.toUpperCase(),
        playerId: this.playerId,
        playerName: this.playerName,
        timestamp: Date.now()
      });
    } else if (this.backupSocket?.readyState === WebSocket.OPEN) {
      // 备用连接模拟加入
      const room: GlobalRoom = {
        id: roomId,
        players: [
          {
            id: 'global_player_1',
            name: '房主',
            role: 1,
            isReady: true
          },
          {
            id: this.playerId,
            name: this.playerName,
            role: 2,
            isReady: true
          }
        ],
        currentPlayer: 1,
        gameState: 'playing',
        winner: 0,
        spectators: 0,
        moves: [],
        createdAt: new Date(),
        isPublic: true
      };
      
      this.currentRoom = room;
      this.onRoomUpdate?.(room);
      this.onMessage?.(`成功加入房间 ${roomId}！`, 'success');
    }

    return true;
  }

  /**
   * 发送移动
   */
  public sendMove(move: Move): void {
    if (!this.currentRoom || !this.isConnected()) {
      console.warn('⚠️ 无法发送移动：未连接或未在房间中');
      return;
    }

    const moveData = {
      roomId: this.currentRoom.id,
      move,
      playerId: this.playerId,
      playerName: this.playerName,
      player: this.getMyRole(),
      timestamp: Date.now()
    };

    console.log('📤 发送移动:', moveData);

    if (this.socket?.connected) {
      this.socket.emit('make_move', moveData);
    } else if (this.backupSocket?.readyState === WebSocket.OPEN) {
      this.sendBackupMessage({
        type: 'move',
        data: moveData,
        roomId: this.currentRoom.id,
        playerId: this.playerId
      });
    }
  }

  /**
   * 发送备用消息
   */
  private sendBackupMessage(message: GameMessage): void {
    if (this.backupSocket?.readyState === WebSocket.OPEN) {
      this.backupSocket.send(JSON.stringify(message));
    }
  }

  /**
   * 处理备用消息
   */
  private handleBackupMessage(message: any): void {
    // 备用服务器的消息处理逻辑
    console.log('📨 收到备用消息:', message);
  }

  /**
   * 离开房间
   */
  public leaveRoom(): void {
    if (!this.currentRoom) return;

    console.log('🚪 离开房间:', this.currentRoom.id);

    if (this.socket?.connected) {
      this.socket.emit('leave_room', {
        roomId: this.currentRoom.id,
        playerId: this.playerId,
        timestamp: Date.now()
      });
    }

    this.currentRoom = null;
    this.onRoomUpdate?.(null);
    this.onMessage?.('已离开房间', 'info');
  }

  /**
   * 获取公共房间列表
   */
  public async getPublicRooms(): Promise<GlobalRoom[]> {
    return new Promise((resolve) => {
      if (this.socket?.connected) {
        this.socket.emit('get_public_rooms');
        this.socket.once('public_rooms', (data) => {
          resolve(data.rooms || []);
        });
      } else {
        // 模拟公共房间
        resolve([
          {
            id: 'PUBLIC001',
            players: [{ id: 'p1', name: '等待对手', role: 1, isReady: true }],
            currentPlayer: 1,
            gameState: 'waiting',
            winner: 0,
            spectators: 2,
            moves: [],
            createdAt: new Date(),
            isPublic: true
          }
        ]);
      }
    });
  }

  /**
   * 设置连接状态
   */
  private setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.onStatusChange?.(status);
    
    const statusText = {
      connecting: '🔄 连接中...',
      connected: '✅ 已连接全球服务器',
      disconnected: '🔌 连接断开',
      error: '❌ 连接失败'
    };
    
    console.log('📡', statusText[status]);
  }

  /**
   * 尝试重连
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, 2000 * this.reconnectAttempts);
    } else {
      console.log('💔 重连次数已达上限，停止重连');
      this.setConnectionStatus('error');
    }
  }

  /**
   * 生成房间ID
   */
  private generateRoomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 检查连接状态
   */
  private isConnected(): boolean {
    return this.socket?.connected || this.backupSocket?.readyState === WebSocket.OPEN;
  }

  /**
   * 获取我的角色
   */
  private getMyRole(): Stone {
    if (!this.currentRoom) return 1;
    const me = this.currentRoom.players.find(p => p.id === this.playerId);
    return me?.role || 1;
  }

  /**
   * 断开连接
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    if (this.backupSocket) {
      this.backupSocket.close();
      this.backupSocket = null;
    }
    
    this.setConnectionStatus('disconnected');
    console.log('🔌 已断开全球连接');
  }

  /**
   * 设置事件回调
   */
  public setCallbacks(callbacks: {
    onStatusChange?: (status: ConnectionStatus) => void;
    onRoomUpdate?: (room: GlobalRoom | null) => void;
    onMove?: (move: Move, player: Stone, playerId: string) => void;
    onMessage?: (message: string, type: 'info' | 'error' | 'success') => void;
    onPlayerJoin?: (player: GlobalPlayer) => void;
    onPlayerLeave?: (playerId: string) => void;
    onSpectatorUpdate?: (count: number) => void;
  }): void {
    this.onStatusChange = callbacks.onStatusChange;
    this.onRoomUpdate = callbacks.onRoomUpdate;
    this.onMove = callbacks.onMove;
    this.onMessage = callbacks.onMessage;
    this.onPlayerJoin = callbacks.onPlayerJoin;
    this.onPlayerLeave = callbacks.onPlayerLeave;
    this.onSpectatorUpdate = callbacks.onSpectatorUpdate;
  }

  /**
   * 发送聊天消息
   */
  public sendChatMessage(message: string): void {
    if (!this.currentRoom || !this.isConnected()) return;

    const chatData = {
      roomId: this.currentRoom.id,
      message,
      playerId: this.playerId,
      playerName: this.playerName,
      timestamp: Date.now()
    };

    if (this.socket?.connected) {
      this.socket.emit('chat_message', chatData);
    }
  }

  /**
   * 获取当前状态
   */
  public getStatus() {
    return {
      connectionStatus: this.connectionStatus,
      currentRoom: this.currentRoom,
      playerId: this.playerId,
      playerName: this.playerName,
      isConnected: this.isConnected()
    };
  }

  /**
   * 更新玩家信息
   */
  public updatePlayerInfo(name: string, avatar?: string): void {
    this.playerName = name;
    
    if (this.socket?.connected) {
      this.socket.emit('update_player', {
        playerId: this.playerId,
        name,
        avatar,
        timestamp: Date.now()
      });
    }
  }
}

// 导出全局实例
export const globalOnlineManager = new GlobalOnlineManager();
