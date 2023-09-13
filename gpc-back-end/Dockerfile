# FROM node:14.17.0
FROM node:16.13.0
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update -qq 
RUN apt-get install -y -q libreoffice
RUN apt-get install --fix-missing
RUN apt-get remove -q -y libreoffice-gnome

# Cleanup after apt-get commands
RUN apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /var/cache/apt/archives/*.deb /var/cache/apt/*cache.bin

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080
CMD [ "npm", "start" ]
