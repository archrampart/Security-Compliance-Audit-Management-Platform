FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application
COPY . .

# Expose port
EXPOSE 4200

# Run development server (lokal network erişimi için)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "4200"]

