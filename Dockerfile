# Build stage for backend
FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production stage for backend
FROM node:18-alpine AS backend
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=backend-builder /app/dist ./dist
COPY .env.example .env
EXPOSE 3000
CMD ["node", "dist/index.js"]

# Build stage for mini-app
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY mini-app/package*.json ./
RUN npm ci
COPY mini-app/tsconfig.json ./
COPY mini-app/tsconfig.node.json ./
COPY mini-app/vite.config.ts ./
COPY mini-app/postcss.config.js ./
COPY mini-app/tailwind.config.js ./
COPY mini-app/src ./src
COPY mini-app/index.html ./
RUN npm run build

# Production stage for mini-app
FROM node:18-alpine AS frontend
WORKDIR /app
COPY --from=frontend-builder /app/dist ./dist
COPY mini-app/package*.json ./
RUN npm ci --only=production
EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
