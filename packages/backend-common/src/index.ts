import * as dotenv from "dotenv"
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || "111111111" ;
console.log(JWT_SECRET);