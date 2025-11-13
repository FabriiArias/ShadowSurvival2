import Phaser from "phaser";
import { playerApi } from "../utils/api.js";

/**
 * PauseScene
 * ------------
 * Escena de pausa con opciones:
 *  - Reanudar
 *  - Mute Música / SFX
 *  - Guardar en 5 slots
 *  - Salir al menú
 */
export default class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: "PauseScene" });
  }

  init(data) {
    this.gameScene = data.gameScene;
    this.playerData = data.playerData;
     const user = storage.getUser();
  this.userId = user?.id || 1;
  }

  create() {
    const { width, height } = this.sys.game.config;

    // Fondo semitransparente
    this.overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setDepth(1000);

    // Título
    this.add
      .text(width / 2, height / 2 - 200, "PAUSA", {
        fontSize: "48px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(1001);

    // Botones
    this.resumeBtn = this.createButton(width / 2, height / 2 - 80, "Reanudar", () => this.resumeGame());
    this.musicBtn = this.createButton(width / 2, height / 2 - 20, "Mutear música", () => this.toggleMusic());
    this.sfxBtn = this.createButton(width / 2, height / 2 + 40, "Mutear efectos", () => this.toggleSFX());
    this.saveBtn = this.createButton(width / 2, height / 2 + 100, "Guardar progreso", () => this.openSlotSelection());
    this.exitBtn = this.createButton(width / 2, height / 2 + 160, "Salir al menú", () => this.exitToMenu());

    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  createButton(x, y, label, callback) {
    const btn = this.add
      .text(x, y, label, {
        fontSize: "28px",
        color: "#ffffff",
        backgroundColor: "#333333",
        padding: { x: 30, y: 10 },
        fixedWidth: 280,
        align: "center",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerup", callback)
      .on("pointerover", () => btn.setStyle({ backgroundColor: "#555555" }))
      .on("pointerout", () => btn.setStyle({ backgroundColor: "#333333" }))
      .setDepth(1001);

    return btn;
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.resumeGame();
    }
  }

  /** Reanudar el juego */
  resumeGame() {
    this.scene.stop();
    this.scene.resume("GameScene");
    this.gameScene.physics.resume();
    this.gameScene.level1Music.resume();
  }

  /** Mutear música */
  toggleMusic() {
    const muted = !this.gameScene.hudScene.getMusicMuted?.();
    this.gameScene.hudScene.toggleMusic?.();
    this.musicBtn.setText(muted ? "Activar música" : "Mutear música");
  }

  /** Mutear efectos */
  toggleSFX() {
    const muted = !this.gameScene.hudScene.getSFXMuted?.();
    this.gameScene.hudScene.toggleSFX?.();
    this.sfxBtn.setText(muted ? "Activar efectos" : "Mutear efectos");
  }

  /** Abre el menú de slots (5 slots, muestra datos existentes) */
  async openSlotSelection() {
    const { width, height } = this.sys.game.config;

    // Fondo oscuro
    this.saveOverlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
      .setDepth(2000);

    this.saveTexts = [];

    this.add
      .text(width / 2, height / 2 - 180, "Selecciona un slot (1–5)", {
        fontSize: "34px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(2001);

    // Obtener partidas guardadas
    let saves = [];
    try {
      saves = await await playerApi.getSaves(this.userId);
    } catch (err) {
      console.warn("No se pudieron cargar partidas guardadas:", err);
    }

    for (let i = 1; i <= 5; i++) {
      const existing = saves.find((s) => s.slot_number === i);
      const label = existing
        ? `Slot ${i} - Oleada ${existing.wave_number} (${existing.saved_at.split(" ")[1]})`
        : `Slot ${i} - Vacío`;

      const txt = this.add
        .text(width / 2, height / 2 - 100 + (i - 1) * 55, label, {
          fontSize: "24px",
          color: existing ? "#90ee90" : "#ffff00",
          backgroundColor: "#333333",
          padding: { x: 20, y: 10 },
          fixedWidth: 380,
          align: "center",
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on("pointerup", () => this.saveProgress(i))
        .on("pointerover", function () {
          if (!this.scene) return;
          this.setStyle({ backgroundColor: "#555555" });
        })
        .on("pointerout", function () {
          if (!this.scene) return;
          this.setStyle({ backgroundColor: "#333333" });
        })
        .setDepth(2001);

      this.saveTexts.push(txt);
    }

    // Botón cancelar
    this.cancelBtn = this.add
      .text(width / 2, height / 2 + 210, "Cancelar", {
        fontSize: "26px",
        color: "#ff6666",
        backgroundColor: "#333333",
        padding: { x: 25, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerup", () => this.closeSlotSelection())
      .setDepth(2001);

    this.saveTexts.push(this.cancelBtn);
  }

  /** Cerrar menú de slots */
  closeSlotSelection() {
    if (this.saveTexts) this.saveTexts.forEach((t) => t.destroy());
    if (this.saveOverlay) this.saveOverlay.destroy();
    this.saveTexts = [];
    this.saveOverlay = null;
  }

  /** Guardar progreso en un slot */
  async saveProgress(slot) {
    const player = this.gameScene.player;

    const data = {
      user_id: this.userId,
      slot_number: slot,
      wave_number: this.gameScene.currentWave,
      health: player.health,
      max_health: player.maxHealth,
      damage: this.gameScene.weaponDamage,
      speed: this.gameScene.playerController.speed || 200,
      current_weapon: this.gameScene.currentWeapon,
      coins: this.gameScene.coins,
      kills: this.gameScene.stats.totalKills,
      position_x: player.x,
      position_y: player.y,
      powerups: JSON.stringify(this.gameScene.activeBoosts || {}),
      boosts: JSON.stringify(this.gameScene.activeBoosts || {}),
    };

    try {
      const res = await playerApi.saveProgress(data);
      if (res.status === 200) {
        this.showSaveConfirmation(slot);
      }
    } catch (err) {
      console.error("Error al guardar progreso:", err);
    }
  }

  showSaveConfirmation(slot) {
    const { width, height } = this.sys.game.config;

    const msg = this.add
      .text(width / 2, height / 2 + 260, `Guardado en slot ${slot}`, {
        fontSize: "24px",
        color: "#00ff00",
      })
      .setOrigin(0.5)
      .setDepth(3000);

    this.tweens.add({
      targets: msg,
      alpha: 0,
      duration: 2000,
      delay: 800,
      onComplete: () => msg.destroy(),
    });

    this.closeSlotSelection();
  }

  /** Salir al menú principal */
  exitToMenu() {
    this.scene.stop("GameScene");
    this.scene.stop("HUDScene");
    this.scene.start("MenuScene");
  }
}
