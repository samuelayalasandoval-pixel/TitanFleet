# Plan de Migración: Demo → Cliente Normal

## Objetivo
Convertir el sistema demo de un usuario especial hardcodeado (`demo@titanfleet.com` con `tenantId: 'demo_tenant'`) a un cliente normal con licencia anual, eliminando toda la lógica especial del demo.

---

## Estado Actual

### Usuario Demo Actual
- **Email:** `demo@titanfleet.com`
- **Contraseña:** `demo123`
- **tenantId:** `demo_tenant` (hardcodeado)
- **Licencia:** `TITAN-DEMO-0000-0000` (especial)

### Archivos con Lógica Especial del Demo

1. **firebase-init.js**
   - `ensureDemoUser()` - Crea/mantiene el usuario demo
   - `onAuthStateChanged()` - Detecta `demo@titanfleet.com` y fuerza `demo_tenant`

2. **firebase-repo-base.js**
   - `init()` - Detecta usuario demo y fuerza `demo_tenant`
   - `_doInit()` - Lógica especial para demo user
   - `getTenantId()` - Prioridad especial para demo user
   - `getAll()` - Filtrado especial para demo user
   - `getAllFromLocalStorage()` - Filtrado especial para demo user

3. **configuracion-firebase.js**
   - Filtros especiales para `isDemoUser` en múltiples funciones

4. **trafico/registros-loader.js**
   - Filtrado especial para demo user

5. **registration-number-binding.js**
   - Lógica especial para `demo_tenant`

6. **main.js**
   - Posible lógica especial para demo

7. **auto-login-demo.js**
   - Auto-login basado en licencia demo

8. **demo-starter.js**
   - Inicia demo con licencia especial `TITAN-DEMO-0000-0000`

9. **demo-data-loader.js**
   - Carga datos demo (ya deshabilitado)

---

## Pasos de Migración

### FASE 1: Preparación (Crear Cliente Demo Normal)

#### Paso 1.1: Crear Licencia Anual para Demo
- Generar una licencia anual normal usando `license-admin.js`
- Ejemplo: `TF2512A-DEMO-XXXX-XXXX` (o similar)
- Tipo: `annual`
- Guardar el `tenantId` generado (será único, no `demo_tenant`)

#### Paso 1.2: Crear Usuario Demo Normal
- Crear usuario en Firebase Auth con email y contraseña (puede ser `demo@titanfleet.com` o otro)
- Crear documento en `users/{uid}` con:
  - El `tenantId` de la licencia (no `demo_tenant`)
  - Permisos completos: `['*']` o todos los módulos
- Crear documento en `configuracion/usuarios` con:
  - El mismo `tenantId`
  - Permisos completos
  - Nombre: "Demo" o "Usuario Demo"

#### Paso 1.3: Eliminar Datos con `demo_tenant`
- **NO crear datos demo** - Los datos se crearán manualmente después para verificar que todo funciona
- **SÍ eliminar datos antiguos** asociados a `demo_tenant`:
  - Buscar en todas las colecciones documentos con `tenantId: 'demo_tenant'` o `tenantId: 'demo'`
  - Opciones:
    1. **Eliminar físicamente** (si no se necesitan)
    2. **Marcar como eliminados** (`deleted: true`)
    3. **Migrar a otro tenantId** (si se quieren conservar)
- Colecciones a revisar:
  - `logistica`
  - `trafico`
  - `facturacion`
  - `configuracion/usuarios` (usuarios con `demo_tenant`)
  - `configuracion/economicos`
  - `configuracion/clientes`
  - `configuracion/proveedores`
  - `configuracion/bancos`
  - `configuracion/estancias`
  - `configuracion/almacenes`
  - `system/active_registration_number_demo_tenant` (si existe)
  - Y cualquier otra colección que pueda tener datos con `demo_tenant`

---

### FASE 2: Eliminación de Lógica Especial

#### Paso 2.1: Eliminar `ensureDemoUser()` de firebase-init.js
- Comentar o eliminar la función completa
- Eliminar todas las llamadas a `window.ensureDemoUser`

#### Paso 2.2: Limpiar `onAuthStateChanged()` en firebase-init.js
- Eliminar todas las verificaciones de `isDemoUser` o `demo@titanfleet.com`
- Eliminar la lógica que fuerza `demo_tenant` para demo user
- La función debe tratar al demo como cualquier otro usuario

