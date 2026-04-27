import { NextFunction, Request, Response } from "express";

export function requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.user?.role;

        if (!userRole) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!roles.includes(userRole)) {
            return res.status(403).json({
                error: "Forbidden",
                message: `Access denied. Required role: ${roles.join(" or ")}`
            });
        }

        next();
    };
}
