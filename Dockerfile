# Stage 1: Build the frontend
FROM node:16 AS frontend-build
WORKDIR /app
COPY ./frontend/package*.json ./
RUN npm install
COPY ./frontend ./
RUN npm run build

# Stage 2: Set up the Python backend
FROM python:3.9 AS backend
WORKDIR /app
COPY ./backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY ./backend ./

# Stage 3: Set up Nginx for serving frontend and reverse proxy for backend
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default Nginx configuration file
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy the built frontend files
COPY --from=frontend-build /app/build .

# Copy custom Nginx configuration
COPY ./nginx.conf /etc/nginx/conf.d/

# Copy the backend to a separate directory
WORKDIR /app/backend
COPY --from=backend /app .

# Expose ports
EXPOSE 80
EXPOSE 5000

# Start the backend and frontend
CMD ["sh", "-c", "python app.py & nginx -g 'daemon off;'"]
