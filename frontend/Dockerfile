FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

ARG API_URL=http://localhost:3000
ENV API_URL=${API_URL}

COPY . .
RUN npx quasar build

FROM nginx:alpine

COPY --from=builder /app/dist/spa /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
