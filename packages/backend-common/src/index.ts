import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

export const env = {
  JWT_SECRET: process.env.JWT_SECRET || "",
  DATABASE_URL: process.env.DATABASE_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL,
  NEXT_PUBLIC_HTTP_BACKEND: process.env.NEXT_PUBLIC_HTTP_BACKEND || "http://localhost:3001",
  NEXT_PUBLIC_WS_BACKEND: process.env.NEXT_PUBLIC_WS_BACKEND || "ws://localhost:8080",
};
