# 📚 Documentación Técnica - ERP TitanFleet

## 📋 Tabla de Contenidos

1. [Orden de Carga de Scripts](#orden-de-carga-de-scripts)
2. [Estructura de Repositorios](#estructura-de-repositorios)
3. [Flujo de Datos](#flujo-de-datos)
4. [Patrones de Código Comunes](#patrones-de-código-comunes)
5. [Arquitectura del Sistema](#arquitectura-del-sistema)

---

## 🔄 Orden de Carga de Scripts

### ⚠️ Importante: Orden Correcto

El orden de carga de scripts es **crítico** para el funcionamiento del sistema. Los scripts deben cargarse en el siguiente orden:

### 📦 Fase 1: Dependencias Externas

```html
<!-- Firebase SDKs (Compatibilidad v9) -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>

<!-- Inicialización de Firebase (inline) -->
<script>
  const firebaseConfig = { /* ... */ };
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
</script>
```

### 📦 Fase 2: Sistema de Carga Dinámica

```html
<!-- Script Loader - Sistema de carga dinámica (lazy loading) -->
<script src="assets/scripts/script-loader.js"></script>
```

**Propósito**: Permite cargar scripts bajo demanda para mejorar el rendimiento.

### 📦 Fase 3: Scripts Esenciales (Base)

```html
<!-- Scripts que deben estar disponibles antes que otros -->
<script src="assets/scripts/firebase-init.js"></script>
<script src="assets/scripts/firebase-repo-base.js"></script>
<script src="assets/scripts/data-persistence.js"></script>
```

**Orden crítico**:
1. `firebase-init.js` - Inicializa Firebase v10
2. `firebase-repo-base.js` - Clase base para repositorios
3. `data-persistence.js` - Sistema de persistencia compartida

### 📦 Fase 4: Repositorios y Configuración

```html
<script src="assets/scripts/firebase-repos.js"></script>
<script src="assets/scripts/configuracion-firebase.js"></script>
```

**Propósito**: Crea instancias de repositorios para cada módulo.

### 📦 Fase 5: Scripts de Funcionalidad

```html
<!-- Scripts específicos de módulos -->
<script src="assets/scripts/integration.js"></script>
<script src="assets/scripts/main.js"></script>
<script src="assets/scripts/paginacion.js"></script>
```

### 📦 Fase 6: Scripts Específicos de Página

```html
<!-- Scripts que dependen de los anteriores -->
<script src="assets/scripts/trafico-contador.js"></script>
<script src="assets/scripts/trafico-firebase.js"></script>
```

### ❌ Orden Incorrecto (Evitar)

```html
<!-- ❌ INCORRECTO: main.js antes de data-persistence.js -->
<script src="assets/scripts/main.js"></script>
<script src="assets/scripts/data-persistence.js"></script>
```

**Problema**: `main.js` puede intentar usar `DataPersistence` antes de que esté disponible.

### ✅ Orden Correcto (Recomendado)

```html
<!-- ✅ CORRECTO: Dependencias primero -->
<script src="assets/scripts/data-persistence.js"></script>
<script src="assets/scripts/integration.js"></script>
<script src="assets/scripts/main.js"></script>
```

### 🔍 Verificación del Orden

Para verificar que los scripts se cargan correctamente, revisa la consola del navegador:

```javascript
// Verificar que las dependencias estén disponibles
console.log('Firebase:', typeof window.firebaseDb !== 'undefined');
console.log('FirebaseRepoBase:', typeof window.FirebaseRepoBase !== 'undefined');
console.log('DataPersistence:', typeof window.DataPersistence !== 'undefined');
```

---

## 🏗️ Estructura de Repositorios

### 📐 Arquitectura de Repositorios

El sistema utiliza una arquitectura de repositorios basada en herencia:

```
FirebaseRepoBase (Clase Base)
    ├── LogisticaRepo
    ├── TraficoRepo
    ├── FacturacionRepo
    ├── CXCRepo
    ├── CXPRepo
    ├── TesoreriaRepo
    ├── InventarioRepo
    ├── OperadoresRepo
    └── ... (otros módulos)
```

### 🔧 FirebaseRepoBase

**Ubicación**: `assets/scripts/firebase-repo-base.js`

**Responsabilidades**:
- Inicialización de conexión a Firestore
- Gestión de `tenantId` y `userId`
- Métodos CRUD base (`save`, `get`, `getAll`, `delete`)
- Manejo de fallback a localStorage
- Optimización de escrituras (cache de escrituras)
- Manejo de cuota excedida (circuit breaker)

**Métodos Principales**:

```javascript
class FirebaseRepoBase {
  constructor(collectionName) {
    this.collectionName = collectionName;
    // Inicialización automática cuando Firebase está listo
  }
  
  async init() {
    // Inicializa conexión a Firestore
    // Obtiene tenantId y userId
  }
  
  async save(id, data) {
    // Guarda documento en Firebase
    // Fallback a localStorage si Firebase no está disponible
    // Optimización: evita escrituras duplicadas
  }
  
  async get(id) {
    // Obtiene documento por ID
  }
  
  async getAll() {
    // Obtiene todos los documentos del tenant
  }
  
  async delete(id) {
    // Elimina documento (hard delete)
  }
  
  async subscribe(callback) {
    // Suscripción en tiempo real a cambios
  }
}
```

### 📦 Repositorios Específicos

Cada módulo extiende `FirebaseRepoBase` y agrega métodos específicos:

#### LogisticaRepo

```javascript
class LogisticaRepo extends FirebaseRepoBase {
  constructor() {
    super('logistica');
  }
  
  async saveRegistro(registroId, data) {
    return await this.save(registroId, {
      ...data,
      tipo: 'registro',
      fechaCreacion: data.fechaCreacion || new Date().toISOString()
    });
  }
  
  async getAllRegistros() {
    const all = await this.getAll();
    return all.filter(item => item.tipo === 'registro');
  }
}
```

#### TraficoRepo

```javascript
class TraficoRepo extends FirebaseRepoBase {
  constructor() {
    super('trafico');
  }
  
  async saveRegistro(registroId, data) {
    return await this.save(registroId, {
      ...data,
      tipo: 'registro',
      fechaCreacion: data.fechaCreacion || new Date().toISOString()
    });
  }
}
```

### 🔄 Inicialización de Repositorios

**Ubicación**: `assets/scripts/firebase-repos.js`

**Proceso de Inicialización**:

1. **Verificación de Dependencias**:
   ```javascript
   function isFirebaseReady() {
     return window.firebaseDb && 
            window.fs && 
            window.fs.doc && 
            window.firebaseAuth !== undefined;
   }
   ```

2. **Espera de Firebase**:
   ```javascript
   if (!isFirebaseReady()) {
     window.addEventListener('firebaseReady', initFirebaseRepos, { once: true });
     return;
   }
   ```

3. **Creación de Instancias**:
   ```javascript
   window.firebaseRepos = {
     logistica: new LogisticaRepo(),
     trafico: new TraficoRepo(),
     facturacion: new FacturacionRepo(),
     // ... otros repositorios
   };
   ```

4. **Señal de Listo**:
   ```javascript
   window.__firebaseReposReady = Promise.resolve();
   ```

### 📍 Acceso a Repositorios

```javascript
// Acceso global
const logisticaRepo = window.firebaseRepos.logistica;

// Guardar registro
await logisticaRepo.saveRegistro('2500001', {
  cliente: 'Cliente ABC',
  origen: 'Ciudad de México',
  destino: 'Guadalajara'
});

// Obtener registro
const registro = await logisticaRepo.getRegistro('2500001');

// Obtener todos los registros
const todos = await logisticaRepo.getAllRegistros();
```

---

## 🔄 Flujo de Datos

### 📊 Flujo General: Formulario → Almacenamiento

```
┌─────────────┐
│  Formulario │
│   (HTML)    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Validación     │
│  (JavaScript)   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ DataPersistence │
│  (localStorage) │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Firebase Repo   │
│   (Firestore)   │
└─────────────────┘
```

### 🔍 Flujo Detallado: Guardado de Registro

#### 1. Captura de Datos del Formulario

```javascript
// En main.js o script específico del módulo
form.addEventListener('submit', async function(event) {
  event.preventDefault();
  
  // 1. Validar formulario
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }
  
  // 2. Recopilar datos del formulario
  const registroId = document.getElementById('numeroRegistro').value;
  const formData = {
    cliente: document.getElementById('cliente').value,
    origen: document.getElementById('origen').value,
    destino: document.getElementById('destino').value,
    // ... otros campos
  };
  
  // 3. Guardar datos
  await saveLogisticaData(registroId, formData);
});
```

#### 2. Guardado en DataPersistence (localStorage)

```javascript
// En data-persistence.js
function saveLogisticaData(registroId, data) {
  const persistence = new DataPersistence();
  
  // Guardar en localStorage compartido
  persistence.saveLogisticaData(registroId, {
    ...data,
    numeroRegistro: registroId,
    fechaCreacion: new Date().toISOString()
  });
  
  return true;
}
```

**Estructura en localStorage**:
```json
{
  "erp_shared_data": {
    "registros": {
      "2500001": {
        "cliente": "Cliente ABC",
        "origen": "Ciudad de México",
        "destino": "Guadalajara",
        "numeroRegistro": "2500001",
        "fechaCreacion": "2025-01-15T10:30:00.000Z"
      }
    }
  }
}
```

#### 3. Guardado en Firebase (Firestore)

```javascript
// En integration.js o script específico
async function saveLogisticaToFirestore(registroId, data) {
  // Esperar a que los repositorios estén listos
  if (window.__firebaseReposReady) {
    await window.__firebaseReposReady;
  }
  
  // Obtener repositorio
  const logisticaRepo = window.firebaseRepos.logistica;
  
  // Guardar en Firebase
  await logisticaRepo.saveRegistro(registroId, data);
}
```

**Estructura en Firestore**:
```
Collection: logistica
Document ID: 2500001
{
  "cliente": "Cliente ABC",
  "origen": "Ciudad de México",
  "destino": "Guadalajara",
  "numeroRegistro": "2500001",
  "tenantId": "demo_tenant",
  "userId": "demo_user",
  "fechaCreacion": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z",
  "deleted": false
}
```

### 🔄 Flujo de Lectura: Búsqueda de Registro

#### 1. Búsqueda por Número de Registro

```javascript
// Función de búsqueda
async function searchAndFillData(registroId) {
  // 1. Buscar en localStorage primero (más rápido)
  const persistence = new DataPersistence();
  let logisticaData = persistence.getLogisticaData(registroId);
  
  // 2. Si no está en localStorage, buscar en Firebase
  if (!logisticaData && window.firebaseRepos?.logistica) {
    const repo = window.firebaseRepos.logistica;
    const firebaseData = await repo.getRegistro(registroId);
    
    if (firebaseData) {
      // Guardar en localStorage para próxima vez
      persistence.saveLogisticaData(registroId, firebaseData);
      logisticaData = firebaseData;
    }
  }
  
  // 3. Llenar formulario con los datos encontrados
  if (logisticaData) {
    fillFormWithData(logisticaData);
  }
}
```

#### 2. Prioridad de Lectura

1. **localStorage** (caché local) - Más rápido
2. **Firebase** (fuente de verdad) - Si no está en caché
3. **Actualizar caché** - Sincronizar localStorage con Firebase

### 🔄 Flujo de Sincronización

#### Sincronización Automática

```javascript
// En firebase-repo-base.js
async save(id, data) {
  // 1. Intentar guardar en Firebase
  try {
    await this.saveToFirebase(id, data);
    
    // 2. Si éxito, actualizar caché local
    this.updateLocalCache(id, data);
    
    return true;
  } catch (error) {
    // 3. Si falla Firebase, guardar solo en localStorage
    return this.saveToLocalStorage(id, data);
  }
}
```

#### Sincronización Manual

```javascript
// Función para sincronizar datos pendientes
async function syncPendingData() {
  const pending = JSON.parse(
    localStorage.getItem('erp_pending_sync_logistica') || '[]'
  );
  
  for (const registroId of pending) {
    const data = persistence.getLogisticaData(registroId);
    if (data) {
      await logisticaRepo.saveRegistro(registroId, data);
    }
  }
  
  // Limpiar lista de pendientes
  localStorage.removeItem('erp_pending_sync_logistica');
}
```

### 🔄 Flujo de Datos entre Módulos

#### Ejemplo: Logística → Tráfico → Facturación

```
┌─────────────┐
│  Logística  │
│  (Registro) │
└──────┬──────┘
       │ Guarda: numeroRegistro, cliente, origen, destino
       ▼
┌─────────────┐
│   Tráfico   │
│  (Búsqueda) │
└──────┬──────┘
       │ Lee: numeroRegistro
       │ Agrega: operador, económico, gastos
       ▼
┌─────────────┐
│ Facturación │
│  (Búsqueda) │
└──────┬──────┘
       │ Lee: numeroRegistro
       │ Agrega: factura, importes, pagos
       ▼
┌─────────────┐
│  Completo   │
└─────────────┘
```

**Implementación**:

```javascript
// En tráfico.html
async function fillTraficoFromLogistica(registroId) {
  // 1. Buscar datos de logística
  const persistence = new DataPersistence();
  const logisticaData = persistence.getLogisticaData(registroId);
  
  if (logisticaData) {
    // 2. Llenar campos del formulario de tráfico
    document.getElementById('cliente').value = logisticaData.cliente;
    document.getElementById('origen').value = logisticaData.origen;
    document.getElementById('destino').value = logisticaData.destino;
    // ... otros campos
  }
}
```

---

## 🎯 Patrones de Código Comunes

### 1. Patrón de Inicialización Asíncrona

**Problema**: Scripts que dependen de Firebase deben esperar a que esté listo.

**Solución**:

```javascript
// Patrón: Espera de Firebase
async function initModule() {
  // Esperar a que Firebase esté listo
  if (!window.firebaseDb) {
    await new Promise(resolve => {
      if (window.firebaseReady) {
        resolve();
      } else {
        window.addEventListener('firebaseReady', resolve, { once: true });
      }
    });
  }
  
  // Esperar a que repositorios estén listos
  if (window.__firebaseReposReady) {
    await window.__firebaseReposReady;
  }
  
  // Ahora podemos usar los repositorios
  const repo = window.firebaseRepos.logistica;
}
```

### 2. Patrón de Fallback (localStorage → Firebase)

**Problema**: El sistema debe funcionar incluso si Firebase no está disponible.

**Solución**:

```javascript
// Patrón: Fallback a localStorage
async function saveData(id, data) {
  try {
    // Intentar guardar en Firebase
    if (window.firebaseRepos?.logistica) {
      await window.firebaseRepos.logistica.saveRegistro(id, data);
      return true;
    }
  } catch (error) {
    console.warn('Firebase no disponible, usando localStorage');
  }
  
  // Fallback a localStorage
  const persistence = new DataPersistence();
  return persistence.saveLogisticaData(id, data);
}
```

### 3. Patrón de Cache de Escrituras

**Problema**: Evitar escrituras duplicadas a Firebase.

**Solución**:

```javascript
// En firebase-repo-base.js
async save(id, data) {
  // Verificar cache de escrituras
  if (window.FirebaseWriteCache) {
    if (!window.FirebaseWriteCache.shouldWrite(`${this.collectionName}/${id}`, data)) {
      return true; // Ya está actualizado
    }
  }
  
  // Guardar en Firebase
  await this.saveToFirebase(id, data);
  
  // Marcar en cache
  if (window.FirebaseWriteCache) {
    window.FirebaseWriteCache.markWritten(`${this.collectionName}/${id}`, data);
  }
}
```

### 4. Patrón de Circuit Breaker

**Problema**: Evitar intentos repetidos cuando la cuota de Firebase está excedida.

**Solución**:

```javascript
// En firebase-repo-base.js
async save(id, data) {
  // Verificar circuit breaker
  if (!window.FirebaseQuotaManager.canRetry()) {
    console.warn('Circuit breaker activo, guardando solo en localStorage');
    return this.saveToLocalStorage(id, data);
  }
  
  try {
    await this.saveToFirebase(id, data);
  } catch (error) {
    // Verificar si es error de cuota
    if (window.FirebaseQuotaManager.checkQuotaExceeded(error)) {
      // Activar circuit breaker
      return this.saveToLocalStorage(id, data);
    }
    throw error;
  }
}
```

### 5. Patrón de Suscripción en Tiempo Real

**Problema**: Mantener la UI actualizada cuando hay cambios en Firebase.

**Solución**:

```javascript
// Patrón: Suscripción en tiempo real
async function subscribeToChanges() {
  const repo = window.firebaseRepos.logistica;
  
  // Suscribirse a cambios
  const unsubscribe = await repo.subscribe((documents) => {
    // Actualizar UI con nuevos datos
    updateTable(documents);
  });
  
  // Guardar función de desuscripción
  window.ERPState.setSubscription('logistica', unsubscribe);
}

// Limpiar suscripción al salir
window.addEventListener('beforeunload', () => {
  const unsubscribe = window.ERPState.getSubscription('logistica');
  if (unsubscribe) {
    unsubscribe();
  }
});
```

### 6. Patrón de Estado Global

**Problema**: Compartir estado entre diferentes partes de la aplicación.

**Solución**:

```javascript
// En main.js
window.ERPState = {
  // Cachés
  getCache: function(key) {
    return state.cache[key] || null;
  },
  
  setCache: function(key, value) {
    state.cache[key] = value;
  },
  
  // Estados de carga
  isLoading: function(key) {
    return state.loading[key] || false;
  },
  
  setLoading: function(key, value) {
    state.loading[key] = value;
  }
};

// Uso
window.ERPState.setCache('operadores', operadoresList);
const operadores = window.ERPState.getCache('operadores');
```

### 7. Patrón de Validación de Formularios

**Problema**: Validar formularios antes de guardar.

**Solución**:

```javascript
// Patrón: Validación de formularios
form.addEventListener('submit', async function(event) {
  event.preventDefault();
  
  // Validar HTML5
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }
  
  // Validación personalizada
  const registroId = document.getElementById('numeroRegistro').value;
  if (!registroId || registroId.trim() === '') {
    showNotification('El número de registro es requerido', 'error');
    return;
  }
  
  // Guardar datos
  await saveData(registroId, collectFormData());
});
```

### 8. Patrón de Notificaciones

**Problema**: Mostrar mensajes al usuario de forma consistente.

**Solución**:

```javascript
// Patrón: Notificaciones
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
  notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
  notification.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remover después de 5 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

// Uso
showNotification('Datos guardados correctamente', 'success');
showNotification('Error al guardar datos', 'error');
```

### 9. Patrón de Búsqueda y Llenado

**Problema**: Buscar datos y llenar formularios automáticamente.

**Solución**:

```javascript
// Patrón: Búsqueda y llenado
async function searchAndFillData(registroId) {
  // 1. Buscar en localStorage
  const persistence = new DataPersistence();
  let data = persistence.getLogisticaData(registroId);
  
  // 2. Si no está, buscar en Firebase
  if (!data && window.firebaseRepos?.logistica) {
    const repo = window.firebaseRepos.logistica;
    data = await repo.getRegistro(registroId);
    
    if (data) {
      // Guardar en localStorage para próxima vez
      persistence.saveLogisticaData(registroId, data);
    }
  }
  
  // 3. Llenar formulario
  if (data) {
    fillFormWithData(data);
    showNotification('Datos cargados correctamente', 'success');
  } else {
    showNotification('No se encontraron datos para este registro', 'warning');
  }
}

function fillFormWithData(data) {
  Object.keys(data).forEach(key => {
    const input = document.getElementById(key);
    if (input) {
      input.value = data[key] || '';
    }
  });
}
```

### 10. Patrón de Numeración Única

**Problema**: Generar números de registro únicos.

**Solución**:

```javascript
// Patrón: Numeración única
async function generateUniqueNumber() {
  const currentYear = new Date().getFullYear();
  const yearSuffix = currentYear.toString().slice(-2); // 25 para 2025
  
  // Obtener siguiente número desde Firebase o localStorage
  let nextNumber = 1;
  
  if (window.firebaseDb && window.fs) {
    // Buscar máximo en Firebase
    const collections = ['logistica', 'trafico', 'facturacion'];
    let maxNumber = 0;
    
    for (const collectionName of collections) {
      const snapshot = await window.fs.getDocs(
        window.fs.collection(window.firebaseDb, collectionName)
      );
      
      snapshot.docs.forEach(doc => {
        const numReg = doc.data().numeroRegistro;
        if (numReg && numReg.startsWith(yearSuffix)) {
          const num = parseInt(numReg.slice(2)) || 0;
          if (num > maxNumber) maxNumber = num;
        }
      });
    }
    
    nextNumber = maxNumber + 1;
  } else {
    // Fallback a localStorage
    nextNumber = window.getNextYearNumber();
  }
  
  // Formatear: 25XXXXX
  return `${yearSuffix}${String(nextNumber).padStart(5, '0')}`;
}
```

---

## 🏛️ Arquitectura del Sistema

### 📐 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (HTML/JS)                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Logística   │  │   Tráfico    │  │ Facturación  │ │
│  │   (HTML)     │  │   (HTML)     │  │   (HTML)     │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                  │                  │         │
│         └──────────────────┼──────────────────┘         │
│                            │                            │
│                   ┌────────▼────────┐                   │
│                   │  DataPersistence │                  │
│                   │  (localStorage)  │                  │
│                   └────────┬─────────┘                   │
│                            │                            │
│                   ┌────────▼────────┐                   │
│                   │  Firebase Repos  │                  │
│                   │   (FirebaseRepo  │                  │
│                   │      Base)       │                  │
│                   └────────┬─────────┘                   │
│                            │                            │
└────────────────────────────┼────────────────────────────┘
                             │
                             ▼
                   ┌─────────────────┐
                   │   Firebase      │
                   │   (Firestore)   │
                   └─────────────────┘
```

### 🔧 Componentes Principales

#### 1. **Capa de Presentación (HTML)**
- Formularios de entrada
- Tablas de visualización
- Navegación y menús

#### 2. **Capa de Lógica (JavaScript)**
- Validación de formularios
- Manejo de eventos
- Lógica de negocio

#### 3. **Capa de Persistencia**
- **DataPersistence**: Caché local (localStorage)
- **FirebaseRepoBase**: Acceso a Firestore
- **Repositorios Específicos**: Lógica por módulo

#### 4. **Capa de Servicios**
- Firebase (Firestore, Auth)
- Sistema de notificaciones
- Sistema de errores

### 🔄 Flujo de Comunicación

```
Usuario → Formulario → Validación → DataPersistence → FirebaseRepo → Firestore
                                                              ↓
                                                         localStorage (fallback)
```

### 📦 Estructura de Carpetas

```
Proyecto ERP/
├── assets/
│   ├── scripts/
│   │   ├── firebase-init.js          # Inicialización Firebase
│   │   ├── firebase-repo-base.js     # Clase base repositorios
│   │   ├── firebase-repos.js         # Repositorios específicos
│   │   ├── data-persistence.js       # Persistencia local
│   │   ├── main.js                    # Lógica principal
│   │   ├── integration.js             # Integración entre módulos
│   │   └── [módulo]-[funcionalidad].js # Scripts específicos
│   ├── styles/                        # Estilos SCSS
│   └── images/                        # Imágenes
├── docs/                              # Documentación
├── [módulo].html                      # Páginas HTML
└── package.json                       # Dependencias
```

---

## 📝 Convenciones de Código

### 📋 Nomenclatura

- **Clases**: PascalCase (`FirebaseRepoBase`, `DataPersistence`)
- **Funciones**: camelCase (`saveLogisticaData`, `searchAndFillData`)
- **Variables**: camelCase (`registroId`, `formData`)
- **Constantes**: UPPER_SNAKE_CASE (`FIREBASE_CONFIG`, `STORAGE_KEY`)
- **Archivos**: kebab-case (`firebase-repo-base.js`, `data-persistence.js`)

### 📝 Comentarios

```javascript
/**
 * Guarda datos de logística en Firebase y localStorage
 * @param {string} registroId - ID único del registro
 * @param {Object} data - Datos del registro
 * @returns {Promise<boolean>} - true si se guardó correctamente
 */
async function saveLogisticaData(registroId, data) {
  // Implementación
}
```

### 🔍 Logging

```javascript
// ✅ Información general
console.log('✅ Datos guardados correctamente');

// ⚠️ Advertencias
console.warn('⚠️ Firebase no disponible, usando localStorage');

// ❌ Errores
console.error('❌ Error al guardar datos:', error);

// 🔍 Debug (solo en desarrollo)
if (window.DEBUG) {
  console.log('🔍 Debug info:', data);
}
```

---

## 🚀 Mejores Prácticas

### ✅ Hacer

1. **Siempre validar formularios** antes de guardar
2. **Usar async/await** para operaciones asíncronas
3. **Manejar errores** con try/catch
4. **Usar fallback** a localStorage si Firebase falla
5. **Limpiar suscripciones** al salir de la página
6. **Documentar funciones** complejas
7. **Usar el sistema de notificaciones** para feedback al usuario

### ❌ Evitar

1. **No usar callbacks** anidados (usar async/await)
2. **No guardar datos sensibles** en localStorage sin encriptar
3. **No hacer escrituras duplicadas** a Firebase
4. **No olvidar limpiar** event listeners y suscripciones
5. **No hardcodear valores** (usar constantes)
6. **No ignorar errores** (siempre manejar)

---

## 🔗 Referencias

- [Documentación de Firebase](https://firebase.google.com/docs)
- [Guía de Diagnóstico](./GUIA_DIAGNOSTICO.md)
- [Solución de Orden de Scripts](./SOLUCION_ORDEN_SCRIPTS.md)
- [Sistema de Manejo de Errores](./SISTEMA_MANEJO_ERRORES.md)

---

**Última actualización**: Enero 2025  
**Versión**: 1.0.0

