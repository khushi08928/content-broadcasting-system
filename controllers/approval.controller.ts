import { Request, Response } from "express";
import { db } from "../db/index";
import { contentTable } from "../models/content.model";
import { usersTable } from "../models/auth.model";
import { eq, desc } from "drizzle-orm";

// PRINCIPAL: Get All Content
export async function getAllContent(req: Request, res: Response) {
    try {
        const { subject, status, teacher_id, page = "1", limit = "10" } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        const contents = await db.select({
            id: contentTable.id,
            title: contentTable.title,
            description: contentTable.description,
            subject: contentTable.subject,
            file_url: contentTable.file_url,
            file_type: contentTable.file_type,
            file_size: contentTable.file_size,
            status: contentTable.status,
            rejection_reason: contentTable.rejection_reason,
            start_time: contentTable.start_time,
            end_time: contentTable.end_time,
            rotation_duration: contentTable.rotation_duration,
            created_at: contentTable.created_at,
            uploaded_by: contentTable.uploaded_by,
            approved_by: contentTable.approved_by,
            approved_at: contentTable.approved_at,
            teacher_name: usersTable.name
        })
            .from(contentTable)
            .leftJoin(usersTable, eq(contentTable.uploaded_by, usersTable.id))
            .orderBy(desc(contentTable.created_at))
            .limit(limitNum)
            .offset(offset);

        let filtered = contents;
        if (subject) {
            filtered = filtered.filter(c => c.subject === (subject as string).toLowerCase());
        }
        if (status) {
            filtered = filtered.filter(c => c.status === status);
        }
        if (teacher_id) {
            filtered = filtered.filter(c => c.uploaded_by === teacher_id);
        }

        return res.status(200).json({
            success: true,
            count: filtered.length,
            page: pageNum,
            limit: limitNum,
            data: filtered
        });
    } catch (error) {
        console.log("error getting all content:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

// PRINCIPAL: Get Pending Content
export async function getPendingContent(req: Request, res: Response) {
    try {
        const contents = await db.select({
            id: contentTable.id,
            title: contentTable.title,
            description: contentTable.description,
            subject: contentTable.subject,
            file_url: contentTable.file_url,
            file_type: contentTable.file_type,
            file_size: contentTable.file_size,
            status: contentTable.status,
            start_time: contentTable.start_time,
            end_time: contentTable.end_time,
            rotation_duration: contentTable.rotation_duration,
            created_at: contentTable.created_at,
            uploaded_by: contentTable.uploaded_by,
            teacher_name: usersTable.name
        })
            .from(contentTable)
            .leftJoin(usersTable, eq(contentTable.uploaded_by, usersTable.id))
            .where(eq(contentTable.status, "pending"))
            .orderBy(desc(contentTable.created_at));

        return res.status(200).json({
            success: true,
            count: contents.length,
            data: contents
        });
    } catch (error) {
        console.log("error getting pending content:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

// PRINCIPAL: Approve Content
export async function approveContent(req: Request, res: Response) {
    try {
        const id = req.params.id as string;
        const principalId = req.user?.userId;

        if (!principalId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const [content] = await db.select().from(contentTable)
            .where(eq(contentTable.id, id));

        if (!content) {
            return res.status(404).json({ error: "Content not found" });
        }

        if (content.status === "approved") {
            return res.status(400).json({ error: "Content is already approved" });
        }

        if (content.status === "rejected") {
            return res.status(400).json({ error: "Cannot approve rejected content. Ask teacher to re-upload." });
        }

        const [updated] = await db.update(contentTable)
            .set({
                status: "approved",
                approved_by: principalId,
                approved_at: new Date()
            })
            .where(eq(contentTable.id, id))
            .returning();

        return res.status(200).json({
            message: "Content approved successfully",
            content: updated
        });
    } catch (error) {
        console.log("error approving content:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

// PRINCIPAL: Reject Content
export async function rejectContent(req: Request, res: Response) {
    try {
        const id = req.params.id as string;
        const { rejection_reason } = req.body;

        if (!rejection_reason) {
            return res.status(400).json({ error: "Rejection reason is required" });
        }

        const [content] = await db.select().from(contentTable)
            .where(eq(contentTable.id, id));

        if (!content) {
            return res.status(404).json({ error: "Content not found" });
        }

        if (content.status === "rejected") {
            return res.status(400).json({ error: "Content is already rejected" });
        }

        if (content.status === "approved") {
            return res.status(400).json({ error: "Cannot reject already approved content" });
        }

        const [updated] = await db.update(contentTable)
            .set({
                status: "rejected",
                rejection_reason
            })
            .where(eq(contentTable.id, id))
            .returning();

        return res.status(200).json({
            message: "Content rejected successfully",
            content: updated
        });
    } catch (error) {
        console.log("error rejecting content:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
