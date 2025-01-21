import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

export const middleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers["authorization"]?? "";
    const decoded = jwt.verify(token, JWT_SECRET);

    try{
        if (decoded) {
           //@ts-ignore
           req.userId = decoded.userId;
        }
    }catch (e){
        res.status(403).json({
            message: "unauthorized"
        })
    }
}