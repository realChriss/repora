FROM oven/bun:1.4.3-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY tsconfig.json ./
COPY src ./src

USER bun
EXPOSE 3000
CMD ["bun", "src/index.ts"]
