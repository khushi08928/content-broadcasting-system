import { and, desc, eq } from "drizzle-orm";
import { Request, Response } from "express";
import { db } from "../db/index";
import { usersTable } from "../models/auth.model";
import { contentScheduleTable } from "../models/content-schedule.model";
import { contentSlotsTable } from "../models/content-slot.model";
import { contentTable } from "../models/content.model";
import { uploadToS3 } from "../utils/s3";

//TEACHER: Upload Content
export async function uploadContent(req: Request, res: Response) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { title, subject, description, start_time, end_time, rotation_duration } = req.body;

        if (!title || !subject) {
            return res.status(400).json({ error: "Title and subject are required" });
        }

        const file = (req as any).file;
        if (!file) {
            return res.status(400).json({ error: "File is required" });
        }

        // Upload file to S3
        const s3Result = await uploadToS3(file.path, subject.toLowerCase());

        // Ensure content slot exists for this subject
        const [existingSlot] = await db.select().from(contentSlotsTable)
            .where(eq(contentSlotsTable.subject, subject.toLowerCase()));

        let slotId: string;
        if (!existingSlot) {
            const [newSlot] = await db.insert(contentSlotsTable).values({
                subject: subject.toLowerCase()
            }).returning();
            slotId = newSlot.id;
        } else {
            slotId = existingSlot.id;
        }

        // Count existing content for rotation order
        const existingContent = await db.select({ id: contentTable.id })
            .from(contentTable)
            .where(and(
                eq(contentTable.subject, subject.toLowerCase()),
                eq(contentTable.uploaded_by, userId)
            ));

        // Insert content
        const [newContent] = await db.insert(contentTable).values({
            title,
            description: description || null,
            subject: subject.toLowerCase(),
            file_url: s3Result.url,
            file_path: s3Result.key,
            file_type: file.mimetype,
            file_size: s3Result.size,
            uploaded_by: userId,
            status: "pending",
            start_time: start_time ? new Date(start_time) : null,
            end_time: end_time ? new Date(end_time) : null,
            rotation_duration: rotation_duration ? parseInt(rotation_duration) : 300,
            rotation_order: existingContent.length
        }).returning();

        // Create schedule entry
        await db.insert(contentScheduleTable).values({
            content_id: newContent.id,
            slot_id: slotId,
            rotation_order: existingContent.length,
            duration: rotation_duration ? parseInt(rotation_duration) : 300
        });

        return res.status(201).json({
            message: "Content uploaded successfully. Pending approval.",
            content: newContent
        });
    } catch (error) {
        console.log("error uploading content:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

//TEACHER: Get My Content
export async function getMyContent(req: Request, res: Response) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { subject, status } = req.query;

        const contents = await db.select().from(contentTable)
            .where(eq(contentTable.uploaded_by, userId))
            .orderBy(desc(contentTable.created_at));

        // Filter in application if query params provided
        let filtered = contents;
        if (subject) {
            filtered = filtered.filter(c => c.subject === (subject as string).toLowerCase());
        }
        if (status) {
            filtered = filtered.filter(c => c.status === status);
        }

        return res.status(200).json({
            success: true,
            count: filtered.length,
            data: filtered
        });
    } catch (error) {
        console.log("error getting my content:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

// GET: Single Content
export async function getContentById(req: Request, res: Response) {
    try {
        const id = req.params.id as string;

        const [content] = await db.select({
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
            rotation_order: contentTable.rotation_order,
            created_at: contentTable.created_at,
            uploaded_by: contentTable.uploaded_by,
            approved_by: contentTable.approved_by,
            approved_at: contentTable.approved_at,
            teacher_name: usersTable.name
        })
            .from(contentTable)
            .leftJoin(usersTable, eq(contentTable.uploaded_by, usersTable.id))
            .where(eq(contentTable.id, id));

        if (!content) {
            return res.status(404).json({ error: "Content not found" });
        }

        return res.status(200).json({
            success: true,
            data: content
        });
    } catch (error) {
        console.log("error getting content:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
