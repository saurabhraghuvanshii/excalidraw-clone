import express, { Request, Response } from 'express';
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
import { middleware } from './middleware';
import { CreateRoomSchema, CreateUserSchema, SigninSchema } from "@repo/common/types";
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
        const user =  await prisma.user.create({
            data: {
                email: parsedData.data?.username,
                password: parsedData.data.password,
                name: parsedData.data.name
            }
        })
        res.json({
            userId: user.id
        })
    }catch(e) {
        res.status(411).json({
            message: "User already exists with this username"
        })
    }
})

app.post('/signin', async (req, res)=> {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }

    const user = await prisma.user.findFirst({
        where: {
            email: parsedData.data.username,
            password: parsedData.data.password
        }
    })

    if ( !user ){
        res.json({
            message: "notauthrized"
        })
        return;
    }
   
    const token = jwt.sign({
        userId: user?.id
    }, JWT_SECRET);

    res.json({
        token
    })
})

app.post('/room', middleware,  async(req, res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if( !parsedData.success ){
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    //@ts-ignore
    const userId = req.userId;
    try {
        await prismaClient.room.create({
            data: {
                slug: parsedData.data.name,
                adminId: userId
            }
        })

        res.json({
            roomId: "1223"
        }) 
    } catch (error) {
        res.status(411).json({
            message: "Room already exists with this name"
        })
    }
})

app.get("/room/:slug", async (req, res) => {
    const slug = req.params.slug;
    const room = await prismaClient.room.findFirst({
        where: {
            slug
        }
    })

    res.json({
        room
    })
})

app.listen(3001);