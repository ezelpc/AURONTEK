import json
import re

# Raw text data containing the service catalog information
data = """
Nombre del Servicio Incidente/ Requerimiento Categoría Dependencias del servicio Ciclo de Vida Impacto Urgencia Prioridad SLA Cliente Grupos de atención
Mapeo de carpetas compartidas Requerimiento Almacenamiento Server File Activos 3 1 Alta 4 horas Mesa de Servicio
Cambios de usuario en carpeta compartida Requerimiento Almacenamiento Server File Activos 3 1 Media 8 horas Servidores/Respaldos/Storage
La carpeta no esta disponible Incidente Almacenamiento Server File Activos 3 3 Baja 20 horas Servidores/Respaldos/Storage
Alta de usuario a carpeta compartida Requerimiento Almacenamiento Directorio Activo Activos 2 1 Alta 8 horas Servidores/Respaldos/Storage
Baja de usuario en carpeta compartida Requerimiento Almacenamiento Server File Activos 3 1 Alta 8 horas Servidores/Respaldos/Storage
Permisos de acceso a servidor Requerimiento Almacenamiento Directorio Activo Activos 2 3 Media 12 horas Servidores/Respaldos/Storage
Requerimientos varios (aplicaciones) Requerimiento Aplicaciones internas La solicitud del requerimiento debe estar autorizada por el lider y se requieren los servidores de desarrollo disponibles para llevar a cabo la solicitud Activos 3 2 Media 24 horas Desarrollo Y BD
Robo de equipo cómputo Incidente Computo Personal Acta de Robo Activos 2 2 Media 32 horas Mesa de Servicio
Hojas de liberación Requerimiento Computo Personal CMDB Activos 2 2 Media 8 horas Mesa de Servicio
Prestamo de equipo/cargador Requerimiento Computo Personal NA Activos 2 2 Media 8 horas Mesa de Servicio
Solicitud de proyector y Poly Requerimiento Computo Personal NA Activos 2 2 Media 8 horas Soporte Ti
Solicitud de Reporte Requerimiento Computo Personal NA Activos 2 2 Media 20 horas Mesa de Servicio
Autorización, adquisición y asignación periféricos Requerimiento Computo Personal Vo. Bo. Lider de área, ordenes de compra, Sharepoint Activos 3 2 Baja 180 horas Soporte Ti
Instalación de periféricos Requerimiento Computo Personal NA Activos 3 1 Media 12 horas Mesa de Servicio
Respaldo de informacion de equipo Requerimiento Computo Personal Vo. Bo. Lider de área, Rutas con accesos y permisos, Sharepoint Activos 3 2 Baja 20 horas Mesa de Servicio
Autorización, adquisición y asignación de Monitor, Teclado o Mouse Requerimiento Computo Personal Vo. Bo. Lider de área, Equipo en existencia o proveedor de cómputo Activos 3 3 Baja 180 horas Soporte Ti
Soporte a periféricos (Pantalla, CPU, Mouse, Teclado, Pila, Cargador, Memoria, Disco Duro, proyector) Incidente Computo Personal Proveedor del equipo (de ser necesario) Activos 3 2 Media 20 horas Mesa de Servicio
Bajo rendimiento equipo computo Incidente Computo Personal NA Activos 3 3 Baja 20 horas Mesa de Servicio
Falla en equipo de computo Incidente Computo Personal Gatantías de proveedor del equipo (de ser necesario) Activos 3 2 Media 40 horas Mesa de Servicio
Migracion de informacion Requerimiento Computo Personal Vo. Bo. Lider de área, Rutas con accesos y permisos, Sharepoint Activos 3 2 Media 20 horas Soporte Ti
ABC de herramientas usuario Requerimiento Computo Personal Se requiere la solicitud de RH y la base de datos activa Activos 3 2 Media 32 horas Soporte Ti
Asignacion de equipo nuevo usuario Requerimiento Computo Personal Se requiere la solicitud de RH y la base de datos activa Activos 2 3 Media 20 horas Mesa de Servicio
Baja de equipo computo Requerimiento Computo Personal Se requiere la solicitud de RH y la base de datos activa Activos 3 2 Media 12 horas Mesa de Servicio
Reimpresion de Responsiva Requerimiento Computo Personal NA Activos 2 3 Media 12 horas Mesa de Servicio
Permisos de administrador Requerimiento Computo Personal Vo. Bo Lider Activos 2 1 Alta 8 horas Mesa de Servicio
Cambio de equipo computo Requerimiento Computo Personal Vo. Bo del lider por mejorar rendimiento laboral Activos 3 2 Media 40 horas Soporte Ti
No Sincroniza One Drive Incidente Correo Electrónico TENANT 365 Activos 1 2 Alta 4 horas MS 365
Redireccionamiento de correo Requerimiento Correo electrónico TENANT 365, autorización propietario de la cuenta Activos 2 1 Alta 8 horas MS 365
Cambio de contraseña correo Requerimiento Correo electrónico TENANT 365 Activos 2 1 Alta 2 horas MS 365
Respaldo de correo electronico Requerimiento Correo Electrónico TENANT 365 Activos 3 1 Alta 12 horas MS 365
Configuracion de Outlook Requerimiento Correo Electrónico TENANT 365 Activos 3 2 Media 12 horas MS 365
Resteo de Autenticador Requerimiento Correo electrónico TENANT 365 Activos 2 1 Alta 2hrs MS 365
Creacion de buzon compartido requerimiento Correo electrónico TENANT 365 Activos 3 3 Media 8 horas MS 365
Alta baja o cambios de Buzon Compartido Requerimiento Correo electrónico TENANT 365 Activos 3 2 Media 8 horas MS 365
Degradación de correo M365 Incidente Correo electrónico TENANT 365, Partner Activos 1 2 Alta 40 horas MS 365
Solicitud de Reportes M365 Requerimiento Correo Electrónico TENANT 365 Activos 2 2 Media 12 horas MS 365
Alta de correo M365 Requerimiento Correo Electrónico TENANT 365 Activos 3 1 Alta 8 horas MS 365
Baja de correo M365 Requerimiento Correo Electrónico TENANT 365 Activos 3 1 Alta 8 horas MS 365
Correo fuera de Servicio M 365 Incidente Correo Electrónico TENANT 365 Activos 1 1 Alta 4 horas MS 365
Fallo en envío y recepción de correo Incidente Correo Electrónico TENANT 365 Activos 3 1 Alta 4 horas MS 365
Creación de lista de distribución Requerimiento Correo Electrónico TENANT 365 Activos 3 3 Media 8 horas MS 365
Baja de lista de distribución Requerimiento Correo Electrónico TENANT 365 Activos 3 2 Media 8 horas MS 365
Cambio a lista de distribución Requerimiento Correo Electrónico TENANT 365 Activos 3 2 Media 8 horas MS 365
Desbloqueo de cuenta Requerimiento Directorio Activo Directorio Activo Activos 3 1 Alta 2 horas Mesa de Servicio
Cambio de contraseña a usuario Requerimiento Directorio Activo Directorio Activo Activos 3 1 Alta 2 horas Mesa de Servicio
Cambio de fondo de pantalla Requerimiento Directorio Activo Directorio Activo Activos 3 1 Alta 4 horas Servidores/Respaldos/Storage
Falla en el servicio Incidente Directorio Activo Directorio Activo Activos 1 1 Alta 8 horas Servidores/Respaldos/Storage
Modificación de datos Requerimiento Directorio Activo Directorio Activo Activos 3 1 Alta 8 horas Servidores/Respaldos/Storage
Alta de usuario, equipo Requerimiento Directorio Activo Directorio Activo Activos 3 1 Alta 8 horas Servidores/Respaldos/Storage
Soporte Funcional Incidente ERP SAP CONCUR Solicitud completa y se requieren los servidores de desarrollo disponibles para llevar a cabo la solicitud Activos 3 2 Media 20 horas ERP
Mantenimiento de Usuarios Requerimiento ERP SAP BO Solicitud completa y se requieren los servidores de desarrollo disponibles para llevar acabo la solicitud Activos 2 2 Media 16 horas aplicativos
Generación de consultas de explotación de la información Requerimiento ERP SAP BO Solicitud completa y se requieren los servidores de desarrollo disponibles para llevar acabo la solicitud Activos 3 3 Baja 40 horas ERP
Mantenimiento de Usuarios Requerimiento ERP SAP CONCUR Solicitud completa y se requieren los servidores de desarrollo disponibles para llevar acabo la solicitud Activos 2 2 Media 8 horas aplicativos
Configuración de carpeta para escaneo local Requerimiento Impresión Inplant Impresoras 2 1 Alta 2 horas Mesa de Servicio
Sustitución de Toner Foraneas Requerimiento Impresión Inplant Impresoras, proveedor 2 1 Alta 24 horas Mesa de Servicio
Sustitución de Toner corporativo Requerimiento Impresión Inplant Impresoras 2 1 Alta 2 horas Mesa de Servicio
Problemas configuiración del keyscan para impresión y copiado Incidente Impresión Inplant Impresoras Activos 2 1 Alta 4 horas Mesa de Servicio
Mantenimiento impresoras Requerimiento Impresión Inplant Impresoras Activos 3 1 Alta 8 horas Mesa de Servicio
Configuración de impresora Requerimiento Impresión Inplant Impresoras Activos 2 1 Alta 8 horas Mesa de Servicio
Configuiración del keyscan para impresión y copiado Requerimiento Impresión Inplant Impresoras Activos 3 2 Media 8 horas Mesa de Servicio
Falla de impresora (general) Incidente Impresión Inplant Impresoras Activos 2 1 Alta 8 horas Mesa de Servicio
Falla de impresión (usuario) Incidente Impresión Inplant Impresoras Activos 2 1 Alta 8 horas Mesa de Servicio
Alta, baja o cambio de servidor/switch Requerimiento Infraestructura NA Activos 2 1 Alta 12 horas Servidores/Respaldos/Storage
Mantenimiento a servidores Requerimiento Infraestructura NA Activos 2 1 Alta 24 horas Servidores/Respaldos/Storage
Mantenimiento a switches Requerimiento Infraestructura NA Activos 2 1 Alta 8 horas Servidores/Respaldos/Storage
Configuración de VPN Requerimiento Redes Firewall Activos 3 2 Alta 8 horas Mesa de Servicio
Alta de usuario de VPN Requerimiento Redes Firewall, Vo Bo Lider Activos 3 2 Alta 8 horas Telecomunicaciones
Reseteo password usuario VPN Requerimiento Redes Firewall Activos 2 1 Alta 2 horas Telecomunicaciones
Acceso a la red de invitados Requerimiento Redes Firewall Activos 2 1 Alta 8 horas Telecomunicaciones
Configurar equipo acceso a internet Requerimiento Redes NA Activos 3 1 Alta 8 horas Mesa de Servicio
Falla en equipo de telecomunicaciones incidente Redes Respaldo de equipo, equipo backup 1 1 critica 8 horas Telecomunicaciones
Solicitud de cable de red Requerimiento Redes NA Activos 3 2 Media 8 horas Telecomunicaciones
Solicitud de Reporte Requerimiento Redes Firewall 2 2 Media 12 horas Telecomunicaciones
Baja de usuario de VPN Requerimiento Redes Firewall, solicitud de RH Activos 3 2 Alta 8 horas Telecomunicaciones
Alta, baja o cambio de enlaces de internet Requerimiento Redes CARRIER, Firewall, Vo Bo Lider Activos 2 2 Media 8 horas Telecomunicaciones
Caída de enlace Foráneos Incidente Redes CARRIER Activos 3 3 Baja 20 Horas Telecomunicaciones
Caída de enlace Local Incidente Redes CARRIER Activos 1 2 Alta 4 horas Telecomunicaciones
Sin señal wifi Incidente Redes Firewall Activos 2 2 Media 12 horas Telecomunicaciones
Sin salida a Internet Incidente Redes CARRIER, Firewall Activos 2 2 Media 12 horas Telecomunicaciones
Apoyo a UN´s en procesos de licitación Requerimiento Requerimientos Especiales NA Activos 3 1 Alta 6 horas EXTRAORDINARIOS
Apoyo a Presidencia y Direcciones Requerimiento Requerimientos Especiales NA Activos 3 1 Alta 6 horas EXTRAORDINARIOS
Apoyo circuito cerrado CCTV Requerimiento Requerimientos Especiales NA Activos 2 2 Media 12 horas Telecomunicaciones
Falla en equipo de seguridad incidente Seguridad Respaldo de equipo, equipo backup 1 1 critica 8 horas Seguridad
Generación de reporte Requerimiento Seguridad Firewall, DLP, consola Antivirus Activos 3 2 Media 12 horas Seguridad
Acceso/bloqueo de dominios Anti-spam Requerimiento Seguridad Hornet Activos 3 1 Alta 4 horas Seguridad
Perdida / Extravío de info / DP Incidente Seguridad NA 1 2 Alta 4 horas Seguridad
Uso/ acceso/ tratamiento no autorizado de info / DP Incidente Seguridad NA 1 2 Alta 4 horas Seguridad
Daño / Alteración /modificación no autorizado de info / DP Incidente Seguridad NA 1 2 Alta 4 horas Seguridad
Robo de Info / DP Incidente Seguridad DLP Activos 1 2 Alta 4 horas Seguridad
Indisponibilidad / Denegacion de Servicios (DDoS) Incidente Seguridad Firewall Activos 1 2 Alta 4 horas Seguridad
Virus Incidente Seguridad Cytomic Activos 1 2 Alta 4 horas Seguridad
Spam / Malware Incidente Seguridad Cytomic Activos 1 2 Alta 4 horas Seguridad
Solicitud de acceso a sitios Sharepoint Requerimiento Sharepoint M365 TENANT 365 Activos 2 1 Alta 4 horas MS 365
Alta de sitios compatidos Requerimiento Sharepoint M365 TENANT 365 2 1 Alta 8 horas MS 365
Baja de sitios comaprtidos Requerimiento Sharepoint M365 TENANT 365 3 1 Alta 8 horas MS 365
Cambios en sitios compartidos Requerimiento Sharepoint M365 TENANT 365 3 2 Media 8 horas MS 365
Respaldo de sitios compartidos Requerimiento Sharepoint M365 TENANT 365 2 2 Media 24 horas MS 365
Degradación de acceso a sitios Incidente Sharepoint M365 TENANT 365, Partner 2 1 Alta 24 horas MS 365
Falla de software Incidente Software NA Activos 3 2 Media 8 horas Mesa de Servicio
Configuracion del Sistema Operativo Requerimiento Software NA Activos 3 2 Media 8 horas Mesa de Servicio
Configuracion de software Requerimiento Software NA Activos 3 2 Media 20 horas Mesa de Servicio
Autorizacion y Adquisición de Software Ofimatica Requerimiento Software Vo. Bo Lider Activos 3 2 Baja 40 horas Soporte Ti
Autorizacion y Adquisición de Software NO Ofimatica Requerimiento Software vo. Bo Líder Activos 3 3 Baja 40 horas Soporte Ti
Activación de licencia OFFICE Requerimiento Software NA Activos 1 2 Alta 4 horas Mesa de Servicio
Instalacion de Software Requerimiento software NA Activos 3 2 Media 8 horas Mesa de Servicio
Sin servicio de telefonia (usuario) Incidente Telefonía Fija NA Activos 1 2 Alta 4 horas Telecomunicaciones
Sin servicio de telefonia (general) Incidente Telefonía Fija Call Manager Activos 2 2 Media 20 horas Telecomunicaciones
Solicitud de Reporte Requerimiento Telefonía Fija Call Manager Activos 2 2 Media 8 horas Telecomunicaciones
Alta de extension Requerimiento Telefonía Fija Se requiere la solicitud de RH y la base de datos activa Activos 3 2 Media 8 horas Telecomunicaciones
Baja de extension Requerimiento Telefonía Fija Se requiere la solicitud de RH y la base de datos activa Activos 3 2 Media 8 horas Telecomunicaciones
Modificacion de extension Requerimiento Telefonía Fija NA Activos 3 2 Media 8 horas Telecomunicaciones
Alta de clave telefonica Requerimiento Telefonía Fija NA Activos 2 1 Alta 8 horas Telecomunicaciones
Baja de clave telefonica Requerimiento Telefonía Fija Se requiere la solicitud de RH y la base de datos activa Activos 3 1 Alta 8 horas Telecomunicaciones
Modificación a clave telefonica Requerimiento Telefonía Fija NA Activos 1 2 Alta 8 horas Telecomunicaciones
""
# List to store the parsed service data
services = []
# Split the raw data into individual lines and skip empty lines
lines = [line for line in data.strip().split('\n') if line]

# Regex to identify the service type, which helps in separating the service name from other details
# It looks for 'Incidente' or 'Requerimiento' as whole words
tipo_pattern = re.compile(r'\s(Incidente|Requerimiento)\s')

# Headers for the JSON objects, extracted from the first line of the raw data
headers = [
    "nombre", "tipo", "categoria", "dependencias", "cicloDeVida", "impacto", 
    "urgencia", "prioridad", "sla", "cliente", "gruposDeAtencion"
]

# Process each line to extract service details
for line in lines[1:]:  # Skip the header line
    # Search for the service type ('Incidente' or 'Requerimiento')
    match = tipo_pattern.search(line)
    if not match:
        continue

    # Extract the service name and the rest of the data
    nombre = line[:match.start()].strip()
    tipo = match.group(1)
    # The rest of the line contains the other service attributes
    resto = line[match.end():].strip()
    
    # Split the remaining part of the line into components
    parts = [p.strip() for p in resto.split()]
    
    # Heuristic parsing for the rest of the fields
    # This part is complex due to the variable content in each field
    # and requires manual adjustments based on observed patterns
    # For simplicity, a direct mapping is assumed, which may need refinement
    
    # This is a simplified parsing logic and might not cover all edge cases
    # It assumes a fixed number of parts after the service type
    # A more robust solution would require a more detailed analysis of the data format
    
    # A placeholder for the parsed data
    service_data = {
        "nombre": nombre,
        "tipo": tipo
    }
    
    # Attempt to fill the other fields based on the split parts
    # This is a best-effort approach
    # For example, 'categoria' is the first part, 'dependencias' the next, and so on
    if len(parts) >= 9:
        service_data["categoria"] = parts[0]
        service_data["dependencias"] = parts[1]
        service_data["cicloDeVida"] = parts[2]
        service_data["impacto"] = parts[3]
        service_data["urgencia"] = parts[4]
        service_data["prioridad"] = parts[5]
        service_data["sla"] = f"{parts[6]} {parts[7]}"
        service_data["cliente"] = " ".join(parts[8:-1])
        service_data["gruposDeAtencion"] = parts[-1]

    services.append(service_data)

# Convert the list of services to a JSON formatted string
json_output = json.dumps(services, indent=4, ensure_ascii=False)

# Define the output file path
output_file_path = 'backend/tickets-svc/src/Config/catalogo.json'

# Write the JSON output to the specified file
with open(output_file_path, 'w', encoding='utf-8') as f:
    f.write(json_output)
