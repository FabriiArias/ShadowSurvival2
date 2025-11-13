import Phaser from "phaser";
import UIManager from "../managers/UIManager";
import { authApi } from "../utils/api";
import { storage } from "../utils/storage";
import "../ui/ui-base.css";

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super({ key: "LoginScene" });
  }

  create() {
    const { width, height } = this.cameras.main;
    this.add.rectangle(0, 0, width, height, 0x0d0d20).setOrigin(0);

    UIManager.load("login-screen", "login.html").then(() => {
      UIManager.show("login-screen");

      document.getElementById("login-btn").onclick = () => this.handleLogin();
      document.getElementById("goto-register").onclick = () => {
        UIManager.hide("login-screen");
        this.scene.start("RegisterScene");
      };
    });
  }

  async handleLogin() {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();
    const errorBox = document.getElementById("login-error");

    if (!email || !password) {
      errorBox.textContent = "Complete todos los campos";
      return;
    }

    try {
      const res = await authApi.login(email, password);
      storage.setUser(res.data);

      UIManager.hide("login-screen");
      this.scene.start("MenuScene");
    } catch (err) {
      errorBox.textContent = err?.message || "Error al iniciar sesión";
    }
  }
}
