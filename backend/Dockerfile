FROM php:8.2-fpm

# Instala dependências do sistema
RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    libzip-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libonig-dev \
    libxml2-dev \
    && docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
    && docker-php-ext-install \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Instala o Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Define a pasta de trabalho
WORKDIR /var/www/html

# Copia os arquivos do Laravel
COPY . .

# Instala as dependências do PHP
RUN composer install \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader

# Permissões necessárias para o Laravel
RUN chown -R www-data:www-data \
    /var/www/html/storage \
    /var/www/html/bootstrap/cache

# Usuário utilizado pelo PHP-FPM
USER www-data

EXPOSE 9000

CMD ["php-fpm"]