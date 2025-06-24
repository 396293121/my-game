export default class PreloadScene extends Phaser.Scene {
    constructor() {
      super({ key: 'PreloadScene' });
    }
  
    preload() {
      console.log('PreloadScene preload');
  
      // 显示加载进度条
      const progressBar = this.add.graphics();
      const progressBox = this.add.graphics();
      progressBox.fillStyle(0x222222, 0.8);
      progressBox.fillRect(240, 270, 320, 50);
  
      // 监听加载进度事件
      this.load.on('progress', (value) => {
        progressBar.clear();
        progressBar.fillStyle(0xffffff, 1);
        progressBar.fillRect(250, 280, 300 * value, 30);
      });
  
      this.load.on('complete', () => {
        console.log('Load complete');
        progressBar.destroy();
        progressBox.destroy();
      });
  
      // 加载游戏资源
      // 1. 图像
      this.load.setBaseURL(window.location.href);
      this.load.image('sky', 'assets/images/sky.svg');
      this.load.image('ground', 'assets/images/platform.svg'); // 宽平台
      this.load.image('platform', 'assets/images/platform-narrow.svg'); // 窄平台
      this.load.image('star', 'assets/images/star.png');
      this.load.image('bomb', '/assets/images/bomb.png');
      this.load.image('health', 'assets/images/health.png');
      this.load.spritesheet('dude', 'assets/images/dude.png', {
        frameWidth: 32, frameHeight: 48
      }); // 玩家精灵表
      this.load.spritesheet('bullet', 'assets/images/bullet.png', {
        frameWidth: 48, frameHeight: 48
      }); // 子弹精灵表

      // 2. 音频
      this.load.audio('jumpSound', 'assets/audio/jump.wav');
      this.load.audio('collectSound', 'assets/audio/collect.wav');
      this.load.audio('hitSound', 'assets/audio/hit.wav');
      this.load.audio('shotSound', 'assets/audio/shot.wav');
      this.load.audio('enemyHitSound', 'assets/audio/enemyHit.wav');
  
      // 3. 瓦片地图 (Tiled JSON 和 对应图集)
      // this.load.tilemapTiledJSON('level1', 'assets/tilemaps/level1.json');
      // this.load.image('tiles', 'assets/tilemaps/tiles.png');
  
      // 4. 字体 (如果需要)
      // this.load.bitmapFont('font', 'assets/fonts/font.png', 'assets/fonts/font.fnt');
    }
  
    create() {
      console.log('PreloadScene create');
      // 资源加载完毕，跳转到主游戏场景
      this.scene.start('GameScene');
    }
  }