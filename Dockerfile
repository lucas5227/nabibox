# Dockerfile
FROM node:20

WORKDIR /usr/src/app

COPY ./nabibox-back/package*.json .
RUN npm install

COPY ./nabibox-back .

EXPOSE 3000

CMD [ "tail", "-f", "/dev/null" ]
