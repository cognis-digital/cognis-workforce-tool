FROM node:18-alpine AS builder

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

# Set node environment
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --legacy-peer-deps

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Copy environment files (will be overwritten by runtime env vars)
COPY .env.example .env

# Expose the port
EXPOSE 3000

# Set the startup command
CMD ["node", "dist/index.js"]
