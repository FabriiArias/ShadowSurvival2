// src/entities/Bat.js
import Phaser from "phaser";
export default class Eyeball extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, player) {
    super(scene, x, y, "eyeball", 1); // Empezar en el frame 1

    this.scene = scene;
    this.player = player;

    // Stats
    this.health = 80;
    this.maxHealth = 80;
    this.speed = 80;
    this.damage = 40;
    this.lastAttackTime = 0;

    // Agregar a la escena
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.25);
    this.setCollideWorldBounds(true);

    // REPRODUCIR ANIMACIÓN
    this.play("eyeball_move", true);

    // Barra de vida
    this.healthBar = scene.add.graphics();
    this.healthBar.setDepth(100);
  }

  update(time, delta) {
    if (!this.active || !this.player.active) return;

    // Perseguir al jugador
    this.scene.physics.moveToObject(this, this.player, this.speed);

    // Rotar hacia el jugador
    const angle = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      this.player.x,
      this.player.y
    );
    //this.setRotation(angle);
    this.flipX = this.player.x > this.x;
    // Actualizar barra de vida
    this.updateHealthBar();

    this.setScale(1.4);
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

    // Efecto visual
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.active) this.clearTint();
    });

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    if (this.healthBar) {
      this.healthBar.destroy();
    }

    const sound = this.scene.sound.add("eyeball_die");
    sound.play({ seek: 2.5, volume: 1 });

    this.scene.time.delayedCall(700, () => {
      sound.stop();
    });

    this.destroy();
  }
}
