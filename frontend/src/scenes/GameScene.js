import Bat from "../entities/lvl1/Bat.js";
import Eyeball from "../entities/lvl1/EyeBall.js";
import PlayerController from "../managers/PlayerController.js";
import PlayerData from "../systems/PlayerData.js";
import Shadow from "../entities/lvl1/Shadow.js";
import Shooter from "../entities/lvl1/Shooter.js";
import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }


   // la data es un poarametro que se manda de las otras scenas
   
  create(data) {
    const MAP_WIDTH = 3000;
    const MAP_HEIGHT = 2000;

    // flag para el game over
    this.isGameOver = false;

    

    // Si viene una partida guardada, restaurar datos
    if (data.loadedSave) {
      const s = data.loadedSave;
      PlayerData.health = s.health;
      PlayerData.maxHealth = s.max_health;
      PlayerData.highestWave = s.wave_number;
      PlayerData.totalKills = s.kills;
      PlayerData.totalScore = s.coins;
      // Restaurar posición del jugador
      //this.startPosition = { x: s.position_x, y: s.position_y };
      // no me gusto, que arranque en el medio
      this.startPosition = { x: 1500, y: 1000 };
    } else {
      // Partida nueva: empezar en el centro
      this.startPosition = { x: 1500, y: 1000 };
    }

    // Lanzar HUDScene si no está activa
    if (!this.scene.isActive("HUDScene")) {
      this.scene.launch("HUDScene");
    }
    this.hudScene = this.scene.get("HUDScene");

    // Fondo del mapa
    this.bg = this.add.image(0, 0, "background").setOrigin(0);
    this.bg.setDisplaySize(MAP_WIDTH, MAP_HEIGHT);

    // Configurar límites del mundo fisico
    this.physics.world.setBounds(60, 60, MAP_WIDTH - 120, MAP_HEIGHT - 120);

    // ============================================
    // musica de fondo
    // ============================================
    this.level1Music = this.sound.add("level1_music", {
      loop: true,
      volume: 0.05,
    });
    this.level1Music.play();

    // ============================================
    // config del player
    // ============================================
    this.player = this.physics.add.sprite(
      MAP_WIDTH / 2,
      MAP_HEIGHT / 2,
      "player_walk",
      0
    );
    this.player.setScale(0.4);
    this.player.setCollideWorldBounds(true); // No puede salir del mapa

    // Cargar vida desde PlayerData
    this.player.health = PlayerData.health;
    this.player.maxHealth = PlayerData.maxHealth;

    // ============================================
    // armas
    // ============================================

    // Esto queda escalable para poner los diferestes sprites del player con rifle y escopeta

    this.currentWeapon = "pistol";
    this.weaponDamage = 25;

    // ============================================
    // coins
    // ============================================
    this.coins = PlayerData.totalScore || 0;

    // ============================================
    // stasts de la partida
    // ============================================
    this.stats = {
      startTime: Date.now(),           // Tiempo de inicio (timestamp)
      survivalTime: 0,                 // Tiempo sobrevivido en segundos
      totalKills: PlayerData.totalKills || 0,
      highestWave: PlayerData.highestWave || 1,
      coinsEarned: 0,                  // Monedas ganadas en esta sesión
    };

    // ============================================
    // llamamos a todas las animaciones
    // ============================================
    this.setupAnimations();

    // ============================================
    // controlador del jugador, controles de movimiento y eso
    // ============================================
    // Maneja input de teclado/mouse y movimiento
    this.playerController = new PlayerController(this, this.player);

    // ============================================
    // sistema de camara
    // ============================================
    // Seguimiento suave del jugador
    this.cameras.main.startFollow(this.player, true, 0.05, 0.05); // lerpX y lerpY suavizado de camara 1 mas rapido 0 menos bruzco
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT); 
    this.cameras.main.setZoom(1); // antes ponia mas zoom pero me gusto el default

    // ============================================
    // fisicas
    // ============================================
    // Balas del jugador
    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      runChildUpdate: true,
    });

    // Enemigos
    this.enemies = this.physics.add.group();
    
    // Monedas que dropean los enemigos
    this.coinDrops = this.physics.add.group();
    
    // Balas de los enemigos
    this.enemyBullets = this.physics.add.group();

    // ============================================
    // sistema de oledas
    // ============================================
    this.waveSystem = {
      isActive: false,           // Si hay oleada en curso
      duration: 20000,           // Duración base: 20 segundos
      startTime: 0,              // Timestamp de inicio de oleada
      isPaused: false,           // Si está pausada (entre oleadas)
      enemySpawnRate: 2000,      // Cada cuánto spawner (ms)
      lastSpawnTime: 0,          // Último spawn realizado
      baseEnemiesAtOnce: 3,      // Enemigos simultáneos base
    };

    // Oleada actual y cantidad de enemigos
    this.currentWave = PlayerData.highestWave || 1;
    this.enemiesInWave = this.waveSystem.baseEnemiesAtOnce;

    // ============================================
    // boost
    // ============================================
    this.activeBoosts = {
      damageMultiplier: 1,       // Multiplicador de daño (no usado actualmente)
      speedMultiplier: 1,        // Multiplicador de velocidad
      hasShield: false,          // Si tiene escudo activo
      shieldHits: 0,             // Hits que puede absorber el escudo
    };

    // ============================================
    // colisiones
    // ============================================
    // Balas del jugador golpean enemigos
    this.physics.add.overlap(
      this.bullets,
      this.enemies,
      this.bulletHitEnemy,
      null,
      this
    );
    
    // Jugador toca enemigos (daño por contacto)
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.playerHitEnemy,
      null,
      this
    );
    
    // Jugador recibe balas enemigas
    this.physics.add.overlap(
      this.player,
      this.enemyBullets,
      this.playerHitByBullet,
      null,
      this
    );
    
    // Jugador recoge monedas
    this.physics.add.overlap(
      this.player,
      this.coinDrops,
      this.collectCoin,
      null,
      this
    );

    // ============================================
    // EVENT LISTENERS
    // ============================================
    // Eventos del jugador
    this.events.on("playerShoot", this.handlePlayerShoot, this);
    this.events.on("playerReload", this.handlePlayerReload, this);
    this.events.on("shopClosed", this.handleShopClosed, this);

    // Eventos globales de audio
    this.game.events.on("toggleMusic", this.handleMusicToggle, this);
    this.game.events.on("toggleSFX", this.handleSFXToggle, this);

    // Eventos de limpieza (prevenir memory leaks)
    this.events.on("shutdown", this.onShutdown, this);
    this.events.on("destroy", this.onDestroy, this);

    // ============================================
    // configuracion de teclas
    // ============================================
    this.escKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );
    this.spaceKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    // ============================================
    //  INICIAR PRIMERA OLEADA
    // ============================================
    this.isPaused = false;
    this.startWave();
  }

  
  setupAnimations() {
    // ANIMACIONES DEL JUGADOR
    this.anims.create({
      key: "walk",
      frames: this.anims.generateFrameNumbers("player_walk", {
        start: 0,
        end: 19,
      }),
      frameRate: 15,
      repeat: -1, // Loop infinito
    });

    this.anims.create({
      key: "shoot",
      frames: this.anims.generateFrameNumbers("player_shoot", {
        start: 0,
        end: 1,
      }),
      frameRate: 15,
      repeat: 0, // Una sola vez
    });

    this.anims.create({
      key: "reload",
      frames: this.anims.generateFrameNumbers("player_reload", {
        start: 0,
        end: 3,
      }),
      frameRate: 5,
      repeat: 0,
    });

    // ANIMACIONES DE ENEMIGOS
    this.anims.create({
      key: "bat_fly",
      frames: this.anims.generateFrameNumbers("bat", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "eyeball_move",
      frames: this.anims.generateFrameNumbers("eyeball", { start: 0, end: 23 }),
      frameRate: 20,
      repeat: -1,
    });

    // ANIMACIÓN DE MONEDA
    this.anims.create({
      key: "coin_spin",
      frames: this.anims.generateFrameNumbers("coin", { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });

    // ANIMACIONES DE SHADOW
    this.anims.create({
      key: "shadow_run",
      frames: this.anims.generateFrameNumbers("shadow_run", {
        start: 0,
        end: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "shadow_attack",
      frames: this.anims.generateFrameNumbers("shadow_attack", {
        start: 0,
        end: 7,
      }),
      frameRate: 4,
      repeat: 0,
    });

    // ANIMACIONES DE SHOOTER
    this.anims.create({
      key: "shooter_walk",
      frames: this.anims.generateFrameNumbers("shooter_walk", {
        start: 0,
        end: 5,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "shooter_attack",
      frames: this.anims.generateFrameNumbers("shooter_attack", {
        start: 0,
        end: 5,
      }),
      frameRate: 12,
      repeat: 0,
    });
  }

  /**
   * Obtiene el daño base de cada arma
   * @param {string} weapon - Nombre del arma (pistol, shotgun, rifle)
   * @returns {number} Daño del arma
   */
  getWeaponDamage(weapon) {
    const damages = { pistol: 25, shotgun: 40, rifle: 35 };
    return damages[weapon] || 25;
  }

  /**
   * Inicia una nueva oleada
   */
  startWave() {
    // Recargar arma al inicio de cada oleada
    this.playerController.reload();
    
    this.waveSystem.isActive = true;
    this.waveSystem.isPaused = false;
    this.waveSystem.startTime = 0;
    this.waveSystem.lastSpawnTime = 0;

    // Calcular duración de la oleada (aumenta con cada oleada)
    // 20s + 10s por cada oleada adicional
    this.waveSystem.duration = 20000 + (this.currentWave - 1) * 10000;
    
    // Calcular cantidad de enemigos simultáneos
    // Base: 3 + 1 cada 2 oleadas, máximo 15
    this.enemiesInWave =
      this.waveSystem.baseEnemiesAtOnce + Math.floor(this.currentWave / 2);
    this.enemiesInWave = Math.min(this.enemiesInWave, 15);
    
    // Calcular velocidad de spawn (más rápido en oleadas avanzadas)
    // Mínimo 800ms, empieza en 2000ms - 100ms por oleada
    this.waveSystem.enemySpawnRate = Math.max(
      800,
      2000 - this.currentWave * 100
    );

    // Mostrar animación de inicio
    this.showWaveStartAnimation();
  }

  /**
   * Animación de inicio de oleada
   * Muestra "OLEADA X" y "PREPARATE!" durante 3 segundos
   */
  showWaveStartAnimation() {
    // Pausar todo durante la animación
    this.physics.pause();
    this.playerController.setEnabled(false);
    this.player.setVelocity(0, 0);

    const { width, height } = this.sys.game.config;

    // Overlay oscuro de fondo
    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setScrollFactor(0) // No se mueve con la cámara
      .setDepth(9000);    // Encima de todo

    // Texto principal: "OLEADA X"
    const waveText = this.add
      .text(width / 2, height / 2 - 50, `OLEADA ${this.currentWave}`, {
        fontSize: "72px",
        color: "#00ff00",
        stroke: "#000",
        strokeThickness: 8,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(9001)
      .setAlpha(0); // Empieza invisible

    // Texto secundario: "PREPARATE!"
    const readyText = this.add
      .text(width / 2, height / 2 + 50, "PREPARATE!", {
        fontSize: "32px",
        color: "#ffff00",
        stroke: "#000",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(9001)
      .setAlpha(0);

    // Fade in de los textos
    this.tweens.add({
      targets: [waveText, readyText],
      alpha: 1,
      scale: { from: 0.5, to: 1 },
      duration: 500,
      ease: "Back.easeOut",
    });

    // Efecto de parpadeo en "PREPARATE!"
    this.tweens.add({
      targets: readyText,
      alpha: { from: 1, to: 0.3 },
      duration: 400,
      yoyo: true,
      repeat: 3,
      delay: 500,
    });

    // Después de 3 segundos, fade out y empezar oleada
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: [overlay, waveText, readyText],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          // Limpiar elementos visuales
          overlay.destroy();
          waveText.destroy();
          readyText.destroy();
          
          // Reanudar juego
          this.physics.resume();
          this.playerController.setEnabled(true);
          this.player.setVelocity(0, 0);
          
          // Marcar inicio real de la oleada
          this.waveSystem.startTime = this.time.now;
        },
      });
    });
  }

  /**
   * Finaliza la oleada actual
   * Limpia enemigos, pausa el juego y muestra resumen
   */
  endWave() {
    this.waveSystem.isActive = false;
    this.waveSystem.isPaused = true;

    // Pausar todo
    this.physics.pause();
    this.playerController.setEnabled(false);
    this.player.setVelocity(0, 0);

    // Limpiar todos los enemigos y sus barras de vida
    this.enemies.children.entries.forEach((enemy) => {
      if (enemy.healthBar) enemy.healthBar.destroy();
      if (enemy.healthBarBg) enemy.healthBarBg.destroy();
    });
    this.enemies.clear(true, true);
    this.coinDrops.clear(true, true);

    // Actualizar records en PlayerData
    PlayerData.updateHighestWave(this.currentWave);
    PlayerData.setHealth(this.player.health);

    // Actualizar estadísticas
    this.stats.survivalTime = Math.floor(
      (Date.now() - this.stats.startTime) / 1000
    );
    this.stats.highestWave = this.currentWave;

    // Mostrar animación de victoria
    this.showWaveEndAnimation();
  }

  /**
   * Animación de fin de oleada
   * Muestra "OLEADA SUPERADA!" y estadísticas
   */
  showWaveEndAnimation() {
    const { width, height } = this.sys.game.config;

    // Overlay oscuro
    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setScrollFactor(0)
      .setDepth(9000);

    // Fade in del overlay
    this.tweens.add({ targets: overlay, alpha: 0.85, duration: 800 });

    // Texto de victoria
    const victoryText = this.add
      .text(width / 2, height / 2 - 80, "OLEADA SUPERADA!", {
        fontSize: "64px",
        color: "#00ff00",
        stroke: "#000",
        strokeThickness: 8,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(9001)
      .setAlpha(0)
      .setScale(0.5);

    // Texto de estadísticas
    const statsText = this.add
      .text(
        width / 2,
        height / 2 + 20,
        `Kills: ${this.stats.totalKills}  |  Monedas: ${this.coins}`,
        {
          fontSize: "28px",
          color: "#ffffff",
          stroke: "#000",
          strokeThickness: 4,
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(9001)
      .setAlpha(0);

    // Animación del texto de victoria
    this.tweens.add({
      targets: victoryText,
      alpha: 1,
      scale: 1,
      duration: 600,
      ease: "Back.easeOut",
      delay: 300,
    });

    // Animación de las estadísticas
    this.tweens.add({
      targets: statsText,
      alpha: 1,
      duration: 400,
      delay: 800,
    });

    // Efecto de pulsación en el texto de victoria
    this.tweens.add({
      targets: victoryText,
      scaleX: { from: 1, to: 1.05 },
      scaleY: { from: 1, to: 1.05 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      delay: 1000,
    });

    // Después de 2.5 segundos, ir a la tienda
    this.time.delayedCall(2500, () => {
      this.tweens.add({
        targets: [overlay, victoryText, statsText],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          // Limpiar elementos
          overlay.destroy();
          victoryText.destroy();
          statsText.destroy();
          
          // Teletransportar jugador al centro
          this.player.setPosition(1500, 1000);
          this.cameras.main.centerOn(1500, 1000);
          
          // Abrir tienda
          this.openShop();
        },
      });
    });
  }

  /**
   * Abre la tienda entre oleadas
   */
  openShop() {
    // Desactivar controles
    this.playerController.setEnabled(false);
    this.player.setVelocity(0, 0);

    // Lanzar escena de tienda con todos los datos necesarios
    this.scene.launch("ShopScene", {
      gameScene: this,
      currentWave: this.currentWave,
      coins: this.coins,
      playerHealth: this.player.health,
      playerMaxHealth: this.player.maxHealth,
      totalKills: this.stats.totalKills,
      currentWeapon: this.currentWeapon,
      activeBoosts: this.activeBoosts,
      hudScene: this.hudScene,
    });

    // Asegurar que la tienda esté encima
    this.scene.bringToTop("ShopScene");
  }

  /**
   * Callback cuando se cierra la tienda
   * Aplica todas las compras/mejoras realizadas
   * @param {Object} data - Datos devueltos por la tienda
   */
  handleShopClosed(data) {
    // Actualizar recursos
    this.coins = data.coins;
    this.player.health = data.playerHealth;
    this.player.maxHealth = data.playerMaxHealth;
    this.activeBoosts = data.activeBoosts;

    // Si cambió el arma, aplicar cambio
    if (data.currentWeapon !== this.currentWeapon) {
      this.upgradeWeapon(data.currentWeapon);
    }

    // Reactivar controles y pasar a siguiente oleada
    this.playerController.setEnabled(true);
    this.currentWave++;
    this.startWave();
  }

  /**
   * Cambia el arma del jugador
   * @param {string} newWeapon - Nueva arma (pistol, shotgun, rifle)
   */
  upgradeWeapon(newWeapon) {
    this.currentWeapon = newWeapon;
    this.weaponDamage = this.getWeaponDamage(newWeapon);

    // Cambiar sprite del jugador según el arma
    const weaponSprites = {
      pistol: "player_walk",
      shotgun: "player_shotgun",
      rifle: "player_rifle",
    };
    const newTexture = weaponSprites[newWeapon] || "player_walk";
    this.player.setTexture(newTexture, 0);

    // Recrear animaciones para la nueva arma
    this.setupWeaponAnimations(newWeapon);

    // Ajustar cantidad de balas según el arma
    if (newWeapon === "shotgun") {
      this.playerController.setMaxBullets(6);
    } else if (newWeapon === "rifle") {
      this.playerController.setMaxBullets(30);
    } else {
      this.playerController.setMaxBullets(10);
    }
  }

  /**
   * Recrea las animaciones del jugador para una arma específica
   * @param {string} weapon - Arma actual
   */
  setupWeaponAnimations(weapon) {
    this.anims.create({
      key: "walk",
      frames: this.anims.generateFrameNumbers(`player_${weapon}`, {
        start: 0,
        end: 19,
      }),
      frameRate: 15,
      repeat: -1,
    });

    this.anims.create({
      key: "shoot",
      frames: this.anims.generateFrameNumbers(`player_${weapon}_shoot`, {
        start: 0,
        end: 1,
      }),
      frameRate: 15,
      repeat: 0,
    });

    this.anims.create({
      key: "reload",
      frames: this.anims.generateFrameNumbers(`player_${weapon}_reload`, {
        start: 0,
        end: 3,
      }),
      frameRate: 5,
      repeat: 0,
    });
  }

  /**
   * Actualiza la interfaz del HUD
   * Se llama constantemente en el update loop
   */
  updateHUD() {
    // Verificar que el HUD existe y tiene todos sus elementos
    if (
      !this.hudScene ||
      !this.hudScene.playerHealthBar ||
      !this.hudScene.infoText ||
      !this.playerController
    )
      return;

    // Actualizar barra de vida
    this.hudScene.updateHealthBar(this.player.health, this.player.maxHealth);

    // Calcular tiempo restante de la oleada
    let timeRemaining = 0;
    if (this.waveSystem.isActive && !this.waveSystem.isPaused) {
      const elapsed = this.time.now - this.waveSystem.startTime;
      timeRemaining = Math.max(
        0,
        Math.ceil((this.waveSystem.duration - elapsed) / 1000)
      );
    }

    // Actualizar información general
    this.hudScene.updateInfo(
      this.currentWave,
      this.stats.totalKills,
      timeRemaining,
      this.playerController.getCurrentBullets(),
      this.playerController.getMaxBullets()
    );

    // Actualizar iconos de boosts activos
    if (this.hudScene.updateBoosters) {
      this.hudScene.updateBoosters(this.activeBoosts);
    }
  }

  /**
   * Sistema de spawn de enemigos
   * Verifica condiciones y genera enemigos cuando corresponde
   * @param {number} time - Timestamp actual del juego
   */
  spawnEnemies(time) {
    // No spawnear si no hay oleada activa o está pausada
    if (!this.waveSystem.isActive || this.waveSystem.isPaused) return;
    if (this.waveSystem.startTime === 0) return;

    // Verificar si terminó el tiempo de la oleada
    const elapsedTime = time - this.waveSystem.startTime;
    if (elapsedTime >= this.waveSystem.duration) {
      this.endWave();
      return;
    }

    // No spawnear si ya hay suficientes enemigos
    if (this.enemies.countActive(true) >= this.enemiesInWave) return;
    
    // Verificar si pasó suficiente tiempo desde el último spawn
    if (time - this.waveSystem.lastSpawnTime < this.waveSystem.enemySpawnRate)
      return;

    // Spawnear enemigo
    this.waveSystem.lastSpawnTime = time;
    this.spawnRandomEnemy();
  }

  /**
   * Spawnea un enemigo aleatorio desde los bordes del mapa
   * El tipo de enemigo depende de la oleada actual
   */
  spawnRandomEnemy() {
    // Elegir un lado aleatorio del mapa (0=arriba, 1=derecha, 2=abajo, 3=izquierda)
    const side = Phaser.Math.Between(0, 3);
    const margin = 100; // Distancia desde el borde
    const mapSize = 2000;
    let x, y;

    // Calcular posición según el lado elegido
    switch (side) {
      case 0: // Arriba
        x = Phaser.Math.Between(margin, mapSize - margin);
        y = margin;
        break;
      case 1: // Derecha
        x = mapSize - margin;
        y = Phaser.Math.Between(margin, mapSize - margin);
        break;
      case 2: // Abajo
        x = Phaser.Math.Between(margin, mapSize - margin);
        y = mapSize - margin;
        break;
      case 3: // Izquierda
        x = margin;
        y = Phaser.Math.Between(margin, mapSize - margin);
        break;
    }

    let enemy;

    // SISTEMA DE PROGRESIÓN DE ENEMIGOS
    // Diferentes tipos según la oleada actual
    
    if (this.currentWave < 3) {
      // Oleadas 1-2: Solo murciélagos (enemigos básicos)
      enemy = new Bat(this, x, y, this.player);
      
    } else if (this.currentWave < 5) {
      // Oleadas 3-4: Murciélagos y Ojos (50/50)
      const type = Phaser.Math.Between(0, 1);
      enemy =
        type === 0
          ? new Bat(this, x, y, this.player)
          : new Eyeball(this, x, y, this.player);
          
    } else if (this.currentWave < 8) {
      // Oleadas 5-7: Mix de Bat (40%), Eyeball (30%), Shooter (30%)
      const roll = Phaser.Math.Between(0, 9);
      if (roll < 4) enemy = new Bat(this, x, y, this.player);
      else if (roll < 7) enemy = new Eyeball(this, x, y, this.player);
      else enemy = new Shooter(this, x, y, this.player);
      
    } else {
      // Oleada 8+: Todos los tipos incluyendo Shadow (30%, 20%, 20%, 30%)
      const roll = Phaser.Math.Between(0, 9);
      if (roll < 3) enemy = new Bat(this, x, y, this.player);
      else if (roll < 5) enemy = new Eyeball(this, x, y, this.player);
      else if (roll < 7) enemy = new Shooter(this, x, y, this.player);
      else enemy = new Shadow(this, x, y, this.player);
    }

    // Agregar enemigo al grupo
    this.enemies.add(enemy);
  }

  /**
   * Genera una moneda en la posición especificada
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   */
  dropCoin(x, y) {
    const coin = this.physics.add.sprite(x, y, "coin");
    coin.setScale(1.5);
    coin.value = Phaser.Math.Between(5, 10); // Valor aleatorio entre 5-10
    coin.play("coin_spin"); // Animación de giro
    this.coinDrops.add(coin);

    // Moneda desaparece después de 10 segundos si no se recoge
    this.time.delayedCall(10000, () => {
      if (coin.active) coin.destroy();
    });
  }

  /**
   * Callback cuando el jugador recoge una moneda
   * @param {Phaser.GameObjects.Sprite} player - Jugador
   * @param {Phaser.GameObjects.Sprite} coin - Moneda
   */
  collectCoin(player, coin) {
    // Sumar valor de la moneda
    this.coins += coin.value || 10;
    this.stats.coinsEarned += coin.value || 10;
    PlayerData.addScore(coin.value || 10);

    // Reproducir sonido de recolección
    if (!this.hudScene.getSFXMuted()) {
      this.sound.play("coin_collect", { volume: 1, seek: 0.2 });
    }

    // Eliminar moneda
    coin.destroy();
    this.updateHUD();
  }

  /**
   * Callback cuando el jugador dispara
   * Crea una bala física y la lanza en la dirección indicada
   * @param {Object} bulletData - Datos de la bala (posición, ángulo, velocidad)
   */
  handlePlayerShoot(bulletData) {
    // Obtener bala del pool o crear nueva
    const bullet = this.bullets.get(bulletData.x, bulletData.y, "bullet");

    if (bullet) {
      bullet.setActive(true).setVisible(true);
      bullet.body.reset(bulletData.x, bulletData.y);
      bullet.setRotation(bulletData.angle);

      // 🎯 DAÑO FIJO: Siempre 25 (pistola base)
      // Los multiplicadores de daño no se aplican actualmente
      bullet.damage = 25;

      // Calcular velocidad según el ángulo de disparo
      const velocity = this.physics.velocityFromRotation(
        bulletData.angle,
        bulletData.velocity
      );
      bullet.setVelocity(velocity.x, velocity.y);

      // Reproducir sonido de disparo
      if (!this.hudScene.getSFXMuted()) {
        this.sound.play("hand_gun_shoot", { volume: 0.2 });
      }
    }
  }

  /**
   * Callback cuando el jugador recarga
   * Reproduce sonidos de recarga
   */
  handlePlayerReload() {
    if (!this.hudScene.getSFXMuted()) {
      // Dos sonidos de recarga superpuestos para efecto
      this.sound.play("hand_gun_reload", { volume: 0.2, seek: 0.9 });
      this.sound.play("hand_gun_reload", { volume: 0.2, seek: 0.5 });
    }
  }

  /**
   * Toggle de música (callback del HUD)
   * @param {boolean} isMuted - Si está silenciado
   */
  handleMusicToggle(isMuted) {
    if (isMuted) {
      this.level1Music.pause();
    } else {
      this.level1Music.resume();
    }
  }

  /**
   * Toggle de efectos de sonido (callback del HUD)
   * @param {boolean} isMuted - Si está silenciado
   */
  handleSFXToggle(isMuted) {
    // Los SFX se verifican individualmente en cada sonido
    // Este método existe por consistencia pero no hace nada
  }

  /**
   * Loop principal del juego
   * Se ejecuta 60 veces por segundo
   * @param {number} time - Timestamp actual
   * @param {number} delta - Milisegundos desde el último frame
   */
  update(time, delta) {
    // ============================================
    // ⏸️ SISTEMA DE PAUSA CON ESC
    // ============================================
    if (this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) {
      // Lanzar menú de pausa
      this.scene.launch("PauseScene", {
        gameScene: this,
        playerData: PlayerData,
      });
      this.scene.pause(); // Pausar esta escena
    }

    // ============================================
    // 🛑 EARLY RETURNS (no procesar si está pausado/game over)
    // ============================================
    if (
      this.isPaused ||
      this.waveSystem?.isPaused ||
      !this.playerController || // Prevenir crash si no existe el controlador
      this.isGameOver
    ) {
      return;
    }

    // ============================================
    // 🏃 APLICAR BOOST DE VELOCIDAD
    // ============================================
    const baseSpeed = 200;
    const boostedSpeed = baseSpeed * (this.activeBoosts?.speedMultiplier || 1);

    // ============================================
    // 🕹️ ACTUALIZAR CONTROLADOR DEL JUGADOR
    // ============================================
    const inputState = this.playerController?.update();
    if (!inputState) return; // Safety check

    // Verificar teclas de audio (M para música, N para SFX)
    if (inputState.musicKeyPressed) {
      this.hudScene.toggleMusic();
    }
    if (inputState.sfxKeyPressed) {
      this.hudScene.toggleSFX();
    }

    // ============================================
    // 👾 ACTUALIZAR ENEMIGOS
    // ============================================
    // Cada enemigo tiene su propio método update()
    this.enemies.children.each((enemy) => {
      if (enemy.active && enemy.update) {
        enemy.update(time, delta);
      }
    });

    // ============================================
    // 🌊 SISTEMA DE SPAWN Y HUD
    // ============================================
    this.spawnEnemies(time);
    this.updateHUD();
  }

  /**
   * Callback cuando una bala del jugador impacta a un enemigo
   * @param {Phaser.Physics.Arcade.Image} bullet - Bala
   * @param {Phaser.GameObjects.Sprite} enemy - Enemigo
   */
  bulletHitEnemy(bullet, enemy) {
    if (!bullet.active || !enemy.active) return;

    // 🐛 DEBUG: Registrar daño (puede comentarse en producción)
    const vidaAntes = enemy.health;

    // Aplicar daño al enemigo
    enemy.health -= bullet.damage || 25;

    console.log(
      `💥 Enemigo golpeado - Vida antes: ${vidaAntes}, Daño: ${
        bullet.damage || 25
      }, Vida después: ${enemy.health}`
    );

    // Efecto visual de daño (tinte rojo breve)
    enemy.setTint(0xff0000);
    this.time.delayedCall(100, () => {
      if (enemy.active) enemy.clearTint();
    });

    // Desactivar bala
    bullet.setActive(false).setVisible(false);

    // ============================================
    // ☠️ VERIFICAR SI EL ENEMIGO MURIÓ
    // ============================================
    if (enemy.health <= 0) {
      console.log(`☠️ Enemigo eliminado`);
      
      // Limpiar barra de vida
      if (enemy.healthBar) enemy.healthBar.destroy();
      
      // Llamar método de muerte del enemigo (animación, etc.)
      if (enemy.die) enemy.die();

      // Dropear moneda en la posición del enemigo
      this.dropCoin(enemy.x, enemy.y);

      // Eliminar enemigo
      enemy.destroy();
      
      // Actualizar estadísticas
      this.stats.totalKills++;
      PlayerData.addKills(1);
    }
  }

  /**
   * Callback cuando el jugador toca a un enemigo (daño por contacto)
   * @param {Phaser.GameObjects.Sprite} player - Jugador
   * @param {Phaser.GameObjects.Sprite} enemy - Enemigo
   */
  playerHitEnemy(player, enemy) {
    if (!player.active || !enemy.active) return;

    const now = this.time.now;

    // ============================================
    // ⏱️ COOLDOWN DE DAÑO (1 segundo entre ataques)
    // ============================================
    if (!enemy.lastAttackTime) {
      enemy.lastAttackTime = 0;
    }

    if (now - enemy.lastAttackTime >= 1000) {
      enemy.lastAttackTime = now;

      // ============================================
      // 🛡️ VERIFICAR ESCUDO ACTIVO
      // ============================================
      if (this.activeBoosts.hasShield && this.activeBoosts.shieldHits > 0) {
        // Reducir hits del escudo
        this.activeBoosts.shieldHits--;
        if (this.activeBoosts.shieldHits <= 0) {
          this.activeBoosts.hasShield = false;
        }

        // Efecto visual de escudo (tinte cyan)
        player.setTint(0x00ffff);

        // Sonido de bloqueo
        if (!this.hudScene.getSFXMuted()) {
          this.sound.play("shield_block", { volume: 0.3 });
        }

        this.time.delayedCall(200, () => {
          if (player.active) player.clearTint();
        });
        return; // No aplicar daño si hay escudo
      }

      // ============================================
      // 💔 APLICAR DAÑO AL JUGADOR
      // ============================================
      player.health -= enemy.damage;
      player.health = Math.max(0, player.health);

      // Guardar vida actualizada
      PlayerData.setHealth(player.health);
      this.updateHUD();

      // ============================================
      // 🎨 EFECTO VISUAL DE DAÑO (parpadeo rojo)
      // ============================================
      player.setTint(0xff0000);
      
      // Reproducir sonido de daño
      if (!this.hudScene.getSFXMuted()) {
        this.sound.play("player_hit", { volume: 0.3 });
      }

      // Secuencia de parpadeo (rojo -> normal -> rojo -> normal)
      this.time.delayedCall(100, () => {
        if (player.active) player.clearTint();
        this.time.delayedCall(100, () => {
          if (player.active) player.setTint(0xff0000);
          this.time.delayedCall(100, () => {
            if (player.active) player.clearTint();
          });
        });
      });

      // ============================================
      // ☠️ VERIFICAR GAME OVER
      // ============================================
      if (player.health <= 0) {
        if (!this.hudScene.getSFXMuted()) {
          this.sound.play("player_death", { volume: 0.5 });
        }
        this.gameOver();
      }
    }
  }

  /**
   * Callback cuando el jugador es golpeado por una bala enemiga
   * @param {Phaser.GameObjects.Sprite} player - Jugador
   * @param {Phaser.Physics.Arcade.Image} bullet - Bala enemiga
   */
  playerHitByBullet(player, bullet) {
    if (!bullet.active) return;

    // ============================================
    // 🛡️ VERIFICAR ESCUDO
    // ============================================
    if (this.activeBoosts.hasShield && this.activeBoosts.shieldHits > 0) {
      this.activeBoosts.shieldHits--;
      if (this.activeBoosts.shieldHits <= 0) {
        this.activeBoosts.hasShield = false;
      }

      player.setTint(0x00ffff);
      if (!this.hudScene.getSFXMuted()) {
        this.sound.play("shield_block", { volume: 0.3 });
      }

      this.time.delayedCall(200, () => {
        if (player.active) player.clearTint();
      });

      bullet.destroy();
      return;
    }

    // ============================================
    // 💔 APLICAR DAÑO DE LA BALA
    // ============================================
    const damage = bullet.damage || 10;
    player.health -= damage;
    player.health = Math.max(0, player.health);

    PlayerData.setHealth(player.health);
    this.updateHUD();

    // Efecto visual de daño
    player.setTint(0xff0000);
    if (!this.hudScene.getSFXMuted()) {
      this.sound.play("player_hit", { volume: 0.3 });
    }

    // Secuencia de parpadeo
    this.time.delayedCall(100, () => {
      if (player.active) player.clearTint();
      this.time.delayedCall(100, () => {
        if (player.active) player.setTint(0xff0000);
        this.time.delayedCall(100, () => {
          if (player.active) player.clearTint();
        });
      });
    });

    // Destruir bala
    bullet.destroy();

    // Verificar game over
    if (player.health <= 0) {
      if (!this.hudScene.getSFXMuted()) {
        this.sound.play("player_death", { volume: 0.5 });
      }
      this.gameOver();
    }
  }

  /**
   * Limpieza cuando la escena se detiene (shutdown event)
   * Previene memory leaks removiendo todos los listeners y recursos
   */
  onShutdown() {
    try {
      // ============================================
      // 📡 REMOVER EVENT LISTENERS DE LA ESCENA
      // ============================================
      this.events.off("playerShoot", this.handlePlayerShoot, this);
      this.events.off("playerReload", this.handlePlayerReload, this);
      this.events.off("shopClosed", this.handleShopClosed, this);

      // ============================================
      // 🎮 REMOVER EVENT LISTENERS GLOBALES
      // ============================================
      this.game.events.off("toggleMusic", this.handleMusicToggle, this);
      this.game.events.off("toggleSFX", this.handleSFXToggle, this);

      // ============================================
      // 🕹️ DESTRUIR CONTROLADOR
      // ============================================
      if (this.playerController) {
        this.playerController.destroy();
        this.playerController = null;
      }

      // ============================================
      // 🎵 PARAR Y DESTRUIR MÚSICA
      // ============================================
      if (this.level1Music) {
        try {
          this.level1Music.stop();
          this.level1Music.destroy();
        } catch (e) {
          // Silenciar errores si ya fue destruida
        }
        this.level1Music = null;
      }

      // ============================================
      // 🎬 LIMPIAR TWEENS Y TIMERS
      // ============================================
      if (this.tweens) this.tweens.killAll();
      if (this.time) this.time.removeAllEvents();

      // ============================================
      // 👾 LIMPIAR GRUPOS DE FÍSICA
      // ============================================
      if (this.enemies) this.enemies.clear(true, true);
      if (this.bullets) this.bullets.clear(true, true);
      if (this.enemyBullets) this.enemyBullets.clear(true, true);
      if (this.coinDrops) this.coinDrops.clear(true, true);

      // ============================================
      // ⌨️ REMOVER INPUT LISTENERS
      // ============================================
      try {
        this.input.removeAllListeners();
      } catch (e) {
        // Silenciar errores
      }
    } catch (e) {
      console.warn("onShutdown error:", e);
    }
  }

  /**
   * Limpieza cuando la escena es destruida (destroy event)
   * Llama a la misma lógica de onShutdown
   */
  onDestroy() {
    this.onShutdown();
  }

  /**
   * Termina el juego cuando el jugador muere
   * Calcula estadísticas finales y cambia a GameOverScene
   */
  gameOver() {
    // Prevenir múltiples llamadas
    if (this.isGameOver) return;
    this.isGameOver = true;

    // ============================================
    // 🧹 LIMPIEZA INMEDIATA DE INPUT
    // ============================================
    this.input.removeAllListeners();
    if (this.playerController) {
      this.playerController.destroy?.();
      this.playerController = null;
    }

    // ============================================
    // ⏸️ PAUSAR TODO
    // ============================================
    this.physics.pause();
    this.level1Music?.stop();

    // ============================================
    // 📊 CALCULAR ESTADÍSTICAS FINALES
    // ============================================
    this.stats.survivalTime = Math.floor(
      (Date.now() - this.stats.startTime) / 1000
    );

    const finalStats = {
      survivalTime: this.stats.survivalTime,
      totalKills: this.stats.totalKills,
      highestWave: this.stats.highestWave,
      coinsEarned: this.stats.coinsEarned,
      weapon: this.currentWeapon || "Desconocida",
      finalHealth: 0,
      timestamp: Date.now(),
    };

    // ============================================
    // 🔄 RESETEAR PROGRESO DEL JUGADOR
    // ============================================
    PlayerData.reset();

    // ============================================
    // 🎬 DETENER ESCENAS ADICIONALES Y CAMBIAR A GAME OVER
    // ============================================
    this.scene.stop("HUDScene");
    this.scene.stop("ShopScene");
    this.scene.start("GameOverScene", { stats: finalStats });
  }
}