/**
 * 用户管理系统
 * 提供注册、登录、用户数据管理功能
 */

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  level: number;
  experience: number;
  gamesPlayed: number;
  gamesWon: number;
  createdAt: Date;
  lastLoginAt: Date;
  preferences: {
    theme: string;
    soundEnabled: boolean;
    difficulty: string;
  };
  achievements: string[];
  friends: string[];
  ranking: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * 用户管理类
 */
export class UserManager {
  private currentUser: User | null = null;
  private isLoggedIn: boolean = false;
  private apiBase: string;
  
  // 回调函数
  private onAuthChange?: (user: User | null) => void;
  private onLevelUp?: (newLevel: number) => void;
  
  constructor() {
    this.apiBase = 'https://your-gomoku-server.com/api'; // 这里需要实际的服务器地址
    this.loadUserFromStorage();
  }

  /**
   * 从本地存储加载用户信息
   */
  private loadUserFromStorage() {
    try {
      const userData = localStorage.getItem('gomoku-user');
      const token = localStorage.getItem('gomoku-token');
      
      if (userData && token) {
        this.currentUser = JSON.parse(userData);
        this.isLoggedIn = true;
        console.log('✅ 用户登录状态已恢复:', this.currentUser?.username);
        
        // 验证token是否有效
        this.validateToken(token);
      }
    } catch (error) {
      console.warn('⚠️ 加载用户数据失败:', error);
      this.logout();
    }
  }

