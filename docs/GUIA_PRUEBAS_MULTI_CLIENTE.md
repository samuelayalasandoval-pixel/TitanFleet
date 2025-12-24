# 🔄 Guía de Pruebas Multi-Cliente - Sin Necesidad de Dos Computadoras

## 🎯 Objetivo

Esta guía te muestra cómo probar la sincronización en tiempo real del ERP **sin necesidad de usar dos computadoras físicas**.

---

## 🚀 Método 1: Página de Pruebas Multi-Cliente (Recomendado)

### Paso 1: Abrir la herramienta
1. Abre el archivo `test-sincronizacion-multi-cliente.html` en tu navegador
2. Espera a que se carguen los scripts de Firebase

### Paso 2: Agregar clientes
1. Haz clic en **"➕ Agregar Cliente"**
2. Repite para agregar 2-3 clientes (simulan diferentes computadoras)
3. Cada cliente se conectará automáticamente a Firebase

### Paso 3: Probar sincronización
1. **Selecciona el módulo** que quieres probar (CXP, Inventario, etc.)
2. En el **Cliente 1**, haz clic en **"Crear Factura"** (o la acción correspondiente)
3. **Observa** cómo los otros clientes se actualizan automáticamente
4. Verifica el **tiempo de sincronización** en las estadísticas

### Paso 4: Verificar resultados
- ✅ Todos los clientes deberían mostrar los mismos datos
- ✅ El tiempo de sincronización debería ser < 5 segundos
- ✅ La tasa de éxito debería ser 100%

---

## 🌐 Método 2: Múltiples Ventanas del Navegador

### Opción A: Ventana Normal + Ventana Incógnito

1. **Abre la primera ventana:**
   - Abre `CXP.html` en tu navegador normal

2. **Abre la segunda ventana:**
   - Presiona `Ctrl + Shift + N` (Chrome) o `Ctrl + Shift + P` (Firefox)
   - Abre `CXP.html` en la ventana incógnito

3. **Prueba la sincronización:**
   - En la ventana normal: Crea una factura
   - En la ventana incógnito: Espera 5-10 segundos y verifica que aparece

### Opción B: Múltiples Perfiles de Navegador

1. **Crea un perfil adicional:**
   - Chrome: `chrome://settings/manageProfile`
   - Firefox: `about:profiles`

2. **Abre cada perfil en una ventana:**
   - Perfil 1: `CXP.html`
   - Perfil 2: `CXP.html`

3. **Prueba la sincronización** igual que en la Opción A

---

## 💻 Método 3: Múltiples Navegadores

Si tienes varios navegadores instalados:

1. **Chrome:** Abre `CXP.html`
2. **Firefox:** Abre `CXP.html`
3. **Edge:** Abre `CXP.html`

Cada navegador actúa como una "computadora" diferente.

---

## 🛠️ Método 4: Script de Consola (Avanzado)

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Simular múltiples clientes desde la consola
async function simularMultiCliente() {
    console.log('🔄 Iniciando simulación multi-cliente...');
    
    // Cliente 1: Crear factura
    if (window.facturasCXP) {
        const factura1 = {
            id: Date.now(),
            proveedor: 'Proveedor Test 1',
            monto: 1000,
            fecha: new Date().toISOString(),
            tipo: 'factura'
        };
        window.facturasCXP.push(factura1);
        await window.saveCXPData();
        console.log('✅ Cliente 1: Factura creada');
    }
    
    // Esperar y verificar
    setTimeout(async () => {
        const facturas = await window.firebaseRepos.cxp.getAllFacturas();
        console.log('📊 Facturas en Firebase:', facturas.length);
        console.log('✅ Sincronización verificada');
    }, 5000);
}

