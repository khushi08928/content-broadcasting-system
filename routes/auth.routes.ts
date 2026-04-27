import { createUser,GetCurrentUser,LoginUser,LogoutUser } from "../controllers/auth.controller";
import express from "express";
import { redirectIfAuthenticated, verifyToken } from "../middlewares/auth.middleware";

const router=express.Router();

console.log("auth routes loaded");

router.post("/signup",redirectIfAuthenticated,createUser);
router.post("/login",redirectIfAuthenticated,LoginUser);
router.post("/logout",verifyToken,LogoutUser);
router.get("/me",verifyToken,GetCurrentUser);

export default router;