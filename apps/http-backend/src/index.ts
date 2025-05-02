import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import { env } from "@repo/backend-common/config"
const JWT_SECRET = env.JWT_SECRET;
import { middleware, optionalAuthMiddleware } from "./middleware";
import { CreateRoomSchema, CreateUserSchema, SigninSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
const app = express();
app.use(express.json());
app.use(cors({
	origin: process.env.FRONTEND_URL || "http://localhost:3000",
	credentials: true
}));
const prisma = prismaClient;

app.post("/signup", async (req: Request, res: Response) => {
	const parsedData = CreateUserSchema.safeParse(req.body);
	if (!parsedData.success) {
		res.status(400).json({
			message: "Incorrect inputs",
			errors: parsedData.error.errors
		});
		return;
	}

	try {
		// Check if email or username already exists
		const existingUser = await prisma.user.findFirst({
			where: {
				OR: [
					{ email: parsedData.data.email },
					{ username: parsedData.data.username }
				]
			}
		});

		if (existingUser) {
			const field = existingUser.email === parsedData.data.email ? "email" : "username";
			res.status(400).json({
				message: `${field} already exists`,
				field: field
			});
			return;
		}

		const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);
		const user = await prisma.user.create({
			data: {
				username: parsedData.data.username,
				email: parsedData.data.email,
				password: hashedPassword,
			}
		});
		res.json({
			userId: user.id,
		});
	} catch (error: unknown) {
		res.status(500).json({
			message: "Something went wrong",
		});
	}
});

app.post("/signin", async (req, res) => {
	const parsedData = SigninSchema.safeParse(req.body);
	if (!parsedData.success) {
		res.status(400).json({
			message: "Incorrect inputs",
			errors: parsedData.error.errors
		});
		return;
	}

	const user = await prisma.user.findFirst({
		where: {
			OR: [
				{ email: parsedData.data.emailOrUsername },
				{ username: parsedData.data.emailOrUsername }
			]
		},
	});

	if (!user) {
		res.status(401).json({
			message: "Invalid credentials",
		});
		return;
	}

	if (!user.password) {
		res.status(401).json({
			message: "Invalid user data",
		});
		return;
	}

	const isPasswordValid = await bcrypt.compare(
		parsedData.data.password,
		user.password
	);
	if (!isPasswordValid) {
		res.status(401).json({
			message: "Invalid credentials",
		});
		return;
	}

	const token = jwt.sign(
		{
			userId: user.id,
		},
		JWT_SECRET,
		{ expiresIn: '7d' }
	);

	res.json({
		token,
	});
});
//@ts-ignore
app.post("/room", middleware, async (req, res) => {
	const parsedData = CreateRoomSchema.safeParse(req.body);
	if (!parsedData.success) {
		res.json({
			message: "Incorrect inputs",
		});
		return;
	}
	//@ts-ignore
	const userId = req.userId;
	try {
		const room = await prismaClient.room.create({
			data: {
				slug: parsedData.data.name,
				adminId: userId,
			},
		});

		res.json({
			roomId: room.id,
		});
	} catch (error) {
		res.status(411).json({
			message: "Room already exists with this name",
		});
	}
});

//@ts-ignore
app.get("/chats/:roomId", optionalAuthMiddleware, async (req, res) => {
	try {
		const roomSlug = req.params.roomId;
		const room = await prismaClient.room.findFirst({
			where: { slug: roomSlug }
		});

		if (!room) {
			const roomId = parseInt(req.params.roomId || "");
			if (isNaN(roomId)) {
				return res.status(404).json({
					message: "Room not found",
					messages: []
				});
			}

			const messages = await prismaClient.chat.findMany({
				where: { roomId },
				orderBy: { id: "asc" },
				take: 100,
			})

			return res.json({ messages });
		}

		const messages = await prismaClient.chat.findMany({
			where: { roomId: room.id },
			orderBy: { id: "asc" },
			take: 100,
		});

		res.json({ messages })
	} catch (e) {
		console.log(e);
		res.json({ messages: [] })
	}

});

app.get("/room/:slug", async (req, res) => {
	const slug = req.params.slug;
	const room = await prismaClient.room.findFirst({
		where: {
			slug,
		},
	});

	res.json({
		room,
	});
});

app.listen(3001);
