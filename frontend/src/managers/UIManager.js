// /src/managers/UIManager.js
export default class UIManager {
  static async load(id, filename) {
    // si ya existe, no lo recargamos
    if (document.getElementById(id)) return;

    const res = await fetch(`/src/ui/${filename}`);
    const html = await res.text();

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    document.getElementById("ui-root").appendChild(wrapper);

    // aseguramos que esté oculto al inicio
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  }

  static show(id) {
    // ocultar cualquier otra pantalla UI activa
    document.querySelectorAll(".ui-screen").forEach(el => (el.style.display = "none"));

    const el = document.getElementById(id);
    if (el) el.style.display = "flex";
  }

  static hide(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  }
}
