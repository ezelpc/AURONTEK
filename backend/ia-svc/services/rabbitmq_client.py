import pika
import json
from typing import Callable, Any
import threading
import asyncio
from functools import partial

class RabbitMQClient:
    def __init__(self, url: str):
        self.url = url
        self.connection = None
        self.channel = None
        
    def connect(self):
        """Establecer conexión con RabbitMQ"""
        if not self.connection or self.connection.is_closed:
            self.connection = pika.BlockingConnection(
                pika.URLParameters(self.url)
            )
            self.channel = self.connection.channel()
            
            # Declarar exchanges
            self.channel.exchange_declare(
                exchange='tickets',
                exchange_type='topic',
                durable=True
            )
            
    def close(self):
        """Cerrar conexión"""
        if self.connection and not self.connection.is_closed:
            self.connection.close()
            
    def publish(self, routing_key: str, message: dict):
        """Publicar mensaje en el exchange"""
        try:
            self.connect()
            self.channel.basic_publish(
                exchange='tickets',
                routing_key=routing_key,
                body=json.dumps(message),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # mensaje persistente
                    content_type='application/json'
                )
            )
        except Exception as e:
            print(f"Error al publicar mensaje: {e}")
            raise
            
    def start_consuming(self, queue_name: str, routing_key: str, callback: Callable[[dict], Any]):
        """Iniciar consumo de mensajes"""
        try:
            self.connect()
            
            # Declarar cola
            self.channel.queue_declare(queue=queue_name, durable=True)
            
            # Vincular cola al exchange
            self.channel.queue_bind(
                exchange='tickets',
                queue=queue_name,
                routing_key=routing_key
            )
            
            def message_handler(ch, method, properties, body):
                try:
                    message = json.loads(body)
                    # Ejecutar callback en un hilo separado para no bloquear
                    threading.Thread(
                        target=partial(self._handle_message, callback, message)
                    ).start()
                except json.JSONDecodeError:
                    print(f"Error decodificando mensaje: {body}")
                finally:
                    ch.basic_ack(delivery_tag=method.delivery_tag)
                    
            # Configurar consumo
            self.channel.basic_qos(prefetch_count=1)
            self.channel.basic_consume(
                queue=queue_name,
                on_message_callback=message_handler
            )
            
            print(f"Iniciando consumo en cola {queue_name}")
            self.channel.start_consuming()
            
        except Exception as e:
            print(f"Error en consumo de mensajes: {e}")
            raise
            
    def _handle_message(self, callback: Callable[[dict], Any], message: dict):
        """Manejar mensaje recibido"""
        try:
            # Si el callback es una corutina, ejecutarla en un evento loop
            if asyncio.iscoroutinefunction(callback):
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(callback(message))
                loop.close()
            else:
                callback(message)
        except Exception as e:
            print(f"Error procesando mensaje: {e}")