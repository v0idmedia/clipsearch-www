FROM php:8.3-apache

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf \
    -e 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf \
    && a2enmod headers expires rewrite

COPY public/ /var/www/html/public/
COPY storage/ /var/www/html/storage/

RUN chown -R www-data:www-data /var/www/html/storage

EXPOSE 80
