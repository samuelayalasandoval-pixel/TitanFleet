# 🧪 Guía Completa de Pruebas - TitanFleet ERP

## 📋 Índice
1. [Estrategias de Prueba](#estrategias-de-prueba)
2. [Pruebas Manuales](#pruebas-manuales)
3. [Pruebas Automatizadas](#pruebas-automatizadas)
4. [Pruebas de Integración](#pruebas-de-integración)
5. [Pruebas de Sincronización](#pruebas-de-sincronización)
6. [Checklist de Pruebas](#checklist-de-pruebas)
7. [Herramientas de Diagnóstico](#herramientas-de-diagnóstico)

---

## 🎯 Estrategias de Prueba

### 1. **Pruebas Unitarias**
- Probar funciones individuales
- Validar cálculos y transformaciones de datos
- Verificar validaciones de formularios

### 2. **Pruebas de Integración**
- Probar comunicación entre módulos
- Verificar sincronización Firebase
- Validar flujos completos de trabajo

### 3. **Pruebas de Regresión**
- Verificar que cambios nuevos no rompan funcionalidades existentes
- Probar escenarios que funcionaban anteriormente

### 4. **Pruebas de Rendimiento**
- Verificar tiempos de carga
- Probar con grandes volúmenes de datos
- Validar sincronización en tiempo real

---

## 🔍 Pruebas Manuales

### **Módulo: Cuentas por Pagar (CXP)**

#### ✅ Prueba 1: Crear Factura
1. Ir a `CXP.html`
2. Clic en "+ Nueva Factura"
3. Llenar todos los campos obligatorios
4. Guardar factura
5. **Verificar:**
   - ✅ Factura aparece en la tabla
   - ✅ Factura se guarda en localStorage
   - ✅ Factura se sincroniza con Firebase
   - ✅ Factura aparece en otra computadora

#### ✅ Prueba 2: Crear Solicitud de Pago
1. Seleccionar una o más facturas
2. Clic en "Solicitar Pago"
3. Llenar formulario de solicitud
4. Guardar
5. **Verificar:**
   - ✅ Solicitud aparece en pestaña "Solicitudes de Pago"
   - ✅ Solicitud se guarda en Firebase
   - ✅ Solicitud aparece en otra computadora
   - ✅ Estado de facturas cambia a "solicitud"

#### ✅ Prueba 3: Sincronización Multi-Computadora
1. En Computadora 1: Crear factura
2. En Computadora 2: Esperar 5-10 segundos
3. **Verificar:**
   - ✅ Factura aparece automáticamente en Computadora 2
   - ✅ No hay duplicados
   - ✅ Datos son idénticos

#### ✅ Prueba 4: Eliminar Datos
1. En Computadora 1: Clic en "Borrar Todo (Excepto Configuración)"
2. En Computadora 2: Esperar 10-15 segundos
3. **Verificar:**
   - ✅ Datos se borran en Computadora 1
   - ✅ Datos se borran en Computadora 2
   - ✅ Configuración se mantiene

---

### **Módulo: Inventario**

#### ✅ Prueba 5: Entrada de Refacciones
1. Ir a `inventario.html`
2. Sección "Refacciones"
3. Agregar entrada de 10 bujías (código: BUJ-65433)
4. Guardar
5. **Verificar:**
   - ✅ Stock muestra 10 unidades
   - ✅ Movimiento aparece en historial
   - ✅ Datos se guardan en Firebase

#### ✅ Prueba 6: Salida desde Mantenimiento
1. En `mantenimiento.html`: Registrar salida de 2 bujías (BUJ-65433)
2. Ir a `inventario.html`
3. **Verificar:**
   - ✅ Stock muestra 8 unidades (10 - 2)
   - ✅ Movimiento de salida aparece en historial
   - ✅ Cálculo es correcto

#### ✅ Prueba 7: Sincronización de Inventario
1. Computadora 1: Agregar entrada de 5 unidades
2. Computadora 2: Esperar y verificar
3. **Verificar:**
   - ✅ Stock se actualiza en ambas computadoras
   - ✅ Movimientos aparecen en ambas

---

### **Módulo: Mantenimiento**

#### ✅ Prueba 8: Registrar Mantenimiento
1. Ir a `mantenimiento.html`
2. Llenar formulario de mantenimiento
3. Agregar refacciones usadas
4. Guardar
5. **Verificar:**
   - ✅ Mantenimiento se guarda
   - ✅ Refacciones se descuentan del inventario
   - ✅ Datos se sincronizan

---

### **Módulo: Configuración**

#### ✅ Prueba 9: Agregar Proveedor
1. Ir a `configuracion.html`
2. Sección "Proveedores"
3. Agregar nuevo proveedor
4. Guardar
5. **Verificar:**
   - ✅ Proveedor aparece en lista
   - ✅ Proveedor disponible en CXP
   - ✅ Datos persisten después de recargar

---

## 🤖 Pruebas Automatizadas

### Script de Pruebas Básico

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Función para probar guardado de datos
async function testGuardadoCXP() {
    console.log('🧪 Iniciando prueba de guardado CXP...');
    
    // Simular creación de factura
    const facturaTest = {
        id: Date.now(),
        proveedor: 'Proveedor Test',
        monto: 1000,
        fecha: new Date().toISOString(),
        tipo: 'factura'
    };
    
    // Verificar localStorage
    const facturasLocal = JSON.parse(localStorage.getItem('erp_cxp_facturas') || '[]');
    console.log('📦 Facturas en localStorage:', facturasLocal.length);
    
    // Verificar Firebase
    if (window.firebaseRepos?.cxp) {
        const facturasFirebase = await window.firebaseRepos.cxp.getAllFacturas();
        console.log('☁️ Facturas en Firebase:', facturasFirebase?.length || 0);
    }
    
    console.log('✅ Prueba completada');
}

// Ejecutar prueba
testGuardadoCXP();
```

---

## 🔄 Pruebas de Sincronización

### Prueba de Sincronización en Tiempo Real

1. **Abrir dos ventanas del navegador:**
   - Ventana 1: `CXP.html`
   - Ventana 2: `CXP.html` (en modo incógnito o diferente navegador)

2. **En Ventana 1:**
   ```javascript
   // Crear factura de prueba
   const facturaTest = {
       id: Date.now(),
       proveedor: 'Test Sync',
       monto: 500,
       fecha: new Date().toISOString(),
       tipo: 'factura',
       tenantId: 'demo_tenant'
   };
   
   // Agregar al array
   if (window.facturasCXP) {
       window.facturasCXP.push(facturaTest);
       await window.saveCXPData();
   }
   ```

3. **En Ventana 2:**
   - Esperar 5-10 segundos
   - Verificar que la factura aparece automáticamente

4. **Verificar en consola:**
   ```javascript
   // En ambas ventanas
   console.log('Facturas:', window.facturasCXP?.length);
   console.log('Solicitudes:', window.solicitudesPago?.length);
   ```

---

## ✅ Checklist de Pruebas

### **Funcionalidades Críticas**

- [ ] **Crear factura en CXP**
  - [ ] Se guarda en localStorage
  - [ ] Se guarda en Firebase
  - [ ] Aparece en otra computadora

- [ ] **Crear solicitud de pago**
  - [ ] Se guarda correctamente
  - [ ] Aparece en pestaña "Solicitudes de Pago"
  - [ ] Se sincroniza entre computadoras

- [ ] **Entrada de inventario**
  - [ ] Stock se actualiza correctamente
  - [ ] Movimiento se registra

- [ ] **Salida desde mantenimiento**
  - [ ] Stock se descuenta correctamente
  - [ ] Movimiento se registra

- [ ] **Sincronización en tiempo real**
  - [ ] Cambios aparecen en < 10 segundos
  - [ ] No hay duplicados
  - [ ] Datos son consistentes

- [ ] **Borrar datos**
  - [ ] Se borran en todas las computadoras
  - [ ] Configuración se mantiene

### **Validaciones de Formularios**

- [ ] Campos obligatorios muestran error si están vacíos
- [ ] Validación de montos (no negativos)
- [ ] Validación de fechas
- [ ] Validación de códigos únicos

### **Manejo de Errores**

- [ ] Mensajes de error claros
- [ ] Sistema no se rompe con datos inválidos
- [ ] Recuperación después de errores de red

---

## 🛠️ Herramientas de Diagnóstico

### 1. **Consola del Navegador (F12)**

**Verificar estado de Firebase:**
```javascript
// Verificar repositorios
console.log('Repositorios:', window.firebaseRepos);

// Verificar tenantId
console.log('TenantId:', window.firebaseRepos?.cxp?.tenantId);

// Verificar conexión
console.log('DB:', window.firebaseRepos?.cxp?.db);
```

**Verificar datos locales:**
```javascript
// Ver todas las claves de localStorage
Object.keys(localStorage).filter(k => k.startsWith('erp_')).forEach(k => {
    console.log(k, JSON.parse(localStorage.getItem(k)));
});
```

**Limpiar datos de prueba:**
```javascript
// Limpiar solo datos de CXP
localStorage.removeItem('erp_cxp_facturas');
localStorage.removeItem('erp_cxp_solicitudes');
location.reload();
```

### 2. **Monitoreo de Firebase**

1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Seleccionar proyecto `titanfleet-60931`
3. Ir a Firestore Database
4. Verificar colecciones:
   - `cxp` - Facturas y solicitudes
   - `inventario` - Stock y movimientos
   - `mantenimiento` - Registros de mantenimiento

### 3. **Network Tab (F12 > Network)**

- Verificar llamadas a Firebase
- Verificar errores de red
- Verificar tiempos de respuesta

### 4. **Application Tab (F12 > Application)**

- Verificar localStorage
- Verificar sessionStorage
- Verificar cookies

---

## 📊 Reporte de Pruebas

### Plantilla de Reporte

```markdown
## Reporte de Pruebas - [Fecha]

### Pruebas Realizadas
- [ ] Prueba 1: Crear Factura
- [ ] Prueba 2: Crear Solicitud de Pago
- [ ] Prueba 3: Sincronización Multi-Computadora
- [ ] Prueba 4: Eliminar Datos
- [ ] Prueba 5: Entrada de Refacciones
- [ ] Prueba 6: Salida desde Mantenimiento
- [ ] Prueba 7: Sincronización de Inventario
- [ ] Prueba 8: Registrar Mantenimiento
- [ ] Prueba 9: Agregar Proveedor

### Errores Encontrados
1. [Descripción del error]
   - Módulo: [CXP/Inventario/etc]
   - Pasos para reproducir: [1, 2, 3...]
   - Mensaje de error: [Error exacto]
   - Captura de pantalla: [Si aplica]

### Observaciones
- [Notas adicionales]

### Navegador y Versión
- Navegador: [Chrome/Firefox/Edge]
- Versión: [Versión]
- OS: [Windows/Mac/Linux]
```

---

## 🚨 Errores Comunes y Soluciones

### Error: "Factura no aparece en otra computadora"
**Solución:**
1. Verificar que Firebase está conectado
2. Verificar tenantId es el mismo en ambas computadoras
3. Verificar consola por errores de red

### Error: "Solicitud no se guarda"
**Solución:**
1. Verificar que el listener no está interfiriendo
2. Verificar que `saveCXPData()` se ejecuta
3. Verificar consola por errores

### Error: "Stock no se actualiza"
**Solución:**
1. Verificar que movimientos se guardan en Firebase
2. Verificar que `recalcularStockDesdeMovimientos()` se ejecuta
3. Verificar orden de movimientos (fecha)

---

## 📝 Notas Finales

- **Siempre prueba en múltiples navegadores**
- **Prueba con datos reales y de prueba**
- **Documenta todos los errores encontrados**
- **Verifica sincronización después de cada cambio importante**
- **Mantén backups antes de pruebas destructivas**

---

**Última actualización:** [Fecha]
**Versión del sistema:** [Versión]


