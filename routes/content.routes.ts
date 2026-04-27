import express from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { upload } from "../middlewares/upload.middleware";
import { uploadContent, getMyContent, getContentById } from "../controllers/content.controller";
import { getAllContent, getPendingContent, approveContent, rejectContent } from "../controllers/approval.controller";
import { getLiveContent } from "../controllers/broadcast.controller";

const router = express.Router();

// PUBLIC ROUTES (No Auth)
// Live broadcasting - students access this
router.get("/live/:teacherId", getLiveContent);

// TEACHER ROUTES
router.post("/upload", verifyToken, requireRole("teacher"), upload.single("file"), uploadContent);
router.get("/my", verifyToken, requireRole("teacher"), getMyContent);

// PRINCIPAL ROUTES
router.get("/all", verifyToken, requireRole("principal"), getAllContent);
router.get("/pending", verifyToken, requireRole("principal"), getPendingContent);
router.patch("/:id/approve", verifyToken, requireRole("principal"), approveContent);
router.patch("/:id/reject", verifyToken, requireRole("principal"), rejectContent);

// SHARED ROUTES (Any authenticated user)
router.get("/:id", verifyToken, getContentById);

export default router;