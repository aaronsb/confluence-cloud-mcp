# Generated by https://smithery.ai. See: https://smithery.ai/docs/config#dockerfile
# Use the official Node.js image as the base image
FROM node:22-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install --ignore-scripts

# Copy the rest of the application source code to the working directory
COPY . .

# Build the application
RUN npm run build

# Use a smaller Node.js runtime image to run the application
FROM node:22-alpine AS runtime

# Set the working directory in the container
WORKDIR /app

# Copy the build output and node_modules from the builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules

# Set environment variables
ENV NODE_ENV=production

# Expose the port that the application runs on
# (You may specify an actual port number based on application needs)

# Define the command to run the application
ENTRYPOINT ["node", "build/index.js"]