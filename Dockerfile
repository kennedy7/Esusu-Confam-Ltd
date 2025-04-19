# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the app
RUN npm run build

# Expose the port your NestJS app listens on
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start:prod"]
