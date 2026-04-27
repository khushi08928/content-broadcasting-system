import express from "express";
import { createUser, GetCurrentUser, LoginUser, LogoutUser } from "../controllers/auth.controller";
import { redirectIfAuthenticated, verifyToken } from "../middlewares/auth.middleware";
import { authLimiter } from "../middlewares/rateLimiter.middleware";

const router = express.Router();

console.log("auth routes loaded");

router.post("/signup", authLimiter, redirectIfAuthenticated, createUser);
router.post("/login", authLimiter, redirectIfAuthenticated, LoginUser);
router.post("/logout", verifyToken, LogoutUser);
router.get("/me", verifyToken, GetCurrentUser);

export default router;