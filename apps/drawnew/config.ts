import { env } from "@repo/backend-common/config";

const isServer = typeof window === 'undefined';
const isDocker = process.env.DOCKER_ENV === 'true';

export const HTTP_BACKEND = isServer
  ? (isDocker ? "http://http-backend:3001" : "http://localhost:3001")
  : (env.NEXT_PUBLIC_HTTP_BACKEND);

export const WS_URL = isServer
  ? (isDocker ? "ws://ws-backend:8080" : "ws://localhost:8080")
  : (env.NEXT_PUBLIC_WS_BACKEND);
  