import PlayerData from "../systems/PlayerData.js";
import { playerApi } from "../utils/api.js";
import { storage } from "../utils/storage.js";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  create() {
    const { centerX, centerY } = this.cameras.main;

    // Fondo del menú
    this.bg = this.add.image(centerX, centerY, "menu_bg").setOrigin(0.5);
    const scaleX = this.cameras.main.width / this.bg.width;
    const scaleY = this.cameras.main.height / this.bg.height;
    const baseScale = Math.max(scaleX, scaleY) * 1.1;
    this.bg.setScale(baseScale);

    // Animación de zoom suave
    this.tweens.add({
      targets: this.bg,
      scale: baseScale * 1.05,
      duration: 8000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Música del menú
    this.menuMusic = this.sound.add("menu_music", { loop: true, volume: 0.5 });
    this.menuMusic.play();

    // Título principal
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
      this.openLoadMenu();
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

    // Botón Cerrar Sesión (si está logueado)
    // Botón Cerrar Sesión (si está logueado)
const user = storage.getUser();
if (user && user.id) {
  this.createButton(centerX, centerY + 350, "Cerrar sesión", () => {
    // 🔹 DETENER MÚSICA Y LIMPIAR
    this.menuMusic.stop();
    this.sound.stopAll();
    storage.clear();
    
    // 🔹 IR A LOGIN SCENE EN LUGAR DE REINICIAR
    this.scene.start("LoginScene");
  });
}

    // Botones de sonido
        this.createMuteButtons();
  }

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

  async openLoadMenu() {
  const { centerX, centerY } = this.cameras.main;

  // Crear overlay
  const overlay = this.add.rectangle(centerX, centerY, 1920, 1080, 0x000000, 0.8);
  
  // Elementos a limpiar después
  const elementsToDestroy = [overlay];

  // Obtener usuario
  const user = storage.getUser();
  console.log('🔍 Usuario en localStorage:', user);
  
  // 🔹 FIX: Obtener el ID correctamente (user.user.id)
  const userId = user?.user?.id || user?.id;
  console.log('🔍 User ID encontrado:', userId);
  
  if (!user || !user.token || !userId) {
    console.warn("⚠️ No hay usuario logueado o ID inválido");
    const errorText = this.add.text(centerX, centerY - 50, "Debes iniciar sesión para continuar", {
      fontSize: "28px",
      color: "#ff6666",
      backgroundColor: "#00000099",
      padding: { x: 30, y: 20 },
    }).setOrigin(0.5);
    
    const closeBtn = this.add.text(centerX, centerY + 30, "Cerrar", {
      fontSize: "24px",
      color: "#ffffff",
      backgroundColor: "#333333",
      padding: { x: 20, y: 10 },
    })
    .setOrigin(0.5)
    .setInteractive()
    .on("pointerdown", () => {
      this.cleanupLoadMenu([...elementsToDestroy, errorText, closeBtn]);
    });
    
    elementsToDestroy.push(errorText, closeBtn);
    return;
  }

  // Mostrar "cargando..."
  const loadingText = this.add.text(centerX, centerY, "Cargando partidas...", {
    fontSize: "28px",
    color: "#ffffff",
  }).setOrigin(0.5);
  elementsToDestroy.push(loadingText);

  // Obtener saves del backend
  let saves = [];
  try {
    console.log('📡 Llamando a playerApi.getSaves con userId:', userId);
    saves = await playerApi.getSaves(userId); // 🔹 Usar userId corregido
    console.log('✅ Partidas obtenidas:', saves);
    
    // Remover texto de carga
    loadingText.destroy();
    
  } catch (err) {
    console.error('❌ Error al obtener partidas:', err);
    loadingText.destroy();
    
    const errorMsg = err.response?.data?.message || err.message || "Error de conexión";
    const errorText = this.add.text(centerX, centerY - 50, `Error: ${errorMsg}`, {
      fontSize: "24px",
      color: "#ff6666",
      backgroundColor: "#00000099",
      padding: { x: 30, y: 20 },
    }).setOrigin(0.5);
    
    const closeBtn = this.add.text(centerX, centerY + 30, "Cerrar", {
      fontSize: "24px",
      color: "#ffffff",
      backgroundColor: "#333333",
      padding: { x: 20, y: 10 },
    })
    .setOrigin(0.5)
    .setInteractive()
    .on("pointerdown", () => {
      this.cleanupLoadMenu([...elementsToDestroy, errorText, closeBtn]);
    });
    
    elementsToDestroy.push(errorText, closeBtn);
    return;
  }

    // Crear el menú de partidas
    const title = this.add
      .text(centerX, centerY - 200, "Cargar partida", {
        fontSize: "42px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    elementsToDestroy.push(title);

    this.slotTexts = [];

    for (let i = 1; i <= 5; i++) {
      const save = saves.find((s) => s.slot_number === i);
      const label = save
        ? `Slot ${i} - Oleada ${save.wave_number} (${save.saved_at?.split(" ")[1] || 'sin fecha'})`
        : `Slot ${i} - Vacío`;

      const txt = this.add
        .text(centerX, centerY - 120 + i * 60, label, {
          fontSize: "28px",
          color: save ? "#90ee90" : "#ffff00",
          backgroundColor: "#333333",
          padding: { x: 20, y: 10 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on("pointerover", () => txt.setStyle({ backgroundColor: "#555555" }))
        .on("pointerout", () => txt.setStyle({ backgroundColor: "#333333" }))
        .on("pointerdown", () => {
          if (save) {
            console.log('🎮 Cargando slot:', save);
            this.loadGameSlot(save);
          } else {
            console.log('❌ Slot vacío:', i);
          }
        });

      this.slotTexts.push(txt);
      elementsToDestroy.push(txt);
    }

    const backBtn = this.add
      .text(centerX, centerY + 250, "Cancelar", {
        fontSize: "28px",
        color: "#ff6666",
        backgroundColor: "#333333",
        padding: { x: 30, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.cleanupLoadMenu(elementsToDestroy);
      });
      
    elementsToDestroy.push(backBtn);
  }

  cleanupLoadMenu(elements) {
    elements.forEach(el => {
      if (el && typeof el.destroy === 'function') {
        el.destroy();
      }
    });
    if (this.slotTexts) {
      this.slotTexts.forEach(txt => txt.destroy());
      this.slotTexts = [];
    }
  }

  loadGameSlot(saveData) {
    this.sound.stopAll();
    this.scene.start("GameScene", { loadedSave: saveData });
  }

  showHowToPlay() {
    const { centerX, centerY } = this.cameras.main;

    const overlay = this.add.rectangle(centerX, centerY, 1920, 1080, 0x000000, 0.8);
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

  createMuteButtons() {
    const iconSize = 48;
    const offset = 60;
    const x = this.cameras.main.width - offset;
    const y = offset;

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
}