FROM node:20-alpine AS build

WORKDIR /app

# Copy shared constants (needed at build time for imports)
COPY shared/ ./shared/

# Install client deps
COPY client/package*.json ./client/
RUN cd client && npm ci

COPY client/ ./client/

# Build with the production API URL injected
ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL
RUN cd client && npm run build

# Serve with nginx
FROM nginx:alpine
COPY --from=build /app/client/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80