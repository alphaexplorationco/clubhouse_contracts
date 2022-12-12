FROM nikolaik/python-nodejs:python3.11-nodejs18-slim

RUN apt-get update && apt-get install -y git
RUN mkdir -p /app

COPY . /app

WORKDIR /app

RUN yarn install
