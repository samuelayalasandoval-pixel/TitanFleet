# ✅ Solución: Generación Múltiple de Números de Registro

**Problema:** El número de registro se generaba múltiples veces, causando que el contador se incrementara incorrectamente (2500002 → 2500040).

---

## 🔧 Soluciones Aplicadas

### 1. ✅ **Flag Global `__numeroRegistroGenerado`**

Agregada flag global para evitar múltiples generaciones en la misma sesión:

```javascript
window.__numeroRegistroGenerado = false;
```

### 2. ✅ **Verificación en `generateUniqueNumber()`**

Ahora verifica:
- Si el campo ya tiene un número válido → NO genera
- Si ya se generó en esta sesión → NO genera
- Solo genera si el campo está vacío y no se ha generado antes

### 3. ✅ **Eliminación de Llamadas Redundantes**

Eliminadas/reducidas llamadas desde:
- ✅ `logistica/page-init.js` - Simplificado
- ✅ `logistica/init-helpers.js` - Eliminada generación duplicada
- ✅ `facturacion/page-init.js` - Eliminadas múltiples llamadas
- ✅ `facturacion/search-fill-data.js` - Eliminada generación
- ✅ `trafico/page-init.js` - Eliminada inicialización duplicada
- ✅ `main.js` - Condicionada solo para páginas que lo necesitan

### 4. ✅ **Verificación en `initializeRegistrationSystem()`**

Ahora verifica si el campo ya tiene un número válido antes de generar:

```javascript
const currentValue = numeroRegistroInput.value ? numeroRegistroInput.value.trim() : '';
if (currentValue && currentValue !== '-' && /^25\d{5}$/.test(currentValue)) {
    console.log(`✅ Campo ya tiene número válido (${currentValue}), omitiendo generación`);
    return; // Salir, ya tiene un número válido
}
```

---

## 📋 Cambios por Archivo

### `assets/scripts/main.js`
- ✅ Flag global `__numeroRegistroGenerado`
- ✅ Verificación de campo con valor válido antes de generar
- ✅ Condición en DOMContentLoaded para solo inicializar en páginas necesarias
- ✅ Marcar flag después de generar número

### `assets/scripts/logistica/page-init.js`
- ✅ Eliminada lógica de reintentos múltiples
- ✅ Solo verifica si necesita inicializar
- ✅ No llama a `generateUniqueNumber()` directamente

### `assets/scripts/logistica/init-helpers.js`
- ✅ Eliminada generación de número
- ✅ Solo inicializa sistema si es necesario

### `assets/scripts/facturacion/page-init.js`
- ✅ Eliminadas múltiples llamadas a `initializeRegistrationSystem()`
- ✅ Solo verifica estado, no regenera

### `assets/scripts/facturacion/search-fill-data.js`
- ✅ Eliminada generación de número después de limpiar

### `assets/scripts/trafico/page-init.js`
- ✅ Eliminada inicialización duplicada
- ✅ Solo verifica estado

---

## ✅ Resultado Esperado

**Antes:**
- Se generaba 2500002 correctamente
- Luego se regeneraba → 2500040 (incorrecto)
- Múltiples llamadas incrementaban el contador

**Después:**
- Se genera 2500002 UNA SOLA VEZ
- No se regenera si el campo ya tiene valor
- El contador solo se incrementa cuando realmente se necesita un nuevo número

---

## 🎯 Flujo Simplificado

1. **Al cargar página de logística:**
   - `main.js` → `initializeRegistrationSystem()`
   - Verifica si campo está vacío
   - Si está vacío → llama `generateUniqueNumber()` UNA VEZ
   - Marca `__numeroRegistroGenerado = true`
   - Otros scripts verifican la flag y NO regeneran

2. **Otros scripts:**
   - Verifican si ya se generó (`__numeroRegistroGenerado`)
   - Verifican si el campo tiene valor válido
   - Si alguna condición se cumple → NO generan

---

**Solución aplicada:** ${new Date().toISOString()}

