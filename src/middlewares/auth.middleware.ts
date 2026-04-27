import { eq } from "drizzle-orm";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { usersTable } from "../models/auth.model";


export async function verifyToken(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "no token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload & { userId: string; role: string };
        req.user = decoded;
        next();
    } catch (error) {
        console.log("jwt verification error");
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: "invalid token" });
        }
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: "token expired" });
        }
        return res.status(500).json({ error: "Internal server error" });
    }
}


export async function redirectIfAuthenticated(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
        if (!token) {
            return next();
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };

        if (decoded && decoded.userId) {
            const [user] = await db.select({ id: usersTable.id }).from(usersTable)
                .where(eq(usersTable.id, decoded.userId));

            if (user) {
                return res.status(403).json({
                    error: "already authenticated",
                    message: "You are already logged in. Please go to dashboard"
                })
            }

            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
            return next();
        }
        next();
    } catch (error) {
        next();
    }
}