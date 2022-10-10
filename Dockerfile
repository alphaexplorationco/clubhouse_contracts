FROM node:current-alpine3.15

# Install yarn and other dependencies via apk
RUN apk add --update git python3 make g++ && \
  rm -rf /tmp/* /var/cache/apk/*

WORKDIR /usr/app
