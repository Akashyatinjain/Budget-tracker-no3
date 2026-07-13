# Build stage
FROM node:20-slim AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

# Pass build args if needed (e.g. backend URL)
ARG VITE_BASE_URL
ENV VITE_BASE_URL=${VITE_BASE_URL}

RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
