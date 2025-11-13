export default class PlayerSave {
  constructor({
    id,
    user_id,
    slot_number,
    wave_number,
    health,
    max_health,
    damage,
    speed,
    current_weapon,
    coins,
    kills,
    powerups,
    boosts,
    position_x,
    position_y,
    saved_at,
  }) {
    this.id = id;
    this.user_id = user_id;
    this.slot_number = slot_number;
    this.wave_number = wave_number;
    this.health = health;
    this.max_health = max_health;
    this.damage = damage;
    this.speed = speed;
    this.current_weapon = current_weapon;
    this.coins = coins;
    this.kills = kills;
    this.powerups = powerups;
    this.boosts = boosts;
    this.position_x = position_x;
    this.position_y = position_y;
    this.saved_at = saved_at;
  }
}
