/** @type {Object} 游戏配置参数 */
const CONFIG = {
  PLAYER: {
    SPEED: 160,
    JUMP_SPEED: 660,
    INITIAL_HEALTH: 3,
    INVINCIBLE_TIME: 1000
  },
  BULLET: {
    SPEED: 400,
    FIRE_RATE: 500,
    OFFSET_X: 25,
    OFFSET_Y: 15
  },
  ENEMY: {
    BASE_SPEED: 200,
    BASE_SIZE: 67,
    BASE_HEALTH: 1,
    MAX_LEVEL: 20,
    LEVEL_SCALE: 5, // 每多少级提升一次属性
    SPEED_INCREASE: 0.2, // 每次提升速度的比例
    SIZE_INCREASE: 0.2, // 每次提升大小的比例
    DIRECTION_CHANGE_MIN: 2000,
    DIRECTION_CHANGE_MAX: 4000
  },
  WORLD: {
    WIDTH: 2400,
    HEIGHT: 600,
    GRAVITY: 300
  },
  SCORE: {
    STAR_POINTS: 10,
    LEVEL_UP_SCORE: 100
  }
};

/** 
 * @class GameScene
 * @extends Phaser.Scene
 * @description 主游戏场景
 */
export default class GameScene extends Phaser.Scene {
    constructor() {
      super({ key: 'GameScene' });
      
      /** @type {Phaser.GameObjects.Sprite} 玩家角色 */
      this.player = null;
      /** @type {Phaser.Types.Input.Keyboard.CursorKeys} 方向键 */
      this.cursors = null;
      /** @type {Phaser.Physics.Arcade.Group} 星星组 */
      this.stars = null;
      /** @type {number} 得分 */
      this.score = 0;
      /** @type {Phaser.GameObjects.Text} 得分文本 */
      this.scoreText = null;
      /** @type {number} 生命值 */
      this.health = CONFIG.PLAYER.INITIAL_HEALTH;
      /** @type {Phaser.GameObjects.Text} 生命值文本 */
      this.healthText = null;
      /** @type {Phaser.Input.Keyboard.Key} 跳跃键 */
      this.spaceKey = null;
      /** @type {boolean} 无敌状态 */
      this.isInvincible = false;
      /** @type {boolean} 游戏结束标志 */
      this.gameOver = false;
      /** @type {number} 当前等级 */
      this.level = 1;
      /** @type {Phaser.GameObjects.Text} 等级文本 */
      this.levelText = null;
      /** @type {Phaser.Physics.Arcade.Group} 加血道具组 */
      this.healthItems = null;
      /** @type {Phaser.Physics.Arcade.Group} 子弹组 */
      this.bullets = null;
      /** @type {Phaser.Input.Keyboard.Key} 射击键 */
      this.shootKey = null;
      /** @type {number} 上次射击时间 */
      this.lastShootTime = 0;
      /** @type {Phaser.GameObjects.TileSprite} 背景 */
      this.background = null;
      /** @type {Phaser.GameObjects.Particles.ParticleEmitterManager} 粒子管理器 */
      this.particles = null;
      /** @type {Object} 对象池 */
      this.objectPools = {
        bullets: [],
        enemies: []
      };
      /** @type {Phaser.GameObjects.Text} 对象池信息文本 */
      this.poolInfoText = null;
      this.lastDirection = 1; // 记录玩家最后朝向（1为右，-1为左）
    }
  
