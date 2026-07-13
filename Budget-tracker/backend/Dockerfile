FROM node:20-slim AS build

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

FROM node:20-slim AS runtime

WORKDIR /usr/src/app

COPY --from=build /usr/src/app .

EXPOSE 5000
CMD [ "npm", "start" ]
