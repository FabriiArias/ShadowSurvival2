// PlayerData.js - Almacena datos persistentes del jugador entre niveles
import Phaser from "phaser";
class PlayerData {
  constructor() {
    // Estadisticas del jugador
    this.health = 100;
    this.maxHealth = 100;
    
    // Arma actual (pistol, shotgun, rifle, etc.)
    this.currentWeapon = 'pistol';
    
    // PowerUps activos
    this.powerUps = [];
    
    // Estadisticas generales
    this.totalScore = 0;
    this.totalKills = 0;
    this.currentLevel = 1;
    this.highestWave = 1;
  }

  // Actualiza la vida del jugador
  setHealth(health) {
    this.health = Math.max(0, Math.min(health, this.maxHealth));
  }

  // Aumenta la vida maxima (por powerups)
  increaseMaxHealth(amount) {
    this.maxHealth += amount;
    this.health = Math.min(this.health + amount, this.maxHealth);
  }

  // Cura al jugador
  heal(amount) {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }

  // Recibe daño
  takeDamage(damage) {
    this.health = Math.max(0, this.health - damage);
    return this.health <= 0;
  }

  // Cambia el arma actual
  setWeapon(weaponType) {
    this.currentWeapon = weaponType;
  }

  // Añade un powerup
  addPowerUp(powerUp) {
    this.powerUps.push(powerUp);
  }

  // Remueve un powerup
  removePowerUp(powerUpName) {
    this.powerUps = this.powerUps.filter(p => p.name !== powerUpName);
  }

  // Limpia powerups temporales
  clearTemporaryPowerUps() {
    this.powerUps = this.powerUps.filter(p => p.permanent);
  }

  // Añade kills al contador
  addKills(amount) {
    this.totalKills += amount;
  }

  // Añade puntos al score
  addScore(points) {
    this.totalScore += points;
  }

  // Actualiza el nivel actual
  setLevel(level) {
    this.currentLevel = level;
  }

  // Actualiza la oleada mas alta alcanzada
  updateHighestWave(wave) {
    if (wave > this.highestWave) {
      this.highestWave = wave;
    }
  }

  // Resetea todos los datos (para nuevo juego)
  reset() {
    this.health = 100;
    this.maxHealth = 100;
    this.currentWeapon = 'pistol';
    this.powerUps = [];
    this.totalScore = 0;
    this.totalKills = 0;
    this.currentLevel = 1;
    this.highestWave = 1;
  }

  // Resetea solo para nuevo nivel (mantiene progreso)
  resetForNewLevel() {
    this.clearTemporaryPowerUps();
  }

  // Obtiene un resumen del estado actual
  getSummary() {
    return {
      health: this.health,
      maxHealth: this.maxHealth,
      weapon: this.currentWeapon,
      powerUps: this.powerUps.length,
      score: this.totalScore,
      kills: this.totalKills,
      level: this.currentLevel,
      highestWave: this.highestWave
    };
  }
}

// Exportar como singleton
export default new PlayerData();