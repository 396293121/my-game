export default class BootScene extends Phaser.Scene {
    constructor() {
      super({ key: 'BootScene' });
    }
  
    preload() {
      // 加载启动时需要的资源 (比如一个小的进度条图片)
      // this.load.image('progress-bar', 'assets/images/progress-bar.png');
    }
  
    create() {
      console.log('BootScene create');
      // 启动完成后，跳转到预加载场景
      this.scene.start('PreloadScene');
    }
  }