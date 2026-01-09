import pika
import json
from typing import Callable, Any
import threading
import asyncio
from functools import partial
import time

class RabbitMQClient:
    def __init__(self, url: str):
        self.url = url
        self.connection = None
        self.channel = None
        self._consumer_cancelled = False
        
    def connect(self):
        """Establecer conexión con RabbitMQ"""
        if not self.connection or self.connection.is_closed:
            print(f"🔌 [RabbitMQ] Conectando a {self.url.split('@')[-1] if '@' in self.url else 'localhost'}...")
            
            params = pika.URLParameters(self.url)
            params.socket_timeout = 15
            params.heartbeat = 60
            params.blocked_connection_timeout = 300
            params.connection_attempts = 3
            params.retry_delay = 2
            
            if self.url.startswith('amqps://'):
                import ssl
                context = ssl.create_default_context()
                context.check_hostname = False
                context.verify_mode = ssl.CERT_NONE
                params.ssl_options = pika.SSLOptions(context)

            try:
                self.connection = pika.BlockingConnection(params)
                self.channel = self.connection.channel()
                self.channel.exchange_declare(exchange='tickets', exchange_type='topic', durable=True)
                print('✅ [RabbitMQ] Conectado exitosamente')
            except Exception as e:
                print(f'❌ [RabbitMQ] Error en conexión: {e}')
                raise
            
    def stop_consuming(self):
        """Detener consumo de forma segura"""
        try:
            self._consumer_cancelled = True
            if self.channel and hasattr(self.channel, 'stop_consuming'):
                self.channel.stop_consuming()
        except Exception as e:
            print(f'⚠️  [RabbitMQ] Error deteniendo: {e}')

    def close(self):
        """Cerrar conexión de forma segura"""
        try:
            self.stop_consuming()
            if self.connection and not self.connection.is_closed:
                self.connection.close()
            print('🔗 [RabbitMQ] Conexión cerrada')
        except Exception as e:
            print(f'⚠️  [RabbitMQ] Error al cerrar: {e}')
        finally:
            self.connection = None
            self.channel = None
            
    def publish(self, routing_key: str, message: dict):
        """Publicar mensaje en exchange"""
        try:
            if not self.connection or self.connection.is_closed:
                self.connect()
            payload = json.dumps(message)
            self.channel.basic_publish(
                exchange='tickets',
                routing_key=routing_key,
                body=payload,
                properties=pika.BasicProperties(
                    delivery_mode=2,
                    content_type='application/json'
                )
            )
            print(f'✅ [RabbitMQ] Publicado: {routing_key}')
        except Exception as e:
            print(f'❌ [RabbitMQ] Error publicando: {e}')
            
    def _handle_message(self, callback: Callable[[dict], Any], message: dict):
        """Procesar mensaje en thread separado"""
        try:
            if asyncio.iscoroutinefunction(callback):
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    loop.run_until_complete(callback(message))
                finally:
                    loop.close()
            else:
                callback(message)
        except Exception as e:
            print(f'❌ [RabbitMQ] Error procesando mensaje: {e}')

    def start_consuming(self, queue_name: str, routing_key: str, callback: Callable[[dict], Any]):
        """Iniciar consumo de mensajes con reintentos"""
        self._consumer_cancelled = False
        retry_count = 0
        max_retries = 10
        
        while not self._consumer_cancelled:
            try:
                retry_count = 0  # Reset al conectarse exitosamente
                self.connect()
                
                # Declarar cola y vincular a exchange
                self.channel.queue_declare(queue=queue_name, durable=True)
                self.channel.queue_bind(
                    exchange='tickets',
                    queue=queue_name,
                    routing_key=routing_key
                )
                
                print(f'✅ [RabbitMQ] Escuchando en cola: {queue_name}')
                
                def message_handler(ch, method, properties, body):
                    """Callback para manejar mensajes recibidos"""
                    try:
                        message = json.loads(body)
                        print(f'📨 [RabbitMQ] Recibido: {routing_key}')
                        # Ejecutar callback en thread separado
                        threading.Thread(
                            target=partial(self._handle_message, callback, message),
                            daemon=True
                        ).start()
                    except json.JSONDecodeError as je:
                        print(f'❌ [RabbitMQ] Error decodificando JSON: {je}')
                    finally:
                        ch.basic_ack(delivery_tag=method.delivery_tag)
                
                # Configurar consumo
                self.channel.basic_qos(prefetch_count=1)
                self.channel.basic_consume(
                    queue=queue_name,
                    on_message_callback=message_handler
                )
                
                # Empezar a consumir
                self.channel.start_consuming()
                
            except (pika.exceptions.StreamLostError, 
                    pika.exceptions.ConnectionClosedByBroker,
                    pika.exceptions.AMQPConnectionError) as e:
                if self._consumer_cancelled:
                    break
                    
                retry_count += 1
                if retry_count >= max_retries:
                    print(f'❌ [RabbitMQ] Máximo de reintentos alcanzado ({max_retries})')
                    break
                
                wait_time = min(5 * retry_count, 30)  # 5s, 10s, 15s... máx 30s
                print(f'⚠️  [RabbitMQ] Desconectado. Reintentando en {wait_time}s... (intento {retry_count}/{max_retries})')
                time.sleep(wait_time)
                
            except Exception as e:
                if self._consumer_cancelled:
                    break
                    
                retry_count += 1
                if retry_count >= max_retries:
                    print(f'❌ [RabbitMQ] Error crítico después de {max_retries} reintentos: {e}')
                    break
                
                wait_time = min(5 * retry_count, 30)
                print(f'⚠️  [RabbitMQ] Error: {e}. Reintentando en {wait_time}s...')
                time.sleep(wait_time)