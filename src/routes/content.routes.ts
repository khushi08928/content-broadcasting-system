import express from "express";
import { approveContent, getAllContent, getPendingContent, rejectContent } from "../controllers/approval.controller";
import { getLiveContent } from "../controllers/broadcast.controller";
import { getContentById, getMyContent, uploadContent } from "../controllers/content.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { apiLimiter, broadcastLimiter } from "../middlewares/rateLimiter.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = express.Router();

// PUBLIC ROUTES (No Auth) — stricter rate limit (60 req/min)
router.get("/live/:teacherId", broadcastLimiter, getLiveContent);

// TEACHER ROUTES
router.post("/upload", apiLimiter, verifyToken, requireRole("teacher"), upload.single("file"), uploadContent);
router.get("/my", apiLimiter, verifyToken, requireRole("teacher"), getMyContent);

// PRINCIPAL ROUTES
router.get("/all", apiLimiter, verifyToken, requireRole("principal"), getAllContent);
router.get("/pending", apiLimiter, verifyToken, requireRole("principal"), getPendingContent);
router.patch("/:id/approve", apiLimiter, verifyToken, requireRole("principal"), approveContent);
router.patch("/:id/reject", apiLimiter, verifyToken, requireRole("principal"), rejectContent);

// SHARED ROUTES (Any authenticated user)
router.get("/:id", apiLimiter, verifyToken, getContentById);

export default router;