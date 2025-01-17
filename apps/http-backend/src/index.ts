import express, { Request, Response } from 'express';
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
import { middleware } from './middleware';
import { CreateUserSchema } from "@repo/common/types";

const app = express();
app.use(express.json());

app.post('/signup', (req: Request, res: Response) => {
    
    const data = CreateUserSchema.safeParse(req.body);
    if(!data.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }

    res.json({
        userId: "1223"
    })
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