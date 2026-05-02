FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma

ARG PRISMA_DATABASE_URL=postgresql://user:password@localhost:5432/cti
ARG PRISMA_DIRECT_URL=postgresql://user:password@localhost:5432/cti

RUN npm ci --omit=dev \
  && DATABASE_URL="$PRISMA_DATABASE_URL" DIRECT_URL="$PRISMA_DIRECT_URL" npx prisma generate \
  && npm cache clean --force

COPY src ./src

ENV NODE_ENV=production
EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
