FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Prisma config expects DATABASE_URL during generate (build-time only)
ENV DATABASE_URL="postgresql://workout_user:workout_pass@localhost:5432/workout_db"

RUN npx prisma generate

EXPOSE 3000

CMD ["node", "src/server.js"]
