FROM nginx:alpine
LABEL authors="quentin-michon/gianni-bee"

WORKDIR /app

# Supprime la config par défaut
RUN rm /etc/nginx/conf.d/default.conf

# Copie le build React
COPY dist/ /usr/share/nginx/html/

# Expose le port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]