export default class GameScene extends Phaser.Scene {
    constructor() {
      super({ key: 'GameScene' });
      this.player = null;
      this.cursors = null;
      this.stars = null;
      this.score = 0;
      this.scoreText = null;
      this.health = 3;
      this.healthText = null;
      this.spaceKey = null; // 添加空格键变量
      this.isInvincible = false; // 添加无敌状态标志
      this.gameOver = false; // 添加游戏结束标志
    }
  
    create() {
      console.log('GameScene create');
      
      // 重置所有游戏状态
      this.score = 0;
      this.health = 3;
      this.isInvincible = false;
      this.gameOver = false;
  
      // 1. 创建背景
      for (let i = 0; i < 3; i++) {
        const sky = this.add.image(i * 800, 0, 'sky');
        sky.setDisplaySize(800, 600);
        sky.setOrigin(0, 0);
      }
      
      // 2. 创建平台 (地面和空中)
      const platforms = this.physics.add.staticGroup();
      
      // 底部主平台使用宽平台
      for (let i = 0; i < 3; i++) {
        const ground = platforms.create(i * 800 + 400, 568, 'ground');
        ground.setScale(3, 1);
        ground.refreshBody();
      }
      
      // 空中平台配置
      const platformConfigs = [
        // 第一场景
        {x: 700, y: 400}, {x: 100, y: 400}, {x: 500, y: 300},
        // 第二场景
        {x: 1000, y: 350}, {x: 1300, y: 250}, {x: 1600, y: 400},
        // 第三场景
        {x: 1800, y: 300}, {x: 2100, y: 200}, {x: 2300, y: 350}
      ];
      
      // 创建空中平台
      platformConfigs.forEach(config => {
        platforms.create(config.x, config.y, 'platform');
      });
  
      // 3. 创建玩家 (马里奥角色)
      this.player = this.physics.add.sprite(100, 450, 'dude');
      this.player.setBounce(0.2); // 设置弹跳系数
      this.player.setCollideWorldBounds(true); // 防止掉出世界边界
      
      // 设置相机跟随玩家
      this.cameras.main.setBounds(0, 0, 2400, 600);
      this.cameras.main.startFollow(this.player);
      this.physics.world.setBounds(0, 0, 2400, 600); // 设置物理世界边界
  
      // 4. 创建玩家动画 (使用精灵表)
      this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
      });
      this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20
      });
      this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
      });
  
      // 5. 创建星星组 (收集物)
      this.stars = this.physics.add.group();
      
      // 在三个场景中分布星星
      // 第一场景
      for (let i = 0; i < 12; i++) {
        const star = this.stars.create(12 + i * 70, 0, 'star');
        star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
      }
      
      // 第二场景
      for (let i = 0; i < 12; i++) {
        const star = this.stars.create(812 + i * 70, 0, 'star');
        star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
      }
      
      // 第三场景
      for (let i = 0; i < 12; i++) {
        const star = this.stars.create(1612 + i * 70, 0, 'star');
        star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
      }
      this.stars.children.iterate(child => {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)); // 随机弹跳
      });
  
      // 6. 创建炸弹组 (敌人/障碍物)
      this.bombs = this.physics.add.group({
        bounceY: 1, // 垂直弹跳系数
        bounceX: 1, // 水平弹跳系数
        collideWorldBounds: true // 防止掉出世界边界
      });
        // 生成三个炸弹，分别在三个场景中
        const bomb1 = this.bombs.create(Phaser.Math.Between(0, 800), 150, 'bomb');
        bomb1.setDisplaySize(67, 40);
        bomb1.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb1.setAngularVelocity(360);

        const bomb2 = this.bombs.create(Phaser.Math.Between(800, 1600), 150, 'bomb');
        bomb2.setDisplaySize(67, 40);
        bomb2.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb2.setAngularVelocity(360);

        const bomb3 = this.bombs.create(Phaser.Math.Between(1600, 2400), 150, 'bomb');
        bomb3.setDisplaySize(67, 40);
        bomb3.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb3.setAngularVelocity(360);
      // 7. 创建分数文本（固定在相机视图）
      this.scoreText = this.add.text(16, 16, 'Score: 0', {
        fontSize: '32px',
        fill: '#000'
      }).setScrollFactor(0);
      // 健康文本（固定在相机视图）
      this.healthText = this.add.text(16, 50, 'Health: '+this.health, {
        fontSize: '32px',
        fill: '#000'
      }).setScrollFactor(0);
      // 8. 设置物理碰撞
      // 玩家与平台碰撞
      this.physics.add.collider(this.player, platforms);
      // 星星与平台碰撞 (防止星星掉下去)
      this.physics.add.collider(this.stars, platforms);
      // 炸弹与平台碰撞
      this.physics.add.collider(this.bombs, platforms);
      // 玩家与星星重叠 (收集)
      this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
      // 玩家与炸弹碰撞 (游戏结束/受伤)
      this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);
  
      // 9. 获取键盘输入
      this.cursors = this.input.keyboard.createCursorKeys();
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE); // 添加空格键
    }
  
    update() {
      // 如果游戏结束，不处理玩家移动
      if (this.gameOver) return;

      // 键盘控制玩家移动
      if (this.cursors.left.isDown) {
        this.player.setVelocityX(-160);
        this.player.anims.play('left', true);
      } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(160);
        this.player.anims.play('right', true);
      } else {
        this.player.setVelocityX(0);
        this.player.anims.play('turn');
      }
  
      // 跳跃 (按空格键且玩家接触地面)
      if (this.spaceKey.isDown && this.player.body.touching.down) {
        this.player.setVelocityY(-330); // 向上速度
        this.sound.play('jumpSound'); // 播放跳跃音效
      }

      // 确保炸弹不会掉到底部平台下方
      this.bombs.children.iterate(bomb => {
        if (bomb && bomb.y >= 568) {
          bomb.setVelocityY(-300); // 如果炸弹触底，给一个向上的速度
        }
      });
    }
  
    collectStar(player, star) {
      star.disableBody(true, true); // 禁用并隐藏星星
      this.score += 10; // 加分
      this.scoreText.setText('Score: ' + this.score); // 更新文本
      this.sound.play('collectSound'); // 播放收集音效
  
      // 如果所有星星都被收集了
      if (this.stars.countActive(true) === 0) {
        // 重新激活所有星星 (重置位置)
        this.stars.children.iterate(child => {
          child.enableBody(true, child.x, 0, true, true);
        });
  
  
      }
    }
  
    hitBomb(player, bomb) {
      // 如果玩家处于无敌状态，不触发碰撞
      if (this.isInvincible) return;

      // 播放受伤音效
      this.sound.play('hitSound');
      
      // 设置玩家为无敌状态
      this.isInvincible = true;

      // 玩家变红
      player.setTint(0xff0000);
      
      // 更新生命值
      this.health--;
      this.healthText.setText('Health: ' + this.health);

      // 检查是否游戏结束
      if (this.health <= 0) {
        // 创建半透明黑色背景
        const overlay = this.add.rectangle(0, 0, 2400, 600, 0x000000, 0.7);
        overlay.setOrigin(0, 0);
        overlay.setScrollFactor(0);

        // 创建"你死了"文本
        const gameOverText = this.add.text(400, 250, '你死了', {
          fontSize: '64px',
          fontFamily: 'Arial Black',
          fill: '#ff0000',
          stroke: '#ffffff',
          strokeThickness: 8,
          shadow: { color: '#000000', blur: 10, fill: true }
        });
        gameOverText.setOrigin(0.5);
        gameOverText.setScrollFactor(0);

        // 添加闪烁动画
        this.tweens.add({
          targets: gameOverText,
          alpha: { from: 0.2, to: 1 },
          duration: 1000,
          ease: 'Power2',
          yoyo: true,
          repeat: -1
        });

        // 创建"按空格键重新开始"文本
        const restartText = this.add.text(400, 350, '按空格键重新开始', {
          fontSize: '32px',
          fontFamily: 'Arial',
          fill: '#ffffff',
          stroke: '#000000',
          strokeThickness: 4
        });
        restartText.setOrigin(0.5);
        restartText.setScrollFactor(0);

        // 添加呼吸效果
        this.tweens.add({
          targets: restartText,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });

        // 监听空格键重新开始
        this.input.keyboard.once('keydown-SPACE', () => {
          this.scene.restart();
          this.health = 3;
          this.score = 0;
        });

        // 禁用玩家移动并停止动画
         this.gameOver = true;
         this.player.setVelocity(0);
         this.player.setCollideWorldBounds(false);
         this.player.anims.stop();
         this.player.anims.play('turn');
         return;
      }

      // 1秒后恢复玩家颜色
      this.time.delayedCall(1000, () => {
        player.clearTint();
      });

      // 2秒后解除无敌状态
      this.time.delayedCall(2000, () => {
        this.isInvincible = false;
      });
    }
  }