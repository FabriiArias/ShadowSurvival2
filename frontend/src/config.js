import BootScene from "./scenes/BootScene.js";
import PreloadScene from "./scenes/PreloadScene.js";
import LoginScene from "./scenes/LoginScene.js";
import MenuScene from "./scenes/MenuScene.js";
import GameScene from "./scenes/GameScene.js";
import HudScene from "./scenes/HudScene.js";
import ShopScene from "./scenes/ShopScene.js";
import PauseScene from "./scenes/PauseScene.js";
import GameOverScene from "./scenes/GameOverScene.js";
import RegisterScene from "./scenes/RegisterScene.js";
import Phaser from "phaser";

export default {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#000",
  parent: "game-container",

  physics: {
    default: "arcade",
    arcade: { debug: false }
  },

  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },

  scene: [
    BootScene,
    PreloadScene,
    LoginScene,
    RegisterScene,
    MenuScene,
    GameScene,
    PauseScene,
    HudScene,
    ShopScene,
    GameOverScene
  ]
};
