# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Build arguments
ARG REACT_APP_API_URL
ARG REACT_APP_ENVIRONMENT
ARG GENERATE_SOURCEMAP

# Set as environment variables for build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_ENVIRONMENT=$REACT_APP_ENVIRONMENT
ENV GENERATE_SOURCEMAP=$GENERATE_SOURCEMAP

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve
RUN npm install -g serve

# Copy build from builder
COPY --from=builder /app/build ./build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start the app
CMD ["serve", "-s", "build", "-l", "3000"]
