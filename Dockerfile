FROM composer:2 AS vendor

WORKDIR /app

COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts

COPY backend ./
RUN composer dump-autoload --optimize \
    && php artisan package:discover --ansi

FROM node:22-bookworm AS frontend

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install --include=dev --no-audit --no-fund

COPY frontend ./
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

FROM php:8.4-cli-bookworm

WORKDIR /var/www/html

RUN apt-get update \
    && apt-get install -y --no-install-recommends libzip-dev unzip \
    && docker-php-ext-install pdo_mysql bcmath \
    && rm -rf /var/lib/apt/lists/*

COPY --from=vendor /app ./
COPY --from=frontend /app/dist ./public
COPY docker/start.sh /usr/local/bin/start.sh

RUN chmod +x /usr/local/bin/start.sh \
    && chown -R www-data:www-data storage bootstrap/cache public

ENV APP_ENV=production
ENV APP_DEBUG=false
ENV LOG_CHANNEL=stderr

EXPOSE 10000

CMD ["start.sh"]
