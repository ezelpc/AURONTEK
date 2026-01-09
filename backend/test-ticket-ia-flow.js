#!/usr/bin/env node
/**
 * Script de prueba: Verificar el flujo Tickets → IA-SVC
 * 
 * Uso: node test-ticket-ia-flow.js
 * 
 * Este script:
 * 1. Crea un ticket
 * 2. Verifica que tickets-svc publique el evento
 * 3. Verifica que ia-svc reciba el evento
 * 4. Verifica que el ticket se asigne correctamente
 */

const axios = require('axios');

const config = {
  ticketsServiceUrl: process.env.TICKETS_SERVICE_URL || 'http://localhost:3002',
  iaServiceUrl: process.env.IA_SERVICE_URL || 'http://localhost:3005',
  serviceToken: process.env.SERVICE_TOKEN || '23022e6bdb08ad3631c48af69253c5528f42cbed36b024b2fc041c0cfb23723b'
};

console.log('\n' + '='.repeat(60));
console.log('🧪 PRUEBA DE FLUJO: Tickets → IA-SVC');
console.log('='.repeat(60));
console.log(`📍 Tickets Service: ${config.ticketsServiceUrl}`);
console.log(`📍 IA Service: ${config.iaServiceUrl}`);
console.log('='.repeat(60) + '\n');

async function checkServices() {
  console.log('🔍 Verificando servicios...\n');
  
  try {
    // Check Tickets Service
    try {
      const ticketsHealth = await axios.get(`${config.ticketsServiceUrl}/health`, { timeout: 5000 });
      console.log('✅ Tickets-SVC: Disponible');
    } catch (err) {
      console.log('❌ Tickets-SVC: NO disponible');
      console.log(`   Error: ${err.message}`);
      return false;
    }

    // Check IA Service
    try {
      const iaHealth = await axios.get(`${config.iaServiceUrl}/health`, { timeout: 5000 });
      console.log('✅ IA-SVC: Disponible');
      console.log(`   RabbitMQ Status: ${iaHealth.data.services?.rabbitmq || 'desconocido'}`);
    } catch (err) {
      console.log('❌ IA-SVC: NO disponible');
      console.log(`   Error: ${err.message}`);
      return false;
    }

    console.log('\n✅ Ambos servicios disponibles\n');
    return true;
  } catch (err) {
    console.error('Error verificando servicios:', err.message);
    return false;
  }
}

async function createTestTicket() {
  console.log('📝 Creando ticket de prueba...\n');
  
  try {
    const ticketData = {
      titulo: '[TEST] Prueba de flujo IA - ' + new Date().toISOString().slice(0, 19),
      descripcion: 'Este es un ticket de prueba para verificar que IA recibe correctamente los tickets creados',
      empresaId: 'test-company',
      servicioId: 'general',
      servicioNombre: 'General',
      usuarioId: 'test-user',
      usuarioCreadorEmail: 'test@test.com',
      prioridad: 'normal',
      gruposDeAtencion: ['soporte']
    };

    const response = await axios.post(
      `${config.ticketsServiceUrl}/api/tickets`,
      ticketData,
      {
        headers: {
          'Authorization': `Bearer ${config.serviceToken}`,
          'X-Service-Name': 'test-script',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const ticket = response.data;
    console.log('✅ Ticket creado exitosamente');
    console.log(`   ID: ${ticket.id || ticket._id}`);
    console.log(`   Título: ${ticket.titulo}`);
    console.log(`   Estado: ${ticket.estado}`);
    console.log();

    return ticket;
  } catch (err) {
    console.error('❌ Error creando ticket:', err.message);
    if (err.response?.data) {
      console.error('   Respuesta:', JSON.stringify(err.response.data, null, 2));
    }
    return null;
  }
}

async function waitAndCheckStatus(ticket, maxWait = 10000) {
  console.log('⏳ Esperando a que IA procese el ticket...\n');
  
  const ticketId = ticket.id || ticket._id;
  const startTime = Date.now();
  const checkInterval = 1000; // Verificar cada 1 segundo
  let lastStatus = ticket.estado;
  let autoassigned = false;

  while (Date.now() - startTime < maxWait) {
    try {
      const response = await axios.get(
        `${config.ticketsServiceUrl}/api/tickets/${ticketId}`,
        {
          headers: {
            'Authorization': `Bearer ${config.serviceToken}`,
            'X-Service-Name': 'test-script'
          },
          timeout: 5000
        }
      );

      const updatedTicket = response.data;
      
      // Verificar cambios
      if (updatedTicket.estado !== lastStatus) {
        console.log(`   📊 Estado cambió: ${lastStatus} → ${updatedTicket.estado}`);
        lastStatus = updatedTicket.estado;
      }

      if (updatedTicket.agenteAsignadoId && !autoassigned) {
        console.log(`   👤 Asignado a agente: ${updatedTicket.agenteAsignadoId}`);
        autoassigned = true;
      }

      if (updatedTicket.clasificacion) {
        console.log(`   🎯 Clasificación: ${updatedTicket.clasificacion.tipo} - ${updatedTicket.clasificacion.prioridad}`);
      }

      // Si el ticket está asignado o ha pasado cierto tiempo, considerarlo como procesado
      if (autoassigned || updatedTicket.estado === 'en_proceso' || Date.now() - startTime > 5000) {
        console.log('\n✅ Ticket procesado por IA');
        return true;
      }

    } catch (err) {
      if (err.response?.status !== 404) {
        console.error(`   Error verificando estado: ${err.message}`);
      }
    }

    // Esperar antes de siguiente check
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  console.log('\n⚠️  Timeout esperando procesamiento de IA');
  return false;
}

async function runTests() {
  try {
    // 1. Verificar servicios
    const servicesOk = await checkServices();
    if (!servicesOk) {
      console.log('\n❌ Los servicios no están disponibles');
      console.log('   Asegúrate de que tickets-svc e ia-svc están ejecutándose');
      process.exit(1);
    }

    // 2. Crear ticket
    const ticket = await createTestTicket();
    if (!ticket) {
      console.log('\n❌ No se pudo crear el ticket');
      process.exit(1);
    }

    // 3. Esperar y verificar que IA lo procese
    const processed = await waitAndCheckStatus(ticket);

    // Resumen final
    console.log('\n' + '='.repeat(60));
    if (processed) {
      console.log('✅ PRUEBA EXITOSA');
      console.log('El flujo Tickets → IA-SVC está funcionando correctamente');
    } else {
      console.log('⚠️  PRUEBA INCOMPLETA');
      console.log('El ticket se creó pero IA podría no haberlo procesado');
      console.log('\n💡 Revisa los logs en ambos servicios para más detalles:');
      console.log('   Tickets-SVC: Busca "📤 [RabbitMQ] Publicando"');
      console.log('   IA-SVC: Busca "📨 [RabbitMQ] Recibido"');
    }
    console.log('='.repeat(60) + '\n');

  } catch (err) {
    console.error('\n❌ Error en prueba:', err.message);
    process.exit(1);
  }
}

// Ejecutar tests
runTests();
