# Use standard Node.js 18 image instead of Alpine
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port 3001
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
