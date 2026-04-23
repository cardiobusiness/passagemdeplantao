FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
RUN npm ci

# Copy the frontend code and build it
COPY frontend/ ./frontend/
RUN npm run build --workspace frontend

# Final stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from the builder
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/frontend/package.json ./frontend/package.json
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/frontend ./frontend

EXPOSE 3000

# Start frontend using the root package.json script
CMD ["npm", "run", "start:frontend"]
