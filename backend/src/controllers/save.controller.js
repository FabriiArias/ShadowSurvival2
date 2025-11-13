import { saveOrUpdate, getAllByUser, getByUserAndSlot } from "../repository/save.repository.js";

export const saveProgress = (req, res) => {
  try {
    const data = req.body;
    if (!data.user_id || !data.slot_number) {
      return res.status(400).json({ error: "user_id y slot_number son requeridos" });
    }

    const result = saveOrUpdate(data);
    if (result.changes > 0) {
      res.status(200).json({ message: "Progreso guardado correctamente" });
    } else {
      res.status(500).json({ error: "No se pudo guardar el progreso" });
    }
  } catch (err) {
    console.error("Error en saveProgress:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getUserSaves = (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const saves = getAllByUser(userId);
    res.status(200).json(saves);
  } catch (err) {
    console.error("Error en getUserSaves:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getSaveBySlot = (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const slot = parseInt(req.params.slot);
    const save = getByUserAndSlot(userId, slot);
    if (save) res.status(200).json(save);
    else res.status(404).json({ error: "Guardado no encontrado" });
  } catch (err) {
    console.error("Error en getSaveBySlot:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
