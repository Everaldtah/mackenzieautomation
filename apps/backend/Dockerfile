# Backend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/database/package*.json ./packages/database/

# Install dependencies
RUN pnpm install --frozen-lockfile=false

# Copy source code
COPY . .

# Generate Prisma client using npx with specific version
RUN cd packages/database && npx -y prisma@5.22.0 generate

# Build backend
RUN cd apps/backend && pnpm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/database/package*.json ./packages/database/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile=false

# Copy built files
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages/database ./packages/database

# Generate Prisma client in production
RUN cd packages/database && npx -y prisma@5.22.0 generate

EXPOSE 3001

CMD ["node", "apps/backend/dist/main.js"]
