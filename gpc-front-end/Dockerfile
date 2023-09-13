
FROM node:14.17.0-slim As builder

### STAGE 1: Build ###
WORKDIR /usr/src/app

COPY . .
RUN node_modules/.bin/ng build --prod

FROM nginx:alpine


RUN apk add --no-cache ca-certificates
COPY ./ca/* /usr/local/share/ca-certificates/
RUN update-ca-certificates

RUN apk update && \
        apk upgrade --available && \
        apk add --no-cache \
        openssl \
        bash \
        curl

COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
COPY --from=builder /usr/src/app/default.conf /etc/nginx/conf.d

HEALTHCHECK --timeout=3s CMD curl -f http://localhost/ || exit 1
