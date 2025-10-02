FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/

RUN mkdir -p ./data/screenshots ./temp

EXPOSE 3001

CMD ["npm", "start"]
