# 📊 Funcionamiento del Módulo de Reportes

## 🎯 Descripción General

El módulo de **Reportes** es un dashboard ejecutivo que consolida y visualiza información de todos los módulos del sistema ERP TitanFleet. Proporciona una vista integral del rendimiento operativo y financiero.

---

## 🏗️ Arquitectura

### Clase Principal: `ReportesSystem`

```javascript
class ReportesSystem {
    constructor() {
        this.charts = {};              // Gráficos de Chart.js
        this.currentData = [];         // Datos actuales sin filtrar
        this.filteredData = [];        // Datos filtrados por mes/fecha
        this.currentPage = 1;          // Página actual de paginación
        this.itemsPerPage = 15;        // Items por página
        this.filters = {               // Filtros activos
            fechaInicio: null,
            fechaFin: null,
            departamento: '',
            estado: ''
        };
        this.mesFiltro = null;         // Filtro de mes actual
    }
}
```

---

## 📥 Fuentes de Datos

### Orden de Carga (Prioridad)

El módulo carga datos de múltiples fuentes siguiendo este orden:

#### **1. Firebase (PRIORIDAD 1)** ✅
```javascript
// Ejemplo: Logística
if (window.firebaseRepos && window.firebaseRepos.logistica) {
    logisticaData = await window.firebaseRepos.logistica.getAllRegistros();
}
```

#### **2. localStorage - erp_shared_data (PRIORIDAD 2)** ⚠️
```javascript
// Formato actual
const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
if (sharedData.registros) {
    logisticaData = Object.values(sharedData.registros);
}
```

#### **3. localStorage - Formatos Antiguos (PRIORIDAD 3)** ⚠️
```javascript
// Formato antiguo para compatibilidad
const oldData = localStorage.getItem('erp_logistica');
```

---

## 📊 Módulos que Integra

### 1. **Logística** 📦
- **KPIs:** Total de registros de logística
- **Datos:** Registros de envíos, clientes, origen/destino
- **Fuente:** `firebaseRepos.logistica.getAllRegistros()`

### 2. **Tráfico** 🚛
- **KPIs:** Total de viajes/registros de tráfico
- **Datos:** Viajes, tractocamiones, operadores, rutas
- **Fuente:** `firebaseRepos.trafico.getAllRegistros()`
- **⚠️ IMPORTANTE:** Solo carga desde Firebase (no localStorage)

### 3. **Facturación** 💰
- **KPIs:** Total facturado
- **Datos:** Facturas, montos, clientes
- **Fuente:** `firebaseRepos.facturacion.getAllRegistros()`

### 4. **Diesel** ⛽
- **KPIs:** Total de registros de diesel
- **Datos:** Consumo de combustible, económicos

### 5. **Mantenimiento** 🔧
- **KPIs:** Total de mantenimientos
- **Datos:** Mantenimientos programados, recordatorios

### 6. **Inventario** 📦
- **KPIs:** Total de productos en stock
- **Datos:** Productos, plataformas, movimientos

### 7. **Cuentas por Cobrar (CXC)** 💳
- **KPIs:** Total pendiente por cobrar
- **Datos:** Facturas pendientes, montos

### 8. **Cuentas por Pagar (CXP)** 💸
- **KPIs:** Total pendiente por pagar
- **Datos:** Facturas pendientes, proveedores

### 9. **Tesorería** 💵
- **KPIs:** Gastos de operadores
- **Datos:** Movimientos, ingresos, egresos

---

## 🔍 Filtrado de Datos

### Filtro por Mes

El módulo permite filtrar datos por mes específico:

```javascript
obtenerMesFiltro() {
    const filtroInput = document.getElementById('filtroMesReportes');
    if (filtroInput && filtroInput.value) {
        const [año, mes] = filtroInput.value.split('-');
        return {
            mes: parseInt(mes, 10) - 1, // 0-11 (enero=0)
            año: parseInt(año, 10)
        };
    }
    // Por defecto: mes actual
    return {
        mes: new Date().getMonth(),
        año: new Date().getFullYear()
    };
}
```

### Verificación de Fechas

La función `perteneceAlMesFiltro()` verifica si una fecha pertenece al mes seleccionado:

