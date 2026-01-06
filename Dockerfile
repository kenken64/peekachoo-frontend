# Stage 1: Build the application
FROM node:16-alpine AS builder

WORKDIR /app

# Accept build arguments from Railway
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

ARG RAZORPAY_KEY_ID
ENV RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application with Railway env vars
RUN npm run deploy

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy assets folder
COPY --from=builder /app/assets /usr/share/nginx/html/assets

# Copy NES.css from node_modules
COPY --from=builder /app/node_modules/nes.css/css/nes.min.css /usr/share/nginx/html/nes.min.css

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script for runtime env injection
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port (Railway will set PORT env variable)
EXPOSE 8080

# Use entrypoint script to inject runtime env vars
ENTRYPOINT ["/docker-entrypoint.sh"]
