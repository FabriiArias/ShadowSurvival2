import Phaser from "phaser";

export default class Shooter extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, player) {
    super(scene, x, y, "shooter_walk");

    this.scene = scene;
    this.player = player;

    // Stats
    this.health = 60;
    this.maxHealth = 60;
    this.speed = 120;
    this.damage = 20;

    // Disparo
    this.shootCooldown = 2000; // 2s entre disparos
    this.lastShootTime = 0;
    this.range = 400;

    // Escena
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.45);
    this.setCollideWorldBounds(true);
    this.play("shooter_walk", true);

    // Barra de vida
    this.healthBar = scene.add.graphics();
    this.healthBar.setDepth(100);
  }

  update(time, delta) {
    if (!this.active || !this.player.active) return;

    const distance = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);

    //  Rotación horizontal corregida
    this.flipX = this.player.x > this.x;
    this.setOrigin(0.5, 0.5);

    // Ajustar tamaño según animación
    if (this.anims.currentAnim && this.anims.currentAnim.key === "shooter_attack") {
      this.setScale(0.18);
    } else {
      this.setScale(0.35);
    }

    if (distance > this.range) {
      this.scene.physics.moveToObject(this, this.player, this.speed);
      if (this.anims.currentAnim.key !== "shooter_walk") this.play("shooter_walk", true);
    } else {
      this.setVelocity(0);
      if (time - this.lastShootTime > this.shootCooldown) {
        this.shoot(time);
      }
    }

    this.updateHealthBar();
  }

  shoot(time) {
    this.lastShootTime = time;
    this.setVelocity(0);
    this.play("shooter_attack", true);

    // sonido
    const shootSound = this.scene.sound.add("shooter_sounds");
      shootSound.play({ seek: 23.4, volume: 0.1 });

    this.scene.time.delayedCall(400, () => {
      if (!this || !this.active || !this.scene) return;
      this.fireBullet();
      this.play("shooter_walk", true);
    });
  }

  fireBullet() {
  if (!this.scene.enemyBullets) return;

  // Calcular ángulo hacia el jugador
  const angle = Phaser.Math.Angle.Between(
    this.x, 
    this.y, 
    this.player.x, 
    this.player.y
  );

  //  Offset para que la bala salga de la "boca" del arma
  const distanceFromCenter = 30; // Ajustá según el sprite
  const baseVerticalOffset = 0; // Ajustá si necesitás corrección vertical

  // Calcular posición rotada (igual que en Player)
  const rotatedOffsetX =
    Math.cos(angle) * distanceFromCenter -
    Math.sin(angle) * baseVerticalOffset;
  const rotatedOffsetY =
    Math.sin(angle) * distanceFromCenter +
    Math.cos(angle) * baseVerticalOffset;

  // Posición final de spawn
  const bulletX = this.x + rotatedOffsetX;
  const bulletY = this.y + rotatedOffsetY;

  // Crear bala
  const bullet = this.scene.enemyBullets.create(bulletX, bulletY, "enemy_bullet");
  
  if (!bullet) return;

  bullet.setActive(true);
  bullet.setVisible(true);
  bullet.setScale(0.3);
  bullet.setDepth(5);
  bullet.damage = this.damage;
  bullet.setRotation(angle); // Rotar la bala visualmente
  bullet.setRotation(angle + Math.PI);
  // Aplicar velocidad en la dirección correcta
  const velocity = this.scene.physics.velocityFromRotation(angle, 400);
  bullet.setVelocity(velocity.x, velocity.y);

  // Destruir después de 2 segundos
  this.scene.time.delayedCall(2000, () => {
    if (bullet && bullet.active) bullet.destroy();
  });

  // Sonido de disparo enemigo (opcional)
   //if (!this.scene.hudScene.getSFXMuted()) {
    //this.scene.sound.play("enemy_shoot", { volume: 0.2 });
  // }
}


  updateHealthBar() {
    if (!this.healthBar || !this.active) return;

    this.healthBar.clear();
    const barWidth = 40;
    const barHeight = 4;
    const x = this.x - barWidth / 2;
    const y = this.y - 30;

    this.healthBar.fillStyle(0xff0000);
    this.healthBar.fillRect(x, y, barWidth, barHeight);

    const healthWidth = (this.health / this.maxHealth) * barWidth;
    this.healthBar.fillStyle(0x00ff00);
    this.healthBar.fillRect(x, y, healthWidth, barHeight);
  }

  takeDamage(amount) {
    this.health -= amount;
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => this.clearTint());
    if (this.health <= 0) this.die();
  }

  die() {
    const deathSound = this.scene.sound.add("shooter_sounds");
      deathSound.play({ seek: 10, volume: 0.1 });
      this.scene.time.delayedCall(500, () => {
        try {
          deathSound.stop();
          deathSound.destroy();
        } catch (e) { /* ignore */ }
      });

    if (this.healthBar) this.healthBar.destroy();
    this.destroy();
  }
}
