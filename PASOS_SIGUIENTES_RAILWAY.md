# 🎯 Pasos Siguientes - Railway (Ya Desplegado)

**Tu servicio "TitanFleet" está Online ✅**

Ahora necesitas completar la configuración:

---

## 📋 Paso 1: Obtener la URL del Backend (2 min)

1. En Railway, haz clic en el servicio **"TitanFleet"** (la tarjeta gris)
2. Se abrirá el panel del servicio
3. Ve a la pestaña **"Settings"** (Configuración)
4. Busca la sección **"Domains"** o **"Generate Domain"**
5. Railway te dará una URL como:
   ```
   https://titanfleet-production.up.railway.app
   ```
6. **Copia esta URL** - la necesitarás para el frontend

**O si ya tienes la URL visible:**
- Puede estar en la parte superior del servicio
- O en la pestaña "Settings" > "Networking"

---

## 📋 Paso 2: Configurar Variables de Entorno (5 min)

### 2.1 Ir a Variables

1. En el panel del servicio "TitanFleet"
2. Ve a la pestaña **"Variables"**
3. Haz clic en **"New Variable"** o **"Raw Editor"**

### 2.2 Agregar Variables

Agrega estas 3 variables:

#### Variable 1: STRIPE_SECRET_KEY
- **Nombre:** `STRIPE_SECRET_KEY`
- **Valor:** `sk_live_TU_CLAVE_LIVE_AQUI`
- **Descripción:** Clave secreta de Stripe (LIVE)

**Para obtener la clave:**
1. Ve a [Stripe Dashboard](https://dashboard.stripe.com)
2. Asegúrate de estar en modo **"Live"** (toggle en la parte superior)
3. Ve a **Developers** > **API keys**
4. Copia la **Secret key** (`sk_live_...`)

#### Variable 2: PORT
- **Nombre:** `PORT`
- **Valor:** `3000`
- **Descripción:** Puerto del servidor

#### Variable 3: NODE_ENV
- **Nombre:** `NODE_ENV`
- **Valor:** `production`
- **Descripción:** Entorno de ejecución

### 2.3 Guardar

Después de agregar las variables, Railway **redesplegará automáticamente** el servicio.

**Espera 1-2 minutos** hasta que veas "Deployment successful" de nuevo.

---

## 📋 Paso 3: Verificar que el Backend Funciona (2 min)

### 3.1 Ver Logs

1. En Railway, ve a la pestaña **"Logs"** del servicio
2. Deberías ver algo como:
   ```
   🚀 Servidor corriendo en http://localhost:3000
   ✅ STRIPE_SECRET_KEY configurada
   📝 Endpoints disponibles:
      POST /api/create-checkout-session
      GET  /api/verify-payment
   ```

### 3.2 Probar el Endpoint

Abre en tu navegador la URL de tu backend + `/api/verify-payment?session_id=test`:
```
https://tu-backend.up.railway.app/api/verify-payment?session_id=test
```

**Resultado esperado:**
- Deberías recibir un error JSON (porque el session_id no existe)
- Pero esto confirma que el servidor está funcionando ✅

Si ves un error de "session_id es requerido" o similar, **¡perfecto!** El servidor está funcionando.

---

## 📋 Paso 4: Obtener Publishable Key LIVE de Stripe (5 min)

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com)
2. Asegúrate de estar en modo **"Live"** (no "Test")
3. Ve a **Developers** > **API keys**
4. Copia la **Publishable key** (`pk_live_...`)
5. **Guárdala** - la necesitarás para el frontend

---

## 📋 Paso 5: Actualizar Frontend (5 min)

### 5.1 Abrir stripe-config.js

Abre el archivo: `assets/scripts/stripe-config.js`

### 5.2 Actualizar Configuración

Reemplaza el contenido con:

```javascript
window.STRIPE_CONFIG = {
  // Tu Publishable Key LIVE (pk_live_...)
  publishableKey: 'pk_live_TU_CLAVE_LIVE_AQUI',
  
  // URL de tu backend en Railway
  backendUrl: 'https://tu-backend.up.railway.app', // ⚠️ REEMPLAZA CON TU URL
  
  currency: 'mxn',
  
  // Cambiar a 'live' para producción
  mode: 'live'
};
```

**⚠️ IMPORTANTE:**
- Reemplaza `pk_live_TU_CLAVE_LIVE_AQUI` con tu Publishable Key LIVE real
- Reemplaza `https://tu-backend.up.railway.app` con la URL real de Railway

### 5.3 Guardar

Guarda el archivo.

---

## 📋 Paso 6: Verificar Configuración (2 min)

Ejecuta en la terminal:

```bash
npm run verify:prod
```

Esto verificará que todo esté configurado correctamente.

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

O si prefieres:

```bash
npm run deploy
```

### 7.3 Verificar

Abre la URL que Firebase te proporciona y verifica que todo funcione.

---

## 📋 Paso 8: Probar Flujo Completo (10 min)

### 8.1 Probar en Producción

1. Abre tu aplicación en producción
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
- ✅ No hay errores en la consola

---

## ✅ Checklist de lo que Falta

- [ ] **Paso 1:** Obtener URL del backend de Railway
- [ ] **Paso 2:** Configurar variables de entorno (STRIPE_SECRET_KEY, PORT, NODE_ENV)
- [ ] **Paso 3:** Verificar que el backend funciona
- [ ] **Paso 4:** Obtener Publishable Key LIVE de Stripe
- [ ] **Paso 5:** Actualizar `stripe-config.js` con claves LIVE y URL del backend
- [ ] **Paso 6:** Verificar configuración con `npm run verify:prod`
- [ ] **Paso 7:** Deploy del frontend a Firebase
- [ ] **Paso 8:** Probar flujo completo

---

## 🐛 Problemas Comunes

### "No veo la URL del backend"

**Solución:**
1. Haz clic en el servicio "TitanFleet"
2. Ve a "Settings" > "Networking"
3. O busca "Generate Domain" y haz clic

### "El backend no responde"

**Solución:**
1. Verifica que las variables de entorno estén configuradas
2. Revisa los logs en Railway (pestaña "Logs")
3. Asegúrate de que el deployment haya terminado

### "Error de CORS"

**Solución:**
- Esto puede pasar después. Si ocurre, edita `backend-example/server.js` y configura CORS con tu dominio.

---

## 🎯 Siguiente Acción Inmediata

**Ahora mismo, haz esto:**

1. **Obtén la URL del backend** (Paso 1)
2. **Configura las variables de entorno** (Paso 2)
3. **Obtén tu Publishable Key LIVE de Stripe** (Paso 4)

Con estos 3 pasos, estarás listo para actualizar el frontend.

---

**¿Necesitas ayuda con algún paso específico?** 🚀

