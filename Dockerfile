FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --include=dev

COPY . .

RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npm exec prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:prod"]