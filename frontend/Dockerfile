FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
RUN npm run build

FROM nginx:alpine
RUN echo "http://dl-cdn.alpinelinux.org/alpine/v3.19/main" > /etc/apk/repositories && \
    echo "http://dl-cdn.alpinelinux.org/alpine/v3.19/community" >> /etc/apk/repositories
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=BR/ST=RJ/L=Rio/O=XtermWeb/OU=IT/CN=xtermweb.local"
RUN echo 'server {\
    listen 80;\
    listen 443 ssl;\
    listen [::]:80;\
    listen [::]:443 ssl;\
    server_name _;\
\
    ssl_certificate /etc/nginx/ssl/nginx.crt;\
    ssl_certificate_key /etc/nginx/ssl/nginx.key;\
\
    location / {\
        root   /usr/share/nginx/html;\
        index  index.html index.htm;\
        try_files $uri $uri/ /index.html;\
    }\
}\
' > /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
