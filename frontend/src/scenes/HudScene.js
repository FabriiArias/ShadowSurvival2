// HUDScene.js - Interfaz de usuario persistente
export default class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: "HUDScene" });
  }

  create() {
    const zoom = 1;
    const { width } = this.sys.game.config;

    // Barra de vida del jugador
    this.playerHealthBar = this.add.graphics().setScrollFactor(0).setDepth(1000);

    // Texto numerico de vida
    this.healthText = this.add.text(230 / zoom, 18 / zoom, "", {
      fontSize: "20px",
      color: "#ffffff",
      backgroundColor: "#000000",
      padding: { x: 8, y: 4 },
    }).setScrollFactor(0).setDepth(1000);

     //Texto de informacion general
    this.infoText = this.add.text(20 / zoom, 70 / zoom, "", {
      fontSize: "20px",
      color: "#ffffff",
      backgroundColor: "#000000",
      padding: { x: 10, y: 5 },
    }).setScrollFactor(0).setDepth(1000); 

    // Estado de audio
    this.isMusicMuted = false;
    this.isSFXMuted = false;

    // Configurar botones de audio
    // this.setupAudioButtons();

    // Configurar iconos de boosters
    this.setupBoosterIcons();
  }

  // Configurar botones de musica y efectos
  setupAudioButtons() {
    const zoom = 1;

    // Boton de musica
    this.musicButton = this.add.text(20 / zoom, 120 / zoom, "MUSIC", {
      fontSize: "24px",
      padding: { x: 12, y: 8 },
      backgroundColor: "#1a1a2e",
      color: "#ffffff",
    })
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.toggleMusic());

    // Boton de efectos de sonido
    this.sfxButton = this.add.text(20 / zoom, 160 / zoom, "SFX", {
      fontSize: "24px",
      padding: { x: 12, y: 8 },
      backgroundColor: "#1a1a2e",
      color: "#ffffff",
    })
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.toggleSFX());
  }

  // Configurar iconos de boosters activos
  setupBoosterIcons() {
    const { width } = this.sys.game.config;
    
    // Contenedor para todos los boosters (esquina superior derecha)
    this.boosterContainer = this.add.container(width - 150, 80)
      .setScrollFactor(0)
      .setDepth(1000);

    // Icono de escudo con contador
    this.shieldIcon = this.add.text(0, 0, '🛡️', { 
      fontSize: '32px',
      stroke: '#000',
      strokeThickness: 3
    }).setAlpha(0);

    // Icono de dano aumentado
    this.damageIcon = this.add.text(0, 40, '⚔️', { 
      fontSize: '28px',
      stroke: '#000',
      strokeThickness: 3
    }).setAlpha(0);

    // Icono de velocidad aumentada
    this.speedIcon = this.add.text(0, 75, '⚡', { 
      fontSize: '28px',
      stroke: '#000',
      strokeThickness: 3
    }).setAlpha(0);

    // Agregar todos los iconos al contenedor
    this.boosterContainer.add([this.shieldIcon, this.damageIcon, this.speedIcon]);
  }

  // Actualizar barra de vida
  updateHealthBar(health, maxHealth) {
    if (!this.playerHealthBar) return;
    this.playerHealthBar.clear();

    const zoom = 1;
    const barWidth = 200 / zoom;
    const barHeight = 20 / zoom;
    const x = 20 / zoom;
    const y = 20 / zoom;

    // Fondo rojo (vida perdida)
    this.playerHealthBar.fillStyle(0x8b0000);
    this.playerHealthBar.fillRect(x, y, barWidth, barHeight);

    // Vida actual en verde
    const healthWidth = (health / maxHealth) * barWidth;
    this.playerHealthBar.fillStyle(0x00ff00);
    this.playerHealthBar.fillRect(x, y, healthWidth, barHeight);

    // Borde blanco
    this.playerHealthBar.lineStyle(2 / zoom, 0xffffff);
    this.playerHealthBar.strokeRect(x, y, barWidth, barHeight);

    // Actualizar texto numerico
    if (this.healthText) {
      this.healthText.setText(`${health} / ${maxHealth}`);
    }
  }

  // Actualizar informacion general
  updateInfo(wave, totalKills, timeRemaining, currentBullets, maxBullets) {
    if (!this.infoText) return;
    
    // Cambiar color de balas segun cantidad restante
    const bulletColor = currentBullets <= 2 ? "#ff0000" : "#ffffff";

    this.infoText.setText(
      `Oleada: ${wave}\nKills: ${totalKills}\nTiempo: ${timeRemaining}s\nBalas: ${currentBullets}/${maxBullets}`
    );
    this.infoText.setStyle({ color: bulletColor });
  }

  // Actualizar iconos de boosters activos
  updateBoosters(activeBoosts) {
    // Mostrar escudo con hits restantes
    if (activeBoosts.hasShield && activeBoosts.shieldHits > 0) {
      this.shieldIcon.setText(`🛡️ x${activeBoosts.shieldHits}`).setAlpha(1);
    } else {
      this.shieldIcon.setAlpha(0);
    }
    
    // Mostrar dano si es mayor a 1x
    if (activeBoosts.damageMultiplier > 1) {
      const damagePercent = Math.round((activeBoosts.damageMultiplier - 1) * 100);
      this.damageIcon.setText(`⚔️ +${damagePercent}%`).setAlpha(1);
    } else {
      this.damageIcon.setAlpha(0);
    }
    
    // Mostrar velocidad si es mayor a 1x
    if (activeBoosts.speedMultiplier > 1) {
      const speedPercent = Math.round((activeBoosts.speedMultiplier - 1) * 100);
      this.speedIcon.setText(`⚡ +${speedPercent}%`).setAlpha(1);
    } else {
      this.speedIcon.setAlpha(0);
    }
  }

  // Mostrar texto de oleada (deprecado, ahora en GameScene)
  showWaveText(waveNumber) {
    const text = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      `OLEADA ${waveNumber}`,
      {
        fontSize: "64px",
        color: "#ffffff",
        backgroundColor: "#000000",
        padding: { x: 20, y: 10 },
      }
    )
      .setScrollFactor(0)
      .setOrigin(0.5)
      .setDepth(5000);

    this.tweens.add({
      targets: text,
      alpha: 0,
      duration: 2000,
      delay: 1000,
      onComplete: () => text.destroy(),
    });
  }

  // Alternar musica
  toggleMusic() {
    this.isMusicMuted = !this.isMusicMuted;

    if (this.isMusicMuted) {
      this.musicButton.setText("MUSIC OFF").setStyle({ backgroundColor: "#8b0000" });
    } else {
      this.musicButton.setText("MUSIC").setStyle({ backgroundColor: "#1a1a2e" });
    }

    // Emitir evento global para GameScene
    this.game.events.emit("toggleMusic", this.isMusicMuted);
  }

  /* Alternar efectos de sonido
  toggleSFX() {
    this.isSFXMuted = !this.isSFXMuted;

    if (this.isSFXMuted) {
      this.sfxButton.setText("SFX OFF").setStyle({ backgroundColor: "#8b0000" });
    } else {
      this.sfxButton.setText("SFX").setStyle({ backgroundColor: "#1a1a2e" });
    }

    // Emitir evento global para GameScene
    this.game.events.emit("toggleSFX", this.isSFXMuted);
  } */

  // Getters para estado de audio
  getMusicMuted() {
    return this.isMusicMuted;
  }

  getSFXMuted() {
    return this.isSFXMuted;
  }
}