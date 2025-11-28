# --- Etapa base ---
FROM python:3.11-slim

# Define el directorio de trabajo
WORKDIR /app

# Evita que Python genere archivos .pyc y que el buffer de logs se retrase
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instala dependencias del sistema necesarias y limpia para reducir tamaño
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copia los requirements e instálalos primero (mejor uso de caché)
COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copia el resto del código del proyecto
COPY . .

# Expone el puerto de la app
EXPOSE 3005

# Comando de ejecución en modo producción
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3005"]