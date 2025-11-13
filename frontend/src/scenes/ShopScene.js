import PlayerData from "../systems/PlayerData.js";
import Phaser from "phaser";

export default class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' });
  }

  init(data) {
    // Recibir datos del GameScene
    this.gameScene = data.gameScene;
    this.currentWave = data.currentWave;
    this.coins = data.coins;
    this.playerHealth = data.playerHealth;
    this.playerMaxHealth = data.playerMaxHealth;
    this.totalKills = data.totalKills;
    this.currentWeapon = data.currentWeapon;
    this.activeBoosts = data.activeBoosts;
    this.hudScene = data.hudScene;
  }

  create() {
    // Obtener dimensiones reales de la cámara
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    // Overlay oscuro
    const overlay = this.add.rectangle(
      centerX,
      centerY,
      width,
      height,
      0x000000,
      0.85
    ).setDepth(10000);

    // Contenedor principal para todos los elementos del shop
    const shopContainer = this.add.container(centerX, centerY).setDepth(10001);

    const styles = {
      title: { 
        fontSize: '52px', 
        color: '#00ff00', 
        stroke: '#000', 
        strokeThickness: 5, 
        fontStyle: 'bold' 
      },
      subtitle: { 
        fontSize: '24px', 
        color: '#ffff00', 
        stroke: '#000', 
        strokeThickness: 3, 
        align: 'center' 
      },
      stats: { 
        fontSize: '22px', 
        color: '#ffffff', 
        stroke: '#000', 
        strokeThickness: 3, 
        align: 'center' 
      },
      continueButton: { 
        fontSize: '32px', 
        color: '#ffffff', 
        backgroundColor: '#00aa00', 
        padding: { x: 35, y: 18 }, 
        stroke: '#000', 
        strokeThickness: 5, 
        fontStyle: 'bold' 
      }
    };

    // Títulos
    const title = this.add.text(0, -260, `OLEADA ${this.currentWave} COMPLETADA!`, styles.title)
      .setOrigin(0.5);
    const subtitle = this.add.text(0, -200, 'TIENDA DE MEJORAS', styles.subtitle)
      .setOrigin(0.5);
    
    // Panel de estadísticas
    this.statsPanel = this.add.text(
      0, -150,
      `💰 Monedas: ${this.coins}     ❤️ Vida: ${this.playerHealth}/${this.playerMaxHealth}     💀 Kills: ${this.totalKills}`,
      styles.stats
    ).setOrigin(0.5);

    shopContainer.add([title, subtitle, this.statsPanel]);

    // Configuración de grid para items
    const gridConfig = {
      startX: -280,
      startY: -60,
      spacingX: 140,
      spacingY: 110,
      columns: 4
    };

    let upgradeIndex = 0;

    // === CURACIÓN ===
    this.createShopItem(shopContainer, gridConfig, upgradeIndex++, {
      icon: '❤️',
      title: 'CURACION',
      description: '+25 HP',
      cost: 50,
      callback: () => {
        if (this.coins >= 50 && this.playerHealth < this.playerMaxHealth) {
          this.coins -= 50;
          this.playerHealth = Math.min(this.playerHealth + 25, this.playerMaxHealth);
          PlayerData.setHealth(this.playerHealth);
          PlayerData.addScore(-50);
          this.updateStats();
          return true;
        }
        return false;
      }
    });

    // === VIDA MÁXIMA ===
    this.createShopItem(shopContainer, gridConfig, upgradeIndex++, {
      icon: '💚',
      title: 'VIDA MAX',
      description: '+25 Max HP',
      cost: 75,
      callback: () => {
        if (this.coins >= 75) {
          this.coins -= 75;
          this.playerMaxHealth += 25;
          this.playerHealth = Math.min(this.playerHealth + 25, this.playerMaxHealth);
          PlayerData.increaseMaxHealth(25);
          PlayerData.setHealth(this.playerHealth);
          PlayerData.addScore(-75);
          this.updateStats();
          return true;
        }
        return false;
      }
    });

    // === DAÑO ===
    this.createShopItem(shopContainer, gridConfig, upgradeIndex++, {
      icon: '⚔️',
      title: 'DAÑO',
      description: '+20%',
      cost: 100,
      callback: () => {
        if (this.coins >= 100) {
          this.coins -= 100;
          this.activeBoosts.damageMultiplier += 0.2;
          PlayerData.addScore(-100);
          this.updateStats();
          return true;
        }
        return false;
      }
    });

    // === VELOCIDAD ===
    this.createShopItem(shopContainer, gridConfig, upgradeIndex++, {
      icon: '⚡',
      title: 'VELOCIDAD',
      description: '+15%',
      cost: 80,
      callback: () => {
        if (this.coins >= 80) {
          this.coins -= 80;
          this.activeBoosts.speedMultiplier += 0.15;
          PlayerData.addScore(-80);
          this.updateStats();
          return true;
        }
        return false;
      }
    });

    // === ESCUDO ===
    this.createShopItem(shopContainer, gridConfig, upgradeIndex++, {
      icon: '🛡️',
      title: 'ESCUDO',
      description: '3 golpes',
      cost: 120,
      callback: () => {
        if (this.coins >= 120) {
          this.coins -= 120;
          this.activeBoosts.hasShield = true;
          this.activeBoosts.shieldHits = 3;
          PlayerData.addScore(-120);
          this.updateStats();
          return true;
        }
        return false;
      }
    });

    // === ARMA CADA 5 OLEADAS ===
     /*
    if (this.currentWave % 5 === 0 && this.currentWave > 0) {
      const nextWeapon = this.getNextWeapon();
      if (nextWeapon !== this.currentWeapon) {
        const weaponIcons = { pistol: '🔫', shotgun: '💥', rifle: '🎯' };
        const weaponNames = { pistol: 'PISTOLA', shotgun: 'ESCOPETA', rifle: 'RIFLE' };

        this.createShopItem(shopContainer, gridConfig, upgradeIndex++, {
          icon: weaponIcons[nextWeapon] || '🔫',
          title: 'NUEVA ARMA',
          description: weaponNames[nextWeapon] || nextWeapon.toUpperCase(),
          cost: this.getWeaponCost(nextWeapon),
          special: true,
          callback: () => {
            const cost = this.getWeaponCost(nextWeapon);
            if (this.coins >= cost) {
              this.coins -= cost;
              this.currentWeapon = nextWeapon;
              PlayerData.setWeapon(nextWeapon);
              PlayerData.addScore(-cost);
              this.updateStats();
              return true;
            }
            return false;
          }
        });
      }
    }  */

    // === BOTÓN CONTINUAR ===
    const continueBtn = this.add.text(0, 220, 'CONTINUAR OLEADA ▶', styles.continueButton)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    continueBtn.on('pointerdown', () => {
      // Cerrar la tienda
      this.scene.stop();
      
      // Retornar datos actualizados al GameScene
      this.gameScene.events.emit('shopClosed', {
        coins: this.coins,
        playerHealth: this.playerHealth,
        playerMaxHealth: this.playerMaxHealth,
        currentWeapon: this.currentWeapon,
        activeBoosts: this.activeBoosts
      });
    });

    continueBtn.on('pointerover', () => continueBtn.setScale(1.05));
    continueBtn.on('pointerout', () => continueBtn.setScale(1));

    shopContainer.add(continueBtn);

    // Guardar referencias para limpieza
    this.shopElements = [overlay, shopContainer];
  }

  createShopItem(container, gridConfig, index, config) {
    const col = index % gridConfig.columns;
    const row = Math.floor(index / gridConfig.columns);
    const x = gridConfig.startX + (col * gridConfig.spacingX);
    const y = gridConfig.startY + (row * gridConfig.spacingY);

    const itemContainer = this.add.container(x, y);

    // Fondo del item
    const itemBg = this.add.rectangle(
      0, 0, 120, 95,
      config.special ? 0xffaa00 : 0x2c5aa0,
      0.9
    );
    itemBg.setStrokeStyle(3, config.special ? 0xffff00 : 0xffffff);

    // Icono
    const icon = this.add.text(0, -30, config.icon, {
      fontSize: '32px'
    }).setOrigin(0.5);

    // Título
    const title = this.add.text(0, -2, config.title, {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    // Descripción
    const desc = this.add.text(0, 12, config.description, {
      fontSize: '11px',
      color: '#cccccc',
      align: 'center'
    }).setOrigin(0.5);

    // Costo
    const cost = this.add.text(0, 32, `💰 ${config.cost}`, {
      fontSize: '14px',
      color: config.special ? '#ffff00' : '#00ff00',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    itemContainer.add([itemBg, icon, title, desc, cost]);

    // Hacer interactivo el fondo
    itemBg.setInteractive({ useHandCursor: true });
    
    itemBg.on('pointerdown', () => {
      const purchased = config.callback();
      
      if (purchased) {
        // COMPRA EXITOSA
        this.tweens.add({
          targets: itemContainer,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 100,
          yoyo: true
        });
        
        // REPRODUCIR SONIDO DE COMPRA EXITOSA
        if (this.hudScene && !this.hudScene.getSFXMuted()) {
          this.sound.play('buy_sound', { volume: 0.5, seek: 2 });
        }
        
      } else {
        // NO HAY SUFICIENTE DINERO
        this.tweens.add({
          targets: itemContainer,
          x: x + 5,
          duration: 50,
          yoyo: true,
          repeat: 3
        });
        
        // REPRODUCIR SONIDO DE ERROR
        if (this.hudScene && !this.hudScene.getSFXMuted()) {
          // Necesitas agregar un sonido de error
          this.sound.play('shop_error', { volume: 1 });
          console.log("¡No tienes suficiente dinero!");
        }
      }
    });

    itemBg.on('pointerover', () => {
      itemBg.setFillStyle(config.special ? 0xffcc00 : 0x3d7bc7, 1);
      itemContainer.setScale(1.05);
    });
    
    itemBg.on('pointerout', () => {
      itemBg.setFillStyle(config.special ? 0xffaa00 : 0x2c5aa0, 0.9);
      itemContainer.setScale(1);
    });

    container.add(itemContainer);
  }

  updateStats() {
    if (this.statsPanel) {
      this.statsPanel.setText(
        `💰 Monedas: ${this.coins}     ❤️ Vida: ${this.playerHealth}/${this.playerMaxHealth}     💀 Kills: ${this.totalKills}`
      );
    }
  }

  getNextWeapon() {
    const weaponTree = ['pistol', 'shotgun', 'rifle'];
    const currentIndex = weaponTree.indexOf(this.currentWeapon);
    return weaponTree[currentIndex + 1] || 'rifle';
  }

  getWeaponCost(weapon) {
    const costs = {
      'shotgun': 300,
      'rifle': 500
    };
    return costs[weapon] || 500;
  }

  // Limpieza al cerrar la escena
  shutdown() {
    if (this.shopElements) {
      this.shopElements.forEach(element => {
        if (element && element.destroy) {
          element.destroy();
        }
      });
      this.shopElements = [];
    }
  }
}