// PlayerController.js
import Phaser from "phaser";

export default class PlayerController {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    this.isShooting = false;
    this.isReloading = false;
    this.enabled = true;

    this.maxBullets = 10;
    this.currentBullets = this.maxBullets;

    this._onPointerDown = null;
    this.setupControls();
  }

  setupControls() {
    this.wasd = this.scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this._onPointerDown = (pointer) => {
      if (!this.enabled) return;
      if (!pointer.leftButtonDown()) return;
      const bulletData = this.shoot(pointer);
      if (bulletData) {
        this.scene.events.emit("playerShoot", bulletData);
      }
    };
    this.scene.input.on("pointerdown", this._onPointerDown);

    this.rKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  update() {
    if (!this.enabled) {
      this.player.setVelocity(0);
      return {};
    }

    const speed = 200;
    this.player.setVelocity(0);

    if (this.wasd.left.isDown) this.player.setVelocityX(-speed);
    if (this.wasd.right.isDown) this.player.setVelocityX(speed);
    if (this.wasd.up.isDown) this.player.setVelocityY(-speed);
    if (this.wasd.down.isDown) this.player.setVelocityY(speed);

    const moving =
      this.wasd.left.isDown ||
      this.wasd.right.isDown ||
      this.wasd.up.isDown ||
      this.wasd.down.isDown;

    if (moving && !this.isShooting && !this.isReloading) {
      this.player.play("walk", true);
    } else if (!moving && !this.isShooting && !this.isReloading) {
      this.player.anims.stop();
    }

    // 🔥 CORRECCIÓN DEFINITIVA: usar getWorldPoint
    const camera = this.scene.cameras.main;
    const input = this.scene.input;
    const worldPoint = camera.getWorldPoint(input.x, input.y);
    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      worldPoint.x,
      worldPoint.y
    );
    this.player.setRotation(angle);

    if (this.currentBullets <= 0 && !this.isReloading) {
      this.reload();
    }

    if (
      Phaser.Input.Keyboard.JustDown(this.rKey) &&
      this.currentBullets !== this.maxBullets
    ) {
      this.reload();
    }

    return {};
  }

  shoot(pointer) {
    if (this.isShooting || this.isReloading || this.currentBullets <= 0 || !this.enabled) {
      return null;
    }

    // ✅ También usamos worldPoint aquí para coherencia
    const camera = this.scene.cameras.main;
    const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);
    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      worldPoint.x,
      worldPoint.y
    );

    const distanceFromCenter = 50;
    const baseVerticalOffset = 13;
    const rotatedOffsetX =
      Math.cos(angle) * distanceFromCenter - Math.sin(angle) * baseVerticalOffset;
    const rotatedOffsetY =
      Math.sin(angle) * distanceFromCenter + Math.cos(angle) * baseVerticalOffset;

    const bulletX = this.player.x + rotatedOffsetX;
    const bulletY = this.player.y + rotatedOffsetY;

    this.currentBullets--;
    this.isShooting = true;

    this.player.play("shoot", true).once("animationcomplete", () => {
      this.isShooting = false;
    });

    return {
      x: bulletX,
      y: bulletY,
      angle: angle,
      velocity: 600,
      damage: 25,
    };
  }

  reload() {
    if (this.isReloading) return false;
    this.isReloading = true;
    this.player.play("reload", true);
    this.player.once("animationcomplete", () => {
      this.scene.time.delayedCall(200, () => {
        this.currentBullets = this.maxBullets;
        this.isReloading = false;
      });
    });
    this.scene.events.emit("playerReload");
    return true;
  }

  getCurrentBullets() { return this.currentBullets; }
  getMaxBullets() { return this.maxBullets; }
  getIsShooting() { return this.isShooting; }
  getIsReloading() { return this.isReloading; }

  setMaxBullets(max) {
    this.maxBullets = max;
    this.currentBullets = Math.min(this.currentBullets, max);
  }

  destroy() {
    try {
      if (this._onPointerDown) {
        this.scene.input.off("pointerdown", this._onPointerDown);
        this._onPointerDown = null;
      }
      if (this.wasd) {
        Object.values(this.wasd).forEach(key => {
          if (key) this.scene.input.keyboard.removeKey(key);
        });
        this.wasd = null;
      }
      if (this.rKey) {
        this.scene.input.keyboard.removeKey(this.rKey);
        this.rKey = null;
      }
    } catch (e) {
      console.warn("PlayerController.destroy error:", e);
    }
    this.scene = null;
    this.player = null;
  }
}