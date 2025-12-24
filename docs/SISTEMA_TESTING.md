# 🧪 Sistema de Testing y Validación - TitanFleet ERP

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Tests Unitarios](#tests-unitarios)
3. [Tests de Integración](#tests-de-integración)
4. [Validaciones de Formularios](#validaciones-de-formularios)
5. [Ejecutar Tests](#ejecutar-tests)
6. [Mejores Prácticas](#mejores-prácticas)

---

## 🎯 Introducción

El sistema de testing de TitanFleet ERP incluye:

- **Tests Unitarios**: Prueban funciones individuales y validaciones
- **Tests de Integración**: Prueban flujos completos entre módulos
- **Validaciones de Formularios**: Validaciones estrictas y reutilizables
- **Test Suite Completo**: Ejecuta todas las pruebas del sistema

### 📁 Estructura de Archivos

```
assets/scripts/
├── tests/
│   ├── unit-tests.js          # Tests unitarios
│   └── integration-tests.js    # Tests de integración
├── form-validations.js         # Módulo de validaciones
└── test-suite.js              # Suite completa de tests

tests.html                      # Página para ejecutar tests
```

---

## 🔬 Tests Unitarios

### Ubicación
`assets/scripts/tests/unit-tests.js`

### Funciones Probadas

#### 1. DataPersistence
- ✅ Inicialización
- ✅ Guardar datos de logística
- ✅ Obtener datos inexistentes
- ✅ getAllDataByRegistro

#### 2. FirebaseRepoBase
- ✅ Clase disponible
- ✅ Crear instancia
- ✅ Métodos disponibles (save, get, getAll, delete, subscribe)

#### 3. Validaciones
- ✅ Número de registro (formato: 25XXXXX)
- ✅ RFC (formato: 12-13 caracteres)
- ✅ Email
- ✅ Montos (no negativos)

#### 4. Numeración Única
- ✅ Función generateUniqueNumber disponible
- ✅ Formato de número válido
- ✅ getNextYearNumber

### Ejecutar Tests Unitarios

**Desde la consola del navegador:**
```javascript
await window.unitTests.ejecutarTodos()
```

**Desde tests.html:**
1. Abre `tests.html` en el navegador
2. Haz clic en "Ejecutar Tests Unitarios"

### Ejemplo de Resultado

```
🧪 INICIANDO TESTS UNITARIOS
============================================================
🧪 Tests Unitarios: DataPersistence
✅ [DataPersistence] Inicialización: DataPersistence inicializado correctamente
✅ [DataPersistence] Guardar Logística: Datos guardados y recuperados correctamente
✅ [DataPersistence] Obtener Inexistente: Retorna null para IDs inexistentes
✅ [DataPersistence] getAllDataByRegistro: Recupera todos los datos del registro
...
📊 RESUMEN DE TESTS UNITARIOS
Total: 12
✅ Exitosos: 10
❌ Fallidos: 0
⚠️ Advertencias: 2
📈 Tasa de éxito: 83%
```

---

## 🔗 Tests de Integración

### Ubicación
`assets/scripts/tests/integration-tests.js`

### Flujos Probados

#### 1. Flujo Completo: Logística → Tráfico → Facturación
- ✅ Paso 1: Guardar en Logística
- ✅ Paso 2: Leer desde Tráfico
- ✅ Paso 3: Leer desde Facturación
- ✅ Paso 4: Integridad de datos

#### 2. Sincronización Firebase
- ✅ Guardar en Firebase
- ✅ Sincronización con localStorage
- ✅ Fallback a localStorage

#### 3. Búsqueda y Llenado Automático
- ✅ Búsqueda por número de registro
- ✅ getAllDataByRegistro
- ✅ Búsqueda de registro inexistente

### Ejecutar Tests de Integración

**Desde la consola del navegador:**
```javascript
await window.integrationTests.ejecutarTodos()
```

**Desde tests.html:**
1. Abre `tests.html` en el navegador
2. Haz clic en "Ejecutar Tests de Integración"

### Ejemplo de Resultado

```
🧪 INICIANDO TESTS DE INTEGRACIÓN
============================================================
🧪 Test de Integración: Flujo Completo (Logística → Tráfico → Facturación)
✅ [Flujo Completo] Paso 1: Guardar Logística: Datos de logística guardados correctamente
✅ [Flujo Completo] Paso 2: Leer desde Tráfico: Datos de logística accesibles desde tráfico
✅ [Flujo Completo] Paso 3: Leer desde Facturación: Datos completos accesibles desde facturación
✅ [Flujo Completo] Paso 4: Integridad de datos: Datos consistentes en todos los módulos
...
📊 RESUMEN DE TESTS DE INTEGRACIÓN
Total: 9
✅ Exitosos: 8
❌ Fallidos: 0
⚠️ Advertencias: 1
📈 Tasa de éxito: 89%
```

---

## ✅ Validaciones de Formularios

### Ubicación
`assets/scripts/form-validations.js`

### Validaciones Disponibles

#### 1. Número de Registro
```javascript
window.FormValidations.validarNumeroRegistro('2500001')
// Retorna: { valido: true, mensaje: '' }
```

#### 2. RFC
```javascript
window.FormValidations.validarRFC('ABC123456DEF')
// Retorna: { valido: true, mensaje: '' }
```

#### 3. Email
```javascript
window.FormValidations.validarEmail('test@example.com')
// Retorna: { valido: true, mensaje: '' }
```

#### 4. Monto
```javascript
window.FormValidations.validarMonto('100')
// Retorna: { valido: true, mensaje: '' }
```

#### 5. Teléfono
```javascript
window.FormValidations.validarTelefono('5551234567')
// Retorna: { valido: true, mensaje: '' }
```

#### 6. Campo Requerido
```javascript
window.FormValidations.validarRequerido('valor', 'Nombre del Campo')
// Retorna: { valido: true, mensaje: '' }
```

#### 7. Fecha
```javascript
window.FormValidations.validarFecha('2025-01-15')
// Retorna: { valido: true, mensaje: '' }
```

#### 8. Longitud Mínima/Máxima
```javascript
window.FormValidations.validarLongitudMinima('texto', 5, 'Campo')
window.FormValidations.validarLongitudMaxima('texto', 100, 'Campo')
```

### Aplicar Validación a un Campo

```javascript
const input = document.getElementById('numeroRegistro');
const resultado = window.FormValidations.aplicarValidacion(input, 'numeroRegistro');

if (resultado.valido) {
    // Campo válido
} else {
    // Mostrar error: resultado.mensaje
}
```

### Validar Formulario Completo

```javascript
const form = document.getElementById('miFormulario');
const reglas = {
    numeroRegistro: { tipo: 'numeroRegistro' },
    rfc: { tipo: 'rfc' },
    email: { tipo: 'email' },
    monto: { tipo: 'monto' }
};

const resultado = window.FormValidations.validarFormulario(form, reglas);

if (resultado.valido) {
    // Formulario válido, proceder con el envío
} else {
    // Mostrar errores: resultado.errores
    resultado.errores.forEach(error => {
        console.log(`${error.campo}: ${error.mensaje}`);
    });
}
```

### Integración con Formularios HTML

```html
<form id="miFormulario" class="needs-validation" novalidate>
    <div class="mb-3">
        <label for="numeroRegistro" class="form-label">Número de Registro</label>
        <input type="text" class="form-control" id="numeroRegistro" required>
        <div class="invalid-feedback"></div>
    </div>
    
    <div class="mb-3">
        <label for="rfc" class="form-label">RFC</label>
        <input type="text" class="form-control" id="rfc" required>
        <div class="invalid-feedback"></div>
    </div>
    
    <button type="submit" class="btn btn-primary">Guardar</button>
</form>

<script>
document.getElementById('miFormulario').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const reglas = {
        numeroRegistro: { tipo: 'numeroRegistro' },
        rfc: { tipo: 'rfc' }
    };
    
    const resultado = window.FormValidations.validarFormulario(this, reglas);
    
    if (resultado.valido) {
        // Enviar formulario
        console.log('Formulario válido');
    } else {
        // Mostrar errores
        resultado.errores.forEach(error => {
            console.error(`${error.campo}: ${error.mensaje}`);
        });
    }
});
</script>
```

---

## 🚀 Ejecutar Tests

### Opción 1: Página de Tests (Recomendado)

1. Abre `tests.html` en el navegador
2. Haz clic en el botón correspondiente:
   - **Ejecutar Tests Unitarios**
   - **Ejecutar Tests de Integración**
   - **Ejecutar Todos los Tests**

### Opción 2: Consola del Navegador

Abre cualquier página del ERP y ejecuta en la consola:

```javascript
// Tests unitarios
await window.unitTests.ejecutarTodos()

// Tests de integración
await window.integrationTests.ejecutarTodos()

// Test suite completo
await window.testSuite.ejecutarTodas()
```

### Opción 3: Test Suite Completo

El test suite completo ejecuta:
- Tests de Firebase
- Tests de CXP
- Tests de Inventario
- Tests de Sincronización
- Tests de Persistencia
- Tests Unitarios (si están disponibles)
- Tests de Integración (si están disponibles)

```javascript
await window.testSuite.ejecutarTodas()
```

---

## 📊 Interpretación de Resultados

### Tasa de Éxito

- **≥ 80%**: ✅ Excelente - Sistema funcionando correctamente
- **50-79%**: ⚠️ Advertencia - Algunos problemas menores
- **< 50%**: ❌ Crítico - Problemas significativos

### Estados de Prueba

- **✅ Pass**: Prueba exitosa
- **❌ Fail**: Prueba fallida - requiere atención
- **⚠️ Warning**: Advertencia - puede funcionar pero con limitaciones

### Reportes

Los tests generan reportes en formato JSON que pueden exportarse:

```javascript
// Generar reporte
const reporte = window.unitTests.generarReporte();

// Exportar reporte (desde test-suite)
window.testSuite.exportarReporte();
```

---

## 🎯 Mejores Prácticas

### ✅ Hacer

1. **Ejecutar tests regularmente** antes de hacer deploy
2. **Revisar tests fallidos** inmediatamente
3. **Agregar nuevos tests** cuando se agregan nuevas funcionalidades
4. **Usar validaciones** en todos los formularios
5. **Limpiar datos de prueba** después de ejecutar tests

### ❌ Evitar

1. **No ignorar warnings** - pueden indicar problemas futuros
2. **No modificar tests** para que pasen - arreglar el código
3. **No ejecutar tests en producción** con datos reales
4. **No olvidar limpiar** datos de prueba

---

## 🔧 Solución de Problemas

### Problema: Tests no se ejecutan

**Solución:**
1. Verifica que todos los scripts estén cargados
2. Abre la consola (F12) y verifica errores
3. Asegúrate de que Firebase esté inicializado

### Problema: Tests fallan en Firebase

**Solución:**
1. Verifica conexión a internet
2. Verifica que Firebase esté configurado correctamente
3. Revisa la consola por errores de Firebase

### Problema: Validaciones no funcionan

**Solución:**
1. Verifica que `form-validations.js` esté cargado
2. Verifica que `window.FormValidations` esté disponible
3. Revisa la consola por errores de JavaScript

---

## 📚 Referencias

- [Documentación Técnica](./DOCUMENTACION_TECNICA.md)
- [Guía de Pruebas Completa](./GUIA_PRUEBAS_COMPLETA.md)
- [Guía de Pruebas Multi-Cliente](./GUIA_PRUEBAS_MULTI_CLIENTE.md)

---

**Última actualización**: Enero 2025  
**Versión**: 1.0.0

