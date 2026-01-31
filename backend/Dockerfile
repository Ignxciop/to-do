FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm exec prisma generate
RUN pnpm exec prisma migrate deploy || true
EXPOSE 4004
CMD ["pnpm", "start"]
