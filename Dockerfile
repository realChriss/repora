FROM oven/bun:1.4.4-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY tsconfig.json ./
COPY src ./src
COPY assets/icon.png ./assets/
RUN mkdir logs && chown bun logs

USER bun
EXPOSE 3000
CMD ["bun", "src/server/index.ts"]
