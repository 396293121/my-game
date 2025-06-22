export default class GameScene extends Phaser.Scene {
    constructor() {
      super({ key: 'GameScene' });
      this.player = null;
      this.cursors = null;
      this.stars = null;
      this.score = 0;
      this.scoreText = null;
      this.spaceKey = null; // 添加空格键变量
    }
  
    create() {
      console.log('GameScene create');
  
      // 1. 创建背景
      this.add.image(400, 300, 'sky');
  
      // 2. 创建平台 (地面和空中)
      const platforms = this.physics.add.staticGroup();
      // 底部主平台使用宽平台
      platforms.create(400, 568, 'ground').setScale(3, 1).refreshBody();
      // 空中平台使用窄平台
      platforms.create(700, 400, 'platform');
      platforms.create(100, 300, 'platform');
      platforms.create(500, 200, 'platform');
  
      // 3. 创建玩家 (马里奥角色)
      this.player = this.physics.add.sprite(100, 450, 'dude');
      this.player.setBounce(0.2); // 设置弹跳系数
      this.player.setCollideWorldBounds(true); // 防止掉出世界边界
  
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
      this.stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
      });
      this.stars.children.iterate(child => {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)); // 随机弹跳
      });
  
      // 6. 创建炸弹组 (敌人/障碍物)
      this.bombs = this.physics.add.group({
        bounceY: 1, // 垂直弹跳系数
        bounceX: 1, // 水平弹跳系数
        collideWorldBounds: true // 防止掉出世界边界
      });
        // 生成一个炸弹
        const x = (this.player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
        const bomb = this.bombs.create(x, 150, 'bomb');
        bomb.setDisplaySize(67, 40); // 设置炸弹显示大小为67x40像素
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20); // 设置适中的移动速度
        bomb.setAngularVelocity(360); // 添加旋转效果
      // 7. 创建分数文本
      this.scoreText = this.add.text(16, 16, 'Score: 0', {
        fontSize: '32px',
        fill: '#000'
      });
  
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
      // 物理暂停
      this.physics.pause();
      // 玩家变成红色 (受伤效果)
      player.setTint(0xff0000);
      // 播放站立动画
      player.anims.play('turn');
      // 播放受伤音效
      this.sound.play('hitSound');
      // 游戏结束 (可以在这里跳转到GameOver场景)
      // this.scene.start('GameOverScene', { score: this.score });
    }
  }