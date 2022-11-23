FROM node:18-slim

RUN apt-get update && apt-get install -y git
RUN mkdir -p /app

COPY . /app

WORKDIR /app

RUN yarn install
