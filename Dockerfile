# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build:client && npm run build:server

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/types/resume.ts ./src/types/resume.ts

RUN mkdir -p /app/data /app/data/public

EXPOSE 965

ENV NODE_ENV=production

CMD ["node", "dist/server/server/index.js"]
