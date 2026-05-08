# --- Stage 1: build SPA з Vite ---
FROM node:24-alpine AS builder
WORKDIR /app

# Кешуємо шар з залежностями
COPY package*.json ./
RUN npm ci --no-audit --prefer-offline

# Копіюємо джерела і збираємо
COPY tsconfig*.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src

# URL до API можна перезаписати на етапі білду
ARG VITE_API_BASE_URL=http://localhost:4000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# --- Stage 2: runtime на nginx ---
FROM nginx:1.29-alpine AS runtime

# Видаляємо стандартну сторінку nginx і кладемо власний конфіг
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Запускаємо від непривілейованого користувача nginx (вже є в образі)
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O - http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
