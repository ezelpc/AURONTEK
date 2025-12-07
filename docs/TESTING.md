# Manual de Pruebas - Sistema AURONTEK

## 📋 Índice

1. [Instalación de Dependencias](#instalación-de-dependencias)
2. [Ejecutar Pruebas Localmente](#ejecutar-pruebas-localmente)
3. [Interpretar Resultados](#interpretar-resultados)
4. [Dashboard y Reportes](#dashboard-y-reportes)
5. [Integración CI/CD](#integración-cicd)
6. [Troubleshooting](#troubleshooting)

---

## 1. Instalación de Dependencias

### Backend - Servicios Node.js

```bash
# Navegar a cada servicio e instalar dependencias
cd backend/usuarios-svc
npm install

cd ../tickets-svc
npm install

cd ../gateway-svc
npm install
```

### Backend - Servicio Python (ia-svc)

```bash
cd backend/ia-svc
pip install -r requirements.txt

# Instalar dependencias de testing
pip install pytest pytest-asyncio pytest-cov pytest-mock scikit-learn
```

### Dashboard de Reportes

```bash
cd backend/test-dashboard
npm install
```

---

## 2. Ejecutar Pruebas Localmente

### 2.1 Pruebas Unitarias - usuarios-svc

```bash
cd backend/usuarios-svc

# Ejecutar todos los tests
npm test

# Ejecutar solo tests unitarios
npm run test:unit

# Ejecutar con cobertura
npm run test:coverage

# Modo watch (re-ejecuta al guardar cambios)
npm run test:watch
```

**Tests incluidos:**
- ✅ Generación de códigos de acceso
- ✅ Hashing de contraseñas con bcrypt
- ✅ Generación y validación de JWT tokens

**Ubicación:** `backend/usuarios-svc/__tests__/unit/utils.test.ts`

---

### 2.2 Pruebas Unitarias - tickets-svc

```bash
cd backend/tickets-svc

# Ejecutar todos los tests
npm test

# Con cobertura
npm run test:coverage
```

**Tests incluidos:**
- ✅ Validación de datos de ticket
- ✅ Transiciones de estado (pendiente → en_proceso → resuelto → cerrado)
- ✅ Cálculo de SLA por prioridad
- ✅ Asignación de prioridad por palabras clave

**Ubicación:** `backend/tickets-svc/__tests__/unit/ticketValidation.test.ts`

---

### 2.3 Pruebas Unitarias - ia-svc

```bash
cd backend/ia-svc

# Ejecutar todos los tests
pytest

# Con cobertura
pytest --cov=. --cov-report=html

# Ver reporte de cobertura
# Abrir: htmlcov/index.html en navegador

# Ejecutar solo tests unitarios
pytest -m unit

# Modo verbose
pytest -v
```

**Tests incluidos:**
- ✅ Cálculo de carga de trabajo de agentes
- ✅ Filtrado de agentes disponibles
- ✅ Selección por especialidad
- ✅ Priorización por menor carga

**Ubicación:** `backend/ia-svc/tests/unit/test_agent_assigner.py`

---

### 2.4 Pruebas Funcionales - gateway-svc

```bash
cd backend/gateway-svc

# Ejecutar tests funcionales
npm run test:functional

# Ejecutar tests de rendimiento
npm run test:performance
```

---

### 2.5 Ejecutar TODOS los Tests

Desde la raíz del proyecto:

```bash
# Opción 1: Ejecutar manualmente cada servicio
cd backend/usuarios-svc && npm test
cd ../tickets-svc && npm test
cd ../gateway-svc && npm test
cd ../ia-svc && pytest

# Opción 2: Usar GitHub Actions (recomendado)
# Push a rama 'test' para ejecutar automáticamente
git checkout test
git add .
git commit -m "Run all tests"
git push origin test
```

---

## 3. Interpretar Resultados

### 3.1 Resultados de Jest (Node.js)

```
PASS  __tests__/unit/utils.test.ts
  Utils - Unit Tests
    generarCodigoAcceso
      ✓ should generate a code with default length of 8 (3 ms)
      ✓ should generate a code with custom length (1 ms)
      ✓ should generate alphanumeric code only (2 ms)
    Password Hashing (bcrypt)
      ✓ should hash password successfully (156 ms)
      ✓ should verify correct password (145 ms)

Test Suites: 1 passed, 1 total
Tests:       35 passed, 35 total
Snapshots:   0 total
Time:        3.456 s
```

**Interpretación:**
- ✅ **PASS**: Todos los tests pasaron
- ❌ **FAIL**: Algún test falló
- **Test Suites**: Archivos de test ejecutados
- **Tests**: Número total de tests individuales
- **Time**: Tiempo de ejecución

### 3.2 Cobertura de Código

```
---------------------|---------|----------|---------|---------|
File                 | % Stmts | % Branch | % Funcs | % Lines |
---------------------|---------|----------|---------|---------|
All files            |   87.5  |   82.14  |   90.91 |   87.5  |
 src/Utils           |   100   |   100    |   100   |   100   |
  utils.ts           |   100   |   100    |   100   |   100   |
---------------------|---------|----------|---------|---------|
```

**Objetivo:** >80% en todas las métricas

**Interpretación:**
- **% Stmts**: Porcentaje de declaraciones ejecutadas
- **% Branch**: Porcentaje de ramas (if/else) cubiertas
- **% Funcs**: Porcentaje de funciones ejecutadas
- **% Lines**: Porcentaje de líneas ejecutadas

---

### 3.3 Resultados de Pytest (Python)

```
============================= test session starts ==============================
collected 15 items

tests/unit/test_agent_assigner.py::TestAgentAssigner::test_calculate_workload_low PASSED [ 6%]
tests/unit/test_agent_assigner.py::TestAgentAssigner::test_calculate_workload_medium PASSED [13%]
...

============================== 15 passed in 0.45s ===============================

---------- coverage: platform win32, python 3.10.11 -----------
Name                              Stmts   Miss  Cover
-----------------------------------------------------
services/agent_assigner.py           45      3    93%
-----------------------------------------------------
TOTAL                                45      3    93%
```

**Interpretación:**
- **15 passed**: Todos los tests pasaron
- **Cover**: 93% de cobertura (objetivo >80%)

---

## 4. Dashboard y Reportes

### 4.1 Generar Reportes

```bash
cd backend/test-dashboard

# Generar todos los reportes
node generate-report.js

# Esto crea:
# - docs/testing/reportes/[fecha]/reporte-[fecha].md
# - docs/testing/reportes/[fecha]/data/resultados-tests-[fecha].json
# - docs/testing/reportes/[fecha]/data/resultados-tests-[fecha].csv
```

### 4.2 Ver Dashboard Interactivo

```bash
cd backend/test-dashboard

# Opción 1: Abrir directamente
# Abrir index.html en navegador

# Opción 2: Usar servidor local
npx http-server . -p 8080
# Luego abrir: http://localhost:8080
```

**El dashboard muestra:**
- 📊 KPIs: Tests pasados, Cobertura, Latencia, Precisión IA
- 📈 Gráficas: Latencia, Tests pasados/fallidos, P95 por servicio
- 📋 Tabla de resultados por módulo

### 4.3 Exportar Reportes

Desde el dashboard:
- **Botón "Exportar PDF"**: Genera reporte PDF completo
- **Botón "Exportar CSV"**: Exporta datos tabulares

---

## 5. Integración CI/CD

### 5.1 GitHub Actions

El workflow `.github/workflows/test.yml` se ejecuta automáticamente en:
- Push a rama `test`
- Pull Request a rama `test`

**Qué hace:**
1. Ejecuta tests de todos los servicios Node.js en paralelo
2. Ejecuta tests de Python (ia-svc)
3. Genera reportes de cobertura
4. Sube artifacts con resultados
5. Comenta resultados en PRs

### 5.2 Ver Resultados en GitHub

1. Ir a tu repositorio en GitHub
2. Click en pestaña "Actions"
3. Seleccionar el workflow "Test Suite"
4. Ver resultados de cada job

### 5.3 Descargar Reportes

En la página del workflow:
1. Scroll hasta "Artifacts"
2. Descargar "test-reports"
3. Descomprimir y revisar reportes

---

## 6. Troubleshooting

### 6.1 Error: "Cannot find module 'jest'"

**Solución:**
```bash
cd backend/usuarios-svc
npm install --save-dev jest @types/jest ts-jest
```

### 6.2 Error: "pytest: command not found"

**Solución:**
```bash
pip install pytest pytest-asyncio pytest-cov
```

### 6.3 Tests fallan con "MODULE_NOT_FOUND"

**Solución:**
```bash
# Limpiar cache y reinstalar
cd backend/usuarios-svc
npm run cache
```

### 6.4 Cobertura menor a 80%

**Solución:**
- Revisar qué archivos no están cubiertos en el reporte
- Agregar más tests para esas áreas
- Ver reporte HTML de cobertura: `coverage/index.html`

### 6.5 Tests de Python fallan con import errors

**Solución:**
```bash
cd backend/ia-svc
export PYTHONPATH="${PYTHONPATH}:$(pwd)"  # Linux/Mac
set PYTHONPATH=%PYTHONPATH%;%cd%  # Windows
pytest
```

### 6.6 Dashboard no muestra datos

**Solución:**
1. Verificar que se ejecutaron los tests
2. Ejecutar `node generate-report.js`
3. Verificar que existen archivos en `docs/testing/reportes/latest/`

---

## 📊 Resumen de Comandos Rápidos

```bash
# Tests Node.js
cd backend/usuarios-svc && npm test
cd backend/tickets-svc && npm test
cd backend/gateway-svc && npm test

# Tests Python
cd backend/ia-svc && pytest

# Generar reportes
cd backend/test-dashboard && node generate-report.js

# Ver dashboard
cd backend/test-dashboard && npx http-server . -p 8080
```

---

## 📝 Checklist de Verificación

Antes de hacer merge a producción, verificar:

- [ ] Todos los tests pasan (npm test en cada servicio)
- [ ] Cobertura >80% en todos los servicios
- [ ] Tests de Python pasan (pytest)
- [ ] Dashboard muestra métricas correctas
- [ ] Reportes se generan sin errores
- [ ] GitHub Actions workflow pasa en rama test
- [ ] No hay archivos de test en rama main/production

---

## 🆘 Soporte

Si encuentras problemas:
1. Revisar sección de Troubleshooting
2. Ver logs detallados con `-v` o `--verbose`
3. Verificar versiones de Node.js (>=18) y Python (>=3.8)
4. Limpiar cache y reinstalar dependencias

---

**Última actualización:** 2024-12-07
