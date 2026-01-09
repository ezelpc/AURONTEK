#!/bin/bash
# verificacion-rapida.sh
# Script para verificar rápidamente si la solución está funcionando

echo "🔍 VERIFICACIÓN RÁPIDA DE AUTOASIGNACIÓN"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar que Tickets-SVC esté corriendo
echo "1️⃣  Verificando Tickets-SVC..."
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Tickets-SVC disponible${NC}"
else
    echo -e "${RED}❌ Tickets-SVC NO disponible${NC}"
    echo "   Ejecutar: cd backend/tickets-svc && npm run dev"
fi

# 2. Verificar que IA-SVC esté corriendo
echo ""
echo "2️⃣  Verificando IA-SVC..."
if curl -s http://localhost:3005/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ IA-SVC disponible${NC}"
    
    # Obtener estado de RabbitMQ
    RABBITMQ_STATUS=$(curl -s http://localhost:3005/health | grep -o '"rabbitmq":"[^"]*"' | cut -d'"' -f4)
    echo "   📡 RabbitMQ Status: $RABBITMQ_STATUS"
else
    echo -e "${RED}❌ IA-SVC NO disponible${NC}"
    echo "   Ejecutar: cd backend/ia-svc && python -m uvicorn main:app --reload"
fi

# 3. Verificar RABBITMQ_URL en .env
echo ""
echo "3️⃣  Verificando configuración..."

if [ -f "backend/tickets-svc/.env" ]; then
    if grep -q "RABBITMQ_URL" backend/tickets-svc/.env; then
        echo -e "${GREEN}✅ RABBITMQ_URL configurado en Tickets-SVC${NC}"
    else
        echo -e "${YELLOW}⚠️  RABBITMQ_URL NO encontrado en Tickets-SVC/.env${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Archivo .env no encontrado en Tickets-SVC${NC}"
fi

if [ -f "backend/ia-svc/.env" ]; then
    if grep -q "RABBITMQ_URL" backend/ia-svc/.env; then
        echo -e "${GREEN}✅ RABBITMQ_URL configurado en IA-SVC${NC}"
    else
        echo -e "${YELLOW}⚠️  RABBITMQ_URL NO encontrado en IA-SVC/.env${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Archivo .env no encontrado en IA-SVC${NC}"
fi

# 4. Resumen
echo ""
echo "========================================"
echo "📊 RESUMEN"
echo "========================================"
echo ""
echo "Para ejecutar la prueba completa:"
echo ""
echo "Opción A (Automática - RECOMENDADA):"
echo "  cd backend"
echo "  node test-ticket-ia-flow.js"
echo ""
echo "Opción B (Manual):"
echo "  1. Crear ticket via API/Frontend"
echo "  2. Ver logs en ambos servicios"
echo "  3. Buscar '✅ [RabbitMQ]' en logs"
echo ""
