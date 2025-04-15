import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });

interface User {
	ws: WebSocket;
	rooms: string[];
	userId: string;
	isGuest: boolean;
}
const users: User[] = [];

function checkUser(token: string): string | null {
	try {
		const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
		return decoded.userId;
	} catch (e) {
		return null;
	}
}

wss.on("connection", function connection(ws, request) {
	const url = request.url;

	if (!url) {
		return;
	}

	const querParams = new URLSearchParams(url.split("?")[1]);
	const token = querParams.get("token") || "";
	const isGuest = querParams.get("guest") === "true";
    let userId = null;
    
    if (!isGuest) {
        userId = checkUser(token);
        if (userId == null) {
            ws.close();
            return null;
        }
    } else {
        // Generate a temporary guest ID
        userId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    users.push({
        userId,
        rooms: [],
        ws,
        isGuest: isGuest
    });

	ws.on("message", async function message(data) {
		let parsedData;
		if (typeof data !== "string") {
			parsedData = JSON.parse(data.toString());
		} else {
			parsedData = JSON.parse(data);
		}

		if (parsedData.type === "join_room") {
			const user = users.find((x) => x.ws === ws);
			user?.rooms.push(parsedData.roomId);

			// Create room if it doesn't exist
			try {
				await prismaClient.room.upsert({
					where: {
						slug: parsedData.roomId
					},
					update: {},
					create: {
						slug: parsedData.roomId,
						adminId: userId
					}
				});
			} catch (error: any) {
				if (error.code === 'P2002'){

				}else{
					console.error("Error creating room:", error);
				}
			}
		}

		if (parsedData.type === "leave_room") {
			const user = users.find((x) => x.ws === ws);
			if (!user) {
				return;
			}
			user.rooms = user?.rooms.filter((x) => x === parsedData.room);
		}

		if (parsedData.type === "chat") {
			const roomId = parsedData.roomId;
			const message = parsedData.message;

			try {
				// First get the room ID
				const room = await prismaClient.room.findUnique({
					where: {
						slug: roomId
					}
				});

				if (!room) {
					console.error("Room not found");
					return;
				}

				await prismaClient.chat.create({
					data: {
						roomId: room.id,
						message,
						userId,
					},
				});

				users.forEach((user) => {
					if (user.rooms.includes(roomId)) {
						user.ws.send(
							JSON.stringify({
								type: "chat",
								message: message,
								roomId,
							})
						);
					}
				});
			} catch (error) {
				console.error("Error creating chat:", error);
			}
		}
	});

	ws.on("close", () => {
		const index = users.findIndex((x) => x.ws === ws);
		if (index !== -1) {
			users.splice(index, 1);
		}
	});
});
