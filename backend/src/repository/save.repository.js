import db from "../config/db.js";
import PlayerSave from "../models/save.model.js";

/**
 * Inserta o actualiza un guardado según user_id + slot_number
 */
export const saveOrUpdate = (data) => {
  const stmt = db.prepare(`
    INSERT INTO player_saves (
      user_id, slot_number, wave_number, health, max_health,
      damage, speed, current_weapon, coins, kills,
      powerups, boosts, position_x, position_y
    ) VALUES (
      @user_id, @slot_number, @wave_number, @health, @max_health,
      @damage, @speed, @current_weapon, @coins, @kills,
      @powerups, @boosts, @position_x, @position_y
    )
    ON CONFLICT(user_id, slot_number) DO UPDATE SET
      wave_number = excluded.wave_number,
      health = excluded.health,
      max_health = excluded.max_health,
      damage = excluded.damage,
      speed = excluded.speed,
      current_weapon = excluded.current_weapon,
      coins = excluded.coins,
      kills = excluded.kills,
      powerups = excluded.powerups,
      boosts = excluded.boosts,
      position_x = excluded.position_x,
      position_y = excluded.position_y,
      saved_at = CURRENT_TIMESTAMP
  `);

  const result = stmt.run(data);
  return { changes: result.changes };
};

/**
 * Obtiene todos los guardados de un usuario
 */
export const getAllByUser = (userId) => {
  const rows = db.prepare("SELECT * FROM player_saves WHERE user_id = ?").all(userId);
  return rows.map((r) => new PlayerSave(r));
};

/**
 * Obtiene un guardado específico por usuario y número de slot
 */
export const getByUserAndSlot = (userId, slot) => {
  const row = db
    .prepare("SELECT * FROM player_saves WHERE user_id = ? AND slot_number = ?")
    .get(userId, slot);
  return row ? new PlayerSave(row) : null;
};