```javascript
perteneceAlMesFiltro(fecha) {
    const filtro = this.obtenerMesFiltro();
    // Extrae mes y año de la fecha
    // Compara con el filtro activo
    return mesFecha === filtro.mes && añoFecha === filtro.año;
}
```

**Soporta múltiples formatos de fecha:**
- ISO: `YYYY-MM-DD`
- Con hora: `YYYY-MM-DDTHH:mm:ss`
- Formato español: `DD/MM/YYYY`
- Objetos Date

---

## 📈 KPIs (Key Performance Indicators)

### KPIs Operativos

1. **Total Logística** 
   - ID: `totalLogistica`
   - Muestra: Cantidad de registros de logística
   - Cálculo: `logisticaData.length`

2. **Total Tráfico**
   - ID: `totalTrafico`
   - Muestra: Cantidad de viajes/registros
   - Cálculo: `traficoData.length`

3. **Registros Diesel**
   - ID: `totalDiesel`
   - Muestra: Cantidad de registros de combustible

4. **Mantenimiento**
   - ID: `totalMantenimiento`
   - Muestra: Cantidad de mantenimientos

5. **Productos en Stock**
   - ID: `totalInventario`
   - Muestra: Total de productos en inventario

### KPIs Financieros

1. **Pendiente x Cobrar**
   - ID: `totalCXC`
   - Formato: Moneda (`$X,XXX.XX`)
   - Cálculo: Suma de facturas pendientes

2. **Pendiente x Pagar**
   - ID: `totalCXP`
   - Formato: Moneda (`$X,XXX.XX`)
   - Cálculo: Suma de facturas pendientes a proveedores

3. **Gastos Operadores**
   - ID: `totalTesoreria`
   - Formato: Moneda (`$X,XXX.XX`)
   - Cálculo: Suma de gastos de operadores

4. **Total Incidencias**
   - ID: `totalIncidencias`
   - Muestra: Cantidad de incidencias

---

## 📊 Visualizaciones

### 1. Gráfico de Viajes por Tractocamión

**Función:** `updateViajesChart()`

- **Tipo:** Gráfico de barras (Chart.js)
- **Filtros:**
  - Tractocamión (económico)
  - Fecha desde
  - Fecha hasta
- **Datos:** Agrupa viajes por tractocamión en el período seleccionado

### 2. Tabla de Datos

**Función:** `updateTable(data)`

- **Paginación:** 15 items por página
- **Columnas:**
  - Fecha
  - Departamento
  - Cliente
  - Servicio
  - Origen/Destino
  - Valor
  - Estado

---

## 🔄 Flujo de Funcionamiento

### 1. Inicialización

```javascript
init() {
    this.setupEventListeners();      // Configura eventos
    this.initializeCharts();          // Inicializa gráficos
    this.loadDashboardData();         // Carga datos
    this.setCurrentPeriod();          // Establece período actual
}
```

### 2. Carga de Datos

```javascript
loadDashboardData() {
    // 1. Cargar datos reales de módulos
    this.loadRealModuleData().then(data => {
        this.currentData = data;
        
        // 2. Aplicar filtros
        this.filteredData = this.applyFilters(data);
        
        // 3. Actualizar UI
        this.updateKPIs(this.filteredData);
        this.updateCharts(this.filteredData);
        this.updateTable(this.filteredData);
    });
}
```

### 3. Filtrado

```javascript
loadRealModuleData() {
    const data = [];
    
    // Cargar de cada módulo
    // - Logística (Firebase → localStorage)
    // - Facturación (Firebase → localStorage)
    // - Tráfico (solo Firebase)
    // - Diesel, Mantenimiento, etc.
    
    // Filtrar por mes
    return data.filter(item => 
        this.perteneceAlMesFiltro(item.fecha)
    );
}
```

### 4. Actualización de UI

```javascript
updateKPIs(data) {
    // Calcular totales por departamento
    const logistica = data.filter(d => d.departamento === 'logistica').length;
    const trafico = data.filter(d => d.departamento === 'trafico').length;
    
    // Actualizar elementos DOM
    document.getElementById('totalLogistica').textContent = logistica;
    document.getElementById('totalTrafico').textContent = trafico;
    // ...
}
```

---

## 🛡️ Seguridad y Filtrado por Tenant

