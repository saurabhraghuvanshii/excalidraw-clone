FROM node:20-alpine AS base

RUN npm install -g pnpm

WORKDIR /usr/src/app


COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./turbo.json ./
RUN pnpm install
COPY ./packages ./packages
COPY ./apps/ws-backend ./apps/ws-backend

RUN npm install prisma@6.5.0

RUN pnpm install 

RUN pnpm run db:generate

ENV DATABASE_URL=${DATABASE_URL}
ENV JWT_SECRET=${JWT_SECRET}

WORKDIR /usr/src/app

RUN DATABASE_URL=${DATABASE_URL} JWT_SECRET=${JWT_SECRET} pnpm run build

EXPOSE 8080

CMD ["sh", "-c", "pnpm run db:generate && pnpm run start:ws-backend"]
