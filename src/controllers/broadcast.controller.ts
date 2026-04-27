import { and, eq } from "drizzle-orm";
import { Request, Response } from "express";
import { db } from "../db/index";
import { usersTable } from "../models/auth.model";
import { contentTable } from "../models/content.model";

// PUBLIC: Live Broadcasting
export async function getLiveContent(req: Request, res: Response) {
    try {
        const teacherId = req.params.teacherId as string;
        const { subject } = req.query;

        // Verify teacher exists
        const [teacher] = await db.select({ id: usersTable.id, name: usersTable.name })
            .from(usersTable)
            .where(and(
                eq(usersTable.id, teacherId),
                eq(usersTable.role, "teacher")
            ));

        if (!teacher) {
            return res.status(200).json({
                success: true,
                data: null,
                message: "No content available"
            });
        }

        const now = new Date();

        // Get all approved content for this teacher
        let approvedContent = await db.select({
            id: contentTable.id,
            title: contentTable.title,
            description: contentTable.description,
            subject: contentTable.subject,
            file_url: contentTable.file_url,
            file_type: contentTable.file_type,
            rotation_duration: contentTable.rotation_duration,
            rotation_order: contentTable.rotation_order,
            start_time: contentTable.start_time,
            end_time: contentTable.end_time,
            created_at: contentTable.created_at
        })
            .from(contentTable)
            .where(and(
                eq(contentTable.uploaded_by, teacherId),
                eq(contentTable.status, "approved")
            ))
            .orderBy(contentTable.rotation_order, contentTable.created_at);

        // Filter by subject if provided
        if (subject) {
            approvedContent = approvedContent.filter(
                c => c.subject === (subject as string).toLowerCase()
            );
        }

        // Filter by active time window
        // Content without start_time/end_time is NOT active (per requirement)
        const activeContent = approvedContent.filter(c => {
            if (!c.start_time || !c.end_time) return false;
            return now >= c.start_time && now <= c.end_time;
        });

        // Edge case: no active content
        if (activeContent.length === 0) {
            return res.status(200).json({
                success: true,
                data: null,
                message: "No content available"
            });
        }

        // Group by subject for independent rotation
        const subjectGroups: Record<string, typeof activeContent> = {};
        for (const content of activeContent) {
            if (!subjectGroups[content.subject]) {
                subjectGroups[content.subject] = [];
            }
            subjectGroups[content.subject].push(content);
        }

        // Apply rotation logic per subject
        const result: any[] = [];
        const nowSeconds = Math.floor(Date.now() / 1000);

        for (const [subjectName, contents] of Object.entries(subjectGroups)) {
            const totalDuration = contents.reduce(
                (sum, c) => sum + (c.rotation_duration || 300), 0
            );

            if (totalDuration === 0) continue;

            // Determine position in cycle using modular arithmetic
            const elapsed = nowSeconds % totalDuration;

            // Find active content based on rotation position
            let accumulated = 0;
            let activeItem = contents[0];
            let timeRemainingInSlot = 0;

            for (const content of contents) {
                const duration = content.rotation_duration || 300;
                accumulated += duration;
                if (elapsed < accumulated) {
                    activeItem = content;
                    timeRemainingInSlot = accumulated - elapsed;
                    break;
                }
            }

            result.push({
                ...activeItem,
                teacher_name: teacher.name,
                next_rotation_in: timeRemainingInSlot,
                total_items_in_rotation: contents.length
            });
        }

        // If a specific subject was requested, return single item
        if (subject && result.length > 0) {
            return res.status(200).json({
                success: true,
                data: result[0]
            });
        }

        return res.status(200).json({
            success: true,
            data: result.length === 1 ? result[0] : result,
            subjects: Object.keys(subjectGroups)
        });
    } catch (error) {
        console.log("error getting live content:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
