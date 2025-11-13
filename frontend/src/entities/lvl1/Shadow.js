// src/entities/lvl1/Shadow.js
import Phaser from "phaser";
export default class Shadow extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, player) {
    super(scene, x, y, "shadow_run");
    
    this.scene = scene;
    this.player = player;

    // Stats
    this.health = 80;
    this.maxHealth = 80;
    this.speed = 120;
    this.damage = 15;
    this.lastAttackTime = 0;

    // Dash
    this.isDashing = false;
    this.dashSpeed = 400;
    this.dashCooldown = Phaser.Math.Between(2500, 3500);
    this.lastDashTime = 0;
    this.dashDuration = 600;

    // Rango máximo para decidir si puede intentar dash
    this.dashRange = 300; // ajusta este valor a lo que consideres "relativamente cerca"

    // Guardar timers para poder cancelarlos si hace falta
    this._dashWindupTimer = null;
    this._dashEndTimer = null;

    // Agregar a la escena
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(3);
    this.setCollideWorldBounds(true);
    this.play("shadow_run", true);
    this.setOrigin(0.5, 0.5);

    // Barra de vida
    this.healthBar = scene.add.graphics();
    this.healthBar.setDepth(100);
  }

  update(time, delta) {
    if (!this.active || !this.player.active) return;

    if (this.isDashing) return;

    // Mirar hacia el jugador (solo flip horizontal)
    this.flipX = this.player.x < this.x;

    // Distancia al jugador
    const distToPlayer = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.player.x,
      this.player.y
    );

    // Comprobar si toca hacer dash: solo si estamos dentro del rango permitido
    if (time - this.lastDashTime > this.dashCooldown && distToPlayer <= this.dashRange) {
      this.startDash(time);
      return;
    }
    
    // Movimiento normal
    this.scene.physics.moveToObject(this, this.player, this.speed);
    this.updateHealthBar();
  }
  
  startDash(time) {
    // Marcar intento de dash y bloquear movimiento normal durante el wind-up
    this.isDashing = true;
    this.lastDashTime = time;

    // DESACTIVAR colisión durante el wind-up para evitar golpear al player
    if (this.body) {
      // deshabilita el cuerpo para que no genere overlaps/collisions durante la animación
      this.body.enable = false;
      // además aseguramos checkCollision none por si acaso
      if (this.body.checkCollision) {
        this.body.checkCollision.none = true;
      }
    }

    this.setVelocity(0);
    this.play("shadow_attack", true);

    // Wind-up antes del dash: NO cancelar por distancia. Si el wind-up llega a completarse,
    // el dash se ejecutará independientemente de que el jugador se haya alejado.
    // Guardamos el timer para poder cancelarlo si el enemigo muere o se destruye
    this._dashWindupTimer = this.scene.time.delayedCall(1000, () => {
      // Verificar que siga vivo y la escena válida
      if (!this || !this.active || !this.scene || !this.scene.physics) {
        this._clearDashTimers();
        // Aseguramos que la colisión quede activada si algo fallo en el proceso
        this._ensureBodyEnabled();
        return;
      }

      // Antes de aplicar la velocidad, reactivar cuerpo para que choque durante el dash
      if (this.body) {
        this.body.enable = true;
        if (this.body.checkCollision) {
          this.body.checkCollision.none = false;
        }
      }

      // Ejecutar dash (no se cancela aunque el jugador esté fuera del rango ahora)
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y);
      const velocity = this.scene.physics.velocityFromRotation(angle, this.dashSpeed);
      this.setVelocity(velocity.x, velocity.y);

      this.scene.tweens.add({
        targets: this,
        alpha: 0.6,
        yoyo: true,
        repeat: 2,
        duration: 100,
      });

      // Reproducir sonido del dash (crear y destruir para evitar acumulación)
      const dashSound = this.scene.sound.add("shadow_attack");
      dashSound.play({ seek: 32, volume: 0.1 });
      this.scene.time.delayedCall(500, () => {
        try {
          dashSound.stop();
          dashSound.destroy();
        } catch (e) { /* ignore */ }
      });

      // Termina el dash después de dashDuration
      this._dashEndTimer = this.scene.time.delayedCall(this.dashDuration, () => {
        if (!this || !this.active || !this.scene) {
          this._clearDashTimers();
          return;
        }
        this.isDashing = false;
        this.setVelocity(0);
        this.play("shadow_run", true);
        this.dashCooldown = Phaser.Math.Between(2500, 3500);
        this._clearDashTimers();
      });
    });
  }

  // Helper para limpiar timers del dash
  _clearDashTimers() {
    try {
      if (this._dashWindupTimer) {
        this._dashWindupTimer.remove(false);
        this._dashWindupTimer = null;
      }
      if (this._dashEndTimer) {
        this._dashEndTimer.remove(false);
        this._dashEndTimer = null;
      }
    } catch (e) {
      // no crítico
    }
    // Aseguramos reactivar el cuerpo en cualquier caso (evita quedarse sin colisión)
    this._ensureBodyEnabled();
  }

  // Asegura que el body esté activado (o al menos que checkCollision no esté bloqueado)
  _ensureBodyEnabled() {
    try {
      if (this.body) {
        this.body.enable = true;
        if (this.body.checkCollision) {
          this.body.checkCollision.none = false;
        }
      }
    } catch (e) {
      // ignore
    }
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
    const deathSound = this.scene.sound.add("shadow_death");
      deathSound.play({ seek: 0.2, volume: 0.1 });
    // limpiar timers para que no ejecute dash después de morir
    this._clearDashTimers();

    if (this.healthBar) this.healthBar.destroy();
    this.destroy();
  }
}
 

