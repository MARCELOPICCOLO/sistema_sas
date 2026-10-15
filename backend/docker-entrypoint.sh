#!/bin/sh
set -e

cd /var/www

# Dependências (o código é montado como volume a partir do host).
if [ ! -f vendor/autoload.php ]; then
    composer install --no-interaction --prefer-dist --optimize-autoloader
fi

if [ ! -f .env ]; then
    cp .env.example .env
fi

if ! grep -q '^APP_KEY=base64' .env; then
    php artisan key:generate --force
fi

if ! grep -q '^JWT_SECRET=.\+' .env; then
    php artisan jwt:secret --force
fi

mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

php artisan config:clear >/dev/null
php artisan migrate --force

exec "$@"
