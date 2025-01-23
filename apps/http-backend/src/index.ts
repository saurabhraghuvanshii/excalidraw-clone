import express, { Request, Response } from 'express';
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
import { middleware } from './middleware';
import { CreateUserSchema } from "@repo/common/types";
import { prismaClient } from '@repo/db/client';

const app = express();
app.use(express.json());
const prisma = prismaClient;

app.post('/signup', async(req: Request, res: Response) => {
    
    const parsedData = CreateUserSchema.safeParse(req.body);
    if(!parsedData.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    try{
        await prisma.user.create({
            data: {
                email: parsedData.data?.username,
                password: parsedData.data.password,
                name: parsedData.data.name
            }
        })
        res.json({
            userId: "1223"
        })
    }catch(e) {
        res.status(411).json({
            message: "User already exists with this username"
        })
    }
})

app.post('/signin', (req, res)=> {
    const data = CreateUserSchema.safeParse(req.body);
    if (!data.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }

    const userId = 1;
    const token = jwt.sign({
        userId
    }, JWT_SECRET)

    res.json({
        token
    })
})

app.post('/room', middleware,  (req, res) => {

    res.json({
        roomId: "1223"
    })
})

app.listen(3001);