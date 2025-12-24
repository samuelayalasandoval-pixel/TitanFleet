# Guía de Prueba - Pestaña General en Configuración

## 📋 Pasos para Probar

### 1. Acceder a la Página de Configuración

1. Abre el sistema TitanFleet ERP
2. Inicia sesión (si es necesario)
3. Ve a **Configuración** desde el menú lateral
4. Deberías ver la pestaña **"General"** como la primera pestaña (con icono de información)

---

### 2. Probar el Sistema de Licencia

#### Opción A: Si NO tienes licencia activa

1. En la sección **"Licencia y Plan"**, verás un formulario para ingresar la licencia
2. Ingresa una licencia de prueba con el formato: `TF2512A-XXXXXXXX-XXXXXXXX`
   - Ejemplo válido: `TF2512A-ABCD1234-EFGH5678`
   - El formato debe ser: `TF` + año (2 dígitos) + mes (2 dígitos) + tipo (A/M/T) + guion + 8 caracteres + guion + 8 caracteres
3. Haz clic en **"Activar Licencia"**
4. Deberías ver:
   - ✅ Mensaje de éxito
   - La página se recarga automáticamente
   - Ahora se muestra la información de la licencia activa

#### Opción B: Si YA tienes licencia activa

1. Deberías ver directamente la información de tu licencia:
   - Clave de licencia
   - Plan contratado
   - Tipo (Anual/Mensual/Trimestral)
   - Estado: Activa
   - Fecha de activación
   - Fecha de expiración (si aplica)

---

### 3. Probar el Guardado de Datos del Cliente

1. En la sección **"Datos del Cliente"**, completa el formulario:
   - **Nombre Completo**: (requerido) - Ejemplo: "Juan Pérez"
   - **Email**: (requerido) - Ejemplo: "juan@empresa.com"
   - **Teléfono**: (opcional) - Ejemplo: "(55) 1234-5678"
   - **Empresa**: (opcional) - Ejemplo: "Mi Empresa S.A. de C.V."

2. Haz clic en **"Guardar Datos"**
3. Deberías ver:
   - ✅ El botón cambia temporalmente a "Guardado!" (verde)
   - Los datos se guardan en localStorage
   - Si Firebase está disponible, también se guarda allí

4. **Recargar datos:**
   - Haz clic en **"Recargar"**
   - Los datos deberían aparecer nuevamente en el formulario

5. **Verificar persistencia:**
   - Recarga la página (F5)
   - Los datos deberían cargarse automáticamente al abrir la pestaña

---

### 4. Probar el Contador de Registros

1. En la sección **"Estadísticas de Registros"**, deberías ver:
   - **Total de Registros**: Número total
   - Desglose por módulo:
     - **Logística**: Cantidad
     - **Tráfico**: Cantidad
     - **Facturación**: Cantidad

2. **Actualización automática:**
   - El contador se actualiza automáticamente cada 30 segundos
   - Observa los números cambiar si hay actividad

3. **Actualización manual:**
   - Haz clic en el botón **"Actualizar"**
   - Los números deberían refrescarse inmediatamente

4. **Verificar en consola:**
   - Abre la consola del navegador (F12)
   - Deberías ver mensajes como:
     ```
     📊 Actualizando contador de registros...
     📊 Registros de Logística: X
     📊 Registros de Tráfico: Y
     📊 Registros de Facturación: Z
     ✅ Contador actualizado - Total: X+Y+Z
     ```

---

### 5. Verificar Integración con Datos de Pago

Si realizaste un pago anteriormente:

1. El sistema intentará obtener el plan desde:
   - Datos de pago exitoso (`titanfleet_payment_success`)
   - Datos de pago pendiente (`titanfleet_payment_data`)
   - Solicitudes de transferencia (`titanfleet_solicitudes`)
   - Pagos con tarjeta (`titanfleet_pagos`)

2. El plan debería mostrarse automáticamente en la sección de licencia

---

## 🔍 Verificación en Consola del Navegador

Abre la consola (F12) y verifica estos mensajes:

### Al cargar la página:
```
📋 Cargando general-tab.js
🔧 Inicializando pestaña General...
✅ general-tab.js cargado
```

### Al activar licencia:
```
🔍 Verificando licencia...
✅ Licencia activada correctamente
```

### Al guardar datos del cliente:
```
✅ Datos del cliente guardados
✅ Datos del cliente guardados en Firebase (si está disponible)
```

### Al actualizar contador:
```
📊 Actualizando contador de registros...
📊 Registros de Logística: X
📊 Registros de Tráfico: Y
📊 Registros de Facturación: Z
✅ Contador actualizado - Total: X+Y+Z
```

---

## ⚠️ Solución de Problemas

### La pestaña "General" no aparece
- Verifica que el archivo `general-tab.js` esté cargado
- Revisa la consola por errores de JavaScript
- Asegúrate de que `license-manager.js` esté cargado antes

### La licencia no se activa
- Verifica el formato: debe ser exactamente `TF2512A-XXXXXXXX-XXXXXXXX`
- Revisa la consola por mensajes de error
- Asegúrate de que `license-manager.js` esté disponible

### Los datos del cliente no se guardan
- Verifica que los campos requeridos (Nombre y Email) estén completos
- Revisa la consola por errores
- Verifica que localStorage esté disponible (no en modo incógnito sin permisos)

### El contador muestra 0 o no se actualiza
- Verifica que los repositorios de Firebase estén inicializados
- Revisa la consola por errores de conexión
- Intenta hacer clic en "Actualizar" manualmente
- Verifica que haya registros en los módulos (Logística, Tráfico, Facturación)

---

## 📝 Datos de Prueba Sugeridos

### Licencia de Prueba:
```
TF2512A-ABCD1234-EFGH5678
```

### Datos del Cliente de Prueba:
- **Nombre**: Juan Pérez García
- **Email**: juan.perez@empresa.com
- **Teléfono**: (55) 1234-5678
- **Empresa**: Transportes Ejemplo S.A. de C.V.

---

## ✅ Checklist de Prueba

- [ ] La pestaña "General" aparece como primera pestaña
- [ ] Se puede ingresar y activar una licencia
- [ ] Se muestra la información de la licencia activa
- [ ] Se puede guardar datos del cliente
- [ ] Los datos del cliente persisten después de recargar
- [ ] El contador de registros se muestra correctamente
- [ ] El contador se actualiza automáticamente
- [ ] El botón "Actualizar" funciona manualmente
- [ ] No hay errores en la consola del navegador
- [ ] El plan se muestra correctamente (si hay datos de pago)

---

## 🎯 Resultado Esperado

Al finalizar las pruebas, deberías tener:
1. ✅ Una licencia activa (o ver el formulario de activación)
2. ✅ Datos del cliente guardados y visibles
3. ✅ Contador de registros funcionando y actualizándose
4. ✅ Plan contratado visible (si aplica)
5. ✅ Sin errores en la consola

---

¡Listo para probar! 🚀
