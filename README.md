## Setup steps

1. Create a .env file:
  - copy `.env.example` and rename it to `.env`

2. Run docker compose 
   - `docker compose up`

3. Run database migrations:

```bash
pnpm db:migrate
```

4. Generate prisma client

```bash
pnpm db:generate
```
