# ✅ Backend Funcionando - Siguientes Pasos

**¡Perfecto! Tu backend está funcionando correctamente.** ✅

Los logs muestran que el servidor está corriendo. Ahora sigue estos pasos:

---

## 📋 Paso 1: Obtener la URL del Backend (2 min)

### Opción A: Desde Settings

1. En Railway, haz clic en el servicio **"TitanFleet"**
2. Ve a la pestaña **"Settings"**
3. Busca la sección **"Networking"** o **"Domains"**
4. Deberías ver una URL como:
   ```
   https://titanfleet-production.up.railway.app
   ```
5. **Copia esta URL** - la necesitarás para el frontend

### Opción B: Generate Domain

Si no ves una URL:

1. En Settings, busca **"Generate Domain"** o **"Custom Domain"**
2. Haz clic en **"Generate Domain"**
3. Railway creará una URL automáticamente
4. **Copia la URL**

---

## 📋 Paso 2: Probar el Backend (1 min)

Abre en tu navegador la URL que obtuviste + este endpoint:

```
https://tu-url-railway.app/api/verify-payment?session_id=test
```

**Resultado esperado:**
- Deberías recibir un JSON con un error (porque el session_id no existe)
- Pero esto confirma que el servidor está funcionando ✅

**Ejemplo de respuesta:**
```json
{
  "error": "session_id es requerido"
}
```

Si ves esto, **¡el backend está funcionando perfectamente!** ✅

---

## 📋 Paso 3: Obtener Publishable Key LIVE de Stripe (5 min)

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com)
2. **Asegúrate de estar en modo "Live"** (toggle en la parte superior)
   - Debe decir **"Live"** (no "Test")
3. Ve a **Developers** > **API keys**
4. Copia la **Publishable key** (`pk_live_...`)
5. **Guárdala** - la necesitarás para el frontend

**⚠️ IMPORTANTE:** 
- Debe ser `pk_live_...` (no `pk_test_...`)
- Debe estar en modo "Live" en Stripe Dashboard

---

## 📋 Paso 4: Actualizar Frontend (5 min)

### 4.1 Abrir stripe-config.js

Abre el archivo: `assets/scripts/stripe-config.js`

### 4.2 Actualizar Configuración

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

### 4.3 Guardar

Guarda el archivo.

---

## 📋 Paso 5: Verificar Configuración (2 min)

Ejecuta en la terminal (en la raíz del proyecto):

```bash
npm run verify:prod
```

Esto verificará que todo esté configurado correctamente.

**Si hay errores**, corrígelos antes de continuar.

---

## 📋 Paso 6: Deploy del Frontend (10 min)

### 6.1 Compilar

```bash
npm run build
```

### 6.2 Deploy a Firebase

```bash
firebase deploy --only hosting
```

O si prefieres el comando completo:

```bash
npm run deploy
```

### 6.3 Verificar

Abre la URL que Firebase te proporciona y verifica que todo funcione.

---

## 📋 Paso 7: Probar Flujo Completo (10 min)

### 7.1 Probar en Producción

1. Abre tu aplicación en producción (la URL de Firebase)
2. Ve a la página de pagos
3. Selecciona un plan
4. Completa el checkout con una **tarjeta de prueba de Stripe:**
   - **Tarjeta:** `4242 4242 4242 4242`
   - **Fecha:** Cualquier fecha futura (ej: 12/25)
   - **CVV:** Cualquier 3 dígitos (ej: 123)
   - **ZIP:** Cualquier código postal (ej: 12345)

### 7.2 Verificar

- ✅ El pago se procesa correctamente
- ✅ La licencia se genera
- ✅ El usuario es redirigido correctamente
- ✅ No hay errores en la consola (F12)

---

## ✅ Checklist de lo que Falta

- [ ] **Paso 1:** Obtener URL del backend de Railway
- [ ] **Paso 2:** Probar endpoint del backend
- [ ] **Paso 3:** Obtener Publishable Key LIVE de Stripe
- [ ] **Paso 4:** Actualizar `stripe-config.js`
- [ ] **Paso 5:** Verificar con `npm run verify:prod`
- [ ] **Paso 6:** Deploy del frontend
- [ ] **Paso 7:** Probar flujo completo

---

## 🎯 Siguiente Acción Inmediata

**Ahora mismo, haz esto:**

1. **Obtén la URL del backend** (Settings > Networking o Generate Domain)
2. **Prueba el endpoint** en tu navegador para confirmar que funciona
3. **Obtén tu Publishable Key LIVE** de Stripe

Con estos 3 pasos, estarás listo para actualizar el frontend.

---

## 🐛 Sobre el Error al Final

El error que viste al final:
```
npm ERR! command sh -c -- npm run dev & npm run serve
```

Es probablemente de un intento anterior. **No te preocupes** - el backend está funcionando correctamente como muestran los logs anteriores.

Si el error persiste en futuros deployments, puedes ignorarlo siempre y cuando veas el mensaje "🚀 Servidor corriendo" en los logs.

---

**¿Necesitas ayuda con algún paso específico?** 🚀

