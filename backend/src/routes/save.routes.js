import express from "express";
import { saveProgress, getUserSaves, getSaveBySlot } from "../controllers/save.controller.js";

const router = express.Router();

// POST /api/player/save
router.post("/save", saveProgress);

// GET /api/player/saves/:userId
router.get("/saves/:userId", getUserSaves);

// GET /api/player/saves/:userId/:slot
router.get("/saves/:userId/:slot", getSaveBySlot);

export default router;