// Ejecutar
simularMultiCliente();
```

---

## 📊 Método 5: Herramientas de Desarrollo

### Usar DevTools para Simular Múltiples Dispositivos

1. **Abre DevTools** (F12)
2. **Activa el modo dispositivo** (Ctrl + Shift + M)
3. **Selecciona diferentes dispositivos:**
   - Desktop
   - Tablet
   - Mobile

4. **Abre la misma página en cada "dispositivo"** y prueba la sincronización

---

## ✅ Checklist de Pruebas Multi-Cliente

### Prueba Básica
- [ ] Crear dato en Cliente 1
- [ ] Verificar que aparece en Cliente 2 (< 10 segundos)
- [ ] Verificar que los datos son idénticos

### Prueba de Actualización
- [ ] Modificar dato en Cliente 1
- [ ] Verificar que se actualiza en Cliente 2
- [ ] Verificar que no hay duplicados

### Prueba de Eliminación
- [ ] Eliminar dato en Cliente 1
- [ ] Verificar que desaparece en Cliente 2
- [ ] Verificar que no queda en localStorage

### Prueba de Concurrencia
- [ ] Crear datos simultáneamente en Cliente 1 y Cliente 2
- [ ] Verificar que ambos aparecen en ambos clientes
- [ ] Verificar que no hay conflictos

### Prueba de Desconexión/Reconexión
- [ ] Desconectar Cliente 2 (cerrar ventana)
- [ ] Crear datos en Cliente 1
- [ ] Reconectar Cliente 2 (abrir ventana)
- [ ] Verificar que los datos se sincronizan al reconectar

---

## 🎯 Escenarios de Prueba Específicos

### Escenario 1: Factura en CXP
```
Cliente 1: Crear factura de $5,000
Cliente 2: Debe ver la factura automáticamente
Cliente 1: Crear solicitud de pago
Cliente 2: Debe ver la solicitud en la pestaña correspondiente
```

### Escenario 2: Inventario
```
Cliente 1: Agregar entrada de 10 unidades
Cliente 2: Debe ver stock de 10 unidades
Cliente 1: Registrar salida de 3 unidades desde mantenimiento
Cliente 2: Debe ver stock de 7 unidades
```

### Escenario 3: Múltiples Operaciones
```
Cliente 1: Crear 5 facturas rápidamente
Cliente 2: Debe ver las 5 facturas
Cliente 1: Eliminar 2 facturas
Cliente 2: Debe ver solo 3 facturas
```

---

## 🐛 Solución de Problemas

### Problema: Los datos no se sincronizan
**Solución:**
1. Verifica que ambos clientes tienen el mismo `tenantId`
2. Verifica la consola por errores de Firebase
3. Verifica la conexión a internet

### Problema: Sincronización lenta (> 10 segundos)
**Solución:**
1. Verifica la velocidad de internet
2. Verifica que Firebase no esté en modo offline
3. Revisa los logs de Firebase en la consola

### Problema: Datos duplicados
**Solución:**
1. Verifica que el listener no esté creando duplicados
2. Limpia localStorage y recarga
3. Verifica que los IDs sean únicos

---

## 📈 Métricas a Observar

- **Tiempo de sincronización:** Debe ser < 5 segundos
- **Tasa de éxito:** Debe ser 100%
- **Consistencia de datos:** Ambos clientes deben tener los mismos datos
- **Sin duplicados:** No debe haber registros duplicados

---

## 💡 Consejos

1. **Usa la página de pruebas multi-cliente** para pruebas rápidas
2. **Usa múltiples ventanas** para pruebas más realistas
3. **Prueba en diferentes navegadores** para verificar compatibilidad
4. **Documenta los tiempos** de sincronización para identificar problemas
5. **Prueba con diferentes volúmenes** de datos (pocos vs muchos)

---

## 🎬 Ejemplo de Flujo Completo

1. **Abrir herramienta:** `test-sincronizacion-multi-cliente.html`
2. **Agregar 2 clientes:** Cliente 1 y Cliente 2
3. **Seleccionar módulo:** CXP
4. **Cliente 1:** Crear factura de $10,000
5. **Observar:** Cliente 2 se actualiza automáticamente
6. **Verificar:** Ambos clientes muestran la misma factura
7. **Cliente 2:** Crear solicitud de pago
8. **Observar:** Cliente 1 se actualiza automáticamente
9. **Verificar:** Ambos clientes muestran la misma solicitud
10. **Revisar estadísticas:** Tiempo de sincronización, tasa de éxito

---

**¡Ahora puedes probar la sincronización sin necesidad de dos computadoras físicas!** 🎉


