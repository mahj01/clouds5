FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm config set fetch-timeout 600000
RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "run", "start:dev"]
