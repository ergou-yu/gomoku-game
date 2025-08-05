/**
 * 音效系统组件
 * 提供游戏音效控制和管理功能
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Volume2, VolumeX, Music, Music2 } from 'lucide-react';

interface SoundSystemProps {
  /** 音效是否启用 */
  enabled: boolean;
  /** 音效开关回调 */
  onToggle: (enabled: boolean) => void;
  /** 背景音乐开关回调 */
  onMusicToggle: (enabled: boolean) => void;
}

/** 音效类型 */
export type SoundType = 'move' | 'win' | 'button' | 'error';

/**
 * 音效管理器类
 */
class SoundManager {
  private enabled = true;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.initAudioContext();
  }

  /**
   * 初始化音频上下文
   */
  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  /**
   * 设置音效启用状态
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * 播放音效
   */
  play(type: SoundType) {
    if (!this.enabled || !this.audioContext) return;

    // 恢复音频上下文（处理浏览器自动播放策略）
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    switch (type) {
      case 'move':
        this.playMoveSound();
        break;
      case 'win':
        this.playWinSound();
        break;
      case 'button':
        this.playButtonSound();
        break;
      case 'error':
        this.playErrorSound();
        break;
    }
  }

  /**
   * 播放落子音效
   */
  private playMoveSound() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // 清脆的敲击声
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  /**
   * 播放获胜音效
   */
  private playWinSound() {
    if (!this.audioContext) return;

    // 胜利音效 - 上升音调
    const frequencies = [262, 330, 392, 523]; // C-E-G-C
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        const oscillator = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);

        oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime);
        gainNode.gain.setValueAtTime(0.2, this.audioContext!.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.3);

        oscillator.start(this.audioContext!.currentTime);
        oscillator.stop(this.audioContext!.currentTime + 0.3);
      }, index * 150);
    });
  }

  /**
   * 播放按钮音效
   */
  private playButtonSound() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.05);
  }

  /**
   * 播放错误音效
   */
  private playErrorSound() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // 低沉的错误提示音
    oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }
}

// 导出音效管理器实例
export const soundManager = new SoundManager();

export const SoundSystem: React.FC<SoundSystemProps> = ({
  enabled,
  onToggle,
  onMusicToggle,
}) => {
  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-800">
          {enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          音效设置
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 音效开关 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-800">游戏音效</span>
          <Button
            variant={enabled ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle(!enabled)}
            className={enabled ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {enabled ? '已开启' : '已关闭'}
          </Button>
        </div>

        {/* 背景音乐开关 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-800">背景音乐</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMusicToggle(false)}
            className="opacity-50 cursor-not-allowed"
            disabled
          >
            <Music className="w-4 h-4 mr-1" />
            开发中
          </Button>
        </div>

        {/* 音效说明 */}
        <div className="p-3 bg-white/60 rounded-lg border border-green-200">
          <h4 className="text-sm font-semibold text-green-800 mb-2">音效说明</h4>
          <div className="text-xs text-green-700 space-y-1">
            <p>🔈 落子音效 - 清脆的敲击声</p>
            <p>🎉 获胜音效 - 上升音调庆祝</p>
            <p>🎵 按钮音效 - 界面交互反馈</p>
            <p>⚠️ 错误提示 - 无效操作提醒</p>
          </div>
        </div>

        {/* 测试音效 */}
        {enabled && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-green-800">测试音效</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => soundManager.play('move')}
                className="text-xs"
              >
                落子音效
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => soundManager.play('win')}
                className="text-xs"
              >
                获胜音效
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => soundManager.play('button')}
                className="text-xs"
              >
                按钮音效
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => soundManager.play('error')}
                className="text-xs"
              >
                错误音效
              </Button>
            </div>
          </div>
        )}

        {/* 关闭音效时的提示 */}
        {!enabled && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 text-center">
              <VolumeX className="w-5 h-5 mx-auto mb-2 text-gray-400" />
              音效已关闭
              <br />
              开启音效获得更好的游戏体验
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
