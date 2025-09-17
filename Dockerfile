# Base image with Node.js
FROM node:20-alpine AS builder

# Working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Create production image
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --production

# Copy build artifacts and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/serve-production.js ./
COPY --from=builder /app/package.json ./

# Environment variables
ENV PORT=8090
ENV NODE_ENV=production

# Expose the port
EXPOSE 8090

# Start the production server
CMD ["node", "serve-production.js"]
