# Stage 1: Build the React client
FROM node:20-alpine AS client-build

WORKDIR /app
COPY shared/ ./shared/
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && npm run build

# Stage 2: Production server
FROM node:20-alpine

WORKDIR /app
COPY shared/ ./shared/
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev
COPY server/ ./server/

# Copy built client into server's static directory
COPY --from=client-build /app/client/dist ./client/dist

EXPOSE 3001

CMD ["node", "server/index.js"]