#### ✅ Paso 2.3: Limpiar `firebase-repo-base.js` ✅ COMPLETADO
- Eliminar verificaciones de `isDemoUser` en:
  - `init()`
  - `_doInit()`
  - `getTenantId()`
  - `getAll()` - Eliminar filtrado especial, todos los usuarios filtran igual
  - `getAllFromLocalStorage()` - Eliminar filtrado especial

#### ✅ Paso 2.4: Limpiar `configuracion-firebase.js` ✅ COMPLETADO
- Eliminar verificaciones de `isDemoUser` en:
  - `loadUsuariosFromFirebase()`
  - `loadOperadoresFromFirebase()`
  - `loadClientesFromFirebase()`
  - `loadProveedoresFromFirebase()`
  - `loadEstanciasFromFirebase()`
  - `loadAlmacenesFromFirebase()`
  - `loadCuentasBancariasFromFirebase()`
- Todos deben usar el mismo filtrado basado en `tenantId` actual

#### ✅ Paso 2.5: Limpiar `trafico/registros-loader.js` ✅ COMPLETADO
- Eliminadas verificaciones de `isDemoUser`
- Eliminadas exclusiones de 'demo_tenant' en la obtención del tenantId
- Todos los usuarios ahora filtran igual: solo documentos con su tenantId exacto

#### ✅ Paso 2.6: Limpiar `registration-number-binding.js` ✅ COMPLETADO
- Creada función auxiliar `obtenerTenantId()` local para evitar duplicación
- Eliminadas todas las exclusiones de 'demo_tenant' y 'demo' en la obtención del tenantId
- Simplificadas las funciones `_getFromFirebase()`, `_saveToFirebase()`, y `_setupFirebaseListener()` para usar la función auxiliar
- Todos los usuarios ahora usan la misma lógica de obtención del tenantId sin excepciones

#### ✅ Paso 2.7: Eliminar o Modificar Archivos Demo ✅ COMPLETADO
- **auto-login-demo.js**: 
  - Actualizado para usar licencia `TF2512A-KVX3DGZT-0L68B1TY`
  - Actualizado para usar tenantId `tenant_tf2512akvx3dgzt0l68b1ty`
  - Actualizado para usar email `titanfleetdemo@titanfleet.com` y password `TitanDemo123!`
  - Eliminadas referencias a licencia especial `TITAN-DEMO-0000-0000` y `demo_tenant`
- **demo-starter.js**: 
  - Actualizado para usar licencia `TF2512A-KVX3DGZT-0L68B1TY`
  - Actualizado para usar tenantId `tenant_tf2512akvx3dgzt0l68b1ty`
  - Actualizado para usar email `titanfleetdemo@titanfleet.com` y password `TitanDemo123!`
  - Eliminadas todas las referencias a `demo_tenant` y licencia especial
  - Actualizado tipo de licencia a `anual` (cliente normal)
- **demo-data-loader.js**: Ya está deshabilitado, verificar que no se use en ningún lado

---

### ✅ FASE 3: Modificar Acceso a Demo ✅ COMPLETADA

#### ✅ Paso 3.1: Modificar Botón "Demo" en `index.html` y `public/index.html` ✅ COMPLETADO
- Actualizado: `<a href="#" class="btn-demo-custom" onclick="window.iniciarDemo(); return false;">Demo</a>`
- El botón ahora llama directamente a `iniciarDemo()` en lugar de redirigir a demo.html

#### ✅ Paso 3.2: Crear Función `iniciarDemo()` Nueva ✅ COMPLETADO
- Ubicación: `assets/scripts/index-activation-flow.js`
- Funcionalidad implementada:
  1. Limpia sesión anterior
  2. Activa licencia demo en localStorage (`TF2512A-KVX3DGZT-0L68B1TY`)
  3. Hace login con credenciales del cliente demo (`titanfleetdemo@titanfleet.com` / `TitanDemo123!`)
  4. Redirige a `pages/menu.html`
- Usa `window.firebaseSignIn()` existente con el tenantId correcto

#### ✅ Paso 3.3: Actualizar `demo.html` ✅ COMPLETADO
- Actualizados todos los botones en `pages/demo.html` para usar `onclick="window.iniciarDemo(); return false;"`
- Agregado script `index-activation-flow.js` a demo.html para que la función esté disponible
- Los botones ahora hacen login directo sin pasar por la página demo.html

---

### ✅ FASE 4: Variables de Configuración ✅ COMPLETADA

