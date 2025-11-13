// src/scenes/BootScene.js
import Phaser from "phaser";
export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }
  preload(){
    
  }
  create() {
    this.scene.start('PreloadScene');
  }
}
