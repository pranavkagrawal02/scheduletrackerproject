FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .
RUN node scripts/sync-public.js

ENV NODE_ENV=production
ENV HOST=0.0.0.0

CMD ["npm", "run", "start:prod"]
