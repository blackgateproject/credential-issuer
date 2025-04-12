FROM node:22-alpine

RUN apk update && apk add --no-cache git

WORKDIR /app
ENV PATH=$PATH:/home/node/.npm-global/bin


# Copy package files first for better layer caching
COPY package*.json ./
RUN npm install
RUN npm install -g @veramo/cli
# Copy the rest of the application code
COPY . .

# Build the application if needed

# Add entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

# Use the entrypoint script that will generate the VERAMO_SECRET_KEY
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
