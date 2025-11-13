// src/scenes/PreloadScene.js
import Phaser from "phaser";

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // ===== GENERAL ASSETS =====
    // Background
    this.load.image('background', '../assets/backgrounds/bg.png');

    // ===== PLAYER ASSETS =====
    // Player animations
    this.load.spritesheet('player_walk', './assets/player/walking.png', {
      frameWidth: 1035 / 4,
      frameHeight: 1104 / 5
    });
    this.load.spritesheet('player_shoot', './assets/player/shooting.png', {
      frameWidth: 255,
      frameHeight: 255,
    });
    this.load.spritesheet('player_reload', './assets/player/reload.png', {
      frameWidth: 1043 / 4,
      frameHeight: 923 / 4,
    });
    // Player weapons
    this.load.image('bullet', '/assets/player/bullet2.png');

    // ===== ENEMY ASSETS =====
    // Bat enemy
    this.load.spritesheet('bat', '/assets/enemys/bat2.png', {
      frameWidth: 150,
      frameHeight: 150
    });
    // Eyeball enemy
    this.load.spritesheet('eyeball', '/assets/enemys/eyeball.png', {
      frameWidth: 75,
      frameHeight: 75
    });

    // Shadow enemy
    this.load.spritesheet('shadow_run', '/assets/enemys/shadow_run.png', {
      frameWidth: 128 / 4,
      frameHeight: 64
    });
    this.load.spritesheet('shadow_attack', '/assets/enemys/shadow_attack.png', {
      frameWidth: 1096 / 8,
      frameHeight: 40
    });

    // Shooter enemy
    this.load.spritesheet('shooter_walk', '/assets/enemys/shooter_walk.png', {
      frameWidth: 2260 / 5,
      frameHeight: 762 /2 
    });
    this.load.spritesheet('shooter_attack', '/assets/enemys/shooter_attack.png', {
      frameWidth: 3525 / 5,
      frameHeight: 1512 /2 
    });
    // enemy bulet
    this.load.image('enemy_bullet', '/assets/enemys/shooter_mage.png');

    //cris
    this.load.spritesheet('cris', '/assets/enemys/cris.png', {
      frameWidth: 992 / 4,
      frameHeight: 1056 /3
    });
    // sonido cris
    this.load.audio('cris_die', '/assets/sounds/enemy/ahhh.mp3');

    // ===== COLLECTIBLE ASSETS =====
    // Coins
    this.load.spritesheet('coin', '/assets/items/coin_silver.png', {
      frameWidth: 32,
    });

    // ===== AUDIO ASSETS =====
    // Music
    this.load.audio('level1_music', '/assets/sounds/music/level1.mp3');
    // Player sounds
    this.load.audio('hand_gun_shoot', '/assets/sounds/player/shoot1.mp3');
    this.load.audio('hand_gun_reload', '/assets/sounds/player/gunreload1.wav');
    // Enemy sounds
    this.load.audio('bat_die', '/assets/sounds/enemy/bat_die.mp3');
    this.load.audio('eyeball_die', '/assets/sounds/enemy/eyeball_die.mp3');
    // Collectible sounds
    this.load.audio('coin_collect', '/assets/sounds/ui/coin_collect.wav');
    // buy sound 
    this.load.audio('buy_sound', '/assets/sounds/ui/buy_sound.wav');
    // error audio
    this.load.audio('shop_error', '/assets/sounds/ui/error.ogg');
    // audio shield
    this.load.audio('shield_block', '/assets/sounds/ui/shield.ogg');
    // danio al player sound
    this.load.audio('player_hit', '/assets/sounds/player/player_hit.wav');
    // sonido de muerte del player
    this.load.audio('player_death', '/assets/sounds/player/player_death.wav');
    // shadow_death
    this.load.audio('shadow_death', '/assets/sounds/enemy/shadow_death.mp3')
    // shadow_attack
    this.load.audio('shadow_attack', '/assets/sounds/enemy/shadow_32.mp3')
    // shoter all sounds
    this.load.audio('shooter_sounds', '/assets/sounds/enemy/shooter_sounds.mp3')

    // assets menu
    this.load.image("menu_bg", "/assets/backgrounds/menu_bg3.png"); 
    this.load.audio("menu_music", "/assets/sounds/music/menu_theme.wav");
  }

  create() {
    this.scene.start('LoginScene');
  }
}