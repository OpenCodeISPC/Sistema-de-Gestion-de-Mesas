# Imagen base oficial de Python 3.12 (slim para menor peso)
FROM python:3.12-slim

# Evita que Python escriba archivos .pyc y fuerza el stdout/stderr sin buffer
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Directorio de trabajo en el contenedor
WORKDIR /app

# Instalar dependencias del sistema necesarias para PostgreSQL y librerías C
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copia e instala dependencias de Python primero (aprovecha la caché de capas de Docker)
COPY requirements.txt /app/
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código del backend
COPY . /app/

# Puerto expuesto por Django
EXPOSE 8000