#### ✅ Paso 4.1: Definir Credenciales Demo en un Solo Lugar ✅ COMPLETADO
- Creado archivo `assets/scripts/demo-config.js` con:
  - `licenseKey`: `'TF2512A-KVX3DGZT-0L68B1TY'`
  - `tenantId`: `'tenant_tf2512akvx3dgzt0l68b1ty'`
  - `email`: `'titanfleetdemo@titanfleet.com'`
  - `password`: `'TitanDemo123!'`
  - `licenseType`: `'anual'`
- Agregado `demo-config.js` a:
  - `index.html`
  - `public/index.html`
  - `pages/demo.html`
- Actualizados archivos para usar `window.DEMO_CONFIG`:
  - `index-activation-flow.js` (función `iniciarDemo()`)
  - `demo/demo-starter.js` (función `startDemo()` e `iniciarDemoDespuesDeAviso()`)
  - `index/auto-login-demo.js` (función `checkAndAutoLoginDemo()`)

#### Paso 4.2: Eliminar Referencias a `demo_tenant` como Fallback
- Buscar todas las referencias a `'demo_tenant'` como tenantId hardcodeado usado como fallback
- Estas referencias pueden estar en funciones que obtienen tenantId y usan 'demo_tenant' como último recurso
- Reemplazar por lógica dinámica basada en el usuario autenticado cuando sea posible
- Nota: Algunos fallbacks a 'demo_tenant' pueden ser necesarios para casos edge, pero deben ser mínimos

---

### FASE 5: Verificación y Pruebas

#### Paso 5.1: Probar Login Demo
- Clic en botón "Demo"
- Verificar que inicia sesión correctamente
- Verificar que carga con el `tenantId` correcto (del cliente demo normal, no `demo_tenant`)

#### Paso 5.2: Probar Filtrado de Datos
- Verificar que solo muestra datos del cliente demo
- Verificar que no hay referencias a `demo_tenant` en la consola

#### Paso 5.3: Probar Otros Usuarios
- Verificar que usuarios normales siguen funcionando
- Verificar que nuevos clientes funcionan correctamente

#### Paso 5.4: Limpiar localStorage Antiguo
- Eliminar referencias a `demo_tenant` en localStorage
- Eliminar licencia `TITAN-DEMO-0000-0000` si existe

---

## Archivos a Modificar (Resumen)

1. ✅ `firebase-init.js` - Eliminar `ensureDemoUser()` y lógica especial en `onAuthStateChanged`
2. ✅ `firebase-repo-base.js` - Eliminar todas las verificaciones de `isDemoUser`
3. ✅ `configuracion-firebase.js` - Eliminar verificaciones de `isDemoUser`
4. ✅ `trafico/registros-loader.js` - Eliminar verificaciones de `isDemoUser`
5. ✅ `registration-number-binding.js` - Eliminar lógica especial para `demo_tenant`
6. ✅ `index.html` y `public/index.html` - Modificar botón Demo
7. ✅ `index-activation-flow.js` o nuevo archivo - Crear función `iniciarDemo()`
8. ✅ `demo-starter.js` - Modificar o eliminar
9. ✅ `auto-login-demo.js` - Modificar o eliminar
10. ✅ `demo-config.js` - Crear nuevo archivo con config (opcional)

---

## Consideraciones Importantes

1. **Eliminación de Datos Antiguos:** Los datos con `tenantId: 'demo_tenant'` deben eliminarse o marcarse como eliminados. Los nuevos datos se crearán manualmente desde el nuevo cliente demo para verificar que todo funciona correctamente.

2. **Backwards Compatibility:** Si decides mantener `demo@titanfleet.com` como email, asegúrate de que el usuario exista en Firebase Auth y tenga el nuevo `tenantId` asociado.

3. **Pruebas en Producción:** Después de la migración, prueba exhaustivamente que:
   - El demo funciona
   - Los clientes normales siguen funcionando
   - Los nuevos clientes pueden activarse correctamente

4. **Limpieza de Código:** Después de la migración, busca en todo el código referencias a:
   - `demo@titanfleet.com`
   - `demo_tenant`
   - `isDemoUser`
   - `TITAN-DEMO-0000-0000`
   - Y elimínalas si ya no son necesarias

---

## Orden Recomendado de Ejecución

1. **Primero:** Crear el cliente demo normal (FASE 1)
2. **Segundo:** Modificar el botón Demo y función de login (FASE 3) - para que funcione con el nuevo cliente
3. **Tercero:** Eliminar lógica especial gradualmente (FASE 2) - probando después de cada cambio
4. **Cuarto:** Limpieza y verificación final (FASE 4 y 5)

