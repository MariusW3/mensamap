FROM nginx:alpine

# Copy static assets to Nginx html directory
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY data.js /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY editor.js /usr/share/nginx/html/

# Expose Nginx default HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
