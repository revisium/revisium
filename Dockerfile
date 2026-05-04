FROM node:24.11.1-bullseye AS builder

ENV NODE_ENV=development

WORKDIR /home/app

COPY package.json ./
COPY package-lock.json ./

RUN npm ci

COPY nest-cli.json ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY prisma.config.ts ./
COPY src/ ./src/

RUN npm run build

FROM  node:24.11.1-bullseye-slim

ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /home/app

COPY --from=builder /home/app/package*.json ./
COPY --from=builder /home/app/prisma.config.ts ./
COPY --from=builder /home/app/node_modules/@revisium/core/dist/prisma/ ./prisma/
COPY --from=builder /home/app/dist/ ./dist/
COPY --from=builder /home/app/node_modules/@revisium/core/dist/prisma/seed/permissions ./dist/revisium-core/prisma/seed/permissions
COPY --from=builder /home/app/node_modules/@revisium/core/dist/prisma/seed/roles ./dist/revisium-core/prisma/seed/roles
COPY --from=builder /home/app/node_modules/ ./node_modules/

COPY --from=builder /home/app/client/ ./client

RUN chown -R node:node /home/app

USER node

CMD ["npm", "run", "start:prod"]
