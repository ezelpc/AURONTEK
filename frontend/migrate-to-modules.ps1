# Script de Migración - Frontend por Servicios
# Ejecutar desde: frontend/

Write-Host "🚀 Iniciando reorganización del frontend por servicios..." -ForegroundColor Green

# Crear estructura de carpetas
Write-Host "`n📁 Creando estructura de carpetas..." -ForegroundColor Yellow

$folders = @(
    "src\core\api",
    "src\core\contexts",
    "src\core\hooks",
    "src\core\components\layout",
    "src\core\components\common",
    "src\modules\tickets-svc\components",
    "src\modules\tickets-svc\pages",
    "src\modules\tickets-svc\hooks",
    "src\modules\tickets-svc\services",
    "src\modules\chat-svc\components",
    "src\modules\chat-svc\hooks",
    "src\modules\chat-svc\services",
    "src\modules\notificaciones-svc\components",
    "src\modules\notificaciones-svc\pages",
    "src\modules\notificaciones-svc\hooks",
    "src\modules\notificaciones-svc\services",
    "src\modules\ia-svc\components",
    "src\modules\ia-svc\services",
    "src\modules\usuarios-svc\components",
    "src\modules\usuarios-svc\pages",
    "src\modules\usuarios-svc\services",
    "src\modules\empresas-svc\pages",
    "src\modules\empresas-svc\services"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
}

Write-Host "✅ Estructura creada" -ForegroundColor Green

# Copiar archivos CORE
Write-Host "`n📦 Copiando archivos CORE (compartidos)..." -ForegroundColor Yellow

Copy-Item "src\api\api.js" -Destination "src\core\api\api.js" -Force
Copy-Item "src\contexts\SocketContext.jsx" -Destination "src\core\contexts\SocketContext.jsx" -Force
Copy-Item "src\contexts\NotificationContext.jsx" -Destination "src\core\contexts\NotificationContext.jsx" -Force
Copy-Item "src\hooks\useAuth.js" -Destination "src\core\hooks\useAuth.js" -Force
Copy-Item "src\components\layout\*" -Destination "src\core\components\layout\" -Recurse -Force
Copy-Item "src\components\PrivateRoute.jsx" -Destination "src\core\components\common\PrivateRoute.jsx" -Force -ErrorAction SilentlyContinue
Copy-Item "src\ErrorBoundary.js" -Destination "src\core\components\common\ErrorBoundary.js" -Force -ErrorAction SilentlyContinue

Write-Host "✅ Archivos CORE copiados" -ForegroundColor Green

# Copiar módulo TICKETS
Write-Host "`n🎫 Migrando módulo tickets-svc..." -ForegroundColor Yellow

Copy-Item "src\components\tickets\TicketList.jsx" -Destination "src\modules\tickets-svc\components\TicketList.jsx" -Force
Copy-Item "src\components\tickets\TicketDetail.jsx" -Destination "src\modules\tickets-svc\components\TicketDetail.jsx" -Force
Copy-Item "src\pages\Tickets.jsx" -Destination "src\modules\tickets-svc\pages\Tickets.jsx" -Force
Copy-Item "src\pages\CrearTicket.jsx" -Destination "src\modules\tickets-svc\pages\CrearTicket.jsx" -Force
Copy-Item "src\pages\TicketDetailPage.jsx" -Destination "src\modules\tickets-svc\pages\TicketDetailPage.jsx" -Force
Copy-Item "src\hooks\useTickets.js" -Destination "src\modules\tickets-svc\hooks\useTickets.js" -Force
Copy-Item "src\services\ticketService.js" -Destination "src\modules\tickets-svc\services\ticketService.js" -Force

Write-Host "✅ Módulo tickets-svc migrado" -ForegroundColor Green

# Copiar módulo CHAT
Write-Host "`n💬 Migrando módulo chat-svc..." -ForegroundColor Yellow

Copy-Item "src\components\chat\ChatWidget.jsx" -Destination "src\modules\chat-svc\components\ChatWidget.jsx" -Force
Copy-Item "src\hooks\useSocket.js" -Destination "src\modules\chat-svc\hooks\useSocket.js" -Force
Copy-Item "src\services\chatService.js" -Destination "src\modules\chat-svc\services\chatService.js" -Force

Write-Host "✅ Módulo chat-svc migrado" -ForegroundColor Green

# Copiar módulo NOTIFICACIONES
Write-Host "`n🔔 Migrando módulo notificaciones-svc..." -ForegroundColor Yellow

Copy-Item "src\components\notifications\NotificationCenter.jsx" -Destination "src\modules\notificaciones-svc\components\NotificationCenter.jsx" -Force
Copy-Item "src\pages\NotificacionesPage.jsx" -Destination "src\modules\notificaciones-svc\pages\NotificacionesPage.jsx" -Force
Copy-Item "src\hooks\useNotifications.js" -Destination "src\modules\notificaciones-svc\hooks\useNotifications.js" -Force
Copy-Item "src\services\notificacionesService.js" -Destination "src\modules\notificaciones-svc\services\notificacionesService.js" -Force

Write-Host "✅ Módulo notificaciones-svc migrado" -ForegroundColor Green

# Copiar módulo IA
Write-Host "`n🤖 Migrando módulo ia-svc..." -ForegroundColor Yellow

Copy-Item "src\components\ia\IAAssistant.jsx" -Destination "src\modules\ia-svc\components\IAAssistant.jsx" -Force
Copy-Item "src\services\iaService.js" -Destination "src\modules\ia-svc\services\iaService.js" -Force

Write-Host "✅ Módulo ia-svc migrado" -ForegroundColor Green

# Copiar módulo USUARIOS
Write-Host "`n👥 Migrando módulo usuarios-svc..." -ForegroundColor Yellow

Copy-Item "src\components\users\UserManagement.jsx" -Destination "src\modules\usuarios-svc\components\UserManagement.jsx" -Force
Copy-Item "src\pages\Usuarios.jsx" -Destination "src\modules\usuarios-svc\pages\Usuarios.jsx" -Force -ErrorAction SilentlyContinue
Copy-Item "src\pages\Perfil.jsx" -Destination "src\modules\usuarios-svc\pages\Perfil.jsx" -Force
Copy-Item "src\services\authService.js" -Destination "src\modules\usuarios-svc\services\authService.js" -Force

Write-Host "✅ Módulo usuarios-svc migrado" -ForegroundColor Green

# Copiar módulo EMPRESAS
Write-Host "`n🏢 Migrando módulo empresas-svc..." -ForegroundColor Yellow

Copy-Item "src\pages\ValidarAcceso.jsx" -Destination "src\modules\empresas-svc\pages\ValidarAcceso.jsx" -Force
Copy-Item "src\pages\LoginEmpresa.jsx" -Destination "src\modules\empresas-svc\pages\LoginEmpresa.jsx" -Force
Copy-Item "src\pages\RegistrarEmpresa.jsx" -Destination "src\modules\empresas-svc\pages\RegistrarEmpresa.jsx" -Force -ErrorAction SilentlyContinue
Copy-Item "src\services\empresaService.js" -Destination "src\modules\empresas-svc\services\empresaService.js" -Force

Write-Host "✅ Módulo empresas-svc migrado" -ForegroundColor Green

Write-Host "`n✨ Migración completada!" -ForegroundColor Green
Write-Host "`n⚠️  IMPORTANTE: Ahora debes actualizar los imports en App.js y otros archivos" -ForegroundColor Yellow
Write-Host "📝 Consulta la documentación de migración para los cambios de imports" -ForegroundColor Cyan
