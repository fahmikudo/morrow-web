# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS deps
RUN npm install --global pnpm@10
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile


FROM deps AS builder
WORKDIR /app
COPY . .

# VITE_* is inlined into the bundle at build time, not read at runtime: changing
# the API origin needs a new image, not a container restart.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN pnpm build


FROM nginx:1.27-alpine AS runner

# The image's own server block: SPA fallback, cache policy, compression.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
