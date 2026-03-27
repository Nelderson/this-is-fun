FROM node:20-alpine

WORKDIR /app

# Copy shared constants first
COPY shared/ ./shared/

# Install server deps
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

COPY server/ ./server/

EXPOSE 3001

CMD ["node", "server/index.js"]