    create() {
      console.log('GameScene create');
      
      // 重置所有游戏状态
      this.score = 0;
      this.health = 3;
      this.isInvincible = false;
      this.gameOver = false;
      this.level = 1;
  
      // 1. 创建背景
      this.background = this.add.tileSprite(0, 0, CONFIG.WORLD.WIDTH, CONFIG.WORLD.HEIGHT, 'sky')
        .setOrigin(0, 0)
        .setScrollFactor(0);

      // 创建爆炸粒子效果
      this.explosionEmitter = this.add.particles(0, 0, 'star', {
        speed: { min: -200, max: 200 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        lifespan: 800,
        blendMode: 'ADD',
        active: false
      });
      
      // 创建收集粒子效果
      this.collectEmitter = this.add.particles(0, 0, 'star', {
        speed: 100,
        scale: { start: 1, end: 0 },
        blendMode: 'ADD',
        lifespan: 500,
        active: false
      });
      
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
      this.player.setBounce(0.2); // 减小弹跳系数
      this.player.setCollideWorldBounds(true); // 防止掉出世界边界
      // 设置相机跟随玩家
      this.cameras.main.setBounds(0, 0, 2400, 600);
      this.cameras.main.startFollow(this.player);
      this.physics.world.setBounds(0, 0, 2400, 600); // 设置物理世界边界
  
      // 4. 创建动画 (使用精灵表)
      // 创建子弹动画
      this.anims.create({
        key: 'bullet',
        frames: this.anims.generateFrameNumbers('bullet', { start: 0, end: 8 }),
        frameRate: 10,
        repeat: -1
      });

      // 创建玩家动画
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
        const star = this.stars.create(12 + i * 70, 0, 'star')
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
      const bomb1 = this.createBomb(Phaser.Math.Between(0, 800), 150, 1); // 场景1炸弹
      const bomb2 = this.createBomb(Phaser.Math.Between(800, 1600), 150, 1); // 场景2炸弹
      const bomb3 = this.createBomb(Phaser.Math.Between(1600, 2400), 150, 1); // 场景3炸弹
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
      // 等级文本（固定在相机视图）
      this.levelText = this.add.text(16, 84, 'Level: '+this.level, {
        fontSize: '32px',
        fill: '#000'
      }).setScrollFactor(0);
      
      // 对象池信息文本（固定在相机视图）
      this.poolInfoText = this.add.text(16, 118, 'Bullets Pool: 0,Bombs Pool: 0', {
        fontSize: '24px',
        fill: '#008800'
      }).setScrollFactor(0);
      // 创建加血道具组
      this.healthItems = this.physics.add.group();

      // 创建子弹组，禁用重力
      this.bullets = this.physics.add.group({
        allowGravity: false,
        bounceX: 0,
        bounceY: 0
      });

      // 8. 设置物理碰撞
      // 玩家与平台碰撞
      this.physics.add.collider(this.player, platforms);
      // 星星与平台碰撞 (防止星星掉下去)
      this.physics.add.collider(this.stars, platforms);
      // 炸弹与平台碰撞
      this.physics.add.collider(this.bombs, platforms);
      // 加血道具与平台碰撞
      this.physics.add.collider(this.healthItems, platforms);
      // 玩家与星星重叠 (收集)
      this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
      // 玩家与炸弹碰撞 (游戏结束/受伤)
      this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);
      // 玩家与加血道具重叠 (加血)
      this.physics.add.overlap(this.player, this.healthItems, this.collectHealth, null, this);
      // 子弹与炸弹碰撞
      this.physics.add.overlap(this.bullets, this.bombs, this.hitEnemy, null, this);
  
      // 9. 获取键盘输入
      this.cursors = this.input.keyboard.createCursorKeys();
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE); // 添加空格键
      this.shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A); // 添加射击键
    }
  
    /**
     * 动态调整游戏难度
     */
    adjustDifficulty() {
      // 根据玩家状态调整难度
      const healthRatio = this.health / CONFIG.PLAYER.INITIAL_HEALTH;
      const difficultyMultiplier = Math.max(0.8, healthRatio); // 血量越低，难度越低
      
      // 计算当前等级的属性提升
      const levelTier = Math.floor((this.level - 1) / CONFIG.ENEMY.LEVEL_SCALE);
      const speedIncrease = 1 + (levelTier * CONFIG.ENEMY.SPEED_INCREASE * difficultyMultiplier);
      const sizeIncrease = 1 + (levelTier * CONFIG.ENEMY.SIZE_INCREASE);
      
      return { speedIncrease, sizeIncrease };
    }

    /**
     * 清理离屏对象
     */
    cleanupOffscreenObjects() {
      const camera = this.cameras.main;
      const extraMargin = 100; // 额外边距

      // 清理离屏子弹
      this.bullets.getChildren().forEach(bullet => {
        if (bullet.active && 
            (bullet.x < camera.scrollX - extraMargin || 
             bullet.x > camera.scrollX + camera.width + extraMargin)) {
          this.returnToPool(bullet); // 使用对象池回收离屏子弹
        }
      });

      // 清理离屏敌人
      this.bombs.getChildren().forEach(enemy => {
        if (enemy.active && 
            (enemy.x < camera.scrollX - extraMargin || 
             enemy.x > camera.scrollX + camera.width + extraMargin)) {
          this.returnToPool(enemy); // 使用对象池回收离屏敌人
        }
      });
    }
    
    /**
     * 将对象返回到对象池
     * @param {Phaser.GameObjects.GameObject} obj 要返回到对象池的对象
     */
    returnToPool(obj) {
       // 根据对象类型将其放入相应的对象池
      if (obj.texture && obj.texture.key === 'bullet') {
        // 从物理组中移除子弹
        this.bullets.remove(obj, false, false); // 从组中移除但不销毁
        obj.setActive(false).setVisible(false);
        // 检查对象是否已经在对象池中，避免重复添加
        if (!this.objectPools.bullets.includes(obj)) {
          this.objectPools.bullets.push(obj);
        }
        console.log(`子弹回收 - 对象池大小: ${this.objectPools.bullets.length}, 活跃子弹: ${this.bullets.countActive(true)}`);
      } else if (obj.texture && obj.texture.key === 'bomb') {
        // 从物理组中移除敌人
        this.bombs.remove(obj, false, false); // 从组中移除但不销毁
        obj.setActive(false).setVisible(false);
        // 检查对象是否已经在对象池中，避免重复添加
        if (!this.objectPools.enemies.includes(obj)) {
          this.objectPools.enemies.push(obj);
        }
      } else {
        // 如果不是可池化对象，则直接销毁
        obj.destroy();
      }
    }
    
    /**
     * 创建炸弹的方法
     * @param {number} x X坐标
     * @param {number} y Y坐标
     * @param {number} initialHealth 初始血量
     * @returns {Phaser.Physics.Arcade.Sprite} 创建的炸弹
     */
    createBomb(x, y, initialHealth = null) {
      let bomb;
      
      // 尝试从对象池中获取炸弹
      if (this.objectPools.enemies.length > 0) {
        bomb = this.objectPools.enemies.pop();
        
        // 验证对象有效性
        if (bomb && bomb.scene) {
          bomb.setActive(true).setVisible(true);
          bomb.x = x;
          bomb.y = y;
          
          // 确保有物理体
          if (!bomb.body) {
            this.physics.add.existing(bomb);
          } else {
            bomb.body.enable = true;
            bomb.body.reset(x, y);
          }
          
          this.bombs.add(bomb);
        } else {
          // 无效对象，创建新的
          bomb = null;
        }
      }
      
      // 创建新炸弹
      if (!bomb) {
        bomb = this.bombs.create(x, y, 'bomb');
        bomb.setCollideWorldBounds(true);
      }
      
      // 确保纹理正确
      if (!bomb.texture || bomb.texture.key !== 'bomb') {
        bomb.setTexture('bomb');
      }
      
      // 设置炸弹大小
      const baseSize = 67;
      const sizeMultiplier = 1 + Math.floor((this.level - 1) / 5) * 0.2;
      bomb.setDisplaySize(baseSize * sizeMultiplier, 40 * sizeMultiplier);
      
      // 设置炸弹血量
      bomb.health = initialHealth !== null ? initialHealth : (1 + Math.floor((this.level - 1) / 5));
      
      // 设置物理属性
      bomb.setBounce(1, 1);
      
      // 设置速度
      const baseSpeed = 200;
      const speedMultiplier = 1 + Math.floor((this.level - 1) / 5) * 0.2;
      const randomSpeed = Phaser.Math.Between(-baseSpeed * speedMultiplier, baseSpeed * speedMultiplier);
      bomb.setVelocity(randomSpeed, 20);
      bomb.setAngularVelocity(360);
      
      // 高级行为
      if (this.level > 5) {
        this.time.addEvent({
          delay: Phaser.Math.Between(2000, 4000),
          callback: () => {
            if (bomb.active) {
              bomb.setVelocity(
                Phaser.Math.Between(-baseSpeed * speedMultiplier, baseSpeed * speedMultiplier),
                bomb.body.velocity.y
              );
            }
          },
          loop: true
        });
      }
      
      // 调试信息
      console.log(`炸弹创建: ${bomb.texture.key}, 位置: (${x}, ${y}), 血量: ${bomb.health}`);
      
      return bomb;
    }

    /**
     * 场景关闭时清理资源
     */
    shutdown() {
      // 清理所有对象池
      Object.values(this.objectPools).forEach(pool => {
        pool.forEach(obj => {
          if (obj.destroy) obj.destroy();
        });
        pool.length = 0;
      });

      // 清理粒子发射器
      if (this.particles) {
        this.particles.destroy();
      }

      // 停止所有声音
      this.sound.stopAll();
    }

    /**
     * 游戏主循环更新
     */
    update() {
      // 如果游戏结束，不处理更新
      if (this.gameOver) return;

      // 更新背景滚动
      this.background.tilePositionX = this.cameras.main.scrollX * 0.5;

      // 定期清理离屏对象
      this.cleanupOffscreenObjects();

      // 键盘控制玩家移动
      if (this.cursors.left.isDown) {
        this.player.setVelocityX(-160);
        this.player.anims.play('left', true);
        this.lastDirection = -1;
      } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(160);
        this.player.anims.play('right', true);
        this.lastDirection = 1;
      } else {
        this.player.setVelocityX(0);
        this.player.anims.play('turn');
      }
  
      // 跳跃 (按空格键且玩家接触地面)
      if (this.spaceKey.isDown && this.player.body.touching.down) {
        this.player.setVelocityY(-660); // 调整向上速度
        this.sound.play('jumpSound'); // 播放跳跃音效
      }

      // 确保炸弹不会掉到底部平台下方
      this.bombs.children.iterate(bomb => {
        if (bomb && bomb.y >= 568) {
          bomb.setVelocityY(-300); // 如果炸弹触底，给一个向上的速度
        }
      });

      // 处理射击
      if (this.shootKey.isDown && this.time.now > this.lastShootTime + 500) { // 限制射击频率为0.5秒一次
        this.shoot();
        this.lastShootTime = this.time.now;
      }

      // 清理超出世界边界的子弹
      this.bullets.children.iterate(bullet => {
        if (bullet && (bullet.x < 0 || bullet.x > 2400)) {
          this.returnToPool(bullet); // 使用对象池回收离屏子弹
        }
      });
      
      // 更新对象池信息文本
      this.poolInfoText.setText(`Bullets Pool: ${this.objectPools.bullets.length} | Active: ${this.bullets.countActive(true)}, Bombs Pool: ${this.objectPools.enemies.length} | Active: ${this.bombs.countActive(true)}`);
    }
  
    /**
     * 收集星星
     * @param {Phaser.GameObjects.Sprite} player 玩家精灵
     * @param {Phaser.GameObjects.Sprite} star 星星精灵
     */
    collectStar(player, star) {
      star.disableBody(true, true);
      this.score += CONFIG.SCORE.STAR_POINTS;
      this.scoreText.setText('Score: ' + this.score);
      
      // 播放收集音效和粒子效果
      this.sound.play('collectSound');
      this.collectEmitter.setPosition(star.x, star.y);
      this.collectEmitter.start();
      this.time.delayedCall(500, () => {
        this.collectEmitter.stop();
      });
  
      // 每收集10颗星星提升一级
      if (this.score % CONFIG.SCORE.LEVEL_UP_SCORE === 0 && this.score > 0) {
        // 限制最大难度等级
        if (this.level < CONFIG.ENEMY.MAX_LEVEL) {
          this.level++;
          this.levelText.setText('Level: ' + this.level);
          
          // 动态难度调整
          this.adjustDifficulty();
        }

        // 在随机平台上方生成加血道具
        const platforms = this.children.list.filter(child => child.texture && (child.texture.key === 'ground' || child.texture.key === 'platform'));
        const randomPlatform = Phaser.Utils.Array.GetRandom(platforms);
        const healthItem = this.healthItems.create(randomPlatform.x, randomPlatform.y - 70, 'health');
        healthItem.setBounceY(0.3);
        healthItem.setCollideWorldBounds(true);

        // 在随机位置生成新的炸弹
        const x = Phaser.Math.Between(0, 2400);
        
        // 使用封装的createBomb方法创建炸弹
        const bomb = this.createBomb(x, 150);
        
        console.log(`新敌人生成 - 对象池剩余: ${this.objectPools.enemies.length}, 活跃敌人: ${this.bombs.countActive(true)}`);
      }

      // 如果所有星星都被收集了
      if (this.stars.countActive(true) === 0) {
        // 重新激活所有星星 (重置位置)
        this.stars.children.iterate(child => {
          child.enableBody(true, child.x, 0, true, true);
        });
  
  
      }
    }
  
    collectHealth(player, healthItem) {
      healthItem.disableBody(true, true); // 禁用并隐藏加血道具
      this.health++; // 增加生命值
      this.healthText.setText('Health: ' + this.health); // 更新文本
      this.sound.play('collectSound'); // 播放收集音效
    }

    shoot() {
      // 使用记录的最后朝向
      const direction = this.lastDirection;
      
      let bullet;
      
      // 尝试从对象池中获取子弹
      if (this.objectPools.bullets.length > 0) {
        // 从对象池中取出一个子弹
        bullet = this.objectPools.bullets.pop();
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.x = this.player.x + (direction * 25);
        bullet.y = this.player.y - 15;
        this.bullets.add(bullet); // 将子弹添加回物理组
      } else {
        // 如果对象池为空，创建新的子弹
        bullet = this.bullets.create(this.player.x + (direction * 25), this.player.y - 15, 'bullet');
      }
      
      bullet.setVelocityX(400 * direction); // 子弹速度
      bullet.setFlipX(direction === -1); // 子弹朝向
      
      bullet.anims.play('bullet', true);
      this.sound.play('shotSound');
      
      // 调试信息
      console.log(`子弹发射 - 对象池剩余: ${this.objectPools.bullets.length}, 活跃子弹: ${this.bullets.countActive(true)}`);
    }

    hitEnemy(bullet, enemy) {
      // 确保敌人有血量属性
      if (typeof enemy.health === 'undefined') {
        enemy.health = 1;
      }

      this.returnToPool(bullet); // 回收子弹到对象池
      enemy.health--; // 减少敌人血量
      
      // 播放音效
      this.sound.play('enemyHitSound');

      // 受击闪烁效果
      enemy.setTint(0xff0000);
      this.time.delayedCall(100, () => {
        if (enemy.active) {
          enemy.clearTint();
        }
      });

      if (enemy.health <= 0) {
        // 播放爆炸粒子效果
        this.explosionEmitter.setPosition(enemy.x, enemy.y);
        this.explosionEmitter.start();
        this.time.delayedCall(800, () => {
          this.explosionEmitter.stop();
        });
        
        // 使用对象池回收敌人而不是直接销毁
        this.returnToPool(enemy);
        
        // 增加得分
        this.score += 20;
        this.scoreText.setText('Score: ' + this.score);
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