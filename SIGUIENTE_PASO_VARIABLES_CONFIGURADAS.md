# ✅ Variables Configuradas - Siguientes Pasos

**¡Perfecto! Ya tienes las 3 variables configuradas:**
- ✅ NODE_ENV
- ✅ PORT
- ✅ STRIPE_SECRET_KEY

Railway debería estar redesplegando automáticamente. Ahora sigue estos pasos:

---

## 📋 Paso 1: Verificar que el Backend Funciona (2 min)

### 1.1 Ver Logs

1. En Railway, ve a la pestaña **"Logs"** (junto a "Variables")
2. Deberías ver algo como:
   ```
   🚀 Servidor corriendo en http://localhost:3000
   ✅ STRIPE_SECRET_KEY configurada
   📝 Endpoints disponibles:
      POST /api/create-checkout-session
      GET  /api/verify-payment
   ```

Si ves estos mensajes, **¡el backend está funcionando!** ✅

### 1.2 Verificar Deployment

1. Ve a la pestaña **"Deployments"** o **"Activity"**
2. Deberías ver un deployment reciente con estado "Successful" ✅

---

## 📋 Paso 2: Obtener la URL del Backend (2 min)

### Opción A: Desde Settings

1. Ve a la pestaña **"Settings"**
2. Busca la sección **"Networking"** o **"Domains"**
3. Deberías ver una URL como:
   ```
   https://titanfleet-production.up.railway.app
   ```
4. **Copia esta URL** - la necesitarás para el frontend

### Opción B: Desde el Panel Principal

1. En la vista "Architecture", haz clic en el servicio "TitanFleet"
2. En la parte superior, puede aparecer la URL directamente
3. O busca un botón "Generate Domain" si no hay URL aún

**⚠️ IMPORTANTE:** Si no ves una URL, haz clic en **"Generate Domain"** para crear una.

---

## 📋 Paso 3: Probar el Backend (1 min)

Abre en tu navegador la URL que obtuviste + este endpoint:

```
https://tu-url-railway.app/api/verify-payment?session_id=test
```

**Resultado esperado:**
- Deberías recibir un JSON con un error (porque el session_id no existe)
- Pero esto confirma que el servidor está funcionando ✅

Si ves un error como `"session_id es requerido"` o similar, **¡perfecto!** El servidor responde.

---

## 📋 Paso 4: Obtener Publishable Key LIVE de Stripe (5 min)

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com)
2. **Asegúrate de estar en modo "Live"** (toggle en la parte superior, debe decir "Live" no "Test")
3. Ve a **Developers** > **API keys**
4. Copia la **Publishable key** (`pk_live_...`)
5. **Guárdala** - la necesitarás para el frontend

**⚠️ IMPORTANTE:** 
- Debe ser `pk_live_...` (no `pk_test_...`)
- Debe estar en modo "Live" en Stripe Dashboard

---

## 📋 Paso 5: Actualizar Frontend (5 min)

### 5.1 Abrir stripe-config.js

Abre el archivo: `assets/scripts/stripe-config.js`

### 5.2 Actualizar Configuración

Reemplaza el contenido con:

```javascript
window.STRIPE_CONFIG = {
  // Tu Publishable Key LIVE (pk_live_...)
  publishableKey: 'pk_live_TU_CLAVE_LIVE_AQUI', // ⚠️ REEMPLAZA
  
  // URL de tu backend en Railway
  backendUrl: 'https://tu-url-railway.app', // ⚠️ REEMPLAZA CON TU URL REAL
  
  currency: 'mxn',
  
  // Cambiar a 'live' para producción
  mode: 'live'  // ⚠️ CAMBIAR DE 'test' A 'live'
};
```

**⚠️ IMPORTANTE - Reemplaza:**
1. `pk_live_TU_CLAVE_LIVE_AQUI` → Tu Publishable Key LIVE real
2. `https://tu-url-railway.app` → Tu URL real de Railway
3. `mode: 'live'` → Debe ser 'live' (no 'test')

### 5.3 Guardar

Guarda el archivo.

---

## 📋 Paso 6: Verificar Configuración (2 min)

Ejecuta en la terminal (en la raíz del proyecto):

```bash
npm run verify:prod
```

Esto verificará que todo esté configurado correctamente.

**Si hay errores**, corrígelos antes de continuar.

---

## 📋 Paso 7: Deploy del Frontend (10 min)

### 7.1 Compilar

```bash
npm run build
```

### 7.2 Deploy a Firebase

```bash
firebase deploy --only hosting
```

O si prefieres el comando completo:

```bash
npm run deploy
```

### 7.3 Verificar

Abre la URL que Firebase te proporciona y verifica que todo funcione.

---

## 📋 Paso 8: Probar Flujo Completo (10 min)

### 8.1 Probar en Producción

1. Abre tu aplicación en producción (la URL de Firebase)
2. Ve a la página de pagos
3. Selecciona un plan
4. Completa el checkout con una **tarjeta de prueba de Stripe:**
   - **Tarjeta:** `4242 4242 4242 4242`
   - **Fecha:** Cualquier fecha futura (ej: 12/25)
   - **CVV:** Cualquier 3 dígitos (ej: 123)
   - **ZIP:** Cualquier código postal (ej: 12345)

### 8.2 Verificar

- ✅ El pago se procesa correctamente
- ✅ La licencia se genera
- ✅ El usuario es redirigido correctamente
- ✅ No hay errores en la consola (F12)

---

## ✅ Checklist de lo que Falta

- [ ] **Paso 1:** Verificar logs del backend
- [ ] **Paso 2:** Obtener URL del backend de Railway
- [ ] **Paso 3:** Probar endpoint del backend
- [ ] **Paso 4:** Obtener Publishable Key LIVE de Stripe
- [ ] **Paso 5:** Actualizar `stripe-config.js`
- [ ] **Paso 6:** Verificar con `npm run verify:prod`
- [ ] **Paso 7:** Deploy del frontend
- [ ] **Paso 8:** Probar flujo completo

---

## 🎯 Siguiente Acción Inmediata

**Ahora mismo, haz esto:**

1. **Ve a la pestaña "Logs"** en Railway y verifica que el servidor esté corriendo
2. **Obtén la URL del backend** (Settings > Networking o Generate Domain)
3. **Prueba el endpoint** en tu navegador para confirmar que funciona

Con estos 3 pasos, estarás listo para actualizar el frontend.

---

## 🐛 Si el Backend No Funciona

### Verificar Logs

1. Ve a "Logs" en Railway
2. Busca errores en rojo
3. Verifica que veas el mensaje "🚀 Servidor corriendo"

### Verificar Variables

1. Ve a "Variables"
2. Verifica que las 3 variables estén correctas:
   - `STRIPE_SECRET_KEY` debe empezar con `sk_live_...` o `sk_test_...`
   - `PORT` debe ser `3000`
   - `NODE_ENV` debe ser `production`

### Verificar Deployment

1. Ve a "Deployments"
2. Verifica que el último deployment sea "Successful"
3. Si falló, revisa los logs del deployment

---

**¿Necesitas ayuda con algún paso específico?** 🚀

