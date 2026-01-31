FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN pnpm exec prisma generate
RUN pnpm exec prisma migrate deploy || true
COPY . .
EXPOSE 4004
CMD ["pnpm", "start"]
