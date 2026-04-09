FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

FROM base AS development
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS builder
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Copia o Prisma CLI e client para rodar migrate no startup
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Script de startup: migrate + iniciar app
COPY --chown=nextjs:nodejs <<'EOF' /app/start.sh
#!/bin/sh
set -e
echo "Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy
echo "Starting application..."
exec node server.js
EOF
RUN chmod +x /app/start.sh

USER nextjs
EXPOSE 3000
CMD ["/app/start.sh"]
