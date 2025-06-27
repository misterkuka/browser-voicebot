# Single-stage build and serve
FROM node:22 AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Serve with default NGINX
FROM nginx:alpine

# Copy built app to NGINX default public folder
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 (default NGINX port)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
