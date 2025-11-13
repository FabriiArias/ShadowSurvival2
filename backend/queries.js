import db from "./src/config/db.js";

// Listar todas las tablas
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tablas en la base:", tables);

// Ver columnas de la tabla users
const pragma = db.prepare("PRAGMA table_info(users)").all();
console.log("Estructura de users:", pragma);

// // Insertar un usuario de prueba
// db.prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)")
//   .run("fabri", "fabri@example.com", "hash123");

// Listar usuarios
const users = db.prepare("SELECT * FROM users").all();
console.log("Usuarios:", users);

