import db from "../config/db.js"
import User from "../models/user.model.js"

export const createUser = (username, email, password) => {
    const stmt = db.prepare("INSERT INTO users (username, email, password_hash) VALUES (?,?,?)");
    const result = stmt.run(username,email,password)
    return new User({
        id: result.lastInsertRowid,
        username, email, 
        password_hash: password
    })
}

export const getUserByEmail = (email) =>{
    const row = db.prepare("Select * from users where email = ?").get(email);
    return row ? new User(row) : null;
}

export const getUserByUsername = (username) =>{
    const row = db.prepare("Select * from users where username = ?").get(username);
    return row ? new User(row) : null;
}
