import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { createUser, getUserByEmail, getUserByUsername } from "../repository/user.repository.js"

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const register = (req, res) => {
    const {username, email, password} = req.body;
    if(!username || !email || !password){
        return res.status(400).json({error: "Datos incompletos"})
    }

    const exsistingMail = getUserByEmail(email);
    if (exsistingMail) return res.status(400).json({error: "Email ya registrado"})

    const exsistingUsername = getUserByUsername(username);
    if (exsistingUsername) return res.status(400).json({error: "El nombre no esta disponible"})

    const hash = bcrypt.hashSync(password, 10)
    const user = createUser(username, email, hash)

    res.json({id: user.id, username: user.username})
}

export const login = (req, res) => {
    const {email, password} = req.body;

    // validar
    const user = getUserByEmail(email);
    if(!user) return res.status(401).json({error: "Usuario no encontrado"})

    // comparar passwword
    const isValid = bcrypt.compareSync(password, user.password_hash)
    if (!isValid) return res.status(401).json({error: "Contrasenia incorrecta"})
    
    // generar token
    const token = jwt.sign(
        {id: user.id, username: user.username},
        JWT_SECRET,
        {expiresIn: "7d"}
    )

    res.json({
        "token: ": token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email
        }
    })

    console.log("log correcto")
}