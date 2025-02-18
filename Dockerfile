# Etapa de construcción
FROM node:21-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Etapa de producción
FROM nginx:alpine
COPY --from=build /app/dist/proylte32 /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]