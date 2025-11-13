import Phaser from "phaser";
import UIManager from "../managers/UIManager";
import { authApi } from "../utils/api";
import "../ui/ui-base.css";

export default class RegisterScene extends Phaser.Scene {
  constructor() {
    super({ key: "RegisterScene" });
  }

  create() {
    const { width, height } = this.cameras.main;
    this.add.rectangle(0, 0, width, height, 0x0d0d20).setOrigin(0);

    UIManager.load("register-screen", "register.html").then(() => {
      UIManager.show("register-screen");

      document.getElementById("register-btn").onclick = () => this.handleRegister();
      document.getElementById("goto-login").onclick = () => {
        UIManager.hide("register-screen");
        this.scene.start("LoginScene");
      };
    });
  }

  async handleRegister() {
    const username = document.getElementById("reg-username").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value.trim();
    const confirm = document.getElementById("reg-confirm").value.trim();
    const errorBox = document.getElementById("register-error");

    // 🔹 Validaciones front simples
    if (!username || !email || !password || !confirm) {
      errorBox.textContent = "Complete todos los campos";
      return;
    }

    if (password !== confirm) {
      errorBox.textContent = "Las contraseñas no coinciden";
      return;
    }

    try {
      // 🔹 Llamada al backend con authApi.register()
      await authApi.register(username, email, password);

      // 🔹 Éxito → mostrar mensaje y volver al login
      alert("✅ Cuenta creada con éxito. Ahora podés iniciar sesión.");
      UIManager.hide("register-screen");
      this.scene.start("LoginScene");
    } catch (err) {
      // 🔹 Mostrar error desde el backend
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error al registrar usuario";
      errorBox.textContent = msg;
    }
  }
}
