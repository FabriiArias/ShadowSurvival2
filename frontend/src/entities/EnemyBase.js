// src/entities/EnemyBase.js
import Phaser from "phaser";
/**
 * Clase base para todos los enemigos
 * Los enemigos hacen daño al jugador por contacto
 */
export default class EnemyBase extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, player) {
    super(scene, x, y, texture);

    this.scene = scene;
    this.player = player;

    /// stats default
    this.health = 50;
    this.maxHealth = 50;
    this.speed = 100;
    this.damage = 10; // Daño por contacto
    this.contactDamageCooldown = 1000; // 1 segundo entre ataques por contacto
    this.lastContactTime = 0;

    // Estados
    this.isDead = false;

    // escema u fisica
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setOrigin(0.5);
    this.setScale(0.3);

    // barra de vida
    this.createHealthBar();
  }

  /**
   * Crea una barra de vida sobre el enemigo
   */
  createHealthBar() {
    this.healthBar = this.scene.add.graphics();
    this.healthBar.setDepth(100);
    this.updateHealthBar();
  }

  /**
   * Actualiza visualmente la barra de vida
   */
  updateHealthBar() {
    if (!this.healthBar) return;

    this.healthBar.clear();

    const barWidth = 40;
    const barHeight = 4;
    const x = this.x - barWidth / 2;
    const y = this.y - 30;

    // Fondo rojo
    this.healthBar.fillStyle(0xff0000);
    this.healthBar.fillRect(x, y, barWidth, barHeight);

    // Vida actual (verde)
    const healthWidth = (this.health / this.maxHealth) * barWidth;
    this.healthBar.fillStyle(0x00ff00);
    this.healthBar.fillRect(x, y, healthWidth, barHeight);
  }

  /**
   * Update principal - se llama cada frame
   */
  update(time, delta) {
    if (this.isDead || !this.player.active) return;

    // Actualizar barra de vida
    this.updateHealthBar();

    // Perseguir al jugador
    this.chase();

    // Rotar hacia el jugador
    this.rotateTowardsPlayer();
  }

  /**
   * Perseguir al jugador
   */
  chase() {
    if (!this.player.active) return;
    this.scene.physics.moveToObject(this, this.player, this.speed);
  }

  /**
   * Daño por contacto con el jugador
   * Esta función se llama desde la escena cuando hay colisión
   */
  onContactWithPlayer(time) {
    // Cooldown entre ataques
    if (time - this.lastContactTime >= this.contactDamageCooldown) {
      this.lastContactTime = time;
      
      if (this.player.takeDamage) {
        this.player.takeDamage(this.damage);
      }
    }
  }

  /**
   * Rotar el sprite hacia el jugador
   */
  rotateTowardsPlayer() {
    const angle = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      this.player.x,
      this.player.y
    );
    this.setRotation(angle);
  }

  /**
   * Recibir daño
   */
  takeDamage(amount) {
    if (this.isDead) return;

    this.health -= amount;
    this.updateHealthBar();

    // Efecto visual de daño
    this.flashRed();

    if (this.health <= 0) {
      this.die();
    }
  }

  /**
   * Efecto visual al recibir daño
   */
  flashRed() {
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });
  }

  /**
   * Morir
   */
  die() {
    this.isDead = true;
    this.setVelocity(0);

    // Destruir barra de vida
    if (this.healthBar) {
      this.healthBar.destroy();
    }

    // Notificar a la escena
    if (this.scene.onEnemyKilled) {
      this.scene.onEnemyKilled(this);
    }

    // Animación de muerte
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0,
      duration: 300,
      onComplete: () => {
        this.destroy();
      },
    });
  }

  /**
   * Cleanup al destruir
   */
  destroy(fromScene) {
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    super.destroy(fromScene);
  }
}