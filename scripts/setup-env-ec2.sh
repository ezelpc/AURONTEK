# Script de Configuración de Variables de Entorno para EC2 EDGE
# Ejecutar este script EN EL SERVIDOR EC2 después del despliegue

#!/bin/bash

echo "🚀 Configurando variables de entorno en EC2 EDGE..."
echo ""

# Directorio base del proyecto
PROJECT_DIR="/home/ubuntu/AURONTEK/backend"

# SERVICE_TOKEN (debe ser el mismo en todos los servicios)
SERVICE_TOKEN="AURONTEK_SERVICE_SECRET_2024"

# ============================================================================
# 1. TICKETS-SVC
# ============================================================================
echo "📝 Configurando tickets-svc..."
cat >> $PROJECT_DIR/tickets-svc/.env << EOF

# Variables agregadas para producción
USUARIOS_SVC_URL=http://localhost:3000/api
SERVICE_TOKEN=$SERVICE_TOKEN
RABBITMQ_URL=amqp://localhost
EOF

# ============================================================================
# 2. IA-SVC
# ============================================================================
echo "📝 Configurando ia-svc..."
cat >> $PROJECT_DIR/ia-svc/.env << EOF

# Variables agregadas para producción
USUARIOS_SVC_URL=http://localhost:3000/api
TICKETS_SVC_URL=http://localhost:3000/api
SERVICE_TOKEN=$SERVICE_TOKEN
RABBITMQ_URL=amqp://localhost
OPENAI_API_KEY=sk-REEMPLAZAR-CON-TU-API-KEY
EOF

# ============================================================================
# 3. GATEWAY-SVC
# ============================================================================
echo "📝 Configurando gateway-svc..."
cat >> $PROJECT_DIR/gateway-svc/.env << EOF

# Variables agregadas para producción
CHAT_SERVICE_URL=http://localhost:3003
NOTIFICATIONS_SERVICE_URL=http://localhost:3004
EOF

# ============================================================================
# 4. USUARIOS-SVC
# ============================================================================
echo "📝 Configurando usuarios-svc..."
# Verificar si ya tiene SERVICE_TOKEN
if ! grep -q "SERVICE_TOKEN" $PROJECT_DIR/usuarios-svc/.env; then
    echo "SERVICE_TOKEN=$SERVICE_TOKEN" >> $PROJECT_DIR/usuarios-svc/.env
fi

# ============================================================================
# 5. CHAT-SVC
# ============================================================================
echo "📝 Configurando chat-svc..."
if ! grep -q "SERVICE_TOKEN" $PROJECT_DIR/chat-svc/.env; then
    echo "SERVICE_TOKEN=$SERVICE_TOKEN" >> $PROJECT_DIR/chat-svc/.env
fi

# ============================================================================
# 6. NOTIFICACIONES-SVC
# ============================================================================
echo "📝 Configurando notificaciones-svc..."
if ! grep -q "SERVICE_TOKEN" $PROJECT_DIR/notificaciones-svc/.env; then
    echo "SERVICE_TOKEN=$SERVICE_TOKEN" >> $PROJECT_DIR/notificaciones-svc/.env
fi

echo ""
echo "✅ Variables de entorno configuradas!"
echo ""
echo "⚠️  IMPORTANTE: Edita ia-svc/.env y reemplaza OPENAI_API_KEY con tu clave real"
echo ""
echo "🔄 Reiniciando servicios..."
pm2 restart all

echo ""
echo "📊 Estado de los servicios:"
pm2 list

echo ""
echo "✅ Configuración completada!"
echo ""
echo "Para verificar los logs:"
echo "  pm2 logs tickets-svc --lines 20"
echo "  pm2 logs ia-svc --lines 20"
