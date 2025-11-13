// src/entities/Player.js
import Phaser from "phaser";
/**
 * Clase del Jugador con stats, vida, y métodos de combate
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player_walk', 0);

    this.scene = scene;

    // ========================================
    // STATS DEL JUGADOR
    // ========================================
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.speed = 200;
    this.damage = 25; // Daño por bala

    // ========================================
    // SISTEMA DE BALAS
    // ========================================
    this.maxBullets = 10;
    this.currentBullets = this.maxBullets;
    this.isReloading = false;

    // ========================================
    // ESTADOS
    // ========================================
    this.isShooting = false;
    this.isDead = false;
    this.invulnerable = false; // Para evitar spam de daño

    // ========================================
    // AGREGAR A LA ESCENA
    // ========================================
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.4);
    this.setCollideWorldBounds(true);

    // ========================================
    // PUNTERO DEL MOUSE
    // ========================================
    this.pointer = null;
  }

  /**
   * Actualizar el jugador cada frame
   */
  update(wasd, pointer) {
    if (this.isDead) return;

    this.pointer = pointer;
    this.setVelocity(0);

    const moving = this.isMoving(wasd);

    // Movimiento
    this.handleMovement(wasd);

    // Animaciones
    this.handleAnimations(moving);

    // Rotación hacia el mouse
    this.rotateTowardsMouse();

    // Auto-reload si no tiene balas
    if (this.currentBullets <= 0 && !this.isReloading) {
      this.reload();
    }
  }

  /**
   * Manejar movimiento con WASD
   */
  handleMovement(wasd) {
    if (wasd.left.isDown) this.setVelocityX(-this.speed);
    if (wasd.right.isDown) this.setVelocityX(this.speed);
    if (wasd.up.isDown) this.setVelocityY(-this.speed);
    if (wasd.down.isDown) this.setVelocityY(this.speed);
  }

  /**
   * Verificar si se está moviendo
   */
  isMoving(wasd) {
    return (
      wasd.left.isDown ||
      wasd.right.isDown ||
      wasd.up.isDown ||
      wasd.down.isDown
    );
  }

  /**
   * Manejar animaciones
   */
  handleAnimations(moving) {
    if (moving && !this.isShooting && !this.isReloading) {
      this.play("walk", true);
    } else if (!moving && !this.isShooting && !this.isReloading) {
      this.anims.stop();
    }
  }

  /**
   * Rotar hacia el mouse
   */
  rotateTowardsMouse() {
    if (this.pointer) {
      const angle = Phaser.Math.Angle.Between(
        this.x,
        this.y,
        this.pointer.worldX,
        this.pointer.worldY
      );
      this.setRotation(angle);
    }
  }

  /**
   * Disparar una bala
   */
  shoot(pointer, bulletsGroup) {
    if (this.isShooting || this.isReloading || this.isDead) return;
    
    if (this.currentBullets <= 0) {
      this.reload();
      return null;
    }

    const angle = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      pointer.worldX,
      pointer.worldY
    );

    // Crear la bala
    const bullet = this.createBullet(angle, bulletsGroup);
    
    if (bullet) {
      this.currentBullets--;
      this.playShootAnimation();
      
      // Sonido de disparo
      this.scene.sound.play("hand_gun_shoot");
    }

    return bullet;
  }

  /**
   * Crear y configurar una bala
   */
  createBullet(angle, bulletsGroup) {
    const distanceFromCenter = 50;
    const baseVerticalOffset = 13;

    const rotatedOffsetX =
      Math.cos(angle) * distanceFromCenter -
      Math.sin(angle) * baseVerticalOffset;
    const rotatedOffsetY =
      Math.sin(angle) * distanceFromCenter +
      Math.cos(angle) * baseVerticalOffset;

    const bulletX = this.x + rotatedOffsetX;
    const bulletY = this.y + rotatedOffsetY;

    const bullet = bulletsGroup.get(bulletX, bulletY, "bullet");

    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.body.reset(bulletX, bulletY);
      bullet.setRotation(angle);
      bullet.setOrigin(0.5, 0.5);

      const velocity = this.scene.physics.velocityFromRotation(angle, 600);
      bullet.setVelocity(velocity.x, velocity.y);

      // Marcar el daño en la bala
      bullet.damage = this.damage;
    }

    return bullet;
  }

  /**
   * Reproducir animación de disparo
   */
  playShootAnimation() {
    this.isShooting = true;

    this.play("shoot", true).once("animationcomplete", () => {
      this.isShooting = false;
      if (this.body.velocity.x !== 0 || this.body.velocity.y !== 0) {
        this.play("walk", true);
      }
    });
  }

  /**
   * Recargar arma
   */
  reload() {
    if (this.isReloading) return;

    this.isReloading = true;

    // Sonidos de recarga
    this.scene.sound.play("hand_gun_reload", {
      volume: 0.5,
      seek: 0.9,
    });

    this.scene.sound.play("hand_gun_reload", {
      volume: 0.5,
      seek: 0.5,
    });

    // Animación de recarga
    this.play("reload", true);

    this.once("animationcomplete", () => {
      this.scene.time.delayedCall(200, () => {
        this.currentBullets = this.maxBullets;
        this.isReloading = false;
      });
    });
  }

  /**
   * Recibir daño
   */
  takeDamage(amount) {
    if (this.isDead || this.invulnerable) return;

    this.health -= amount;

    // Efecto visual
    this.flashRed();

    // Hacer invulnerable temporalmente (para evitar spam de daño)
    this.invulnerable = true;
    this.scene.time.delayedCall(500, () => {
      this.invulnerable = false;
    });

    // Actualizar UI
    if (this.scene.updatePlayerHealthBar) {
      this.scene.updatePlayerHealthBar();
    }

    if (this.health <= 0) {
      this.die();
    }
  }

  /**
   * Efecto visual de daño
   */
  flashRed() {
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });
  }

  /**
   * Curar al jugador
   */
  heal(amount) {
    this.health += amount;
    if (this.health > this.maxHealth) {
      this.health = this.maxHealth;
    }

    if (this.scene.updatePlayerHealthBar) {
      this.scene.updatePlayerHealthBar();
    }
  }

  /**
   * Morir
   */
  die() {
    if (this.isDead) return;

    this.isDead = true;
    this.setVelocity(0);
    this.setTint(0x666666);

    // Notificar a la escena
    if (this.scene.onPlayerDeath) {
      this.scene.onPlayerDeath();
    }
  }
}