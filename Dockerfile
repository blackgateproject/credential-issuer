# Use official Node.js image as base
FROM node:18-alpine

# Set working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all TypeScript files
COPY . .

# Install TypeScript and type definitions
RUN npm run build

# Expose port 3001 (Veramo server port)
EXPOSE 3001

# Run the Fastify server
CMD ["npm", "start"]
