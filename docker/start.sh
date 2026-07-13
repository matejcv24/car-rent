#!/usr/bin/env sh
set -e

cd /var/www/html

php artisan config:clear
php artisan view:clear

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    php artisan migrate --force
fi

php artisan config:cache

exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"
