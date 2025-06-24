import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import GameScene from './scenes/GameScene.js';

// Phaser 游戏配置
const config = {
  type: Phaser.AUTO, // 自动选择 WebGL 或 Canvas
  width: 800,        // 游戏画布宽度 (匹配index.html中的容器)
  height: 600,       // 游戏画布高度
  parent: 'game-container', // HTML容器ID
  physics: {
    default: 'arcade', // 使用简单高效的 Arcade Physics
    arcade: {
      gravity: { y: 1200 }, // 重力 (Y轴正方向向下)
      debug: true          // 开启调试显示碰撞框 (开发时设为true方便调试)
    }
  },
  scene: [BootScene, PreloadScene, GameScene] // 场景执行顺序
};

// 创建游戏实例
const game = new Phaser.Game(config);