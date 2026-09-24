# ==============================================================================
# GarageFlow Production / Staging Multi-Stage Dockerfile
# Node.js 20 Alpine lightweight container running Express server & static client
# ==============================================================================

FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Install dependencies with clean production lockfile
COPY package*.json ./
RUN npm ci --only=production

# Copy application server and client source files
COPY server/ ./server/
COPY client/ ./client/

# Expose HTTP port
EXPOSE 5000

# Start server
CMD ["node", "server/server.js"]
