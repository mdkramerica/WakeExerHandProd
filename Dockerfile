# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Install necessary packages for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production=false

# Copy source code
COPY . .

# Ensure attached_assets directory exists and is accessible
RUN mkdir -p attached_assets

# Build the application
RUN npm run build

# Ensure video files are copied to the correct location for serving
RUN mkdir -p dist/public/videos
RUN cp -r client/public/videos/* dist/public/videos/ 2>/dev/null || true
RUN cp -r attached_assets/*.mp4 dist/public/videos/ 2>/dev/null || true

# Set NODE_ENV for runtime
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
