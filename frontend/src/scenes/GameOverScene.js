import PlayerData from "../systems/PlayerData.js";
import Phaser from "phaser";

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameOverScene" });
  }

  init(data) {
    this.stats = data.stats || {};
  }

  create() {
    const { centerX, centerY } = this.cameras.main;

    // Fondo oscuro
    this.add.rectangle(centerX, centerY, 1920, 1080, 0x000000, 0.75);

    // Título GAME OVER
    this.add
      .text(centerX, centerY - 220, "GAME OVER", {
        fontSize: "80px",
        color: "#ff0000",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    // Estadísticas del juego
    const { highestWave, totalKills, survivalTime, coinsEarned, weapon } =
      this.stats;

    this.add
      .text(
        centerX,
        centerY - 20,
        `Oleada alcanzada: ${highestWave ?? 0}
Enemigos eliminados: ${totalKills ?? 0}
Tiempo sobrevivido: ${survivalTime ?? 0}s
Monedas ganadas: ${coinsEarned ?? 0}
Arma: ${(weapon || "Desconocida").toUpperCase()}`,
        {
          fontSize: "28px",
          color: "#ffffff",
          backgroundColor: "#000000aa",
          padding: { x: 25, y: 15 },
          align: "center",
          stroke: "#000000",
          strokeThickness: 4,
        }
      )
      .setOrigin(0.5);

    // 🔄 Botón: JUGAR DE NUEVO
    const restartBtn = this.add
      .text(centerX, centerY + 180, "JUGAR DE NUEVO", {
        fontSize: "38px",
        color: "#ffffff",
        backgroundColor: "#cc0000",
        padding: { x: 40, y: 20 },
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () =>
        restartBtn.setStyle({ backgroundColor: "#ff0000" })
      )
      .on("pointerout", () =>
        restartBtn.setStyle({ backgroundColor: "#cc0000" })
      )
      .on("pointerdown", () => {
        // 🛑 Detener todos los sonidos
        this.sound.stopAll();

        // 🧹 Reset total de PlayerData
        PlayerData.reset();

        // PARAR la escena del juego y HUD por seguridad para evitar listeners huérfanos
        if (this.scene.isActive("GameScene")) {
          this.scene.stop("GameScene");
        }
        if (this.scene.isActive("HUDScene")) {
          this.scene.stop("HUDScene");
        }

        // 🔄 Reiniciar GameScene
        this.scene.start("GameScene");
      });

    // 🔙 Botón: VOLVER AL MENÚ
    const menuBtn = this.add
      .text(centerX, centerY + 260, "VOLVER AL MENÚ", {
        fontSize: "34px",
        color: "#ffffff",
        backgroundColor: "#3333cc",
        padding: { x: 35, y: 18 },
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => menuBtn.setStyle({ backgroundColor: "#5555ff" }))
      .on("pointerout", () => menuBtn.setStyle({ backgroundColor: "#3333cc" }))
      .on("pointerdown", () => {
        // 🧹 Reset y volver al menú
        PlayerData.reset();
        this.sound.stopAll();

        // Parar escenas relacionadas (evitar duplicados)
        if (this.scene.isActive("HUDScene")) this.scene.stop("HUDScene");
        if (this.scene.isActive("GameScene")) this.scene.stop("GameScene");
        if (this.scene.isActive("ShopScene")) this.scene.stop("ShopScene");

        this.scene.start("MenuScene");
      });

    // Fade in suave al entrar
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }
}