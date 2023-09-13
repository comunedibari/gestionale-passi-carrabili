FROM node:14.17.0-slim

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 80
CMD [ "npm", "start" ]
