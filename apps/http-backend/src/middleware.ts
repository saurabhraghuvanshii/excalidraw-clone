import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

export const middleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "No authorization header provided"
        });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Token not provided"
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        // @ts-ignore
        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(401).json({
            message: "Invalid token"
        });
    }
};

// New middleware for endpoints that can be public but still use auth if available
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        // No auth, but still continue
        next();
        return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Token not provided"
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        // @ts-ignore
        req.userId = decoded.userId;
    } catch (err) {
        // Invalid token but continue anyway
        console.warn("Invalid token provided");
    }

    next();
};
