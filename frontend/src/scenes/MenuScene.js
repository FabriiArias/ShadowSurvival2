import PlayerData from "../systems/PlayerData.js";
import { playerApi } from "../utils/api.js"; // arriba del todo
import { storage } from "../utils/storage"; // asegurate de tener esto arriba


export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }


  create() {
    const { centerX, centerY } = this.cameras.main;

    // Fondo del menú
    this.bg = this.add.image(centerX, centerY, "menu_bg").setOrigin(0.5);

    // Escalar manteniendo proporciones + margen para el zoom interno
    const scaleX = this.cameras.main.width / this.bg.width;
    const scaleY = this.cameras.main.height / this.bg.height;
    const baseScale = Math.max(scaleX, scaleY) * 1.1; // margen 10%
    this.bg.setScale(baseScale);

    // 🔍 Animación de zoom suave (sin achicarse nunca)
    this.tweens.add({
      targets: this.bg,
      scale: baseScale * 1.05, // zoom leve dentro del margen
      duration: 8000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // 🎵 Música del menú
    this.menuMusic = this.sound.add("menu_music", { loop: true, volume: 0.5 });
    this.menuMusic.play();

    // 🎮 Título principal
    this.add
      .text(centerX, 150, "SHADOW SURVIVOR", {
        fontSize: "64px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Botones del menú
    this.createButton(centerX, centerY - 50, "Nueva partida", () => {
      this.sound.stopAll();
      PlayerData.reset?.();
      document.getElementById("ui-root").style.display = "none";

      this.scene.start("GameScene");
    });

    this.createButton(centerX, centerY + 30, "Continuar", () => {
      // En el futuro: cargar datos desde DB
       this.openLoadMenu();
      console.log("🔜 Continuar partida (DB)");
    });

    this.createButton(centerX, centerY + 110, "Cómo jugar", () => {
      this.showHowToPlay();
    });
    
    this.createButton(centerX, centerY + 190, "Top 5 global", () => {
      window.open("https://fabrizio-arias.vercel.app/", "_blank");
    });

    this.createButton(centerX, centerY + 270, "Créditos", () => {
      window.open("https://fabrizio-arias.vercel.app/", "_blank");
    });
    // Botones de sonido
    this.createMuteButtons();
  }

  // Creador de botones reutilizable
  createButton(x, y, label, onClick) {
    const btn = this.add
      .text(x, y, label.toUpperCase(), {
        fontSize: "32px",
        color: "#ffffff",
        backgroundColor: "#222222cc",
        padding: { x: 40, y: 15 },
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => btn.setStyle({ backgroundColor: "#444444" }))
      .on("pointerout", () => btn.setStyle({ backgroundColor: "#222222cc" }))
      .on("pointerdown", onClick);

    this.tweens.add({
      targets: btn,
      scale: 1.02,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    return btn;
  }

  // Modal "Cómo jugar"
  showHowToPlay() {
    const { centerX, centerY } = this.cameras.main;

    // Fondo semi-transparente
    const overlay = this.add.rectangle(
      centerX,
      centerY,
      1920,
      1080,
      0x000000,
      0.8
    );

    // Texto del modal
    const info = this.add
      .text(
        centerX,
        centerY - 50,
        `CONTROLES\n\nWASD: Moverse\nMouse: Apuntar\nClick: Disparar\n ESC: Pausa\nObjetivo: Sobrevive lo más posible`,
        {
          fontSize: "28px",
          color: "#ffffff",
          align: "center",
          backgroundColor: "#00000099",
          padding: { x: 30, y: 20 },
        }
      )
      .setOrigin(0.5);

    // Botón volver
    const backBtn = this.add
      .text(centerX, centerY + 220, "VOLVER", {
        fontSize: "30px",
        color: "#ffffff",
        backgroundColor: "#cc0000",
        padding: { x: 40, y: 15 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        overlay.destroy();
        info.destroy();
        backBtn.destroy();
      });
  }

  // Botones de muteo global
  createMuteButtons() {
    const iconSize = 48;
    const offset = 60;
    const x = this.cameras.main.width - offset;
    const y = offset;
/*
    const muteAll = this.add
      .text(x, y, "🔇", {
        fontSize: `${iconSize}px`,
      })
      .setOrigin(1, 0)
      .setInteractive()
      .on("pointerdown", () => {
        const mute = !this.sound.mute;
        this.sound.mute = mute;
        muteAll.setText(mute ? "🔇" : "🔈");
      });*/

    const muteMusic = this.add
      .text(x - 60, y, "🎵", {
        fontSize: `${iconSize}px`,
      })
      .setOrigin(1, 0)
      .setInteractive()
      .on("pointerdown", () => {
        if (this.menuMusic.isPlaying) {
          this.menuMusic.pause();
          muteMusic.setText("❌");
        } else {
          this.menuMusic.resume();
          muteMusic.setText("🎵");
        }
      });
  }

  async openLoadMenu() {
  const { centerX, centerY } = this.cameras.main;

  const overlay = this.add.rectangle(centerX, centerY, 1920, 1080, 0x000000, 0.8);

  // 🔹 Obtener usuario logueado
  const user = storage.getUser();
  if (!user) {
    console.warn("⚠️ No hay usuario logueado, no se pueden cargar partidas.");
    this.add.text(centerX, centerY, "Debes iniciar sesión para continuar", {
      fontSize: "28px",
      color: "#ff6666",
      backgroundColor: "#00000099",
      padding: { x: 30, y: 20 },
    }).setOrigin(0.5);
    return;
  }

  // 🔹 Pedir saves del backend usando su ID
  let saves = [];
  try {
    saves = await playerApi.getSaves(user.id);
  } catch (err) {
    console.error("Error al obtener partidas:", err);
    this.add.text(centerX, centerY, "Error al obtener partidas", {
      fontSize: "28px",
      color: "#ff6666",
      backgroundColor: "#00000099",
      padding: { x: 30, y: 20 },
    }).setOrigin(0.5);
    return;
  }

  // 🔹 Crear el menú de partidas
  const title = this.add
    .text(centerX, centerY - 200, "Cargar partida", {
      fontSize: "42px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  this.slotTexts = [];

  for (let i = 1; i <= 5; i++) {
    const s = saves.find((x) => x.slot_number === i);
    const label = s
      ? `Slot ${i} - Oleada ${s.wave_number} (${s.saved_at.split(" ")[1]})`
      : `Slot ${i} - Vacío`;

    const txt = this.add
      .text(centerX, centerY - 120 + i * 60, label, {
        fontSize: "28px",
        color: s ? "#90ee90" : "#ffff00",
        backgroundColor: "#333333",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", () => {
        if (s) this.loadGameSlot(s);
      });

    this.slotTexts.push(txt);
  }

  const backBtn = this.add
    .text(centerX, centerY + 250, "Cancelar", {
      fontSize: "28px",
      color: "#ff6666",
      backgroundColor: "#333333",
      padding: { x: 30, y: 10 },
    })
    .setOrigin(0.5)
    .setInteractive()
    .on("pointerdown", () => {
      overlay.destroy();
      title.destroy();
      backBtn.destroy();
      this.slotTexts.forEach((t) => t.destroy());
    });
}



loadGameSlot(saveData) {
  this.sound.stopAll();
  this.scene.start("GameScene", { loadedSave: saveData });
}
}


