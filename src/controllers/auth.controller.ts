import bcrypt from "bcrypt";
import "dotenv/config";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/index";
import { usersTable } from "../models/auth.model";

export async function createUser(
    req: Request,
    res: Response
) {
    try {
        const { name, email, password, role } = req.body;
        //check if this email exists or not
        const [existingEmail] = await db.select({ id: usersTable.id }).from(usersTable)
            .where(eq(usersTable.email, email));

        if (existingEmail) {
            console.log("email already exist");
            return res.status(409).json({ error: "user already exist with this email" });
        }

        console.log("creating new user");
        const hashedpassword = await bcrypt.hash(password, 10);
        const [newUser] = await db.insert(usersTable).values({
            name, email, passwordhash: hashedpassword, role
        }).returning({ id: usersTable.id });

        console.log("new user craeted successfully : ", newUser.id);
        return res.status(201).json({ message: "user created successfully", userId: newUser.id });
    } catch (error) {
        console.log("error : ", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}


export async function LoginUser(
    req: Request,
    res: Response
) {
    try {
        const { email, password } = req.body;
        const [existingUser] = await db.select({
            id: usersTable.id,
            password: usersTable.passwordhash,
            email: usersTable.email,
            role: usersTable.role
        }).from(usersTable).where(eq(usersTable.email, email));

        if (!existingUser) {
            console.log("user not found with email : ", email);
            return res.status(404).json({ error: "invalid credentials" });
        }

        console.log("user found , verifiying password..");
        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            console.log("Invalid password for email : ", email);
            return res.status(401).json({ message: "Invalid credentials" });
        }
        console.log("password valid , generating token...");

        const jwtSecret = process.env.JWT_SECRET;
        const jwtExpiresIn = process.env.JWT_EXPIRES_IN;

        if (!jwtSecret || !jwtExpiresIn) {
            console.log("jwt secret and jwtexpiresin is not defined in environment variables");
            return res.status(401).json({ message: "server configuration error" });
        }

        const token = jwt.sign(
            { userId: existingUser.id, role: existingUser.role },
            jwtSecret,
            { expiresIn: jwtExpiresIn } as jwt.SignOptions
        )

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: "login successful",
            token,
            userId: existingUser.id
        });
    } catch (error) {
        console.log("error : ", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function LogoutUser(
    req: Request, res: Response
) {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });

        return res.status(200).json({ message: "logout successful" });
    } catch (error) {
        console.log("error in logout :", error);
        return res.status(500).json({ error });
    }
}

export async function GetCurrentUser(
    req: Request, res: Response
) {
    try {
        const userId = (req.user as any)?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const [user] = await db.select({
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
            role: usersTable.role,
            createdAt: usersTable.created_at
        })
            .from(usersTable)
            .where(eq(usersTable.id, userId));

        if (!user) {
            return res.status(404).json({ message: "user not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        console.log("error in getting current user : ", error);
        return res.status(500).json({ error: "failed to get user information" });
    }
}