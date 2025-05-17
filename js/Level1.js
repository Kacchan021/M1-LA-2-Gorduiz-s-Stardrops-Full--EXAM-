class MainMenu extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }
  preload() {
    this.load.audio('menu_bgm', 'assets/audio/menu_bgm.mp3');
  }
  create() {
    // play menu music (looped)
    this.menuMusic = this.sound.add('menu_bgm', { volume: 0.5, loop: true });
    this.menuMusic.play();
    // Title
    this.add.text(400, 150, 'My Stardrops Adventure', {
      fontSize: '48px', fill: '#ffffff'
    }).setOrigin(0.5);

    // Start button
    this.add.text(400, 300, '▶ Start Game', {
      fontSize: '32px', fill: '#00ff00'
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerup', () => {
      this.scene.start('MainScene', { level: 1 });
    });

    // (optional) Mute button, credits, etc.
  }
}


class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }
    init(data) {
        this.level           = data.level || 1;
        this.starsRequired   = 20 + (this.level - 1) * 5;  // 20, 25, 30
        this.starsCollected  = 0;
    }
    preload() {
        // load your custom assets
        this.load.image('bg1', 'assets/images/sky.png');
        this.load.image('bg2', 'assets/images/sky2.png');
        this.load.image('bg3', 'assets/images/sky3.png');
        this.load.image('background', 'assets/images/sky.png');
        this.load.image('platform1', 'assets/images/platform.png');
        this.load.image('platform2', 'assets/images/platform2.png');
        this.load.image('platform3', 'assets/images/platform3.png');
        this.load.image('star',       'assets/images/stars.png');
        this.load.image('bomb',       'assets/images/bombs.png');
        this.load.spritesheet('player',
            'assets/spritesheets/player_spritesheet.png',
            { frameWidth: 32, frameHeight: 48 }
        );
    }

    create() {

        // background
        const bgKey = 'bg' + this.level;   // 'bg1', 'bg2' or 'bg3'
        this.add.image(400, 300, bgKey);
        
        // platforms (static)
        this.platforms = this.physics.add.staticGroup();
        this.platforms.refresh();

        //player
        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        // inputs
        this.cursors = this.input.keyboard.createCursorKeys();
        // groups
        this.stars = this.physics.add.group();
        this.bombs = this.physics.add.group();
        for (let i = 0; i < 12; i++) this.spawnStar();

        if (this.level === 1) {
            this.platforms.create(400, 568, 'platform1').setScale(2).refreshBody();
            this.platforms.create(600, 400, 'platform1').refreshBody();
            this.platforms.create( 50, 250, 'platform1').refreshBody();
            this.platforms.create(700, 220, 'platform1').refreshBody();
        }
        else if (this.level === 2) {
            this.platforms.create(400, 568, 'platform2').setScale(2).refreshBody();
            this.platforms.create(200, 450, 'platform2').refreshBody();
            this.platforms.create(600, 350, 'platform2').refreshBody();
            this.platforms.create(350, 200, 'platform2').refreshBody();
            this.platforms.create(700, 300, 'platform2').refreshBody();
        }
        else if (this.level === 3) {
            this.platforms.create(400, 568, 'platform3').setScale(2).refreshBody();
            this.platforms.create(100, 500, 'platform3').refreshBody();
            this.platforms.create(550, 350, 'platform3').refreshBody();
            this.platforms.create(300, 250, 'platform3').refreshBody();
            this.platforms.create(650, 150, 'platform3').refreshBody();
        }

        // now wire collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.stars,  this.platforms);
        this.physics.add.collider(this.bombs,  this.platforms);
        // catch‐all floor at the bottom so stars/bombs never drop off-screen

/*
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.collider(this.bombs, this.platforms);
        */
        


        // player animations
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 10, repeat: -1
        });
        this.anims.create({
            key: 'turn',
            frames: [ { key: 'player', frame: 4 } ],
            frameRate: 20
        });
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
            frameRate: 10, repeat: -1
        });

        



        // initial stars
        for (let i = 0; i < 12; i++) {
            this.spawnStar();
        }

        // UI & state
        this.starsCollected = 0;
        this.gameOver = false;
        this.starsText = this.add
            .text(
                this.scale.width  - 16,   // place 16px from the right edge
                16,                        // 16px from the top
                'Stars Collected: 0/${this.starsRequired}',
                { fontSize: '24px', fill: '#ffffff' }
            )
            .setOrigin(1, 0);             // origin at top-right of the text


        // collisions & overlaps
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.collider(this.bombs, this.platforms);
        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
        this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);


    }

    update() {
        if (this.gameOver) { return; }

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.anims.play('left', true);
        }
        else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.player.anims.play('right', true);
        }
        else {
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
        }

        if (this.cursors.up.isDown && this.player.body.blocked.down) {
            this.player.setVelocityY(-330);
        }

    }

    collectStar(player, star) {
        star.disableBody(true, true);

        this.starsCollected++;
        this.starsText.setText(`Stars Collected: ${this.starsCollected}/${this.starsRequired}`);

        // cycle through the 7 colors:
        const rainbow = [
        0xff0000, // red
        0xff7f00, // orange
        0xffff00, // yellow
        0x00ff00, // green
        0x0000ff, // blue
        0x4b0082, // indigo
        0x9400d3  // violet
        ];
        // apply the tint based on how many stars you’ve collected:
        this.player.setTint(rainbow[(this.starsCollected - 1) % rainbow.length]);

        this.spawnStar();

        if (this.starsCollected % 10 === 0) {
        this.player.setScale(this.player.scaleX * 1.1);
        this.spawnBomb();

        
            if (this.starsCollected >= this.starsRequired) {
      if (this.level < 3) {
        // go to the next “level” (same scene, higher data.level)
        this.scene.start('MainScene', { level: this.level + 1 });
      } else {
        // Level 3 “win”!
        this.physics.pause();
        this.gameOver = true;
        this.add
          .text(400, 300, '🎉 You Win! 🎉', {
            fontSize: '48px',
            fill: '#0f0',
          })
          .setOrigin(0.5);
      }

    }}
    if (this.level === 3 && this.starsCollected >= this.starsRequired) {
        this.physics.pause();
        this.gameOver = true;

        // Show Win text
        this.add.text(400, 250, '🎉 You Win! 🎉', {
            fontSize: '48px', fill: '#0f0'
        }).setOrigin(0.5);

        // Return to Main Menu
        this.add.text(400, 350, '⏪ Main Menu', {
            fontSize: '32px', fill: '#ffffff'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => this.scene.start('MainMenu'));
        }
    }


    spawnStar() {
        const x = Phaser.Math.Between(0, this.scale.width);
        const star = this.stars.create(x, 0, 'star');
        star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        star.setCollideWorldBounds(true);
    }

    spawnBomb() {
        const x = Phaser.Math.Between(0, this.scale.width);
        const bomb = this.bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(
            Phaser.Math.Between(-200, 200),
            Phaser.Math.Between(50, 150)
        );
        bomb.allowGravity = false;
    }

    hitBomb(player, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    this.gameOver = true;

    // Game Over text
    this.add.text(400, 250, '💀 Game Over', {
        fontSize: '48px', fill: '#f00'
    }).setOrigin(0.5);

    // Retry Level
    this.add.text(400, 330, '🔄 Retry Level', {
        fontSize: '32px', fill: '#fff'
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerup', () => {
        this.scene.start('MainScene', { level: this.level });
    });

    // Return to Main Menu
    this.add.text(400, 390, '⏪ Main Menu', {
        fontSize: '32px', fill: '#fff'
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerup', () => this.scene.start('MainMenu'));
    }
}

// game config
const config = {
    type: Phaser.AUTO,
    width:  800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 300 }, debug: false }
    },
    scene: [ MainMenu, MainScene ]
};

// launch!
window.addEventListener('load', () => {
    new Phaser.Game(config);
});
