import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export async function uploadToS3(filePath: string, folder: string) {
    const fileContent = fs.readFileSync(filePath);
    const fileSize = fs.statSync(filePath).size;
    const fileName = `${folder}/${Date.now()}-${path.basename(filePath)}`;

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: fileName,
        Body: fileContent,
        ContentType: getContentType(filePath),
    });

    await s3Client.send(command);

    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    // Clean up local temp file after upload
    fs.unlinkSync(filePath);

    return {
        url: fileUrl,
        key: fileName,
        size: fileSize,
    };
}

export async function deleteFromS3(key: string) {
    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
    });
    await s3Client.send(command);
}

function getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const types: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
    };
    return types[ext] || "application/octet-stream";
}
