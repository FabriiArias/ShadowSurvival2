import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import saveRoutes from "./routes/save.routes.js";

const app = express();

//corsear
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'], // express
    credentials: true
}));

app.use(express.json())

// rutas
app.use("/api/auth", authRoutes)

app.get("/", (req, res) =>{
    res.send("tamo online");
})

app.use("/api/player", saveRoutes);


// arranca con bugias hescher

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`sv escuchando en el puerto: ${PORT}`))