  /**
   * 验证token有效性
   */
  private async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBase}/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        this.currentUser = userData.user;
        this.saveUserToStorage();
        return true;
      } else {
        // Token无效，清除登录状态
        this.logout();
        return false;
      }
    } catch (error) {
      console.warn('⚠️ Token验证失败，使用离线模式');
      return false;
    }
  }

  /**
   * 用户注册
   */
  public async register(data: RegisterData): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      // 基本验证
      if (data.password !== data.confirmPassword) {
        return { success: false, message: '密码确认不匹配' };
      }
      
      if (data.password.length < 6) {
        return { success: false, message: '密码长度至少6位' };
      }
      
      if (!this.isValidEmail(data.email)) {
        return { success: false, message: '邮箱格式不正确' };
      }

      // 尝试在线注册
      try {
        const response = await fetch(`${this.apiBase}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (response.ok) {
          this.currentUser = result.user;
          this.isLoggedIn = true;
          localStorage.setItem('gomoku-token', result.token);
          this.saveUserToStorage();
          this.onAuthChange?.(this.currentUser);
          
          return { success: true, message: '注册成功！', user: this.currentUser };
        } else {
          return { success: false, message: result.message || '注册失败' };
        }
      } catch (networkError) {
        // 网络错误，使用离线注册
        console.warn('⚠️ 在线注册失败，使用离线模式');
        return this.registerOffline(data);
      }
    } catch (error) {
      console.error('❌ 注册过程出错:', error);
      return { success: false, message: '注册过程出现错误' };
    }
  }

  /**
   * 离线注册
   */
  private registerOffline(data: RegisterData): { success: boolean; message: string; user?: User } {
    // 检查用户名是否已存在（本地）
    const existingUsers = this.getOfflineUsers();
    if (existingUsers.some(u => u.email === data.email)) {
      return { success: false, message: '该邮箱已被注册' };
    }

    // 创建新用户
    const newUser: User = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      username: data.username,
      email: data.email,
      level: 1,
      experience: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      preferences: {
        theme: 'classic',
        soundEnabled: true,
        difficulty: 'medium'
      },
      achievements: ['新手上路'],
      friends: [],
      ranking: 0
    };

    // 保存到本地
    this.currentUser = newUser;
    this.isLoggedIn = true;
    this.saveUserToStorage();
    this.saveOfflineUser(newUser, data.password);
    this.onAuthChange?.(this.currentUser);

    return { success: true, message: '离线注册成功！（联网后将同步到服务器）', user: newUser };
  }

  /**
   * 用户登录
   */
  public async login(credentials: LoginCredentials): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      // 尝试在线登录
      try {
        const response = await fetch(`${this.apiBase}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        });

        const result = await response.json();
        
        if (response.ok) {
          this.currentUser = result.user;
          this.isLoggedIn = true;
          localStorage.setItem('gomoku-token', result.token);
          this.saveUserToStorage();
          this.onAuthChange?.(this.currentUser);
          
          return { success: true, message: '登录成功！', user: this.currentUser };
        } else {
          // 在线登录失败，尝试离线登录
          return this.loginOffline(credentials);
        }
      } catch (networkError) {
        // 网络错误，使用离线登录
        console.warn('⚠️ 在线登录失败，尝试离线模式');
        return this.loginOffline(credentials);
      }
    } catch (error) {
      console.error('❌ 登录过程出错:', error);
      return { success: false, message: '登录过程出现错误' };
    }
  }

  /**
   * 离线登录
   */
  private loginOffline(credentials: LoginCredentials): { success: boolean; message: string; user?: User } {
    const offlineUsers = this.getOfflineUsers();
    const userRecord = offlineUsers.find(u => u.email === credentials.email);
    
    if (!userRecord) {
      return { success: false, message: '用户不存在' };
    }
    
    // 简单的密码验证（实际应用中应该使用哈希）
    if (userRecord.password !== this.hashPassword(credentials.password)) {
      return { success: false, message: '密码错误' };
    }
    
    // 更新最后登录时间
    userRecord.user.lastLoginAt = new Date();
    this.currentUser = userRecord.user;
    this.isLoggedIn = true;
    this.saveUserToStorage();
    this.onAuthChange?.(this.currentUser);
    
    return { success: true, message: '离线登录成功！', user: this.currentUser };
  }

  /**
   * 用户登出
   */
  public logout() {
    this.currentUser = null;
    this.isLoggedIn = false;
    localStorage.removeItem('gomoku-user');
    localStorage.removeItem('gomoku-token');
    this.onAuthChange?.(null);
    console.log('👋 用户已登出');
  }

  /**
   * 更新用户游戏统计
   */
  public updateGameStats(won: boolean, experienceGained: number = 10) {
    if (!this.currentUser) return;

    this.currentUser.gamesPlayed++;
    if (won) {
      this.currentUser.gamesWon++;
      this.currentUser.experience += experienceGained * 2; // 获胜双倍经验
    } else {
      this.currentUser.experience += experienceGained;
    }

    // 检查升级
    const newLevel = Math.floor(this.currentUser.experience / 100) + 1;
    if (newLevel > this.currentUser.level) {
      this.currentUser.level = newLevel;
      this.onLevelUp?.(newLevel);
      
      // 解锁成就
      this.checkAchievements();
    }

    this.saveUserToStorage();
    this.syncToServer();
  }

  /**
   * 检查成就
   */
  private checkAchievements() {
    if (!this.currentUser) return;

    const achievements = this.currentUser.achievements;
    const stats = this.currentUser;

    // 游戏次数成就
    if (stats.gamesPlayed >= 10 && !achievements.includes('初露锋芒')) {
      achievements.push('初露锋芒');
    }
    if (stats.gamesPlayed >= 50 && !achievements.includes('勤学苦练')) {
      achievements.push('勤学苦练');
    }
    if (stats.gamesPlayed >= 100 && !achievements.includes('百战老将')) {
      achievements.push('百战老将');
    }

    // 胜率成就  
    const winRate = stats.gamesWon / Math.max(stats.gamesPlayed, 1);
    if (winRate >= 0.7 && stats.gamesPlayed >= 20 && !achievements.includes('高手风范')) {
      achievements.push('高手风范');
    }

    // 等级成就
    if (stats.level >= 10 && !achievements.includes('棋艺精进')) {
      achievements.push('棋艺精进');
    }
    if (stats.level >= 20 && !achievements.includes('大师风采')) {
      achievements.push('大师风采');
    }
  }

  /**
   * 获取当前用户
   */
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * 检查是否已登录
   */
  public isAuthenticated(): boolean {
    return this.isLoggedIn && this.currentUser !== null;
  }

  /**
   * 设置回调函数
   */
  public setCallbacks(callbacks: {
    onAuthChange?: (user: User | null) => void;
    onLevelUp?: (newLevel: number) => void;
  }) {
    this.onAuthChange = callbacks.onAuthChange;
    this.onLevelUp = callbacks.onLevelUp;
  }

  /**
   * 同步到服务器
   */
  private async syncToServer() {
    if (!this.currentUser || !this.isLoggedIn) return;

    try {
      const token = localStorage.getItem('gomoku-token');
      if (!token) return;

      await fetch(`${this.apiBase}/user/sync`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.currentUser)
      });
    } catch (error) {
      console.warn('⚠️ 同步到服务器失败，数据已保存在本地');
    }
  }

  /**
   * 保存用户到本地存储
   */
  private saveUserToStorage() {
    if (this.currentUser) {
      localStorage.setItem('gomoku-user', JSON.stringify(this.currentUser));
    }
  }

  /**
   * 离线用户管理
   */
  private getOfflineUsers(): Array<{email: string; password: string; user: User}> {
    try {
      const users = localStorage.getItem('gomoku-offline-users');
      return users ? JSON.parse(users) : [];
    } catch {
      return [];
    }
  }

  private saveOfflineUser(user: User, password: string) {
    const users = this.getOfflineUsers();
    users.push({
      email: user.email,
      password: this.hashPassword(password),
      user
    });
    localStorage.setItem('gomoku-offline-users', JSON.stringify(users));
  }

  /**
   * 简单密码哈希（实际应用应使用更安全的方法）
   */
  private hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString();
  }

  /**
   * 邮箱格式验证
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 获取用户统计信息
   */
  public getUserStats(): {
    level: number;
    experience: number;
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
    achievements: string[];
  } | null {
    if (!this.currentUser) return null;

    return {
      level: this.currentUser.level,
      experience: this.currentUser.experience,
      gamesPlayed: this.currentUser.gamesPlayed,
      gamesWon: this.currentUser.gamesWon,
      winRate: this.currentUser.gamesWon / Math.max(this.currentUser.gamesPlayed, 1),
      achievements: this.currentUser.achievements
    };
  }

  /**
   * 更新用户偏好设置
   */
  public updatePreferences(preferences: Partial<User['preferences']>) {
    if (!this.currentUser) return;

    this.currentUser.preferences = {
      ...this.currentUser.preferences,
      ...preferences
    };

    this.saveUserToStorage();
    this.syncToServer();
  }
}

// 导出全局用户管理实例
export const userManager = new UserManager();
