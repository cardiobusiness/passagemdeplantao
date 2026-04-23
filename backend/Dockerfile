FROM node:22-alpine
WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
RUN npm ci --omit=dev

# Copy backend code
COPY backend/ ./backend/

ENV NODE_ENV=production
EXPOSE 4000

# Start backend using the root package.json script
CMD ["npm", "run", "start:backend"]