El módulo implementa filtrado por `tenantId` para multi-tenancy:

```javascript
// Filtrar por tenantId
const currentTenantId = window.firebaseRepos?.logistica?.tenantId || 
                      localStorage.getItem('tenantId') ||
                      window.firebaseAuth?.currentUser?.uid;

if (currentTenantId) {
    localData = localData.filter(item => {
        // Solo mostrar datos del tenant actual
        if (item.tenantId) {
            return item.tenantId === currentTenantId;
        }
        // Fallback a userId si no hay tenantId
        if (item.userId && window.firebaseAuth?.currentUser?.uid) {
            return item.userId === window.firebaseAuth.currentUser.uid;
        }
        return true; // Compatibilidad con datos antiguos
    });
}
```

---

## ⚡ Optimizaciones

### 1. Cache Inteligente

Usa el sistema de cache para datos de configuración:
```javascript
// Cache de económicos (tractocamiones)
const economicosCache = window.getFromCache('economicos');
```

### 2. Manejo de Errores

- Verifica cuotas de Firebase
- Maneja errores de conexión
- Fallback a localStorage cuando es necesario

### 3. Paginación

- Solo muestra 15 items por página
- Reduce carga de renderizado
- Mejora performance

---

## 📱 Interfaz de Usuario

### Filtros Disponibles

1. **Filtro por Mes**
   - Input: `<input type="month" id="filtroMesReportes">`
   - Filtra todos los datos por el mes seleccionado

2. **Filtros de Gráfico de Viajes**
   - Tractocamión (select)
   - Fecha desde
   - Fecha hasta

### Cards de KPIs

- Diseño responsivo (col-lg-2, col-md-4, col-sm-6)
- Colores diferenciados por tipo
- Iconos FontAwesome
- Actualización en tiempo real

---

## 🔧 Funciones Principales

| Función | Descripción |
|---------|-------------|
| `loadRealModuleData()` | Carga datos de todos los módulos |
| `updateKPIs(data)` | Actualiza los indicadores principales |
| `updateCharts(data)` | Actualiza los gráficos |
| `updateTable(data)` | Actualiza la tabla de datos |
| `updateViajesChart()` | Actualiza gráfico de viajes por tractocamión |
| `obtenerMesFiltro()` | Obtiene el mes del filtro activo |
| `perteneceAlMesFiltro(fecha)` | Verifica si fecha pertenece al mes filtrado |
| `applyFilters(data)` | Aplica todos los filtros activos |
| `goToPage(page)` | Navega a página específica |

---

## 📝 Notas Importantes

### ⚠️ Limitaciones Actuales

1. **Tráfico solo desde Firebase**
   - No usa localStorage como fallback
   - Puede mostrar 0 registros si Firebase no está disponible

2. **Datos Antiguos**
   - Mantiene compatibilidad con formatos antiguos de localStorage
   - Puede causar inconsistencias si hay datos duplicados

3. **Filtro de Mes**
   - Solo filtra por mes, no por rango de fechas personalizado
   - El filtro se aplica automáticamente al mes actual si no se selecciona otro

### ✅ Buenas Prácticas Implementadas

1. **Prioridad Firebase**
   - Siempre intenta cargar desde Firebase primero
   - Usa localStorage solo como fallback

2. **Filtrado por Tenant**
   - Asegura que cada usuario solo vea sus datos
   - Soporte multi-tenant completo

3. **Manejo de Errores**
   - Detecta cuotas excedidas
   - Muestra mensajes informativos
   - Continúa funcionando con datos limitados

---

## 🚀 Mejoras Sugeridas

1. **Listeners en Tiempo Real**
   - Implementar `onSnapshot()` para actualización automática
   - Actualizar KPIs cuando cambien datos en otros módulos

2. **Más Gráficos**
   - Gráfico de tendencias por mes
   - Gráfico de distribución por departamento
   - Gráficos financieros (ingresos vs egresos)

3. **Exportación**
   - Exportar reportes a PDF
   - Exportar datos a Excel
   - Generar reportes programados

4. **Filtros Avanzados**
   - Rango de fechas personalizado
   - Filtro por estado
   - Filtro por cliente/proveedor

---

**Última actualización:** ${new Date().toLocaleDateString('es-ES')}




