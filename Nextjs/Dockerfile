# Use the official Node.js 18 image as base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build-time env wiring for Next.js public variables
ARG NEXT_PUBLIC_ENVIRONMENT
ARG NEXT_PUBLIC_BASE_PATH
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_COOKIE_NAME
ARG NEXT_PUBLIC_COOKIE_PASSWORD
ENV NEXT_PUBLIC_ENVIRONMENT=${NEXT_PUBLIC_ENVIRONMENT}
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_COOKIE_NAME=${NEXT_PUBLIC_COOKIE_NAME}
ENV NEXT_PUBLIC_COOKIE_PASSWORD=${NEXT_PUBLIC_COOKIE_PASSWORD}

# Build the Next.js application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Start the application
CMD ["npm", "start", "--", "-H", "0.0.0.0", "-p", "3000"]
