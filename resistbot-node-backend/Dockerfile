FROM node:20-alpine3.18

WORKDIR /code

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

COPY tsconfig.json tsconfig.json
COPY ./src ./src

RUN npm run build

ENTRYPOINT [ "npm", "run", "start" ]
