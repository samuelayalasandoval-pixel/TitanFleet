# Guía de Prueba - Flujo Completo de Integración

## 🎯 Objetivo
Demostrar el flujo completo donde la información fluye desde Logística → Tráfico → Facturación usando el número de registro como clave.

## 📋 Pasos para Probar el Flujo Completo

### Paso 1: Cargar Datos de Ejemplo
1. Ve a cualquier página (Logística, Tráfico, o Facturación)
2. Haz clic en el botón **"Cargar Datos Ejemplo"**
3. Verás una notificación: "Datos de ejemplo cargados. Registros: 2025-09-0007, 2025-09-0008"

### Paso 2: Probar en Tráfico
1. Ve a **Tráfico** (`trafico.html`)
2. En el campo "Número de Registro", ingresa: `2025-09-0007`
3. Haz clic en **"Buscar"**
4. **Resultado esperado**: 
   - ✅ Notificación: "Datos de logística cargados para 2025-09-0007"
   - Los campos de "Datos de Logística" se llenan automáticamente:
     - Cliente: "Transportes del Norte S.A."
     - Ciudad Origen: "Ciudad de México"
     - Ciudad Destino: "Monterrey"
     - Referencia del Cliente: "TN-2025-001"
     - Tipo de Servicio: "Transporte Terrestre"
     - Embalaje Especial: "No"

### Paso 3: Probar en Facturación
1. Ve a **Facturación** (`facturacion.html`)
2. En el campo "Número de Registro", ingresa: `2025-09-0007`
3. Haz clic en **"Buscar"**
4. **Resultado esperado**:
   - ✅ Notificación: "Datos completos cargados para 2025-09-0007 (Logística + Tráfico)"
   - Los campos de "Información de Logística y Tráfico" se llenan automáticamente:

#### Datos de Logística:
- Cliente: "Transportes del Norte S.A."
- Referencia Cliente: "TN-2025-001"
- Tipo de Servicio: "Transporte Terrestre"
- Lugar de Origen: "Ciudad de México"
- Lugar de Destino: "Monterrey"
- Embalaje Especial: "No"

#### Datos de Tráfico:
- Económico Tractocamión: "ECO-007"
- Placas: "ABC-789"
- Permiso SCT: "SCT-007"
- Operador Principal: "Carlos Mendoza"
- Licencia: "LIC-007"
- Operador Secundario: "Ana García"

### Paso 4: Probar con Registro Solo de Logística
1. En **Facturación**, ingresa: `2025-09-0008`
2. Haz clic en **"Buscar"**
3. **Resultado esperado**:
   - ✅ Notificación: "Datos de logística cargados para 2025-09-0008"
   - Solo se llenan los datos de logística (no hay datos de tráfico para este registro)

## 🔧 Herramientas de Debug

### Botón "Debug Datos"
- Muestra en la consola del navegador (F12) todos los datos disponibles
- Útil para verificar qué información está almacenada

### Botón "Estado Sistema"
- Muestra el estado actual del sistema de numeración
- Útil para verificar números activos

## 📊 Datos de Ejemplo Disponibles

| Número de Registro | Cliente | Origen | Destino | Datos de Tráfico |
|-------------------|---------|--------|---------|------------------|
| 2025-09-0007 | Transportes del Norte S.A. | Ciudad de México | Monterrey | ✅ Disponible |
| 2025-09-0008 | Distribuidora Central | Guadalajara | Tijuana | ❌ Solo Logística |

## 🚨 Solución de Problemas

### Si no aparecen datos:
1. Verifica que hayas hecho clic en "Cargar Datos Ejemplo"
2. Usa el botón "Debug Datos" para verificar qué hay en localStorage
3. Verifica que estés usando los números de registro correctos

### Si aparecen errores:
1. Abre la consola del navegador (F12)
2. Busca mensajes de error en rojo
3. Usa el botón "Debug Datos" para ver el estado actual

## ✅ Verificación del Flujo

El flujo correcto debe ser:
1. **Logística** crea el registro inicial (número automático)
2. **Tráfico** busca el número → ve datos de logística + llena su parte
3. **Facturación** busca el número → ve datos completos de logística + tráfico

Cada paso debe mostrar notificaciones apropiadas y llenar los campos correspondientes automáticamente.
