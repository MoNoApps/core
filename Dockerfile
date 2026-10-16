# syntax=docker/dockerfile:1
# Core Platform - Hardened Multi-Stage Node.js 24 Container

FROM node:24-bookworm-slim

# Set working directory and grant ownership to non-root node user
WORKDIR /app
RUN chown node:node /app

# Switch to non-privileged standard node user early
USER node

# Copy package manifests first for optimal layer caching
COPY --chown=node:node package.json package-lock.json ./

# Install dependencies directly as node user (node_modules natively owned by node)
RUN npm ci

# Copy application source code with node ownership
COPY --chown=node:node . .

# Compile client React 19 SPA bundle into public/dist/
RUN npm run build:client

# Expose web server (1344), REST API (1345), and optional Vite dev server (3000)
EXPOSE 1344 1345 3000

ENV NODE_ENV=development

# Rebuild client on start, run database migrations, and launch live-reload watcher
CMD ["sh", "-c", "npm run build:client && npm run migrate && npm run dev"]
