FROM node:22.9.0 as builder

ENV NODE_ENV=development

WORKDIR /home/app

COPY package.json ./
COPY package-lock.json ./

RUN npm ci

COPY . .

RUN npm run prisma:generate
RUN npm run build

FROM  node:22.9.0-bullseye-slim

ENV NODE_ENV=production

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /home/app/package*.json ./
COPY --from=builder /home/app/node_modules/@revisium/core/dist/prisma/ ./prisma/
COPY --from=builder /home/app/dist/ ./dist/
COPY --from=builder /home/app/node_modules/@revisium/core/dist/prisma/seed/permissions ./dist/revisium-core/prisma/seed/permissions
COPY --from=builder /home/app/node_modules/@revisium/core/dist/prisma/seed/roles ./dist/revisium-core/prisma/seed/roles
COPY --from=builder /home/app/node_modules/ ./node_modules/

COPY --from=builder /home/app/client/ ./client

ENV IS_BUILD=true

CMD ["npm", "run", "start:prod"]

